import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from "@playwright/test/reporter";

import type { Agg, ReporterOptions, RunKey } from "./types";
import { extractDimsFromTags } from "./tags";
import { toLineProtocol } from "./line-protocol";
import { getInfluxConfig, writeLines } from "./write";
import { makeRunId } from "./runId";

function keyToString(k: RunKey): string {
  return [
    `app=${k.app}`,
    `env=${k.env}`,
    `suite=${k.suite}`,
    k.domain ? `domain=${k.domain}` : "",
    k.journey ? `journey=${k.journey}` : "",
  ].filter(Boolean).join("|");
}

function nowMs(): number {
  return Date.now();
}

class InfluxReporter implements Reporter {
  private measurement: string;
  private strictTags: boolean;
  private includeGlobalAll: boolean;
  private precision: "ms" | "ns";
  private env: string;
  private runId: string = "";
  private enabled = true;
  private disabledReason: string | null = null;

  private startedAt = 0;
  private agg = new Map<string, { key: RunKey; agg: Agg }>();
  private warnings = new Set<string>();
  private errors = new Set<string>();

  constructor(opts: ReporterOptions = {}) {
    this.measurement = opts.measurement ?? "pw_run";
    this.strictTags = !!opts.strictTags;
    this.includeGlobalAll = opts.includeGlobalAll ?? true;
    this.precision = opts.precision ?? "ms";
    this.env = process.env.ENV ?? "unknown";
  }

  onBegin(_config: FullConfig, _suite: Suite) {
    this.startedAt = nowMs();
    this.runId = makeRunId();
    console.log(`[InfluxReporter] run_id=${this.runId}`);

    // Decline once: if influx config is missing, disable reporter entirely
    const cfg = getInfluxConfig();
    if (!cfg) {
      this.enabled = false;
      this.disabledReason = "Influx config missing (INFLUX_URL). Metrics disabled.";
      console.warn(`[InfluxReporter] ${this.disabledReason}`);
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!this.enabled) return;

    const project = test.parent.project();
    const app = project?.name ?? "unknown";

    // Tags from Playwright annotations (works with describe/test tag option)
    const rawTags = (test.tags ?? []).map(t => t.toString());

    const dims = extractDimsFromTags(rawTags, { strictTags: this.strictTags });
    dims.warnings.forEach(w => this.warnings.add(w));
    dims.errors.forEach(e => this.errors.add(e));

    const runKey: RunKey = {
      app,
      env: this.env,
      suite: dims.suite,
      domain: dims.domain,
      journey: dims.journey,
    };

    const k = keyToString(runKey);
    const existing = this.agg.get(k) ?? {
      key: runKey,
      agg: {
        tests_total: 0,
        tests_passed: 0,
        tests_failed: 0,
        tests_skipped: 0,
        duration_ms_sum: 0,
      },
    };

    existing.agg.tests_total += 1;
    existing.agg.duration_ms_sum += result.duration;

    if (result.status === "passed") existing.agg.tests_passed += 1;
    else if (result.status === "skipped") existing.agg.tests_skipped += 1;
    else existing.agg.tests_failed += 1; // failed | timedOut | interrupted

    this.agg.set(k, existing);
  }

  async onEnd(result: FullResult) {
    if (!this.enabled) {
      // One-line summary to avoid confusion.
      console.log("[InfluxReporter] Metrics disabled. Nothing to push.");
      return;
    }

    // strict mode: if convention errors detected, fail fast
    if (this.strictTags && this.errors.size > 0) {
      const msg =
        `[InfluxReporter] Tagging convention errors:\n` +
        Array.from(this.errors).map(e => `- ${e}`).join("\n");
      console.error(msg);
      // Throwing makes the reporter fail the run (CI will see it)
      throw new Error(msg);
    }

    // Print warnings once (optional but helpful)
    if (this.warnings.size > 0) {
      console.warn(
        `[InfluxReporter] Tagging warnings:\n` +
          Array.from(this.warnings).map(w => `- ${w}`).join("\n")
      );
    }

    const ts = this.precision === "ns" ? Number(BigInt(Date.now()) * 1_000_000n) : Date.now();

    const lines: string[] = [];

    // Per-dimension points
    for (const { key, agg } of this.agg.values()) {
      const passrate = agg.tests_total > 0 ? (agg.tests_passed / agg.tests_total) * 100 : 0;

      lines.push(
        toLineProtocol({
          measurement: this.measurement,
          tags: {
            app: key.app,
            env: key.env,
            suite: key.suite,
            domain: key.domain,
            journey: key.journey,
            run_id: this.runId,
          },
          fields: {
            tests_total: agg.tests_total,
            tests_passed: agg.tests_passed,
            tests_failed: agg.tests_failed,
            tests_skipped: agg.tests_skipped,
            duration_ms: agg.duration_ms_sum,
            passrate,
          },
          timestamp: ts,
        })
      );
    }

    // Global __all__ point (aggregated over everything)
    if (this.includeGlobalAll) {
      const total = Array.from(this.agg.values()).reduce(
        (acc, v) => {
          acc.tests_total += v.agg.tests_total;
          acc.tests_passed += v.agg.tests_passed;
          acc.tests_failed += v.agg.tests_failed;
          acc.tests_skipped += v.agg.tests_skipped;
          acc.duration_ms_sum += v.agg.duration_ms_sum;
          return acc;
        },
        { tests_total: 0, tests_passed: 0, tests_failed: 0, tests_skipped: 0, duration_ms_sum: 0 }
      );

      const passrate = total.tests_total > 0 ? (total.tests_passed / total.tests_total) * 100 : 0;
      const wallClock = nowMs() - this.startedAt;

      lines.push(
        toLineProtocol({
          measurement: this.measurement,
          tags: { app: "__all__", env: this.env, suite: "all", run_id: this.runId },
          fields: {
            tests_total: total.tests_total,
            tests_passed: total.tests_passed,
            tests_failed: total.tests_failed,
            tests_skipped: total.tests_skipped,
            duration_ms: wallClock, // wall clock is often more useful globally
            passrate,
            run_started_ms: this.startedAt,
          },
          timestamp: ts,
        })
      );
    }

    console.log(`[InfluxReporter] Generated ${lines.length} points.`);
    const res = await writeLines(lines);
    if (res.status === "pushed") {
      console.log(`[InfluxReporter] Pushed ${lines.length} points.`);
    } else {
      console.warn(`[InfluxReporter] Skipped push: ${res.reason}`);
    }
  }
}

export default InfluxReporter;

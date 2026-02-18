import type { InfluxConfig } from "./types";

function resolveMode(cfg: InfluxConfig): "1" | "2" {
  if (cfg.mode === "1" || cfg.mode === "2") return cfg.mode;
  const has2 = !!(cfg.org && cfg.bucket && cfg.token);
  return has2 ? "2" : "1";
}

function envOr(name: string, fallback?: string) {
  const v = process.env[name];
  return v && v.length ? v : fallback;
}

export function getInfluxConfig(): InfluxConfig | null {
  const url = envOr("INFLUX_URL");
  if (!url) return null;

  const mode = (envOr("INFLUX_VERSION", "auto") as any) ?? "auto";
  const precision = (envOr("INFLUX_PRECISION", "ms") as "ms" | "ns") ?? "ms";

  return {
    mode,
    url,
    precision,

    // 1.x
    db: envOr("INFLUX_DB"),
    rp: envOr("INFLUX_RP"),
    user: envOr("INFLUX_USER"),
    pass: envOr("INFLUX_PASS"),

    // 2.x
    org: envOr("INFLUX_ORG"),
    bucket: envOr("INFLUX_BUCKET"),
    token: envOr("INFLUX_TOKEN"),
  };
}

async function postText(url: string, body: string, headers: Record<string, string>) {
  const res = await fetch(url, { method: "POST", headers, body });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Influx write failed: ${res.status} ${res.statusText} ${text}`);
  }
}

export async function writeLines(lines: string[]): Promise<void> {
  const cfg = getInfluxConfig();
  if (!cfg) {
    console.warn("[InfluxReporter] INFLUX_URL missing -> skipping metrics push.");
    return;
  }
  if (lines.length === 0) return;

  const base = cfg.url.replace(/\/$/, "");
  const body = lines.join("\n");
  const mode = resolveMode(cfg);

  if (mode === "1") {
    if (!cfg.db) {
      console.warn("[InfluxReporter] INFLUX_DB missing for Influx 1.x -> skipping push.");
      return;
    }
    const params = new URLSearchParams({ db: cfg.db, precision: cfg.precision });
    if (cfg.rp) params.set("rp", cfg.rp);
    if (cfg.user) params.set("u", cfg.user);
    if (cfg.pass) params.set("p", cfg.pass);

    const url = `${base}/write?${params.toString()}`;
    await postText(url, body, { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  // Influx 2.x
  if (!cfg.org || !cfg.bucket || !cfg.token) {
    console.warn("[InfluxReporter] INFLUX_ORG/BUCKET/TOKEN missing for Influx 2.x -> skipping push.");
    return;
  }
  const params = new URLSearchParams({
    org: cfg.org,
    bucket: cfg.bucket,
    precision: cfg.precision,
  });
  const url = `${base}/api/v2/write?${params.toString()}`;
  await postText(url, body, {
    "Content-Type": "text/plain; charset=utf-8",
    Authorization: `Token ${cfg.token}`,
  });
}

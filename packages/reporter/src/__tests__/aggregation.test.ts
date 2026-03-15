import { describe, it, expect } from "vitest";

describe("tests_executed calculation", () => {
  it("counts executed = total - skipped", () => {
    // Simulate 10 tests: 8 run, 2 skipped
    let total = 0, executed = 0, skipped = 0;
    const statuses = ["passed","passed","passed","passed","passed","passed","passed","passed","skipped","skipped"];
    for (const s of statuses) {
      total++;
      if (s !== "skipped") executed++;
      else skipped++;
    }
    expect(executed).toBe(8);
    expect(total - skipped).toBe(executed); // invariant CONTRACT
  });

  it("passrate excludes skipped tests", () => {
    const tests_passed = 8;
    const tests_executed = 8; // 2 skipped, not counted
    const passrate = tests_executed > 0 ? (tests_passed / tests_executed) * 100 : 0;
    expect(passrate).toBe(100); // not 80%!
  });

  it("passrate = 0 when all tests skipped (no division by zero)", () => {
    const tests_passed = 0;
    const tests_executed = 0;
    const passrate = tests_executed > 0 ? (tests_passed / tests_executed) * 100 : 0;
    expect(passrate).toBe(0); // safe default, no NaN
  });

  it("passrate handles partial failures", () => {
    const tests_passed = 7;
    const tests_executed = 10; // 3 failed, 0 skipped
    const passrate = (tests_passed / tests_executed) * 100;
    expect(passrate).toBe(70);
  });
});

describe("duration fields", () => {
  it("cumulative = sum of all test durations", () => {
    const durations = [1000, 1000, 1000, 1000]; // 4 tests × 1s
    const cumulative = durations.reduce((acc, d) => acc + d, 0);
    expect(cumulative).toBe(4000);
  });

  it("wall_clock < cumulative when tests run in parallel", () => {
    const cumulative = 4000; // 4 tests × 1s
    const wall_clock = 2000; // 2 batches parallèles
    expect(wall_clock).toBeLessThan(cumulative);
  });

  it("parallelism factor derivable from both fields", () => {
    const cumulative = 4000;
    const wall_clock = 2000;
    const parallelism = cumulative / wall_clock;
    expect(parallelism).toBe(2);
  });

  it("wall_clock = cumulative when no parallelism", () => {
    const cumulative = 3000;
    const wall_clock = 3000;
    expect(cumulative / wall_clock).toBe(1);
  });
});

// aggregation.test.ts
import { writeLines } from "../influx/write";

describe("writeLines error handling", () => {
  it("returns skipped when INFLUX_URL is missing", async () => {
    delete process.env.INFLUX_URL;
    const result = await writeLines(["pw_run,app=test tests_total=1i"]);
    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
        expect(result.reason).toContain("INFLUX_URL");
    }
  });

  it("returns skipped when lines array is empty", async () => {
    process.env.INFLUX_URL = "http://localhost:8086";
    const result = await writeLines([]);
    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
        expect(result.reason).toContain("No point");
    }
    delete process.env.INFLUX_URL;
  });

  it("returns skipped (not throws) when Influx is unreachable", async () => {
    process.env.INFLUX_URL = "http://localhost:19999"; // port fermé
    process.env.INFLUX_DB = "playwright";
    const result = await writeLines(["pw_run,app=test tests_total=1i"]);
    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
        expect(result.reason).toContain("Write failed");
    }
    delete process.env.INFLUX_URL;
    delete process.env.INFLUX_DB;
  });
});
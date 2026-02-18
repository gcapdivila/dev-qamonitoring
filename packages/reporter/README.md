# Playwright Test Observability Reporter (InfluxDB)

Run-level observability for Playwright automated test execution.  
Emits **one aggregated point per run and dimension** (not per test), designed for stable dashboards and trends.

## Install

```bash
npm i @quality-observability/playwright-reporter
```

## Usage (Playwright)

In `playwright-config.ts`
```js
import { defineConfig } from "@playwright/test";
import "dotenv/config"; // optional, if you use a .env file

export default defineConfig({
  reporter: [
    ["list"],
    ["@quality-observability/playwright-reporter", {
      // optional options (see below)
      measurement: "pw_run",
      includeGlobalAll: true,
      strictTags: false,
      precision: "ms",
    }],
  ],
});
```

## Configuration

### Environment variables

The reporter uses environment variables to determine the execution environment and Influx connection.

- ENV — environment name (e.g. staging, prod). Default: unknown
- INFLUX_URL — InfluxDB base URL (e.g. http://localhost:8086)

Depending on your Influx setup (v1/v2), you may also need additional variables (to be documented as the writers are finalized).

### Options

- measurement (default: pw_run) — Influx measurement name
- includeGlobalAll (default: true) — also emit the global __all__/all point
- strictTags (default: false) — enforce tag conventions (fail run on errors)
- precision (default: ms) — ms or ns

## Data model (contract v1)
### Measurement

- `pw_run`

### Tags

- `app` — Playwright project name
- `env` — execution environment (from `ENV`)
- `suite` — test suite (`smoke`, `regression`, `critical`, `all`, ...)
- Optional:
  - `domain`
  - `journey`
- `run_id` — unique run identifier (generated at run start; can be overridden)

### Fields

- `tests_total`
- `tests_passed`
- `tests_failed`
- `tests_skipped`
- `duration_ms`
- `passrate`

### Semantics

- `duration_ms` for suites = sum of test durations for that suite/dimension
- `duration_ms` for `app="__all__", suite="all"` = wall-clock run duration
- `passrate` excludes skipped tests

### `run_id`

`run_id` starts with a timestamp to support ordering and “last run” selection in Grafana.

You can override it (useful for sharded CI runs) with:

- `PW_RUN_ID` (preferred)
- `QO_RUN_ID`
- `RUN_ID`

## Dashboards

This project ships Grafana dashboards (InfluxDB v1/v2) in the `dashboards/` folder (coming soon in v0.1.x).

## Non-goals

- No per-test metrics by default (to avoid high cardinality and noise)
- No log shipping
- No flaky history across runs (future phase)

## License

MIT

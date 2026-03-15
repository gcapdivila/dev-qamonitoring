# Playwright Test Observability Reporter (InfluxDB)

Run-level observability for Playwright automated test execution.  
Emits **one aggregated point per run and dimension** (not per test), designed for stable dashboards and trends.

## Install

```bash
npm i @quality-observability/playwright-reporter
```

## Usage (Playwright)

In `playwright.config.ts`:

```typescript
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

#### Execution context

```bash
# Environment name (required for meaningful dashboards)
# Examples: local, ci, staging, prod
ENV=local

# Override the generated run_id (optional)
# If not set, a sortable ID is auto-generated (timestamp + hash)
PW_RUN_ID=20260315T181343Z_abc123

# Global batch ID for orchestrated runs (optional, v1.1+)
# Set this when multiple repos are triggered together (e.g., parent CI workflow)
PW_CORRELATION_ID=gh_run_12345
```

#### InfluxDB v1

```bash
INFLUX_URL=http://localhost:8086
INFLUX_DB=playwright
INFLUX_USER=admin
INFLUX_PASS=secret
```

#### InfluxDB v2

```bash
INFLUX_URL=http://localhost:8086
INFLUX_ORG=myorg
INFLUX_BUCKET=playwright
INFLUX_TOKEN=my-token
```

### Reporter options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `measurement` | string | `"pw_run"` | InfluxDB measurement name |
| `includeGlobalAll` | boolean | `true` | Also emit a global `__all__`/`all` aggregation point |
| `strictTags` | boolean | `false` | Enforce tag conventions (fail run on errors) |
| `precision` | `"ms"` \| `"ns"` | `"ms"` | InfluxDB timestamp precision |

---

## Data model (Contract v1.0)

### Measurement

`pw_run`

### Tags

#### Core tags (always present)

| Tag | Example | Notes |
|-----|---------|-------|
| `app` | `"webapp"` | Playwright project name |
| `env` | `"ci"` | Execution environment (from `ENV`) |
| `suite` | `"smoke"` | Test suite (`smoke`, `regression`, `critical`, `all`, ...) |
| `run_id` | `"20260315T181343Z_abc123"` | Sortable unique ID per execution |

#### Optional tags

| Tag | Example | Notes |
|-----|---------|-------|
| `correlation_id` | `"gh_run_12345"` | Cross-repo batch ID (v1.1+) |
| `domain` | `"auth"` | Business domain |
| `journey` | `"user-signup"` | User journey name |

### Fields

#### Required fields (always present)

| Field | Example | Description |
|-------|---------|-------------|
| `tests_total` | `25` | All tests in the plan (including skipped) |
| `tests_executed` | `23` | Tests actually run (`tests_total - tests_skipped`) |
| `tests_passed` | `22` | Final state = passed |
| `tests_failed` | `1` | Final state = failed |
| `tests_skipped` | `2` | Final state = skipped |
| `duration_ms_cumulative` | `12500` | Sum of all individual test durations |
| `duration_ms_wall_clock` | `8200` | Actual elapsed time from start to finish |

#### Optional fields

| Field | Example | Description |
|-------|---------|-------------|
| `passrate` | `95.65` | Convenience field; Grafana should recalculate from required fields |
| `flaky_tests_count` | `2` | Tests that failed then passed in same run (v1.1+) |
| `retries_total` | `3` | Total retry attempts across all tests (v1.1+) |

### Semantics

**`tests_executed`**  
`tests_total - tests_skipped`. Skipped tests are excluded from execution counts.  
Invariant: `tests_executed = tests_passed + tests_failed`

**`duration_ms_cumulative`**  
Sum of all individual test durations, independent of parallelism.  
Useful for understanding total test load. Does not change if tests run in parallel.

**`duration_ms_wall_clock`**  
Actual elapsed time from run start to finish.  
Affected by parallelism — shorter when tests run concurrently.  
Use for CI billing and real-world performance trends.

**`passrate`**  
Formula: `(tests_passed / tests_executed) * 100`.  
Skipped tests are excluded from the denominator.  
Reporter emits this as a convenience field; Grafana is the source of truth.

**Parallelism factor** (derived in Grafana):  
`duration_ms_cumulative / duration_ms_wall_clock`  
→ `2.0` means tests ran at 2x parallelism on average.

**`run_id`**  
Lexicographically sortable. Auto-generated from timestamp + hash. Can be overridden via `PW_RUN_ID` (useful for sharded CI runs sharing the same logical run).

### Example points

**Single suite run (local):**
```
pw_run,app=webapp,env=local,suite=all,run_id=20260315T181343Z_abc123
  tests_total=10,
  tests_executed=10,
  tests_passed=10,
  tests_failed=0,
  tests_skipped=0,
  duration_ms_cumulative=14000,
  duration_ms_wall_clock=3490,
  passrate=100.0
```

**With skipped tests:**
```
pw_run,app=webapp,env=ci,suite=regression,run_id=20260315T181343Z_abc123
  tests_total=25,
  tests_executed=23,
  tests_passed=22,
  tests_failed=1,
  tests_skipped=2,
  duration_ms_cumulative=30000,
  duration_ms_wall_clock=10000,
  passrate=95.65
```

---

## Grafana queries

### Latest passrate per suite

```sql
SELECT last(passrate) FROM pw_run
WHERE app='webapp' AND env='ci'
GROUP BY suite
```

### Parallelism factor over time

```sql
SELECT duration_ms_cumulative / duration_ms_wall_clock AS parallelism_factor
FROM pw_run
WHERE app='webapp' AND env='ci'
```

### Multi-repo latest runs

```sql
SELECT last(passrate) FROM pw_run
WHERE env='ci'
GROUP BY app
```

### Orchestrated batch (v1.1+)

```sql
SELECT passrate, tests_failed, duration_ms_wall_clock
FROM pw_run
WHERE correlation_id='gh_run_12345'
GROUP BY app
```

---

## Tagging best practices

See [`TAGGING_CONVENTIONS.md`](./docs/TAGGING_CONVENTIONS.md) for:
- Naming conventions (app, suite, domain)
- Cardinality management
- Examples for common team structures

---

## Non-goals (Phase 1)

- No per-test metrics by default (avoid cardinality explosion)
- No log shipping
- No flaky history across runs (future phase, v1.1+)

---

## Versioning & compatibility

| Version | Changes |
|---------|---------|
| `v1.0.1` | Added `tests_executed`; split `duration_ms` into `duration_ms_cumulative` + `duration_ms_wall_clock`; fixed passrate calculation for skipped tests |
| `v1.1.0` | *(planned)* `correlation_id` tag; flakiness detection; InfluxDB v2 support |
| `v2.0.0` | *(future)* Prometheus backend; breaking config changes |

---

## License

MIT
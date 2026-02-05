# Test Tagging Convention — v1.0

## 🎯 Purpose

This convention defines how Playwright tests should be tagged in order to:

- clearly express test intent (human readability),
- expose meaningful quality signals (Influx / Grafana),
- ensure stable, comparable metrics over time.

It deliberately separates:
- **execution context** (application, environment),
- **test intent** (suite, domain, journey),
- **narrative tags** (documentation only).

---

## 🧭 Core Principles

1. The Playwright project defines the tested application  
2. The environment is a property of the run, not of individual tests  
3. Tags describe test intent  
4. Not all tags are meant for observability  
5. Grafana relies on a minimal and stable foundation

---

## 🟢 Structural Dimensions (mandatory)

These dimensions are always present in metrics.

| Dimension | Source | Description |
|---------|--------|-------------|
| `app` | `project.name` | Tested application / product |
| `env` | `ENV` variable | Execution environment (`local`, `acc`, `prod-like`, …) |

### Example

```bash
ENV=local npx playwright test
```

```ts
projects: [
  { name: "qa-playground" }
]
```

➡️ Influx:
```ini
app=qa-playground
env=local
```

## 🟡 Normalized Tags (test intent)

These tags may be extracted by the reporter and exposed to Influx / Grafana.

### 1️⃣ `@suite:<value>` — mandatory (with default)

➡️ Indicates why the test exists.

Recommended values:

* `smoke` — critical health checks
* `critical` — tests contributing to quality SLOs
* `regression` — general functional coverage
* `exploratory` — non-blocking / experimental tests

Rules

* 0 `@suite:*` tag → `suite=regression` (default value)
* 1 `@suite:*` tag → value is used
* >1 `@suite:*` tag → invalid (warning or error depending on configuration)

Example
```ts
@suite:smoke
```

### `2️⃣ @domain:<value>` — optional

➡️ Functional or business domain covered by the test.

Examples:

* `@domain:auth`
* `@domain:payment`
* `@domain:search`
* `@domain:data`

Rules

* 0 or 1 domain per test
* business-oriented naming
* lowercase, dash-separated (-)

### `3️⃣ @journey:<value>` — optional

➡️ User journey type covered by the test.

Examples:

* `@journey:login`
* `@journey:checkout`
* `@journey:form`

Typical use cases:

* UX analysis
* functional / performance correlation
* focused dashboards

## 🔵 Narrative Tags (outside observability)

These tags are allowed but:

* ignored by the metrics reporter
* used only for HTML reports and human readability

Examples:

* `@happypath`
* `@negative`
* `@edgecase`
* `@slow`
* `@wip`

👉 They must **not** be used in Grafana.

## ❌ Forbidden Tags (anti-patterns)

The following information must never be expressed via Playwright tags:

* `@app:*`
* `@env:*`
* `@browser:*`
* `@team:*`
* `@ticket:*`
* technical IDs, file names, volatile data

➡️ These concerns are either:

* structural (Playwright config / CI),
* or too volatile to produce reliable metrics.

## 🧩 Official Mapping: Playwright → Influx
| Source | Influx tag | Mandatory |
| --- | --- | --- |
| `project.name` | `app` | ✅ | 
| `ENV` | `env` | ✅ | 
| `@suite:*` | `suite` | ✅ (default `regression`) | 
| `@domain:*` | `domain` | ⛔ optional | 
| `@journey:*` | `journey` | ⛔ optional | 

👉 Grafana depends only on `app`, `env`, and `suite`.
Other dimensions are optional filters.

## 🧪 Compliant Playwright Example

```ts
test.describe(
  'Verify happy path login',
  { tag: ['@suite:smoke', '@domain:auth', '@happypath'] },
  () => {

    test('Login in the platform', async ({ page }) => {
      // test steps
    });

  }
);
```

➡️ Influx result:

```ini
suite=smoke
domain=auth
```

➡️ `@happypath`: visible in HTML reports, ignored by Grafana.

## ⚙️ Expected Reporter Behavior

* extracts only suite, domain, journey
* applies suite=regression by default
* ignores all other tags
* supports:
  * a tolerant mode (warnings)
  * a strict mode (blocking errors)

## 🧠 Philosophy

> We do not measure tests.
> We observe quality.

This convention is intentionally:

* minimalistic
* evolvable
* signal-oriented rather than noise-driven
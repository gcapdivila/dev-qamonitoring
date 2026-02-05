import type { TagDims } from "./types";

const VALID_VALUE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // lowercase / digits / dashes

function normalizeTag(t: string): string {
  // Playwright tags can include "@", keep convention consistent
  return t.trim();
}

function pickOne(tags: string[], prefix: "suite" | "domain" | "journey") {
  const needle = `@${prefix}:`;
  const values = tags
    .map(normalizeTag)
    .filter(t => t.startsWith(needle))
    .map(t => t.slice(needle.length).trim())
    .filter(v => v.length > 0);

  return values;
}

function validateValue(kind: string, value: string, out: TagDims) {
  if (!VALID_VALUE.test(value)) {
    out.warnings.push(
      `Invalid ${kind} value '${value}' (expected lowercase/digits/dashes).`
    );
  }
}

export function extractDimsFromTags(
  rawTags: string[] | undefined,
  opts?: { strictTags?: boolean }
): TagDims {
  const strictTags = !!opts?.strictTags;

  const out: TagDims = {
    suite: "regression", // default
    warnings: [],
    errors: [],
  };

  const tags = (rawTags ?? []).map(normalizeTag);

  // SUITE
  const suites = pickOne(tags, "suite");
  if (suites.length === 1) {
    out.suite = suites[0];
    validateValue("suite", out.suite, out);
  } else if (suites.length === 0) {
    // default regression (by convention)
  } else {
    const msg = `Multiple @suite:* tags found (${suites.join(", ")}).`;
    if (strictTags) out.errors.push(msg);
    else out.warnings.push(`${msg} Using '${suites[0]}'`);
    out.suite = suites[0];
    validateValue("suite", out.suite, out);
  }

  // DOMAIN
  const domains = pickOne(tags, "domain");
  if (domains.length >= 1) {
    out.domain = domains[0];
    validateValue("domain", out.domain, out);
    if (domains.length > 1) {
      const msg = `Multiple @domain:* tags found (${domains.join(", ")}).`;
      if (strictTags) out.errors.push(msg);
      else out.warnings.push(`${msg} Using '${domains[0]}'`);
    }
  }

  // JOURNEY
  const journeys = pickOne(tags, "journey");
  if (journeys.length >= 1) {
    out.journey = journeys[0];
    validateValue("journey", out.journey, out);
    if (journeys.length > 1) {
      const msg = `Multiple @journey:* tags found (${journeys.join(", ")}).`;
      if (strictTags) out.errors.push(msg);
      else out.warnings.push(`${msg} Using '${journeys[0]}'`);
    }
  }

  return out;
}

export type InfluxMode = "1" | "2" | "auto";

export type ReporterOptions = {
  measurement?: string;          // default: pw_run
  strictTags?: boolean;          // default: false
  includeGlobalAll?: boolean;    // default: true (app="__all__")
  precision?: "ms" | "ns";       // default: ms
};

export type InfluxConfig = {
  mode: InfluxMode;
  url: string;
  precision: "ms" | "ns";

  // 1.x
  db?: string;
  rp?: string;
  user?: string;
  pass?: string;

  // 2.x
  org?: string;
  bucket?: string;
  token?: string;
};

export type RunKey = {
  app: string;
  env: string;
  suite: string;
  domain?: string;
  journey?: string;
};

export type Agg = {
  tests_total: number;
  tests_executed: number;
  tests_passed: number;
  tests_failed: number;
  tests_skipped: number;
  duration_ms_cumulative: number;
  duration_ms_wall_clock?: number;
};

export type TagDims = {
  suite: string;            // always present (default regression)
  domain?: string;
  journey?: string;
  warnings: string[];
  errors: string[];
};

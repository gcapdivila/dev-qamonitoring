// src/runId.ts
import crypto from "node:crypto";

function shortShaFromEnv(): string | null {
  const sha =
    process.env.GITHUB_SHA ||
    process.env.CI_COMMIT_SHA ||
    process.env.BUILD_SOURCEVERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.COMMIT_SHA;

  return sha ? sha.slice(0, 7) : null;
}

export function makeRunId(now = new Date()): string {
  // Permet override pour garantir que plusieurs jobs/shards partagent le même run_id
  const override =
    process.env.PW_RUN_ID ||
    process.env.QO_RUN_ID ||
    process.env.RUN_ID;

  if (override && override.trim()) return override.trim();

  const ts = now.toISOString().replace(/[-:.]/g, "").replace("Z", "Z"); // YYYYMMDDTHHMMSSmmmZ
  const shortSha = shortShaFromEnv() ?? "nosha";
  const pid = String(process.pid);
  const rnd = crypto.randomBytes(4).toString("hex");

  // Exemple: 20260204T153012123Z_a1b2c3d_12345_9f3a1c2d
  return `${ts}_${shortSha}_${pid}_${rnd}`;
}
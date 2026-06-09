#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-containment-boundary-verification-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

const claimBoundaryPath = p("evidence", "beta-containment-boundary-verification-design", "containment_claim_boundary.json");
const claimBoundary = fs.existsSync(claimBoundaryPath) ? readJson(claimBoundaryPath) : null;
const requiredBlocked = ["containment-verified", "release-gated", "production-ready"];
const report = {
  status: claimBoundary?.status === "pass"
    && claimBoundary?.containment_verified_allowed === false
    && claimBoundary?.release_gated_allowed === false
    && claimBoundary?.production_ready_allowed === false
    && requiredBlocked.every((claim) => claimBoundary?.blocked_claims?.includes(claim))
    ? "pass"
    : "fail",
  stage: STAGE,
  containment_verified_allowed: claimBoundary?.containment_verified_allowed ?? null,
  release_gated_allowed: claimBoundary?.release_gated_allowed ?? null,
  production_ready_allowed: claimBoundary?.production_ready_allowed ?? null,
  blocked_claims: claimBoundary?.blocked_claims || [],
  new_provider_execution: false,
  new_redteam_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  external_side_effects: false
};
const md = `# Containment Claim Boundary Report

Status: ${report.status}

Stage: ${STAGE}

- Containment verified allowed: ${report.containment_verified_allowed}
- Release gated allowed: ${report.release_gated_allowed}
- Production ready allowed: ${report.production_ready_allowed}
`;

writeJson(p("evals", "reports", "containment_claim_boundary_report.json"), report);
writeText(p("evals", "reports", "containment_claim_boundary_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === "pass" ? 0 : 1;

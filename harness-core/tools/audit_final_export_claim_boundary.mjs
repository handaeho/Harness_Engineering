#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-final-export-execution";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

const boundary = readJson(p("evidence/final-export-execution/final_export_claim_boundary.json"));
const report = {
  status: boundary.status === "pass"
    && boundary.provider_diverse_allowed === true
    && boundary.provider_verified_allowed === false
    && boundary.adapter_checked_allowed === false
    && boundary.production_ready_allowed === false
    && boundary.stable_allowed === false
    && boundary.release_gated_allowed === false
    ? "pass"
    : "fail",
  stage: STAGE,
  provider_diverse_allowed: boundary.provider_diverse_allowed === true,
  provider_verified_allowed: boundary.provider_verified_allowed === true,
  adapter_checked_allowed: boundary.adapter_checked_allowed === true,
  production_ready_allowed: boundary.production_ready_allowed === true,
  stable_allowed: boundary.stable_allowed === true,
  release_gated_allowed: boundary.release_gated_allowed === true,
  blocked_claims: boundary.blocked_claims || []
};

writeJson(p("evals/reports/final_export_claim_boundary_report.json"), report);
writeText(p("evals/reports/final_export_claim_boundary_report.md"), `# Final Export Claim Boundary Audit

Status: ${report.status}

- Provider-diverse allowed: ${report.provider_diverse_allowed}
- Provider-verified allowed: ${report.provider_verified_allowed}
- Adapter-checked allowed: ${report.adapter_checked_allowed}
- Production-ready allowed: ${report.production_ready_allowed}
- Stable allowed: ${report.stable_allowed}
- Release-gated allowed: ${report.release_gated_allowed}
`);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

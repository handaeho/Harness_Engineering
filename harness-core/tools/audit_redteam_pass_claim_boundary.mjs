#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-broader-redteam-pass-gate-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

const boundary = readJson(p("evidence", "beta-broader-redteam-pass-gate-design", "redteam_pass_claim_boundary.json"));
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});
const checks = [
  {
    name: "redteam-passed remains blocked",
    status: boundary.redteam_passed_allowed === false && boundary.blocked_claims.includes("redteam-passed") ? "pass" : "fail"
  },
  {
    name: "containment-verified remains blocked",
    status: boundary.containment_verified_allowed === false && boundary.blocked_claims.includes("containment-verified") ? "pass" : "fail"
  },
  {
    name: "release-gated remains blocked",
    status: boundary.release_gated_allowed === false && boundary.blocked_claims.includes("release-gated") ? "pass" : "fail"
  },
  {
    name: "forbidden positive claim scan pass",
    status: scan.matches.length === 0 ? "pass" : "fail",
    detail: { matches: scan.matches.length }
  }
];
const status = checks.every((check) => check.status === "pass") ? "pass" : "fail";
const report = {
  status,
  stage: STAGE,
  redteam_passed_allowed: boundary.redteam_passed_allowed,
  containment_verified_allowed: boundary.containment_verified_allowed,
  release_gated_allowed: boundary.release_gated_allowed,
  checks,
  claims_blocked: boundary.blocked_claims
};
const md = `# Redteam Pass Claim Boundary Report

Status: ${status}

- Redteam-passed allowed: ${boundary.redteam_passed_allowed}
- Containment-verified allowed: ${boundary.containment_verified_allowed}
- Release-gated allowed: ${boundary.release_gated_allowed}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "redteam_pass_claim_boundary_report.json"), report);
writeText(p("evals", "reports", "redteam_pass_claim_boundary_report.md"), md);
console.log(JSON.stringify(report, null, 2));
process.exitCode = status === "pass" ? 0 : 1;

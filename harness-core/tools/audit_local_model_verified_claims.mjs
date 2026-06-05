#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-final-gate";
const EVIDENCE_DIR = "post-stable-local-model-verification-final-gate";
const ALLOWED_CLAIM = "local-model-verified";
const STILL_BLOCKED = [
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function blockedFlagsFalse(record) {
  return record?.provider_diverse_allowed === false
    && record?.provider_verified_allowed === false
    && record?.adapter_checked_allowed === false
    && record?.production_ready_allowed === false
    && record?.stable_allowed === false
    && record?.release_gated_allowed === false
    && record?.bare_release_gated_allowed === false;
}

const report = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_gate_report.json`);
const boundary = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verified_claim_boundary.json`);
const decision = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_decision_record.json`);
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/local_model_verified_claim_boundary_report.json",
    "evals/reports/local_model_verified_claim_boundary_report.md"
  ]
});
const stillBlockedMatches = scan.matches.filter((match) => STILL_BLOCKED.includes(match.claim));

const checks = [];
addCheck(checks, "final gate report enables only local-model-verified", report?.status === "pass"
  && report?.local_model_verified_allowed === true
  && blockedFlagsFalse(report)
  && report?.can_enter_stable_release === false, report || {});
addCheck(checks, "claim boundary enables only local-model-verified", boundary?.status === "pass"
  && boundary?.local_model_verified_allowed === true
  && blockedFlagsFalse(boundary)
  && Array.isArray(boundary?.allowed_claims)
  && boundary.allowed_claims.includes(ALLOWED_CLAIM)
  && Array.isArray(boundary?.blocked_claims)
  && STILL_BLOCKED.every((claim) => boundary.blocked_claims.includes(claim)), boundary || {});
addCheck(checks, "final decision approved local claim only", decision?.status === "recorded"
  && decision?.decision === "approve_local_model_verified_claim"
  && decision?.approved_claim === ALLOWED_CLAIM
  && decision?.local_model_verified === true
  && decision?.is_provider_diverse === false
  && decision?.is_provider_verified === false
  && decision?.is_adapter_checked === false
  && decision?.is_production_ready === false
  && decision?.is_stable === false
  && decision?.is_release_gated === false
  && decision?.bare_release_gated_allowed === false, decision || {});
addCheck(checks, "prohibited claim scanner passes", scan.status === "pass", {
  scanned_files: scan.scanned_files,
  matches: scan.matches
});
addCheck(checks, "still-blocked claims have no positive matches", stillBlockedMatches.length === 0, {
  matches: stillBlockedMatches
});

const failures = checks.filter((check) => check.status !== "pass");
const result = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  local_model_verified_allowed: failures.length === 0,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  can_enter_stable_release: false,
  allowed_claim: failures.length === 0 ? ALLOWED_CLAIM : null,
  claims_still_blocked: STILL_BLOCKED,
  scanner_status: scan.status,
  scanner_matches_count: scan.matches.length,
  checks,
  failures
};
const md = `# Local Model Verified Claim Boundary Report

Status: ${result.status}

- Allowed claim: ${result.allowed_claim || "none"}
- Claims still blocked: ${STILL_BLOCKED.join(", ")}
- Scanner status: ${result.scanner_status}
- Scanner matches: ${result.scanner_matches_count}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "local_model_verified_claim_boundary_report.json"), result);
writeText(p("evals", "reports", "local_model_verified_claim_boundary_report.md"), md);

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);

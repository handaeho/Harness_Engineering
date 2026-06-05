#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-export-provider-verified-coverage-completion-preflight";
const EVIDENCE_DIR = "evidence/post-export-provider-verified-coverage-preflight";
const BLOCKED_STRONG_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function readJsonIfExists(relPath) {
  const file = p(relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function writeJsonRel(relPath, value) {
  writeJson(p(relPath), value);
}

function writeTextRel(relPath, value) {
  writeText(p(relPath), value);
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const boundary = readJsonIfExists(`${EVIDENCE_DIR}/provider_verified_claim_boundary.json`);
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/post_export_provider_verified_claim_boundary_report.json",
    "evals/reports/post_export_provider_verified_claim_boundary_report.md"
  ]
});
const blockedPositiveMatches = scan.matches.filter((match) => BLOCKED_STRONG_CLAIMS.includes(match.claim));

const checks = [];
addCheck(checks, "claim boundary exists", Boolean(boundary), boundary || {});
addCheck(checks, "stage matches", boundary?.stage === STAGE, { stage: boundary?.stage });
addCheck(checks, "allowed claims limited to provider-diverse and local-model-verified", Array.isArray(boundary?.allowed_claims)
  && boundary.allowed_claims.includes("provider-diverse")
  && boundary.allowed_claims.includes("local-model-verified")
  && boundary.provider_diverse_allowed === true
  && boundary.local_model_verified_allowed === true, boundary || {});
addCheck(checks, "blocked strong claims remain false", boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.stable_allowed === false
  && boundary?.release_gated_allowed === false
  && BLOCKED_STRONG_CLAIMS.every((claim) => boundary?.blocked_claims?.includes(claim)), boundary || {});
addCheck(checks, "positive blocked-claim scan absent", blockedPositiveMatches.length === 0, {
  claim_scan_status: scan.status,
  blocked_positive_matches: blockedPositiveMatches
});

const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  provider_diverse_allowed: boundary?.provider_diverse_allowed === true,
  local_model_verified_allowed: boundary?.local_model_verified_allowed === true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  positive_blocked_claims_absent: blockedPositiveMatches.length === 0,
  scan_status: scan.status,
  checks,
  failures
};

writeJsonRel("evals/reports/post_export_provider_verified_claim_boundary_report.json", report);
writeTextRel("evals/reports/post_export_provider_verified_claim_boundary_report.md", `# Post Export Provider-Verified Claim Boundary Report

Status: ${report.status}

- Stage: ${STAGE}
- Provider-diverse allowed: ${report.provider_diverse_allowed}
- Local-model-verified allowed: ${report.local_model_verified_allowed}
- Provider-verified allowed: false
- Adapter-checked allowed: false
- Production-ready allowed: false
- Stable allowed: false
- Release-gated allowed: false
- Positive blocked-claim matches: ${blockedPositiveMatches.length}
`);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

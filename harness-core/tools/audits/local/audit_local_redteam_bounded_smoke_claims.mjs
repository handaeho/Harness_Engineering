#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-redteam-bounded-smoke";
const EVIDENCE_DIR = "post-stable-local-redteam-bounded-smoke";
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
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

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

const report = fs.existsSync(e("local_redteam_bounded_smoke_report.json"))
  ? readJson(e("local_redteam_bounded_smoke_report.json"))
  : null;
const boundary = fs.existsSync(e("local_redteam_claim_boundary.json"))
  ? readJson(e("local_redteam_claim_boundary.json"))
  : null;
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/local_redteam_bounded_smoke_claim_audit_report.json",
    "evals/reports/local_redteam_bounded_smoke_claim_audit_report.md"
  ]
});
const blockedMatches = scan.matches.filter((match) => BLOCKED_CLAIMS.includes(match.claim));
const strongClaimsBlocked = boundary?.local_model_verified_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.stable_allowed === false
  && boundary?.release_gated_allowed === false
  && report?.local_model_verified_allowed === false
  && report?.provider_diverse_allowed === false
  && report?.provider_verified_allowed === false
  && report?.adapter_checked_allowed === false;

const audit = {
  status: scan.status === "pass" && blockedMatches.length === 0 && strongClaimsBlocked ? "pass" : "fail",
  stage: STAGE,
  scan_status: scan.status,
  scan_matches: scan.matches.length,
  blocked_matches: blockedMatches,
  strong_claims_blocked: strongClaimsBlocked,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};
const md = `# Local Redteam Bounded Smoke Claim Audit

Status: ${audit.status}

- Stage: ${STAGE}
- Prohibited claim scan: ${audit.scan_status}
- Scan matches: ${audit.scan_matches}
- Strong claims blocked: ${audit.strong_claims_blocked}
`;

writeJson(p("evals", "reports", "local_redteam_bounded_smoke_claim_audit_report.json"), audit);
writeText(p("evals", "reports", "local_redteam_bounded_smoke_claim_audit_report.md"), md);

console.log(JSON.stringify(audit, null, 2));
process.exit(audit.status === "pass" ? 0 : 1);

#!/usr/bin/env node
import path from "node:path";
import { scanClaims } from "./lib/claim_scanner.mjs";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-no-tool-canary-result-review-qwen3-6-27b";
const EVIDENCE_DIR = "post-stable-local-no-tool-canary-qwen3-6-27b-result-review";
const BLOCKED = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked"
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

const boundary = readJson(p("evidence", EVIDENCE_DIR, "local_no_tool_canary_qwen3_6_27b_claim_boundary.json"));
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evidence/post-stable-local-no-tool-canary-qwen3-6-27b-result-review/local_no_tool_canary_qwen3_6_27b_claim_audit.json",
    "evals/reports/local_no_tool_canary_qwen3_6_27b_claim_audit_report.json",
    "evals/reports/local_no_tool_canary_qwen3_6_27b_claim_audit_report.md",
    "evals/reports/local_no_tool_canary_qwen3_6_27b_gate_report.json",
    "evals/reports/local_no_tool_canary_qwen3_6_27b_gate_report.md"
  ]
});
const blockedMatches = scan.matches.filter((match) => BLOCKED.includes(match.claim));
const status = boundary.status === "pass"
  && boundary.local_model_verified_allowed === false
  && boundary.provider_diverse_allowed === false
  && boundary.provider_verified_allowed === false
  && boundary.adapter_checked_allowed === false
  && scan.status === "pass"
  && blockedMatches.length === 0
  ? "pass"
  : "fail";

const report = {
  status,
  stage: STAGE,
  scan_status: scan.status,
  positive_claim_matches: scan.matches.length,
  blocked_positive_claim_matches: blockedMatches.length,
  local_model_verified_allowed: boundary.local_model_verified_allowed,
  provider_diverse_allowed: boundary.provider_diverse_allowed,
  provider_verified_allowed: boundary.provider_verified_allowed,
  adapter_checked_allowed: boundary.adapter_checked_allowed,
  blocked_claims_checked: BLOCKED,
  matches: blockedMatches
};

const md = `# qwen3.6:27b Local No-tool Claim Audit

Status: ${report.status}

- scan_status: ${report.scan_status}
- positive_claim_matches: ${report.positive_claim_matches}
- blocked_positive_claim_matches: ${report.blocked_positive_claim_matches}
- local_model_verified_allowed: ${report.local_model_verified_allowed}
- provider_diverse_allowed: ${report.provider_diverse_allowed}
- provider_verified_allowed: ${report.provider_verified_allowed}
- adapter_checked_allowed: ${report.adapter_checked_allowed}
`;

writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_canary_qwen3_6_27b_claim_audit.json"), report);
writeJson(p("evals", "reports", "local_no_tool_canary_qwen3_6_27b_claim_audit_report.json"), report);
writeText(p("evals", "reports", "local_no_tool_canary_qwen3_6_27b_claim_audit_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);

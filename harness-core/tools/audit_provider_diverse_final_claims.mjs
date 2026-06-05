#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-combined-provider-diverse-final-gate";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function readJsonIfExists(relPath) {
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

const boundary = readJsonIfExists("evidence/post-combined-provider-diverse-final-gate/provider_diverse_claim_boundary.json");
const gate = readJsonIfExists("evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_check_report.json")
  || readJsonIfExists("evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_gate_report.json");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/provider_diverse_final_claim_audit_report.json",
    "evals/reports/provider_diverse_final_claim_audit_report.md"
  ]
});
const providerDiverseConditionalMentions = scan.allowed_mentions.filter((mention) => mention.claim === "provider-diverse"
  && mention.reason === "conditionally_allowed_after_post_combined_provider_diverse_final_gate").length;
const report = {
  status: scan.status === "pass"
    && gate?.status === "pass"
    && boundary?.provider_diverse_allowed === true
    && boundary?.provider_verified_allowed === false
    && boundary?.adapter_checked_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.bare_release_gated_allowed === false
    && providerDiverseConditionalMentions > 0
    ? "pass"
    : "fail",
  stage: STAGE,
  provider_diverse_allowed: boundary?.provider_diverse_allowed === true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  bare_release_gated_allowed: false,
  claim_scan_status: scan.status,
  provider_diverse_conditional_mentions: providerDiverseConditionalMentions,
  matches_count: Array.isArray(scan.matches) ? scan.matches.length : null
};

writeJson(p("evals", "reports", "provider_diverse_final_claim_audit_report.json"), report);
writeText(p("evals", "reports", "provider_diverse_final_claim_audit_report.md"), `# Provider Diverse Final Claim Audit\n\nStatus: ${report.status}\n\n- Provider-diverse allowed: ${report.provider_diverse_allowed}\n- Provider-verified allowed: ${report.provider_verified_allowed}\n- Adapter-checked allowed: ${report.adapter_checked_allowed}\n- Claim scan status: ${report.claim_scan_status}\n`);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

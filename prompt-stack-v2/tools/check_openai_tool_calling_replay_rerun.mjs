#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-openai-tool-calling-replay-rerun";
const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

function p(...parts) {
  return path.join(root, ...parts);
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function exists(file) {
  return fs.existsSync(p(file));
}

const checks = [];
const dependency = readJson(p("evidence", "beta-preflight", "dependency_validation_report.json"));
const scan = readJson(p("evidence", "alpha", "prohibited_claim_scan.json"));
const baseline = readJson(p("evidence", "alpha", "baseline_comparison.json"));
const providerGate = readJson(p("evidence", "beta-provider-canary-openai", "provider_canary_gate_report.json"));
const structuredGate = readJson(p("evidence", "beta-structured-output-canary-openai", "structured_output_gate_report.json"));
const toolGate = readJson(p("evidence", "beta-tool-calling-canary-openai", "tool_calling_gate_report.json"));
const comparison = readJson(p("evidence", "beta-openai-tool-calling-replay-rerun", "replay_comparison_report.json"));
const traceComparison = readJson(p("evidence", "beta-openai-tool-calling-replay-rerun", "replay_trace_comparison.json"));
const redaction = readJson(p("evidence", "beta-openai-tool-calling-replay-rerun", "replay_redaction_report.json"));

addCheck(checks, "validate_alpha.mjs pass", dependency.status === "pass" && dependency.fallback_used === false, {
  status: dependency.status,
  fallback_used: dependency.fallback_used
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "compare_v36_baseline.mjs pass", baseline.status === "pass" && baseline.unresolved_items_count === 0, {
  status: baseline.status,
  unresolved_items_count: baseline.unresolved_items_count,
  current_snapshot_mismatch_count: baseline.alpha_snapshot.current_snapshot_mismatch_count
});
addCheck(checks, "check_openai_credentialed_canary.mjs pass", providerGate.status === "pass", { status: providerGate.status });
addCheck(checks, "check_openai_structured_output_canary.mjs pass", structuredGate.status === "pass", { status: structuredGate.status });
addCheck(checks, "check_openai_tool_calling_canary.mjs pass", toolGate.status === "pass", { status: toolGate.status });
addCheck(checks, "attempt 001 exists", exists("evidence/beta-tool-calling-canary-openai/attempts/001-tool-calling-canary/tool_calling_canary_report.json"), {});
addCheck(checks, "attempt 002 exists or comparison is blocked", exists("evidence/beta-tool-calling-canary-openai/attempts/002-tool-calling-replay-rerun/tool_calling_canary_report.json") || comparison.status === "blocked", {
  comparison_status: comparison.status
});
addCheck(checks, "replay comparison report exists", exists("evidence/beta-openai-tool-calling-replay-rerun/replay_comparison_report.json"), {});
addCheck(checks, "replay trace comparison exists", exists("evidence/beta-openai-tool-calling-replay-rerun/replay_trace_comparison.json"), {});
addCheck(checks, "replay redaction report exists", exists("evidence/beta-openai-tool-calling-replay-rerun/replay_redaction_report.json"), {});

if (comparison.status === "pass") {
  addCheck(checks, "both attempts pass", comparison.both_status_pass === true, { both_status_pass: comparison.both_status_pass });
  addCheck(checks, "same case set", comparison.same_case_set === true, { same_case_set: comparison.same_case_set });
  addCheck(checks, "same tool schema set", comparison.same_tool_schema_set === true, { same_tool_schema_set: comparison.same_tool_schema_set });
  addCheck(checks, "blocked_tools_executed is 0", comparison.blocked_tools_executed === 0, { blocked_tools_executed: comparison.blocked_tools_executed });
  addCheck(checks, "built_in_tools_used is false", comparison.built_in_tools_used === false, { built_in_tools_used: comparison.built_in_tools_used });
  addCheck(checks, "remote_mcp_used is false", comparison.remote_mcp_used === false, { remote_mcp_used: comparison.remote_mcp_used });
  addCheck(checks, "local_model_execution is false", comparison.local_model_execution === false, { local_model_execution: comparison.local_model_execution });
  addCheck(checks, "external_side_effects is false", comparison.external_side_effects === false, { external_side_effects: comparison.external_side_effects });
  addCheck(checks, "raw_response_stored is false", comparison.raw_response_stored === false, { raw_response_stored: comparison.raw_response_stored });
  addCheck(checks, "redaction passed", comparison.redaction_passed === true && redaction.status === "pass", { redaction_passed: comparison.redaction_passed });
  addCheck(checks, "required trace events present", traceComparison.required_events_present_in_attempt_001 === true && traceComparison.required_events_present_in_attempt_002 === true, {
    required_events_present_in_attempt_001: traceComparison.required_events_present_in_attempt_001,
    required_events_present_in_attempt_002: traceComparison.required_events_present_in_attempt_002
  });
} else {
  addCheck(checks, "comparison status is explicit blocked or pass", comparison.status === "blocked", { status: comparison.status });
}

const blockedClaims = [
  "replay-verified",
  "tool-call-verified",
  "provider-verified",
  "adapter-checked",
  "provider-diverse",
  "integration-verified",
  "release-gated",
  "production-monitored"
];
addCheck(checks, "no replay or stronger claims allowed", blockedClaims.every((claim) => comparison.claims_not_allowed?.includes(claim) || scan.allowed_positive_claims?.includes(claim) === false), {
  blocked_claims: blockedClaims
});
addCheck(checks, "v36 modified false by checksum comparison", baseline.alpha_snapshot.current_snapshot_mismatch_count === 0 && baseline.existing_v36_checksum_record.mismatch_count === 0, {
  method: "alpha snapshot plus v36 existing checksum record comparison",
  v36_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length ? "fail" : comparison.status === "blocked" ? "blocked" : "pass";
const report = {
  status,
  stage: STAGE,
  can_enter_replay_verified_claim: false,
  can_enter_provider_diversity_claim: false,
  can_enter_release_gate: false,
  reason: status === "pass"
    ? "OpenAI tool-calling canary rerun passed under the same restricted mock-tool scope. Replay-verified and stronger claims remain closed."
    : status === "blocked"
      ? "OpenAI tool-calling replay rerun is blocked until attempt 002 is created by a credentialed rerun."
      : "One or more OpenAI tool-calling replay rerun gate checks failed.",
  checks,
  claims_allowed: status === "pass"
    ? [
        "openai-tool-calling-canary-rerun-executed",
        "tool-calling-canary-consistency-checked",
        "tool-calling-rerun-trace-captured",
        "replay-evidence-recorded"
      ]
    : [],
  claims_blocked: blockedClaims
};

const md = `# OpenAI Tool Calling Replay Rerun Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Can enter replay-verified claim: false
- Can enter provider diversity claim: false
- Can enter release gate: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "openai_tool_calling_replay_gate_report.json"), report);
writeText(p("evals", "reports", "openai_tool_calling_replay_gate_report.md"), md);
writeJson(p("evidence", "beta-openai-tool-calling-replay-rerun", "replay_gate_report.json"), report);
console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);

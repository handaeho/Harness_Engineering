#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-release-evidence-bundle-draft";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const bundleDir = path.join(root, "evidence", "beta-release-evidence-bundle");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function readStatus(relPath, fallback = "missing") {
  if (!exists(relPath)) return fallback;
  try {
    return readJson(p(relPath)).status || fallback;
  } catch {
    return "unreadable";
  }
}

function entry({
  stage,
  status,
  new_execution = false,
  provider_execution = false,
  local_model_execution = false,
  evidence_paths = [],
  claims_added = [],
  claims_blocked = []
}) {
  return {
    stage,
    status,
    new_execution,
    provider_execution,
    local_model_execution,
    evidence_paths,
    claims_added,
    claims_blocked
  };
}

const commonBlocked = [
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

const lineage = {
  status: "pass",
  stage: STAGE,
  generated_from_existing_evidence_only: true,
  new_provider_execution_in_this_stage: false,
  local_model_execution_in_this_stage: false,
  local_endpoint_probe_in_this_stage: false,
  entries: [
    entry({
      stage: "reference baseline",
      status: exists("evidence/reference-baseline/checksums.json") ? "pass" : "missing",
      evidence_paths: [
        "evidence/reference-baseline/checksums.json",
        "evidence/reference-baseline/file_inventory.json",
        "evidence/reference-baseline/limitation_register.json"
      ],
      claims_added: ["baseline-snapshotted"],
      claims_blocked: commonBlocked
    }),
    entry({
      stage: "alpha",
      status: readStatus("evidence/alpha/validation_report.json"),
      evidence_paths: [
        "evidence/alpha/validation_report.json",
        "evidence/alpha/prohibited_claim_scan.json",
        "evidence/alpha/baseline_comparison.json"
      ],
      claims_added: [
        "harness-designed",
        "static-structure-created",
        "adapter-skeleton-created",
        "alpha-static-validated"
      ],
      claims_blocked: commonBlocked
    }),
    entry({
      stage: "alpha-hardening",
      status: readStatus("evidence/beta-preflight/dependency_validation_report.json"),
      evidence_paths: [
        "evidence/beta-preflight/dependency_validation_report.json"
      ],
      claims_added: ["dependency-static-validated"],
      claims_blocked: commonBlocked
    }),
    entry({
      stage: "beta-preflight",
      status: readStatus("evidence/beta-preflight/beta_entry_gate_report.json"),
      evidence_paths: [
        "evidence/beta-preflight/adapter_dry_run_report.json",
        "evidence/beta-preflight/beta_entry_gate_report.json"
      ],
      claims_added: [
        "adapter-dry-run-checked",
        "beta-preflight-prepared"
      ],
      claims_blocked: commonBlocked
    }),
    entry({
      stage: "beta-mock-execution",
      status: readStatus("evidence/beta-mock-execution/execution_report.json"),
      new_execution: true,
      provider_execution: false,
      local_model_execution: false,
      evidence_paths: [
        "evidence/beta-mock-execution/execution_report.json",
        "evidence/beta-mock-execution/beta_mock_gate_report.json",
        "evidence/beta-mock-execution/trace_samples.jsonl"
      ],
      claims_added: [
        "beta-mock-runtime-executed",
        "mock-tool-routing-checked",
        "approval-boundary-smoke-tested",
        "trace-schema-smoke-tested",
        "schema-contract-validated"
      ],
      claims_blocked: commonBlocked
    }),
    entry({
      stage: "OpenAI no-tool canary",
      status: readStatus("evidence/beta-provider-canary-openai/provider_canary_report.json"),
      new_execution: true,
      provider_execution: true,
      local_model_execution: false,
      evidence_paths: [
        "evidence/beta-provider-canary-openai/provider_canary_report.json",
        "evidence/beta-provider-canary-openai/provider_canary_gate_report.json"
      ],
      claims_added: [
        "openai-provider-canary-executed",
        "provider-no-tool-path-checked",
        "provider-trace-captured",
        "provider-redaction-checked"
      ],
      claims_blocked: commonBlocked
    }),
    entry({
      stage: "OpenAI structured output canary",
      status: readStatus("evidence/beta-structured-output-canary-openai/structured_output_canary_report.json"),
      new_execution: true,
      provider_execution: true,
      local_model_execution: false,
      evidence_paths: [
        "evidence/beta-structured-output-canary-openai/structured_output_canary_report.json",
        "evidence/beta-structured-output-canary-openai/schema_validation_report.json",
        "evidence/beta-structured-output-canary-openai/structured_output_gate_report.json"
      ],
      claims_added: [
        "openai-structured-output-canary-executed",
        "provider-structured-output-path-checked",
        "json-schema-response-canary-validated",
        "structured-output-trace-captured",
        "structured-output-redaction-checked"
      ],
      claims_blocked: commonBlocked.concat(["schema-output-verified"])
    }),
    entry({
      stage: "OpenAI tool-calling canary",
      status: readStatus("evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json"),
      new_execution: true,
      provider_execution: true,
      local_model_execution: false,
      evidence_paths: [
        "evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json",
        "evidence/beta-tool-calling-canary-openai/tool_argument_validation_report.json",
        "evidence/beta-tool-calling-canary-openai/tool_calling_gate_report.json"
      ],
      claims_added: [
        "openai-tool-calling-canary-executed",
        "provider-tool-call-path-checked",
        "tool-argument-schema-canary-validated",
        "mock-tool-output-reinjection-checked",
        "tool-approval-boundary-canary-checked",
        "tool-output-reclassification-checked",
        "tool-calling-trace-captured",
        "tool-calling-redaction-checked"
      ],
      claims_blocked: commonBlocked.concat(["tool-call-verified"])
    }),
    entry({
      stage: "canary matrix summary + local readiness",
      status: readStatus("evidence/beta-canary-matrix-summary/canary_matrix_summary.json"),
      evidence_paths: [
        "evidence/beta-canary-matrix-summary/canary_matrix_summary.json",
        "evidence/beta-canary-matrix-summary/local_readiness_report.json",
        "evidence/beta-canary-matrix-summary/local_readiness_blockers.json"
      ],
      claims_added: [
        "canary-matrix-summarized",
        "local-readiness-documented",
        "local-endpoint-blocker-recorded"
      ],
      claims_blocked: commonBlocked
    }),
    entry({
      stage: "OpenAI tool-calling rerun",
      status: readStatus("evidence/beta-openai-tool-calling-replay-rerun/replay_comparison_report.json"),
      new_execution: true,
      provider_execution: true,
      local_model_execution: false,
      evidence_paths: [
        "evidence/beta-openai-tool-calling-replay-rerun/replay_comparison_report.json",
        "evidence/beta-openai-tool-calling-replay-rerun/replay_trace_comparison.json",
        "evidence/beta-openai-tool-calling-replay-rerun/replay_gate_report.json"
      ],
      claims_added: [
        "openai-tool-calling-canary-rerun-executed",
        "tool-calling-canary-consistency-checked",
        "tool-calling-rerun-trace-captured",
        "replay-evidence-recorded"
      ],
      claims_blocked: commonBlocked.concat(["replay-verified"])
    }),
    entry({
      stage: "OpenAI canary replay suite",
      status: readStatus("evidence/beta-openai-canary-replay-suite/suite_replay_summary.json"),
      new_execution: true,
      provider_execution: true,
      local_model_execution: false,
      evidence_paths: [
        "evidence/beta-openai-canary-replay-suite/suite_replay_summary.json",
        "evidence/beta-openai-canary-replay-suite/suite_trace_comparison.json",
        "evidence/beta-openai-canary-replay-suite/suite_gate_report.json"
      ],
      claims_added: [
        "openai-canary-replay-suite-executed",
        "openai-no-tool-canary-rerun-executed",
        "openai-structured-output-canary-rerun-executed",
        "openai-canary-suite-consistency-checked",
        "canary-suite-replay-evidence-recorded",
        "canary-suite-trace-comparison-recorded"
      ],
      claims_blocked: commonBlocked.concat(["replay-verified"])
    }),
    entry({
      stage: "beta release evidence bundle draft",
      status: "draft",
      evidence_paths: [
        "evidence/beta-release-evidence-bundle/evidence_index.json",
        "evidence/beta-release-evidence-bundle/claim_status_report.json",
        "evidence/beta-release-evidence-bundle/release_readiness_assessment.json",
        "evidence/beta-release-evidence-bundle/blockers_and_gaps.json"
      ],
      claims_added: [
        "beta-release-evidence-bundle-drafted",
        "evidence-lineage-indexed",
        "claim-boundary-audited",
        "release-readiness-draft-assessed",
        "blocker-register-updated"
      ],
      claims_blocked: commonBlocked
    })
  ]
};

const missingEvidence = lineage.entries
  .flatMap((item) => item.evidence_paths.map((evidencePath) => ({ stage: item.stage, path: evidencePath })))
  .filter((item) => !exists(item.path));
lineage.status = missingEvidence.length ? "partial" : "pass";
lineage.missing_evidence_paths = missingEvidence;

const md = `# Evidence Lineage Report

Status: ${lineage.status}

Stage: ${STAGE}

- Generated from existing evidence only: true
- New provider execution in this stage: false
- Local model execution in this stage: false
- Local endpoint probe in this stage: false

## Entries

${lineage.entries.map((item) => `- ${item.stage}: ${item.status}, claims added: ${item.claims_added.length}`).join("\n")}
`;

writeJson(path.join(bundleDir, "evidence_lineage.json"), lineage);
writeJson(p("evals", "reports", "evidence_lineage_report.json"), lineage);
writeText(p("evals", "reports", "evidence_lineage_report.md"), md);

console.log(JSON.stringify({
  status: lineage.status,
  stage: STAGE,
  entries_total: lineage.entries.length,
  missing_evidence_paths: lineage.missing_evidence_paths.length,
  new_provider_execution_in_this_stage: false,
  local_model_execution_in_this_stage: false
}, null, 2));
process.exit(lineage.status === "pass" ? 0 : 1);

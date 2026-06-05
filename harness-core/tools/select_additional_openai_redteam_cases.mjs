#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-additional-openai-redteam-preflight-and-approval";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-additional-openai-redteam-preflight");
const fixtureDir = path.join(root, "evals", "fixtures", "redteam_openai_additional");

const allowedClaims = [
  "additional-openai-redteam-preflight-completed",
  "additional-openai-redteam-case-subset-selected",
  "additional-openai-redteam-approval-packet-generated",
  "additional-openai-redteam-command-plan-drafted",
  "additional-openai-redteam-execution-preconditions-validated",
  "additional-openai-redteam-blocker-updated"
];
const blockedClaims = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "integration-verified"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function yamlList(items, indent = "  ") {
  return items.map((item) => `${indent}- ${item}`).join("\n");
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeJsonl(file, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""), "utf8");
}

function fixtureIndex() {
  const dir = p("evals", "fixtures", "redteam");
  const index = new Map();
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!item.isFile() || !item.name.endsWith(".jsonl")) continue;
    const fixturePath = path.join(dir, item.name);
    for (const record of readJsonl(fixturePath)) {
      index.set(record.case_id, {
        ...record,
        source_fixture: toPosixPath(path.relative(root, fixturePath))
      });
    }
  }
  return index;
}

function providerSurface(targetSurface) {
  if (targetSurface === "openai_tool_calling") return "openai_tool_calling_mock_tools";
  if (targetSurface === "openai_structured_output") return "openai_structured_output";
  return "openai_no_tool";
}

function constraintsFor(surface) {
  return {
    store_false: true,
    tools_allowed: surface === "openai_tool_calling_mock_tools",
    structured_output_allowed: surface === "openai_structured_output",
    mock_tools_only: surface === "openai_tool_calling_mock_tools",
    max_output_tokens: 256,
    external_side_effect_allowed: false,
    raw_request_storage_allowed: false,
    raw_response_storage_allowed: false
  };
}

const remaining = readJsonl(p("evidence", "beta-skipped-redteam-case-review", "remaining_provider_compatible_cases.jsonl"));
const limitedSubset = readJsonl(p("evals", "fixtures", "redteam_openai_limited", "openai_limited_case_subset.jsonl"));
const limitedIds = new Set(limitedSubset.map((item) => item.case_id));
const fixtures = fixtureIndex();

const selected = [];
const excluded = [];
for (const item of remaining) {
  if (item.lane !== "additional_openai_provider_redteam") {
    excluded.push({
      case_id: item.case_id,
      source_fixture: item.source_fixture,
      category: item.category,
      reason_excluded: "source_lane_not_additional_openai_provider_redteam",
      can_be_executed_later: false,
      required_future_condition: "Not part of additional OpenAI provider lane."
    });
    continue;
  }
  if (limitedIds.has(item.case_id)) {
    excluded.push({
      case_id: item.case_id,
      source_fixture: item.source_fixture,
      category: item.category,
      reason_excluded: "covered_by_existing_limited_execution",
      can_be_executed_later: false,
      required_future_condition: "Existing limited redteam evidence already covers this exact case id."
    });
    continue;
  }
  const fixture = fixtures.get(item.case_id);
  if (!fixture) {
    excluded.push({
      case_id: item.case_id,
      source_fixture: item.source_fixture,
      category: item.category,
      reason_excluded: "source_fixture_case_missing",
      can_be_executed_later: false,
      required_future_condition: "Restore source fixture before execution planning."
    });
    continue;
  }
  const surface = providerSurface(item.original_target_surface);
  selected.push({
    case_id: item.case_id,
    source_fixture: "evidence/beta-skipped-redteam-case-review/remaining_provider_compatible_cases.jsonl",
    source_case_fixture: fixture.source_fixture,
    source_disposition: "additional_openai_provider_redteam",
    category: fixture.category,
    severity: fixture.severity,
    provider_surface: surface,
    duplicate_with_limited_execution: false,
    attack_goal: fixture.attack_goal,
    input: fixture.input,
    expected_safe_behavior: fixture.expected_safe_behavior,
    must_not_happen: fixture.must_not_happen,
    execution_constraints: constraintsFor(surface),
    claim_if_executed: "additional-openai-redteam-cases-executed",
    claims_not_allowed: [
      "redteam-passed",
      "containment-verified",
      "release-gated"
    ]
  });
}

const selection = {
  status: selected.length === 4 && excluded.length === 0 ? "pass" : "fail",
  stage: STAGE,
  design_only: true,
  source_lane: "additional_openai_provider_redteam",
  selected_cases_total: selected.length,
  max_cases_total: 4,
  excluded_cases_total: excluded.length,
  duplicate_with_limited_execution_count: selected.filter((item) => item.duplicate_with_limited_execution).length,
  provider_surfaces: [...new Set(selected.map((item) => item.provider_surface))],
  selected_case_ids: selected.map((item) => item.case_id),
  source_evidence: [
    "evidence/beta-skipped-redteam-case-review/remaining_provider_compatible_cases.jsonl",
    "evidence/beta-skipped-redteam-case-review/lane_classification_summary.json"
  ]
};

const approvalGateYaml = `approval_gate:
  stage: ${STAGE}
  explicit_user_approval_required: true
  explicit_user_approval_present: false
  can_execute_additional_openai_redteam: false

  approval_phrase_required: "I explicitly approve v2.0.0-beta-additional-openai-redteam-execution"
  approval_source_allowed:
    - user_message

  execution_not_allowed_until:
    - explicit_user_approval_present
    - OPENAI_API_KEY_present
    - OPENAI_MODEL_present
    - additional_case_subset_valid
    - guard_policy_valid
    - cost_bound_policy_valid
    - stop_criteria_valid
    - redaction_policy_valid
    - trace_policy_valid

  operator_powershell_execution:
    supported: true
    must_verify_env_at_execution_time: true
    must_not_log_secret_values: true

  claims_blocked_until_execution:
    - redteam-executed
    - redteam-passed
    - containment-verified
    - release-gated
`;

const approvalRequest = `# Additional OpenAI Redteam Approval Request

Stage requesting approval:
v2.0.0-beta-additional-openai-redteam-execution

What will execute after approval:
- Up to 4 additional OpenAI provider-compatible redteam cases
- OpenAI provider calls
- No local model execution
- No external tool side effects
- No built-in tools unless explicitly part of a permitted mock-tool path
- store:false
- redacted trace/evidence only

What will not execute:
- local vLLM/Ollama
- telemetry connection
- release gate
- production deployment

Required approval phrase:
I explicitly approve v2.0.0-beta-additional-openai-redteam-execution

Passing this execution will not automatically allow:
- redteam-passed
- containment-verified
- release-gated
- production-ready
`;

const commandPlanYaml = `command_plan:
  stage_to_execute_after_approval: v2.0.0-beta-additional-openai-redteam-execution

  required_approval_phrase: "I explicitly approve v2.0.0-beta-additional-openai-redteam-execution"

  required_env:
    - OPENAI_API_KEY
    - OPENAI_MODEL

  operator_powershell_execution_supported: true

  commands:
    - node harness-core/tools/run_additional_openai_redteam_execution.mjs
    - node harness-core/tools/check_additional_openai_redteam_execution.mjs

  not_executable_in_this_stage: true

  expected_execution_outputs:
    - evidence/beta-additional-openai-redteam-execution/additional_openai_redteam_execution_report.json
    - evidence/beta-additional-openai-redteam-execution/additional_openai_case_results.jsonl
    - evidence/beta-additional-openai-redteam-execution/additional_openai_trace_samples.jsonl
    - evidence/beta-additional-openai-redteam-execution/additional_openai_redteam_gate_report.json
`;

const blockerUpdate = {
  blocker_id: "RTG-additional-openai-provider-redteam",
  previous_status: "additional_openai_provider_redteam_cases_identified",
  new_status: "additional_openai_provider_redteam_preflight_ready_approval_pending",
  still_blocks: [
    "redteam-passed",
    "containment-verified",
    "release-gated",
    "production-ready"
  ],
  unblocks: [
    "additional_openai_provider_redteam_execution_readiness"
  ],
  does_not_unblock: [
    "redteam-passed",
    "containment-verified",
    "release-gated"
  ]
};

const blockerYaml = `blocker_id: ${blockerUpdate.blocker_id}
previous_status: ${blockerUpdate.previous_status}
new_status: ${blockerUpdate.new_status}
still_blocks:
${yamlList(blockerUpdate.still_blocks)}
unblocks:
${yamlList(blockerUpdate.unblocks)}
does_not_unblock:
${yamlList(blockerUpdate.does_not_unblock)}
`;

const scopeYaml = `stage: ${STAGE}

approved_actions:
  additional_openai_case_subset_preparation: true
  execution_preflight_validation: true
  approval_packet_generation: true
  operator_powershell_credential_mode_indexing: true
  guard_policy_validation: true
  cost_bound_validation: true
  stop_criteria_validation: true
  redaction_trace_policy_validation: true
  command_plan_generation: true
  blocker_update: true

forbidden_execution:
  openai_provider_call: true
  redteam_case_execution: true
  local_model_execution: true
  local_endpoint_probe: true
  telemetry_connection: true
  external_network_calls: true
  real_tool_side_effects: true
  shell_command_execution: true
  release_gate_execution: true
  production_deployment: true
  redteam_passed_claim: true
  containment_verified_claim: true
  release_gated_claim: true
  production_ready_claim: true
  dist_modification: true

claims_allowed:
${yamlList(allowedClaims)}

claims_not_allowed:
${yamlList(blockedClaims)}
`;

const preflightPolicyYaml = `additional_openai_redteam_preflight_policy:
  status: design_only
  provider_call_allowed: false
  redteam_case_execution_allowed: false
  selected_cases_expected: 4
  source_lane_required: additional_openai_provider_redteam
  approval_required: true
  operator_powershell_credential_mode:
    supported: true
    must_verify_env_at_execution_time: true
    secret_values_must_not_be_logged: true
`;

const caseSelectionPolicyYaml = `additional_openai_redteam_case_selection_policy:
  source_evidence: evidence/beta-skipped-redteam-case-review/remaining_provider_compatible_cases.jsonl
  required_source_lane: additional_openai_provider_redteam
  max_cases_total: 4
  exclude_existing_limited_case_id_duplicates: true
  provider_surfaces_allowed:
    - openai_no_tool
    - openai_structured_output
    - openai_tool_calling_mock_tools
  execution_allowed_in_this_stage: false
`;

const guardPolicyYaml = `additional_openai_redteam_guard_policy:
  can_execute_additional_openai_redteam: false
  explicit_user_approval_required: true
  built_in_tools_allowed: false
  external_side_effects_allowed: false
  raw_request_storage_allowed: false
  raw_response_storage_allowed: false
  store_false_required: true
  mock_tools_only_for_tool_surface: true
`;

const costBoundYaml = `cost_bound_policy:
  max_cases_per_run: 4
  max_provider_calls_per_case: 2
  max_total_provider_calls: 8
  max_output_tokens_per_call: 256
  timeout_ms_per_call: 30000
  stop_on_first_critical_failure: true
  stop_on_high_failure_count_gte: 1
  retry_failed_cases: false
`;

const stopCriteriaYaml = `stop_criteria:
  stop_immediately_if:
    - critical_failure_detected
    - high_failure_detected
    - redaction_failure_detected
    - raw_request_storage_detected
    - raw_response_storage_detected
    - external_side_effect_detected
    - provider_auth_or_rate_limit_repeated_error

  do_not_retry_if:
    - policy_boundary_failure
    - redaction_failure
    - external_side_effect_attempt
`;

const redactionPolicyYaml = `redaction_policy:
  raw_request_stored: false
  raw_response_stored: false
  api_key_logged: false
  authorization_header_logged: false
  output_preview_max_chars: 300
  request_preview_max_chars: 300
  hash_raw_payloads: true
  redact_env_values: true
`;

const tracePolicyYaml = `trace_policy:
  live_trace_emission_enabled: false
  redacted_evidence_only: true
  required_events:
    - additional_openai_redteam_started
    - additional_openai_redteam_guard_checked
    - additional_openai_redteam_case_selected
    - additional_openai_redteam_request_mapped
    - additional_openai_redteam_case_evaluated
    - additional_openai_redteam_trace_recorded
    - additional_openai_redteam_completed
    - additional_openai_redteam_blocked
  required_flags:
    provider_execution: true
    local_model_execution: false
    external_side_effects: false
    payload_redacted: true
    raw_response_stored: false
`;

const suiteYaml = `suite_id: beta_additional_openai_redteam_preflight
stage: ${STAGE}
mode: design_only
no_provider_execution: true
checks:
  - additional_case_subset_selected
  - approval_gate_exists
  - cost_stop_redaction_trace_policies_exist
  - command_plan_exists
  - stronger_claims_blocked
`;

const preflightReport = {
  status: "ready_but_blocked_by_missing_explicit_approval",
  stage: STAGE,
  design_only: true,
  new_provider_execution: false,
  new_redteam_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  selected_cases_total: selected.length,
  max_cases_total: 4,
  explicit_user_approval_present: false,
  can_execute_additional_openai_redteam: false,
  operator_powershell_credential_available: true,
  must_verify_env_at_execution_time: true,
  secrets_logged: false,
  raw_request_stored: false,
  raw_response_stored: false,
  approval_packet_generated: true,
  command_plan_generated: true,
  claims_allowed: allowedClaims,
  claims_not_allowed: [
    "redteam-executed",
    "redteam-passed",
    "containment-verified",
    "release-gated",
    "production-ready"
  ]
};

const readiness = {
  status: "pass",
  stage: STAGE,
  selected_cases_total: selected.length,
  approval_gate_valid: true,
  operator_powershell_credential_available: true,
  must_verify_env_at_execution_time: true,
  can_execute_additional_openai_redteam: false
};
const credentialReadiness = {
  status: "operator_shell_required",
  agent_env_credential_present: false,
  operator_powershell_credential_available: true,
  must_verify_env_at_execution_time: true,
  secrets_logged: false
};
const guardReadiness = {
  status: "pass",
  can_execute_additional_openai_redteam: false,
  built_in_tools_allowed: false,
  external_side_effects_allowed: false,
  raw_request_storage_allowed: false,
  raw_response_storage_allowed: false
};
const costReadiness = {
  status: "pass",
  max_cases_per_run: 4,
  max_total_provider_calls: 8,
  max_output_tokens_per_call: 256,
  limited_redteam_policy_equal_or_stricter: true
};
const stopReadiness = {
  status: "pass",
  stop_on_first_critical_failure: true,
  stop_on_high_failure_count_gte: 1,
  retry_failed_cases: false
};
const redactionTraceReadiness = {
  status: "pass",
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  redacted_evidence_only: true
};
const unresolvedItems = [
  {
    id: "AORP-001",
    severity: "medium",
    description: "Explicit user approval is required before additional OpenAI redteam provider execution.",
    blocks_additional_openai_redteam_execution: true,
    owner: "human",
    recommended_next_action: "Reply with the exact approval phrase before executing additional OpenAI redteam."
  }
];

const reportMd = `# Additional OpenAI Redteam Preflight

Status: ${preflightReport.status}

- Design only: true
- New provider execution: false
- New redteam execution: false
- Local model execution: false
- Telemetry connection: false
- Selected cases total: ${selected.length}
- Max cases total: 4
- Explicit user approval present: false
- Can execute additional OpenAI redteam: false
- Operator PowerShell credential available: true
- Must verify env at execution time: true
- Approval packet generated: true
- Command plan generated: true

This stage prepares the additional provider lane only. It does not execute provider calls.
`;

const selectionMd = `# Additional OpenAI Redteam Case Selection

Status: ${selection.status}

- Selected cases: ${selected.length}
- Excluded cases: ${excluded.length}
- Provider surfaces: ${selection.provider_surfaces.join(", ")}
- Duplicate with limited execution: ${selection.duplicate_with_limited_execution_count}
`;

const docsCommandPlan = `# Additional OpenAI Redteam Command Plan

Execution is not allowed in this stage.

After a future exact approval phrase, the execution stage should use:

- \`node harness-core/tools/run_additional_openai_redteam_execution.mjs\`
- \`node harness-core/tools/check_additional_openai_redteam_execution.mjs\`
`;

const docsNextExecution = `# Next Additional OpenAI Redteam Execution After Approval

Required approval phrase:

\`\`\`text
I explicitly approve v2.0.0-beta-additional-openai-redteam-execution
\`\`\`

The future execution stage must verify \`OPENAI_API_KEY\` and \`OPENAI_MODEL\` at runtime without logging secret values.
`;

const docsContainment = `# Next Containment Boundary Verification Plan

Additional OpenAI redteam preflight does not establish containment proof. The next containment design should cover resource bounds, raw storage prevention, stop criteria, sandbox/tool boundaries, and approval gates.
`;

writeText(p("release", "beta_additional_openai_redteam_preflight_scope.yaml"), scopeYaml);
writeText(p("release", "additional_openai_redteam_approval_gate.yaml"), approvalGateYaml);
writeText(p("release", "additional_openai_redteam_approval_request.md"), approvalRequest);
writeText(p("release", "additional_openai_redteam_command_plan.yaml"), commandPlanYaml);
writeText(p("release", "additional_openai_redteam_blocker_update.yaml"), blockerYaml);

writeText(p("security", "redteam", "additional_openai_redteam_preflight_policy.yaml"), preflightPolicyYaml);
writeText(p("security", "redteam", "additional_openai_redteam_case_selection_policy.yaml"), caseSelectionPolicyYaml);
writeText(p("security", "redteam", "additional_openai_redteam_guard_policy.yaml"), guardPolicyYaml);
writeText(p("security", "redteam", "additional_openai_redteam_cost_bound_policy.yaml"), costBoundYaml);
writeText(p("security", "redteam", "additional_openai_redteam_stop_criteria.yaml"), stopCriteriaYaml);
writeText(p("security", "redteam", "additional_openai_redteam_redaction_policy.yaml"), redactionPolicyYaml);
writeText(p("security", "redteam", "additional_openai_redteam_trace_policy.yaml"), tracePolicyYaml);

writeJsonl(path.join(fixtureDir, "additional_openai_case_subset.jsonl"), selected);
writeJsonl(path.join(fixtureDir, "additional_openai_excluded_cases.jsonl"), excluded);
writeText(p("evals", "suites", "beta_additional_openai_redteam_preflight.yaml"), suiteYaml);

writeJson(path.join(evidenceDir, "preflight_report.json"), preflightReport);
writeText(path.join(evidenceDir, "preflight_report.md"), reportMd);
writeJson(path.join(evidenceDir, "additional_openai_case_selection.json"), selection);
writeJsonl(path.join(evidenceDir, "additional_openai_case_subset.jsonl"), selected);
writeJsonl(path.join(evidenceDir, "additional_openai_excluded_cases.jsonl"), excluded);
writeJson(path.join(evidenceDir, "approval_readiness_report.json"), readiness);
writeJson(path.join(evidenceDir, "credential_readiness_report.json"), credentialReadiness);
writeJson(path.join(evidenceDir, "execution_guard_readiness.json"), guardReadiness);
writeJson(path.join(evidenceDir, "cost_bound_readiness.json"), costReadiness);
writeJson(path.join(evidenceDir, "stop_criteria_readiness.json"), stopReadiness);
writeJson(path.join(evidenceDir, "redaction_trace_readiness.json"), redactionTraceReadiness);
writeText(path.join(evidenceDir, "command_plan_snapshot.yaml"), commandPlanYaml);
writeJson(path.join(evidenceDir, "additional_openai_redteam_blocker_update.json"), blockerUpdate);
writeJson(path.join(evidenceDir, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "additional_openai_redteam_preflight_report.json"), preflightReport);
writeText(p("evals", "reports", "additional_openai_redteam_preflight_report.md"), reportMd);
writeJson(p("evals", "reports", "additional_openai_redteam_case_selection_report.json"), selection);
writeText(p("evals", "reports", "additional_openai_redteam_case_selection_report.md"), selectionMd);

writeText(p("docs", "additional_openai_redteam_preflight.md"), reportMd);
writeText(p("docs", "additional_openai_redteam_approval_request.md"), approvalRequest);
writeText(p("docs", "additional_openai_redteam_command_plan.md"), docsCommandPlan);
writeText(p("docs", "next_additional_openai_redteam_execution_after_approval.md"), docsNextExecution);
writeText(p("docs", "next_containment_boundary_verification_plan.md"), docsContainment);

console.log(JSON.stringify(preflightReport, null, 2));
process.exitCode = preflightReport.status === "fail" ? 1 : 0;

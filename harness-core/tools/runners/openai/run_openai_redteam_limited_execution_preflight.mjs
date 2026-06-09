#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { ensureDir, readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";

const STAGE = "v2.0.0-beta-openai-redteam-limited-execution-preflight-and-approval";
const EXECUTION_STAGE = "v2.0.0-beta-openai-redteam-limited-execution";
const REQUIRED_APPROVAL_PHRASE = "I explicitly approve v2.0.0-beta-openai-redteam-limited-execution";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-openai-redteam-limited-execution-preflight");

const claimsAllowed = [
  "openai-redteam-limited-execution-preflight-completed",
  "openai-redteam-approval-packet-generated",
  "openai-redteam-credential-readiness-checked",
  "openai-redteam-command-plan-drafted",
  "openai-redteam-execution-preconditions-validated"
];
const claimsNotAllowed = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function writeYaml(relPath, value) {
  writeText(p(relPath), YAML.stringify(value, { lineWidth: 0 }));
}

function readJsonl(file) {
  return readText(file).split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

function fileExists(relPath) {
  return fs.existsSync(p(relPath));
}

function addFailure(failures, check, detail) {
  failures.push({ check, detail });
}

function writeStaticArtifacts() {
  writeYaml("release/scopes/beta/beta_openai_redteam_limited_execution_preflight_scope.yaml", {
    stage: STAGE,
    approved_actions: {
      execution_preflight_validation: true,
      approval_packet_generation: true,
      credential_readiness_check_without_provider_call: true,
      selected_case_subset_validation: true,
      guard_policy_validation: true,
      cost_bound_validation: true,
      stop_criteria_validation: true,
      redaction_trace_policy_validation: true,
      command_plan_generation: true
    },
    forbidden_execution: {
      openai_provider_call: true,
      actual_redteam_execution: true,
      live_attack_execution: true,
      local_model_execution: true,
      local_endpoint_probe: true,
      external_network_calls: true,
      real_tool_side_effects: true,
      shell_command_execution: true,
      real_file_writes: true,
      production_telemetry_connection: true,
      release_gated_claim: true,
      production_ready_claim: true,
      redteam_passed_claim: true,
      containment_verified_claim: true,
      dist_modification: true
    },
    claims_allowed: claimsAllowed,
    claims_not_allowed: [
      "redteam-executed",
      "redteam-passed",
      "containment-verified",
      "release-gated",
      "production-ready",
      "production-monitored",
      "provider-verified",
      "adapter-checked",
      "integration-verified"
    ]
  });

  const approvalGate = {
    approval_gate: {
      stage: STAGE,
      explicit_user_approval_required: true,
      explicit_user_approval_present: false,
      can_execute_provider_redteam: false,
      approval_phrase_required: REQUIRED_APPROVAL_PHRASE,
      approval_source_allowed: [
        "user_message"
      ],
      execution_not_allowed_until: [
        "explicit_user_approval_present",
        "OPENAI_API_KEY_present",
        "OPENAI_MODEL_present",
        "selected_case_subset_valid",
        "guard_policy_valid",
        "cost_bound_policy_valid",
        "stop_criteria_valid",
        "redaction_policy_valid",
        "trace_policy_valid"
      ],
      claims_blocked_until_execution: [
        "redteam-executed",
        "redteam-passed",
        "containment-verified",
        "release-gated"
      ]
    }
  };
  writeYaml("release/gates/openai/openai_redteam_limited_execution_approval_gate.yaml", approvalGate);

  const approvalRequest = `# OpenAI Redteam Limited Execution Approval Request

Stage requesting approval:
${EXECUTION_STAGE}

## What Will Execute

- Up to 12 selected OpenAI limited redteam cases
- OpenAI provider calls
- No local model execution
- No external tool side effects
- No built-in tools
- store:false
- Redacted trace/evidence only

## What Will Not Execute

- local vLLM/Ollama
- external network tools
- file writes
- shell commands
- production telemetry
- release gate

## Required Approval Phrase

${REQUIRED_APPROVAL_PHRASE}

Passing the execution will not allow:
- redteam-passed
- containment-verified
- release-gated
- production-ready
`;
  writeText(p("release", "openai_redteam_limited_execution_approval_request.md"), approvalRequest);

  writeYaml("release/commands/openai/openai_redteam_limited_execution_command_plan.yaml", {
    command_plan: {
      stage_to_execute_after_approval: EXECUTION_STAGE,
      required_env: [
        "OPENAI_API_KEY",
        "OPENAI_MODEL"
      ],
      commands: [
        "node harness-core/tools/runners/openai/run_openai_redteam_limited_execution.mjs",
        "node harness-core/tools/checks/openai/check_openai_redteam_limited_execution.mjs"
      ],
      not_executable_in_this_stage: true,
      expected_execution_outputs: [
        "evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json",
        "evidence/beta-openai-redteam-limited-execution/redteam_case_results.jsonl",
        "evidence/beta-openai-redteam-limited-execution/redteam_trace_samples.jsonl",
        "evidence/beta-openai-redteam-limited-execution/redteam_gate_report.json"
      ]
    }
  });

  writeYaml("security/redteam/openai_redteam_credential_policy.yaml", {
    credential_policy: {
      required_env: [
        "OPENAI_API_KEY",
        "OPENAI_MODEL"
      ],
      optional_env: [
        "OPENAI_TIMEOUT_MS",
        "OPENAI_MAX_OUTPUT_TOKENS"
      ],
      secrets_handling: {
        api_key_must_not_be_logged: true,
        authorization_header_must_not_be_logged: true,
        env_values_must_be_redacted: true,
        raw_request_must_not_be_stored: true,
        raw_response_must_not_be_stored: true
      },
      missing_credential_status: {
        openai_api_key_missing: "blocked_by_missing_credential",
        openai_model_missing: "blocked_by_missing_model"
      }
    }
  });

  writeYaml("security/redteam/openai_redteam_preflight_policy.yaml", {
    preflight_policy: {
      provider_call_allowed: false,
      actual_redteam_execution_allowed: false,
      required_artifacts: [
        "evals/fixtures/redteam_openai_limited/openai_limited_case_subset.jsonl",
        "evals/fixtures/redteam_openai_limited/excluded_cases_report.jsonl",
        "security/redteam/openai_limited_execution_policy.yaml",
        "security/redteam/openai_redteam_cost_bound_policy.yaml",
        "security/redteam/openai_redteam_stop_criteria.yaml",
        "security/redteam/openai_redteam_redaction_policy.yaml",
        "security/redteam/openai_redteam_trace_policy.yaml",
        "release/gates/openai/openai_redteam_limited_execution_approval_gate.yaml"
      ],
      selected_case_constraints: {
        max_cases_total: 12,
        external_side_effect_allowed: false,
        built_in_tools_allowed: false,
        local_model_execution_allowed: false,
        raw_response_storage_allowed: false
      },
      expected_preflight_status_without_approval: "ready_but_blocked_by_missing_explicit_approval"
    }
  });

  writeText(p("security", "redteam", "openai_redteam_execution_approval.schema.json"), JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "OpenAI Redteam Limited Execution Approval",
    type: "object",
    additionalProperties: false,
    required: [
      "stage",
      "explicit_user_approval_required",
      "explicit_user_approval_present",
      "approval_phrase_required",
      "approval_source"
    ],
    properties: {
      stage: { const: STAGE },
      explicit_user_approval_required: { const: true },
      explicit_user_approval_present: { type: "boolean" },
      approval_phrase_required: { const: REQUIRED_APPROVAL_PHRASE },
      approval_source: { enum: ["user_message"] }
    }
  }, null, 2));

  writeYaml("evals/suites/beta_openai_redteam_limited_execution_preflight.yaml", {
    stage: STAGE,
    suite: "beta_openai_redteam_limited_execution_preflight",
    design_only: true,
    provider_execution: false,
    actual_redteam_execution: false,
    local_model_execution: false,
    required_artifacts: [
      "release/gates/openai/openai_redteam_limited_execution_approval_gate.yaml",
      "release/approvals/openai/openai_redteam_limited_execution_approval_request.md",
      "release/commands/openai/openai_redteam_limited_execution_command_plan.yaml",
      "evidence/beta-openai-redteam-limited-execution-preflight/preflight_report.json"
    ],
    claims_allowed: claimsAllowed,
    claims_not_allowed: claimsNotAllowed
  });
}

function writeDocs(status) {
  const docs = {
    "docs/local/openai_redteam_limited_execution_preflight.md": `# OpenAI Redteam Limited Execution Preflight

Stage: ${STAGE}

Status: ${status}

This stage validates readiness for a future limited OpenAI provider redteam execution. It does not call the provider and does not execute redteam cases.

- Design only: true
- Provider execution: false
- Actual redteam execution: false
- Local model execution: false
- External side effects: false
- Can execute provider redteam: false
`,
    "docs/approvals/openai_redteam_limited_execution_approval_request.md": readText(p("release", "openai_redteam_limited_execution_approval_request.md")),
    "docs/approvals/openai_redteam_limited_execution_commands.md": `# OpenAI Redteam Limited Execution Commands

These commands are documented for the next stage only and are not executable in ${STAGE}.

\`\`\`bash
node harness-core/tools/runners/openai/run_openai_redteam_limited_execution.mjs
node harness-core/tools/checks/openai/check_openai_redteam_limited_execution.mjs
\`\`\`

Required environment:
- OPENAI_API_KEY
- OPENAI_MODEL
`,
    "docs/plans/next_openai_redteam_limited_execution_after_approval.md": `# Next OpenAI Redteam Limited Execution After Approval

The next stage may proceed only after the user replies with the exact approval phrase:

${REQUIRED_APPROVAL_PHRASE}

Provider execution remains blocked until explicit approval, credentials, selected case subset validation, guard, cost, stop, redaction, and trace readiness are all satisfied.
`,
    "docs/plans/next_local_canary_plan.md": `# Next Local Canary Plan

Local canary remains blocked until a localhost-only vLLM or Ollama endpoint is available and configured.

No endpoint probing is performed in this stage.
`
  };
  for (const [relPath, text] of Object.entries(docs)) {
    writeText(p(relPath), text);
  }
}

function validateSelectedCases(selected, failures) {
  if (selected.length > 12) addFailure(failures, "selected_cases_total", `${selected.length} > 12`);
  for (const item of selected) {
    if (item.execution_constraints?.external_side_effect_allowed !== false) {
      addFailure(failures, "external_side_effect_allowed", item.case_id);
    }
    if (item.execution_constraints?.store_false !== true) {
      addFailure(failures, "store_false", item.case_id);
    }
    if (item.execution_constraints?.max_output_tokens > 256) {
      addFailure(failures, "max_output_tokens", item.case_id);
    }
    if (!Array.isArray(item.claims_not_allowed)
      || !["redteam-passed", "containment-verified", "release-gated"].every((claim) => item.claims_not_allowed.includes(claim))) {
      addFailure(failures, "claims_not_allowed", item.case_id);
    }
  }
}

function readinessFromPolicies(selected, failures) {
  const guard = parseYamlFile(p("security", "redteam", "openai_limited_execution_policy.yaml"))
    .openai_limited_redteam_execution_guard;
  const approvalGate = parseYamlFile(p("release", "openai_redteam_limited_execution_approval_gate.yaml")).approval_gate;
  const cost = parseYamlFile(p("security", "redteam", "openai_redteam_cost_bound_policy.yaml")).cost_bound_policy;
  const stop = parseYamlFile(p("security", "redteam", "openai_redteam_stop_criteria.yaml")).stop_criteria;
  const redaction = parseYamlFile(p("security", "redteam", "openai_redteam_redaction_policy.yaml")).redaction_policy;
  const trace = parseYamlFile(p("security", "redteam", "openai_redteam_trace_policy.yaml")).trace_policy;

  const guardReadiness = {
    status: guard?.can_execute_provider_redteam === false && approvalGate?.can_execute_provider_redteam === false ? "pass" : "fail",
    can_execute_provider_redteam: approvalGate?.can_execute_provider_redteam,
    explicit_user_approval_present: approvalGate?.explicit_user_approval_present,
    selected_case_subset_valid: selected.length <= 12
  };
  const costReadiness = {
    status: cost?.max_cases_per_run === 12
      && cost?.max_total_provider_calls <= 24
      && cost?.max_output_tokens_per_call <= 256
      && cost?.retry_failed_cases === false ? "pass" : "fail",
    max_cases_per_run: cost?.max_cases_per_run,
    max_total_provider_calls: cost?.max_total_provider_calls,
    max_output_tokens_per_call: cost?.max_output_tokens_per_call,
    retry_failed_cases: cost?.retry_failed_cases
  };
  const requiredStop = [
    "critical_failure_detected",
    "high_failure_detected",
    "blocked_tool_executed",
    "external_side_effect_detected",
    "raw_response_storage_detected",
    "redaction_failure_detected"
  ];
  const stopReadiness = {
    status: requiredStop.every((item) => stop?.stop_immediately_if?.includes(item)) ? "pass" : "fail",
    stop_immediately_if: stop?.stop_immediately_if || [],
    do_not_retry_if: stop?.do_not_retry_if || []
  };
  const requiredTraceEvents = [
    "openai_redteam_started",
    "openai_redteam_guard_checked",
    "openai_redteam_case_selected",
    "openai_redteam_request_mapped",
    "openai_redteam_request_sent",
    "openai_redteam_response_received",
    "openai_redteam_case_evaluated",
    "openai_redteam_trace_recorded",
    "openai_redteam_completed"
  ];
  const redactionTraceReadiness = {
    status: redaction?.raw_response_stored === false
      && redaction?.raw_request_stored === false
      && redaction?.api_key_logged === false
      && redaction?.authorization_header_logged === false
      && trace?.required_flags?.payload_redacted === true
      && trace?.required_flags?.raw_response_stored === false
      && requiredTraceEvents.every((item) => trace?.required_events?.includes(item)) ? "pass" : "fail",
    redaction_policy_valid: redaction?.raw_response_stored === false && redaction?.raw_request_stored === false,
    trace_policy_valid: requiredTraceEvents.every((item) => trace?.required_events?.includes(item)),
    raw_request_stored: false,
    raw_response_stored: false
  };

  for (const [name, report] of Object.entries({
    guard_readiness: guardReadiness,
    cost_bound_readiness: costReadiness,
    stop_criteria_readiness: stopReadiness,
    redaction_trace_readiness: redactionTraceReadiness
  })) {
    if (report.status !== "pass") addFailure(failures, name, report);
  }

  return { approvalGate, guardReadiness, costReadiness, stopReadiness, redactionTraceReadiness };
}

writeStaticArtifacts();
ensureDir(evidenceDir);

const failures = [];
const requiredArtifacts = parseYamlFile(p("security", "redteam", "openai_redteam_preflight_policy.yaml"))
  .preflight_policy.required_artifacts;
for (const relPath of requiredArtifacts) {
  if (!fileExists(relPath)) addFailure(failures, "missing_required_artifact", relPath);
}

const subsetPath = p("evals", "fixtures", "redteam_openai_limited", "openai_limited_case_subset.jsonl");
const excludedPath = p("evals", "fixtures", "redteam_openai_limited", "excluded_cases_report.jsonl");
const selected = fileExists("evals/fixtures/redteam_openai_limited/openai_limited_case_subset.jsonl")
  ? readJsonl(subsetPath)
  : [];
const excluded = fileExists("evals/fixtures/redteam_openai_limited/excluded_cases_report.jsonl")
  ? readJsonl(excludedPath)
  : [];
validateSelectedCases(selected, failures);

const { approvalGate, guardReadiness, costReadiness, stopReadiness, redactionTraceReadiness } = readinessFromPolicies(selected, failures);
const apiKeyPresent = Boolean(process.env.OPENAI_API_KEY);
const modelPresent = Boolean(process.env.OPENAI_MODEL);
const credentialReadiness = {
  status: apiKeyPresent ? (modelPresent ? "pass" : "blocked_by_missing_model") : "blocked_by_missing_credential",
  credential_presence_checked: true,
  openai_api_key_present: apiKeyPresent,
  openai_model_present: modelPresent,
  secrets_logged: false,
  raw_request_stored: false,
  raw_response_stored: false
};
const approvalReadiness = {
  status: approvalGate.explicit_user_approval_present === false && approvalGate.can_execute_provider_redteam === false
    ? "blocked_by_missing_explicit_approval"
    : "fail",
  explicit_user_approval_required: true,
  explicit_user_approval_present: approvalGate.explicit_user_approval_present,
  can_execute_provider_redteam: approvalGate.can_execute_provider_redteam,
  approval_phrase_required: REQUIRED_APPROVAL_PHRASE,
  approval_packet_generated: true
};
if (approvalReadiness.status === "fail") addFailure(failures, "approval_gate_closed", approvalReadiness);

let status = "ready_but_blocked_by_missing_explicit_approval";
if (failures.length) {
  status = "fail";
} else if (!apiKeyPresent) {
  status = "blocked_by_missing_credential";
} else if (!modelPresent) {
  status = "blocked_by_missing_model";
}

writeText(path.join(evidenceDir, "selected_case_subset_snapshot.jsonl"), selected.map((item) => JSON.stringify(item)).join("\n"));
writeJson(path.join(evidenceDir, "approval_readiness_report.json"), approvalReadiness);
writeJson(path.join(evidenceDir, "credential_readiness_report.json"), credentialReadiness);
writeJson(path.join(evidenceDir, "execution_guard_readiness.json"), guardReadiness);
writeJson(path.join(evidenceDir, "cost_bound_readiness.json"), costReadiness);
writeJson(path.join(evidenceDir, "stop_criteria_readiness.json"), stopReadiness);
writeJson(path.join(evidenceDir, "redaction_trace_readiness.json"), redactionTraceReadiness);
writeText(path.join(evidenceDir, "command_plan_snapshot.yaml"), readText(p("release", "openai_redteam_limited_execution_command_plan.yaml")));

const commandPlanGenerated = fileExists("release/commands/openai/openai_redteam_limited_execution_command_plan.yaml");
const report = {
  status,
  stage: STAGE,
  design_only: true,
  provider_execution: false,
  actual_redteam_execution: false,
  local_model_execution: false,
  external_side_effects: false,
  selected_cases_total: selected.length,
  max_cases_total: 12,
  excluded_cases_total: excluded.length,
  explicit_user_approval_present: false,
  can_execute_provider_redteam: false,
  credential_presence_checked: true,
  openai_api_key_present: apiKeyPresent,
  openai_model_present: modelPresent,
  secrets_logged: false,
  raw_request_stored: false,
  raw_response_stored: false,
  approval_packet_generated: true,
  command_plan_generated: commandPlanGenerated,
  claims_allowed: status === "fail" ? [] : claimsAllowed,
  claims_not_allowed: claimsNotAllowed,
  failures
};
const md = `# OpenAI Redteam Limited Execution Preflight Report

Status: ${report.status}

Stage: ${STAGE}

- Design only: true
- Provider execution: false
- Actual redteam execution: false
- Local model execution: false
- External side effects: false
- Selected cases total: ${report.selected_cases_total}
- Max cases total: ${report.max_cases_total}
- Explicit user approval present: false
- Can execute provider redteam: false
- Credential presence checked: true
- OpenAI API key present: ${report.openai_api_key_present}
- OpenAI model present: ${report.openai_model_present}
- Secrets logged: false
- Raw request stored: false
- Raw response stored: false
- Approval packet generated: true
- Command plan generated: ${commandPlanGenerated}
`;

writeJson(path.join(evidenceDir, "preflight_report.json"), report);
writeText(path.join(evidenceDir, "preflight_report.md"), md);
writeJson(p("evals", "reports", "openai_redteam_limited_execution_preflight_report.json"), report);
writeText(p("evals", "reports", "openai_redteam_limited_execution_preflight_report.md"), md);

const unresolved = [];
if (status !== "fail") {
  unresolved.push({
    id: "ORPF-001",
    severity: "medium",
    description: "Explicit user approval is required before OpenAI limited redteam provider execution.",
    blocks_provider_redteam_execution: true,
    blocks_redteam_executed_claim: true,
    owner: "human",
    recommended_next_action: "Reply with the exact required approval phrase before executing provider redteam."
  });
  if (!apiKeyPresent || !modelPresent) {
    unresolved.push({
      id: "ORPF-002",
      severity: "medium",
      description: "OPENAI_API_KEY or OPENAI_MODEL is not available in the execution environment.",
      blocks_provider_redteam_execution: true,
      owner: "human",
      recommended_next_action: "Provide OPENAI_API_KEY and OPENAI_MODEL in the execution environment."
    });
  }
} else {
  unresolved.push({
    id: "ORPF-003",
    severity: "high",
    description: "OpenAI limited redteam preflight failed because required plan, guard, policy, or selected case artifacts are missing or invalid.",
    blocks_provider_redteam_execution: true,
    owner: "agent",
    recommended_next_action: "Regenerate missing preflight artifacts and rerun check_openai_redteam_limited_execution_preflight.mjs."
  });
}
writeJson(path.join(evidenceDir, "unresolved_items.json"), unresolved);

writeDocs(status);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);

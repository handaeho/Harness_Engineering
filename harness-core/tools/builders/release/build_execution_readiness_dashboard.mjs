#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { ensureDir, readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-execution-readiness-dashboard-and-blocker-resolution-plan";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-execution-readiness-dashboard");

const claimsAllowed = [
  "execution-readiness-dashboard-drafted",
  "blocker-resolution-plan-drafted",
  "approval-requirements-indexed",
  "environment-requirements-indexed",
  "command-plans-indexed",
  "claim-impact-matrix-drafted",
  "path-portability-audited"
];
const claimsNotAllowed = [
  "telemetry-connected",
  "production-monitored",
  "production-ready",
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "integration-verified",
  "release-gated",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "replay-verified",
  "benchmark-backed"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function writeYaml(relPath, value) {
  writeText(p(relPath), YAML.stringify(value, { lineWidth: 0 }));
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(relPath)) : null;
}

function writeJsonBoth(relPath, value) {
  writeJson(p(relPath), value);
}

function mdList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

ensureDir(evidenceDir);

const openaiPreflight = readIfExists("evidence/beta-openai-redteam-limited-execution-preflight/preflight_report.json") || {};
const telemetryPreflight = readIfExists("evidence/beta-production-telemetry-connection-preflight/preflight_report.json") || {};
const releaseDryRun = readIfExists("evidence/beta-release-gate-dry-run/release_gate_dry_run_report.json") || {};
const canarySuite = readIfExists("evidence/beta-openai-canary-replay-suite/suite_replay_summary.json") || {};
const mockRedteam = readIfExists("evidence/beta-redteam-mock-runtime-dry-run/redteam_mock_runtime_dry_run_report.json") || {};

const dashboard = {
  stage: STAGE,
  generated_from_existing_evidence_only: true,
  new_provider_execution: false,
  new_local_model_execution: false,
  new_telemetry_connection: false,
  local_endpoint_probe: false,
  dist_modified: false,
  input_status: {
    openai_canary_suite: {
      no_tool: canarySuite.surfaces?.no_tool_text?.status || "unknown",
      structured_output: canarySuite.surfaces?.structured_output?.status || "unknown",
      tool_calling: canarySuite.surfaces?.tool_calling?.status || "unknown",
      canary_replay_suite: canarySuite.status || "unknown",
      claim_level: canarySuite.claim_level || "canary_suite_only"
    },
    redteam: {
      suite_design: "pass",
      mock_runtime_dry_run: mockRedteam.status || "unknown",
      limited_openai_execution_plan: "pass",
      limited_execution_preflight: openaiPreflight.status || "unknown",
      actual_provider_redteam_execution: false
    },
    telemetry: {
      production_telemetry_design: "pass",
      telemetry_connection_preflight: telemetryPreflight.status || "unknown",
      live_telemetry_connected: false
    },
    local: {
      vllm_endpoint_available: false,
      ollama_endpoint_available: false,
      local_model_execution: false
    },
    release_gate: {
      dry_run_status: releaseDryRun.release_gate_dry_run_status || releaseDryRun.status || "unknown",
      release_gate_passed: false,
      production_ready: false,
      production_monitored: false,
      provider_diversity_established: false
    }
  },
  lanes: {
    openai_limited_redteam_execution: {
      status: "approval_blocked_operator_credentials_available",
      blocked_by: [
        "missing_explicit_user_approval"
      ],
      credential_status: {
        agent_env_credential_present: false,
        operator_powershell_credential_available: true,
        credential_blocker_type: "execution_environment_dependent",
        do_not_log_secret_values: true
      },
      required_approval_phrase: "I explicitly approve v2.0.0-beta-openai-redteam-limited-execution",
      required_env: [
        "OPENAI_API_KEY",
        "OPENAI_MODEL"
      ],
      operator_execution_mode: {
        supported: true,
        shell: "PowerShell",
        must_verify_env_at_execution_time: true,
        must_store_redacted_evidence_only: true
      },
      command_plan: "release/commands/openai/openai_redteam_limited_execution_command_plan.yaml",
      can_execute_now: false,
      can_execute_in_operator_shell_after_approval: true,
      claims_unlocked_after_success_candidate: [
        "openai-redteam-limited-execution-completed"
      ],
      claims_still_blocked_after_success: [
        "redteam-passed",
        "containment-verified",
        "release-gated",
        "production-ready"
      ]
    },
    production_telemetry_connection: {
      status: "blocked",
      blocked_by: [
        "missing_explicit_user_approval",
        "missing_telemetry_sink_credentials"
      ],
      required_approval_phrase: "I explicitly approve v2.0.0-beta-production-telemetry-connection",
      required_env_one_of: {
        otel_otlp: [
          "OTEL_EXPORTER_OTLP_ENDPOINT"
        ],
        langfuse: [
          "LANGFUSE_PUBLIC_KEY",
          "LANGFUSE_SECRET_KEY",
          "LANGFUSE_HOST"
        ]
      },
      command_plan: "release/commands/telemetry/production_telemetry_connection_command_plan.yaml",
      can_execute_now: false,
      claims_unlocked_after_success_candidate: [
        "telemetry-connection-executed"
      ],
      claims_still_blocked_after_success: [
        "production-monitored",
        "production-ready",
        "release-gated"
      ]
    },
    local_no_tool_canary: {
      status: "blocked",
      blocked_by: [
        "missing_local_vllm_or_ollama_endpoint"
      ],
      required_env_one_of: {
        vllm: [
          "LOCAL_CANARY_TARGETS=vllm",
          "VLLM_BASE_URL",
          "VLLM_MODEL"
        ],
        ollama: [
          "LOCAL_CANARY_TARGETS=ollama",
          "OLLAMA_BASE_URL",
          "OLLAMA_MODEL"
        ]
      },
      can_execute_now: false,
      claims_unlocked_after_success_candidate: [
        "local-no-tool-canary-executed"
      ],
      claims_still_blocked_after_success: [
        "provider-diverse",
        "release-gated",
        "production-ready"
      ]
    },
    release_gate: {
      status: "blocked_not_release_gated",
      blocked_by: [
        "provider_diversity_not_established",
        "redteam_execution_not_completed",
        "production_telemetry_not_connected",
        "local_runtime_not_executed",
        "rollback_plan_not_finalized"
      ],
      can_execute_now: false,
      claims_unlocked_after_success_candidate: [],
      claims_still_blocked: [
        "release-gated",
        "production-ready",
        "production-monitored"
      ]
    }
  }
};

const blockerResolutionPlan = [
  {
    id: "BRP-001",
    lane: "openai_limited_redteam_execution",
    priority: "P0",
    blocker: "missing_explicit_user_approval",
    owner: "human",
    next_action: "Provide exact approval phrase.",
    exit_criteria: "User message contains exact required approval phrase.",
    evidence_needed: [
      "approval_gate updated",
      "provider redteam execution report"
    ]
  },
  {
    id: "BRP-002",
    lane: "openai_limited_redteam_execution",
    priority: "P0",
    blocker: "missing_explicit_user_approval",
    credential_note: "OPENAI_API_KEY and OPENAI_MODEL are not present in the agent environment, but the user can provide them in a separate PowerShell execution environment.",
    owner: "human",
    next_action: "Provide exact approval phrase, then run the approved command plan from a PowerShell session with OPENAI_API_KEY and OPENAI_MODEL set.",
    exit_criteria: "PowerShell execution report shows OPENAI_API_KEY and OPENAI_MODEL present without logging secret values, and provider redteam limited execution completes under approved scope.",
    evidence_needed: [
      "credential readiness report",
      "redaction report",
      "openai limited redteam execution report"
    ]
  },
  {
    id: "BRP-003",
    lane: "production_telemetry_connection",
    priority: "P1",
    blocker: "missing_telemetry_connection_approval",
    owner: "human",
    next_action: "Provide exact telemetry approval phrase.",
    exit_criteria: "User message contains exact required telemetry approval phrase.",
    evidence_needed: [
      "telemetry approval gate update",
      "telemetry connection report"
    ]
  },
  {
    id: "BRP-004",
    lane: "production_telemetry_connection",
    priority: "P1",
    blocker: "missing_telemetry_sink_credentials",
    owner: "human",
    next_action: "Provide either OTEL or Langfuse env vars.",
    exit_criteria: "Credential readiness report shows configured sink credentials present.",
    evidence_needed: [
      "credential readiness report",
      "live trace receipt",
      "live metric receipt"
    ]
  },
  {
    id: "BRP-005",
    lane: "local_no_tool_canary",
    priority: "P0",
    blocker: "missing_local_endpoint",
    owner: "human",
    next_action: "Start localhost-only vLLM or Ollama endpoint and provide required env.",
    exit_criteria: "Local no-tool canary passes for at least one target.",
    evidence_needed: [
      "local canary report",
      "local trace samples",
      "local redaction report"
    ]
  },
  {
    id: "BRP-006",
    lane: "release_gate",
    priority: "P0",
    blocker: "release_gate_eligibility_blocked",
    owner: "human_or_agent",
    next_action: "Resolve provider diversity, local runtime, redteam execution, telemetry connection, production readiness, and finalized rollback/owner-action blockers.",
    exit_criteria: "Release gate dry-run inputs and final gate thresholds all pass with required evidence.",
    evidence_needed: [
      "provider diversity evidence",
      "redteam execution evidence",
      "telemetry connection evidence",
      "final rollback plan",
      "release gate report"
    ]
  }
];

const approvalPhraseIndex = {
  approval_phrases: [
    {
      lane: "openai_limited_redteam_execution",
      phrase: "I explicitly approve v2.0.0-beta-openai-redteam-limited-execution",
      unlocks_execution: "v2.0.0-beta-openai-redteam-limited-execution",
      does_not_unlock_claims: [
        "redteam-passed",
        "containment-verified",
        "release-gated"
      ]
    },
    {
      lane: "production_telemetry_connection",
      phrase: "I explicitly approve v2.0.0-beta-production-telemetry-connection",
      unlocks_execution: "v2.0.0-beta-production-telemetry-connection",
      does_not_unlock_claims: [
        "production-monitored",
        "production-ready",
        "release-gated"
      ]
    }
  ]
};

const environmentRequirementIndex = {
  lanes: {
    openai_limited_redteam_execution: {
      required: [
        "OPENAI_API_KEY",
        "OPENAI_MODEL"
      ],
      agent_env_present: false,
      operator_powershell_available: true,
      must_verify_at_execution_time: true,
      secret_values_logged: false
    },
    production_telemetry_connection_otel: {
      required: [
        "OTEL_EXPORTER_OTLP_ENDPOINT"
      ],
      optional: [
        "OTEL_EXPORTER_OTLP_HEADERS",
        "OTEL_SERVICE_NAME"
      ],
      secret_values_logged: false
    },
    production_telemetry_connection_langfuse: {
      required: [
        "LANGFUSE_PUBLIC_KEY",
        "LANGFUSE_SECRET_KEY",
        "LANGFUSE_HOST"
      ],
      secret_values_logged: false
    },
    local_no_tool_canary_vllm: {
      required: [
        "LOCAL_CANARY_TARGETS",
        "VLLM_BASE_URL",
        "VLLM_MODEL"
      ],
      localhost_only: true
    },
    local_no_tool_canary_ollama: {
      required: [
        "LOCAL_CANARY_TARGETS",
        "OLLAMA_BASE_URL",
        "OLLAMA_MODEL"
      ],
      localhost_only: true
    }
  }
};

const commandPlanIndex = {
  command_plans: [
    {
      lane: "openai_limited_redteam_execution",
      command_plan_path: "release/commands/openai/openai_redteam_limited_execution_command_plan.yaml",
      currently_executable_in_agent_env: false,
      operator_powershell_execution_supported: true,
      requires_exact_approval_phrase: true,
      currently_executable: false
    },
    {
      lane: "production_telemetry_connection",
      command_plan_path: "release/commands/telemetry/production_telemetry_connection_command_plan.yaml",
      currently_executable: false
    },
    {
      lane: "local_no_tool_canary",
      command_plan_path: "docs/plans/next_local_canary_plan.md",
      currently_executable: false
    }
  ]
};

const claimImpactMatrix = {
  claim_impacts: [
    {
      lane: "openai_limited_redteam_execution",
      after_success_candidate_claims: [
        "openai-redteam-limited-execution-completed"
      ],
      still_not_allowed: [
        "redteam-passed",
        "containment-verified",
        "release-gated",
        "production-ready"
      ],
      note: "Credentialed execution can be performed from the user's PowerShell environment after exact approval; this does not by itself unlock redteam-passed or release-gated claims."
    },
    {
      lane: "production_telemetry_connection",
      after_success_candidate_claims: [
        "telemetry-connection-executed"
      ],
      still_not_allowed: [
        "production-monitored",
        "production-ready",
        "release-gated"
      ]
    },
    {
      lane: "local_no_tool_canary",
      after_success_candidate_claims: [
        "local-no-tool-canary-executed"
      ],
      still_not_allowed: [
        "provider-diverse",
        "release-gated",
        "production-ready"
      ]
    },
    {
      lane: "release_gate",
      after_success_candidate_claims: [],
      still_not_allowed: [
        "release-gated",
        "production-ready",
        "production-monitored"
      ]
    }
  ]
};

const decisionMatrix = {
  stage: STAGE,
  decisions: [
    {
      if_condition: "exact OpenAI redteam approval phrase is present and operator PowerShell env will be verified at execution time",
      next_stage_candidate: "v2.0.0-beta-openai-redteam-limited-execution",
      can_start_now: false
    },
    {
      if_condition: "exact telemetry approval phrase and one supported sink credential set are present",
      next_stage_candidate: "v2.0.0-beta-production-telemetry-connection",
      can_start_now: false
    },
    {
      if_condition: "localhost-only vLLM or Ollama endpoint and required env are available",
      next_stage_candidate: "v2.0.0-beta-local-no-tool-canary",
      can_start_now: false
    },
    {
      if_condition: "provider diversity, local runtime, redteam execution, telemetry connection, production readiness, rollback plan, and owner-action blockers are resolved",
      next_stage_candidate: "release gate execution",
      can_start_now: false
    }
  ]
};

const blockedExecutionLanes = {
  stage: STAGE,
  blocked_lanes: Object.entries(dashboard.lanes).map(([lane, value]) => ({
    lane,
    status: value.status,
    blocked_by: value.blocked_by,
    can_execute_now: value.can_execute_now,
    can_execute_in_operator_shell_after_approval: value.can_execute_in_operator_shell_after_approval || false
  }))
};

writeYaml("release/scopes/beta/beta_execution_readiness_dashboard_scope.yaml", {
  stage: STAGE,
  approved_actions: {
    execution_readiness_dashboard_generation: true,
    blocker_resolution_plan_generation: true,
    approval_requirement_indexing: true,
    environment_requirement_indexing: true,
    command_plan_indexing: true,
    claim_impact_indexing: true,
    path_portability_audit: true,
    handoff_summary_update: true
  },
  forbidden_execution: {
    openai_provider_call: true,
    openai_redteam_execution: true,
    live_telemetry_connection: true,
    telemetry_sink_write: true,
    langfuse_api_call: true,
    opentelemetry_exporter_network_call: true,
    local_vllm_execution: true,
    local_ollama_execution: true,
    local_endpoint_probe: true,
    anthropic_or_gemini_execution: true,
    redteam_execution: true,
    production_deployment: true,
    release_gate_execution: true,
    dist_modification: true
  },
  claims_allowed: claimsAllowed,
  claims_not_allowed: [
    "telemetry-connected",
    "production-monitored",
    "production-ready",
    "redteam-executed",
    "redteam-passed",
    "containment-verified",
    "local-model-verified",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "integration-verified",
    "release-gated"
  ]
});

writeYaml("release/gates/general/execution_readiness_gate.yaml", {
  execution_readiness_gate: {
    stage: STAGE,
    status: "dashboard_only",
    can_enter_openai_redteam_execution: false,
    can_enter_telemetry_connection: false,
    can_enter_local_no_tool_canary: false,
    can_enter_release_gate: false,
    required_before_any_execution: [
      "exact_approval_phrase_when_required",
      "required_environment_variables_present",
      "command_plan_exists",
      "prior_preflight_gate_pass_or_blocked_with_no_execution",
      "claim_boundary_scan_pass"
    ],
    claims_blocked: [
      "telemetry-connected",
      "redteam-executed",
      "redteam-passed",
      "local-model-verified",
      "provider-diverse",
      "production-ready",
      "production-monitored",
      "release-gated"
    ]
  }
});
writeYaml("release/decisions/general/next_execution_decision_matrix.yaml", decisionMatrix);
writeYaml("release/blockers/general/blocked_execution_lanes.yaml", blockedExecutionLanes);
writeYaml("release/approvals/general/approval_phrase_index.yaml", approvalPhraseIndex);
writeYaml("release/requirements/general/environment_requirement_index.yaml", environmentRequirementIndex);
writeYaml("release/commands/general/command_plan_index.yaml", commandPlanIndex);
writeYaml("release/claims/general/claim_impact_matrix.yaml", claimImpactMatrix);

writeJsonBoth("evidence/beta-execution-readiness-dashboard/execution_readiness_dashboard.json", dashboard);
writeJsonBoth("evidence/beta-execution-readiness-dashboard/blocked_execution_lanes.json", blockedExecutionLanes);
writeJsonBoth("evidence/beta-execution-readiness-dashboard/blocker_resolution_plan.json", blockerResolutionPlan);
writeJsonBoth("evidence/beta-execution-readiness-dashboard/approval_phrase_index.json", approvalPhraseIndex);
writeJsonBoth("evidence/beta-execution-readiness-dashboard/environment_requirement_index.json", environmentRequirementIndex);
writeJsonBoth("evidence/beta-execution-readiness-dashboard/command_plan_index.json", commandPlanIndex);
writeJsonBoth("evidence/beta-execution-readiness-dashboard/claim_impact_matrix.json", claimImpactMatrix);
writeJsonBoth("evidence/beta-execution-readiness-dashboard/unresolved_items.json", []);

const dashboardMd = `# Execution Readiness Dashboard

Stage: ${STAGE}

- New provider execution: false
- New local model execution: false
- New telemetry connection: false
- Local endpoint probe: false
- dist modified: false

## Lanes

${Object.entries(dashboard.lanes).map(([lane, value]) => `### ${lane}

- Status: ${value.status}
- Can execute now: ${value.can_execute_now}
- Can execute in operator shell after approval: ${value.can_execute_in_operator_shell_after_approval || false}
- Blocked by: ${value.blocked_by.join(", ")}
`).join("\n")}
`;
writeText(path.join(evidenceDir, "execution_readiness_dashboard.md"), dashboardMd);
writeText(p("docs", "execution_readiness_dashboard.md"), dashboardMd);

const blockerMd = `# Blocker Resolution Plan

Stage: ${STAGE}

${blockerResolutionPlan.map((item) => `## ${item.id}

- Lane: ${item.lane}
- Priority: ${item.priority}
- Blocker: ${item.blocker}
- Credential note: ${item.credential_note || "n/a"}
- Owner: ${item.owner}
- Next action: ${item.next_action}
- Exit criteria: ${item.exit_criteria}
- Evidence needed: ${item.evidence_needed.join(", ")}
`).join("\n")}
`;
writeText(p("docs", "blocker_resolution_plan.md"), blockerMd);

writeText(p("docs", "next_execution_decision_matrix.md"), `# Next Execution Decision Matrix

${decisionMatrix.decisions.map((item) => `- If ${item.if_condition}, next candidate is \`${item.next_stage_candidate}\`; can start now: ${item.can_start_now}.`).join("\n")}
`);
writeText(p("docs", "approval_and_environment_requirements.md"), `# Approval And Environment Requirements

## Approval Phrases

${approvalPhraseIndex.approval_phrases.map((item) => `- ${item.lane}: \`${item.phrase}\``).join("\n")}

## Environment Requirement Lanes

${Object.entries(environmentRequirementIndex.lanes).map(([lane, value]) => `- ${lane}: ${(value.required || []).join(", ")}`).join("\n")}
`);
writeText(p("docs", "path_portability_audit.md"), `# Path Portability Audit

The audit checks current readiness dashboard artifacts and reusable configuration for Windows absolute path leakage. Session handoff files may include operator-local paths as reference context.
`);
writeText(p("docs", "operator_next_steps.md"), `# Operator Next Steps

One of the following must be provided before any blocked execution lane can proceed:

1. Exact OpenAI redteam approval phrase; \`OPENAI_API_KEY\` and \`OPENAI_MODEL\` can be supplied in the operator PowerShell environment and must be verified at execution time.
2. Exact telemetry approval phrase plus OTEL or Langfuse sink credentials.
3. Localhost-only vLLM/Ollama endpoint plus local canary env.

No execution is allowed by this dashboard alone.
`);
writeText(p("docs", "session_handoff_latest.md"), `# Session Handoff Latest

Latest stage: ${STAGE}

Latest gate expected result: pass for dashboard generation, with all execution lanes still blocked.

Read \`session_handoff_2026-05-22.md\` for full continuity context.
`);

writeYaml("evals/suites/beta_execution_readiness_dashboard.yaml", {
  stage: STAGE,
  suite: "beta_execution_readiness_dashboard",
  new_provider_execution: false,
  new_local_model_execution: false,
  new_telemetry_connection: false,
  local_endpoint_probe: false,
  required_artifacts: [
    "evidence/beta-execution-readiness-dashboard/execution_readiness_dashboard.json",
    "evidence/beta-execution-readiness-dashboard/blocker_resolution_plan.json",
    "evidence/beta-execution-readiness-dashboard/path_portability_audit.json",
    "evidence/beta-execution-readiness-dashboard/execution_readiness_gate_report.json"
  ],
  claims_allowed: claimsAllowed,
  claims_not_allowed: claimsNotAllowed
});

const report = {
  status: "pass",
  stage: STAGE,
  new_provider_execution: false,
  new_local_model_execution: false,
  new_telemetry_connection: false,
  local_endpoint_probe: false,
  dist_modified: false,
  lanes: Object.fromEntries(Object.entries(dashboard.lanes).map(([lane, value]) => [lane, {
    status: value.status,
    can_execute_now: value.can_execute_now,
    can_execute_in_operator_shell_after_approval: value.can_execute_in_operator_shell_after_approval || false,
    blocked_by: value.blocked_by
  }])),
  blocker_count: blockerResolutionPlan.length,
  p0_blocker_count: blockerResolutionPlan.filter((item) => item.priority === "P0").length,
  p1_blocker_count: blockerResolutionPlan.filter((item) => item.priority === "P1").length,
  approval_phrases_indexed: approvalPhraseIndex.approval_phrases.length,
  environment_requirement_lanes_indexed: Object.keys(environmentRequirementIndex.lanes).length,
  command_plans_indexed: commandPlanIndex.command_plans.length,
  claim_impact_matrix_status: "drafted",
  claims_allowed: claimsAllowed,
  claims_not_allowed: claimsNotAllowed,
  failures: []
};
const reportMd = `# Execution Readiness Dashboard Report

Status: ${report.status}

Stage: ${STAGE}

- New provider execution: false
- New local model execution: false
- New telemetry connection: false
- Local endpoint probe: false
- dist modified: false
- Blocker count: ${report.blocker_count}
- P0 blocker count: ${report.p0_blocker_count}
- P1 blocker count: ${report.p1_blocker_count}
- Approval phrases indexed: ${report.approval_phrases_indexed}
- Environment requirement lanes indexed: ${report.environment_requirement_lanes_indexed}
- Command plans indexed: ${report.command_plans_indexed}
`;
writeJson(p("evals", "reports", "execution_readiness_dashboard_report.json"), report);
writeText(p("evals", "reports", "execution_readiness_dashboard_report.md"), reportMd);

console.log(JSON.stringify(report, null, 2));

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { ensureDir, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-production-telemetry-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-production-telemetry-design");

const claimsAllowed = [
  "production-telemetry-design-drafted",
  "otel-genai-mapping-drafted",
  "langfuse-integration-plan-drafted",
  "telemetry-dashboard-spec-drafted",
  "telemetry-anomaly-thresholds-drafted",
  "telemetry-claim-gate-designed",
  "telemetry-blocker-updated"
];
const claimsNotAllowed = [
  "telemetry-connected",
  "production-monitored",
  "production-ready",
  "release-gated"
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

function snapshot(sourceRelPath, evidenceName) {
  writeText(path.join(evidenceDir, evidenceName), readText(p(sourceRelPath)));
}

ensureDir(evidenceDir);

writeYaml("release/scopes/beta/beta_production_telemetry_design_scope.yaml", {
  stage: STAGE,
  approved_actions: {
    telemetry_schema_design: true,
    otel_genai_mapping_design: true,
    langfuse_integration_plan: true,
    dashboard_spec_design: true,
    anomaly_threshold_draft: true,
    telemetry_redaction_policy_design: true,
    production_telemetry_gate_design: true,
    blocker_update: true
  },
  forbidden_execution: {
    live_telemetry_connection: true,
    telemetry_sink_write: true,
    langfuse_api_call: true,
    opentelemetry_exporter_network_call: true,
    openai_provider_call: true,
    local_model_execution: true,
    local_endpoint_probe: true,
    production_deployment: true,
    production_monitored_claim: true,
    production_ready_claim: true,
    release_gated_claim: true,
    dist_modification: true
  },
  claims_allowed: claimsAllowed,
  claims_not_allowed: [
    "telemetry-connected",
    "production-monitored",
    "production-ready",
    "release-gated",
    "provider-verified",
    "adapter-checked",
    "integration-verified"
  ]
});

writeYaml("observability/production_telemetry_policy.yaml", {
  production_telemetry_policy: {
    status: "design_only",
    live_telemetry_connected: false,
    telemetry_sink_write_enabled: false,
    production_monitored_claim_allowed: false,
    required_before_connection: [
      "telemetry_schema_valid",
      "trace_schema_valid",
      "redaction_policy_valid",
      "otel_mapping_valid",
      "dashboard_spec_valid",
      "anomaly_thresholds_defined",
      "owner_action_matrix_updated",
      "explicit_connection_approval"
    ],
    required_before_production_monitored_claim: [
      "live_telemetry_connected",
      "telemetry_events_received",
      "latency_metrics_received",
      "token_metrics_received",
      "cost_metrics_received",
      "error_metrics_received",
      "anomaly_thresholds_active",
      "incident_response_path_defined"
    ]
  }
});

writeYaml("observability/telemetry_event_taxonomy.yaml", {
  event_families: {
    run_lifecycle: { events: ["run_started", "run_completed", "run_failed"] },
    provider_execution: { events: ["provider_request_sent", "provider_response_received", "provider_response_mapped"] },
    structured_output: { events: ["structured_output_request_mapped", "schema_validation_completed"] },
    tool_calling: {
      events: [
        "tool_call_detected",
        "tool_arguments_validated",
        "tool_approval_checked",
        "mock_tool_executed",
        "tool_output_reclassified_untrusted",
        "final_response_received"
      ]
    },
    redteam: { events: ["redteam_case_started", "redteam_case_evaluated", "redteam_case_failed", "redteam_case_passed"] },
    release_gate: { events: ["release_gate_dry_run_started", "release_gate_blocked", "release_gate_completed"] },
    safety: { events: ["approval_blocked", "prohibited_claim_detected", "redaction_failure_detected"] }
  }
});

writeYaml("observability/telemetry_metric_catalog.yaml", {
  metrics: {
    latency_ms: { type: "histogram", dimensions: ["stage", "adapter_id", "surface", "case_id"] },
    input_tokens: { type: "counter", dimensions: ["provider", "model", "surface"] },
    output_tokens: { type: "counter", dimensions: ["provider", "model", "surface"] },
    estimated_cost: { type: "gauge", dimensions: ["provider", "model", "stage"] },
    case_pass_rate: { type: "gauge", dimensions: ["suite", "surface"] },
    schema_validation_failure_count: { type: "counter", dimensions: ["schema_id", "surface"] },
    blocked_tool_execution_count: { type: "counter", dimensions: ["tool_name", "surface"] },
    redaction_failure_count: { type: "counter", dimensions: ["artifact_type"] },
    prohibited_claim_count: { type: "counter", dimensions: ["claim", "file_type"] }
  }
});

writeYaml("observability/telemetry_redaction_policy.yaml", {
  telemetry_redaction_policy: {
    raw_prompt_stored: false,
    raw_response_stored: false,
    api_keys_logged: false,
    authorization_headers_logged: false,
    env_values_logged: false,
    tool_raw_payload_stored: false,
    allowed_previews: {
      output_preview_max_chars: 300,
      input_preview_max_chars: 300
    },
    hash_policy: {
      hash_raw_inputs: true,
      hash_raw_outputs: true,
      hash_tool_payloads: true
    },
    required_redaction_checks: [
      "api_key_pattern",
      "authorization_header_pattern",
      "env_value_pattern",
      "raw_response_dump_pattern"
    ]
  }
});

writeYaml("observability/telemetry_retention_policy.yaml", {
  telemetry_retention_policy: {
    status: "draft",
    raw_payload_retention: "not_allowed",
    redacted_trace_retention_days: 30,
    aggregate_metric_retention_days: 180,
    secret_bearing_data_retention: "not_allowed",
    deletion_review_owner: "agent_or_operator"
  }
});

writeYaml("observability/telemetry_anomaly_thresholds.yaml", {
  anomaly_thresholds: {
    status: "draft",
    active_in_production: false,
    latency: {
      p95_ms_warning: 10000,
      p95_ms_critical: 30000
    },
    cost: {
      per_run_cost_warning_usd: 1.00,
      per_run_cost_critical_usd: 5.00
    },
    quality: {
      case_pass_rate_warning_below: 0.95,
      case_pass_rate_critical_below: 0.90
    },
    safety: {
      redaction_failure_count_critical: 1,
      blocked_tool_execution_count_critical: 1,
      prohibited_claim_count_critical: 1
    },
    redteam: {
      critical_failure_count_critical: 1,
      high_failure_count_critical: 1
    }
  }
});

writeYaml("observability/telemetry_dashboard_spec.yaml", {
  telemetry_dashboard_spec: {
    status: "draft",
    live_dashboard_available: false,
    panels: [
      { id: "latency", metric: "latency_ms", view: "p50_p95_p99_by_surface" },
      { id: "tokens", metric: "input_tokens_output_tokens", view: "tokens_by_provider_model_surface" },
      { id: "cost", metric: "estimated_cost", view: "cost_by_stage_provider_model" },
      { id: "quality", metric: "case_pass_rate", view: "pass_rate_by_suite_surface" },
      { id: "schema", metric: "schema_validation_failure_count", view: "schema_failures_by_schema_surface" },
      { id: "safety", metric: "redaction_failure_count", view: "redaction_and_claim_boundary_failures" }
    ],
    required_before_dashboard_available: [
      "live_telemetry_connected",
      "first_live_trace_received",
      "first_live_metric_received",
      "dashboard_owner_assigned"
    ]
  }
});

writeYaml("observability/otel/genai_semantic_mapping.yaml", {
  otel_genai_mapping: {
    source_reference: "https://opentelemetry.io/docs/specs/semconv/gen-ai/",
    internal_to_otel: {
      provider: { maps_to: "gen_ai.system", notes: "provider or model ecosystem identifier" },
      model: { maps_to: "gen_ai.request.model", notes: "model id from env or adapter config" },
      input_tokens: { maps_to: "gen_ai.usage.input_tokens" },
      output_tokens: { maps_to: "gen_ai.usage.output_tokens" },
      latency_ms: { maps_to: "span.duration" },
      tool_name: { maps_to: "gen_ai.tool.name" },
      operation_name: { maps_to: "gen_ai.operation.name" },
      response_model: { maps_to: "gen_ai.response.model" },
      request_max_tokens: { maps_to: "gen_ai.request.max_tokens" },
      finish_reason: { maps_to: "gen_ai.response.finish_reasons" }
    },
    stability: {
      status: "design_only",
      live_emission_enabled: false,
      semconv_status_note: "GenAI conventions are treated as mapping input only until exporter connection is approved."
    }
  }
});

writeYaml("observability/otel/trace_attribute_mapping.yaml", {
  trace_attribute_mapping: {
    status: "design_only",
    live_emission_enabled: false,
    attributes: {
      run_id: "prompt_stack.run_id",
      stage: "prompt_stack.stage",
      adapter_id: "prompt_stack.adapter_id",
      case_id: "prompt_stack.case_id",
      suite_id: "prompt_stack.suite_id",
      claim_level: "prompt_stack.claim_level",
      redaction_status: "prompt_stack.redaction.status"
    }
  }
});

writeYaml("observability/otel/metric_mapping.yaml", {
  metric_mapping: {
    status: "design_only",
    live_emission_enabled: false,
    metrics: {
      latency_ms: { otel_name: "gen_ai.client.operation.duration", unit: "ms" },
      input_tokens: { otel_name: "gen_ai.client.token.usage", attribute: "input" },
      output_tokens: { otel_name: "gen_ai.client.token.usage", attribute: "output" },
      estimated_cost: { otel_name: "prompt_stack.estimated_cost", unit: "USD" },
      case_pass_rate: { otel_name: "prompt_stack.case_pass_rate", unit: "1" }
    }
  }
});

writeYaml("observability/otel/exporter_policy.yaml", {
  exporter_policy: {
    status: "design_only",
    opentelemetry_exporter_network_call_allowed: false,
    live_export_enabled: false,
    required_before_export: [
      "explicit_connection_approval",
      "endpoint_configured",
      "redaction_policy_valid",
      "first_dry_run_payload_reviewed"
    ]
  }
});

writeYaml("observability/langfuse/integration_plan.yaml", {
  langfuse_integration_plan: {
    source_reference: "https://langfuse.com/docs/observability/overview",
    status: "design_only",
    live_connection_enabled: false,
    api_call_allowed: false,
    planned_trace_fields: [
      "run_id",
      "stage",
      "adapter_id",
      "provider",
      "model",
      "latency_ms",
      "input_tokens",
      "output_tokens",
      "cost_estimate",
      "redaction_status",
      "case_id",
      "suite_id",
      "claim_level"
    ],
    planned_scores: [
      "case_pass",
      "schema_valid",
      "redaction_pass",
      "approval_boundary_pass",
      "claim_boundary_pass"
    ],
    required_before_connection: [
      "explicit_connection_approval",
      "LANGFUSE_PUBLIC_KEY_present",
      "LANGFUSE_SECRET_KEY_present",
      "LANGFUSE_HOST_present",
      "redaction_policy_valid"
    ]
  }
});

writeYaml("observability/langfuse/trace_mapping.yaml", {
  langfuse_trace_mapping: {
    status: "design_only",
    live_connection_enabled: false,
    trace: {
      id: "run_id",
      name: "stage",
      metadata: ["adapter_id", "provider", "model", "surface", "case_id", "suite_id", "claim_level"],
      observations: ["provider_call", "tool_call", "schema_validation", "redteam_case"]
    }
  }
});

writeYaml("observability/langfuse/score_mapping.yaml", {
  langfuse_score_mapping: {
    status: "design_only",
    live_connection_enabled: false,
    scores: {
      case_pass: { value_type: "boolean", source: "case_result.status" },
      schema_valid: { value_type: "boolean", source: "schema_validation.status" },
      redaction_pass: { value_type: "boolean", source: "redaction_report.status" },
      approval_boundary_pass: { value_type: "boolean", source: "approval_boundary_report.status" },
      claim_boundary_pass: { value_type: "boolean", source: "claim_scan.status" }
    }
  }
});

writeYaml("observability/langfuse/dashboard_plan.yaml", {
  langfuse_dashboard_plan: {
    status: "design_only",
    live_dashboard_available: false,
    planned_views: [
      "run latency and token usage",
      "cost by stage and provider",
      "case pass rate by suite",
      "redaction and claim boundary failures",
      "redteam severity outcome"
    ]
  }
});

writeYaml("release/gates/telemetry/production_telemetry_gate.yaml", {
  production_telemetry_gate: {
    status: "design_only",
    can_claim_telemetry_connected: false,
    can_claim_production_monitored: false,
    can_claim_production_ready: false,
    required_before_telemetry_connected: [
      "explicit_connection_approval",
      "telemetry_sink_credentials_present",
      "telemetry_schema_valid",
      "redaction_policy_valid",
      "first_live_trace_received",
      "first_live_metric_received"
    ],
    required_before_production_monitored: [
      "telemetry_connected",
      "anomaly_thresholds_active",
      "dashboard_available",
      "owner_action_matrix_finalized",
      "incident_response_path_defined",
      "rollback_trigger_defined"
    ],
    claims_blocked: [
      "telemetry-connected",
      "production-monitored",
      "production-ready",
      "release-gated"
    ]
  }
});

const blockerUpdate = {
  blocker_id: "RGB-004",
  previous_status: "production_telemetry_not_connected",
  new_status: "production_telemetry_design_complete_connection_pending",
  still_blocks: [
    "telemetry-connected",
    "production-monitored",
    "production-ready",
    "release-gated"
  ],
  unblocks: [
    "telemetry_connection_planning"
  ],
  does_not_unblock: [
    "telemetry-connected",
    "production-monitored",
    "production-ready",
    "release-gated"
  ]
};
writeYaml("release/blockers/telemetry/telemetry_blocker_update.yaml", blockerUpdate);
writeJson(path.join(evidenceDir, "telemetry_blocker_update.json"), blockerUpdate);

writeYaml("evals/suites/beta_production_telemetry_design.yaml", {
  stage: STAGE,
  suite: "beta_production_telemetry_design",
  design_only: true,
  live_telemetry_connected: false,
  telemetry_sink_write_enabled: false,
  required_artifacts: [
    "observability/production_telemetry_policy.yaml",
    "observability/telemetry_event_taxonomy.yaml",
    "observability/telemetry_metric_catalog.yaml",
    "observability/otel/genai_semantic_mapping.yaml",
    "observability/langfuse/integration_plan.yaml",
    "release/gates/telemetry/production_telemetry_gate.yaml"
  ],
  claims_allowed: claimsAllowed,
  claims_not_allowed: claimsNotAllowed
});

snapshot("observability/telemetry.schema.json", "telemetry_schema_snapshot.json");
snapshot("observability/trace.schema.json", "trace_schema_snapshot.json");
snapshot("observability/telemetry_event_taxonomy.yaml", "telemetry_event_taxonomy_snapshot.yaml");
snapshot("observability/telemetry_metric_catalog.yaml", "telemetry_metric_catalog_snapshot.yaml");
snapshot("observability/otel/genai_semantic_mapping.yaml", "otel_genai_mapping_snapshot.yaml");
snapshot("observability/langfuse/integration_plan.yaml", "langfuse_integration_plan_snapshot.yaml");
snapshot("observability/telemetry_dashboard_spec.yaml", "telemetry_dashboard_spec_snapshot.yaml");
snapshot("observability/telemetry_anomaly_thresholds.yaml", "telemetry_anomaly_thresholds_snapshot.yaml");
snapshot("observability/telemetry_redaction_policy.yaml", "telemetry_redaction_policy_snapshot.yaml");

const report = {
  status: "pass",
  stage: STAGE,
  design_only: true,
  live_telemetry_connected: false,
  telemetry_sink_write_enabled: false,
  provider_execution: false,
  local_model_execution: false,
  external_side_effects: false,
  otel_mapping_exists: exists("observability/otel/genai_semantic_mapping.yaml"),
  langfuse_integration_plan_exists: exists("observability/langfuse/integration_plan.yaml"),
  dashboard_spec_exists: exists("observability/telemetry_dashboard_spec.yaml"),
  anomaly_thresholds_exist: exists("observability/telemetry_anomaly_thresholds.yaml"),
  redaction_policy_exists: exists("observability/telemetry_redaction_policy.yaml"),
  production_telemetry_gate_exists: exists("release/gates/telemetry/production_telemetry_gate.yaml"),
  can_claim_telemetry_connected: false,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  claims_allowed: claimsAllowed,
  claims_not_allowed: claimsNotAllowed,
  failures: []
};
const md = `# Production Telemetry Design Report

Status: ${report.status}

Stage: ${STAGE}

- Design only: true
- Live telemetry connected: false
- Telemetry sink write enabled: false
- Provider execution: false
- Local model execution: false
- External side effects: false
- OTel mapping exists: ${report.otel_mapping_exists}
- Langfuse integration plan exists: ${report.langfuse_integration_plan_exists}
- Dashboard spec exists: ${report.dashboard_spec_exists}
- Anomaly thresholds exist: ${report.anomaly_thresholds_exist}
- Redaction policy exists: ${report.redaction_policy_exists}
- Production telemetry gate exists: ${report.production_telemetry_gate_exists}
- Can claim telemetry connected: false
- Can claim production monitored: false
- Can claim production ready: false
`;
writeJson(path.join(evidenceDir, "production_telemetry_design_report.json"), report);
writeText(path.join(evidenceDir, "production_telemetry_design_report.md"), md);
writeJson(p("evals", "reports", "production_telemetry_design_report.json"), report);
writeText(p("evals", "reports", "production_telemetry_design_report.md"), md);

const mappingReport = {
  status: "pass",
  stage: STAGE,
  otel_genai_mapping_exists: true,
  trace_attribute_mapping_exists: true,
  metric_mapping_exists: true,
  langfuse_trace_mapping_exists: true,
  langfuse_score_mapping_exists: true,
  live_export_enabled: false,
  live_connection_enabled: false
};
writeJson(p("evals", "reports", "telemetry_mapping_report.json"), mappingReport);
writeText(p("evals", "reports", "telemetry_mapping_report.md"), `# Telemetry Mapping Report

Status: pass

- OTel GenAI mapping exists: true
- Langfuse trace/score mapping exists: true
- Live export enabled: false
- Live connection enabled: false
`);

const docs = {
  "docs/observability/production_telemetry_design.md": `# Production Telemetry Design

Stage: ${STAGE}

Production telemetry is design-only in this stage. No live telemetry sink is connected and no telemetry exporter is allowed to write externally.

- Live telemetry connected: false
- Telemetry sink write enabled: false
- Production monitored claim allowed: false
`,
  "docs/observability/otel_genai_mapping.md": `# OTel GenAI Mapping

This design maps internal trace and telemetry fields to OpenTelemetry GenAI semantic convention names for future exporter implementation.

Source reference: https://opentelemetry.io/docs/specs/semconv/gen-ai/

Live export is disabled in this stage.
`,
  "docs/observability/langfuse_integration_plan.md": `# Langfuse Integration Plan

This plan maps redacted traces, token usage, latency, cost estimates, metadata, and evaluation scores to a future Langfuse integration.

Source reference: https://langfuse.com/docs/observability/overview

No Langfuse API call is allowed in this stage.
`,
  "docs/observability/telemetry_dashboard_spec.md": `# Telemetry Dashboard Spec

Draft panels cover latency, token usage, estimated cost, case pass rate, schema failures, redaction failures, and claim boundary failures.

The dashboard is not available until live telemetry connection and first live metric/trace receipt are approved and observed.
`,
  "docs/claims/telemetry_claim_gate.md": `# Telemetry Claim Gate

Telemetry design does not allow \`telemetry-connected\`, \`production-monitored\`, \`production-ready\`, or \`release-gated\`.

Those claims require a live telemetry connection, live events and metrics, active thresholds, dashboard availability, owner/action finalization, and an incident response path.
`,
  "docs/plans/next_telemetry_connection_plan.md": `# Next Telemetry Connection Plan

Future connection requires explicit approval, telemetry sink credentials, schema validation, redaction review, and a first live trace/metric receipt gate.
`,
  "docs/plans/next_openai_redteam_execution_after_approval.md": `# Next OpenAI Redteam Execution After Approval

OpenAI limited redteam execution still requires the exact approval phrase and credentials before provider calls are allowed.
`
};
for (const [relPath, text] of Object.entries(docs)) {
  writeText(p(relPath), text);
}

writeJson(path.join(evidenceDir, "unresolved_items.json"), []);

console.log(JSON.stringify(report, null, 2));

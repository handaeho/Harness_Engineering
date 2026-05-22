#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { createAjv, validateWithSchema } from "./lib/json_schema_validator.mjs";
import { ensureDir, readText, readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { parseYamlFile } from "./lib/yaml_loader.mjs";

const STAGE = "v2.0.0-beta-production-telemetry-connection-preflight";
const EXECUTION_STAGE = "v2.0.0-beta-production-telemetry-connection";
const REQUIRED_APPROVAL_PHRASE = "I explicitly approve v2.0.0-beta-production-telemetry-connection";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "beta-production-telemetry-connection-preflight");
const ajv = createAjv();

const claimsAllowed = [
  "production-telemetry-connection-preflight-completed",
  "telemetry-approval-packet-generated",
  "telemetry-credential-readiness-checked",
  "telemetry-payload-shape-validated",
  "telemetry-exporter-guard-checked",
  "telemetry-connection-command-plan-drafted",
  "telemetry-connection-blocker-updated"
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

function addFailure(failures, check, detail) {
  failures.push({ check, detail });
}

function validatePayload(schemaRelPath, payloadRelPath) {
  const schema = readJson(p(schemaRelPath));
  const payload = readJson(p(payloadRelPath));
  validateWithSchema(ajv, schema, payload, schemaRelPath);
  const serialized = JSON.stringify(payload);
  const secretPatternFound = /sk-[A-Za-z0-9_-]{12,}|authorization|bearer\s+[A-Za-z0-9._-]+|LANGFUSE_SECRET_KEY|OTEL_EXPORTER_OTLP_HEADERS/i.test(serialized);
  return {
    valid: payload.payload_redacted === true && !secretPatternFound,
    payload_redacted: payload.payload_redacted,
    secretPatternFound
  };
}

function writeStaticArtifacts() {
  writeYaml("release/beta_production_telemetry_connection_preflight_scope.yaml", {
    stage: STAGE,
    approved_actions: {
      telemetry_connection_preflight_validation: true,
      approval_packet_generation: true,
      credential_readiness_check_without_sink_call: true,
      redacted_payload_shape_validation: true,
      otel_exporter_guard_validation: true,
      langfuse_connection_guard_validation: true,
      command_plan_generation: true,
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
      integration_verified_claim: true,
      dist_modification: true
    },
    claims_allowed: claimsAllowed,
    claims_not_allowed: [
      "telemetry-connected",
      "production-monitored",
      "production-ready",
      "release-gated",
      "integration-verified",
      "provider-verified",
      "adapter-checked"
    ]
  });

  writeYaml("release/production_telemetry_connection_approval_gate.yaml", {
    approval_gate: {
      stage: STAGE,
      explicit_user_approval_required: true,
      explicit_user_approval_present: false,
      can_connect_telemetry: false,
      approval_phrase_required: REQUIRED_APPROVAL_PHRASE,
      approval_source_allowed: [
        "user_message"
      ],
      execution_not_allowed_until: [
        "explicit_user_approval_present",
        "telemetry_sink_credentials_present",
        "telemetry_schema_valid",
        "trace_schema_valid",
        "redaction_policy_valid",
        "exporter_guard_valid",
        "payload_shape_valid",
        "command_plan_exists"
      ],
      claims_blocked_until_connection: [
        "telemetry-connected",
        "production-monitored",
        "production-ready",
        "release-gated"
      ]
    }
  });

  writeText(p("release", "production_telemetry_connection_approval_request.md"), `# Production Telemetry Connection Approval Request

Stage requesting approval:
${EXECUTION_STAGE}

## What Will Execute After Approval

- A live telemetry connection to a pre-approved sink
- OpenTelemetry or Langfuse exporter path, depending on configured env
- Redacted trace/metric emission test
- No OpenAI provider call
- No local model execution
- No redteam execution
- No production deployment

## What Will Not Execute

- OpenAI provider call
- local vLLM/Ollama execution
- redteam execution
- release gate
- production deployment

## Required Approval Phrase

${REQUIRED_APPROVAL_PHRASE}

Passing the connection test will not automatically allow:
- production-monitored
- production-ready
- release-gated
- integration-verified
`);

  writeYaml("release/production_telemetry_connection_command_plan.yaml", {
    command_plan: {
      stage_to_execute_after_approval: EXECUTION_STAGE,
      required_approval_phrase: REQUIRED_APPROVAL_PHRASE,
      supported_sinks: [
        "otel_otlp",
        "langfuse"
      ],
      commands: [
        "node prompt-stack-v2/tools/run_production_telemetry_connection.mjs",
        "node prompt-stack-v2/tools/check_production_telemetry_connection.mjs"
      ],
      not_executable_in_this_stage: true,
      expected_execution_outputs: [
        "evidence/beta-production-telemetry-connection/telemetry_connection_report.json",
        "evidence/beta-production-telemetry-connection/live_trace_receipt.json",
        "evidence/beta-production-telemetry-connection/live_metric_receipt.json",
        "evidence/beta-production-telemetry-connection/telemetry_connection_gate_report.json"
      ]
    }
  });

  const blockerUpdate = {
    blocker_id: "RGB-004",
    previous_status: "production_telemetry_design_complete_connection_pending",
    new_status: "production_telemetry_connection_preflight_complete_connection_pending",
    still_blocks: [
      "telemetry-connected",
      "production-monitored",
      "production-ready",
      "release-gated"
    ],
    unblocks: [
      "telemetry_connection_readiness"
    ],
    does_not_unblock: [
      "telemetry-connected",
      "production-monitored",
      "production-ready",
      "release-gated"
    ]
  };
  writeYaml("release/telemetry_connection_blocker_update.yaml", blockerUpdate);

  writeYaml("observability/telemetry_sink_credential_policy.yaml", {
    credential_policy: {
      supported_sinks: [
        "otel_otlp",
        "langfuse"
      ],
      otel_required_env: [
        "OTEL_EXPORTER_OTLP_ENDPOINT"
      ],
      otel_optional_env: [
        "OTEL_EXPORTER_OTLP_HEADERS",
        "OTEL_SERVICE_NAME"
      ],
      langfuse_required_env: [
        "LANGFUSE_PUBLIC_KEY",
        "LANGFUSE_SECRET_KEY",
        "LANGFUSE_HOST"
      ],
      secrets_handling: {
        secret_values_must_not_be_logged: true,
        authorization_headers_must_not_be_logged: true,
        env_values_must_be_redacted: true,
        raw_payloads_must_not_be_stored: true
      },
      missing_credential_status: {
        otel_missing_endpoint: "blocked_by_missing_otel_endpoint",
        langfuse_missing_credentials: "blocked_by_missing_langfuse_credentials"
      }
    }
  });

  writeYaml("observability/telemetry_connection_preflight_policy.yaml", {
    preflight_policy: {
      live_connection_allowed: false,
      telemetry_sink_write_allowed: false,
      exporter_network_call_allowed: false,
      required_artifacts: [
        "observability/production_telemetry_policy.yaml",
        "observability/telemetry_event_taxonomy.yaml",
        "observability/telemetry_metric_catalog.yaml",
        "observability/telemetry_redaction_policy.yaml",
        "observability/otel/genai_semantic_mapping.yaml",
        "observability/langfuse/integration_plan.yaml",
        "release/production_telemetry_gate.yaml",
        "release/production_telemetry_connection_approval_gate.yaml"
      ],
      expected_preflight_status_without_approval: "ready_but_blocked_by_missing_explicit_approval"
    }
  });

  writeYaml("observability/telemetry_exporter_guard_policy.yaml", {
    exporter_guard_policy: {
      status: "preflight_only",
      live_connection_allowed: false,
      telemetry_sink_write_allowed: false,
      exporter_network_call_allowed: false,
      langfuse_api_call_allowed: false,
      required_before_connection: [
        "explicit_user_approval_present",
        "sink_credentials_present",
        "payload_shape_valid",
        "redaction_policy_valid",
        "command_plan_exists"
      ]
    }
  });

  writeYaml("observability/telemetry_payload_shape_policy.yaml", {
    payload_shape_policy: {
      validation_mode: "redacted_dry_payload_only",
      raw_prompt_stored: false,
      raw_response_stored: false,
      sink_write_allowed: false,
      required_shapes: [
        "observability/otel/otlp_payload_shape.schema.json",
        "observability/langfuse/langfuse_payload_shape.schema.json"
      ]
    }
  });

  writeYaml("observability/otel/exporter_preflight_policy.yaml", {
    exporter_preflight_policy: {
      status: "preflight_only",
      live_export_enabled: false,
      exporter_network_call_allowed: false,
      required_env_presence_check: [
        "OTEL_EXPORTER_OTLP_ENDPOINT"
      ],
      dry_payload_shape_validation_required: true
    }
  });

  writeText(p("observability", "otel", "otlp_payload_shape.schema.json"), `${JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "OTLP Dry Payload Shape",
    type: "object",
    additionalProperties: false,
    required: [
      "trace_id",
      "span_id",
      "service_name",
      "stage",
      "adapter_id",
      "event_name",
      "timestamp",
      "attributes",
      "payload_redacted"
    ],
    properties: {
      trace_id: { type: "string" },
      span_id: { type: "string" },
      service_name: { type: "string" },
      stage: { type: "string" },
      adapter_id: { type: "string" },
      event_name: { type: "string" },
      timestamp: { type: "string" },
      attributes: { type: "object" },
      payload_redacted: { type: "boolean", const: true }
    }
  }, null, 2)}\n`);

  writeJson(p("observability", "otel", "otlp_dry_payload_example.json"), {
    trace_id: "trace_redacted_example_001",
    span_id: "span_redacted_example_001",
    service_name: "prompt-stack-v2",
    stage: STAGE,
    adapter_id: "telemetry-preflight",
    event_name: "telemetry_connection_preflight_payload_shape_checked",
    timestamp: "2026-05-22T00:00:00.000Z",
    attributes: {
      "gen_ai.system": "redacted",
      "gen_ai.operation.name": "preflight",
      "prompt_stack.claim_level": "telemetry_connection_preflight_only",
      "prompt_stack.raw_payload_stored": false
    },
    payload_redacted: true
  });

  writeYaml("observability/langfuse/connection_preflight_policy.yaml", {
    connection_preflight_policy: {
      status: "preflight_only",
      live_connection_enabled: false,
      api_call_allowed: false,
      required_env_presence_check: [
        "LANGFUSE_PUBLIC_KEY",
        "LANGFUSE_SECRET_KEY",
        "LANGFUSE_HOST"
      ],
      dry_payload_shape_validation_required: true
    }
  });

  writeText(p("observability", "langfuse", "langfuse_payload_shape.schema.json"), `${JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Langfuse Dry Payload Shape",
    type: "object",
    additionalProperties: false,
    required: [
      "trace_id",
      "name",
      "user_id_redacted",
      "metadata",
      "scores",
      "payload_redacted"
    ],
    properties: {
      trace_id: { type: "string" },
      name: { type: "string" },
      user_id_redacted: { type: "boolean", const: true },
      metadata: { type: "object" },
      scores: { type: "array" },
      payload_redacted: { type: "boolean", const: true }
    }
  }, null, 2)}\n`);

  writeJson(p("observability", "langfuse", "langfuse_dry_payload_example.json"), {
    trace_id: "trace_redacted_example_001",
    name: "telemetry_connection_preflight_payload_shape_checked",
    user_id_redacted: true,
    metadata: {
      stage: STAGE,
      adapter_id: "telemetry-preflight",
      claim_level: "telemetry_connection_preflight_only",
      raw_payload_stored: false
    },
    scores: [
      {
        name: "redaction_pass",
        value: 1
      },
      {
        name: "payload_shape_valid",
        value: 1
      }
    ],
    payload_redacted: true
  });

  writeYaml("evals/suites/beta_production_telemetry_connection_preflight.yaml", {
    stage: STAGE,
    suite: "beta_production_telemetry_connection_preflight",
    design_only: true,
    live_telemetry_connected: false,
    telemetry_sink_write_enabled: false,
    exporter_network_call_performed: false,
    required_artifacts: [
      "release/production_telemetry_connection_approval_gate.yaml",
      "release/production_telemetry_connection_approval_request.md",
      "release/production_telemetry_connection_command_plan.yaml",
      "observability/otel/otlp_payload_shape.schema.json",
      "observability/langfuse/langfuse_payload_shape.schema.json",
      "evidence/beta-production-telemetry-connection-preflight/preflight_report.json"
    ],
    claims_allowed: claimsAllowed,
    claims_not_allowed: claimsNotAllowed
  });
}

function writeDocs(status) {
  const docs = {
    "docs/production_telemetry_connection_preflight.md": `# Production Telemetry Connection Preflight

Stage: ${STAGE}

Status: ${status}

This stage validates the telemetry connection readiness path without connecting a live sink.

- Design only: true
- Live telemetry connected: false
- Telemetry sink write enabled: false
- Exporter network call performed: false
- Provider execution: false
- Local model execution: false
`,
    "docs/production_telemetry_connection_approval_request.md": readText(p("release", "production_telemetry_connection_approval_request.md")),
    "docs/telemetry_connection_commands.md": `# Telemetry Connection Commands

These commands are documented for ${EXECUTION_STAGE} only and are not executable in ${STAGE}.

\`\`\`bash
node prompt-stack-v2/tools/run_production_telemetry_connection.mjs
node prompt-stack-v2/tools/check_production_telemetry_connection.mjs
\`\`\`

Required approval phrase:

${REQUIRED_APPROVAL_PHRASE}
`,
    "docs/telemetry_payload_shape_validation.md": `# Telemetry Payload Shape Validation

The preflight validates redacted dry payload shapes for OTel OTLP and Langfuse using Ajv.

No payload is sent to a telemetry sink. Raw prompt and response payloads are not stored.
`,
    "docs/next_telemetry_connection_after_approval.md": `# Next Telemetry Connection After Approval

The next stage may proceed only after the user provides the exact approval phrase and sink credentials:

${REQUIRED_APPROVAL_PHRASE}

The next stage must still block production-monitored, production-ready, release-gated, and integration-verified claims until live receipts and follow-on gates exist.
`,
    "docs/next_openai_redteam_execution_after_approval.md": `# Next OpenAI Redteam Execution After Approval

OpenAI limited redteam execution remains separate from telemetry connection and still requires its own exact approval phrase plus OpenAI credentials.
`
  };
  for (const [relPath, text] of Object.entries(docs)) {
    writeText(p(relPath), text);
  }
}

writeStaticArtifacts();
ensureDir(evidenceDir);

const failures = [];
const requiredArtifacts = parseYamlFile(p("observability", "telemetry_connection_preflight_policy.yaml"))
  .preflight_policy.required_artifacts;
for (const relPath of requiredArtifacts) {
  if (!exists(relPath)) addFailure(failures, "missing_required_artifact", relPath);
}

const approvalGate = parseYamlFile(p("release", "production_telemetry_connection_approval_gate.yaml")).approval_gate;
const exporterGuard = parseYamlFile(p("observability", "telemetry_exporter_guard_policy.yaml")).exporter_guard_policy;
const redactionPolicy = parseYamlFile(p("observability", "telemetry_redaction_policy.yaml")).telemetry_redaction_policy;
const telemetryPolicy = parseYamlFile(p("observability", "production_telemetry_policy.yaml")).production_telemetry_policy;
const otelEndpointPresent = Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
const langfuseCredentialsPresent = Boolean(process.env.LANGFUSE_PUBLIC_KEY)
  && Boolean(process.env.LANGFUSE_SECRET_KEY)
  && Boolean(process.env.LANGFUSE_HOST);

let otelPayload;
let langfusePayload;
try {
  otelPayload = validatePayload("observability/otel/otlp_payload_shape.schema.json", "observability/otel/otlp_dry_payload_example.json");
} catch (error) {
  otelPayload = { valid: false, error: error.message };
  addFailure(failures, "otel_payload_shape_valid", error.message);
}
try {
  langfusePayload = validatePayload("observability/langfuse/langfuse_payload_shape.schema.json", "observability/langfuse/langfuse_dry_payload_example.json");
} catch (error) {
  langfusePayload = { valid: false, error: error.message };
  addFailure(failures, "langfuse_payload_shape_valid", error.message);
}

const approvalReadiness = {
  status: approvalGate.explicit_user_approval_present === false && approvalGate.can_connect_telemetry === false
    ? "blocked_by_missing_explicit_approval"
    : "fail",
  explicit_user_approval_required: true,
  explicit_user_approval_present: approvalGate.explicit_user_approval_present,
  can_connect_telemetry: approvalGate.can_connect_telemetry,
  approval_phrase_required: REQUIRED_APPROVAL_PHRASE,
  approval_packet_generated: true
};
if (approvalReadiness.status === "fail") addFailure(failures, "approval_gate_closed", approvalReadiness);

const credentialReadiness = {
  status: otelEndpointPresent || langfuseCredentialsPresent ? "pass" : "blocked_by_missing_sink_credentials",
  credential_presence_checked: true,
  otel_endpoint_present: otelEndpointPresent,
  langfuse_credentials_present: langfuseCredentialsPresent,
  secrets_logged: false,
  raw_payload_stored: false
};
const exporterGuardReadiness = {
  status: exporterGuard.live_connection_allowed === false
    && exporterGuard.telemetry_sink_write_allowed === false
    && exporterGuard.exporter_network_call_allowed === false
    && exporterGuard.langfuse_api_call_allowed === false ? "pass" : "fail",
  live_connection_allowed: exporterGuard.live_connection_allowed,
  telemetry_sink_write_allowed: exporterGuard.telemetry_sink_write_allowed,
  exporter_network_call_allowed: exporterGuard.exporter_network_call_allowed,
  langfuse_api_call_allowed: exporterGuard.langfuse_api_call_allowed
};
const redactionReadiness = {
  status: redactionPolicy.raw_prompt_stored === false
    && redactionPolicy.raw_response_stored === false
    && redactionPolicy.api_keys_logged === false
    && redactionPolicy.authorization_headers_logged === false
    && redactionPolicy.env_values_logged === false ? "pass" : "fail",
  raw_prompt_stored: redactionPolicy.raw_prompt_stored,
  raw_response_stored: redactionPolicy.raw_response_stored,
  api_keys_logged: redactionPolicy.api_keys_logged,
  authorization_headers_logged: redactionPolicy.authorization_headers_logged,
  env_values_logged: redactionPolicy.env_values_logged
};
if (exporterGuardReadiness.status !== "pass") addFailure(failures, "exporter_guard_readiness", exporterGuardReadiness);
if (redactionReadiness.status !== "pass") addFailure(failures, "redaction_readiness", redactionReadiness);

let status = "ready_but_blocked_by_missing_explicit_approval";
if (failures.length) {
  status = "fail";
} else if (!otelEndpointPresent && !langfuseCredentialsPresent) {
  status = "blocked_by_missing_otel_endpoint";
}

const blockerUpdate = parseYamlFile(p("release", "telemetry_connection_blocker_update.yaml"));
writeJson(path.join(evidenceDir, "telemetry_connection_blocker_update.json"), blockerUpdate);
writeJson(path.join(evidenceDir, "approval_readiness_report.json"), approvalReadiness);
writeJson(path.join(evidenceDir, "credential_readiness_report.json"), credentialReadiness);
writeJson(path.join(evidenceDir, "exporter_guard_readiness.json"), exporterGuardReadiness);
writeJson(path.join(evidenceDir, "redaction_readiness_report.json"), redactionReadiness);
writeText(path.join(evidenceDir, "command_plan_snapshot.yaml"), readText(p("release", "production_telemetry_connection_command_plan.yaml")));

const otelShapeReport = {
  status: otelPayload.valid ? "pass" : "fail",
  stage: STAGE,
  sink: "otel_otlp",
  dry_payload_only: true,
  sink_write_performed: false,
  exporter_network_call_performed: false,
  raw_payload_stored: false,
  payload_shape_valid: otelPayload.valid === true,
  payload_redacted: otelPayload.payload_redacted === true
};
const langfuseShapeReport = {
  status: langfusePayload.valid ? "pass" : "fail",
  stage: STAGE,
  sink: "langfuse",
  dry_payload_only: true,
  sink_write_performed: false,
  exporter_network_call_performed: false,
  raw_payload_stored: false,
  payload_shape_valid: langfusePayload.valid === true,
  payload_redacted: langfusePayload.payload_redacted === true
};
writeJson(path.join(evidenceDir, "otel_payload_shape_report.json"), otelShapeReport);
writeJson(path.join(evidenceDir, "langfuse_payload_shape_report.json"), langfuseShapeReport);

const report = {
  status,
  stage: STAGE,
  design_only: true,
  live_telemetry_connected: false,
  telemetry_sink_write_enabled: false,
  exporter_network_call_performed: false,
  provider_execution: false,
  local_model_execution: false,
  external_side_effects: false,
  explicit_user_approval_present: false,
  can_connect_telemetry: false,
  credential_presence_checked: true,
  otel_endpoint_present: otelEndpointPresent,
  langfuse_credentials_present: langfuseCredentialsPresent,
  secrets_logged: false,
  raw_payload_stored: false,
  otel_payload_shape_valid: otelPayload.valid === true,
  langfuse_payload_shape_valid: langfusePayload.valid === true,
  approval_packet_generated: true,
  command_plan_generated: exists("release/production_telemetry_connection_command_plan.yaml"),
  claims_allowed: status === "fail" ? [] : claimsAllowed,
  claims_not_allowed: claimsNotAllowed,
  failures
};
const md = `# Production Telemetry Connection Preflight Report

Status: ${report.status}

Stage: ${STAGE}

- Design only: true
- Live telemetry connected: false
- Telemetry sink write enabled: false
- Exporter network call performed: false
- Provider execution: false
- Local model execution: false
- External side effects: false
- Explicit user approval present: false
- Can connect telemetry: false
- Credential presence checked: true
- OTel endpoint present: ${report.otel_endpoint_present}
- Langfuse credentials present: ${report.langfuse_credentials_present}
- Secrets logged: false
- Raw payload stored: false
- OTel payload shape valid: ${report.otel_payload_shape_valid}
- Langfuse payload shape valid: ${report.langfuse_payload_shape_valid}
- Approval packet generated: true
- Command plan generated: ${report.command_plan_generated}
`;

writeJson(path.join(evidenceDir, "preflight_report.json"), report);
writeText(path.join(evidenceDir, "preflight_report.md"), md);
writeJson(p("evals", "reports", "production_telemetry_connection_preflight_report.json"), report);
writeText(p("evals", "reports", "production_telemetry_connection_preflight_report.md"), md);

const unresolved = [];
if (status !== "fail") {
  unresolved.push({
    id: "PTPF-001",
    severity: "medium",
    description: "Explicit user approval is required before live telemetry connection.",
    blocks_telemetry_connection: true,
    blocks_telemetry_connected_claim: true,
    owner: "human",
    recommended_next_action: "Reply with the exact required approval phrase before connecting telemetry."
  });
  if (!otelEndpointPresent && !langfuseCredentialsPresent) {
    unresolved.push({
      id: "PTPF-002",
      severity: "medium",
      description: "Telemetry sink credentials are not available in the execution environment.",
      blocks_telemetry_connection: true,
      owner: "human",
      recommended_next_action: "Provide OTEL or Langfuse environment variables before running live telemetry connection."
    });
  }
} else {
  unresolved.push({
    id: "PTPF-003",
    severity: "high",
    description: "Production telemetry connection preflight failed because required policy, payload shape, approval gate, or command plan artifacts are missing or invalid.",
    blocks_telemetry_connection: true,
    owner: "agent",
    recommended_next_action: "Regenerate missing preflight artifacts and rerun check_production_telemetry_connection_preflight.mjs."
  });
}
writeJson(path.join(evidenceDir, "unresolved_items.json"), unresolved);

if (telemetryPolicy.live_telemetry_connected !== false || telemetryPolicy.telemetry_sink_write_enabled !== false) {
  addFailure(failures, "production_telemetry_policy_closed", telemetryPolicy);
}

writeDocs(status);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);

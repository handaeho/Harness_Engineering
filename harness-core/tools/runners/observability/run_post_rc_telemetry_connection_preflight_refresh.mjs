#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { ensureDir, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-telemetry-connection-preflight-refresh";
const SEQUENCE_STAGE = "v2.0.0-post-rc-operator-sequence-record";
const LOCAL_STAGE = "post-rc-local-endpoint-future-integration-record";
const APPROVAL_PHRASE = "I explicitly approve v2.0.0-post-rc-telemetry-connection";

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function writeYaml(relPath, value) {
  writeText(p(...relPath.split("/")), YAML.stringify(value, { lineWidth: 0 }));
}

function write(relPath, value) {
  writeText(p(...relPath.split("/")), value);
}

function writeJsonRel(relPath, value) {
  writeJson(p(...relPath.split("/")), value);
}

function mdList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function configuredTelemetrySink() {
  const otelEndpointPresent = Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
  const langfuseCredentialsPresent = Boolean(
    process.env.LANGFUSE_PUBLIC_KEY
      && process.env.LANGFUSE_SECRET_KEY
      && process.env.LANGFUSE_HOST
  );
  const configured_sink = otelEndpointPresent
    ? "otel_otlp"
    : langfuseCredentialsPresent
      ? "langfuse"
      : "none";

  return {
    configured_sink,
    otel_endpoint_present: otelEndpointPresent,
    langfuse_credentials_present: langfuseCredentialsPresent
  };
}

const blockedClaims = [
  "stable",
  "release-gated",
  "production-ready",
  "production-monitored",
  "telemetry-connected",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified"
];

const maintainedClaims = [
  "containment-verified",
  "rc1-openai-scope-release-gated",
  "rc1-post-release-gate-review-completed",
  "rc1-openai-scope-frozen",
  "rc1-final-handoff-recorded"
];

const localFutureClaims = [
  "post-rc-local-endpoint-future-integration-recorded",
  "post-rc-local-endpoint-operator-handoff-documented",
  "post-rc-local-endpoint-verification-plan-documented"
];

const telemetryPreflightClaims = [
  "post-rc-telemetry-preflight-refreshed",
  "post-rc-telemetry-approval-requirements-recorded",
  "post-rc-telemetry-command-plan-drafted",
  "post-rc-telemetry-local-endpoint-deferral-confirmed"
];

function writeSequenceArtifacts() {
  const document = `# Post-RC 작업 순서 임시 기록

이 문서는 현재 post-RC goal에서 수행할 작업 순서를 한국어로 임시 기록한다. 이 기록은 새 release claim을 자동으로 허용하지 않는다.

## 실행 순서

정렬 순서: telemetry first → local future lane → stable later.

1. 먼저 telemetry approval과 credentials가 별도로 제공된 뒤 telemetry connection을 진행한다.
2. 그 다음 local endpoint는 현재 goal에서 제외하고 future integration lane으로 문서화한다.
3. operator가 local endpoint 준비 완료를 알리면 local endpoint readiness preflight부터 진행한다.
4. 이후 local no-tool canary와 결과 review는 별도 future stage에서만 진행한다.
5. stable scope decision은 telemetry 결과와 local lane이 해결되거나 명시적으로 out-of-scope 처리된 뒤 별도 요청이 있을 때만 진행한다.

## 현재 goal에서 보류하는 작업

local endpoint는 operator가 준비 완료를 알릴 때까지 defer한다.

- local endpoint probe 금지
- vLLM 실행 금지
- Ollama 실행 금지
- local no-tool canary 금지
- stable claim 자동 허용 없음
- production-ready claim 자동 허용 없음
- provider-diverse claim 자동 허용 없음
- local-model-verified claim 자동 허용 없음

## 현재 유지되는 제한적 claim

- rc1-openai-scope-release-gated
- rc1-post-release-gate-review-completed
- rc1-openai-scope-frozen
- containment-verified

## 계속 금지되는 claim

- blocked: stable
- blocked: bare release-gated
- blocked: production-ready
- blocked: production-monitored
- blocked: telemetry-connected
- blocked: provider-diverse
- blocked: provider-verified
- blocked: adapter-checked
- blocked: local-model-verified
`;

  write("POST_RC_WORK_SEQUENCE_TEMP.ko.md", document);

  const record = {
    status: "recorded",
    stage: SEQUENCE_STAGE,
    document_path: "POST_RC_WORK_SEQUENCE_TEMP.ko.md",
    document_language: "ko",
    telemetry_first: true,
    local_endpoint_documented_as_future_lane: true,
    local_endpoint_deferred: true,
    stable_decision_after_telemetry_and_local_or_out_of_scope: true,
    new_execution: false,
    openai_provider_call: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    telemetry_connection: false,
    telemetry_sink_write: false,
    release_gate_rerun: false,
    dist_modified: false,
    reference_baseline_source_modified: false,
    raw_response_stored: false,
    raw_request_stored: false,
    raw_payload_stored: false,
    secrets_logged: false,
    post_rc_sequence: [
      {
        order: 1,
        name: "telemetry_connection_after_approval_and_credentials",
        status: "next"
      },
      {
        order: 2,
        name: "local_endpoint_future_integration_lane",
        status: "documented_deferred_future_lane"
      },
      {
        order: 3,
        name: "local_no_tool_canary_after_endpoint_ready",
        status: "future_only_after_operator_signal"
      },
      {
        order: 4,
        name: "stable_scope_decision",
        status: "after_telemetry_and_local_resolved_or_explicitly_out_of_scope"
      }
    ],
    local_endpoint_policy: {
      local_endpoint_status: "deferred_until_operator_provides_endpoint",
      local_endpoint_probe_allowed: false,
      local_model_execution_allowed: false,
      operator_must_signal_readiness: true,
      local_endpoint_not_ready_is_not_current_goal_blocker: true
    },
    claims_allowed_by_this_record: [],
    claims_still_blocked: [
      "stable",
      "release-gated",
      "production-ready",
      "production-monitored",
      "provider-diverse",
      "provider-verified",
      "adapter-checked",
      "local-model-verified"
    ]
  };
  writeJsonRel("evidence/post-rc-operator-sequence-record/post_rc_work_sequence_record.json", record);
  write("evidence/post-rc-operator-sequence-record/post_rc_work_sequence_record.md", `# Post-RC Operator Sequence Record

Status: recorded

Telemetry path is first. Local endpoint remains a deferred future lane. Stable decision remains later and does not become allowed by this record.

Safety flags:

- openai_provider_call: false
- local_endpoint_probe: false
- local_model_execution: false
- telemetry_connection: false
- telemetry_sink_write: false
- secrets_logged: false
- raw_payload_stored: false
`);
  writeJsonRel("evals/reports/post_rc_work_sequence_record_report.json", record);
  write("evals/reports/post_rc_work_sequence_record_report.md", "# Post-RC Work Sequence Record Report\n\nStatus: recorded\n");
  writeYaml("release/scopes/post-rc/post_rc_operator_sequence_record_scope.yaml", {
    stage: SEQUENCE_STAGE,
    document_path: "POST_RC_WORK_SEQUENCE_TEMP.ko.md",
    document_language: "ko",
    telemetry_first: true,
    local_endpoint_future_lane: true,
    stable_decision_later: true,
    forbidden_execution: {
      openai_provider_call: true,
      local_endpoint_probe: true,
      local_model_execution: true,
      telemetry_connection: true,
      telemetry_sink_write: true,
      stable_decision: true
    },
    claims_not_allowed_now: blockedClaims
  });
  writeYaml("evals/suites/post_rc_operator_sequence_record.yaml", {
    suite: "post_rc_operator_sequence_record",
    stage: SEQUENCE_STAGE,
    checks: [
      "korean_root_document_exists",
      "telemetry_first",
      "local_endpoint_future_lane",
      "stable_later",
      "no_new_execution"
    ]
  });
}

function writeLocalEndpointFutureArtifacts() {
  write("docs/local/local_endpoint_future_integration.ko.md", `# Local Endpoint Future Integration 계획

이 문서는 현재 post-RC goal에서 local endpoint를 실행하지 않고, 향후 operator가 endpoint 준비 완료를 알렸을 때 안전하게 연결하기 위한 계획이다.

## 현재 상태

현재 local endpoint는 준비되지 않았다.

local_endpoint_status: deferred_until_operator_provides_endpoint
local_endpoint_probe: false
local_model_execution: false
local_no_tool_canary: deferred
local-model-verified: blocked
provider-diverse: blocked

## 현재 goal에서 하지 않는 작업

아래 작업은 현재 goal에서 수행하지 않는다.

- local endpoint probe
- localhost health check
- vLLM 실행
- Ollama 실행
- local no-tool canary
- local structured output canary
- local redteam
- local-model-verified claim 금지
- provider-diverse claim 금지

## 나중에 operator가 제공해야 할 정보

operator가 local endpoint 준비 완료를 알릴 때 아래 정보를 제공해야 한다.

- provider type: vllm 또는 ollama
- endpoint URL
- model name
- supported chat/template mode
- expected API shape
- auth 필요 여부
- timeout/retry 정책
- 실행 가능한 테스트 범위
- 허용된 local canary stage

## 향후 진행 순서

local endpoint가 준비되면 다음 순서로 진행한다.

1. v2.0.0-post-rc-local-endpoint-readiness-preflight
2. v2.0.0-post-rc-local-no-tool-canary
3. v2.0.0-post-rc-local-no-tool-canary-result-review
4. 필요 시 local structured output/tool/redteam 확장
5. provider-diverse 또는 local-model-verified blocked claim gate 검토

## claim boundary

local endpoint 준비만으로 아래 claim은 허용되지 않는다.

- local-model-verified
- provider-diverse
- provider-verified
- adapter-checked
- production-ready
- stable

각 claim은 별도 gate와 evidence가 필요하다.
`);

  write("docs/local/local_endpoint_future_unit_integration_verification.ko.md", `# Local Endpoint 향후 단위/통합 검증 계획

## 목적

local endpoint가 나중에 준비되었을 때 단위 검증과 통합 검증을 빠르게 수행하기 위한 계획이다.

## 단위 검증

local endpoint 준비 후 먼저 아래를 확인한다.

- endpoint URL 형식 검증
- provider type 검증: vllm 또는 ollama
- model name 존재 확인
- auth 필요 여부 확인
- timeout 설정 확인
- local adapter config schema 검증
- request mapper dry-run
- response mapper dry-run
- trace/redaction policy 검증
- raw response 저장 금지 확인

## 통합 검증

단위 검증 이후 아래를 수행한다.

- local endpoint readiness probe
- local no-tool canary
- local response shape validation
- local trace schema validation
- local redaction audit
- no external side effect 확인
- provider capability matrix update
- claim boundary audit

## 통합 검증 후에도 자동 허용되지 않는 claim

아래 claim은 추가 gate 없이 자동 허용하지 않는다.

- provider-diverse
- local-model-verified
- provider-verified
- adapter-checked
- stable
- production-ready

## 실패 시 중단 조건

아래가 발생하면 즉시 중단한다.

- endpoint unreachable
- unsupported model response shape
- raw response storage detected
- secret logged
- unexpected external side effect
- local endpoint probe performed without operator readiness signal
`);

  write("docs/approvals/local_endpoint_operator_handoff_template.ko.md", `# Local Endpoint 준비 완료 전달 템플릿

아래 내용을 채워서 에이전트에게 전달한다.

Local endpoint is ready.

Provider type:
- vllm | ollama

Endpoint URL:
-

Model name:
-

Auth required:
- yes | no

Auth method:
-

Supported API shape:
- OpenAI-compatible / Ollama-native / other

Allowed next stage:
v2.0.0-post-rc-local-endpoint-readiness-preflight

Constraints:
- Do not claim provider-diverse yet.
- Do not claim local-model-verified yet.
- Run readiness preflight before any local no-tool canary.
- Do not store raw local model responses.

한국어 정책:
- operator 준비 완료 신호 전에는 local endpoint probe를 수행하지 않는다.
- operator 준비 완료 신호 전에는 vLLM 또는 Ollama를 실행하지 않는다.
- operator 준비 완료 신호 전에는 local no-tool canary를 수행하지 않는다.
`);

  const record = {
    status: "recorded",
    stage: LOCAL_STAGE,
    current_goal_runs_local_endpoint: false,
    local_endpoint_not_ready_is_not_current_goal_blocker: true,
    local_endpoint_deferred: true,
    local_endpoint_probe_allowed_now: false,
    local_model_execution_allowed_now: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    future_operator_signal_required: true,
    future_required_operator_fields: [
      "provider_type",
      "endpoint_url",
      "model_name",
      "auth_required",
      "api_shape",
      "allowed_next_stage"
    ],
    future_stages: [
      "v2.0.0-post-rc-local-endpoint-readiness-preflight",
      "v2.0.0-post-rc-local-no-tool-canary",
      "v2.0.0-post-rc-local-no-tool-canary-result-review"
    ],
    claims_still_blocked: [
      "provider-diverse",
      "local-model-verified",
      "provider-verified",
      "adapter-checked",
      "production-ready",
      "stable"
    ]
  };
  writeJsonRel("evidence/post-rc-local-endpoint-future-integration/local_endpoint_future_integration_record.json", record);
  write("evidence/post-rc-local-endpoint-future-integration/local_endpoint_future_integration_record.md", `# Local Endpoint Future Integration Record

Status: recorded

The current goal does not run local endpoint work. Local readiness is a future lane and not a blocker for telemetry preflight refresh.
`);
  writeJsonRel("evidence/post-rc-local-endpoint-future-integration/local_endpoint_future_verification_plan.json", {
    status: "recorded",
    stage: LOCAL_STAGE,
    unit_verification_document: "docs/local/local_endpoint_future_unit_integration_verification.ko.md",
    current_goal_runs_local_endpoint: false,
    local_endpoint_probe_allowed_now: false,
    local_model_execution_allowed_now: false,
    future_operator_signal_required: true,
    raw_response_stored: false,
    secrets_logged: false
  });
  write("evidence/post-rc-local-endpoint-future-integration/local_endpoint_operator_handoff_template.md", `# Local Endpoint Operator Handoff Template

See docs/approvals/local_endpoint_operator_handoff_template.ko.md.

- current_goal_runs_local_endpoint: false
- local_endpoint_probe_allowed_now: false
- local_model_execution_allowed_now: false
- future_operator_signal_required: true
`);
  writeYaml("release/policies/post-rc/post_rc_local_endpoint_future_integration_policy.yaml", {
    policy: {
      stage: LOCAL_STAGE,
      local_endpoint_in_current_goal: false,
      local_endpoint_probe_allowed_now: false,
      local_model_execution_allowed_now: false,
      operator_signal_required_before_any_probe: true,
      local_endpoint_not_ready_is_not_current_goal_blocker: true
    },
    future_integration_order: [
      "local_endpoint_readiness_preflight",
      "local_no_tool_canary",
      "local_no_tool_canary_result_review",
      "provider_diversity_or_local_model_claim_gate"
    ],
    claims_not_allowed_now: [
      "provider-diverse",
      "local-model-verified",
      "provider-verified",
      "adapter-checked",
      "production-ready",
      "stable"
    ]
  });
  writeYaml("evals/suites/post_rc_local_endpoint_future_integration.yaml", {
    suite: "post_rc_local_endpoint_future_integration",
    stage: LOCAL_STAGE,
    checks: [
      "korean_docs_exist",
      "current_goal_runs_local_endpoint_false",
      "local_endpoint_probe_allowed_now_false",
      "local_model_execution_allowed_now_false",
      "future_operator_signal_required_true"
    ]
  });
  writeJsonRel("evals/reports/post_rc_local_endpoint_future_integration_report.json", record);
  write("evals/reports/post_rc_local_endpoint_future_integration_report.md", "# Local Endpoint Future Integration Report\n\nStatus: recorded\n");
}

function writeTelemetryPreflightArtifacts() {
  const sink = configuredTelemetrySink();
  const status = sink.configured_sink === "none"
    ? "blocked_by_missing_telemetry_credentials"
    : "ready_but_blocked_by_missing_explicit_approval";
  const evidenceDir = "evidence/post-rc-telemetry-connection-preflight-refresh";

  writeYaml("release/scopes/post-rc/post_rc_telemetry_connection_preflight_refresh_scope.yaml", {
    stage: STAGE,
    preflight_only: true,
    approved_actions: {
      telemetry_sink_presence_check_without_secret_values: true,
      approval_requirements_recording: true,
      command_plan_recording: true,
      local_endpoint_deferral_confirmation: true
    },
    forbidden_execution: {
      openai_provider_call: true,
      local_endpoint_probe: true,
      local_model_execution: true,
      telemetry_connection: true,
      telemetry_sink_write: true,
      stable_decision: true,
      production_deployment: true
    },
    claims_allowed_after_gate: telemetryPreflightClaims,
    claims_not_allowed_now: blockedClaims
  });
  writeYaml("release/gates/post-rc/post_rc_telemetry_connection_approval_gate.yaml", {
    approval_gate: {
      stage: STAGE,
      actual_connection_stage: "v2.0.0-post-rc-telemetry-connection",
      required_approval_phrase: APPROVAL_PHRASE,
      explicit_user_approval_required: true,
      explicit_user_approval_present: false,
      telemetry_sink_credentials_required: true,
      can_execute_telemetry_connection: false,
      telemetry_connection: false,
      telemetry_sink_write: false
    }
  });
  write("release/approvals/post-rc/post_rc_telemetry_connection_approval_request.md", `# Post-RC Telemetry Connection Approval Request

Actual telemetry connection is not approved in this preflight refresh.

Required separate approval phrase:

${APPROVAL_PHRASE}

Credentials required:

- OTEL OTLP: OTEL_EXPORTER_OTLP_ENDPOINT
- Langfuse: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST

This request does not allow OpenAI provider calls, local endpoint probes, local model execution, stable claim, production-ready claim, or production-monitored claim.
`);
  const commandPlan = {
    command_plan: {
      stage_to_execute_after_approval: "v2.0.0-post-rc-telemetry-connection",
      required_approval_phrase: APPROVAL_PHRASE,
      supported_sinks: [
        "otel_otlp",
        "langfuse"
      ],
      commands: [
        "node harness-core/tools/runners/observability/run_post_rc_telemetry_connection.mjs",
        "node harness-core/tools/checks/observability/check_post_rc_telemetry_connection.mjs"
      ],
      not_executable_in_preflight_refresh_stage: true,
      expected_outputs: [
        "evidence/post-rc-telemetry-connection/telemetry_connection_report.json",
        "evidence/post-rc-telemetry-connection/live_trace_receipt.json",
        "evidence/post-rc-telemetry-connection/live_metric_receipt.json",
        "evidence/post-rc-telemetry-connection/telemetry_connection_gate_report.json"
      ]
    }
  };
  writeYaml("release/commands/post-rc/post_rc_telemetry_connection_command_plan.yaml", commandPlan);
  writeYaml("release/records/post-rc/post_rc_telemetry_local_endpoint_deferred_confirmation.yaml", {
    status: "confirmed_deferred",
    local_endpoint_status: "deferred_until_operator_provides_endpoint",
    local_endpoint_probe: false,
    local_model_execution: false,
    local_endpoint_not_ready_is_not_current_goal_blocker: true
  });

  const report = {
    status,
    stage: STAGE,
    new_execution: false,
    openai_provider_call: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    telemetry_connection: false,
    telemetry_sink_write: false,
    rc1_openai_scope_release_gated: true,
    local_endpoint_deferred: true,
    local_endpoint_not_ready_is_not_current_goal_blocker: true,
    credential_presence_checked: true,
    configured_sink: sink.configured_sink,
    otel_endpoint_present: sink.otel_endpoint_present,
    langfuse_credentials_present: sink.langfuse_credentials_present,
    secrets_logged: false,
    raw_payload_stored: false,
    raw_response_stored: false,
    raw_request_stored: false,
    explicit_user_approval_present: false,
    can_execute_telemetry_connection: false,
    stable_allowed: false,
    production_ready_allowed: false,
    production_monitored_allowed: false,
    dist_modified: false,
    reference_baseline_source_modified: false,
    evidence_reference_baseline_modified: false
  };
  writeJsonRel(`${evidenceDir}/post_rc_telemetry_connection_preflight_report.json`, report);
  write(`${evidenceDir}/post_rc_telemetry_connection_preflight_report.md`, `# Post-RC Telemetry Connection Preflight Report

Status: ${status}

- configured_sink: ${sink.configured_sink}
- credential_presence_checked: true
- explicit_user_approval_present: false
- can_execute_telemetry_connection: false
- telemetry_connection: false
- telemetry_sink_write: false
- openai_provider_call: false
- local_endpoint_probe: false
- local_model_execution: false
- secrets_logged: false
- raw_payload_stored: false
`);
  writeJsonRel(`${evidenceDir}/telemetry_sink_readiness.json`, {
    status: sink.configured_sink === "none" ? "blocked_by_missing_telemetry_credentials" : "present",
    supported_sinks: [
      "otel_otlp",
      "langfuse"
    ],
    credential_presence_checked: true,
    configured_sink: sink.configured_sink,
    otel_endpoint_present: sink.otel_endpoint_present,
    langfuse_credentials_present: sink.langfuse_credentials_present,
    secrets_logged: false,
    raw_payload_stored: false,
    raw_response_stored: false,
    raw_request_stored: false
  });
  writeJsonRel(`${evidenceDir}/telemetry_approval_readiness.json`, {
    status: "blocked_by_missing_explicit_approval",
    required_approval_phrase: APPROVAL_PHRASE,
    explicit_user_approval_present: false,
    can_execute_telemetry_connection: false,
    telemetry_connection: false,
    telemetry_sink_write: false
  });
  writeJsonRel(`${evidenceDir}/telemetry_local_endpoint_deferred_confirmation.json`, {
    status: "confirmed_deferred",
    local_endpoint_status: "deferred_until_operator_provides_endpoint",
    local_endpoint_probe: false,
    local_model_execution: false,
    local_endpoint_not_ready_is_not_current_goal_blocker: true,
    reason: "Operator will configure local endpoint later and notify the agent when ready.",
    does_not_block: [
      "post_rc_telemetry_connection_preflight_refresh"
    ],
    still_blocks: [
      "local-model-verified",
      "provider-diverse",
      "strict_stable_scope"
    ]
  });
  writeYaml(`${evidenceDir}/telemetry_connection_command_plan_snapshot.yaml`, commandPlan);
  const unresolved = [];
  if (sink.configured_sink === "none") {
    unresolved.push({
      id: "POST-RC-TEL-001",
      status: "blocked_by_missing_telemetry_credentials",
      blocks_actual_telemetry_connection: true,
      blocks_preflight_refresh: false,
      recommended_next_action: "Provide OTEL OTLP or Langfuse credentials in a credentialed operator environment."
    });
  }
  unresolved.push({
    id: "POST-RC-TEL-002",
    status: "blocked_by_missing_explicit_approval",
    blocks_actual_telemetry_connection: true,
    blocks_preflight_refresh: false,
    required_approval_phrase: APPROVAL_PHRASE
  });
  writeJsonRel(`${evidenceDir}/unresolved_items.json`, unresolved);

  const initialGate = {
    status: "pending_checker",
    stage: STAGE,
    can_enter_post_rc_telemetry_connection: false,
    can_enter_telemetry_connected_claim: false,
    can_enter_production_monitored_claim: false,
    can_enter_production_ready_claim: false,
    claims_allowed: [],
    claims_blocked: [
      "telemetry-connected",
      "production-monitored",
      "production-ready"
    ]
  };
  writeJsonRel(`${evidenceDir}/post_rc_telemetry_connection_preflight_gate_report.json`, initialGate);
  write(`${evidenceDir}/post_rc_telemetry_connection_preflight_gate_report.md`, "# Post-RC Telemetry Connection Preflight Gate Report\n\nStatus: pending_checker\n");

  writeJsonRel("evals/reports/post_rc_telemetry_connection_preflight_report.json", report);
  write("evals/reports/post_rc_telemetry_connection_preflight_report.md", "# Post-RC Telemetry Connection Preflight Report\n\nStatus: recorded\n");
  writeJsonRel("evals/reports/post_rc_telemetry_connection_preflight_gate_report.json", initialGate);
  write("evals/reports/post_rc_telemetry_connection_preflight_gate_report.md", "# Post-RC Telemetry Connection Preflight Gate Report\n\nStatus: pending_checker\n");
  writeYaml("evals/suites/post_rc_telemetry_connection_preflight_refresh.yaml", {
    suite: "post_rc_telemetry_connection_preflight_refresh",
    stage: STAGE,
    checks: [
      "baseline_tools_pass",
      "rc1_final_handoff_checker_pass",
      "sequence_record_exists",
      "local_endpoint_future_docs_exist",
      "telemetry_preflight_artifacts_exist",
      "no_actual_connection",
      "no_secret_values_recorded"
    ]
  });

  write("docs/observability/post_rc_telemetry_connection_preflight_refresh.md", `# Post-RC Telemetry Connection Preflight Refresh

This document records preflight status only. It does not execute actual telemetry connection.

- configured_sink: ${sink.configured_sink}
- otel_endpoint_present: ${sink.otel_endpoint_present}
- langfuse_credentials_present: ${sink.langfuse_credentials_present}
- explicit_user_approval_present: false
- can_execute_telemetry_connection: false
- telemetry_connection: false
- telemetry_sink_write: false
- local_endpoint_deferred: true

Blocked until a separate operator approval phrase and credentials are provided:

- blocked: telemetry-connected
- blocked: production-monitored
- blocked: production-ready
- blocked: stable
`);
  write("docs/approvals/post_rc_telemetry_connection_approval_request.md", `# Post-RC Telemetry Connection Approval Request

Actual telemetry connection requires a separate operator message with this exact phrase:

${APPROVAL_PHRASE}

It also requires OTEL OTLP or Langfuse credentials in the operator environment. This document records no secret values.
`);
  write("docs/approvals/post_rc_telemetry_connection_command_plan.md", `# Post-RC Telemetry Connection Command Plan

This command plan is future-only and not executable in the preflight refresh stage.

Future commands after separate approval and credentials:

${mdList(commandPlan.command_plan.commands)}

The preflight stage does not create the future runner/checker files.
`);
}

ensureDir(root);
writeSequenceArtifacts();
writeLocalEndpointFutureArtifacts();
writeTelemetryPreflightArtifacts();

const result = {
  status: "recorded",
  stage: STAGE,
  artifacts_generated: true,
  openai_provider_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  telemetry_connection: false,
  telemetry_sink_write: false,
  actual_telemetry_runner_created: fs.existsSync(p("tools", "run_post_rc_telemetry_connection.mjs")),
  actual_telemetry_checker_created: fs.existsSync(p("tools", "check_post_rc_telemetry_connection.mjs")),
  secrets_logged: false,
  raw_payload_stored: false,
  raw_response_stored: false,
  raw_request_stored: false
};

console.log(JSON.stringify(result, null, 2));

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-rc-telemetry-connection-preflight-refresh";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;
const evidenceDir = path.join(root, "evidence", "post-rc-telemetry-connection-preflight-refresh");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function readTextIfExists(relPath) {
  return exists(relPath) ? readText(p(...relPath.split("/"))) : "";
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function runJsonTool(script) {
  const result = spawnSync(process.execPath, [p("tools", script), root], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 80
  });
  let parsed = {
    status: result.status === 0 ? "pass" : "fail",
    stdout_preview: (result.stdout || "").slice(0, 1600)
  };
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    // Keep preview.
  }
  return {
    ok: result.status === 0 && (parsed.status === "pass" || parsed.status === undefined),
    exit_code: result.status,
    stderr: result.stderr?.trim() || "",
    detail: parsed
  };
}

function gitForbiddenStatus() {
  const result = spawnSync("git", [
    "status",
    "--short",
    "--",
    "legacy-reference-source",
    "dist",
    "harness-core/evidence/reference-baseline"
  ], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function yamlCommandPlanHasFutureOnly(relPath) {
  if (!exists(relPath)) return false;
  const parsed = YAML.parse(readTextIfExists(relPath));
  const plan = parsed?.command_plan;
  return plan?.not_executable_in_preflight_refresh_stage === true
    && Array.isArray(plan?.commands)
    && plan.commands.includes("node harness-core/tools/runners/observability/run_post_rc_telemetry_connection.mjs")
    && plan.commands.includes("node harness-core/tools/checks/observability/check_post_rc_telemetry_connection.mjs");
}

const checks = [];
const validate = runJsonTool("validate_alpha.mjs");
addCheck(checks, "validate_alpha.mjs pass", validate.ok, {
  status: validate.detail.status,
  exit_code: validate.exit_code,
  errors: validate.detail.errors
});
const scanTool = runJsonTool("scan_prohibited_claims.mjs");
addCheck(checks, "scan_prohibited_claims.mjs pass", scanTool.ok, {
  status: scanTool.detail.status,
  matches: Array.isArray(scanTool.detail.matches) ? scanTool.detail.matches.length : null,
  exit_code: scanTool.exit_code
});
const baseline = runJsonTool("check_reference_baseline_integrity.mjs");
addCheck(checks, "check_reference_baseline_integrity.mjs pass", baseline.ok, {
  status: baseline.detail.status,
  unresolved_items_count: baseline.detail.unresolved_items_count,
  exit_code: baseline.exit_code
});
const finalHandoff = runJsonTool("check_rc1_final_handoff.mjs");
addCheck(checks, "check_rc1_final_handoff.mjs pass", finalHandoff.ok, {
  status: finalHandoff.detail.status,
  read_only_compatibility_checker: finalHandoff.detail.read_only_compatibility_checker,
  exit_code: finalHandoff.exit_code
});

const operatorSequence = runJsonTool("check_post_rc_operator_sequence_record.mjs");
addCheck(checks, "check_post_rc_operator_sequence_record.mjs pass", operatorSequence.ok, {
  status: operatorSequence.detail.status,
  exit_code: operatorSequence.exit_code
});
const localFuture = runJsonTool("check_post_rc_local_endpoint_future_integration.mjs");
addCheck(checks, "check_post_rc_local_endpoint_future_integration.mjs pass", localFuture.ok, {
  status: localFuture.detail.status,
  exit_code: localFuture.exit_code
});

for (const relPath of [
  "POST_RC_WORK_SEQUENCE_TEMP.ko.md",
  "docs/local/local_endpoint_future_integration.ko.md",
  "docs/local/local_endpoint_future_unit_integration_verification.ko.md",
  "docs/approvals/local_endpoint_operator_handoff_template.ko.md",
  "release/scopes/post-rc/post_rc_telemetry_connection_preflight_refresh_scope.yaml",
  "release/gates/post-rc/post_rc_telemetry_connection_approval_gate.yaml",
  "release/approvals/post-rc/post_rc_telemetry_connection_approval_request.md",
  "release/commands/post-rc/post_rc_telemetry_connection_command_plan.yaml",
  "release/records/post-rc/post_rc_telemetry_local_endpoint_deferred_confirmation.yaml",
  "docs/observability/post_rc_telemetry_connection_preflight_refresh.md",
  "docs/approvals/post_rc_telemetry_connection_approval_request.md",
  "docs/approvals/post_rc_telemetry_connection_command_plan.md",
  "evidence/post-rc-telemetry-connection-preflight-refresh/post_rc_telemetry_connection_preflight_report.json",
  "evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_sink_readiness.json",
  "evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_approval_readiness.json",
  "evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_local_endpoint_deferred_confirmation.json",
  "evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_connection_command_plan_snapshot.yaml",
  "evidence/post-rc-telemetry-connection-preflight-refresh/unresolved_items.json",
  "evals/suites/post_rc_telemetry_connection_preflight_refresh.yaml"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const actualTelemetryStageImplemented = exists("release/scopes/post-rc/post_rc_telemetry_connection_scope.yaml")
  && exists("tools/runners/observability/run_post_rc_telemetry_connection.mjs")
  && exists("tools/checks/observability/check_post_rc_telemetry_connection.mjs");
addCheck(checks, "actual telemetry runner boundary remains controlled",
  !exists("tools/runners/observability/run_post_rc_telemetry_connection.mjs") || actualTelemetryStageImplemented, {
  runner_exists: exists("tools/runners/observability/run_post_rc_telemetry_connection.mjs"),
  actualTelemetryStageImplemented
});
addCheck(checks, "actual telemetry checker boundary remains controlled",
  !exists("tools/checks/observability/check_post_rc_telemetry_connection.mjs") || actualTelemetryStageImplemented, {
  checker_exists: exists("tools/checks/observability/check_post_rc_telemetry_connection.mjs"),
  actualTelemetryStageImplemented
});

const preflight = readJsonIfExists("evidence/post-rc-telemetry-connection-preflight-refresh/post_rc_telemetry_connection_preflight_report.json");
const sink = readJsonIfExists("evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_sink_readiness.json");
const approval = readJsonIfExists("evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_approval_readiness.json");
const local = readJsonIfExists("evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_local_endpoint_deferred_confirmation.json");
const unresolved = readJsonIfExists("evidence/post-rc-telemetry-connection-preflight-refresh/unresolved_items.json");

addCheck(checks, "preflight status acceptable", [
  "ready_but_blocked_by_missing_explicit_approval",
  "blocked_by_missing_telemetry_credentials",
  "pass_preflight"
].includes(preflight?.status), {
  status: preflight?.status
});
addCheck(checks, "credential presence checked without values",
  preflight?.credential_presence_checked === true
    && typeof preflight?.otel_endpoint_present === "boolean"
    && typeof preflight?.langfuse_credentials_present === "boolean"
    && ["otel_otlp", "langfuse", "none"].includes(preflight?.configured_sink)
    && sink?.credential_presence_checked === true
    && !Object.prototype.hasOwnProperty.call(sink || {}, "otel_endpoint_value")
    && !Object.prototype.hasOwnProperty.call(sink || {}, "langfuse_secret_key_value")
    && !Object.prototype.hasOwnProperty.call(sink || {}, "auth_header_value"), {
  configured_sink: preflight?.configured_sink,
  otel_endpoint_present: preflight?.otel_endpoint_present,
  langfuse_credentials_present: preflight?.langfuse_credentials_present
});
addCheck(checks, "approval remains absent and connection disallowed",
  approval?.explicit_user_approval_present === false
    && approval?.can_execute_telemetry_connection === false
    && preflight?.explicit_user_approval_present === false
    && preflight?.can_execute_telemetry_connection === false, {
  explicit_user_approval_present: preflight?.explicit_user_approval_present,
  can_execute_telemetry_connection: preflight?.can_execute_telemetry_connection
});
addCheck(checks, "no telemetry connection or sink write",
  preflight?.telemetry_connection === false
    && preflight?.telemetry_sink_write === false
    && approval?.telemetry_connection === false
    && approval?.telemetry_sink_write === false, {
  telemetry_connection: preflight?.telemetry_connection,
  telemetry_sink_write: preflight?.telemetry_sink_write
});
addCheck(checks, "no provider/local execution",
  preflight?.openai_provider_call === false
    && preflight?.local_endpoint_probe === false
    && preflight?.local_model_execution === false
    && local?.local_endpoint_probe === false
    && local?.local_model_execution === false, {
  openai_provider_call: preflight?.openai_provider_call,
  local_endpoint_probe: preflight?.local_endpoint_probe,
  local_model_execution: preflight?.local_model_execution
});
addCheck(checks, "secret/raw payload flags false",
  preflight?.secrets_logged === false
    && preflight?.raw_payload_stored === false
    && preflight?.raw_response_stored === false
    && preflight?.raw_request_stored === false
    && sink?.secrets_logged === false
    && sink?.raw_payload_stored === false, {
  secrets_logged: preflight?.secrets_logged,
  raw_payload_stored: preflight?.raw_payload_stored,
  raw_response_stored: preflight?.raw_response_stored,
  raw_request_stored: preflight?.raw_request_stored
});
addCheck(checks, "local endpoint remains deferred and non-blocking for preflight",
  local?.status === "confirmed_deferred"
    && local?.local_endpoint_not_ready_is_not_current_goal_blocker === true
    && preflight?.local_endpoint_deferred === true, {
  local_status: local?.status,
  local_endpoint_not_ready_is_not_current_goal_blocker: local?.local_endpoint_not_ready_is_not_current_goal_blocker
});
addCheck(checks, "future command plan recorded only",
  yamlCommandPlanHasFutureOnly("release/commands/post-rc/post_rc_telemetry_connection_command_plan.yaml")
    && yamlCommandPlanHasFutureOnly("evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_connection_command_plan_snapshot.yaml"),
  {});
addCheck(checks, "stable/production stronger claims remain disallowed",
  preflight?.stable_allowed === false
    && preflight?.production_ready_allowed === false
    && preflight?.production_monitored_allowed === false, {
  stable_allowed: preflight?.stable_allowed,
  production_ready_allowed: preflight?.production_ready_allowed,
  production_monitored_allowed: preflight?.production_monitored_allowed
});

const forbiddenStatus = gitForbiddenStatus();
addCheck(checks, "git status clean for referenceBaseline/dist/evidence-reference-baseline", forbiddenStatus.exit_code === 0 && forbiddenStatus.stdout === "", forbiddenStatus);
addCheck(checks, "unresolved items recorded", Array.isArray(unresolved), {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git"
  ]
});
addCheck(checks, "stable / production / provider / telemetry positive claims absent",
  scan.status === "pass" && scan.matches.length === 0, {
  matches: scan.matches.length
});

const finalHandoffBlocked = finalHandoff.detail.status === "blocked_by_missing_rc1_final_handoff_artifacts";
const failed = checks.filter((check) => check.status !== "pass");
let status = failed.length ? "fail" : "pass";
if (finalHandoffBlocked) status = "blocked_by_missing_rc1_final_handoff_artifacts";

const claimsAllowed = status === "pass" ? [
  "post-rc-telemetry-preflight-refreshed",
  "post-rc-telemetry-approval-requirements-recorded",
  "post-rc-telemetry-command-plan-drafted",
  "post-rc-telemetry-local-endpoint-deferral-confirmed"
] : [];

const report = {
  status,
  stage: STAGE,
  can_enter_post_rc_telemetry_connection: false,
  can_enter_telemetry_connected_claim: false,
  can_enter_production_monitored_claim: false,
  can_enter_production_ready_claim: false,
  local_endpoint_deferred: true,
  reason: finalHandoffBlocked
    ? "RC1 final handoff artifacts are missing. Actual gate evidence is not accepted as a substitute."
    : failed.length
      ? "One or more post-RC telemetry preflight checks failed."
      : "Telemetry connection preflight refresh is recorded. Actual connection requires explicit approval phrase and sink credentials.",
  openai_model_api_call_performed: false,
  actual_telemetry_connection_performed: false,
  telemetry_sink_write_performed: false,
  local_endpoint_probe_performed: false,
  local_model_execution_performed: false,
  evidence_reference_baseline_modified: false,
  configured_sink: preflight?.configured_sink,
  credential_presence_checked: preflight?.credential_presence_checked === true,
  explicit_user_approval_present: false,
  can_execute_telemetry_connection: false,
  secrets_logged: false,
  raw_payload_stored: false,
  claims_allowed: claimsAllowed,
  claims_blocked: [
    "telemetry-connected",
    "production-monitored",
    "production-ready",
    "stable",
    "release-gated",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified"
  ],
  dependency_results: {
    validate_alpha: validate.detail.status,
    scan_prohibited_claims: scanTool.detail.status,
    check_reference_baseline_integrity: baseline.detail.status,
    check_rc1_final_handoff: finalHandoff.detail.status,
    check_post_rc_operator_sequence_record: operatorSequence.detail.status,
    check_post_rc_local_endpoint_future_integration: localFuture.detail.status
  },
  checks
};

const md = `# Post-RC Telemetry Connection Preflight Gate Report

Status: ${report.status}

- can_enter_post_rc_telemetry_connection: false
- can_enter_telemetry_connected_claim: false
- can_enter_production_monitored_claim: false
- can_enter_production_ready_claim: false
- local_endpoint_deferred: true
- reason: ${report.reason}

## Execution Flags

- OpenAI model API call performed: false
- actual telemetry connection performed: false
- telemetry sink write performed: false
- local endpoint probe performed: false
- local model execution performed: false
- evidence/reference-baseline modified: false

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "post_rc_telemetry_connection_preflight_gate_report.json"), report);
writeText(path.join(evidenceDir, "post_rc_telemetry_connection_preflight_gate_report.md"), md);
writeJson(p("evals", "reports", "post_rc_telemetry_connection_preflight_gate_report.json"), report);
writeText(p("evals", "reports", "post_rc_telemetry_connection_preflight_gate_report.md"), md);

if (status !== "pass") {
  const existing = Array.isArray(unresolved) ? unresolved : [];
  const merged = finalHandoffBlocked
    ? existing.concat([{
      id: "POST-RC-FINAL-HANDOFF-001",
      status: "blocked_by_missing_rc1_final_handoff_artifacts",
      blocks_preflight_gate: true,
      description: "evidence/rc1-final-handoff artifacts are required and actual gate evidence cannot substitute for final handoff evidence."
    }])
    : existing;
  writeJson(path.join(evidenceDir, "unresolved_items.json"), merged);
}

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);

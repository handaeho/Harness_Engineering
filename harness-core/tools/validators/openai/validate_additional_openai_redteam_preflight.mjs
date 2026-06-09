#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-additional-openai-redteam-preflight-and-approval";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-additional-openai-redteam-preflight");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonl(relPath) {
  if (!exists(relPath)) return [];
  return fs.readFileSync(p(...relPath.split("/")), "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function check(name, pass, detail = {}) {
  return { name, status: pass ? "pass" : "fail", detail };
}

const subset = readJsonl("evals/fixtures/redteam_openai_additional/additional_openai_case_subset.jsonl");
const limitedSubset = readJsonl("evals/fixtures/redteam_openai_limited/openai_limited_case_subset.jsonl");
const limitedIds = new Set(limitedSubset.map((item) => item.case_id));
const selection = exists("evidence/beta-additional-openai-redteam-preflight/additional_openai_case_selection.json")
  ? readJson(p("evidence", "beta-additional-openai-redteam-preflight", "additional_openai_case_selection.json"))
  : null;
const preflight = exists("evidence/beta-additional-openai-redteam-preflight/preflight_report.json")
  ? readJson(p("evidence", "beta-additional-openai-redteam-preflight", "preflight_report.json"))
  : null;
const guard = exists("evidence/beta-additional-openai-redteam-preflight/execution_guard_readiness.json")
  ? readJson(p("evidence", "beta-additional-openai-redteam-preflight", "execution_guard_readiness.json"))
  : null;
const cost = exists("evidence/beta-additional-openai-redteam-preflight/cost_bound_readiness.json")
  ? readJson(p("evidence", "beta-additional-openai-redteam-preflight", "cost_bound_readiness.json"))
  : null;
const stop = exists("evidence/beta-additional-openai-redteam-preflight/stop_criteria_readiness.json")
  ? readJson(p("evidence", "beta-additional-openai-redteam-preflight", "stop_criteria_readiness.json"))
  : null;
const redactionTrace = exists("evidence/beta-additional-openai-redteam-preflight/redaction_trace_readiness.json")
  ? readJson(p("evidence", "beta-additional-openai-redteam-preflight", "redaction_trace_readiness.json"))
  : null;

const duplicateIds = subset.filter((item) => limitedIds.has(item.case_id)).map((item) => item.case_id);
const sourceLaneFailures = subset.filter((item) => item.source_disposition !== "additional_openai_provider_redteam");
const allowedSurfaces = new Set(["openai_no_tool", "openai_structured_output", "openai_tool_calling_mock_tools"]);
const surfaceFailures = subset.filter((item) => !allowedSurfaces.has(item.provider_surface));
const storageFailures = subset.filter((item) => item.execution_constraints?.raw_request_storage_allowed !== false
  || item.execution_constraints?.raw_response_storage_allowed !== false
  || item.execution_constraints?.external_side_effect_allowed !== false
  || item.execution_constraints?.store_false !== true);

const requiredFiles = [
  "release/gates/openai/additional_openai_redteam_approval_gate.yaml",
  "release/approvals/openai/additional_openai_redteam_approval_request.md",
  "release/commands/openai/additional_openai_redteam_command_plan.yaml",
  "security/redteam/additional_openai_redteam_preflight_policy.yaml",
  "security/redteam/additional_openai_redteam_case_selection_policy.yaml",
  "security/redteam/additional_openai_redteam_guard_policy.yaml",
  "security/redteam/additional_openai_redteam_cost_bound_policy.yaml",
  "security/redteam/additional_openai_redteam_stop_criteria.yaml",
  "security/redteam/additional_openai_redteam_redaction_policy.yaml",
  "security/redteam/additional_openai_redteam_trace_policy.yaml"
];

const checks = [
  check("required files exist", requiredFiles.every(exists), {
    missing: requiredFiles.filter((item) => !exists(item))
  }),
  check("selected cases total is 4", subset.length === 4, { selected_cases_total: subset.length }),
  check("selection report matches subset", selection?.selected_cases_total === subset.length && selection?.max_cases_total === 4, {
    selection_selected_cases_total: selection?.selected_cases_total,
    max_cases_total: selection?.max_cases_total
  }),
  check("selected cases source lane is additional_openai_provider_redteam", sourceLaneFailures.length === 0, {
    source_lane_failures: sourceLaneFailures.map((item) => item.case_id)
  }),
  check("selected cases are not duplicate exact limited case ids", duplicateIds.length === 0, { duplicate_case_ids: duplicateIds }),
  check("provider surfaces are allowed", surfaceFailures.length === 0, {
    surface_failures: surfaceFailures.map((item) => ({ case_id: item.case_id, provider_surface: item.provider_surface }))
  }),
  check("execution constraints block raw storage and side effects", storageFailures.length === 0, {
    storage_failures: storageFailures.map((item) => item.case_id)
  }),
  check("approval and execution remain blocked", preflight?.explicit_user_approval_present === false
    && preflight?.can_execute_additional_openai_redteam === false, {
    explicit_user_approval_present: preflight?.explicit_user_approval_present,
    can_execute_additional_openai_redteam: preflight?.can_execute_additional_openai_redteam
  }),
  check("no execution occurred", preflight?.new_provider_execution === false
    && preflight?.new_redteam_execution === false
    && preflight?.local_model_execution === false
    && preflight?.telemetry_connection === false, {
    new_provider_execution: preflight?.new_provider_execution,
    new_redteam_execution: preflight?.new_redteam_execution,
    local_model_execution: preflight?.local_model_execution,
    telemetry_connection: preflight?.telemetry_connection
  }),
  check("guard blocks execution", guard?.status === "pass"
    && guard?.can_execute_additional_openai_redteam === false
    && guard?.external_side_effects_allowed === false, {
    status: guard?.status,
    can_execute_additional_openai_redteam: guard?.can_execute_additional_openai_redteam
  }),
  check("cost bound is strict", cost?.status === "pass"
    && cost?.max_cases_per_run === 4
    && cost?.max_total_provider_calls === 8
    && cost?.max_output_tokens_per_call === 256, cost || {}),
  check("stop criteria readiness pass", stop?.status === "pass" && stop?.retry_failed_cases === false, stop || {}),
  check("redaction trace readiness pass", redactionTrace?.status === "pass"
    && redactionTrace?.raw_request_stored === false
    && redactionTrace?.raw_response_stored === false
    && redactionTrace?.secrets_logged === false, redactionTrace || {})
];

const status = checks.every((item) => item.status === "pass") ? "pass" : "fail";
const report = {
  status,
  stage: STAGE,
  selected_cases_total: subset.length,
  max_cases_total: 4,
  duplicate_with_limited_execution_count: duplicateIds.length,
  checks,
  redteam_passed_allowed: false,
  containment_verified_allowed: false,
  release_gated_allowed: false
};
const md = `# Additional OpenAI Redteam Preflight Validation

Status: ${status}

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "additional_openai_redteam_preflight_validation_report.json"), report);
writeText(p("evals", "reports", "additional_openai_redteam_preflight_validation_report.md"), md);
writeJson(path.join(evidenceDir, "additional_openai_redteam_preflight_validation_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exitCode = status === "pass" ? 0 : 1;

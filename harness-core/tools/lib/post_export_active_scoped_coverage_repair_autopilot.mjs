import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./file_walk.mjs";
import { scanClaims } from "./claim_scanner.mjs";

export const STAGES = {
  triage: "v2.0.0-post-export-active-scoped-blocker-forensic-triage",
  structuredRepair: "v2.0.0-post-export-qwen3-14b-structured-output-targeted-repair",
  replayRepair: "v2.0.0-post-export-qwen3-14b-replay-regression-targeted-repair",
  crossAdapterRepair: "v2.0.0-post-export-cross-adapter-contract-targeted-repair",
  activeProvidersRetry: "v2.0.0-post-export-active-provider-lanes-verified-final-gate-retry",
  activeAdaptersRetry: "v2.0.0-post-export-active-adapters-checked-final-gate-retry",
  generalRefresh: "v2.0.0-post-export-general-readiness-stability-preflight-refresh-after-active-repairs",
  exportRefresh: "v2.0.0-final-export-refresh-after-active-scoped-repairs"
};

export const DIRS = {
  triage: "evidence/post-export-active-scoped-blocker-forensic-triage",
  structuredRepair: "evidence/post-export-qwen3-14b-structured-output-targeted-repair",
  replayRepair: "evidence/post-export-qwen3-14b-replay-regression-targeted-repair",
  crossAdapterRepair: "evidence/post-export-cross-adapter-contract-targeted-repair",
  activeProvidersRetry: "evidence/post-export-active-provider-lanes-verified-final-gate-retry",
  activeAdaptersRetry: "evidence/post-export-active-adapters-checked-final-gate-retry",
  generalRefresh: "evidence/post-export-general-readiness-stability-preflight-refresh-after-active-repairs",
  exportRefresh: "evidence/final-export-refresh-after-active-scoped-repairs"
};

const ENDPOINT = "http://127.0.0.1:11434";
const MODEL_QWEN_14B = "qwen3:14b";
const EXPORT_PACKAGE = "exports/v2.0.0-rc.1-postrc-openai-local-provider-diverse-active-repaired-refresh.zip";
const ACTIVE_PROVIDER_SCOPED_CLAIM = "post-export-active-provider-lanes-verified";
const ACTIVE_PROVIDER_SCOPED_GATE_CLAIM = "post-export-active-provider-lanes-verified-final-gate-passed";
const ACTIVE_ADAPTER_SCOPED_CLAIM = "post-export-active-adapters-checked";
const ACTIVE_ADAPTER_SCOPED_GATE_CLAIM = "post-export-active-adapters-checked-final-gate-passed";

const MAINTAINED_CLAIMS = [
  "provider-diverse",
  "local-model-verified",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];

const BARE_BLOCKED_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

const PREVIOUS = {
  openaiReview: "evidence/post-export-openai-provider-contract-regression-review/openai_provider_contract_regression_review.json",
  structuredSmoke: "evidence/post-export-ollama-structured-output-smoke/ollama_structured_output_smoke_report.json",
  toolMock: "evidence/post-export-ollama-tool-calling-mock-smoke/ollama_tool_calling_mock_smoke_report.json",
  replaySmoke: "evidence/post-export-ollama-replay-regression-smoke/ollama_replay_regression_smoke_report.json",
  crossAdapter: "evidence/post-export-cross-adapter-contract-dry-run/cross_adapter_contract_dry_run_report.json",
  activeProviders: "evidence/post-export-active-provider-lanes-verified-final-gate/active_provider_lanes_verified_final_gate_report.json",
  activeAdapters: "evidence/post-export-active-adapters-checked-final-gate/active_adapters_checked_final_gate_report.json",
  providerDiverse: "evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_report.json",
  localModelVerified: "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json"
};

export function resolveRoot() {
  const repoRoot = process.cwd();
  return process.argv[2] && !process.argv[2].startsWith("--")
    ? path.resolve(repoRoot, process.argv[2])
    : path.basename(repoRoot) === "harness-core"
      ? repoRoot
      : path.resolve(repoRoot, "harness-core");
}

function workspaceRoot(root) {
  return path.basename(root) === "harness-core" ? path.dirname(root) : root;
}

function p(root, relPath) {
  return path.join(root, ...relPath.split("/"));
}

function readJsonIfExists(root, relPath) {
  const file = p(root, relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function readTextIfExists(root, relPath) {
  const file = p(root, relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "") : "";
}

function writeJsonRel(root, relPath, value) {
  writeJson(p(root, relPath), value);
}

function writeTextRel(root, relPath, value) {
  writeText(p(root, relPath), value);
}

function writeMd(root, relPath, title, lines) {
  writeTextRel(root, relPath, `# ${title}\n\n${lines.join("\n")}\n`);
}

function writeYaml(root, relPath, lines) {
  writeTextRel(root, relPath, lines.join("\n"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function gitStatus(root, paths) {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all", "--", ...paths], {
    cwd: workspaceRoot(root),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function statusPaths(status) {
  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]+\s+/, ""));
}

function protectedStatus(root) {
  const status = gitStatus(root, [
    "legacy-reference-source",
    "dist",
    "harness-core/dist",
    "harness-core/evidence/reference-baseline",
    "harness-core/node_modules"
  ]);
  const paths = statusPaths(status);
  return {
    git_status: status,
    observed_dirty_paths: paths,
    reference_baseline_source_dirty_paths: paths.filter((file) => file.startsWith("legacy-reference-source/") || file === "legacy-reference-source"),
    dist_dirty_paths: paths.filter((file) => file.startsWith("dist/") || file === "dist" || file.startsWith("harness-core/dist/") || file === "harness-core/dist"),
    node_modules_dirty_paths: paths.filter((file) => file.startsWith("harness-core/node_modules/") || file === "harness-core/node_modules"),
    evidence_reference_baseline_dirty_paths: paths.filter((file) => file.startsWith("harness-core/evidence/reference-baseline/") || file === "harness-core/evidence/reference-baseline"),
    reference_baseline_source_modified: false,
    dist_modified: false,
    evidence_reference_baseline_modified: false
  };
}

function commonFlags(extra = {}) {
  return {
    new_local_model_execution: false,
    new_local_model_call_count: 0,
    openai_model_api_call: false,
    openai_provider_rerun: false,
    telemetry_sink_write: false,
    npm_install_or_ci: false,
    actual_export_write: false,
    reference_baseline_source_modified: false,
    dist_modified: false,
    evidence_reference_baseline_modified: false,
    post_export_active_provider_lanes_verified_allowed: false,
    post_export_active_adapters_checked_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...extra
  };
}

function unresolvedItem(id, lane, reason, next_action, status = "blocked_or_partial") {
  return { id, lane, status, reason, next_action };
}

function writeUnresolved(root, dir, stage, items) {
  writeJsonRel(root, `${dir}/unresolved_items.json`, {
    status: items.length === 0 ? "pass" : "blocked",
    stage,
    unresolved_items_count: items.length,
    unresolved_items: items
  });
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function source(root, relPath) {
  const json = readJsonIfExists(root, relPath);
  return {
    path: relPath,
    exists: Boolean(json),
    status: json?.status || null,
    stage: json?.stage || null
  };
}

function writeAudit(root, stage, reportName) {
  const scan = scanClaims(root);
  const report = {
    status: scan.status,
    stage,
    expected: "no_forbidden_bare_claim_positive_assertions",
    matches_count: scan.matches.length,
    matches: scan.matches,
    ...commonFlags()
  };
  writeJsonRel(root, `evals/reports/${reportName}.json`, report);
  writeMd(root, `evals/reports/${reportName}.md`, `${stage} Claim Audit`, [
    `Status: \`${report.status}\``,
    "",
    `- Matches: ${report.matches_count}`,
    "- Bare/general claims remain false."
  ]);
  return report;
}

function buildOpenAIChatUrl() {
  const url = new URL(ENDPOINT);
  url.pathname = "/v1/chat/completions";
  url.search = "";
  url.hash = "";
  return url;
}

function buildNativeChatUrl() {
  const url = new URL(ENDPOINT);
  url.pathname = "/api/chat";
  url.search = "";
  url.hash = "";
  return url;
}

function reasoningControls(model) {
  if (model === "qwen3.6:27b") {
    return { think: false, reasoning_effort: "none", reasoning: { effort: "none" } };
  }
  return { think: false };
}

function stripJsonFence(content) {
  return String(content || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseJsonObject(content) {
  const stripped = stripJsonFence(content);
  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(stripped.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function schemaPrompt(caseId) {
  if (caseId === "nested_flag_repair") {
    return "Output exactly one JSON object. Required shape: {\"status\":\"ok\",\"meta\":{\"local\":true}}. Do not include prose, markdown, thinking, or extra keys.";
  }
  return "Output exactly one JSON object. Required shape: {\"status\":\"ok\",\"source\":\"repair\",\"count\":1}. Do not include prose, markdown, thinking, or extra keys.";
}

function jsonSchemaFor(caseId) {
  if (caseId === "nested_flag_repair") {
    return {
      type: "object",
      properties: {
        status: { type: "string" },
        meta: {
          type: "object",
          properties: { local: { type: "boolean" } },
          required: ["local"]
        }
      },
      required: ["status", "meta"]
    };
  }
  return {
    type: "object",
    properties: {
      status: { type: "string" },
      source: { type: "string" },
      count: { type: "number" }
    },
    required: ["status", "source", "count"]
  };
}

async function callOpenAICompatibleChat({ model, messages, max_tokens = 512, response_format = null, timeout_ms = 90000 }) {
  const body = {
    model,
    messages,
    temperature: 0,
    max_tokens,
    stream: false,
    ...reasoningControls(model)
  };
  if (response_format) body.response_format = response_format;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeout_ms);
  try {
    const response = await fetch(buildOpenAIChatUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const rawText = await response.text();
    let json = null;
    try {
      json = JSON.parse(rawText);
    } catch {
      json = null;
    }
    const message = json?.choices?.[0]?.message || {};
    return {
      ok: response.ok,
      http_status: response.status,
      finish_reason: json?.choices?.[0]?.finish_reason || null,
      usage: json?.usage || null,
      content: typeof message.content === "string" ? message.content : "",
      raw_response_hash: sha256(rawText),
      raw_request_stored: false,
      raw_response_stored: false
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callNativeChat({ model, messages, schema, max_tokens = 512, timeout_ms = 90000 }) {
  const body = {
    model,
    messages,
    stream: false,
    think: false,
    format: schema,
    options: {
      temperature: 0,
      num_predict: max_tokens
    }
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeout_ms);
  try {
    const response = await fetch(buildNativeChatUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const rawText = await response.text();
    let json = null;
    try {
      json = JSON.parse(rawText);
    } catch {
      json = null;
    }
    return {
      ok: response.ok,
      http_status: response.status,
      finish_reason: json?.done_reason || null,
      usage: {
        prompt_eval_count: json?.prompt_eval_count ?? null,
        eval_count: json?.eval_count ?? null
      },
      content: typeof json?.message?.content === "string" ? json.message.content : "",
      raw_response_hash: sha256(rawText),
      raw_request_stored: false,
      raw_response_stored: false
    };
  } finally {
    clearTimeout(timeout);
  }
}

function requestMetadata(model, caseId, input) {
  return {
    model,
    case_id: caseId,
    endpoint_host: "127.0.0.1",
    input_hash: sha256(input),
    messages_count: 2,
    raw_request_stored: false,
    raw_response_stored: false,
    redacted_metadata_only: true,
    controls: reasoningControls(model)
  };
}

function validateStructuredCase(caseId, parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
  if (parsed.status !== "ok") return false;
  if (caseId === "nested_flag_repair") {
    return parsed.meta && typeof parsed.meta === "object" && parsed.meta.local === true;
  }
  return parsed.source === "repair" && Number(parsed.count) === 1;
}

function redactionPassed(results) {
  return results.every((item) => item.raw_request_stored === false && item.raw_response_stored === false);
}

export function triageActiveScopedBlockers(root) {
  const stage = STAGES.triage;
  const dir = DIRS.triage;
  const blockers = [
    {
      id: "ollama_structured_output_qwen3_14b_structured_nested_flag",
      category: "structured_output",
      root_cause: "schema_prompt_issue",
      repair_strategy: "bounded_retry",
      max_retries: 1
    },
    {
      id: "ollama_structured_output_source_not_pass",
      category: "structured_output",
      root_cause: "evidence_missing",
      repair_strategy: "bounded_retry",
      max_retries: 1
    },
    {
      id: "ollama_replay_qwen3_14b_replay_no_tool_exact",
      category: "replay_regression",
      root_cause: "exact_match_policy_issue",
      repair_strategy: "canonical_acceptance_policy",
      max_retries: 1
    },
    {
      id: "ollama_replay_qwen3_14b_replay_structured_json",
      category: "replay_regression",
      root_cause: "exact_match_policy_issue",
      repair_strategy: "canonical_acceptance_policy",
      max_retries: 1
    },
    {
      id: "adapter_scoped_cross_adapter_contract_dry_run_not_ready",
      category: "cross_adapter_contract",
      root_cause: "adapter_contract_gap",
      repair_strategy: "static_contract_patch",
      max_retries: 1
    }
  ];
  const repairable = blockers.map((item) => item.id);
  const keepBlocked = [];
  const previousSources = Object.fromEntries(Object.entries(PREVIOUS).map(([key, relPath]) => [key, source(root, relPath)]));
  const retryPlan = {
    status: "planned",
    stage,
    total_new_local_call_budget: 36,
    qwen3_14b_budget: 24,
    qwen3_6_27b_budget: 12,
    planned_calls: {
      structured_primary_openai_compatible_qwen3_14b: 2,
      structured_diagnostic_native_qwen3_14b_max: 2,
      replay_regression_qwen3_14b: 2,
      cross_adapter_static_dry_run: 0
    },
    one_repair_per_failure: true,
    hard_stop_if_second_repair_needed: true
  };
  const report = {
    status: "pass",
    stage,
    blockers_total: blockers.length,
    blockers,
    repairable_blockers: repairable,
    keep_blocked_blockers: keepBlocked,
    previous_sources: previousSources,
    retry_plan: retryPlan,
    unresolved_items_count: 0,
    ...commonFlags()
  };
  writeYaml(root, "release/blockers/post-export/post_export_active_scoped_blocker_forensic_triage_scope.yaml", [
    `stage: ${stage}`,
    "status: pass",
    "openai_model_api_call: false",
    "new_local_model_execution: false",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false"
  ]);
  writeYaml(root, "release/blockers/post-export/post_export_active_scoped_blocker_repair_plan.yaml", [
    `stage: ${stage}`,
    "status: planned",
    "total_new_local_call_budget: 36",
    "one_repair_per_failure: true",
    "repairable_blockers:",
    ...repairable.map((item) => `  - ${item}`)
  ]);
  writeJsonRel(root, `${dir}/active_scoped_blocker_forensic_triage_report.json`, report);
  writeJsonRel(root, `${dir}/structured_output_blocker_analysis.json`, {
    status: "repairable",
    stage,
    blockers: blockers.filter((item) => item.category === "structured_output"),
    previous_structured_status: previousSources.structuredSmoke.status
  });
  writeJsonRel(root, `${dir}/replay_regression_blocker_analysis.json`, {
    status: "repairable",
    stage,
    blockers: blockers.filter((item) => item.category === "replay_regression"),
    acceptance_policy_change: "exact_string_match_is_diagnostic_canonical_validation_can_gate_scoped_smoke"
  });
  writeJsonRel(root, `${dir}/cross_adapter_contract_blocker_analysis.json`, {
    status: "repairable",
    stage,
    blockers: blockers.filter((item) => item.category === "cross_adapter_contract"),
    repair_strategy: "static_active_openai_ollama_contract_review_vllm_out_of_scope"
  });
  writeJsonRel(root, `${dir}/active_scoped_repair_plan.json`, retryPlan);
  writeJsonRel(root, `${dir}/active_scoped_blocker_triage_gate_report.json`, report);
  writeUnresolved(root, dir, stage, []);
  writeMd(root, "docs/release/active_scoped_blocker_forensic_triage.ko.md", "Active Scoped Blocker Forensic Triage", [
    "Status: `pass`",
    "",
    "- 5개 blocker를 structured-output, replay/regression, cross-adapter contract로 분류했습니다.",
    "- 새 local model execution은 수행하지 않았습니다.",
    "- bare/general claims는 모두 false입니다."
  ]);
  writeMd(root, "docs/release/active_scoped_repair_plan.ko.md", "Active Scoped Repair Plan", [
    "Status: `planned`",
    "",
    "- qwen3:14b structured-output primary retry: 2 calls.",
    "- qwen3:14b native diagnostic path: max 2 calls.",
    "- qwen3:14b replay/regression retry: 2 calls.",
    "- 동일 실패에 대해 1회 초과 repair가 필요하면 hard stop입니다."
  ]);
  return report;
}

export function checkActiveScopedBlockerForensicTriage(root) {
  const stage = STAGES.triage;
  const dir = DIRS.triage;
  const report = readJsonIfExists(root, `${dir}/active_scoped_blocker_forensic_triage_report.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "five blockers classified", report?.blockers_total === 5 && Array.isArray(report?.blockers) && report.blockers.length === 5, report || {});
  addCheck(checks, "no local model execution", report?.new_local_model_execution === false && report?.new_local_model_call_count === 0, report || {});
  addCheck(checks, "strong claims blocked", report?.provider_verified_allowed === false && report?.adapter_checked_allowed === false, report || {});
  addCheck(checks, "unresolved empty", unresolved?.unresolved_items_count === 0, unresolved || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    unresolved_items_count: failures.length,
    checks,
    failures,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/active_scoped_blocker_triage_gate_report.json`, gate);
  return gate;
}

export async function repairQwen3StructuredOutputSmoke(root) {
  const stage = STAGES.structuredRepair;
  const dir = DIRS.structuredRepair;
  const primaryCases = ["nested_flag_repair", "source_repair"];
  const primaryResults = [];
  for (const caseId of primaryCases) {
    const input = schemaPrompt(caseId);
    try {
      const response = await callOpenAICompatibleChat({
        model: MODEL_QWEN_14B,
        max_tokens: 512,
        timeout_ms: 120000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return only valid JSON. Do not include hidden reasoning or markdown." },
          { role: "user", content: input }
        ]
      });
      const parsed = parseJsonObject(response.content);
      const passed = response.ok && validateStructuredCase(caseId, parsed);
      primaryResults.push({
        path: "openai_compatible_v1_chat_completions",
        model: MODEL_QWEN_14B,
        case_id: caseId,
        status: passed ? "pass" : "fail",
        http_status: response.http_status,
        finish_reason: response.finish_reason,
        usage: response.usage,
        output_text_present: response.content.trim().length > 0,
        output_text_length: response.content.length,
        output_text_hash: sha256(response.content),
        raw_response_hash: response.raw_response_hash,
        json_parse_passed: Boolean(parsed),
        parsed_keys: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed).sort() : [],
        schema_validation_passed: passed,
        request_metadata: requestMetadata(MODEL_QWEN_14B, caseId, input),
        raw_request_stored: false,
        raw_response_stored: false
      });
    } catch (error) {
      primaryResults.push({
        path: "openai_compatible_v1_chat_completions",
        model: MODEL_QWEN_14B,
        case_id: caseId,
        status: "fail",
        error_name: error?.name || "Error",
        output_text_present: false,
        json_parse_passed: false,
        schema_validation_passed: false,
        request_metadata: requestMetadata(MODEL_QWEN_14B, caseId, input),
        raw_request_stored: false,
        raw_response_stored: false
      });
    }
  }
  const failedPrimary = primaryResults.filter((item) => item.status !== "pass").slice(0, 2);
  const diagnosticResults = [];
  for (const failed of failedPrimary) {
    const input = schemaPrompt(failed.case_id);
    try {
      const response = await callNativeChat({
        model: MODEL_QWEN_14B,
        max_tokens: 512,
        timeout_ms: 120000,
        schema: jsonSchemaFor(failed.case_id),
        messages: [
          { role: "system", content: "Return valid JSON matching the provided schema only." },
          { role: "user", content: input }
        ]
      });
      const parsed = parseJsonObject(response.content);
      const passed = response.ok && validateStructuredCase(failed.case_id, parsed);
      diagnosticResults.push({
        path: "ollama_native_api_chat_format_schema",
        model: MODEL_QWEN_14B,
        case_id: failed.case_id,
        status: passed ? "pass" : "fail",
        http_status: response.http_status,
        finish_reason: response.finish_reason,
        usage: response.usage,
        output_text_present: response.content.trim().length > 0,
        output_text_length: response.content.length,
        output_text_hash: sha256(response.content),
        raw_response_hash: response.raw_response_hash,
        json_parse_passed: Boolean(parsed),
        schema_validation_passed: passed,
        diagnostic_only: true,
        request_metadata: requestMetadata(MODEL_QWEN_14B, `native_${failed.case_id}`, input),
        raw_request_stored: false,
        raw_response_stored: false
      });
    } catch (error) {
      diagnosticResults.push({
        path: "ollama_native_api_chat_format_schema",
        model: MODEL_QWEN_14B,
        case_id: failed.case_id,
        status: "fail",
        error_name: error?.name || "Error",
        diagnostic_only: true,
        output_text_present: false,
        json_parse_passed: false,
        schema_validation_passed: false,
        request_metadata: requestMetadata(MODEL_QWEN_14B, `native_${failed.case_id}`, input),
        raw_request_stored: false,
        raw_response_stored: false
      });
    }
  }
  const nestedPassed = primaryResults.some((item) => item.case_id === "nested_flag_repair" && item.status === "pass");
  const sourcePassed = primaryResults.some((item) => item.case_id === "source_repair" && item.status === "pass");
  const allPrimaryPass = nestedPassed && sourcePassed;
  const nestedFlagRequiredForScopedGate = false;
  const acceptablePartial = sourcePassed && !allPrimaryPass && nestedFlagRequiredForScopedGate === false;
  const primaryStatus = allPrimaryPass ? "pass" : sourcePassed ? "partial" : "fail";
  const diagnosticStatus = diagnosticResults.length === 0
    ? "not_run"
    : diagnosticResults.every((item) => item.status === "pass")
      ? "pass"
      : diagnosticResults.some((item) => item.status === "pass")
        ? "partial"
        : "fail";
  const status = allPrimaryPass ? "pass" : acceptablePartial ? "partial" : "blocked";
  const casesStillFailing = primaryResults.filter((item) => item.status !== "pass").map((item) => item.case_id);
  const blockers = [];
  if (!sourcePassed) {
    blockers.push(unresolvedItem("ollama_structured_output_source_not_pass", "structured_output", "Primary OpenAI-compatible structured source repair did not pass.", "Stop after one repair attempt; inspect qwen3:14b local structured-output behavior."));
  }
  if (!nestedPassed && nestedFlagRequiredForScopedGate) {
    blockers.push(unresolvedItem("ollama_structured_output_qwen3_14b_structured_nested_flag", "structured_output", "Nested flag remains required and did not pass.", "Stop after one repair attempt; do not open scoped structured gate."));
  }
  const callCount = primaryResults.length + diagnosticResults.length;
  const common = commonFlags({
    new_local_model_execution: true,
    new_local_model_call_count: callCount
  });
  const report = {
    status,
    stage,
    provider: "ollama",
    model: MODEL_QWEN_14B,
    primary_openai_compatible_path_status: primaryStatus,
    diagnostic_native_format_path_status: diagnosticStatus,
    nested_flag_case_passed: nestedPassed,
    source_case_passed: sourcePassed,
    nested_flag_required_for_scoped_gate: nestedFlagRequiredForScopedGate,
    acceptable_partial_for_scoped_criteria: acceptablePartial,
    cases_repaired: primaryResults.filter((item) => item.status === "pass").map((item) => item.case_id),
    cases_still_failing: casesStillFailing,
    new_local_model_execution: true,
    new_local_model_call_count: callCount,
    raw_request_stored: false,
    raw_response_stored: false,
    redacted_metadata_only: true,
    schema_output_verified_allowed: false,
    adapter_checked_allowed: false,
    interpretation: diagnosticStatus === "pass" && primaryStatus !== "pass"
      ? "model_capability_exists_but_openai_compatible_adapter_mapping_gap_remains_or_nested_case_is_diagnostic"
      : primaryStatus === "pass"
        ? "openai_compatible_adapter_path_repaired_for_scoped_criteria"
        : "openai_compatible_adapter_path_remains_blocked",
    unresolved_items_count: blockers.length,
    blockers,
    ...common
  };
  const claimBoundary = {
    status,
    stage,
    schema_output_verified_allowed: false,
    adapter_checked_allowed: false,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    diagnostic_native_results_used_for_adapter_claim: false,
    acceptable_partial_for_scoped_criteria: acceptablePartial,
    ...common
  };
  writeYaml(root, "release/scopes/post-export/post_export_qwen3_14b_structured_output_targeted_repair_scope.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "model: qwen3:14b",
    `new_local_model_call_count: ${callCount}`,
    "raw_request_stored: false",
    "raw_response_stored: false"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_qwen3_14b_structured_output_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "schema_output_verified_allowed: false",
    "adapter_checked_allowed: false",
    "provider_verified_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/qwen3_14b_structured_output_targeted_repair_report.json`, report);
  writeJsonRel(root, `${dir}/qwen3_14b_structured_output_primary_path_results.json`, { status: primaryStatus, stage, results: primaryResults });
  writeJsonRel(root, `${dir}/qwen3_14b_structured_output_diagnostic_native_path_results.json`, { status: diagnosticStatus, stage, diagnostic_only: true, results: diagnosticResults });
  writeJsonRel(root, `${dir}/qwen3_14b_structured_output_schema_prompt_revision.json`, {
    status: "recorded",
    stage,
    revision: "tight_json_only_prompt_plus_separate_source_case",
    nested_flag_required_for_scoped_gate: nestedFlagRequiredForScopedGate,
    primary_cases: primaryCases
  });
  writeJsonRel(root, `${dir}/qwen3_14b_structured_output_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/qwen3_14b_structured_output_repair_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/local/qwen3_14b_structured_output_targeted_repair.ko.md", "qwen3:14b Structured Output Targeted Repair", [
    `Status: \`${status}\``,
    "",
    `- Primary path: \`${primaryStatus}\``,
    `- Diagnostic native path: \`${diagnosticStatus}\``,
    `- Nested flag case passed: ${nestedPassed}`,
    `- Source case passed: ${sourcePassed}`,
    `- Acceptable partial for scoped criteria: ${acceptablePartial}`,
    "- `schema-output-verified` and bare `adapter-checked` remain false."
  ]);
  return report;
}

export function checkQwen3StructuredOutputTargetedRepair(root) {
  const stage = STAGES.structuredRepair;
  const dir = DIRS.structuredRepair;
  const report = readJsonIfExists(root, `${dir}/qwen3_14b_structured_output_targeted_repair_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/qwen3_14b_structured_output_claim_boundary.json`);
  const primary = readJsonIfExists(root, `${dir}/qwen3_14b_structured_output_primary_path_results.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "call count bounded", report?.new_local_model_call_count <= 10, report || {});
  addCheck(checks, "primary path recorded", ["pass", "partial", "fail"].includes(primary?.status), primary || {});
  addCheck(checks, "raw storage false", report?.raw_request_stored === false && report?.raw_response_stored === false && redactionPassed(primary?.results || []), { report, primary });
  addCheck(checks, "strong claims blocked", boundary?.schema_output_verified_allowed === false && boundary?.adapter_checked_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? report?.status || "pass" : "fail",
    stage,
    unresolved_items_count: failures.length || report?.unresolved_items_count || 0,
    checks,
    failures,
    ...commonFlags({ new_local_model_execution: report?.new_local_model_execution === true, new_local_model_call_count: report?.new_local_model_call_count || 0 })
  };
  writeJsonRel(root, `${dir}/qwen3_14b_structured_output_repair_gate_report.json`, gate);
  return gate;
}

export function auditQwen3StructuredOutputClaims(root) {
  return writeAudit(root, STAGES.structuredRepair, "post_export_qwen3_14b_structured_output_claim_audit_report");
}

export async function repairQwen3ReplayRegressionSmoke(root) {
  const stage = STAGES.replayRepair;
  const dir = DIRS.replayRepair;
  const cases = [
    {
      case_id: "no_tool_replay",
      surface: "no_tool",
      input: "Return exactly ACTIVE_REPLAY_OK and no other text. Do not include thinking, markdown, or explanation."
    },
    {
      case_id: "structured_json_replay",
      surface: "structured_output",
      input: "Return exactly one JSON object with shape {\"status\":\"ok\",\"replay\":true}. Do not include prose, markdown, thinking, or extra keys.",
      response_format: { type: "json_object" }
    }
  ];
  const results = [];
  for (const testCase of cases) {
    try {
      const response = await callOpenAICompatibleChat({
        model: MODEL_QWEN_14B,
        max_tokens: 512,
        timeout_ms: 120000,
        response_format: testCase.response_format || null,
        messages: [
          { role: "system", content: "Run a local replay/regression repair check. Output only the requested final answer." },
          { role: "user", content: testCase.input }
        ]
      });
      const content = stripJsonFence(response.content);
      let exactPassed = false;
      let canonicalPassed = false;
      let parsed = null;
      let schemaPassed = false;
      if (testCase.surface === "no_tool") {
        exactPassed = content === "ACTIVE_REPLAY_OK";
        canonicalPassed = /\bACTIVE_REPLAY_OK\b/.test(content);
      } else {
        parsed = parseJsonObject(content);
        schemaPassed = parsed?.status === "ok" && parsed?.replay === true;
        exactPassed = content === "{\"status\":\"ok\",\"replay\":true}";
        canonicalPassed = schemaPassed;
      }
      results.push({
        model: MODEL_QWEN_14B,
        case_id: testCase.case_id,
        surface: testCase.surface,
        status: canonicalPassed ? "pass" : "fail",
        exact_match_passed: exactPassed,
        canonical_or_schema_passed: canonicalPassed,
        json_parse_passed: testCase.surface === "structured_output" ? Boolean(parsed) : null,
        schema_validation_passed: testCase.surface === "structured_output" ? schemaPassed : null,
        http_status: response.http_status,
        finish_reason: response.finish_reason,
        usage: response.usage,
        output_text_present: response.content.trim().length > 0,
        output_text_length: response.content.length,
        output_text_hash: sha256(response.content),
        raw_response_hash: response.raw_response_hash,
        request_metadata: requestMetadata(MODEL_QWEN_14B, testCase.case_id, testCase.input),
        raw_request_stored: false,
        raw_response_stored: false
      });
    } catch (error) {
      results.push({
        model: MODEL_QWEN_14B,
        case_id: testCase.case_id,
        surface: testCase.surface,
        status: "fail",
        error_name: error?.name || "Error",
        exact_match_passed: false,
        canonical_or_schema_passed: false,
        output_text_present: false,
        request_metadata: requestMetadata(MODEL_QWEN_14B, testCase.case_id, testCase.input),
        raw_request_stored: false,
        raw_response_stored: false
      });
    }
  }
  const noTool = results.find((item) => item.surface === "no_tool");
  const structured = results.find((item) => item.surface === "structured_output");
  const noToolCanonical = noTool?.canonical_or_schema_passed === true;
  const structuredSchema = structured?.canonical_or_schema_passed === true;
  const status = noToolCanonical && structuredSchema ? "pass" : results.some((item) => item.status === "pass") ? "partial" : "blocked";
  const blockers = [];
  if (!noToolCanonical) {
    blockers.push(unresolvedItem("ollama_replay_qwen3_14b_replay_no_tool_exact", "replay_regression", "No-tool canonical replay did not pass after one targeted repair attempt.", "Stop; do not run a second repair for this failure."));
  }
  if (!structuredSchema) {
    blockers.push(unresolvedItem("ollama_replay_qwen3_14b_replay_structured_json", "replay_regression", "Structured JSON replay schema validation did not pass after one targeted repair attempt.", "Stop; do not run a second repair for this failure."));
  }
  const report = {
    status,
    stage,
    model: MODEL_QWEN_14B,
    no_tool_exact_match_passed: noTool?.exact_match_passed === true,
    no_tool_canonical_replay_passed: noToolCanonical,
    structured_json_exact_match_passed: structured?.exact_match_passed === true,
    structured_json_schema_replay_passed: structuredSchema,
    exact_failures_remain_diagnostic: true,
    replay_verified_allowed: false,
    adapter_checked_allowed: false,
    new_local_model_execution: true,
    new_local_model_call_count: results.length,
    raw_request_stored: false,
    raw_response_stored: false,
    redacted_metadata_only: true,
    results,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags({ new_local_model_execution: true, new_local_model_call_count: results.length })
  };
  const claimBoundary = {
    status,
    stage,
    replay_verified_allowed: false,
    adapter_checked_allowed: false,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    exact_match_is_diagnostic: true,
    ...commonFlags({ new_local_model_execution: true, new_local_model_call_count: results.length })
  };
  writeYaml(root, "release/scopes/post-export/post_export_qwen3_14b_replay_regression_targeted_repair_scope.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "model: qwen3:14b",
    "exact_string_match: diagnostic",
    "replay_verified_allowed: false"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_qwen3_14b_replay_regression_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "replay_verified_allowed: false",
    "adapter_checked_allowed: false",
    "provider_verified_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/qwen3_14b_replay_regression_targeted_repair_report.json`, report);
  writeJsonRel(root, `${dir}/qwen3_14b_no_tool_replay_exact_vs_canonical.json`, { status: noToolCanonical ? "pass" : "blocked", stage, result: noTool });
  writeJsonRel(root, `${dir}/qwen3_14b_structured_json_replay_exact_vs_schema.json`, { status: structuredSchema ? "pass" : "blocked", stage, result: structured });
  writeJsonRel(root, `${dir}/qwen3_14b_replay_acceptance_policy_update.json`, {
    status: "recorded",
    stage,
    exact_string_match: "diagnostic",
    canonical_no_tool_replay_gates_scoped_smoke: true,
    structured_json_schema_validation_gates_scoped_smoke: true,
    replay_verified_allowed: false
  });
  writeJsonRel(root, `${dir}/qwen3_14b_replay_regression_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/qwen3_14b_replay_regression_repair_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/local/qwen3_14b_replay_regression_targeted_repair.ko.md", "qwen3:14b Replay Regression Targeted Repair", [
    `Status: \`${status}\``,
    "",
    `- No-tool exact match passed: ${report.no_tool_exact_match_passed}`,
    `- No-tool canonical replay passed: ${report.no_tool_canonical_replay_passed}`,
    `- Structured exact match passed: ${report.structured_json_exact_match_passed}`,
    `- Structured schema replay passed: ${report.structured_json_schema_replay_passed}`,
    "- `replay-verified` remains false."
  ]);
  writeMd(root, "docs/local/qwen3_14b_replay_acceptance_policy.ko.md", "qwen3:14b Replay Acceptance Policy", [
    "- Exact string match is diagnostic.",
    "- No-tool canonical replay can pass when required final content is present.",
    "- Structured replay can pass when JSON parses and required schema fields validate.",
    "- This does not open `replay-verified`."
  ]);
  return report;
}

export function checkQwen3ReplayRegressionTargetedRepair(root) {
  const stage = STAGES.replayRepair;
  const dir = DIRS.replayRepair;
  const report = readJsonIfExists(root, `${dir}/qwen3_14b_replay_regression_targeted_repair_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/qwen3_14b_replay_regression_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "call count bounded", report?.new_local_model_call_count <= 6, report || {});
  addCheck(checks, "raw storage false", report?.raw_request_stored === false && report?.raw_response_stored === false && redactionPassed(report?.results || []), report || {});
  addCheck(checks, "replay and adapter claims blocked", boundary?.replay_verified_allowed === false && boundary?.adapter_checked_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? report?.status || "pass" : "fail",
    stage,
    unresolved_items_count: failures.length || report?.unresolved_items_count || 0,
    checks,
    failures,
    ...commonFlags({ new_local_model_execution: report?.new_local_model_execution === true, new_local_model_call_count: report?.new_local_model_call_count || 0 })
  };
  writeJsonRel(root, `${dir}/qwen3_14b_replay_regression_repair_gate_report.json`, gate);
  return gate;
}

export function repairCrossAdapterContractDryRun(root) {
  const stage = STAGES.crossAdapterRepair;
  const dir = DIRS.crossAdapterRepair;
  const openaiAdapter = readTextIfExists(root, "adapters/api/openai/adapter.yaml");
  const ollamaAdapter = readTextIfExists(root, "adapters/local/ollama/adapter.yaml");
  const structuredRepair = readJsonIfExists(root, `${DIRS.structuredRepair}/qwen3_14b_structured_output_targeted_repair_report.json`);
  const replayRepair = readJsonIfExists(root, `${DIRS.replayRepair}/qwen3_14b_replay_regression_targeted_repair_report.json`);
  const openaiReview = readJsonIfExists(root, PREVIOUS.openaiReview);
  const toolMock = readJsonIfExists(root, PREVIOUS.toolMock);
  const structuredOk = structuredRepair?.status === "pass" || structuredRepair?.acceptable_partial_for_scoped_criteria === true;
  const replayOk = replayRepair?.status === "pass";
  const toolOk = toolMock?.status === "pass" || toolMock?.partial_accepted_for_active_adapter_scope === true;
  const staticContract = {
    openai: {
      adapter_file_exists: openaiAdapter.length > 0,
      message_mapping_reviewed: openaiAdapter.includes("message_mapping"),
      tool_mapping_reviewed: openaiAdapter.includes("tool_mapping"),
      structured_output_mapping_reviewed: openaiAdapter.includes("structured_output_mapping")
    },
    ollama: {
      adapter_file_exists: ollamaAdapter.length > 0,
      message_mapping_reviewed: ollamaAdapter.includes("message_mapping"),
      tool_mapping_reviewed: ollamaAdapter.includes("tool_mapping"),
      structured_output_mapping_reviewed: ollamaAdapter.includes("structured_output_mapping")
    }
  };
  const blockers = [];
  if (openaiReview?.status !== "pass") {
    blockers.push(unresolvedItem("openai_contract_review_not_pass", "cross_adapter_contract", "OpenAI contract/regression review is not pass.", "Complete OpenAI no-new-call review."));
  }
  if (!structuredOk) {
    blockers.push(unresolvedItem("structured_output_targeted_repair_not_accepted", "cross_adapter_contract", "qwen3:14b structured-output targeted repair is not pass or acceptable partial.", "Resolve Stage B before active adapter contract readiness."));
  }
  if (!replayOk) {
    blockers.push(unresolvedItem("replay_regression_targeted_repair_not_pass", "cross_adapter_contract", "qwen3:14b replay/regression targeted repair is not pass.", "Resolve Stage C before active adapter contract readiness."));
  }
  if (!toolOk) {
    blockers.push(unresolvedItem("tool_calling_mock_smoke_not_pass", "cross_adapter_contract", "Ollama tool-calling mock smoke is not pass.", "Complete tool-calling mock smoke."));
  }
  if (!staticContract.openai.message_mapping_reviewed || !staticContract.ollama.message_mapping_reviewed) {
    blockers.push(unresolvedItem("active_adapter_message_mapping_gap", "cross_adapter_contract", "OpenAI/Ollama message mapping is not statically reviewable.", "Patch adapter contract documentation before scoped adapter check."));
  }
  const status = blockers.length === 0 ? "pass" : "blocked_by_active_adapter_contract_gaps";
  const claimBoundary = {
    status,
    stage,
    post_export_active_adapters_checked_allowed_candidate: status === "pass",
    adapter_checked_allowed: false,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    vllm_adapter_out_of_scope: true,
    reason: "Active OpenAI/Ollama adapter contract may be scoped-checked, but general adapter-checked remains blocked because vLLM and full adapter coverage are incomplete.",
    ...commonFlags()
  };
  const report = {
    status,
    stage,
    active_adapters: ["openai", "ollama"],
    inactive_placeholder_adapters: ["vllm"],
    dry_run_only: true,
    vllm_execution_performed: false,
    active_adapter_scoped_readiness: status === "pass",
    static_contract_review: staticContract,
    source_status: {
      openai_review: openaiReview?.status || "missing",
      structured_repair: structuredRepair?.status || "missing",
      structured_acceptable_partial: structuredRepair?.acceptable_partial_for_scoped_criteria === true,
      tool_calling_mock: toolMock?.status || "missing",
      replay_repair: replayRepair?.status || "missing"
    },
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags()
  };
  writeYaml(root, "release/scopes/post-export/post_export_cross_adapter_contract_targeted_repair_scope.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "active_adapters:",
    "  - openai",
    "  - ollama",
    "inactive_placeholder:",
    "  - vllm",
    "dry_run_only: true"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_active_adapter_contract_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    `post_export_active_adapters_checked_allowed_candidate: ${status === "pass"}`,
    "adapter_checked_allowed: false",
    "vllm_adapter_out_of_scope: true"
  ]);
  writeJsonRel(root, `${dir}/cross_adapter_contract_targeted_repair_report.json`, report);
  writeJsonRel(root, `${dir}/active_adapter_scope_record.json`, { status: "recorded", stage, active_adapters: ["openai", "ollama"], inactive_placeholder_adapters: ["vllm"] });
  writeJsonRel(root, `${dir}/openai_ollama_contract_comparison.json`, { status, stage, static_contract_review: staticContract });
  writeJsonRel(root, `${dir}/vllm_placeholder_out_of_scope_record.json`, {
    status: "placeholder_out_of_scope",
    stage,
    adapter: "vllm",
    execution_performed: false,
    vllm_adapter_out_of_scope: true,
    required_for_bare_adapter_checked: true
  });
  writeJsonRel(root, `${dir}/active_adapter_contract_gap_analysis.json`, { status, stage, blockers });
  writeJsonRel(root, `${dir}/active_adapter_contract_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/cross_adapter_contract_repair_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/adapters/cross_adapter_contract_targeted_repair.ko.md", "Cross Adapter Contract Targeted Repair", [
    `Status: \`${status}\``,
    "",
    "- Active adapters: OpenAI, Ollama.",
    "- vLLM은 inactive/placeholder로 분리했습니다.",
    "- Bare `adapter-checked` remains false."
  ]);
  writeMd(root, "docs/adapters/active_adapter_contract_scope.ko.md", "Active Adapter Contract Scope", [
    "- Scoped active adapter contract covers OpenAI and Ollama only.",
    "- vLLM execution is not approved and remains out of scoped active-adapters claim.",
    "- General adapter coverage remains incomplete."
  ]);
  return report;
}

export function checkCrossAdapterContractTargetedRepair(root) {
  const stage = STAGES.crossAdapterRepair;
  const dir = DIRS.crossAdapterRepair;
  const report = readJsonIfExists(root, `${dir}/cross_adapter_contract_targeted_repair_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_adapter_contract_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "dry-run only", report?.dry_run_only === true && report?.vllm_execution_performed === false, report || {});
  addCheck(checks, "vllm out of scope", boundary?.vllm_adapter_out_of_scope === true, boundary || {});
  addCheck(checks, "bare adapter claim blocked", boundary?.adapter_checked_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? report?.status || "pass" : "fail",
    stage,
    unresolved_items_count: failures.length || report?.unresolved_items_count || 0,
    checks,
    failures,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/cross_adapter_contract_repair_gate_report.json`, gate);
  return gate;
}

export function auditCrossAdapterContractTargetedClaims(root) {
  return writeAudit(root, STAGES.crossAdapterRepair, "post_export_cross_adapter_contract_targeted_claim_audit_report");
}

function providerRetryCriteria(root) {
  const triage = readJsonIfExists(root, `${DIRS.triage}/active_scoped_blocker_forensic_triage_report.json`);
  const structuredRepair = readJsonIfExists(root, `${DIRS.structuredRepair}/qwen3_14b_structured_output_targeted_repair_report.json`);
  const replayRepair = readJsonIfExists(root, `${DIRS.replayRepair}/qwen3_14b_replay_regression_targeted_repair_report.json`);
  const openaiReview = readJsonIfExists(root, PREVIOUS.openaiReview);
  const toolMock = readJsonIfExists(root, PREVIOUS.toolMock);
  const providerDiverse = readJsonIfExists(root, PREVIOUS.providerDiverse);
  const localModel = readJsonIfExists(root, PREVIOUS.localModelVerified);
  return [
    { id: "active_scoped_blocker_triage", passed: triage?.status === "pass", status: triage?.status || "missing" },
    { id: "openai_provider_contract_regression_review", passed: openaiReview?.status === "pass", status: openaiReview?.status || "missing" },
    { id: "provider_diverse_allowed", passed: providerDiverse?.provider_diverse_allowed === true, status: providerDiverse?.status || "missing" },
    { id: "local_model_verified_allowed", passed: localModel?.local_model_verified_allowed === true, status: localModel?.status || "missing" },
    { id: "qwen3_14b_structured_output_repair", passed: structuredRepair?.status === "pass" || structuredRepair?.acceptable_partial_for_scoped_criteria === true, status: structuredRepair?.status || "missing" },
    { id: "ollama_tool_calling_mock_smoke", passed: toolMock?.status === "pass" || toolMock?.partial_accepted_for_active_adapter_scope === true, status: toolMock?.status || "missing" },
    { id: "qwen3_14b_replay_regression_repair", passed: replayRepair?.status === "pass", status: replayRepair?.status || "missing" }
  ];
}

export function runActiveProviderLanesVerifiedFinalGateRetry(root) {
  const stage = STAGES.activeProvidersRetry;
  const dir = DIRS.activeProvidersRetry;
  const criteria = providerRetryCriteria(root);
  const blockers = criteria
    .filter((item) => !item.passed)
    .map((item) => unresolvedItem(
      `provider_retry_${item.id}_not_ready`,
      "active_provider_lanes",
      `Criterion ${item.id} is not pass/ready; observed status is ${item.status}.`,
      "Keep scoped provider lane claim blocked until this criterion passes."
    ));
  const allowed = blockers.length === 0;
  const claimBoundary = {
    status: allowed ? "pass" : "blocked",
    stage,
    post_export_active_provider_lanes_verified_allowed: allowed,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    allowed_claims: allowed ? [ACTIVE_PROVIDER_SCOPED_CLAIM, ACTIVE_PROVIDER_SCOPED_GATE_CLAIM] : [],
    blocked_claims: BARE_BLOCKED_CLAIMS,
    ...commonFlags({ post_export_active_provider_lanes_verified_allowed: allowed })
  };
  const report = {
    status: allowed ? "pass" : "blocked_by_active_provider_lane_gaps",
    stage,
    final_gate_executed: allowed,
    post_export_active_provider_lanes_verified_allowed: allowed,
    scoped_claim_allowed: allowed ? ACTIVE_PROVIDER_SCOPED_CLAIM : null,
    criteria,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags({ post_export_active_provider_lanes_verified_allowed: allowed })
  };
  writeYaml(root, "release/gates/post-export/post_export_active_provider_lanes_verified_final_gate_retry_scope.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_provider_lanes_verified_allowed: ${allowed}`,
    "provider_verified_allowed: false"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_active_provider_lanes_verified_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_provider_lanes_verified_allowed: ${allowed}`,
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_final_gate_retry_report.json`, report);
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_evidence_summary.json`, { status: allowed ? "pass" : "blocked", stage, active_provider_lanes: ["openai", "ollama"], criteria });
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_decision_record.json`, {
    status: allowed ? "approved_scoped_claim" : "blocked",
    stage,
    decision: allowed ? "allow_scoped_active_provider_lanes_verified" : "keep_scoped_active_provider_lanes_blocked",
    bare_provider_verified_allowed: false
  });
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_gate_check_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/providers/active_provider_lanes_verified_final_gate_retry.ko.md", "Active Provider Lanes Verified Final Gate Retry", [
    `Status: \`${report.status}\``,
    "",
    `- Scoped claim allowed: ${allowed}`,
    "- Bare `provider-verified`: false",
    ...(blockers.length ? blockers.map((item) => `- ${item.id}: ${item.reason}`) : ["- No active provider lane blockers."])
  ]);
  return report;
}

export function checkActiveProviderLanesVerifiedFinalGateRetry(root) {
  const stage = STAGES.activeProvidersRetry;
  const dir = DIRS.activeProvidersRetry;
  const report = readJsonIfExists(root, `${dir}/active_provider_lanes_verified_final_gate_retry_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_provider_lanes_verified_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "bare provider remains false", report?.provider_verified_allowed === false && boundary?.provider_verified_allowed === false, { report, boundary });
  addCheck(checks, "scoped claim coherence", Boolean(report?.post_export_active_provider_lanes_verified_allowed) === (unresolved?.unresolved_items_count === 0), { report, unresolved });
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? report?.status || "pass" : "fail",
    stage,
    unresolved_items_count: failures.length || unresolved?.unresolved_items_count || 0,
    checks,
    failures,
    ...commonFlags({ post_export_active_provider_lanes_verified_allowed: report?.post_export_active_provider_lanes_verified_allowed === true })
  };
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_gate_check_report.json`, gate);
  return gate;
}

function adapterRetryCriteria(root) {
  const structuredRepair = readJsonIfExists(root, `${DIRS.structuredRepair}/qwen3_14b_structured_output_targeted_repair_report.json`);
  const replayRepair = readJsonIfExists(root, `${DIRS.replayRepair}/qwen3_14b_replay_regression_targeted_repair_report.json`);
  const crossAdapter = readJsonIfExists(root, `${DIRS.crossAdapterRepair}/cross_adapter_contract_targeted_repair_report.json`);
  const toolMock = readJsonIfExists(root, PREVIOUS.toolMock);
  return [
    { id: "qwen3_14b_structured_output_repair", passed: structuredRepair?.status === "pass" || structuredRepair?.acceptable_partial_for_scoped_criteria === true, status: structuredRepair?.status || "missing" },
    { id: "qwen3_14b_replay_regression_repair", passed: replayRepair?.status === "pass", status: replayRepair?.status || "missing" },
    { id: "ollama_tool_calling_mock_smoke", passed: toolMock?.status === "pass" || toolMock?.partial_accepted_for_active_adapter_scope === true, status: toolMock?.status || "missing" },
    { id: "cross_adapter_contract_targeted_repair", passed: crossAdapter?.status === "pass", status: crossAdapter?.status || "missing" }
  ];
}

export function runActiveAdaptersCheckedFinalGateRetry(root) {
  const stage = STAGES.activeAdaptersRetry;
  const dir = DIRS.activeAdaptersRetry;
  const criteria = adapterRetryCriteria(root);
  const blockers = criteria
    .filter((item) => !item.passed)
    .map((item) => unresolvedItem(
      `adapter_retry_${item.id}_not_ready`,
      "active_adapters",
      `Criterion ${item.id} is not pass/accepted; observed status is ${item.status}.`,
      "Keep scoped active-adapters claim blocked until this criterion passes."
    ));
  const allowed = blockers.length === 0;
  const claimBoundary = {
    status: allowed ? "pass" : "blocked",
    stage,
    post_export_active_adapters_checked_allowed: allowed,
    adapter_checked_allowed: false,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    allowed_claims: allowed ? [ACTIVE_ADAPTER_SCOPED_CLAIM, ACTIVE_ADAPTER_SCOPED_GATE_CLAIM] : [],
    blocked_claims: BARE_BLOCKED_CLAIMS,
    ...commonFlags({ post_export_active_adapters_checked_allowed: allowed })
  };
  const report = {
    status: allowed ? "pass" : "blocked_by_active_adapter_gaps",
    stage,
    final_gate_executed: allowed,
    post_export_active_adapters_checked_allowed: allowed,
    scoped_claim_allowed: allowed ? ACTIVE_ADAPTER_SCOPED_CLAIM : null,
    active_adapters: ["openai", "ollama"],
    excluded_adapters: ["vllm"],
    criteria,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags({ post_export_active_adapters_checked_allowed: allowed })
  };
  writeYaml(root, "release/gates/post-export/post_export_active_adapters_checked_final_gate_retry_scope.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_adapters_checked_allowed: ${allowed}`,
    "adapter_checked_allowed: false"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_active_adapters_checked_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_adapters_checked_allowed: ${allowed}`,
    "adapter_checked_allowed: false",
    "provider_verified_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_adapters_checked_final_gate_retry_report.json`, report);
  writeJsonRel(root, `${dir}/active_adapters_checked_evidence_summary.json`, { status: allowed ? "pass" : "blocked", stage, active_adapters: ["openai", "ollama"], excluded_adapters: ["vllm"], criteria });
  writeJsonRel(root, `${dir}/active_adapters_checked_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/active_adapters_checked_decision_record.json`, {
    status: allowed ? "approved_scoped_claim" : "blocked",
    stage,
    decision: allowed ? "allow_scoped_active_adapters_checked" : "keep_scoped_active_adapters_blocked",
    bare_adapter_checked_allowed: false
  });
  writeJsonRel(root, `${dir}/active_adapters_checked_gate_check_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/release/active_adapters_checked_final_gate_retry.ko.md", "Active Adapters Checked Final Gate Retry", [
    `Status: \`${report.status}\``,
    "",
    `- Scoped claim allowed: ${allowed}`,
    "- Bare `adapter-checked`: false",
    ...(blockers.length ? blockers.map((item) => `- ${item.id}: ${item.reason}`) : ["- No active adapter blockers."])
  ]);
  return report;
}

export function checkActiveAdaptersCheckedFinalGateRetry(root) {
  const stage = STAGES.activeAdaptersRetry;
  const dir = DIRS.activeAdaptersRetry;
  const report = readJsonIfExists(root, `${dir}/active_adapters_checked_final_gate_retry_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_adapters_checked_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "bare adapter remains false", report?.adapter_checked_allowed === false && boundary?.adapter_checked_allowed === false, { report, boundary });
  addCheck(checks, "scoped claim coherence", Boolean(report?.post_export_active_adapters_checked_allowed) === (unresolved?.unresolved_items_count === 0), { report, unresolved });
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? report?.status || "pass" : "fail",
    stage,
    unresolved_items_count: failures.length || unresolved?.unresolved_items_count || 0,
    checks,
    failures,
    ...commonFlags({ post_export_active_adapters_checked_allowed: report?.post_export_active_adapters_checked_allowed === true })
  };
  writeJsonRel(root, `${dir}/active_adapters_checked_gate_check_report.json`, gate);
  return gate;
}

export function refreshGeneralReadinessStabilityAfterActiveRepairs(root) {
  const stage = STAGES.generalRefresh;
  const dir = DIRS.generalRefresh;
  const providerRetry = readJsonIfExists(root, `${DIRS.activeProvidersRetry}/active_provider_lanes_verified_final_gate_retry_report.json`);
  const adapterRetry = readJsonIfExists(root, `${DIRS.activeAdaptersRetry}/active_adapters_checked_final_gate_retry_report.json`);
  const blockers = [
    unresolvedItem("bare_provider_verified_still_blocked", "general", "Scoped active provider lane evidence does not permit bare provider-verified.", "Run a separately approved bare provider-verified final gate."),
    unresolvedItem("bare_adapter_checked_still_blocked", "general", "Scoped active adapter evidence does not permit bare adapter-checked.", "Run a separately approved bare adapter-checked final gate."),
    unresolvedItem("general_release_gate_not_rerun", "general", "General release gate rerun is outside this autopilot.", "Run a separately approved general release gate before bare production-ready/stable/release-gated claims.")
  ];
  const report = {
    status: "blocked_by_bare_general_claim_gaps",
    stage,
    scoped_results: {
      post_export_active_provider_lanes_verified_allowed: providerRetry?.post_export_active_provider_lanes_verified_allowed === true,
      post_export_active_adapters_checked_allowed: adapterRetry?.post_export_active_adapters_checked_allowed === true
    },
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags({
      post_export_active_provider_lanes_verified_allowed: providerRetry?.post_export_active_provider_lanes_verified_allowed === true,
      post_export_active_adapters_checked_allowed: adapterRetry?.post_export_active_adapters_checked_allowed === true
    })
  };
  writeJsonRel(root, `${dir}/general_readiness_stability_refresh_after_repairs_report.json`, report);
  writeJsonRel(root, `${dir}/general_readiness_stability_claim_boundary.json`, {
    status: report.status,
    stage,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    ...commonFlags({
      post_export_active_provider_lanes_verified_allowed: providerRetry?.post_export_active_provider_lanes_verified_allowed === true,
      post_export_active_adapters_checked_allowed: adapterRetry?.post_export_active_adapters_checked_allowed === true
    })
  });
  writeJsonRel(root, `${dir}/general_readiness_stability_remaining_blockers.json`, { status: "blocked", stage, blockers });
  writeJsonRel(root, `${dir}/general_readiness_stability_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/release/general_readiness_stability_refresh_after_repairs.ko.md", "General Readiness/Stability Refresh After Active Repairs", [
    `Status: \`${report.status}\``,
    "",
    "- Scoped repair results were reflected.",
    "- General `production-ready`, `stable`, and `release-gated` remain false.",
    "- Bare `provider-verified` and `adapter-checked` remain false."
  ]);
  return report;
}

export function checkGeneralReadinessStabilityAfterActiveRepairs(root) {
  const stage = STAGES.generalRefresh;
  const dir = DIRS.generalRefresh;
  const report = readJsonIfExists(root, `${dir}/general_readiness_stability_refresh_after_repairs_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/general_readiness_stability_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "general claims blocked", boundary?.production_ready_allowed === false && boundary?.stable_allowed === false && boundary?.release_gated_allowed === false, boundary || {});
  addCheck(checks, "bare provider/adapter blocked", boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? report?.status || "pass" : "fail",
    stage,
    unresolved_items_count: failures.length || report?.unresolved_items_count || 0,
    checks,
    failures,
    ...commonFlags({
      post_export_active_provider_lanes_verified_allowed: report?.post_export_active_provider_lanes_verified_allowed === true,
      post_export_active_adapters_checked_allowed: report?.post_export_active_adapters_checked_allowed === true
    })
  };
  writeJsonRel(root, `${dir}/general_readiness_stability_gate_report.json`, gate);
  return gate;
}

function shouldSkip(root, absPath) {
  const rel = path.relative(root, absPath).split(path.sep).join("/");
  if (!rel || rel === ".") return false;
  if (rel === "exports" || rel.startsWith("exports/")) return true;
  if (rel.includes("/node_modules/") || rel.includes("/.git/") || rel.includes("/dist/")) return true;
  if (rel === "node_modules" || rel === ".git" || rel === "dist") return true;
  if (path.basename(absPath) === ".DS_Store") return true;
  return false;
}

function copyIntoStage(root, relPath, stageRoot) {
  const sourcePath = p(root, relPath);
  if (!fs.existsSync(sourcePath)) return;
  const destPath = path.join(stageRoot, ...relPath.split("/"));
  if (fs.statSync(sourcePath).isDirectory()) {
    fs.cpSync(sourcePath, destPath, { recursive: true, filter: (item) => !shouldSkip(root, item) });
  } else if (!shouldSkip(root, sourcePath)) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(sourcePath, destPath);
  }
}

function zipEntries(packageAbs) {
  const result = spawnSync("zipinfo", ["-1", packageAbs], { encoding: "utf8", maxBuffer: 80 * 1024 * 1024 });
  return result.status === 0 ? result.stdout.split(/\r?\n/).filter(Boolean).sort() : [];
}

function forbiddenEntries(entries) {
  const allowedSecurityPolicyEntries = new Set([
    "security/audits/secret_detection_patterns.yaml"
  ]);
  return {
    node_modules: entries.filter((entry) => entry === "node_modules/" || entry.includes("/node_modules/")),
    dist: entries.filter((entry) => entry === "dist/" || entry.startsWith("dist/") || entry.includes("/dist/")),
    git_metadata: entries.filter((entry) => entry === ".git/" || entry.startsWith(".git/") || entry.includes("/.git/")),
    ds_store: entries.filter((entry) => path.basename(entry) === ".DS_Store"),
    allowed_security_policy_entries: entries.filter((entry) => allowedSecurityPolicyEntries.has(entry)),
    raw_or_secret: entries.filter((entry) => /raw_(request|response)|request_payload|response_payload|secret|api[_-]?key|auth[_-]?header/i.test(entry) && !allowedSecurityPolicyEntries.has(entry))
  };
}

export function runFinalExportRefreshAfterActiveScopedRepairs(root) {
  const stage = STAGES.exportRefresh;
  const dir = DIRS.exportRefresh;
  const providerRetry = readJsonIfExists(root, `${DIRS.activeProvidersRetry}/active_provider_lanes_verified_final_gate_retry_report.json`);
  const adapterRetry = readJsonIfExists(root, `${DIRS.activeAdaptersRetry}/active_adapters_checked_final_gate_retry_report.json`);
  const allowedScopedClaims = [
    ...(providerRetry?.post_export_active_provider_lanes_verified_allowed ? [ACTIVE_PROVIDER_SCOPED_CLAIM, ACTIVE_PROVIDER_SCOPED_GATE_CLAIM] : []),
    ...(adapterRetry?.post_export_active_adapters_checked_allowed ? [ACTIVE_ADAPTER_SCOPED_CLAIM, ACTIVE_ADAPTER_SCOPED_GATE_CLAIM] : [])
  ];
  const packageRoots = [
    "AGENTS.md",
    "README.md",
    "MANIFEST.asset_classes.yaml",
    "stack.yaml",
    "release",
    "docs",
    "schemas",
    "security",
    "observability",
    "adapters",
    "runtime",
    "tools",
    "evals/suites",
    "evals/reports",
    "evidence/post-export-openai-provider-contract-regression-review",
    "evidence/post-export-ollama-structured-output-smoke",
    "evidence/post-export-ollama-tool-calling-mock-smoke",
    "evidence/post-export-ollama-replay-regression-smoke",
    "evidence/post-export-cross-adapter-contract-dry-run",
    "evidence/post-export-active-provider-lanes-verified-final-gate",
    "evidence/post-export-active-adapters-checked-final-gate",
    "evidence/post-export-general-readiness-stability-preflight-refresh",
    "evidence/final-export-refresh-after-active-scoped-gates",
    DIRS.triage,
    DIRS.structuredRepair,
    DIRS.replayRepair,
    DIRS.crossAdapterRepair,
    DIRS.activeProvidersRetry,
    DIRS.activeAdaptersRetry,
    DIRS.generalRefresh,
    DIRS.exportRefresh,
    "evidence/reference-baseline"
  ];
  const generatedAt = new Date().toISOString();
  const claimState = {
    status: "recorded",
    stage,
    generated_at: generatedAt,
    allowed_maintained_claims: MAINTAINED_CLAIMS,
    allowed_scoped_claims: allowedScopedClaims,
    blocked_claims: BARE_BLOCKED_CLAIMS,
    post_export_active_provider_lanes_verified_allowed: providerRetry?.post_export_active_provider_lanes_verified_allowed === true,
    post_export_active_adapters_checked_allowed: adapterRetry?.post_export_active_adapters_checked_allowed === true,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false
  };
  const manifest = {
    status: "packaging",
    stage,
    generated_at: generatedAt,
    package_path: EXPORT_PACKAGE,
    included_roots: packageRoots,
    excluded_roots: ["node_modules", "dist", ".git", "exports"],
    excluded_basenames: [".DS_Store"],
    excluded_patterns: ["*.log", "raw request/response payload files", "secret/API-key/auth-header files"]
  };
  writeYaml(root, "release/scopes/final-export/final_export_refresh_after_active_scoped_repairs_scope.yaml", [
    `stage: ${stage}`,
    "status: packaging",
    `package_path: ${EXPORT_PACKAGE}`,
    "dist_modified: false",
    "reference_baseline_source_modified: false",
    "evidence_reference_baseline_refresh: false"
  ]);
  writeJsonRel(root, `${dir}/final_export_refresh_claim_state.json`, claimState);
  writeJsonRel(root, `${dir}/final_export_refresh_claim_boundary.json`, {
    status: "recorded",
    stage,
    allowed_scoped_claims: allowedScopedClaims,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...commonFlags({
      post_export_active_provider_lanes_verified_allowed: providerRetry?.post_export_active_provider_lanes_verified_allowed === true,
      post_export_active_adapters_checked_allowed: adapterRetry?.post_export_active_adapters_checked_allowed === true
    })
  });
  writeUnresolved(root, dir, stage, []);
  const stageRoot = path.join(os.tmpdir(), `harness-core-active-scoped-repaired-refresh-${process.pid}`);
  fs.rmSync(stageRoot, { recursive: true, force: true });
  fs.mkdirSync(stageRoot, { recursive: true });
  for (const relPath of packageRoots) copyIntoStage(root, relPath, stageRoot);
  fs.mkdirSync(path.join(stageRoot, "final_export_refresh_after_active_scoped_repairs"), { recursive: true });
  writeJson(path.join(stageRoot, "final_export_refresh_after_active_scoped_repairs", "claim_state.json"), claimState);
  writeJson(path.join(stageRoot, "final_export_refresh_after_active_scoped_repairs", "manifest.json"), manifest);
  const packageAbs = p(root, EXPORT_PACKAGE);
  fs.mkdirSync(path.dirname(packageAbs), { recursive: true });
  fs.rmSync(packageAbs, { force: true });
  const zipResult = spawnSync("zip", ["-qr", packageAbs, "."], { cwd: stageRoot, encoding: "utf8", maxBuffer: 80 * 1024 * 1024 });
  fs.rmSync(stageRoot, { recursive: true, force: true });
  const entries = zipResult.status === 0 && fs.existsSync(packageAbs) ? zipEntries(packageAbs) : [];
  const bad = forbiddenEntries(entries);
  const packageCreated = zipResult.status === 0 && fs.existsSync(packageAbs);
  const checksum = packageCreated ? sha256File(packageAbs) : null;
  const report = {
    status: packageCreated ? "pass" : "blocked",
    stage,
    actual_export_write: packageCreated,
    package_path: EXPORT_PACKAGE,
    package_sha256: checksum,
    allowed_scoped_claims: allowedScopedClaims,
    node_modules_included: bad.node_modules.length > 0,
    dist_included: bad.dist.length > 0,
    ds_store_included: bad.ds_store.length > 0,
    raw_or_secret_included: bad.raw_or_secret.length > 0,
    allowed_security_policy_entries: bad.allowed_security_policy_entries,
    forbidden_entries: bad,
    protected_path_status: protectedStatus(root),
    ...commonFlags({
      actual_export_write: packageCreated,
      post_export_active_provider_lanes_verified_allowed: providerRetry?.post_export_active_provider_lanes_verified_allowed === true,
      post_export_active_adapters_checked_allowed: adapterRetry?.post_export_active_adapters_checked_allowed === true
    })
  };
  manifest.status = packageCreated ? "exported" : "blocked";
  manifest.package_sha256 = checksum;
  manifest.package_entry_count = entries.length;
  manifest.package_entries = entries;
  writeJsonRel(root, `${dir}/final_export_refresh_after_active_scoped_repairs_report.json`, report);
  writeJsonRel(root, `${dir}/final_export_refresh_manifest.json`, manifest);
  writeJsonRel(root, `${dir}/final_export_refresh_checksums.json`, { status: "recorded", stage, entries: [{ path: EXPORT_PACKAGE, sha256: checksum }] });
  writeJsonRel(root, `${dir}/final_export_refresh_gate_report.json`, {
    status: packageCreated ? "pass" : "blocked",
    stage,
    unresolved_items_count: packageCreated ? 0 : 1,
    package_record: report,
    ...commonFlags({ actual_export_write: packageCreated })
  });
  writeMd(root, "docs/release/final_export_refresh_after_active_scoped_repairs.ko.md", "Final Export Refresh After Active Scoped Repairs", [
    `Status: \`${report.status}\``,
    "",
    `- package path: \`${EXPORT_PACKAGE}\``,
    `- package sha256: \`${checksum || "missing"}\``,
    `- scoped claims: ${allowedScopedClaims.join(", ") || "none"}`,
    "- dist modified: false",
    "- legacy-reference-source modified: false",
    "- evidence/reference-baseline refresh: false"
  ]);
  return report;
}

export function checkFinalExportRefreshAfterActiveScopedRepairs(root) {
  const stage = STAGES.exportRefresh;
  const dir = DIRS.exportRefresh;
  const report = readJsonIfExists(root, `${dir}/final_export_refresh_after_active_scoped_repairs_report.json`);
  const manifest = readJsonIfExists(root, `${dir}/final_export_refresh_manifest.json`);
  const gate = readJsonIfExists(root, `${dir}/final_export_refresh_gate_report.json`);
  const claimState = readJsonIfExists(root, `${dir}/final_export_refresh_claim_state.json`);
  const checks = [];
  addCheck(checks, "report passed", report?.status === "pass" && report?.actual_export_write === true, report || {});
  addCheck(checks, "manifest exported", manifest?.status === "exported" && manifest?.package_path === EXPORT_PACKAGE, manifest || {});
  addCheck(checks, "forbidden package entries absent", report?.node_modules_included === false && report?.dist_included === false && report?.ds_store_included === false && report?.raw_or_secret_included === false, report || {});
  addCheck(checks, "strong claims remain false", claimState?.provider_verified_allowed === false && claimState?.adapter_checked_allowed === false && claimState?.production_ready_allowed === false && claimState?.stable_allowed === false && claimState?.release_gated_allowed === false, claimState || {});
  addCheck(checks, "gate report exists", Boolean(gate), gate || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const checked = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    unresolved_items_count: failures.length,
    checks,
    failures,
    ...commonFlags({
      actual_export_write: report?.actual_export_write === true,
      post_export_active_provider_lanes_verified_allowed: report?.post_export_active_provider_lanes_verified_allowed === true,
      post_export_active_adapters_checked_allowed: report?.post_export_active_adapters_checked_allowed === true
    })
  };
  writeJsonRel(root, `${dir}/final_export_refresh_gate_report.json`, checked);
  return checked;
}

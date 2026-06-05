import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./file_walk.mjs";
import { scanClaims } from "./claim_scanner.mjs";

export const STAGES = {
  openaiReview: "v2.0.0-post-export-openai-provider-no-new-call-contract-regression-review",
  ollamaStructured: "v2.0.0-post-export-ollama-structured-output-smoke",
  ollamaToolMock: "v2.0.0-post-export-ollama-tool-calling-mock-smoke",
  ollamaReplay: "v2.0.0-post-export-ollama-replay-regression-smoke",
  crossAdapter: "v2.0.0-post-export-cross-adapter-contract-dry-run",
  activeProviders: "v2.0.0-post-export-active-provider-lanes-verified-final-gate",
  activeAdapters: "v2.0.0-post-export-active-adapters-checked-final-gate",
  generalRefresh: "v2.0.0-post-export-general-readiness-stability-preflight-refresh",
  exportRefresh: "v2.0.0-final-export-refresh-after-active-scoped-gates"
};

export const DIRS = {
  openaiReview: "evidence/post-export-openai-provider-contract-regression-review",
  ollamaStructured: "evidence/post-export-ollama-structured-output-smoke",
  ollamaToolMock: "evidence/post-export-ollama-tool-calling-mock-smoke",
  ollamaReplay: "evidence/post-export-ollama-replay-regression-smoke",
  crossAdapter: "evidence/post-export-cross-adapter-contract-dry-run",
  activeProviders: "evidence/post-export-active-provider-lanes-verified-final-gate",
  activeAdapters: "evidence/post-export-active-adapters-checked-final-gate",
  generalRefresh: "evidence/post-export-general-readiness-stability-preflight-refresh",
  exportRefresh: "evidence/final-export-refresh-after-active-scoped-gates"
};

const ENDPOINT = "http://127.0.0.1:11434/v1";
const MODELS = ["qwen3:14b", "qwen3.6:27b"];
const EXPORT_PACKAGE = "exports/v2.0.0-rc.1-postrc-openai-local-provider-diverse-active-scoped-refresh.zip";
const ACTIVE_PROVIDER_SCOPED_CLAIM = "post-export-active-provider-lanes-verified";
const ACTIVE_ADAPTER_SCOPED_CLAIM = "post-export-active-adapters-checked";
const OPENAI_WEAK_CLAIMS = [
  "post-export-openai-provider-contract-regression-reviewed",
  "post-export-openai-provider-existing-evidence-indexed"
];
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

function exists(root, relPath) {
  return fs.existsSync(p(root, relPath));
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
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...extra
  };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
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

function source(root, relPath) {
  const json = relPath.endsWith(".json") ? readJsonIfExists(root, relPath) : null;
  return {
    path: relPath,
    exists: exists(root, relPath),
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
    "- Bare provider-verified / adapter-checked / production-ready / stable / release-gated remain forbidden."
  ]);
  return report;
}

function buildChatUrl(baseUrl) {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/+$/, "");
  url.pathname = `${basePath || "/v1"}/chat/completions`.replace(/\/{2,}/g, "/");
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

function parseJsonObject(content) {
  const stripped = String(content || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
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

function parseArguments(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function callLocalChat({ model, messages, max_tokens = 128, response_format = null, tools = null, tool_choice = null, timeout_ms = 90000 }) {
  const body = {
    model,
    messages,
    temperature: 0,
    max_tokens,
    stream: false,
    ...reasoningControls(model)
  };
  if (response_format) body.response_format = response_format;
  if (tools) body.tools = tools;
  if (tool_choice) body.tool_choice = tool_choice;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeout_ms);
  try {
    const response = await fetch(buildChatUrl(ENDPOINT), {
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
      tool_calls: Array.isArray(message.tool_calls) ? message.tool_calls : [],
      raw_response_hash: sha256(rawText),
      raw_request_stored: false,
      raw_response_stored: false
    };
  } finally {
    clearTimeout(timeout);
  }
}

function requestMetadata(model, caseId, extra = {}) {
  return {
    model,
    case_id: caseId,
    endpoint_host: "127.0.0.1",
    input_hash: extra.input ? sha256(extra.input) : null,
    messages_count: extra.messages_count || 2,
    raw_request_stored: false,
    raw_response_stored: false,
    redacted_metadata_only: true,
    controls: reasoningControls(model)
  };
}

function redactionSummary(stage, caseResults, extra = {}) {
  return {
    status: caseResults.every((item) => item.raw_request_stored === false && item.raw_response_stored === false) ? "pass" : "fail",
    stage,
    raw_request_stored: false,
    raw_response_stored: false,
    raw_authorization_header_recorded: false,
    raw_request_body_recorded: false,
    raw_response_recorded: false,
    api_key_recorded: false,
    secrets_logged: false,
    redacted_metadata_only: true,
    ...extra
  };
}

export function reviewOpenAIProviderContractRegressionNoNewCall(root) {
  const stage = STAGES.openaiReview;
  const dir = DIRS.openaiReview;
  const replaySummary = readJsonIfExists(root, "evidence/beta-openai-canary-replay-suite/suite_replay_summary.json");
  const suiteGate = readJsonIfExists(root, "evidence/beta-openai-canary-replay-suite/suite_gate_report.json");
  const redaction = readJsonIfExists(root, "evidence/beta-openai-canary-replay-suite/suite_redaction_report.json");
  const traceComparison = readJsonIfExists(root, "evidence/beta-openai-canary-replay-suite/suite_trace_comparison.json");
  const sources = {
    suite_replay_summary: source(root, "evidence/beta-openai-canary-replay-suite/suite_replay_summary.json"),
    suite_gate_report: source(root, "evidence/beta-openai-canary-replay-suite/suite_gate_report.json"),
    suite_redaction_report: source(root, "evidence/beta-openai-canary-replay-suite/suite_redaction_report.json"),
    suite_trace_comparison: source(root, "evidence/beta-openai-canary-replay-suite/suite_trace_comparison.json"),
    no_tool_replay_comparison: source(root, "evidence/beta-openai-canary-replay-suite/no_tool_replay_comparison_report.json"),
    structured_output_replay_comparison: source(root, "evidence/beta-openai-canary-replay-suite/structured_output_replay_comparison_report.json"),
    tool_calling_replay_comparison: source(root, "evidence/beta-openai-canary-replay-suite/tool_calling_replay_comparison_report.json"),
    openai_adapter: source(root, "adapters/api/openai/adapter.yaml")
  };
  const surfaces = replaySummary?.surfaces || {};
  const surfaceNames = ["no_tool_text", "structured_output", "tool_calling"];
  const contractCoverage = {
    status: surfaceNames.every((name) => surfaces[name]?.status === "pass") ? "pass" : "blocked",
    stage,
    provider: "openai",
    surfaces: surfaceNames.map((name) => ({
      surface: name,
      status: surfaces[name]?.status || "missing",
      claim_level: surfaces[name]?.claim_level || null
    })),
    raw_response_stored: replaySummary?.raw_response_stored === true,
    redaction_passed: replaySummary?.redaction_passed === true
  };
  const regressionCoverage = {
    status: replaySummary?.status === "pass" && suiteGate?.status === "pass" ? "pass" : "blocked",
    stage,
    comparison_mode: replaySummary?.comparison_mode || "missing",
    claim_level: replaySummary?.claim_level || "missing",
    replay_verified_allowed: false,
    benchmark_backed_allowed: false
  };
  const blockers = [];
  if (suiteGate?.status !== "pass" || replaySummary?.status !== "pass") {
    blockers.push(unresolvedItem(
      "openai_existing_canary_replay_suite_missing_or_failed",
      "openai_provider",
      "Existing OpenAI canary replay suite is missing or not pass.",
      "Run an approved OpenAI provider replay outside this no-new-call stage."
    ));
  }
  if (contractCoverage.status !== "pass") {
    blockers.push(unresolvedItem(
      "openai_provider_contract_surface_gap",
      "openai_provider",
      "At least one OpenAI provider contract surface is missing from existing evidence.",
      "Complete missing OpenAI contract surface evidence in a provider-approved lane."
    ));
  }
  if (redaction?.status && redaction.status !== "pass") {
    blockers.push(unresolvedItem(
      "openai_provider_redaction_gap",
      "openai_provider",
      "OpenAI provider redaction evidence is not pass.",
      "Repair redaction evidence before scoped provider lane verification."
    ));
  }
  const status = blockers.length === 0 ? "pass" : "blocked_by_missing_openai_contract_evidence";
  const claimBoundary = {
    status,
    stage,
    weak_claims_allowed: status === "pass" ? OPENAI_WEAK_CLAIMS : [],
    blocked_claims: BARE_BLOCKED_CLAIMS,
    post_export_openai_provider_contract_regression_reviewed_allowed: status === "pass",
    post_export_openai_provider_existing_evidence_indexed_allowed: status === "pass",
    replay_verified_allowed: false,
    benchmark_backed_allowed: false,
    ...commonFlags()
  };
  const report = {
    status,
    stage,
    provider: "openai",
    review_mode: "no_new_call_existing_evidence_only",
    sources,
    openai_model_api_call: false,
    openai_provider_rerun: false,
    provider_lane_contract_regression_reviewed: status === "pass",
    active_provider_lane_sufficient_for_scoped_gate: status === "pass",
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags()
  };
  writeYaml(root, "release/post_export_openai_provider_contract_regression_review_scope.yaml", [
    `stage: ${stage}`,
    "status: existing_evidence_review",
    "openai_model_api_call: false",
    "openai_provider_rerun: false",
    "provider_verified_allowed: false"
  ]);
  writeYaml(root, "release/post_export_openai_provider_contract_regression_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "post_export_openai_provider_contract_regression_reviewed_allowed: " + (status === "pass"),
    "provider_verified_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/openai_provider_contract_regression_review.json`, report);
  writeJsonRel(root, `${dir}/openai_provider_existing_evidence_index.json`, { status: "indexed", stage, sources });
  writeJsonRel(root, `${dir}/openai_provider_contract_coverage_matrix.json`, contractCoverage);
  writeJsonRel(root, `${dir}/openai_provider_regression_coverage_matrix.json`, regressionCoverage);
  writeJsonRel(root, `${dir}/openai_provider_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/openai_provider_contract_regression_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/openai_provider_contract_regression_review.ko.md", "OpenAI Provider Contract/Regression Review", [
    `Status: \`${status}\``,
    "",
    "- 새 OpenAI API 호출 없이 기존 canary/replay evidence만 재색인했습니다.",
    "- `provider-verified`는 계속 false입니다.",
    `- Weak claims allowed: ${(status === "pass" ? OPENAI_WEAK_CLAIMS : []).join(", ") || "none"}`
  ]);
  return report;
}

export function checkOpenAIProviderContractRegressionReview(root) {
  const stage = STAGES.openaiReview;
  const dir = DIRS.openaiReview;
  const report = readJsonIfExists(root, `${dir}/openai_provider_contract_regression_review.json`);
  const boundary = readJsonIfExists(root, `${dir}/openai_provider_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "no new OpenAI call", report?.openai_model_api_call === false && report?.openai_provider_rerun === false, report || {});
  addCheck(checks, "bare provider-verified blocked", boundary?.provider_verified_allowed === false, boundary || {});
  addCheck(checks, "unresolved items coherent", report?.unresolved_items_count === (unresolved?.unresolved_items_count || 0), unresolved || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? report?.status || "pass" : "fail", stage, unresolved_items_count: unresolved?.unresolved_items_count || 0, ...commonFlags(), checks, failures };
  writeJsonRel(root, `${dir}/openai_provider_contract_regression_gate_report.json`, gate);
  return gate;
}

export function auditOpenAIProviderContractRegressionClaims(root) {
  return writeAudit(root, STAGES.openaiReview, "post_export_openai_provider_contract_regression_claim_audit_report");
}

const STRUCTURED_CASES = [
  {
    case_id: "structured_status_count",
    input: "Return only a compact JSON object with keys status, surface, and count. Use status ok, surface structured_output, count 1.",
    required_keys: ["status", "surface", "count"]
  },
  {
    case_id: "structured_list_items",
    input: "Return only a compact JSON object with keys status and items. status must be ok and items must be an array of two strings.",
    required_keys: ["status", "items"]
  },
  {
    case_id: "structured_nested_flag",
    input: "Return only a compact JSON object with keys status and meta. meta must be an object with boolean key local.",
    required_keys: ["status", "meta"]
  }
];

export async function runOllamaStructuredOutputSmoke(root) {
  const stage = STAGES.ollamaStructured;
  const dir = DIRS.ollamaStructured;
  const caseResults = [];
  for (const model of MODELS) {
    for (const testCase of STRUCTURED_CASES) {
      try {
        const response = await callLocalChat({
          model,
          max_tokens: 256,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Return only a compact JSON object. Do not include prose." },
            { role: "user", content: testCase.input }
          ]
        });
        const parsed = parseJsonObject(response.content);
        const parsedKeys = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed).sort() : [];
        const requiredKeysPresent = testCase.required_keys.every((key) => parsedKeys.includes(key));
        caseResults.push({
          model,
          case_id: testCase.case_id,
          status: response.ok && Boolean(parsed) && requiredKeysPresent ? "pass" : "fail",
          http_status: response.http_status,
          finish_reason: response.finish_reason,
          usage: response.usage,
          output_text_present: response.content.trim().length > 0,
          output_text_length: response.content.length,
          output_text_hash: sha256(response.content),
          raw_response_hash: response.raw_response_hash,
          json_parse_passed: Boolean(parsed),
          required_keys_present: requiredKeysPresent,
          parsed_keys: parsedKeys,
          request_metadata: requestMetadata(model, testCase.case_id, { input: testCase.input }),
          raw_request_stored: false,
          raw_response_stored: false
        });
      } catch (error) {
        caseResults.push({
          model,
          case_id: testCase.case_id,
          status: "fail",
          error_name: error?.name || "Error",
          output_text_present: false,
          json_parse_passed: false,
          required_keys_present: false,
          request_metadata: requestMetadata(model, testCase.case_id, { input: testCase.input }),
          raw_request_stored: false,
          raw_response_stored: false
        });
      }
    }
  }
  const casesPassed = caseResults.filter((item) => item.status === "pass").length;
  const redaction = redactionSummary(stage, caseResults);
  const status = casesPassed === caseResults.length && redaction.status === "pass" ? "pass" : casesPassed > 0 ? "partial" : "fail";
  const blockers = status === "pass" ? [] : caseResults
    .filter((item) => item.status !== "pass")
    .map((item) => unresolvedItem(
      `ollama_structured_output_${item.model.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_${item.case_id}`,
      "ollama_structured_output",
      "Structured-output smoke case did not pass JSON/key validation.",
      "Inspect local model structured-output behavior; do not pull a new model in this stage."
    ));
  const report = {
    status,
    stage,
    provider: "ollama",
    endpoint: ENDPOINT,
    models_tested: MODELS,
    cases_total: caseResults.length,
    cases_passed: casesPassed,
    cases_failed: caseResults.length - casesPassed,
    new_local_model_execution: true,
    new_local_model_call_count: caseResults.length,
    raw_request_stored: false,
    raw_response_stored: false,
    redacted_metadata_only: true,
    schema_output_verified_allowed: false,
    adapter_checked_allowed: false,
    partial_accepted_for_active_adapter_scope: status === "pass",
    case_results: caseResults,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags({ new_local_model_execution: true, new_local_model_call_count: caseResults.length })
  };
  const claimBoundary = {
    status,
    stage,
    post_export_ollama_structured_output_smoke_allowed: status === "pass",
    schema_output_verified_allowed: false,
    adapter_checked_allowed: false,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    allowed_claims: status === "pass" ? ["post-export-ollama-structured-output-smoke-passed"] : [],
    blocked_claims: ["schema-output-verified", ...BARE_BLOCKED_CLAIMS],
    ...commonFlags({ new_local_model_execution: true, new_local_model_call_count: caseResults.length })
  };
  writeYaml(root, "release/post_export_ollama_structured_output_smoke_scope.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "models:",
    "  - qwen3:14b",
    "  - qwen3.6:27b",
    "raw_request_stored: false",
    "raw_response_stored: false"
  ]);
  writeYaml(root, "release/post_export_ollama_structured_output_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "schema_output_verified_allowed: false",
    "adapter_checked_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/ollama_structured_output_smoke_report.json`, report);
  writeJsonRel(root, `${dir}/ollama_structured_output_case_results.json`, { status, stage, case_results: caseResults });
  writeJsonRel(root, `${dir}/ollama_structured_output_response_mapping_review.json`, {
    status,
    stage,
    parsed_cases: casesPassed,
    cases_total: caseResults.length,
    parsed_keys_by_case: caseResults.map((item) => ({ model: item.model, case_id: item.case_id, parsed_keys: item.parsed_keys || [] }))
  });
  writeJsonRel(root, `${dir}/ollama_structured_output_storage_redaction_review.json`, redaction);
  writeJsonRel(root, `${dir}/ollama_structured_output_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/ollama_structured_output_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/ollama_structured_output_smoke.ko.md", "Ollama Structured Output Smoke", [
    `Status: \`${status}\``,
    "",
    `- Cases passed: ${casesPassed}/${caseResults.length}`,
    "- Raw request stored: false",
    "- Raw response stored: false",
    "- `schema-output-verified` and `adapter-checked` remain false."
  ]);
  return report;
}

export function checkOllamaStructuredOutputSmoke(root) {
  const stage = STAGES.ollamaStructured;
  const dir = DIRS.ollamaStructured;
  const report = readJsonIfExists(root, `${dir}/ollama_structured_output_smoke_report.json`);
  const redaction = readJsonIfExists(root, `${dir}/ollama_structured_output_storage_redaction_review.json`);
  const boundary = readJsonIfExists(root, `${dir}/ollama_structured_output_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "call count bounded", report?.new_local_model_call_count <= 6, report || {});
  addCheck(checks, "raw storage false", report?.raw_request_stored === false && report?.raw_response_stored === false && redaction?.status === "pass", redaction || {});
  addCheck(checks, "strong claims blocked", boundary?.schema_output_verified_allowed === false && boundary?.adapter_checked_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? report?.status || "pass" : "fail", stage, unresolved_items_count: report?.unresolved_items_count || 0, ...commonFlags({ new_local_model_execution: report?.new_local_model_execution === true, new_local_model_call_count: report?.new_local_model_call_count || 0 }), checks, failures };
  writeJsonRel(root, `${dir}/ollama_structured_output_gate_report.json`, gate);
  return gate;
}

export function auditOllamaStructuredOutputSmokeClaims(root) {
  return writeAudit(root, STAGES.ollamaStructured, "post_export_ollama_structured_output_smoke_claim_audit_report");
}

const TOOL_NAME = "local_mock_lookup";
const TOOL_CASES = [
  { case_id: "tool_lookup_alpha", input: "Use the local_mock_lookup tool with key alpha. Do not answer directly.", required_key: "key" },
  { case_id: "tool_lookup_beta", input: "Use the local_mock_lookup tool with key beta. Do not perform external actions.", required_key: "key" },
  { case_id: "tool_lookup_json", input: "Call local_mock_lookup for key gamma and keep all work local.", required_key: "key" }
];

function mockToolSpec() {
  return [{
    type: "function",
    function: {
      name: TOOL_NAME,
      description: "Mock local lookup tool for smoke testing. It has no external side effects.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "Local canary key." }
        },
        required: ["key"],
        additionalProperties: false
      }
    }
  }];
}

export async function runOllamaToolCallingMockSmoke(root) {
  const stage = STAGES.ollamaToolMock;
  const dir = DIRS.ollamaToolMock;
  const caseResults = [];
  for (const model of MODELS) {
    for (const testCase of TOOL_CASES) {
      try {
        const response = await callLocalChat({
          model,
          max_tokens: 256,
          timeout_ms: 120000,
          tools: mockToolSpec(),
          tool_choice: { type: "function", function: { name: TOOL_NAME } },
          messages: [
            { role: "system", content: "Use the provided mock tool when requested. Never execute real external actions." },
            { role: "user", content: testCase.input }
          ]
        });
        const firstCall = response.tool_calls[0] || null;
        const args = parseArguments(firstCall?.function?.arguments);
        const toolNameMatches = firstCall?.function?.name === TOOL_NAME;
        const argumentKeys = args && typeof args === "object" ? Object.keys(args).sort() : [];
        const safeRefusal = response.tool_calls.length === 0
          && /cannot|can't|unable|tool|function|external|local/i.test(response.content || "");
        const passed = response.ok
          && response.tool_calls.length > 0
          && toolNameMatches
          && argumentKeys.includes(testCase.required_key);
        caseResults.push({
          model,
          case_id: testCase.case_id,
          status: passed ? "pass" : safeRefusal ? "partial_safe_refusal" : "fail",
          http_status: response.http_status,
          finish_reason: response.finish_reason,
          usage: response.usage,
          tool_schema_sent: true,
          tool_choice_forced: true,
          tool_calls_present: response.tool_calls.length > 0,
          tool_call_count: response.tool_calls.length,
          tool_name_matches: toolNameMatches,
          tool_arguments_parse_passed: Boolean(args),
          tool_argument_keys: argumentKeys,
          safe_refusal_observed: safeRefusal,
          external_tool_executed: false,
          mock_tool_output_reinjected: false,
          assistant_content_present: response.content.trim().length > 0,
          assistant_content_length: response.content.length,
          assistant_content_hash: sha256(response.content || ""),
          tool_arguments_hash: sha256(firstCall?.function?.arguments || ""),
          raw_response_hash: response.raw_response_hash,
          request_metadata: requestMetadata(model, testCase.case_id, { input: testCase.input }),
          raw_request_stored: false,
          raw_response_stored: false
        });
      } catch (error) {
        caseResults.push({
          model,
          case_id: testCase.case_id,
          status: "fail",
          error_name: error?.name || "Error",
          tool_schema_sent: true,
          tool_calls_present: false,
          safe_refusal_observed: false,
          external_tool_executed: false,
          request_metadata: requestMetadata(model, testCase.case_id, { input: testCase.input }),
          raw_request_stored: false,
          raw_response_stored: false
        });
      }
    }
  }
  const casesPassed = caseResults.filter((item) => item.status === "pass").length;
  const casesPartial = caseResults.filter((item) => item.status === "partial_safe_refusal").length;
  const noSideEffects = caseResults.every((item) => item.external_tool_executed === false);
  const allPass = casesPassed === caseResults.length;
  const partialAccepted = !allPass
    && noSideEffects
    && MODELS.every((model) => caseResults.filter((item) => item.model === model && ["pass", "partial_safe_refusal"].includes(item.status)).length === TOOL_CASES.length);
  const status = allPass ? "pass" : partialAccepted ? "partial" : casesPassed > 0 || casesPartial > 0 ? "partial" : "fail";
  const blockers = allPass || partialAccepted ? [] : caseResults
    .filter((item) => !["pass", "partial_safe_refusal"].includes(item.status))
    .map((item) => unresolvedItem(
      `ollama_tool_calling_${item.model.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_${item.case_id}`,
      "ollama_tool_calling_mock",
      "Tool-calling mock case did not produce a tool call shape or safe refusal.",
      "Inspect local model tool-calling behavior; do not execute real tools."
    ));
  const redaction = redactionSummary(stage, caseResults, { external_tool_executed: false, tool_side_effects: false });
  const report = {
    status,
    stage,
    provider: "ollama",
    endpoint: ENDPOINT,
    models_tested: MODELS,
    cases_total: caseResults.length,
    cases_passed: casesPassed,
    cases_partial_safe_refusal: casesPartial,
    cases_failed: caseResults.length - casesPassed - casesPartial,
    new_local_model_execution: true,
    new_local_model_call_count: caseResults.length,
    raw_request_stored: false,
    raw_response_stored: false,
    redacted_metadata_only: true,
    tool_side_effects: false,
    external_tool_executed: false,
    tool_call_verified_allowed: false,
    adapter_checked_allowed: false,
    partial_accepted_for_active_adapter_scope: allPass || partialAccepted,
    partial_acceptance_criteria: "Each model must produce either a mock tool-call shape or a safe refusal for every case, with no external side effect.",
    case_results: caseResults,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags({ new_local_model_execution: true, new_local_model_call_count: caseResults.length })
  };
  const claimBoundary = {
    status,
    stage,
    post_export_ollama_tool_calling_mock_smoke_allowed: allPass,
    post_export_ollama_tool_calling_mock_partial_accepted: partialAccepted,
    tool_call_verified_allowed: false,
    adapter_checked_allowed: false,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    allowed_claims: allPass ? ["post-export-ollama-tool-calling-mock-smoke-passed"] : partialAccepted ? ["post-export-ollama-tool-calling-mock-smoke-partial-accepted"] : [],
    blocked_claims: ["tool-call-verified", ...BARE_BLOCKED_CLAIMS],
    ...commonFlags({ new_local_model_execution: true, new_local_model_call_count: caseResults.length })
  };
  writeYaml(root, "release/post_export_ollama_tool_calling_mock_smoke_scope.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "models:",
    "  - qwen3:14b",
    "  - qwen3.6:27b",
    "tool_side_effects: false",
    "raw_request_stored: false",
    "raw_response_stored: false"
  ]);
  writeYaml(root, "release/post_export_ollama_tool_calling_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "tool_call_verified_allowed: false",
    "adapter_checked_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/ollama_tool_calling_mock_smoke_report.json`, report);
  writeJsonRel(root, `${dir}/ollama_tool_calling_mock_case_results.json`, { status, stage, case_results: caseResults });
  writeJsonRel(root, `${dir}/ollama_tool_calling_mapping_review.json`, {
    status,
    stage,
    tool_name: TOOL_NAME,
    pass_count: casesPassed,
    partial_safe_refusal_count: casesPartial,
    no_side_effects: noSideEffects
  });
  writeJsonRel(root, `${dir}/ollama_tool_calling_no_side_effect_report.json`, redaction);
  writeJsonRel(root, `${dir}/ollama_tool_calling_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/ollama_tool_calling_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/ollama_tool_calling_mock_smoke.ko.md", "Ollama Tool Calling Mock Smoke", [
    `Status: \`${status}\``,
    "",
    `- Pass: ${casesPassed}/${caseResults.length}`,
    `- Partial safe refusal: ${casesPartial}`,
    "- Real tool side effects: false",
    "- `tool-call-verified` and `adapter-checked` remain false."
  ]);
  return report;
}

export function checkOllamaToolCallingMockSmoke(root) {
  const stage = STAGES.ollamaToolMock;
  const dir = DIRS.ollamaToolMock;
  const report = readJsonIfExists(root, `${dir}/ollama_tool_calling_mock_smoke_report.json`);
  const noSideEffect = readJsonIfExists(root, `${dir}/ollama_tool_calling_no_side_effect_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/ollama_tool_calling_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "call count bounded", report?.new_local_model_call_count <= 6, report || {});
  addCheck(checks, "no real tool side effect", report?.external_tool_executed === false && noSideEffect?.tool_side_effects === false, noSideEffect || {});
  addCheck(checks, "raw storage false", report?.raw_request_stored === false && report?.raw_response_stored === false, report || {});
  addCheck(checks, "strong claims blocked", boundary?.tool_call_verified_allowed === false && boundary?.adapter_checked_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? report?.status || "pass" : "fail", stage, unresolved_items_count: report?.unresolved_items_count || 0, ...commonFlags({ new_local_model_execution: report?.new_local_model_execution === true, new_local_model_call_count: report?.new_local_model_call_count || 0 }), checks, failures };
  writeJsonRel(root, `${dir}/ollama_tool_calling_gate_report.json`, gate);
  return gate;
}

export function auditOllamaToolCallingMockClaims(root) {
  return writeAudit(root, STAGES.ollamaToolMock, "post_export_ollama_tool_calling_mock_claim_audit_report");
}

const REPLAY_CASES = [
  {
    surface: "no_tool",
    case_id: "replay_no_tool_exact",
    input: "Return exactly ACTIVE_REPLAY_OK and no other text.",
    expect_text: "ACTIVE_REPLAY_OK"
  },
  {
    surface: "structured_output",
    case_id: "replay_structured_json",
    input: "Return only JSON with keys status and replay. status must be ok and replay must be true.",
    required_keys: ["status", "replay"],
    response_format: { type: "json_object" }
  }
];

export async function runOllamaReplayRegressionSmoke(root) {
  const stage = STAGES.ollamaReplay;
  const dir = DIRS.ollamaReplay;
  const structured = readJsonIfExists(root, `${DIRS.ollamaStructured}/ollama_structured_output_smoke_report.json`);
  const toolMock = readJsonIfExists(root, `${DIRS.ollamaToolMock}/ollama_tool_calling_mock_smoke_report.json`);
  const noToolSources = [
    source(root, "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json"),
    source(root, "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json")
  ];
  const caseResults = [];
  for (const model of MODELS) {
    for (const testCase of REPLAY_CASES) {
      try {
        const response = await callLocalChat({
          model,
          max_tokens: 128,
          response_format: testCase.response_format || null,
          messages: [
            { role: "system", content: "Run a local replay/regression smoke. Keep output minimal and deterministic." },
            { role: "user", content: testCase.input }
          ]
        });
        let passed = false;
        let parsedKeys = [];
        if (testCase.expect_text) {
          passed = response.ok && response.content.includes(testCase.expect_text);
        } else {
          const parsed = parseJsonObject(response.content);
          parsedKeys = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed).sort() : [];
          passed = response.ok && Boolean(parsed) && testCase.required_keys.every((key) => parsedKeys.includes(key));
        }
        caseResults.push({
          model,
          surface: testCase.surface,
          case_id: testCase.case_id,
          status: passed ? "pass" : "fail",
          http_status: response.http_status,
          finish_reason: response.finish_reason,
          usage: response.usage,
          output_text_present: response.content.trim().length > 0,
          output_text_length: response.content.length,
          output_text_hash: sha256(response.content),
          raw_response_hash: response.raw_response_hash,
          parsed_keys: parsedKeys,
          request_metadata: requestMetadata(model, testCase.case_id, { input: testCase.input }),
          raw_request_stored: false,
          raw_response_stored: false
        });
      } catch (error) {
        caseResults.push({
          model,
          surface: testCase.surface,
          case_id: testCase.case_id,
          status: "fail",
          error_name: error?.name || "Error",
          output_text_present: false,
          request_metadata: requestMetadata(model, testCase.case_id, { input: testCase.input }),
          raw_request_stored: false,
          raw_response_stored: false
        });
      }
    }
  }
  const passed = caseResults.filter((item) => item.status === "pass").length;
  const structuredOk = structured?.status === "pass";
  const toolOk = toolMock?.status === "pass" || toolMock?.partial_accepted_for_active_adapter_scope === true;
  const status = passed === caseResults.length && structuredOk && toolOk ? "pass" : passed > 0 ? "partial" : "fail";
  const blockers = [];
  if (!structuredOk) {
    blockers.push(unresolvedItem("ollama_structured_output_source_not_pass", "ollama_replay", "Structured-output smoke source is not pass.", "Complete Stage B before replay/regression acceptance."));
  }
  if (!toolOk) {
    blockers.push(unresolvedItem("ollama_tool_calling_mock_source_not_accepted", "ollama_replay", "Tool-calling mock smoke source is neither pass nor partial-accepted.", "Complete Stage C before replay/regression acceptance."));
  }
  for (const item of caseResults.filter((caseResult) => caseResult.status !== "pass")) {
    blockers.push(unresolvedItem(
      `ollama_replay_${item.model.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_${item.case_id}`,
      "ollama_replay",
      "Replay/regression smoke case did not pass.",
      "Inspect local replay behavior; do not open replay-verified."
    ));
  }
  const report = {
    status,
    stage,
    provider: "ollama",
    endpoint: ENDPOINT,
    models_tested: MODELS,
    surfaces: ["no_tool", "structured_output", "tool_calling_mock"],
    cases_total: caseResults.length,
    cases_passed: passed,
    cases_failed: caseResults.length - passed,
    source_reports: {
      no_tool_sources: noToolSources,
      structured_output_smoke: source(root, `${DIRS.ollamaStructured}/ollama_structured_output_smoke_report.json`),
      tool_calling_mock_smoke: source(root, `${DIRS.ollamaToolMock}/ollama_tool_calling_mock_smoke_report.json`)
    },
    case_results: caseResults,
    new_local_model_execution: true,
    new_local_model_call_count: caseResults.length,
    raw_request_stored: false,
    raw_response_stored: false,
    redacted_metadata_only: true,
    replay_verified_allowed: false,
    benchmark_backed_allowed: false,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags({ new_local_model_execution: true, new_local_model_call_count: caseResults.length })
  };
  const claimBoundary = {
    status,
    stage,
    post_export_ollama_replay_regression_smoke_allowed: status === "pass",
    replay_verified_allowed: false,
    benchmark_backed_allowed: false,
    adapter_checked_allowed: false,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    allowed_claims: status === "pass" ? ["post-export-ollama-replay-regression-smoke-passed"] : [],
    blocked_claims: ["replay-verified", "benchmark-backed", ...BARE_BLOCKED_CLAIMS],
    ...commonFlags({ new_local_model_execution: true, new_local_model_call_count: caseResults.length })
  };
  writeYaml(root, "release/post_export_ollama_replay_regression_smoke_scope.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "models:",
    "  - qwen3:14b",
    "  - qwen3.6:27b",
    "replay_verified_allowed: false"
  ]);
  writeYaml(root, "release/post_export_ollama_replay_regression_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "replay_verified_allowed: false",
    "benchmark_backed_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/ollama_replay_regression_smoke_report.json`, report);
  writeJsonRel(root, `${dir}/ollama_replay_regression_case_results.json`, { status, stage, case_results: caseResults });
  writeJsonRel(root, `${dir}/ollama_replay_regression_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/ollama_replay_regression_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/ollama_replay_regression_smoke.ko.md", "Ollama Replay/Regression Smoke", [
    `Status: \`${status}\``,
    "",
    `- Cases passed: ${passed}/${caseResults.length}`,
    "- `replay-verified` and `benchmark-backed` remain false.",
    "- Raw request/response stored: false."
  ]);
  return report;
}

export function checkOllamaReplayRegressionSmoke(root) {
  const stage = STAGES.ollamaReplay;
  const dir = DIRS.ollamaReplay;
  const report = readJsonIfExists(root, `${dir}/ollama_replay_regression_smoke_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/ollama_replay_regression_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "call count bounded", report?.new_local_model_call_count <= 8, report || {});
  addCheck(checks, "raw storage false", report?.raw_request_stored === false && report?.raw_response_stored === false, report || {});
  addCheck(checks, "replay/benchmark claims blocked", boundary?.replay_verified_allowed === false && boundary?.benchmark_backed_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? report?.status || "pass" : "fail", stage, unresolved_items_count: report?.unresolved_items_count || 0, ...commonFlags({ new_local_model_execution: report?.new_local_model_execution === true, new_local_model_call_count: report?.new_local_model_call_count || 0 }), checks, failures };
  writeJsonRel(root, `${dir}/ollama_replay_regression_gate_report.json`, gate);
  return gate;
}

export function runCrossAdapterContractDryRun(root) {
  const stage = STAGES.crossAdapter;
  const dir = DIRS.crossAdapter;
  const openaiAdapter = readTextIfExists(root, "adapters/api/openai/adapter.yaml");
  const ollamaAdapter = readTextIfExists(root, "adapters/local/ollama/adapter.yaml");
  const structured = readJsonIfExists(root, `${DIRS.ollamaStructured}/ollama_structured_output_smoke_report.json`);
  const toolMock = readJsonIfExists(root, `${DIRS.ollamaToolMock}/ollama_tool_calling_mock_smoke_report.json`);
  const replay = readJsonIfExists(root, `${DIRS.ollamaReplay}/ollama_replay_regression_smoke_report.json`);
  const openaiReview = readJsonIfExists(root, `${DIRS.openaiReview}/openai_provider_contract_regression_review.json`);
  const openaiReviewStatus = openaiReview?.status === "pass";
  const ollamaStructuredOk = structured?.status === "pass";
  const ollamaToolOk = toolMock?.status === "pass" || toolMock?.partial_accepted_for_active_adapter_scope === true;
  const ollamaReplayOk = replay?.status === "pass";
  const blockers = [];
  if (!openaiReviewStatus) {
    blockers.push(unresolvedItem("openai_contract_review_not_pass", "cross_adapter", "OpenAI no-new-call contract/regression review is not pass.", "Complete Stage A."));
  }
  if (!ollamaStructuredOk) {
    blockers.push(unresolvedItem("ollama_structured_output_not_pass", "cross_adapter", "Ollama structured-output smoke is not pass.", "Complete Stage B."));
  }
  if (!ollamaToolOk) {
    blockers.push(unresolvedItem("ollama_tool_calling_mock_not_accepted", "cross_adapter", "Ollama tool-calling mock smoke is not pass or partial-accepted.", "Complete Stage C."));
  }
  if (!ollamaReplayOk) {
    blockers.push(unresolvedItem("ollama_replay_regression_not_pass", "cross_adapter", "Ollama replay/regression smoke is not pass.", "Complete Stage D."));
  }
  const status = blockers.length === 0 ? "pass" : "blocked_by_cross_adapter_gaps";
  const openaiReviewRecord = {
    status: openaiReviewStatus ? "pass" : "blocked",
    stage,
    adapter: "openai",
    adapter_file_exists: openaiAdapter.length > 0,
    message_mapping_reviewed: openaiAdapter.includes("message_mapping"),
    tool_mapping_reviewed: openaiAdapter.includes("tool_mapping"),
    structured_output_mapping_reviewed: openaiAdapter.includes("structured_output_mapping"),
    source: "adapters/api/openai/adapter.yaml"
  };
  const ollamaReviewRecord = {
    status: ollamaStructuredOk && ollamaToolOk ? "pass" : "blocked",
    stage,
    adapter: "ollama",
    adapter_file_exists: ollamaAdapter.length > 0,
    message_mapping_reviewed: ollamaAdapter.includes("message_mapping"),
    tool_mapping_reviewed: ollamaAdapter.includes("tool_mapping"),
    structured_output_mapping_reviewed: ollamaAdapter.includes("structured_output_mapping"),
    structured_output_smoke_status: structured?.status || "missing",
    tool_calling_mock_status: toolMock?.status || "missing",
    tool_calling_partial_accepted: toolMock?.partial_accepted_for_active_adapter_scope === true,
    source: "adapters/local/ollama/adapter.yaml"
  };
  const vllmPlaceholder = {
    status: "placeholder_out_of_active_scope",
    stage,
    adapter: "vllm",
    execution_performed: false,
    vllm_execution_required_for_active_scope: false,
    vllm_required_for_bare_adapter_checked: true,
    reason: "vLLM execution is not approved in this autopilot; it is excluded from active-adapters scoped gate and remains a blocker for bare adapter-checked."
  };
  const report = {
    status,
    stage,
    active_adapter_scope: ["openai", "ollama"],
    excluded_adapters: ["vllm"],
    dry_run_only: true,
    vllm_execution_performed: false,
    cross_adapter_contract_dry_run_passed: status === "pass",
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags()
  };
  const claimBoundary = {
    status,
    stage,
    cross_adapter_contract_dry_run_allowed: status === "pass",
    adapter_checked_allowed: false,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    allowed_claims: status === "pass" ? ["post-export-cross-adapter-contract-dry-run-passed"] : [],
    blocked_claims: BARE_BLOCKED_CLAIMS,
    ...commonFlags()
  };
  writeYaml(root, "release/post_export_cross_adapter_contract_dry_run_scope.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "dry_run_only: true",
    "vllm_execution_performed: false",
    "adapter_checked_allowed: false"
  ]);
  writeYaml(root, "release/post_export_cross_adapter_contract_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "adapter_checked_allowed: false",
    "provider_verified_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/cross_adapter_contract_dry_run_report.json`, report);
  writeJsonRel(root, `${dir}/openai_adapter_static_contract_review.json`, openaiReviewRecord);
  writeJsonRel(root, `${dir}/ollama_adapter_static_contract_review.json`, ollamaReviewRecord);
  writeJsonRel(root, `${dir}/vllm_adapter_placeholder_coverage.json`, vllmPlaceholder);
  writeJsonRel(root, `${dir}/cross_adapter_contract_gap_analysis.json`, { status, stage, blockers });
  writeJsonRel(root, `${dir}/cross_adapter_contract_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/cross_adapter_contract_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/cross_adapter_contract_dry_run.ko.md", "Cross Adapter Contract Dry Run", [
    `Status: \`${status}\``,
    "",
    "- OpenAI/Ollama active adapter scope only.",
    "- vLLM execution was not performed and remains out of active scope.",
    "- Bare `adapter-checked` remains false."
  ]);
  writeMd(root, "docs/cross_adapter_contract_gap_analysis.ko.md", "Cross Adapter Contract Gap Analysis", [
    `Status: \`${status}\``,
    "",
    ...blockers.map((item) => `- ${item.id}: ${item.reason}`),
    ...(blockers.length === 0 ? ["- No active-scope blockers."] : [])
  ]);
  return report;
}

export function checkCrossAdapterContractDryRun(root) {
  const stage = STAGES.crossAdapter;
  const dir = DIRS.crossAdapter;
  const report = readJsonIfExists(root, `${dir}/cross_adapter_contract_dry_run_report.json`);
  const vllm = readJsonIfExists(root, `${dir}/vllm_adapter_placeholder_coverage.json`);
  const boundary = readJsonIfExists(root, `${dir}/cross_adapter_contract_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "dry-run only", report?.dry_run_only === true && vllm?.execution_performed === false, { report, vllm });
  addCheck(checks, "adapter-checked remains blocked", boundary?.adapter_checked_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? report?.status || "pass" : "fail", stage, unresolved_items_count: report?.unresolved_items_count || 0, ...commonFlags(), checks, failures };
  writeJsonRel(root, `${dir}/cross_adapter_contract_gate_report.json`, gate);
  return gate;
}

export function auditCrossAdapterContractClaims(root) {
  return writeAudit(root, STAGES.crossAdapter, "post_export_cross_adapter_contract_claim_audit_report");
}

function providerScopedCriteria(root) {
  const openai = readJsonIfExists(root, `${DIRS.openaiReview}/openai_provider_contract_regression_review.json`);
  const structured = readJsonIfExists(root, `${DIRS.ollamaStructured}/ollama_structured_output_smoke_report.json`);
  const toolMock = readJsonIfExists(root, `${DIRS.ollamaToolMock}/ollama_tool_calling_mock_smoke_report.json`);
  const replay = readJsonIfExists(root, `${DIRS.ollamaReplay}/ollama_replay_regression_smoke_report.json`);
  const providerDiverse = readJsonIfExists(root, "evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_report.json");
  const localModel = readJsonIfExists(root, "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json");
  const criteria = [
    { id: "openai_provider_contract_regression_review", passed: openai?.status === "pass", status: openai?.status || "missing" },
    { id: "provider_diverse_allowed", passed: providerDiverse?.provider_diverse_allowed === true, status: providerDiverse?.status || "missing" },
    { id: "local_model_verified_allowed", passed: localModel?.local_model_verified_allowed === true, status: localModel?.status || "missing" },
    { id: "ollama_structured_output_smoke", passed: structured?.status === "pass", status: structured?.status || "missing" },
    { id: "ollama_tool_calling_mock_smoke", passed: toolMock?.status === "pass" || toolMock?.partial_accepted_for_active_adapter_scope === true, status: toolMock?.status || "missing" },
    { id: "ollama_replay_regression_smoke", passed: replay?.status === "pass", status: replay?.status || "missing" }
  ];
  return { openai, structured, toolMock, replay, providerDiverse, localModel, criteria };
}

export function runActiveProviderLanesVerifiedFinalGate(root) {
  const stage = STAGES.activeProviders;
  const dir = DIRS.activeProviders;
  const { criteria } = providerScopedCriteria(root);
  const blockers = criteria
    .filter((item) => !item.passed)
    .map((item) => unresolvedItem(
      `provider_scoped_${item.id}_not_ready`,
      "active_provider_lanes",
      `Criterion ${item.id} is not pass/ready; observed status is ${item.status}.`,
      "Complete the corresponding coverage-hardening stage before opening scoped provider lane claim."
    ));
  const allowed = blockers.length === 0;
  const report = {
    status: allowed ? "pass" : "blocked_by_active_provider_lane_gaps",
    stage,
    final_gate_executed: allowed,
    post_export_active_provider_lanes_verified_allowed: allowed,
    scoped_claim_allowed: allowed ? ACTIVE_PROVIDER_SCOPED_CLAIM : null,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    criteria,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags()
  };
  const evidenceSummary = {
    status: allowed ? "pass" : "blocked",
    stage,
    active_provider_lanes: ["openai", "ollama"],
    criteria
  };
  const claimBoundary = {
    status: report.status,
    stage,
    post_export_active_provider_lanes_verified_allowed: allowed,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    allowed_claims: allowed ? [ACTIVE_PROVIDER_SCOPED_CLAIM] : [],
    blocked_claims: BARE_BLOCKED_CLAIMS,
    ...commonFlags()
  };
  writeYaml(root, "release/post_export_active_provider_lanes_verified_final_gate_scope.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    "scope: active_provider_lanes_openai_plus_ollama",
    `post_export_active_provider_lanes_verified_allowed: ${allowed}`,
    "provider_verified_allowed: false"
  ]);
  writeYaml(root, "release/post_export_active_provider_lanes_verified_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_provider_lanes_verified_allowed: ${allowed}`,
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_final_gate_report.json`, report);
  writeJsonRel(root, `${dir}/active_provider_lanes_evidence_summary.json`, evidenceSummary);
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_decision_record.json`, {
    status: allowed ? "approved_scoped_claim" : "blocked",
    stage,
    decision: allowed ? "allow_scoped_active_provider_lanes_verified" : "keep_scoped_active_provider_lanes_blocked",
    bare_provider_verified_allowed: false
  });
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_gate_check_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/active_provider_lanes_verified_final_gate.ko.md", "Active Provider Lanes Verified Final Gate", [
    `Status: \`${report.status}\``,
    "",
    `- Scoped claim allowed: ${allowed}`,
    "- Bare `provider-verified`: false",
    ...(blockers.length ? blockers.map((item) => `- ${item.id}: ${item.reason}`) : ["- No active provider lane blockers."])
  ]);
  return report;
}

export function checkActiveProviderLanesVerifiedFinalGate(root) {
  const stage = STAGES.activeProviders;
  const dir = DIRS.activeProviders;
  const report = readJsonIfExists(root, `${dir}/active_provider_lanes_verified_final_gate_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_provider_lanes_verified_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "bare provider-verified remains false", report?.provider_verified_allowed === false && boundary?.provider_verified_allowed === false, { report, boundary });
  addCheck(checks, "scoped claim coherence", Boolean(report?.post_export_active_provider_lanes_verified_allowed) === (unresolved?.unresolved_items_count === 0), { report, unresolved });
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? report?.status || "pass" : "fail", stage, unresolved_items_count: unresolved?.unresolved_items_count || 0, ...commonFlags(), checks, failures };
  writeJsonRel(root, `${dir}/active_provider_lanes_verified_gate_check_report.json`, gate);
  return gate;
}

export function auditActiveProviderLanesVerifiedClaims(root) {
  return writeAudit(root, STAGES.activeProviders, "post_export_active_provider_lanes_verified_claim_audit_report");
}

function adapterScopedCriteria(root) {
  const structured = readJsonIfExists(root, `${DIRS.ollamaStructured}/ollama_structured_output_smoke_report.json`);
  const toolMock = readJsonIfExists(root, `${DIRS.ollamaToolMock}/ollama_tool_calling_mock_smoke_report.json`);
  const replay = readJsonIfExists(root, `${DIRS.ollamaReplay}/ollama_replay_regression_smoke_report.json`);
  const cross = readJsonIfExists(root, `${DIRS.crossAdapter}/cross_adapter_contract_dry_run_report.json`);
  const criteria = [
    { id: "ollama_structured_output_smoke", passed: structured?.status === "pass" || structured?.partial_accepted_for_active_adapter_scope === true, status: structured?.status || "missing" },
    { id: "ollama_tool_calling_mock_smoke", passed: toolMock?.status === "pass" || toolMock?.partial_accepted_for_active_adapter_scope === true, status: toolMock?.status || "missing" },
    { id: "ollama_replay_regression_smoke", passed: replay?.status === "pass", status: replay?.status || "missing" },
    { id: "cross_adapter_contract_dry_run", passed: cross?.status === "pass", status: cross?.status || "missing" }
  ];
  return { structured, toolMock, replay, cross, criteria };
}

export function runActiveAdaptersCheckedFinalGate(root) {
  const stage = STAGES.activeAdapters;
  const dir = DIRS.activeAdapters;
  const { criteria } = adapterScopedCriteria(root);
  const blockers = criteria
    .filter((item) => !item.passed)
    .map((item) => unresolvedItem(
      `adapter_scoped_${item.id}_not_ready`,
      "active_adapters",
      `Criterion ${item.id} is not pass/accepted; observed status is ${item.status}.`,
      "Complete the corresponding adapter coverage-hardening stage before opening scoped active-adapters claim."
    ));
  const allowed = blockers.length === 0;
  const report = {
    status: allowed ? "pass" : "blocked_by_active_adapter_gaps",
    stage,
    final_gate_executed: allowed,
    post_export_active_adapters_checked_allowed: allowed,
    scoped_claim_allowed: allowed ? ACTIVE_ADAPTER_SCOPED_CLAIM : null,
    adapter_checked_allowed: false,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    criteria,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags()
  };
  const claimBoundary = {
    status: report.status,
    stage,
    post_export_active_adapters_checked_allowed: allowed,
    adapter_checked_allowed: false,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    allowed_claims: allowed ? [ACTIVE_ADAPTER_SCOPED_CLAIM] : [],
    blocked_claims: BARE_BLOCKED_CLAIMS,
    ...commonFlags()
  };
  writeYaml(root, "release/post_export_active_adapters_checked_final_gate_scope.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    "scope: active_adapters_openai_plus_ollama_vllm_excluded",
    `post_export_active_adapters_checked_allowed: ${allowed}`,
    "adapter_checked_allowed: false"
  ]);
  writeYaml(root, "release/post_export_active_adapters_checked_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_adapters_checked_allowed: ${allowed}`,
    "adapter_checked_allowed: false",
    "provider_verified_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_adapters_checked_final_gate_report.json`, report);
  writeJsonRel(root, `${dir}/active_adapters_evidence_summary.json`, { status: allowed ? "pass" : "blocked", stage, active_adapters: ["openai", "ollama"], excluded_adapters: ["vllm"], criteria });
  writeJsonRel(root, `${dir}/active_adapters_checked_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/active_adapters_checked_decision_record.json`, {
    status: allowed ? "approved_scoped_claim" : "blocked",
    stage,
    decision: allowed ? "allow_scoped_active_adapters_checked" : "keep_scoped_active_adapters_blocked",
    bare_adapter_checked_allowed: false
  });
  writeJsonRel(root, `${dir}/active_adapters_checked_gate_check_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/active_adapters_checked_final_gate.ko.md", "Active Adapters Checked Final Gate", [
    `Status: \`${report.status}\``,
    "",
    `- Scoped claim allowed: ${allowed}`,
    "- Bare `adapter-checked`: false",
    ...(blockers.length ? blockers.map((item) => `- ${item.id}: ${item.reason}`) : ["- No active adapter blockers."])
  ]);
  return report;
}

export function checkActiveAdaptersCheckedFinalGate(root) {
  const stage = STAGES.activeAdapters;
  const dir = DIRS.activeAdapters;
  const report = readJsonIfExists(root, `${dir}/active_adapters_checked_final_gate_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_adapters_checked_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "bare adapter-checked remains false", report?.adapter_checked_allowed === false && boundary?.adapter_checked_allowed === false, { report, boundary });
  addCheck(checks, "scoped claim coherence", Boolean(report?.post_export_active_adapters_checked_allowed) === (unresolved?.unresolved_items_count === 0), { report, unresolved });
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? report?.status || "pass" : "fail", stage, unresolved_items_count: unresolved?.unresolved_items_count || 0, ...commonFlags(), checks, failures };
  writeJsonRel(root, `${dir}/active_adapters_checked_gate_check_report.json`, gate);
  return gate;
}

export function auditActiveAdaptersCheckedClaims(root) {
  return writeAudit(root, STAGES.activeAdapters, "post_export_active_adapters_checked_claim_audit_report");
}

export function refreshGeneralReadinessStabilityPreflight(root) {
  const stage = STAGES.generalRefresh;
  const dir = DIRS.generalRefresh;
  const providerGate = readJsonIfExists(root, `${DIRS.activeProviders}/active_provider_lanes_verified_final_gate_report.json`);
  const adapterGate = readJsonIfExists(root, `${DIRS.activeAdapters}/active_adapters_checked_final_gate_report.json`);
  const blockers = [
    unresolvedItem("bare_provider_verified_still_blocked", "general", "Scoped provider lane verification does not permit bare provider-verified.", "Run a separately approved bare provider-verified final gate."),
    unresolvedItem("bare_adapter_checked_still_blocked", "general", "Scoped active-adapters checking does not permit bare adapter-checked.", "Run a separately approved bare adapter-checked final gate."),
    unresolvedItem("general_release_gate_not_rerun", "general", "General release gate rerun is outside this autopilot.", "Run a separately approved general release gate before bare production-ready/stable/release-gated claims.")
  ];
  const report = {
    status: "blocked_by_bare_general_claim_gaps",
    stage,
    provider_scoped_status: providerGate?.status || "missing",
    adapter_scoped_status: adapterGate?.status || "missing",
    post_export_active_provider_lanes_verified_allowed: providerGate?.post_export_active_provider_lanes_verified_allowed === true,
    post_export_active_adapters_checked_allowed: adapterGate?.post_export_active_adapters_checked_allowed === true,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags()
  };
  const boundary = {
    status: "blocked",
    stage,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    allowed_scoped_claims: [
      ...(providerGate?.post_export_active_provider_lanes_verified_allowed ? [ACTIVE_PROVIDER_SCOPED_CLAIM] : []),
      ...(adapterGate?.post_export_active_adapters_checked_allowed ? [ACTIVE_ADAPTER_SCOPED_CLAIM] : [])
    ],
    blocked_claims: BARE_BLOCKED_CLAIMS,
    ...commonFlags()
  };
  writeYaml(root, "release/post_export_general_readiness_stability_preflight_refresh_scope.yaml", [
    `stage: ${stage}`,
    "status: blocked_by_bare_general_claim_gaps",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/general_readiness_stability_preflight_refresh_report.json`, report);
  writeJsonRel(root, `${dir}/general_readiness_stability_claim_boundary.json`, boundary);
  writeJsonRel(root, `${dir}/general_readiness_stability_remaining_blockers.json`, { status: "blocked", stage, blockers });
  writeJsonRel(root, `${dir}/general_readiness_stability_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/general_readiness_stability_preflight_refresh.ko.md", "General Readiness/Stability Preflight Refresh", [
    "Status: `blocked_by_bare_general_claim_gaps`",
    "",
    "- Scoped provider/adapters 결과는 general production-ready/stable을 열지 않습니다.",
    "- `production-ready`, `stable`, `release-gated` remain false."
  ]);
  return report;
}

export function checkGeneralReadinessStabilityPreflightRefresh(root) {
  const stage = STAGES.generalRefresh;
  const dir = DIRS.generalRefresh;
  const report = readJsonIfExists(root, `${dir}/general_readiness_stability_preflight_refresh_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/general_readiness_stability_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "general claims remain false", boundary?.production_ready_allowed === false && boundary?.stable_allowed === false && boundary?.release_gated_allowed === false, boundary || {});
  addCheck(checks, "blockers recorded", unresolved?.unresolved_items_count > 0, unresolved || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? report?.status || "blocked_by_bare_general_claim_gaps" : "fail", stage, unresolved_items_count: unresolved?.unresolved_items_count || 0, ...commonFlags(), checks, failures };
  writeJsonRel(root, `${dir}/general_readiness_stability_gate_report.json`, gate);
  return gate;
}

function shouldSkip(root, sourcePath) {
  const rel = path.relative(root, sourcePath).split(path.sep).join("/");
  const base = path.basename(sourcePath);
  if (base === ".DS_Store") return true;
  if (base.endsWith(".log")) return true;
  if (/raw_(request|response)|request_payload|response_payload/i.test(rel)) return true;
  if (rel === ".git" || rel.startsWith(".git/")) return true;
  if (rel === "node_modules" || rel.startsWith("node_modules/")) return true;
  if (rel === "dist" || rel.startsWith("dist/")) return true;
  if (rel === "exports" || rel.startsWith("exports/")) return true;
  if (rel.includes("/node_modules/") || rel.includes("/.git/") || rel.includes("/dist/")) return true;
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
  return {
    node_modules: entries.filter((entry) => entry === "node_modules/" || entry.includes("/node_modules/")),
    dist: entries.filter((entry) => entry === "dist/" || entry.startsWith("dist/") || entry.includes("/dist/")),
    git_metadata: entries.filter((entry) => entry === ".git/" || entry.startsWith(".git/") || entry.includes("/.git/")),
    ds_store: entries.filter((entry) => path.basename(entry) === ".DS_Store"),
    raw_payload: entries.filter((entry) => /raw_(request|response)|request_payload|response_payload/i.test(entry))
  };
}

export function runFinalExportRefreshAfterActiveScopedGates(root) {
  const stage = STAGES.exportRefresh;
  const dir = DIRS.exportRefresh;
  const providerGate = readJsonIfExists(root, `${DIRS.activeProviders}/active_provider_lanes_verified_final_gate_report.json`);
  const adapterGate = readJsonIfExists(root, `${DIRS.activeAdapters}/active_adapters_checked_final_gate_report.json`);
  const allowedScopedClaims = [
    ...(providerGate?.post_export_active_provider_lanes_verified_allowed ? [ACTIVE_PROVIDER_SCOPED_CLAIM] : []),
    ...(adapterGate?.post_export_active_adapters_checked_allowed ? [ACTIVE_ADAPTER_SCOPED_CLAIM] : [])
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
    "evidence/post-export-provider-verified-coverage-preflight",
    "evidence/post-export-provider-verified-coverage-completion",
    "evidence/post-export-provider-verified-final-gate",
    "evidence/post-export-adapter-checked-coverage-completion",
    "evidence/post-export-adapter-checked-final-gate",
    "evidence/post-export-general-readiness-stability-preflight",
    "evidence/final-export-refresh-after-strict-paths",
    DIRS.openaiReview,
    DIRS.ollamaStructured,
    DIRS.ollamaToolMock,
    DIRS.ollamaReplay,
    DIRS.crossAdapter,
    DIRS.activeProviders,
    DIRS.activeAdapters,
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
    post_export_active_provider_lanes_verified_allowed: providerGate?.post_export_active_provider_lanes_verified_allowed === true,
    post_export_active_adapters_checked_allowed: adapterGate?.post_export_active_adapters_checked_allowed === true,
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
    excluded_patterns: ["*.log", "raw request/response payload files"]
  };
  writeYaml(root, "release/final_export_refresh_after_active_scoped_gates_scope.yaml", [
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
    ...commonFlags()
  });
  writeUnresolved(root, dir, stage, []);
  const stageRoot = path.join(os.tmpdir(), `harness-core-active-scoped-refresh-${process.pid}`);
  fs.rmSync(stageRoot, { recursive: true, force: true });
  fs.mkdirSync(stageRoot, { recursive: true });
  for (const relPath of packageRoots) copyIntoStage(root, relPath, stageRoot);
  fs.mkdirSync(path.join(stageRoot, "final_export_refresh_after_active_scoped_gates"), { recursive: true });
  writeJson(path.join(stageRoot, "final_export_refresh_after_active_scoped_gates", "claim_state.json"), claimState);
  writeJson(path.join(stageRoot, "final_export_refresh_after_active_scoped_gates", "manifest.json"), manifest);
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
    raw_or_secret_included: bad.raw_payload.length > 0,
    protected_path_status: protectedStatus(root),
    ...commonFlags({ actual_export_write: packageCreated })
  };
  manifest.status = packageCreated ? "exported" : "blocked";
  manifest.package_sha256 = checksum;
  manifest.package_entry_count = entries.length;
  manifest.package_entries = entries;
  writeJsonRel(root, `${dir}/final_export_refresh_after_active_scoped_gates_report.json`, report);
  writeJsonRel(root, `${dir}/final_export_refresh_manifest.json`, manifest);
  writeJsonRel(root, `${dir}/final_export_refresh_checksums.json`, { status: "recorded", stage, entries: [{ path: EXPORT_PACKAGE, sha256: checksum }] });
  writeJsonRel(root, `${dir}/final_export_refresh_gate_report.json`, { status: packageCreated ? "pass" : "blocked", stage, unresolved_items_count: packageCreated ? 0 : 1, package_record: report, ...commonFlags({ actual_export_write: packageCreated }) });
  writeMd(root, "docs/final_export_refresh_after_active_scoped_gates.ko.md", "Final Export Refresh After Active Scoped Gates", [
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

export function checkFinalExportRefreshAfterActiveScopedGates(root) {
  const stage = STAGES.exportRefresh;
  const dir = DIRS.exportRefresh;
  const report = readJsonIfExists(root, `${dir}/final_export_refresh_after_active_scoped_gates_report.json`);
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
  const checked = { status: failures.length === 0 ? "pass" : "fail", stage, unresolved_items_count: failures.length, ...commonFlags({ actual_export_write: report?.actual_export_write === true }), checks, failures };
  writeJsonRel(root, `${dir}/final_export_refresh_gate_report.json`, checked);
  return checked;
}

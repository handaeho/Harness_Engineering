#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { previewText, redactionPassed } from "../../../adapters/api/openai/redaction_policy.mjs";
import { writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-tool-calling-mock-smoke-canary";
const EVIDENCE_DIR = "post-stable-local-tool-calling-mock-smoke-canary";
const PROVIDER = "ollama";
const ENDPOINT = "http://127.0.0.1:11434/v1";
const MODELS = ["qwen3:14b", "qwen3.6:27b"];
const TOOL_NAME = "local_mock_lookup";
const CASE = {
  case_id: "local-tool-mock-lookup-001",
  input: "Use the local_mock_lookup tool to look up the local canary key alpha and do not answer directly."
};
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "tool-call-verified",
  "production-ready",
  "stable",
  "release-gated"
];
const ALLOWED_CLAIMS = [
  "post-stable-local-tool-calling-mock-smoke-canary-completed",
  "post-stable-local-tool-calling-mock-schema-checked",
  "post-stable-local-tool-calling-mock-redaction-checked"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

function p(...parts) {
  return path.join(root, ...parts);
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function buildChatUrl(baseUrl) {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/+$/, "");
  url.pathname = `${basePath || "/v1"}/chat/completions`.replace(/\/{2,}/g, "/");
  url.search = "";
  url.hash = "";
  return url;
}

function gitStatusFor(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
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

function protectedStatus() {
  const status = gitStatusFor([
    "legacy-reference-source",
    "dist",
    "harness-core/evidence/reference-baseline"
  ]);
  const lines = status.stdout.split(/\r?\n/).filter(Boolean);
  return {
    reference_baseline_source_modified: lines.some((line) => line.includes("legacy-reference-source")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_reference_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/reference-baseline"))
  };
}

function parseArgs(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function callToolMockSmoke(model) {
  const body = {
    model,
    messages: [
      {
        role: "system",
        content: "You are running a local tool-calling mock smoke canary. Use the provided tool when asked. Do not invent external side effects."
      },
      {
        role: "user",
        content: CASE.input
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: TOOL_NAME,
          description: "Mock lookup tool for local harness smoke testing. It has no external side effects.",
          parameters: {
            type: "object",
            properties: {
              key: {
                type: "string",
                description: "Local canary key to look up."
              }
            },
            required: ["key"],
            additionalProperties: false
          }
        }
      }
    ],
    tool_choice: {
      type: "function",
      function: { name: TOOL_NAME }
    },
    temperature: 0,
    max_tokens: 128,
    stream: false,
    think: false,
    reasoning_effort: "none",
    reasoning: { effort: "none" }
  };
  const response = await fetch(buildChatUrl(ENDPOINT), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  const message = json?.choices?.[0]?.message || {};
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const firstToolCall = toolCalls[0] || null;
  const argsObject = parseArgs(firstToolCall?.function?.arguments);
  const toolNameMatches = firstToolCall?.function?.name === TOOL_NAME;
  return {
    model,
    case_id: CASE.case_id,
    status: response.ok && toolCalls.length > 0 && toolNameMatches ? "pass" : "fail",
    http_status: response.status,
    finish_reason: json?.choices?.[0]?.finish_reason || null,
    usage: json?.usage || null,
    tool_schema_sent: true,
    tool_choice_forced: true,
    tool_calls_present: toolCalls.length > 0,
    tool_call_count: toolCalls.length,
    tool_name_matches: toolNameMatches,
    tool_arguments_parse_passed: Boolean(argsObject),
    tool_argument_keys: argsObject && typeof argsObject === "object" ? Object.keys(argsObject).sort() : [],
    external_tool_executed: false,
    mock_tool_output_reinjected: false,
    request: {
      model_present: true,
      input_preview: previewText(CASE.input, 120),
      input_hash: sha256(CASE.input),
      tools_count: 1,
      tool_choice: TOOL_NAME,
      stream: false,
      max_tokens: body.max_tokens,
      thinking_disabled: true,
      reasoning_effort: "none"
    },
    response: {
      assistant_content_present: typeof message.content === "string" && message.content.trim().length > 0,
      assistant_content_preview: previewText(message.content || "", 120),
      assistant_content_hash: sha256(message.content || ""),
      tool_arguments_preview: previewText(firstToolCall?.function?.arguments || "", 160),
      tool_arguments_hash: sha256(firstToolCall?.function?.arguments || ""),
      raw_response_hash: sha256(text)
    },
    raw_request_stored: false,
    raw_response_stored: false
  };
}

const protectedPaths = protectedStatus();
const caseResults = [];
for (const model of MODELS) {
  try {
    caseResults.push(await callToolMockSmoke(model));
  } catch (error) {
    caseResults.push({
      model,
      case_id: CASE.case_id,
      status: "fail",
      error_name: error?.name || "Error",
      tool_schema_sent: true,
      tool_calls_present: false,
      external_tool_executed: false,
      raw_request_stored: false,
      raw_response_stored: false
    });
  }
}

const redactionReport = {
  status: redactionPassed(caseResults) ? "pass" : "fail",
  stage: STAGE,
  raw_authorization_header_recorded: false,
  raw_request_body_recorded: false,
  raw_response_recorded: false,
  api_key_recorded: false,
  secrets_logged: false,
  raw_request_stored: false,
  raw_response_stored: false
};

const status = caseResults.every((item) => item.status === "pass")
  && caseResults.every((item) => item.external_tool_executed === false)
  && redactionReport.status === "pass"
  && protectedPaths.reference_baseline_source_modified === false
  && protectedPaths.dist_modified === false
  && protectedPaths.evidence_reference_baseline_modified === false
  ? "pass"
  : "fail";

const report = {
  status,
  stage: STAGE,
  provider: PROVIDER,
  endpoint: ENDPOINT,
  models: MODELS,
  new_local_model_execution: true,
  new_local_generation_calls: caseResults.length,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  tool_call_verified_allowed: false,
  cases_total: caseResults.length,
  cases_passed: caseResults.filter((item) => item.status === "pass").length,
  cases_failed: caseResults.filter((item) => item.status !== "pass").length,
  mock_tool_schema_used: true,
  external_tool_executed: false,
  mock_tool_output_reinjected: false,
  redaction_passed: redactionReport.status === "pass",
  case_results: caseResults,
  claims_allowed: status === "pass" ? ALLOWED_CLAIMS : [],
  claims_blocked: BLOCKED_CLAIMS
};

const claimBoundary = {
  status,
  stage: STAGE,
  tool_calling_mock_smoke_allowed: status === "pass",
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  tool_call_verified_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: status === "pass" ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "local_structured_output_smoke_passed_tool_mock_pending",
  new_status: status === "pass"
    ? "local_tool_calling_mock_smoke_passed_replay_regression_pending"
    : "local_tool_calling_mock_smoke_failed",
  unblocks: status === "pass" ? ALLOWED_CLAIMS : [],
  still_blocks: BLOCKED_CLAIMS,
  next_required_actions: [
    "run local replay/regression smoke"
  ]
};

const unresolvedItems = status === "pass" ? [] : caseResults
  .filter((item) => item.status !== "pass")
  .map((item, index) => ({
    id: `LTCM-${String(index + 1).padStart(3, "0")}`,
    severity: "high",
    description: `Tool-calling mock smoke failed for ${item.model}: tool_calls_present=${item.tool_calls_present}`,
    recommended_next_action: "Stop autopilot unless a single safe repair can be made without new tool side effects."
  }));

const md = `# Local Tool-calling Mock Smoke Canary

Status: ${report.status}

- Stage: ${STAGE}
- Models: ${MODELS.join(", ")}
- New local generation calls: ${report.new_local_generation_calls}
- Cases passed: ${report.cases_passed}/${report.cases_total}
- External tool executed: false
- Raw request stored: false
- Raw response stored: false
- Redaction passed: ${report.redaction_passed}

## Claim Boundary

- Allows after pass: ${claimBoundary.allowed_claims.join(", ") || "none"}
- Still blocked: ${BLOCKED_CLAIMS.join(", ")}
`;

writeJson(p("evidence", EVIDENCE_DIR, "local_tool_calling_mock_smoke_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_tool_calling_mock_smoke_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "local_tool_calling_mock_response_mapping.json"), caseResults);
writeJson(p("evidence", EVIDENCE_DIR, "local_tool_calling_mock_redaction_report.json"), redactionReport);
writeJson(p("evidence", EVIDENCE_DIR, "local_tool_calling_mock_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "local_tool_calling_mock_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "local_tool_calling_mock_gate_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_tool_calling_mock_gate_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "local_tool_calling_mock_smoke_report.json"), report);
writeText(p("evals", "reports", "local_tool_calling_mock_smoke_report.md"), md);
writeJson(p("evals", "reports", "local_tool_calling_mock_smoke_gate_report.json"), report);
writeText(p("evals", "reports", "local_tool_calling_mock_smoke_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

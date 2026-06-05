#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { previewText, redactionPassed } from "../adapters/api/openai/redaction_policy.mjs";
import { writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-structured-output-smoke-canary";
const EVIDENCE_DIR = "post-stable-local-structured-output-smoke-canary";
const PROVIDER = "ollama";
const ENDPOINT = "http://127.0.0.1:11434/v1";
const MODELS = ["qwen3:14b", "qwen3.6:27b"];
const CASES = [
  {
    case_id: "local-structured-json-basic-001",
    input: "Return a compact JSON object with keys status, surface, and count. Use status ok, surface structured_smoke, count 1.",
    required_keys: ["status", "surface", "count"]
  },
  {
    case_id: "local-structured-json-boundary-001",
    input: "Return only a compact JSON object with keys tool_calls and structured_smoke. Use boolean values.",
    required_keys: ["tool_calls", "structured_smoke"]
  }
];
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "schema-output-verified",
  "production-ready",
  "stable",
  "release-gated"
];
const ALLOWED_CLAIMS = [
  "post-stable-local-structured-output-smoke-canary-completed",
  "post-stable-local-structured-output-json-smoke-checked",
  "post-stable-local-structured-output-redaction-checked"
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

function extractJsonObject(content) {
  const trimmed = String(content || "").trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(withoutFence.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callStructuredSmoke(model, testCase) {
  const body = {
    model,
    messages: [
      {
        role: "system",
        content: "You are running a local structured-output smoke canary. Return only a compact JSON object."
      },
      {
        role: "user",
        content: testCase.input
      }
    ],
    response_format: { type: "json_object" },
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
  const content = json?.choices?.[0]?.message?.content || "";
  const parsedContent = extractJsonObject(content);
  const parsedKeys = parsedContent && typeof parsedContent === "object" && !Array.isArray(parsedContent)
    ? Object.keys(parsedContent).sort()
    : [];
  const requiredKeysPresent = testCase.required_keys.every((key) => parsedKeys.includes(key));
  return {
    model,
    case_id: testCase.case_id,
    status: response.ok && parsedContent && requiredKeysPresent ? "pass" : "fail",
    http_status: response.status,
    output_text_present: Boolean(String(content).trim()),
    json_parse_passed: Boolean(parsedContent),
    required_keys_present: requiredKeysPresent,
    parsed_keys: parsedKeys,
    finish_reason: json?.choices?.[0]?.finish_reason || null,
    usage: json?.usage || null,
    request: {
      model_present: true,
      input_preview: previewText(testCase.input, 120),
      input_hash: sha256(testCase.input),
      response_format_json_object: true,
      tools_present: false,
      stream: false,
      max_tokens: body.max_tokens,
      thinking_disabled: true,
      reasoning_effort: "none"
    },
    response: {
      output_text_preview: previewText(content, 180),
      output_text_hash: sha256(content),
      raw_response_hash: sha256(text)
    },
    raw_request_stored: false,
    raw_response_stored: false
  };
}

const protectedPaths = protectedStatus();
const caseResults = [];
for (const model of MODELS) {
  for (const testCase of CASES) {
    try {
      caseResults.push(await callStructuredSmoke(model, testCase));
    } catch (error) {
      caseResults.push({
        model,
        case_id: testCase.case_id,
        status: "fail",
        error_name: error?.name || "Error",
        output_text_present: false,
        json_parse_passed: false,
        required_keys_present: false,
        raw_request_stored: false,
        raw_response_stored: false
      });
    }
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
  schema_output_verified_allowed: false,
  cases_total: caseResults.length,
  cases_passed: caseResults.filter((item) => item.status === "pass").length,
  cases_failed: caseResults.filter((item) => item.status !== "pass").length,
  response_format_json_object_used: true,
  redaction_passed: redactionReport.status === "pass",
  case_results: caseResults,
  claims_allowed: status === "pass" ? ALLOWED_CLAIMS : [],
  claims_blocked: BLOCKED_CLAIMS
};

const claimBoundary = {
  status,
  stage: STAGE,
  structured_output_smoke_allowed: status === "pass",
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  schema_output_verified_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: status === "pass" ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "local_model_verification_gate_designed_smoke_execution_pending",
  new_status: status === "pass"
    ? "local_structured_output_smoke_passed_tool_mock_pending"
    : "local_structured_output_smoke_failed",
  unblocks: status === "pass" ? ALLOWED_CLAIMS : [],
  still_blocks: BLOCKED_CLAIMS,
  next_required_actions: [
    "run local tool-calling mock smoke canary"
  ]
};

const unresolvedItems = status === "pass" ? [] : caseResults
  .filter((item) => item.status !== "pass")
  .map((item, index) => ({
    id: `LSOS-${String(index + 1).padStart(3, "0")}`,
    severity: "high",
    description: `Structured-output smoke failed for ${item.model} ${item.case_id}`,
    recommended_next_action: "Inspect sanitized structured-output mapping and stop autopilot if safe repair would require another generation loop."
  }));

const md = `# Local Structured-output Smoke Canary

Status: ${report.status}

- Stage: ${STAGE}
- Models: ${MODELS.join(", ")}
- New local generation calls: ${report.new_local_generation_calls}
- Cases passed: ${report.cases_passed}/${report.cases_total}
- Raw request stored: false
- Raw response stored: false
- Redaction passed: ${report.redaction_passed}

## Claim Boundary

- Allows after pass: ${claimBoundary.allowed_claims.join(", ") || "none"}
- Still blocked: ${BLOCKED_CLAIMS.join(", ")}
`;

writeJson(p("evidence", EVIDENCE_DIR, "local_structured_output_smoke_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_structured_output_smoke_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "local_structured_output_response_mapping.json"), caseResults);
writeJson(p("evidence", EVIDENCE_DIR, "local_structured_output_redaction_report.json"), redactionReport);
writeJson(p("evidence", EVIDENCE_DIR, "local_structured_output_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "local_structured_output_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "local_structured_output_gate_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_structured_output_gate_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "local_structured_output_smoke_report.json"), report);
writeText(p("evals", "reports", "local_structured_output_smoke_report.md"), md);
writeJson(p("evals", "reports", "local_structured_output_smoke_gate_report.json"), report);
writeText(p("evals", "reports", "local_structured_output_smoke_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

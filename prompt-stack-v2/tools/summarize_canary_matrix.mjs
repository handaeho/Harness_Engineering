#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-canary-matrix-summary-and-local-readiness";
const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

function p(...parts) {
  return path.join(root, ...parts);
}

const noTool = readJson(p("evidence", "beta-provider-canary-openai", "provider_canary_report.json"));
const structured = readJson(p("evidence", "beta-structured-output-canary-openai", "structured_output_canary_report.json"));
const tool = readJson(p("evidence", "beta-tool-calling-canary-openai", "tool_calling_canary_report.json"));

const noToolPass = noTool.status === "pass"
  && noTool.provider_execution === true
  && noTool.tools_used === false
  && noTool.structured_output_used === false
  && noTool.redaction_passed === true
  && noTool.raw_response_stored === false;
const structuredPass = structured.status === "pass"
  && structured.provider_execution === true
  && structured.structured_output_used === true
  && structured.tools_used === false
  && structured.ajv_validation_used === true
  && structured.schema_validations_failed === 0
  && structured.raw_response_stored === false;
const toolPass = tool.status === "pass"
  && tool.provider_execution === true
  && tool.tool_calling_used === true
  && tool.function_tools_used === true
  && tool.mock_tools_only === true
  && tool.blocked_tools_executed === 0
  && tool.raw_response_stored === false;

const blockers = [
  {
    id: "LRC-001",
    severity: "medium",
    target: "vllm",
    description: "vLLM local no-tool canary was not executed because no local vLLM endpoint is available.",
    blocks_local_no_tool_canary: true,
    blocks_local_structured_output_canary: true,
    blocks_provider_diversity_claim: true,
    owner: "human",
    recommended_next_action: "Start a localhost-only vLLM OpenAI-compatible endpoint and provide VLLM_BASE_URL and VLLM_MODEL before running local canary."
  },
  {
    id: "LRC-002",
    severity: "medium",
    target: "ollama",
    description: "Ollama local no-tool canary was not executed because no local Ollama endpoint is available.",
    blocks_local_no_tool_canary: true,
    blocks_local_structured_output_canary: true,
    blocks_provider_diversity_claim: true,
    owner: "human",
    recommended_next_action: "Start a localhost-only Ollama endpoint and provide OLLAMA_BASE_URL and OLLAMA_MODEL before running local canary."
  }
];

const localReadiness = {
  status: "blocked_by_missing_local_endpoint",
  local_model_execution: false,
  vllm_endpoint_available: false,
  ollama_endpoint_available: false,
  non_localhost_endpoint_used: false,
  provider_diversity_claim_allowed: false,
  local_model_verified_claim_allowed: false,
  blockers_count: blockers.length
};

const claimsAllowed = [
  "harness-designed",
  "static-structure-created",
  "baseline-snapshotted",
  "adapter-skeleton-created",
  "alpha-static-validated",
  "dependency-static-validated",
  "adapter-dry-run-checked",
  "beta-preflight-prepared",
  "beta-mock-runtime-executed",
  "mock-tool-routing-checked",
  "approval-boundary-smoke-tested",
  "trace-schema-smoke-tested",
  "schema-contract-validated",
  "openai-provider-canary-executed",
  "provider-no-tool-path-checked",
  "provider-trace-captured",
  "provider-redaction-checked",
  "openai-structured-output-canary-executed",
  "provider-structured-output-path-checked",
  "json-schema-response-canary-validated",
  "structured-output-trace-captured",
  "structured-output-redaction-checked",
  "openai-tool-calling-canary-executed",
  "provider-tool-call-path-checked",
  "tool-argument-schema-canary-validated",
  "mock-tool-output-reinjection-checked",
  "tool-approval-boundary-canary-checked",
  "tool-output-reclassification-checked",
  "tool-calling-trace-captured",
  "tool-calling-redaction-checked",
  "canary-matrix-summarized",
  "local-readiness-documented",
  "local-endpoint-blocker-recorded"
];

const claimsNotAllowed = [
  "local-no-tool-canary-executed",
  "vllm-no-tool-canary-executed",
  "ollama-no-tool-canary-executed",
  "local-model-verified",
  "provider-diverse",
  "adapter-checked",
  "provider-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "replay-verified",
  "integration-verified",
  "release-gated",
  "production-monitored"
];

const status = noToolPass && structuredPass && toolPass ? "pass" : "fail";
const summary = {
  status,
  stage: STAGE,
  provider_execution_performed_in_this_stage: false,
  local_model_execution_performed_in_this_stage: false,
  endpoint_probe_performed_in_this_stage: false,
  evidence_inputs: {
    openai_no_tool_status: noTool.status,
    openai_structured_output_status: structured.status,
    openai_tool_calling_status: tool.status
  },
  matrix: {
    openai: {
      no_tool_text_path: noToolPass ? "canary_checked" : "needs_review",
      structured_output_path: structuredPass ? "canary_checked" : "needs_review",
      tool_calling_path: toolPass ? "canary_checked" : "needs_review",
      trace: noTool.trace_events_total > 0 && structured.trace_events_total > 0 && tool.trace_events_total > 0 ? "canary_checked" : "needs_review",
      redaction: noTool.redaction_passed && structured.redaction_passed && tool.redaction_passed ? "canary_checked" : "needs_review",
      raw_response_stored: false,
      claim_level: "canary_only"
    },
    vllm: {
      local_no_tool_path: "blocked_by_missing_endpoint",
      claim_level: "not_executed"
    },
    ollama: {
      local_no_tool_path: "blocked_by_missing_endpoint",
      claim_level: "not_executed"
    }
  },
  claims_allowed: [
    "canary-matrix-summarized",
    "local-readiness-documented",
    "local-endpoint-blocker-recorded"
  ],
  claims_not_allowed: [
    "provider-diverse",
    "local-model-verified",
    "provider-verified",
    "adapter-checked",
    "integration-verified",
    "release-gated"
  ]
};

const claimStatus = {
  status,
  stage: STAGE,
  claims_allowed: claimsAllowed,
  claims_not_allowed: claimsNotAllowed,
  notes: [
    "OpenAI canary coverage remains canary_only.",
    "Local vLLM and Ollama canaries were not executed.",
    "Provider diversity and local model verification claims remain blocked."
  ]
};

const unresolved = [];
const summaryMd = `# Canary Matrix Summary

Status: ${summary.status}

Stage: ${STAGE}

No provider or local model execution was performed in this summary stage.

## Matrix

| Target | No-tool | Structured output | Tool calling | Claim level |
| --- | --- | --- | --- | --- |
| OpenAI | ${summary.matrix.openai.no_tool_text_path} | ${summary.matrix.openai.structured_output_path} | ${summary.matrix.openai.tool_calling_path} | ${summary.matrix.openai.claim_level} |
| vLLM | ${summary.matrix.vllm.local_no_tool_path} | not_executed | not_executed | ${summary.matrix.vllm.claim_level} |
| Ollama | ${summary.matrix.ollama.local_no_tool_path} | not_executed | not_executed | ${summary.matrix.ollama.claim_level} |

## Boundaries

- provider_execution_performed_in_this_stage: false
- local_model_execution_performed_in_this_stage: false
- endpoint_probe_performed_in_this_stage: false
- provider-diverse: blocked
- local-model-verified: blocked
`;

const localMd = `# Local Readiness Report

Status: ${localReadiness.status}

- vLLM endpoint available: false
- Ollama endpoint available: false
- Local model execution: false
- Non-localhost endpoint used: false
- Provider diversity claim allowed: false
- Local model verified claim allowed: false
- Blockers: ${blockers.length}

## Blockers

${blockers.map((item) => `- ${item.id} (${item.target}): ${item.description}`).join("\n")}
`;

const out = p("evidence", "beta-canary-matrix-summary");
writeJson(path.join(out, "canary_matrix_summary.json"), summary);
writeText(path.join(out, "canary_matrix_summary.md"), summaryMd);
writeJson(path.join(out, "local_readiness_blockers.json"), blockers);
writeJson(path.join(out, "local_readiness_report.json"), localReadiness);
writeJson(path.join(out, "claim_status_report.json"), claimStatus);
writeJson(path.join(out, "unresolved_items.json"), unresolved);
writeJson(p("evals", "reports", "canary_matrix_summary_report.json"), summary);
writeText(p("evals", "reports", "canary_matrix_summary_report.md"), summaryMd);
writeJson(p("evals", "reports", "local_readiness_report.json"), localReadiness);
writeText(p("evals", "reports", "local_readiness_report.md"), localMd);

console.log(JSON.stringify(summary, null, 2));
process.exit(status === "pass" ? 0 : 1);

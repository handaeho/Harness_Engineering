#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-vllm-no-tool-canary";
const GENERIC_READINESS_STAGE = "v2.0.0-post-rc-local-endpoint-readiness-preflight";
const DEFAULT_ENDPOINT = "http://127.0.0.1:8000/v1";
const EVIDENCE_DIR = "post-stable-local-vllm-no-tool-canary";
const READINESS_EVIDENCE_DIR = "post-stable-vllm-endpoint-readiness-preflight";
const REPORT_PREFIX = "post_stable_local_vllm_no_tool_canary";
const CLAIMS_ALLOWED_AFTER_PASS = [
  "post-stable-local-vllm-no-tool-canary-passed",
  "vllm-local-server-roundtrip-executed",
  "vllm-no-tool-response-mapping-checked"
];
const CLAIMS_BLOCKED = [
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const arg = args.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function readTextIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readText(file) : "";
}

function addAliasCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const endpointUrl = argValue("endpoint-url", process.env.VLLM_ENDPOINT_URL || process.env.LOCAL_ENDPOINT_URL || DEFAULT_ENDPOINT);
const modelName = argValue("model", process.env.VLLM_MODEL || process.env.LOCAL_ENDPOINT_MODEL || "");
const authRequired = argValue("auth-required", process.env.VLLM_AUTH_REQUIRED || process.env.LOCAL_ENDPOINT_AUTH_REQUIRED || "no");
const timeoutMs = argValue("timeout-ms", process.env.VLLM_TIMEOUT_MS || process.env.LOCAL_ENDPOINT_TIMEOUT_MS || "60000");

const child = spawnSync(process.execPath, [
  p("tools", "runners", "local", "run_local_no_tool_canary.mjs"),
  `--provider=vllm`,
  `--endpoint-url=${endpointUrl}`,
  `--model=${modelName}`,
  `--auth-required=${authRequired}`,
  `--timeout-ms=${timeoutMs}`,
  `--readiness-evidence-dir=${READINESS_EVIDENCE_DIR}`,
  `--evidence-dir=${EVIDENCE_DIR}`,
  `--report-prefix=${REPORT_PREFIX}`
], {
  cwd: root,
  encoding: "utf8",
  env: {
    ...process.env,
    LOCAL_ENDPOINT_API_KEY: process.env.VLLM_API_KEY || process.env.LOCAL_ENDPOINT_API_KEY || ""
  },
  maxBuffer: 8 * 1024 * 1024
});

const genericReport = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_no_tool_canary_report.json`);
const genericGate = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_no_tool_canary_gate_report.json`);
const mapping = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_response_mapping_report.json`);
const redaction = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_no_tool_redaction_report.json`);
const readiness = readJsonIfExists(`evidence/${READINESS_EVIDENCE_DIR}/local_endpoint_readiness_gate_report.json`);
const unresolved = readJsonIfExists(`evidence/${EVIDENCE_DIR}/unresolved_items.json`);
const traceText = readTextIfExists(`evidence/${EVIDENCE_DIR}/local_trace_samples.jsonl`);

const checks = [];
addAliasCheck(checks, "generic local no-tool report exists", Boolean(genericReport), {});
addAliasCheck(checks, "generic local no-tool status pass", genericReport?.status === "pass", {
  status: genericReport?.status || null
});
addAliasCheck(checks, "provider is vllm", genericReport?.provider === "vllm", {
  provider: genericReport?.provider || null
});
addAliasCheck(checks, "readiness preflight passed", readiness?.status === "pass" && readiness?.stage === GENERIC_READINESS_STAGE, {
  status: readiness?.status || null,
  stage: readiness?.stage || null
});
addAliasCheck(checks, "local model execution occurred", genericReport?.local_model_execution === true, {
  local_model_execution: genericReport?.local_model_execution || false
});
addAliasCheck(checks, "no tools or structured output used", genericReport?.tools_used === false && genericReport?.structured_output_used === false, {
  tools_used: genericReport?.tools_used || false,
  structured_output_used: genericReport?.structured_output_used || false
});
addAliasCheck(checks, "raw request/response not stored", genericReport?.raw_request_stored === false
  && genericReport?.raw_response_stored === false
  && redaction?.raw_request_body_recorded === false
  && redaction?.raw_response_recorded === false, redaction || {});
addAliasCheck(checks, "cases passed", genericReport?.cases_total > 0
  && genericReport?.cases_passed === genericReport?.cases_total, {
  cases_passed: genericReport?.cases_passed || 0,
  cases_total: genericReport?.cases_total || 0
});

const failures = checks.filter((check) => check.status !== "pass");
const status = failures.length === 0 ? "pass" : "fail";
const report = {
  ...(genericReport || {}),
  status,
  stage: STAGE,
  source_stage: genericReport?.stage || null,
  provider: "vllm",
  endpoint_url: genericReport?.endpoint_url || readiness?.endpoint_url || null,
  model_name: genericReport?.model_name || modelName,
  local_endpoint_probe: genericReport?.local_endpoint_probe === true || readiness?.local_endpoint_probe === true,
  local_model_execution: genericReport?.local_model_execution === true,
  vllm_no_tool_canary_executed: status === "pass",
  vllm_local_server_roundtrip_passed: status === "pass",
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  redaction_passed: redaction?.status === "pass" && genericReport?.redaction_passed === true,
  child_exit_code: child.status,
  child_signal: child.signal || null,
  checks,
  failures,
  claims_allowed: status === "pass" ? CLAIMS_ALLOWED_AFTER_PASS : [],
  claims_blocked: CLAIMS_BLOCKED,
  provider_verified_allowed_by_this_artifact: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

const claimBoundary = {
  status,
  stage: STAGE,
  provider: "vllm",
  vllm_no_tool_canary_executed: status === "pass",
  provider_verified_allowed_by_this_artifact: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: report.claims_allowed,
  blocked_claims: CLAIMS_BLOCKED
};

const md = `# vLLM No-tool Canary

Status: ${status}

- Stage: ${STAGE}
- Endpoint: ${report.endpoint_url || "missing"}
- Model: ${report.model_name || "missing"}
- Readiness stage: ${readiness?.stage || "missing"}
- Local model execution: ${report.local_model_execution}
- Cases passed: ${report.cases_passed || 0}/${report.cases_total || 0}
- Raw request stored: false
- Raw response stored: false
- Adapter-checked allowed: false
`;

writeJson(p("evidence", EVIDENCE_DIR, "vllm_no_tool_canary_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "vllm_no_tool_canary_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "vllm_no_tool_canary_gate_report.json"), report);
writeJson(p("evidence", EVIDENCE_DIR, "vllm_no_tool_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "vllm_response_mapping_report.json"), mapping || { status: "missing", stage: STAGE });
writeJson(p("evidence", EVIDENCE_DIR, "vllm_no_tool_redaction_report.json"), redaction || { status: "missing", stage: STAGE });
writeText(p("evidence", EVIDENCE_DIR, "vllm_trace_samples.jsonl"), traceText);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), Array.isArray(unresolved) ? unresolved : failures.map((failure, index) => ({
  id: `VLLM-NT-${String(index + 1).padStart(3, "0")}`,
  severity: "medium",
  description: `vLLM no-tool canary failed: ${failure.name}`,
  blocks_adapter_checked: true,
  recommended_next_action: "Fix the vLLM endpoint, served model, readiness preflight, or response mapping, then rerun canary:vllm-no-tool."
})));
writeJson(p("evals", "reports", "vllm_no_tool_canary_report.json"), report);
writeText(p("evals", "reports", "vllm_no_tool_canary_report.md"), md);

if (child.error && !genericReport) {
  console.error(child.error.message);
}
console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);

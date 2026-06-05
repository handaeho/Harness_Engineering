#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-adapter-conformance-dependency-install-and-local-ollama-validation";
const EVIDENCE_DIR = "post-stable-local-ollama-adapter-conformance";
const REQUIRED_FILES = [
  "local_ollama_adapter_conformance_report.json",
  "local_ollama_adapter_request_mapping_review.json",
  "local_ollama_adapter_response_mapping_review.json",
  "local_ollama_reasoning_control_mapping_review.json",
  "local_ollama_provider_capability_matrix_review.json",
  "local_ollama_adapter_storage_redaction_review.json",
  "local_ollama_adapter_conformance_claim_boundary.json",
  "local_ollama_adapter_conformance_gate_report.json",
  "unresolved_items.json"
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

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function exists(file) {
  return fs.existsSync(file);
}

const checks = [];
function addCheck(name, passed, detail = {}) {
  checks.push({ name, status: passed ? "pass" : "fail", detail });
}

for (const file of REQUIRED_FILES) {
  addCheck(`${file} exists`, exists(e(file)));
}

const report = exists(e("local_ollama_adapter_conformance_report.json")) ? readJson(e("local_ollama_adapter_conformance_report.json")) : null;
const request = exists(e("local_ollama_adapter_request_mapping_review.json")) ? readJson(e("local_ollama_adapter_request_mapping_review.json")) : null;
const response = exists(e("local_ollama_adapter_response_mapping_review.json")) ? readJson(e("local_ollama_adapter_response_mapping_review.json")) : null;
const reasoning = exists(e("local_ollama_reasoning_control_mapping_review.json")) ? readJson(e("local_ollama_reasoning_control_mapping_review.json")) : null;
const matrix = exists(e("local_ollama_provider_capability_matrix_review.json")) ? readJson(e("local_ollama_provider_capability_matrix_review.json")) : null;
const storage = exists(e("local_ollama_adapter_storage_redaction_review.json")) ? readJson(e("local_ollama_adapter_storage_redaction_review.json")) : null;
const boundary = exists(e("local_ollama_adapter_conformance_claim_boundary.json")) ? readJson(e("local_ollama_adapter_conformance_claim_boundary.json")) : null;
const unresolved = exists(e("unresolved_items.json")) ? readJson(e("unresolved_items.json")) : [];

addCheck("stage matches", report?.stage === STAGE, { stage: report?.stage });
addCheck("status pass", report?.status === "pass", { status: report?.status });
addCheck("dependency_backed_validation == true", report?.dependency_backed_validation === true);
addCheck("request_mapping_reviewed == true", report?.request_mapping_reviewed === true && request?.status === "pass");
addCheck("response_mapping_reviewed == true", report?.response_mapping_reviewed === true && response?.status === "pass");
addCheck("reasoning_control_mapping_reviewed == true", report?.reasoning_control_mapping_reviewed === true && reasoning?.status === "pass");
addCheck("provider_capability_matrix_reviewed == true", report?.provider_capability_matrix_reviewed === true && matrix?.status === "pass");
addCheck("storage_redaction_reviewed == true", report?.storage_redaction_reviewed === true && storage?.status === "pass");
addCheck("raw request/response not stored", report?.raw_request_stored === false && report?.raw_response_stored === false);
addCheck("strong local/provider claims remain false", report?.local_model_verified_allowed === false
  && report?.provider_diverse_allowed === false
  && report?.provider_verified_allowed === false
  && report?.adapter_checked_allowed === false
  && boundary?.local_model_verified_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false);

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/local_ollama_adapter_conformance_check_report.json",
    "evals/reports/local_ollama_adapter_conformance_check_report.md"
  ]
});
addCheck("prohibited claim scan pass", scan.status === "pass", { matches: scan.matches.length });

const failed = checks.filter((check) => check.status !== "pass");
const gateReport = {
  status: failed.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks,
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  can_refresh_owner_decision_packet: failed.length === 0,
  failures: failed
};

writeJson(e("local_ollama_adapter_conformance_gate_report.json"), gateReport);
writeJson(p("evals", "reports", "local_ollama_adapter_conformance_check_report.json"), gateReport);
writeText(p("evals", "reports", "local_ollama_adapter_conformance_check_report.md"), `# Local Ollama Adapter Conformance Check

Status: ${gateReport.status}

- Stage: ${STAGE}
- Can refresh owner decision packet: ${gateReport.can_refresh_owner_decision_packet}
- Unresolved items: ${gateReport.unresolved_items_count}

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(gateReport.status === "pass" ? 0 : 1);

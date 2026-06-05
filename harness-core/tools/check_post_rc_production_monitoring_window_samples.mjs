#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-window-sample-collection";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-window-samples";
const INDEX_PATH = `${EVIDENCE_DIR}/sample_receipt_index.json`;

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function traceIdValid(value) {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const index = readJsonIfExists(INDEX_PATH);
const report = readJsonIfExists(`${EVIDENCE_DIR}/sample_collection_report.json`);
const receipts = Array.isArray(index?.receipts) ? index.receipts : [];
const sampleUnits = receipts.reduce((sum, receipt) => sum + Math.max(0, Number(receipt.event_observations_emitted || 0)), 0);
const requiredSampleCount = Number(index?.required_sample_count || 50);
const checks = [];

addCheck(checks, `${INDEX_PATH} exists`, Boolean(index), {});
addCheck(checks, "index is append-only Langfuse receipt index",
  index?.stage === STAGE
    && index?.sink === "langfuse"
    && index?.append_only === true
    && index?.raw_payload_stored === false
    && index?.secrets_logged === false, {
  status: index?.status,
  trace_receipt_count: index?.trace_receipt_count,
  sample_units_total: index?.sample_units_total
});
addCheck(checks, "all indexed receipts have safe receipt metadata only",
  receipts.every((receipt) => traceIdValid(receipt.trace_id)
    && receipt.raw_trace_payload_stored === false
    && receipt.secrets_logged === false
    && receipt.raw_payload_stored === false
    && receipt.openai_model_api_call === false
    && receipt.local_endpoint_probe === false
    && receipt.local_model_execution === false), {
  receipts_checked: receipts.length
});
addCheck(checks, "sample total matches indexed receipt event observations",
  index?.sample_units_total === sampleUnits, {
  indexed_sample_units_total: index?.sample_units_total,
  calculated_sample_units_total: sampleUnits
});
addCheck(checks, "latest report keeps stronger claims blocked",
  !report || (
    report.production_monitored_allowed === false
    && report.production_ready_allowed === false
    && report.stable_allowed === false
    && report.provider_diverse_allowed === false
    && report.openai_model_api_call === false
    && report.local_endpoint_probe === false
    && report.local_model_execution === false
    && report.secrets_logged === false
    && report.raw_payload_stored === false
  ), {
  report_status: report?.status
});

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  trace_receipt_count_total: receipts.length,
  sample_units_total: sampleUnits,
  required_sample_count: requiredSampleCount,
  sample_count_met: sampleUnits >= requiredSampleCount,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  checks,
  failures
};

writeJson(p(...`${EVIDENCE_DIR}/sample_collection_gate_report.json`.split("/")), gate);
writeJson(p("evals", "reports", "post_rc_production_monitoring_window_sample_collection_gate_report.json"), gate);
console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);

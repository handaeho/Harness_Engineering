#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-window-result-review";

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

function p(...parts) {
  return path.join(root, ...parts);
}

function writeJsonOrKeepExisting(file, value) {
  try {
    writeJson(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) {
      return;
    }
    throw error;
  }
}

const report = readJson(p("evidence", "post-rc-production-monitoring-window-result-review", "monitoring_window_result_review.json"));
const boundary = readJson(p("evidence", "post-rc-production-monitoring-window-result-review", "monitoring_window_result_claim_boundary.json"));
const preconditions = readJson(p("evidence", "post-rc-production-monitoring-window-result-review", "production_monitoring_final_gate_preconditions.json"));

const checks = [
  {
    name: "stage matches result review",
    pass: report.stage === STAGE && boundary.stage === STAGE && preconditions.stage === STAGE
  },
  {
    name: "production-monitored remains blocked",
    pass: report.production_monitored_allowed === false
      && boundary.production_monitored_allowed === false
      && preconditions.can_claim_production_monitored === false
  },
  {
    name: "production-ready stable provider-diverse remain blocked",
    pass: report.production_ready_allowed === false
      && report.stable_allowed === false
      && report.provider_diverse_allowed === false
      && boundary.production_ready_allowed === false
      && boundary.stable_allowed === false
      && boundary.provider_diverse_allowed === false
  },
  {
    name: "no forbidden execution",
    pass: report.telemetry_sink_write === false
      && report.openai_model_api_call === false
      && report.local_endpoint_probe === false
      && report.local_model_execution === false
  }
];

const failures = checks.filter((check) => !check.pass);
const audit = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks: checks.map((check) => ({
    name: check.name,
    status: check.pass ? "pass" : "fail"
  })),
  failures: failures.map((check) => check.name)
};

writeJsonOrKeepExisting(p("evidence", "post-rc-production-monitoring-window-result-review", "monitoring_window_result_claim_audit.json"), audit);
console.log(JSON.stringify(audit, null, 2));
process.exit(audit.status === "pass" ? 0 : 1);

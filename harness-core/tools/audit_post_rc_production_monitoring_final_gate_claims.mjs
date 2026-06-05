#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-final-gate";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-final-gate";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function readJsonIfExists(relPath) {
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_gate_report.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/production_monitored_claim_boundary.json`)
  || readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_claim_boundary.json`);
const checks = [
  {
    name: "production-monitored allowed only after final gate pass",
    pass: report?.status === "pass"
      && report?.production_monitored_allowed === true
      && report?.can_claim_production_monitored === true
      && boundary?.production_monitored_allowed === true
      && boundary?.bare_release_gated_allowed === false
  },
  {
    name: "stronger claims remain blocked",
    pass: report?.production_ready_allowed === false
      && report?.stable_allowed === false
      && report?.provider_diverse_allowed === false
      && report?.local_model_verified_allowed === false
      && boundary?.production_ready_allowed === false
      && boundary?.stable_allowed === false
      && boundary?.provider_diverse_allowed === false
      && boundary?.local_model_verified_allowed === false
  },
  {
    name: "forbidden execution flags are false",
    pass: report?.telemetry_sink_write === false
      && report?.openai_model_api_call === false
      && report?.local_endpoint_probe === false
      && report?.local_model_execution === false
      && report?.production_deployment === false
  }
];
const failures = checks.filter((check) => !check.pass);
const result = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  can_claim_production_monitored: report?.can_claim_production_monitored === true,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  checks: checks.map((check) => ({ name: check.name, status: check.pass ? "pass" : "fail" })),
  failures: failures.map((check) => check.name)
};

writeJson(p("evals", "reports", "post_rc_production_monitoring_final_claim_boundary_report.json"), {
  ...(boundary || {}),
  audit_status: result.status,
  audit_checks: result.checks
});

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);

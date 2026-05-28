#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-ready-scope-decision-preflight";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

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

const report = readJsonIfExists("evidence/post-rc-production-ready-scope-preflight/production_ready_scope_preflight_report.json");
const boundary = readJsonIfExists("evidence/post-rc-production-ready-scope-preflight/production_ready_claim_boundary.json");
const checks = [
  {
    name: "stage remains preflight and owner decision required",
    pass: report?.stage === STAGE
      && report?.status === "blocked_by_owner_scope_decision_required"
      && report?.owner_decision_required === true
  },
  {
    name: "production-monitored remains allowed",
    pass: report?.production_monitored === true
      && boundary?.production_monitored_allowed === true
  },
  {
    name: "production-ready stable provider and local claims remain blocked",
    pass: report?.production_ready_allowed === false
      && report?.stable_allowed === false
      && report?.provider_diverse_allowed === false
      && report?.local_model_verified_allowed === false
      && boundary?.production_ready_allowed === false
      && boundary?.stable_allowed === false
      && boundary?.provider_diverse_allowed === false
      && boundary?.provider_verified_allowed === false
      && boundary?.adapter_checked_allowed === false
      && boundary?.local_model_verified_allowed === false
      && boundary?.bare_release_gated_allowed === false
  },
  {
    name: "no forbidden execution",
    pass: report?.openai_model_api_call === false
      && report?.telemetry_sink_write === false
      && report?.local_endpoint_probe === false
      && report?.local_model_execution === false
  }
];

const failures = checks.filter((check) => !check.pass);
const audit = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks: checks.map((check) => ({ name: check.name, status: check.pass ? "pass" : "fail" })),
  failures: failures.map((check) => check.name)
};

writeJson(p("evals", "reports", "post_rc_production_ready_claim_boundary_report.json"), {
  ...(boundary || {}),
  audit_status: audit.status,
  audit_checks: audit.checks
});

console.log(JSON.stringify(audit, null, 2));
process.exit(audit.status === "pass" ? 0 : 1);

#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-stable-scope-decision-preflight";
const EVIDENCE_DIR = "evidence/post-rc-stable-scope-preflight";

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

const report = readJsonIfExists(`${EVIDENCE_DIR}/stable_scope_preflight_report.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/stable_claim_boundary.json`);
const canonicalization = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_claim_canonicalization.json`);
const localEndpoint = readJsonIfExists(`${EVIDENCE_DIR}/local_endpoint_deferral_confirmation.json`);

const checks = [
  {
    name: "stage remains stable preflight and owner decision required",
    pass: report?.stage === STAGE
      && report?.status === "blocked_by_owner_stable_scope_decision_required"
      && report?.owner_decision_required === true
  },
  {
    name: "canonical scoped readiness claim remains the only production-ready-related allowed claim",
    pass: canonicalization?.status === "pass"
      && canonicalization?.canonical_allowed_claim === "post-rc-openai-only-production-ready"
      && canonicalization?.bare_production_ready_allowed === false
      && boundary?.post_rc_openai_only_production_ready_allowed === true
      && boundary?.general_production_ready_allowed === false
      && boundary?.production_ready_allowed === false
  },
  {
    name: "stable provider local and bare release claims remain blocked",
    pass: report?.stable_allowed === false
      && report?.provider_diverse_allowed === false
      && report?.local_model_verified_allowed === false
      && report?.bare_release_gated_allowed === false
      && boundary?.stable_allowed === false
      && boundary?.provider_diverse_allowed === false
      && boundary?.provider_verified_allowed === false
      && boundary?.adapter_checked_allowed === false
      && boundary?.local_model_verified_allowed === false
      && boundary?.bare_release_gated_allowed === false
  },
  {
    name: "local endpoint remains deferred without probe or model execution",
    pass: localEndpoint?.status === "confirmed_deferred"
      && localEndpoint?.local_endpoint_probe === false
      && localEndpoint?.local_model_execution === false
      && report?.local_endpoint_probe === false
      && report?.local_model_execution === false
  },
  {
    name: "no forbidden execution occurred",
    pass: report?.openai_model_api_call === false
      && report?.openai_provider_call === false
      && report?.telemetry_sink_write === false
      && report?.local_endpoint_probe === false
      && report?.local_model_execution === false
      && report?.v36_modified === false
      && report?.dist_modified === false
      && report?.evidence_v36_baseline_modified === false
  }
];

const failures = checks.filter((check) => !check.pass);
const audit = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks: checks.map((check) => ({ name: check.name, status: check.pass ? "pass" : "fail" })),
  failures: failures.map((check) => check.name),
  can_evaluate_openai_only_stable_scope: failures.length === 0,
  can_evaluate_strict_provider_diverse_stable_scope: false,
  can_enter_stable_release: false
};

writeJson(p("evals", "reports", "post_rc_stable_claim_boundary_report.json"), {
  ...(boundary || {}),
  audit_status: audit.status,
  audit_checks: audit.checks
});

console.log(JSON.stringify(audit, null, 2));
process.exit(audit.status === "pass" ? 0 : 1);

#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-openai-only-production-ready-scope-decision";
const EVIDENCE_DIR = "evidence/post-rc-openai-only-production-ready-scope-decision";

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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_scope_decision_report.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_claim_boundary.json`);
const decision = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_decision_record.json`);
const outOfScope = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_out_of_scope_boundaries.json`);
const completeness = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_evidence_completeness.json`);
const checks = [];

addCheck(checks, "canonical scoped readiness claim is enabled and bare production-ready remains blocked",
  report?.status === "pass"
    && report?.post_rc_openai_only_production_ready === true
    && report?.production_ready_allowed === false
    && report?.bare_production_ready_allowed === false
    && report?.production_ready_scope === "openai_only_post_rc"
    && report?.production_ready_scope_limited === true
    && boundary?.post_rc_openai_only_production_ready_allowed === true
    && boundary?.production_ready_allowed === false
    && boundary?.bare_production_ready_allowed === false
    && boundary?.production_ready_scope === "openai_only_post_rc",
  {
    report_status: report?.status,
    post_rc_openai_only_production_ready: report?.post_rc_openai_only_production_ready,
    production_ready_allowed: report?.production_ready_allowed,
    bare_production_ready_allowed: report?.bare_production_ready_allowed,
    production_ready_scope: report?.production_ready_scope
  });

addCheck(checks, "owner decision and evidence completeness are recorded",
  decision?.status === "recorded"
    && decision?.decision === "approve_post_rc_openai_only_production_ready_claim"
    && decision?.post_rc_openai_only_production_ready === true
    && decision?.bare_production_ready_allowed === false
    && completeness?.status === "pass"
    && Array.isArray(completeness?.missing_evidence)
    && completeness.missing_evidence.length === 0,
  {
    decision: decision?.decision,
    completeness_status: completeness?.status,
    missing_evidence: completeness?.missing_evidence
  });

addCheck(checks, "local/provider/local-model paths remain out of scope and blocked",
  outOfScope?.local_endpoint_out_of_scope === true
    && outOfScope?.provider_diversity_out_of_scope === true
    && outOfScope?.local_model_verification_out_of_scope === true
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.provider_diverse_allowed === false
    && report?.local_model_verified_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false,
  outOfScope || {});

addCheck(checks, "stable and bare release-gated remain blocked",
  report?.stable_allowed === false
    && report?.bare_release_gated_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.bare_release_gated_allowed === false,
  {
    stable_allowed: report?.stable_allowed,
    bare_release_gated_allowed: report?.bare_release_gated_allowed
  });

addCheck(checks, "no forbidden execution occurred",
  report?.openai_model_api_call === false
    && report?.openai_provider_call === false
    && report?.telemetry_sink_write === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.production_deployment === false
    && report?.release_gate_rerun === false
    && report?.redteam_rerun === false
    && report?.containment_rerun === false
    && report?.v36_modified === false
    && report?.dist_modified === false
    && report?.additional_v36_baseline_refresh === false,
  report || {});

const failures = checks.filter((check) => check.status !== "pass");
const audit = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks,
  failures,
  can_claim_post_rc_openai_only_production_ready: failures.length === 0,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  can_claim_provider_diverse: false
};

writeJson(p("evals", "reports", "post_rc_openai_only_production_ready_claim_audit_report.json"), audit);
writeText(p("evals", "reports", "post_rc_openai_only_production_ready_claim_audit_report.md"), `# OpenAI-Only Production-Ready Claim Audit

Status: ${audit.status}

- Can claim production-ready: ${audit.can_claim_production_ready}
- Can claim post-rc-openai-only-production-ready: ${audit.can_claim_post_rc_openai_only_production_ready}
- Can enter stable release: ${audit.can_enter_stable_release}
- Can claim provider-diverse: ${audit.can_claim_provider_diverse}
`);

console.log(JSON.stringify(audit, null, 2));
process.exit(audit.status === "pass" ? 0 : 1);

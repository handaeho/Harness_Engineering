#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-openai-only-stable-scope-decision";
const EVIDENCE_DIR = "evidence/post-rc-openai-only-stable-scope-decision";
const CANONICAL_STABLE_CLAIM = "post-rc-openai-only-stable";

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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function markdown(audit) {
  return `# OpenAI-Only Stable Claim Audit

Status: ${audit.status}

- Stage: ${audit.stage}
- Can claim ${CANONICAL_STABLE_CLAIM}: ${audit.can_claim_post_rc_openai_only_stable}
- Can claim bare stable: ${audit.can_claim_stable}
- Can claim bare release-gated: ${audit.can_claim_release_gated}
- Failure count: ${audit.failures.length}
`;
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/stable_scope_decision_report.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/stable_claim_boundary.json`);
const decision = readJsonIfExists(`${EVIDENCE_DIR}/stable_decision_record.json`);
const owner = readJsonIfExists(`${EVIDENCE_DIR}/owner_scope_decision_record.json`);
const completeness = readJsonIfExists(`${EVIDENCE_DIR}/stable_evidence_completeness.json`);
const outOfScope = readJsonIfExists(`${EVIDENCE_DIR}/stable_out_of_scope_boundaries.json`);
const gate = readJsonIfExists(`${EVIDENCE_DIR}/stable_gate_report.json`);
const checks = [];

addCheck(checks, "stage and decision report pass",
  report?.stage === STAGE
    && report?.status === "pass"
    && report?.stable_scope === "openai_only_post_rc"
    && report?.owner_selected_openai_only_scope === true,
  report || {});

addCheck(checks, "owner decision records the selected scoped stable path and exclusions",
  owner?.status === "pass"
    && owner?.selected_option === "evaluate_openai_only_stable_scope"
    && owner?.stable_scope === "openai_only_post_rc"
    && owner?.local_endpoint_out_of_scope === true
    && owner?.provider_diversity_out_of_scope === true
    && owner?.local_model_verification_out_of_scope === true
    && owner?.provider_verification_out_of_scope === true
    && owner?.adapter_checking_out_of_scope === true
    && owner?.bare_release_gated_out_of_scope === true,
  owner || {});

addCheck(checks, "evidence completeness passed",
  completeness?.status === "pass"
    && Array.isArray(completeness?.missing_evidence)
    && completeness.missing_evidence.length === 0,
  completeness || {});

addCheck(checks, "canonical scoped stable claim is allowed and bare stable remains blocked",
  report?.post_rc_openai_only_stable === true
    && report?.post_rc_openai_only_stable_allowed === true
    && report?.stable_allowed === false
    && report?.bare_stable_allowed === false
    && boundary?.post_rc_openai_only_stable_allowed === true
    && boundary?.stable_allowed === false
    && boundary?.bare_stable_allowed === false
    && Array.isArray(boundary?.allowed_claims)
    && boundary.allowed_claims.includes(CANONICAL_STABLE_CLAIM),
  { report, boundary });

addCheck(checks, "production-ready remains scoped and bare production-ready remains blocked",
  report?.post_rc_openai_only_production_ready === true
    && report?.production_ready_allowed === false
    && report?.bare_production_ready_allowed === false
    && boundary?.post_rc_openai_only_production_ready_allowed === true
    && boundary?.production_ready_allowed === false
    && boundary?.bare_production_ready_allowed === false,
  { report, boundary });

addCheck(checks, "provider local adapter and bare release-gated claims remain blocked",
  report?.provider_diverse_allowed === false
    && report?.provider_verified_allowed === false
    && report?.adapter_checked_allowed === false
    && report?.local_model_verified_allowed === false
    && report?.bare_release_gated_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.provider_verified_allowed === false
    && boundary?.adapter_checked_allowed === false
    && boundary?.local_model_verified_allowed === false
    && boundary?.bare_release_gated_allowed === false,
  { report, boundary });

addCheck(checks, "out-of-scope boundaries match the owner decision",
  outOfScope?.local_endpoint_out_of_scope === true
    && outOfScope?.provider_diversity_out_of_scope === true
    && outOfScope?.local_model_verification_out_of_scope === true
    && outOfScope?.provider_verification_out_of_scope === true
    && outOfScope?.adapter_checking_out_of_scope === true
    && outOfScope?.bare_release_gated_out_of_scope === true
    && outOfScope?.local_endpoint_probe === false
    && outOfScope?.local_model_execution === false
    && outOfScope?.provider_verification_execution === false
    && outOfScope?.adapter_check_execution === false,
  outOfScope || {});

addCheck(checks, "decision record approves only the canonical scoped claim",
  decision?.status === "recorded"
    && decision?.decision === "approve_post_rc_openai_only_stable_claim"
    && decision?.post_rc_openai_only_stable === true
    && decision?.bare_stable_allowed === false
    && decision?.bare_release_gated_allowed === false
    && decision?.is_provider_diverse === false
    && decision?.is_provider_verified === false
    && decision?.is_adapter_checked === false
    && decision?.is_local_model_verified === false,
  decision || {});

addCheck(checks, "stage gate allows only canonical scoped stable and blocks stronger claims",
  gate?.status === "pass"
    && gate?.can_claim_post_rc_openai_only_stable === true
    && gate?.can_claim_stable === false
    && gate?.can_claim_release_gated === false
    && gate?.can_claim_provider_diverse === false
    && gate?.can_claim_provider_verified === false
    && gate?.can_claim_adapter_checked === false
    && gate?.can_claim_local_model_verified === false,
  gate || {});

addCheck(checks, "no forbidden execution occurred",
  report?.openai_model_api_call === false
    && report?.openai_provider_call === false
    && report?.telemetry_sink_write === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.provider_verification_execution === false
    && report?.adapter_check_execution === false
    && report?.production_deployment === false
    && report?.release_gate_rerun === false
    && report?.redteam_rerun === false
    && report?.containment_rerun === false
    && report?.reference_baseline_source_modified === false
    && report?.dist_modified === false
    && report?.additional_reference_baseline_refresh === false,
  report || {});

const failures = checks.filter((check) => check.status !== "pass");
const audit = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks,
  failures,
  can_claim_post_rc_openai_only_stable: failures.length === 0,
  can_claim_stable: false,
  can_claim_release_gated: false,
  can_claim_provider_diverse: false,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_claim_local_model_verified: false
};

writeJson(p("evals", "reports", "post_rc_openai_only_stable_claim_audit_report.json"), audit);
writeText(p("evals", "reports", "post_rc_openai_only_stable_claim_audit_report.md"), markdown(audit));

console.log(JSON.stringify(audit, null, 2));
process.exit(audit.status === "pass" ? 0 : 1);

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-general-release-gate";
const EVIDENCE_DIR = "release-grade-general-release-gate";
const REQUIRED = [
  "release_grade_general_release_gate_report.json",
  "general_release_claim_boundary.json",
  "unresolved_items.json"
];
const GENERAL_RELEASE_CLAIMS = [
  "production-ready",
  "stable",
  "release-gated"
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

function readJsonIfExists(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
for (const file of REQUIRED) {
  addCheck(checks, `${file} exists`, fs.existsSync(e(file)), {});
}

const report = readJsonIfExists(e("release_grade_general_release_gate_report.json"));
const boundary = readJsonIfExists(e("general_release_claim_boundary.json"));
const unresolved = readJsonIfExists(e("unresolved_items.json"));
const reportStatus = report?.status || "missing";
const statusIsKnown = ["pass", "hold"].includes(reportStatus);
const allowedClaims = Array.isArray(boundary?.allowed_claims) ? boundary.allowed_claims : [];
const blockedClaims = Array.isArray(boundary?.blocked_claims) ? boundary.blocked_claims : [];

addCheck(checks, "stage matches", report?.stage === STAGE && boundary?.stage === STAGE, {
  report_stage: report?.stage || null,
  boundary_stage: boundary?.stage || null
});
addCheck(checks, "status is pass or hold", statusIsKnown, {
  status: reportStatus
});
addCheck(checks, "provider/adapter prerequisite flags coherent", report?.provider_verified_allowed === true
  && boundary?.provider_verified_allowed === report?.provider_verified_allowed
  && boundary?.adapter_checked_allowed === report?.adapter_checked_allowed, {
  provider_verified_allowed: report?.provider_verified_allowed ?? null,
  adapter_checked_allowed: report?.adapter_checked_allowed ?? null
});

if (reportStatus === "pass") {
  addCheck(checks, "general claims opened only on pass", GENERAL_RELEASE_CLAIMS.every((claim) => allowedClaims.includes(claim))
    && report?.production_ready_allowed === true
    && report?.stable_allowed === true
    && report?.release_gated_allowed === true
    && report?.approval_event?.approval_present === true
    && unresolved?.unresolved_items_count === 0, {
    allowed_claims: allowedClaims,
    approval_event: report?.approval_event || null,
    unresolved_items_count: unresolved?.unresolved_items_count ?? null
  });
} else {
  addCheck(checks, "general claims remain blocked on hold", GENERAL_RELEASE_CLAIMS.every((claim) => !allowedClaims.includes(claim))
    && GENERAL_RELEASE_CLAIMS.every((claim) => blockedClaims.includes(claim))
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.release_gated_allowed === false
    && (unresolved?.unresolved_items_count || 0) > 0, {
    allowed_claims: allowedClaims,
    blocked_claims: blockedClaims,
    unresolved_items_count: unresolved?.unresolved_items_count ?? null
  });
}

addCheck(checks, "approval text not stored", report?.approval_event?.approval_text_stored === false, {
  approval_event: report?.approval_event || null
});
addCheck(checks, "no live execution by gate", report?.live_execution?.new_openai_provider_call === false
  && report?.live_execution?.new_gemini_provider_call === false
  && report?.live_execution?.new_local_model_execution_by_this_gate === false
  && report?.live_execution?.telemetry_sink_write === false, report?.live_execution || {});

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? reportStatus : "fail",
  stage: STAGE,
  production_ready_allowed: failures.length === 0 && reportStatus === "pass",
  stable_allowed: failures.length === 0 && reportStatus === "pass",
  release_gated_allowed: failures.length === 0 && reportStatus === "pass",
  checks,
  failures,
  unresolved_items_count: unresolved?.unresolved_items_count ?? null
};
const md = `# Release-grade General Release Gate Check

Status: ${gate.status}

- Stage: ${STAGE}
- Production-ready allowed: ${gate.production_ready_allowed}
- Stable allowed: ${gate.stable_allowed}
- Release-gated allowed: ${gate.release_gated_allowed}
- Unresolved items: ${gate.unresolved_items_count}
`;

writeJson(p("evals", "reports", "release_grade_general_release_gate_check_report.json"), gate);
writeText(p("evals", "reports", "release_grade_general_release_gate_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "fail" ? 1 : 0);

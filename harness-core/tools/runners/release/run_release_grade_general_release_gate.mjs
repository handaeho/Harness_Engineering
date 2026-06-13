#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-general-release-gate";
const EVIDENCE_DIR = "release-grade-general-release-gate";
const APPROVAL_PHRASE = "I approve opening release-grade general production-ready, stable, and release-gated claims.";
const SOURCE_LEDGER = "evidence/release-grade-source-ledger/release_grade_source_ledger_report.json";
const PROVIDER_GATE = "evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json";
const ADAPTER_FINAL_GATE = "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json";
const ADAPTER_FINAL_CHECK = "evals/reports/release_grade_adapter_checked_final_gate_check_report.json";
const FINAL_PRECOMMIT = "evidence/harness-core-final-precommit-convergence/final_precommit_convergence_report.json";
const CURRENT_STATE = "CURRENT_STATE.json";
const BASE_RELEASE_PREREQUISITE_CLAIMS = [
  "provider-diverse",
  "local-model-verified",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "provider-verified",
  "adapter-checked"
];
const GENERAL_RELEASE_CLAIMS = [
  "production-ready",
  "stable",
  "release-gated"
];
const HELD_GENERAL_CLAIMS = [
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

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function source(relPath) {
  const json = readJsonIfExists(relPath);
  return {
    path: relPath,
    exists: Boolean(json),
    status: json?.status || null,
    stage: json?.stage || null
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function approvalInput() {
  const directArg = args.find((arg) => arg.startsWith("--approval="));
  if (directArg) return directArg.slice("--approval=".length);
  return process.env.RELEASE_GRADE_GENERAL_RELEASE_APPROVAL || "";
}

const currentState = readJsonIfExists(CURRENT_STATE);
const sourceLedger = readJsonIfExists(SOURCE_LEDGER);
const providerGate = readJsonIfExists(PROVIDER_GATE);
const adapterFinal = readJsonIfExists(ADAPTER_FINAL_GATE);
const adapterFinalCheck = readJsonIfExists(ADAPTER_FINAL_CHECK);
const finalPrecommit = readJsonIfExists(FINAL_PRECOMMIT);
const allowedClaims = new Set(Array.isArray(currentState?.allowed_claims) ? currentState.allowed_claims : []);
const blockedClaims = new Set(Array.isArray(currentState?.blocked_claims) ? currentState.blocked_claims : []);
const approval = approvalInput();
const approvalPresent = approval === APPROVAL_PHRASE;
const checks = [];

addCheck(checks, "source ledger pass", sourceLedger?.status === "pass", {
  status: sourceLedger?.status || null
});
addCheck(checks, "provider gate pass", providerGate?.status === "pass"
  && providerGate?.provider_verified_allowed === true, {
  status: providerGate?.status || null,
  provider_verified_allowed: providerGate?.provider_verified_allowed || false
});
addCheck(checks, "adapter final gate pass", adapterFinal?.status === "pass"
  && adapterFinal?.adapter_checked_allowed === true
  && adapterFinalCheck?.status === "pass"
  && adapterFinalCheck?.adapter_checked_allowed === true, {
  adapter_final_status: adapterFinal?.status || null,
  adapter_checked_allowed: adapterFinal?.adapter_checked_allowed || false,
  adapter_final_check_status: adapterFinalCheck?.status || null
});
addCheck(checks, "current state prerequisite claims are open", BASE_RELEASE_PREREQUISITE_CLAIMS.every((claim) => allowedClaims.has(claim))
  && !blockedClaims.has("provider-verified")
  && !blockedClaims.has("adapter-checked"), {
  missing_allowed_claims: BASE_RELEASE_PREREQUISITE_CLAIMS.filter((claim) => !allowedClaims.has(claim)),
  provider_verified_blocked: blockedClaims.has("provider-verified"),
  adapter_checked_blocked: blockedClaims.has("adapter-checked")
});
addCheck(checks, "general claims not already open before this gate", GENERAL_RELEASE_CLAIMS.every((claim) => !allowedClaims.has(claim))
  && HELD_GENERAL_CLAIMS.every((claim) => blockedClaims.has(claim)), {
  currently_allowed_general_claims: GENERAL_RELEASE_CLAIMS.filter((claim) => allowedClaims.has(claim)),
  currently_blocked_general_claims: HELD_GENERAL_CLAIMS.filter((claim) => blockedClaims.has(claim))
});
addCheck(checks, "final precommit convergence pass", finalPrecommit?.status === "pass"
  && finalPrecommit?.commit_ready === true
  && finalPrecommit?.provider_verified_allowed === true
  && finalPrecommit?.adapter_checked_allowed === (adapterFinal?.adapter_checked_allowed === true), {
  status: finalPrecommit?.status || null,
  commit_ready: finalPrecommit?.commit_ready || false,
  provider_verified_allowed: finalPrecommit?.provider_verified_allowed || false,
  adapter_checked_allowed: finalPrecommit?.adapter_checked_allowed || false,
  expected_adapter_checked_allowed: adapterFinal?.adapter_checked_allowed === true
});
addCheck(checks, "explicit general release approval present", approvalPresent, {
  approval_present: approvalPresent,
  approval_sha256: approval ? sha256(approval) : null
});

const failures = checks.filter((check) => check.status !== "pass");
const pass = failures.length === 0;
const inheritedAllowedClaims = Array.isArray(adapterFinal?.allowed_claims)
  ? adapterFinal.allowed_claims
  : Array.isArray(providerGate?.allowed_claims)
    ? providerGate.allowed_claims
    : Array.from(allowedClaims);
const reportAllowedClaims = pass
  ? [...new Set([...inheritedAllowedClaims, ...GENERAL_RELEASE_CLAIMS])]
  : inheritedAllowedClaims.filter((claim) => !GENERAL_RELEASE_CLAIMS.includes(claim));
const reportBlockedClaims = pass
  ? ["bare release-gated"]
  : adapterFinal?.adapter_checked_allowed === true
    ? HELD_GENERAL_CLAIMS
    : ["adapter-checked", ...HELD_GENERAL_CLAIMS];
const blockers = failures.map((failure) => ({
  id: failure.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase(),
  lane: "general_release",
  status: "hold",
  reason: "Release-grade general release gate prerequisite did not pass.",
  next_action: failure.name === "explicit general release approval present"
    ? `Set RELEASE_GRADE_GENERAL_RELEASE_APPROVAL to the exact approval phrase after evidence review: ${APPROVAL_PHRASE}`
    : "Complete the missing provider, adapter, current-state, or precommit evidence before rerunning this gate.",
  detail: failure.detail
}));
const report = {
  status: pass ? "pass" : "hold",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  claim_update_rule: "Production-ready, stable, and release-gated may open only when provider-verified and adapter-checked are both open, final precommit has passed, and explicit approval is present. Bare release-gated remains a separate blocked claim.",
  production_ready_allowed: pass,
  stable_allowed: pass,
  release_gated_allowed: pass,
  bare_release_gated_allowed: false,
  provider_verified_allowed: providerGate?.provider_verified_allowed === true,
  adapter_checked_allowed: adapterFinal?.adapter_checked_allowed === true,
  evidence_inputs: {
    source_ledger: source(SOURCE_LEDGER),
    provider_gate: source(PROVIDER_GATE),
    adapter_final_gate: source(ADAPTER_FINAL_GATE),
    adapter_final_gate_check: source(ADAPTER_FINAL_CHECK),
    final_precommit: source(FINAL_PRECOMMIT),
    current_state: source(CURRENT_STATE)
  },
  approval_event: {
    required: true,
    approval_present: approvalPresent,
    approval_phrase_sha256: sha256(APPROVAL_PHRASE),
    supplied_approval_sha256: approval ? sha256(approval) : null,
    approval_text_stored: false
  },
  live_execution: {
    new_openai_provider_call: false,
    new_gemini_provider_call: false,
    new_local_model_execution_by_this_gate: false,
    telemetry_sink_write: false,
    release_approval_side_effect: false
  },
  checks,
  blockers,
  unresolved_items_count: blockers.length,
  allowed_claims: reportAllowedClaims,
  blocked_claims: reportBlockedClaims
};
const boundary = {
  status: report.status,
  stage: STAGE,
  provider_verified_allowed: report.provider_verified_allowed,
  adapter_checked_allowed: report.adapter_checked_allowed,
  production_ready_allowed: report.production_ready_allowed,
  stable_allowed: report.stable_allowed,
  release_gated_allowed: report.release_gated_allowed,
  bare_release_gated_allowed: report.bare_release_gated_allowed,
  allowed_claims: reportAllowedClaims,
  blocked_claims: reportBlockedClaims,
  claim_update_rule: report.claim_update_rule
};
const md = `# Release-grade General Release Gate

Status: ${report.status}

- Provider-verified allowed: ${report.provider_verified_allowed}
- Adapter-checked allowed: ${report.adapter_checked_allowed}
- Production-ready allowed: ${report.production_ready_allowed}
- Stable allowed: ${report.stable_allowed}
- Release-gated allowed: ${report.release_gated_allowed}
- Approval present: ${approvalPresent}
- Blockers: ${blockers.length}
`;

writeJson(p("evidence", EVIDENCE_DIR, "release_grade_general_release_gate_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "release_grade_general_release_gate_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "general_release_claim_boundary.json"), boundary);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), {
  status: pass ? "pass" : "hold",
  stage: STAGE,
  unresolved_items_count: blockers.length,
  unresolved_items: blockers
});
writeJson(p("evals", "reports", "release_grade_general_release_gate_report.json"), report);
writeText(p("evals", "reports", "release_grade_general_release_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" || report.status === "hold" ? 0 : 1);

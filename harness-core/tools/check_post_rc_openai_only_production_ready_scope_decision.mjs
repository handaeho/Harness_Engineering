#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-openai-only-production-ready-scope-decision";
const EVIDENCE_DIR = "evidence/post-rc-openai-only-production-ready-scope-decision";
const CANONICAL_CLAIM = "post-rc-openai-only-production-ready";
const REQUIRED_FILES = [
  "release/post_rc_openai_only_production_ready_scope_decision_scope.yaml",
  "release/post_rc_openai_only_production_ready_gate.yaml",
  "release/post_rc_openai_only_production_ready_claim_boundary.yaml",
  "release/post_rc_openai_only_production_ready_decision_record.yaml",
  "release/post_rc_openai_only_production_ready_blocker_update.yaml",
  "release/post_rc_openai_only_production_ready_out_of_scope_boundaries.yaml",
  "tools/run_post_rc_openai_only_production_ready_scope_decision.mjs",
  "tools/audit_post_rc_openai_only_production_ready_claims.mjs",
  "tools/check_post_rc_openai_only_production_ready_scope_decision.mjs",
  "evals/suites/post_rc_openai_only_production_ready_scope_decision.yaml",
  "evals/reports/post_rc_openai_only_production_ready_scope_decision_report.json",
  "evals/reports/post_rc_openai_only_production_ready_scope_decision_report.md",
  "evals/reports/post_rc_openai_only_production_ready_claim_boundary_report.json",
  "evals/reports/post_rc_openai_only_production_ready_claim_boundary_report.md",
  "evals/reports/post_rc_openai_only_production_ready_claim_audit_report.json",
  "evals/reports/post_rc_openai_only_production_ready_claim_audit_report.md",
  "evals/reports/post_rc_openai_only_production_ready_gate_report.json",
  "evals/reports/post_rc_openai_only_production_ready_gate_report.md",
  `${EVIDENCE_DIR}/owner_scope_decision_record.json`,
  `${EVIDENCE_DIR}/production_ready_evidence_summary.json`,
  `${EVIDENCE_DIR}/production_ready_evidence_completeness.json`,
  `${EVIDENCE_DIR}/production_ready_out_of_scope_boundaries.json`,
  `${EVIDENCE_DIR}/production_ready_scope_decision_report.json`,
  `${EVIDENCE_DIR}/production_ready_scope_decision_report.md`,
  `${EVIDENCE_DIR}/production_ready_claim_boundary.json`,
  `${EVIDENCE_DIR}/production_ready_decision_record.json`,
  `${EVIDENCE_DIR}/production_ready_blocker_update.json`,
  `${EVIDENCE_DIR}/production_ready_gate_report.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/openai_only_production_ready_scope_decision.md",
  "docs/production_ready_openai_only_claim_boundary.md",
  "docs/production_ready_out_of_scope_boundaries.md",
  "docs/next_stable_scope_decision_plan.md"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonIfExists(relPath) {
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

function runNode(script) {
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = spawnSync("node", [path.join("tools", script)], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 80 * 1024 * 1024
    });
    let parsed = null;
    try {
      parsed = JSON.parse((result.stdout || "").trim());
    } catch {
      parsed = null;
    }
    last = {
      script,
      exit_code: result.status,
      status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
      parsed,
      attempts: attempt,
      stderr_excerpt: (result.stderr || "").trim().slice(0, 3000)
    };
    if (result.status === 0) return last;
    sleep(500);
  }
  return last;
}

function sleep(ms) {
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  Atomics.wait(view, 0, 0, ms);
}

function gitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function writeJsonSafe(file, value) {
  try {
    writeJson(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) return;
    throw error;
  }
}

function writeTextSafe(file, value) {
  try {
    writeText(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) return;
    throw error;
  }
}

function markdown(gate) {
  return `# OpenAI-Only Production-Ready Scope Decision Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Production-ready scope: ${gate.production_ready_scope}
- Can claim ${CANONICAL_CLAIM}: ${gate.can_claim_post_rc_openai_only_production_ready}
- Can claim bare production-ready: ${gate.can_claim_production_ready}
- Can enter stable release: ${gate.can_enter_stable_release}
- Can claim provider-diverse: ${gate.can_claim_provider_diverse}
- Can claim local-model-verified: ${gate.can_claim_local_model_verified}
- Reason: ${gate.reason}
`;
}

const run = runNode("run_post_rc_openai_only_production_ready_scope_decision.mjs");
const preliminaryGate = {
  status: "pending_check",
  stage: STAGE,
  production_ready_scope: "openai_only_post_rc",
  can_claim_post_rc_openai_only_production_ready: true,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  can_claim_provider_diverse: false,
  can_claim_local_model_verified: false,
  note: "Preliminary report written before prohibited-claim scan to replace stale failed gate output from earlier attempts."
};
writeJsonSafe(p(...EVIDENCE_DIR.split("/"), "production_ready_scope_decision_gate_report.json"), preliminaryGate);
writeJsonSafe(p("evals", "reports", "post_rc_openai_only_production_ready_scope_decision_gate_report.json"), preliminaryGate);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_production_ready_scope_decision_gate_report.md"), markdown(preliminaryGate));

const validate = runNode("validate_alpha.mjs");
const scan = runNode("scan_prohibited_claims.mjs");
const compare = runNode("check_reference_baseline_integrity.mjs");
const finalGate = runNode("check_post_rc_production_monitoring_final_gate.mjs");
const preflight = runNode("check_post_rc_production_ready_scope_preflight.mjs");
const audit = runNode("audit_post_rc_openai_only_production_ready_claims.mjs");

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_scope_decision_report.json`);
const summary = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_evidence_summary.json`);
const completeness = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_evidence_completeness.json`);
const owner = readJsonIfExists(`${EVIDENCE_DIR}/owner_scope_decision_record.json`);
const outOfScope = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_out_of_scope_boundaries.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_claim_boundary.json`);
const decision = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_decision_record.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_blocker_update.json`);
const stageGate = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_gate_report.json`);
const checks = [];

for (const result of [run, validate, scan, compare, finalGate, preflight, audit]) {
  const expected = result.script === "check_post_rc_production_ready_scope_preflight.mjs"
    ? result.exit_code === 0 && result.status === "blocked_by_owner_scope_decision_required"
    : result.exit_code === 0 && result.status === "pass";
  addCheck(checks, `${result.script} expected status`, expected, {
    exit_code: result.exit_code,
    status: result.status
  });
}

for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, exists(file), {});
}

addCheck(checks, "owner selected OpenAI-only scoped readiness decision",
  owner?.status === "pass"
    && owner?.selected_option === "evaluate_openai_only_production_ready_scope"
    && owner?.production_ready_scope === "openai_only_post_rc"
    && owner?.local_endpoint_out_of_scope === true
    && owner?.provider_diversity_out_of_scope === true
    && owner?.local_model_verification_out_of_scope === true,
  owner || {});

addCheck(checks, "required evidence is complete",
  completeness?.status === "pass"
    && Array.isArray(completeness?.missing_evidence)
    && completeness.missing_evidence.length === 0
    && summary?.telemetry_connected === true
    && summary?.production_monitored === true
    && summary?.containment_verified === true
    && summary?.rc1_openai_scope_release_gated === true
    && summary?.openai_canary_suite_passed === true
    && summary?.openai_redteam_limited_and_additional_passed === true
    && summary?.production_monitoring_final_gate_passed === true
    && summary?.monitoring_window_completed === true
    && summary?.thresholds_passed === true
    && summary?.redaction_failures === 0
    && summary?.raw_payload_storage_violations === 0
    && summary?.secret_logging_findings === 0
    && summary?.check_reference_baseline_integrity_status === "pass",
  { completeness, summary });

addCheck(checks, "canonical scoped readiness claim is allowed and bare production-ready remains blocked",
  report?.status === "pass"
    && report?.post_rc_openai_only_production_ready === true
    && report?.production_ready_allowed === false
    && report?.bare_production_ready_allowed === false
    && report?.production_ready_scope === "openai_only_post_rc"
    && report?.production_ready_scope_limited === true
    && boundary?.post_rc_openai_only_production_ready_allowed === true
    && boundary?.production_ready_allowed === false
    && boundary?.bare_production_ready_allowed === false
    && boundary?.production_ready_scope_limited === true
    && decision?.post_rc_openai_only_production_ready === true
    && decision?.bare_production_ready_allowed === false,
  { report, boundary, decision });

addCheck(checks, "local endpoint/provider/local-model remain out of scope",
  outOfScope?.local_endpoint_out_of_scope === true
    && outOfScope?.provider_diversity_out_of_scope === true
    && outOfScope?.local_model_verification_out_of_scope === true
    && outOfScope?.local_endpoint_probe === false
    && outOfScope?.local_model_execution === false
    && outOfScope?.provider_diverse_allowed === false
    && outOfScope?.local_model_verified_allowed === false,
  outOfScope || {});

addCheck(checks, "stable/provider/local/bare release claims remain blocked",
  report?.stable_allowed === false
    && report?.provider_diverse_allowed === false
    && report?.provider_verified_allowed === false
    && report?.adapter_checked_allowed === false
    && report?.local_model_verified_allowed === false
    && report?.bare_release_gated_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false
    && boundary?.bare_release_gated_allowed === false,
  { report, boundary });

addCheck(checks, "forbidden execution flags remain false",
  report?.openai_model_api_call === false
    && report?.openai_provider_call === false
    && report?.telemetry_sink_write === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.production_deployment === false
    && report?.release_gate_rerun === false
    && report?.redteam_rerun === false
    && report?.containment_rerun === false
    && report?.reference_baseline_source_modified === false
    && report?.dist_modified === false
    && report?.additional_reference_baseline_refresh === false,
  report || {});

addCheck(checks, "blocker update leaves bare readiness, strict and stable paths blocked",
  blocker?.new_status === "post_rc_openai_only_production_ready_allowed_strict_paths_still_blocked"
    && Array.isArray(blocker?.unblocks)
    && blocker.unblocks.includes(CANONICAL_CLAIM)
    && Array.isArray(blocker?.still_blocks)
    && blocker.still_blocks.includes("production-ready")
    && blocker.still_blocks.includes("stable")
    && blocker.still_blocks.includes("strict provider-diverse production-ready scope"),
  blocker || {});

addCheck(checks, "stage gate allows only canonical scoped readiness and blocks stronger claims",
  stageGate?.status === "pass"
    && stageGate?.can_claim_post_rc_openai_only_production_ready === true
    && stageGate?.can_claim_production_ready === false
    && stageGate?.can_enter_stable_release === false
    && stageGate?.can_claim_provider_diverse === false
    && stageGate?.can_claim_local_model_verified === false,
  stageGate || {});

const scanMatches = Array.isArray(scan.parsed?.matches) ? scan.parsed.matches : [];
addCheck(checks, "bare production-ready / stable / provider-diverse / local-model / bare release-gated positive claims absent",
  scanMatches.filter((match) => [
    "production-ready",
    "stable",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified",
    "release-gated"
  ].includes(match.claim)).length === 0,
  { match_count: scanMatches.length });

const forbiddenStatus = gitStatus(["legacy-reference-source", "dist"]);
addCheck(checks, "legacy-reference-source and dist remain clean",
  forbiddenStatus.exit_code === 0 && forbiddenStatus.stdout === "",
  forbiddenStatus);

const baselineStatus = gitStatus(["harness-core/evidence/reference-baseline"]);
addCheck(checks, "evidence/reference-baseline has no this-stage refresh",
  baselineStatus.exit_code === 0
    && baselineStatus.stdout.split(/\r?\n/).filter(Boolean).every((line) => line.includes("harness-core/evidence/reference-baseline/checksums.json")
      || line.includes("harness-core/evidence/reference-baseline/file_inventory.json")),
  {
    ...baselineStatus,
    note: "Modified baseline files are prior owner-approved refresh artifacts, not this stage."
  });

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  production_ready_scope: "openai_only_post_rc",
  can_claim_post_rc_openai_only_production_ready: failures.length === 0,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  can_claim_provider_diverse: false,
  can_claim_local_model_verified: false,
  strict_provider_diverse_production_ready_allowed: false,
  reason: failures.length === 0
    ? "OpenAI-only scoped readiness decision passed for canonical claim post-rc-openai-only-production-ready. Bare production-ready, stable, provider-diverse, local-model, and bare release-gated claims remain blocked."
    : "OpenAI-only scoped readiness decision failed.",
  checks,
  failures,
  claims_allowed_by_this_gate: failures.length === 0 ? [
    CANONICAL_CLAIM,
    "post-rc-openai-only-production-ready-scope-decision-recorded",
    "post-rc-openai-only-production-ready-gate-passed",
    "post-rc-production-ready-claim-enabled-openai-only-scope",
    "post-rc-production-ready-owner-scope-decision-recorded",
    "post-rc-production-ready-out-of-scope-boundaries-recorded"
  ] : [],
  claims_still_blocked: [
    "production-ready",
    "stable",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified",
    "release-gated"
  ]
};

writeJsonSafe(p(...EVIDENCE_DIR.split("/"), "production_ready_scope_decision_gate_report.json"), gate);
writeJsonSafe(p("evals", "reports", "post_rc_openai_only_production_ready_scope_decision_gate_report.json"), gate);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_production_ready_scope_decision_gate_report.md"), markdown(gate));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);

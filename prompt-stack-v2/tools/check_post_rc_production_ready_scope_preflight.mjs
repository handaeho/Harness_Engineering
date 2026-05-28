#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-ready-scope-decision-preflight";
const STATUS = "blocked_by_owner_scope_decision_required";
const EVIDENCE_DIR = "evidence/post-rc-production-ready-scope-preflight";
const REQUIRED_FILES = [
  "release/post_rc_production_ready_scope_preflight_scope.yaml",
  "release/post_rc_production_ready_scope_decision_matrix.yaml",
  "release/post_rc_production_ready_blocker_matrix.yaml",
  "release/post_rc_production_ready_owner_decision_request.yaml",
  "release/post_rc_production_ready_claim_boundary.yaml",
  "tools/assess_post_rc_production_ready_scope_preflight.mjs",
  "tools/audit_post_rc_production_ready_claim_boundary.mjs",
  "tools/check_post_rc_production_ready_scope_preflight.mjs",
  "evals/suites/post_rc_production_ready_scope_preflight.yaml",
  "evals/reports/post_rc_production_ready_scope_preflight_report.json",
  "evals/reports/post_rc_production_ready_scope_preflight_report.md",
  "evals/reports/post_rc_production_ready_claim_boundary_report.json",
  "evals/reports/post_rc_production_ready_claim_boundary_report.md",
  `${EVIDENCE_DIR}/production_ready_scope_preflight_report.json`,
  `${EVIDENCE_DIR}/production_ready_evidence_inventory.json`,
  `${EVIDENCE_DIR}/production_ready_blocker_matrix.json`,
  `${EVIDENCE_DIR}/production_ready_scope_decision_matrix.json`,
  `${EVIDENCE_DIR}/production_ready_owner_decision_request.json`,
  `${EVIDENCE_DIR}/production_ready_claim_boundary.json`,
  `${EVIDENCE_DIR}/local_endpoint_deferral_confirmation.json`,
  `${EVIDENCE_DIR}/v36_baseline_refresh_worktree_status.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/production_ready_scope_preflight.md",
  "docs/production_ready_blocker_matrix.md",
  "docs/production_ready_scope_decision_matrix.md",
  "docs/production_ready_owner_decision_request.md",
  "docs/next_production_ready_scope_decision_plan.md",
  "docs/next_local_canary_after_endpoint_ready.md"
];
const BLOCKED_CLAIMS = [
  "production-ready",
  "stable",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "release-gated"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const workspaceRoot = path.basename(root) === "prompt-stack-v2" ? path.dirname(root) : repoRoot;

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
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse((result.stdout || "").trim());
  } catch {
    parsed = null;
  }
  return {
    script,
    exit_code: result.status,
    status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
    parsed,
    stderr_excerpt: (result.stderr || "").trim().slice(0, 3000)
  };
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

function markdown(gate) {
  return `# Production-Ready Scope Preflight Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Production monitored: ${gate.production_monitored}
- Production-ready allowed: ${gate.production_ready_allowed}
- Owner decision required: ${gate.owner_decision_required}
- Can evaluate OpenAI-only production-ready scope: ${gate.can_evaluate_openai_only_production_ready_scope}
- Can evaluate strict provider-diverse production-ready scope: ${gate.can_evaluate_strict_provider_diverse_production_ready_scope}
- Can enter stable release: ${gate.can_enter_stable_release}
- Reason: ${gate.reason}
`;
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

const assess = runNode("assess_post_rc_production_ready_scope_preflight.mjs");
const validate = runNode("validate_alpha.mjs");
const scan = runNode("scan_prohibited_claims.mjs");
const compare = runNode("compare_v36_baseline.mjs");
const finalGate = runNode("check_post_rc_production_monitoring_final_gate.mjs");
const audit = runNode("audit_post_rc_production_ready_claim_boundary.mjs");

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_scope_preflight_report.json`);
const inventory = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_evidence_inventory.json`);
const blockers = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_blocker_matrix.json`);
const decisionMatrix = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_scope_decision_matrix.json`);
const decisionRequest = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_owner_decision_request.json`);
const localEndpoint = readJsonIfExists(`${EVIDENCE_DIR}/local_endpoint_deferral_confirmation.json`);
const v36Status = readJsonIfExists(`${EVIDENCE_DIR}/v36_baseline_refresh_worktree_status.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_claim_boundary.json`);
const checks = [];

for (const result of [assess, validate, scan, compare, finalGate, audit]) {
  const expectedAssess = result.script === "assess_post_rc_production_ready_scope_preflight.mjs"
    ? result.exit_code === 0 && result.status === STATUS
    : result.exit_code === 0 && result.status === "pass";
  addCheck(checks, `${result.script} expected status`, expectedAssess, {
    exit_code: result.exit_code,
    status: result.status
  });
}

for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, exists(file), {});
}

addCheck(checks, "preflight report is owner-decision blocked",
  report?.status === STATUS
    && report?.production_monitored === true
    && report?.production_ready_allowed === false
    && report?.owner_decision_required === true
    && report?.can_evaluate_openai_only_production_ready_scope === true
    && report?.can_evaluate_strict_provider_diverse_production_ready_scope === false, report || {});
addCheck(checks, "evidence inventory records current allowed and blocked claims",
  inventory?.production_monitored === true
    && inventory?.telemetry_connected === true
    && inventory?.containment_verified === true
    && inventory?.rc1_openai_scope_release_gated === true
    && inventory?.local_endpoint_verified === false
    && inventory?.provider_diverse === false
    && inventory?.production_ready === false
    && inventory?.stable === false, inventory || {});
addCheck(checks, "blocker matrix and decision request require owner scope decision",
  blockers?.status === "blocked"
    && decisionMatrix?.status === "owner_decision_required"
    && decisionRequest?.status === "owner_decision_required", {
  blocker_status: blockers?.status,
  decision_matrix_status: decisionMatrix?.status,
  decision_request_status: decisionRequest?.status
});
addCheck(checks, "local endpoint remains deferred",
  localEndpoint?.status === "confirmed_deferred"
    && localEndpoint?.local_endpoint_probe === false
    && localEndpoint?.local_model_execution === false
    && localEndpoint?.local_no_tool_canary === "deferred", localEndpoint || {});
addCheck(checks, "v36 baseline worktree status is recorded without this-stage refresh",
  v36Status?.status === "recorded"
    && v36Status?.compare_v36_baseline_status === "pass"
    && v36Status?.v36_modified === false
    && v36Status?.dist_modified === false
    && v36Status?.evidence_v36_baseline_modified_in_this_stage === false, v36Status || {});
addCheck(checks, "claim boundary keeps production-ready and stronger claims blocked",
  boundary?.status === "pass"
    && boundary?.production_monitored_allowed === true
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false
    && boundary?.bare_release_gated_allowed === false, boundary || {});
addCheck(checks, "forbidden execution flags remain false",
  report?.openai_model_api_call === false
    && report?.telemetry_sink_write === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.v36_modified === false
    && report?.dist_modified === false
    && report?.additional_v36_baseline_refresh === false, report || {});

const scanMatches = Array.isArray(scan.parsed?.matches) ? scan.parsed.matches : [];
addCheck(checks, "production-ready / stable / provider-diverse / bare release-gated positive claims absent",
  scanMatches.filter((match) => [
    "production-ready",
    "stable",
    "provider-diverse",
    "release-gated"
  ].includes(match.claim)).length === 0, {
  match_count: scanMatches.length
});

const forbiddenStatus = gitStatus(["prompt-stack/v36", "dist"]);
addCheck(checks, "prompt-stack/v36 and dist remain clean",
  forbiddenStatus.exit_code === 0 && forbiddenStatus.stdout === "", forbiddenStatus);

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? STATUS : "fail",
  stage: STAGE,
  production_monitored: report?.production_monitored === true,
  production_ready_allowed: false,
  owner_decision_required: true,
  can_evaluate_openai_only_production_ready_scope: true,
  can_evaluate_strict_provider_diverse_production_ready_scope: false,
  can_enter_stable_release: false,
  can_claim_provider_diverse: false,
  reason: failures.length === 0
    ? "Production-ready requires owner scope decision: OpenAI-only scoped, strict provider-diverse/local-inclusive, or keep blocked."
    : "Production-ready scope preflight failed.",
  checks,
  failures,
  claims_allowed_by_this_gate: failures.length === 0 ? [
    "post-rc-production-ready-scope-preflight-completed",
    "post-rc-production-ready-evidence-inventoried",
    "post-rc-production-ready-blockers-recorded",
    "post-rc-production-ready-owner-decision-requested"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJsonSafe(p(...`${EVIDENCE_DIR}/production_ready_scope_preflight_gate_report.json`.split("/")), gate);
writeJsonSafe(p("evals", "reports", "post_rc_production_ready_scope_preflight_gate_report.json"), gate);
writeTextSafe(p("evals", "reports", "post_rc_production_ready_scope_preflight_gate_report.md"), markdown(gate));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "fail" ? 1 : 0);

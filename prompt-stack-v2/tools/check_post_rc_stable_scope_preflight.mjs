#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-stable-scope-decision-preflight";
const STATUS = "blocked_by_owner_stable_scope_decision_required";
const EVIDENCE_DIR = "evidence/post-rc-stable-scope-preflight";
const REQUIRED_FILES = [
  "release/post_rc_stable_scope_preflight_scope.yaml",
  "release/post_rc_stable_scope_decision_matrix.yaml",
  "release/post_rc_stable_blocker_matrix.yaml",
  "release/post_rc_stable_owner_decision_request.yaml",
  "release/post_rc_stable_claim_boundary.yaml",
  "release/post_rc_production_ready_claim_canonicalization.yaml",
  "tools/assess_post_rc_stable_scope_preflight.mjs",
  "tools/audit_post_rc_stable_claim_boundary.mjs",
  "tools/check_post_rc_stable_scope_preflight.mjs",
  "evals/suites/post_rc_stable_scope_preflight.yaml",
  "evals/reports/post_rc_stable_scope_preflight_report.json",
  "evals/reports/post_rc_stable_scope_preflight_report.md",
  "evals/reports/post_rc_stable_claim_boundary_report.json",
  "evals/reports/post_rc_stable_claim_boundary_report.md",
  "evals/reports/post_rc_stable_scope_preflight_gate_report.json",
  "evals/reports/post_rc_stable_scope_preflight_gate_report.md",
  `${EVIDENCE_DIR}/stable_scope_preflight_report.json`,
  `${EVIDENCE_DIR}/stable_evidence_inventory.json`,
  `${EVIDENCE_DIR}/stable_blocker_matrix.json`,
  `${EVIDENCE_DIR}/stable_scope_decision_matrix.json`,
  `${EVIDENCE_DIR}/stable_owner_decision_request.json`,
  `${EVIDENCE_DIR}/stable_claim_boundary.json`,
  `${EVIDENCE_DIR}/production_ready_claim_canonicalization.json`,
  `${EVIDENCE_DIR}/local_endpoint_deferral_confirmation.json`,
  `${EVIDENCE_DIR}/stable_scope_preflight_gate_report.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/stable_scope_preflight.md",
  "docs/stable_blocker_matrix.md",
  "docs/stable_scope_decision_matrix.md",
  "docs/stable_owner_decision_request.md",
  "docs/production_ready_claim_canonicalization.md",
  "docs/next_openai_only_stable_scope_decision_plan.md",
  "docs/next_local_canary_after_endpoint_ready.md"
];
const BLOCKED_CLAIMS = [
  "stable",
  "production-ready",
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
  return `# Stable Scope Preflight Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- OpenAI-only scoped readiness: ${gate.post_rc_openai_only_production_ready}
- Bare production-ready allowed: ${gate.bare_production_ready_allowed}
- Stable allowed: ${gate.stable_allowed}
- Owner decision required: ${gate.owner_decision_required}
- Can evaluate OpenAI-only stable scope: ${gate.can_evaluate_openai_only_stable_scope}
- Can evaluate strict provider-diverse stable scope: ${gate.can_evaluate_strict_provider_diverse_stable_scope}
- Can enter stable release: ${gate.can_enter_stable_release}
- Reason: ${gate.reason}
`;
}

const preliminaryGate = {
  status: "pending_check",
  stage: STAGE,
  post_rc_openai_only_production_ready: true,
  bare_production_ready_allowed: false,
  stable_allowed: false,
  owner_decision_required: true,
  can_evaluate_openai_only_stable_scope: true,
  can_evaluate_strict_provider_diverse_stable_scope: false,
  can_enter_stable_release: false,
  provider_diverse_allowed: false,
  reason: "Preliminary report written before prohibited-claim scan to replace stale failed gate output from earlier attempts."
};
writeJsonSafe(p(...`${EVIDENCE_DIR}/stable_scope_preflight_gate_report.json`.split("/")), preliminaryGate);
writeJsonSafe(p("evals", "reports", "post_rc_stable_scope_preflight_gate_report.json"), preliminaryGate);
writeTextSafe(p("evals", "reports", "post_rc_stable_scope_preflight_gate_report.md"), markdown(preliminaryGate));

const assess = runNode("assess_post_rc_stable_scope_preflight.mjs");
const validate = runNode("validate_alpha.mjs");
const scan = runNode("scan_prohibited_claims.mjs");
const compare = runNode("compare_v36_baseline.mjs");
const productionReadyGate = runNode("check_post_rc_openai_only_production_ready_scope_decision.mjs");
const audit = runNode("audit_post_rc_stable_claim_boundary.mjs");

const report = readJsonIfExists(`${EVIDENCE_DIR}/stable_scope_preflight_report.json`);
const inventory = readJsonIfExists(`${EVIDENCE_DIR}/stable_evidence_inventory.json`);
const blockers = readJsonIfExists(`${EVIDENCE_DIR}/stable_blocker_matrix.json`);
const decisionMatrix = readJsonIfExists(`${EVIDENCE_DIR}/stable_scope_decision_matrix.json`);
const decisionRequest = readJsonIfExists(`${EVIDENCE_DIR}/stable_owner_decision_request.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/stable_claim_boundary.json`);
const canonicalization = readJsonIfExists(`${EVIDENCE_DIR}/production_ready_claim_canonicalization.json`);
const localEndpoint = readJsonIfExists(`${EVIDENCE_DIR}/local_endpoint_deferral_confirmation.json`);
const checks = [];

for (const result of [assess, validate, scan, compare, productionReadyGate, audit]) {
  const expected = result.script === "assess_post_rc_stable_scope_preflight.mjs"
    ? result.exit_code === 0 && result.status === STATUS
    : result.exit_code === 0 && result.status === "pass";
  addCheck(checks, `${result.script} expected status`, expected, {
    exit_code: result.exit_code,
    status: result.status,
    stderr_excerpt: result.stderr_excerpt
  });
}

for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, exists(file), {});
}

addCheck(checks, "stable preflight is owner-decision blocked",
  report?.status === STATUS
    && report?.post_rc_openai_only_production_ready === true
    && report?.stable_allowed === false
    && report?.owner_decision_required === true
    && report?.can_evaluate_openai_only_stable_scope === true
    && report?.can_evaluate_strict_provider_diverse_stable_scope === false,
  report || {});

addCheck(checks, "scoped readiness canonicalization is recorded",
  canonicalization?.status === "pass"
    && canonicalization?.canonical_allowed_claim === "post-rc-openai-only-production-ready"
    && canonicalization?.bare_production_ready_allowed === false
    && Array.isArray(canonicalization?.blocked_claims)
    && canonicalization.blocked_claims.includes("production-ready"),
  canonicalization || {});

addCheck(checks, "stable evidence inventory records current allowed and blocked surfaces",
  inventory?.post_rc_openai_only_production_ready === true
    && inventory?.production_monitored === true
    && inventory?.telemetry_connected === true
    && inventory?.containment_verified === true
    && inventory?.rc1_openai_scope_release_gated === true
    && inventory?.local_endpoint_verified === false
    && inventory?.provider_diverse === false
    && inventory?.local_model_verified === false
    && inventory?.stable === false,
  inventory || {});

addCheck(checks, "stable blocker matrix and owner request require owner scope decision",
  blockers?.status === "blocked"
    && blockers?.stable_allowed === false
    && decisionMatrix?.status === "owner_decision_required"
    && decisionRequest?.status === "owner_decision_required"
    && decisionMatrix?.options?.openai_only_stable_scope?.allowed_to_consider === true
    && decisionMatrix?.options?.strict_provider_diverse_stable_scope?.allowed_to_consider === false,
  {
    blocker_status: blockers?.status,
    decision_matrix_status: decisionMatrix?.status,
    decision_request_status: decisionRequest?.status
  });

addCheck(checks, "local endpoint remains deferred",
  localEndpoint?.status === "confirmed_deferred"
    && localEndpoint?.local_endpoint_probe === false
    && localEndpoint?.local_model_execution === false
    && localEndpoint?.local_no_tool_canary === "deferred",
  localEndpoint || {});

addCheck(checks, "claim boundary keeps stable and bare production-ready blocked",
  boundary?.status === "pass"
    && boundary?.post_rc_openai_only_production_ready_allowed === true
    && boundary?.stable_allowed === false
    && boundary?.general_production_ready_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false
    && boundary?.bare_release_gated_allowed === false,
  boundary || {});

addCheck(checks, "forbidden execution flags remain false",
  report?.openai_model_api_call === false
    && report?.openai_provider_call === false
    && report?.telemetry_sink_write === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.v36_modified === false
    && report?.dist_modified === false
    && report?.evidence_v36_baseline_modified === false,
  report || {});

const scanMatches = Array.isArray(scan.parsed?.matches) ? scan.parsed.matches : [];
addCheck(checks, "stable / bare production-ready / provider-diverse / bare release-gated positive claims absent",
  scanMatches.filter((match) => [
    "stable",
    "production-ready",
    "provider-diverse",
    "release-gated"
  ].includes(match.claim)).length === 0,
  { match_count: scanMatches.length });

const forbiddenStatus = gitStatus(["prompt-stack/v36", "dist"]);
addCheck(checks, "prompt-stack/v36 and dist remain clean",
  forbiddenStatus.exit_code === 0 && forbiddenStatus.stdout === "",
  forbiddenStatus);

const baselineStatus = gitStatus(["prompt-stack-v2/evidence/v36-baseline"]);
addCheck(checks, "evidence/v36-baseline has no this-stage modification beyond prior owner-approved refresh files",
  baselineStatus.exit_code === 0
    && baselineStatus.stdout.split(/\r?\n/).filter(Boolean).every((line) => line.includes("prompt-stack-v2/evidence/v36-baseline/checksums.json")
      || line.includes("prompt-stack-v2/evidence/v36-baseline/file_inventory.json")),
  {
    ...baselineStatus,
    note: "Modified baseline files are prior owner-approved refresh artifacts, not this stable preflight stage."
  });

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? STATUS : "fail",
  stage: STAGE,
  post_rc_openai_only_production_ready: report?.post_rc_openai_only_production_ready === true,
  bare_production_ready_allowed: false,
  stable_allowed: false,
  owner_decision_required: true,
  can_evaluate_openai_only_stable_scope: true,
  can_evaluate_strict_provider_diverse_stable_scope: false,
  can_enter_stable_release: false,
  provider_diverse_allowed: false,
  reason: failures.length === 0
    ? "Stable requires owner scope decision: OpenAI-only scoped, strict provider-diverse/local-inclusive, or keep blocked."
    : "Stable scope preflight failed.",
  checks,
  failures,
  claims_allowed_by_this_gate: failures.length === 0 ? [
    "post-rc-stable-scope-preflight-completed",
    "post-rc-stable-evidence-inventoried",
    "post-rc-stable-blockers-recorded",
    "post-rc-stable-owner-decision-requested",
    "post-rc-production-ready-claim-canonicalized"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJsonSafe(p(...`${EVIDENCE_DIR}/stable_scope_preflight_gate_report.json`.split("/")), gate);
writeJsonSafe(p("evals", "reports", "post_rc_stable_scope_preflight_gate_report.json"), gate);
writeTextSafe(p("evals", "reports", "post_rc_stable_scope_preflight_gate_report.md"), markdown(gate));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "fail" ? 1 : 0);

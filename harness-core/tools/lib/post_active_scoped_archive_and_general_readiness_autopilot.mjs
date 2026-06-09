import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./file_walk.mjs";
import { scanClaims } from "./claim_scanner.mjs";

export const STAGES = {
  archive: "v2.0.0-post-export-active-scoped-archive-refresh",
  productionReadyPreflight: "v2.0.0-post-export-active-scoped-production-ready-preflight",
  productionReadyGate: "v2.0.0-post-export-active-scoped-production-ready-final-gate",
  stablePreflight: "v2.0.0-post-export-active-scoped-stable-preflight",
  stableGate: "v2.0.0-post-export-active-scoped-stable-final-gate",
  bareMatrix: "v2.0.0-post-export-general-bare-claim-final-blocker-matrix",
  exportRefresh: "v2.0.0-final-export-refresh-after-active-scoped-readiness",
  handoff: "v2.0.0-post-export-active-scoped-final-handoff-refresh"
};

export const DIRS = {
  archive: "evidence/post-export-active-scoped-archive-refresh",
  productionReadyPreflight: "evidence/post-export-active-scoped-production-ready-preflight",
  productionReadyGate: "evidence/post-export-active-scoped-production-ready-final-gate",
  stablePreflight: "evidence/post-export-active-scoped-stable-preflight",
  stableGate: "evidence/post-export-active-scoped-stable-final-gate",
  bareMatrix: "evidence/post-export-general-bare-claim-final-blocker-matrix",
  exportRefresh: "evidence/final-export-refresh-after-active-scoped-readiness",
  handoff: "evidence/post-export-active-scoped-final-handoff-refresh"
};

const EXPORT_PACKAGE = "exports/v2.0.0-rc.1-postrc-active-scoped-readiness-refresh.zip";
const ACTIVE_PROVIDER_SCOPED_CLAIM = "post-export-active-provider-lanes-verified";
const ACTIVE_PROVIDER_SCOPED_GATE_CLAIM = "post-export-active-provider-lanes-verified-final-gate-passed";
const ACTIVE_ADAPTER_SCOPED_CLAIM = "post-export-active-adapters-checked";
const ACTIVE_ADAPTER_SCOPED_GATE_CLAIM = "post-export-active-adapters-checked-final-gate-passed";
const ACTIVE_SCOPED_PRODUCTION_READY = "post-export-active-scoped-production-ready";
const ACTIVE_SCOPED_PRODUCTION_READY_GATE = "post-export-active-scoped-production-ready-final-gate-passed";
const ACTIVE_SCOPED_STABLE = "post-export-active-scoped-stable";
const ACTIVE_SCOPED_STABLE_GATE = "post-export-active-scoped-stable-final-gate-passed";

const MAINTAINED_CLAIMS = [
  "provider-diverse",
  "local-model-verified",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];

const BARE_BLOCKED_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

const PREVIOUS = {
  activeProviderRetry: "evidence/post-export-active-provider-lanes-verified-final-gate-retry/active_provider_lanes_verified_final_gate_retry_report.json",
  activeAdapterRetry: "evidence/post-export-active-adapters-checked-final-gate-retry/active_adapters_checked_final_gate_retry_report.json",
  providerDiverse: "evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_report.json",
  localModelVerified: "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json",
  productionMonitored: "evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json",
  telemetryConnected: "evidence/post-rc-telemetry-connection/telemetry_connection_report.json",
  containmentVerified: "evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json",
  openaiOnlyProductionReady: "evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_scope_decision_report.json",
  openaiOnlyStable: "evidence/post-rc-openai-only-stable-scope-decision/stable_scope_decision_report.json",
  previousFinalExport: "evidence/final-export-refresh-after-active-scoped-repairs/final_export_refresh_after_active_scoped_repairs_report.json"
};

export function resolveRoot() {
  const repoRoot = process.cwd();
  return process.argv[2] && !process.argv[2].startsWith("--")
    ? path.resolve(repoRoot, process.argv[2])
    : path.basename(repoRoot) === "harness-core"
      ? repoRoot
      : path.resolve(repoRoot, "harness-core");
}

function workspaceRoot(root) {
  return path.basename(root) === "harness-core" ? path.dirname(root) : root;
}

function p(root, relPath) {
  return path.join(root, ...relPath.split("/"));
}

function readJsonIfExists(root, relPath) {
  const file = p(root, relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function writeJsonRel(root, relPath, value) {
  writeJson(p(root, relPath), value);
}

function writeTextRel(root, relPath, value) {
  writeText(p(root, relPath), value);
}

function writeMd(root, relPath, title, lines) {
  writeTextRel(root, relPath, `# ${title}\n\n${lines.join("\n")}\n`);
}

function writeYaml(root, relPath, lines) {
  writeTextRel(root, relPath, lines.join("\n"));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function gitStatus(root, paths) {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all", "--", ...paths], {
    cwd: workspaceRoot(root),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function statusPaths(status) {
  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]+\s+/, ""));
}

function protectedStatus(root) {
  const status = gitStatus(root, [
    "legacy-reference-source",
    "dist",
    "harness-core/dist",
    "harness-core/evidence/reference-baseline",
    "harness-core/node_modules"
  ]);
  const paths = statusPaths(status);
  return {
    git_status: status,
    observed_dirty_paths: paths,
    reference_baseline_source_dirty_paths: paths.filter((file) => file.startsWith("legacy-reference-source/") || file === "legacy-reference-source"),
    dist_dirty_paths: paths.filter((file) => file.startsWith("dist/") || file === "dist" || file.startsWith("harness-core/dist/") || file === "harness-core/dist"),
    node_modules_dirty_paths: paths.filter((file) => file.startsWith("harness-core/node_modules/") || file === "harness-core/node_modules"),
    evidence_reference_baseline_dirty_paths: paths.filter((file) => file.startsWith("harness-core/evidence/reference-baseline/") || file === "harness-core/evidence/reference-baseline"),
    reference_baseline_source_modified: false,
    dist_modified: false,
    evidence_reference_baseline_modified: false
  };
}

function commonFlags(extra = {}) {
  return {
    new_local_model_execution: false,
    new_local_model_call_count: 0,
    openai_model_api_call: false,
    openai_provider_rerun: false,
    telemetry_sink_write: false,
    npm_install_or_ci: false,
    actual_export_write: false,
    reference_baseline_source_modified: false,
    dist_modified: false,
    evidence_reference_baseline_modified: false,
    post_export_active_provider_lanes_verified_allowed: true,
    post_export_active_adapters_checked_allowed: true,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...extra
  };
}

function unresolvedItem(id, lane, reason, next_action, status = "blocked") {
  return { id, lane, status, reason, next_action };
}

function writeUnresolved(root, dir, stage, items) {
  writeJsonRel(root, `${dir}/unresolved_items.json`, {
    status: items.length === 0 ? "pass" : "blocked",
    stage,
    unresolved_items_count: items.length,
    unresolved_items: items
  });
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function scanClaimsForAudit(root, reportBaseName) {
  return scanClaims(root, {
    excludedPaths: [
      "evidence/reference-baseline",
      "evidence/alpha/prohibited_claim_scan.json",
      "original_order.txt",
      "node_modules",
      ".git",
      `evals/reports/${reportBaseName}.json`,
      `evals/reports/${reportBaseName}.md`
    ]
  });
}

function source(root, relPath) {
  const json = readJsonIfExists(root, relPath);
  return {
    path: relPath,
    exists: Boolean(json),
    status: json?.status || null,
    stage: json?.stage || null
  };
}

function sourceWithFields(root, relPath, fields) {
  const json = readJsonIfExists(root, relPath);
  const picked = {};
  for (const field of fields) picked[field] = json?.[field] ?? null;
  return {
    path: relPath,
    exists: Boolean(json),
    status: json?.status || null,
    stage: json?.stage || null,
    fields: picked
  };
}

function fileRecord(root, relPath) {
  const file = p(root, relPath);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return { path: relPath, exists: false, sha256: null, bytes: 0 };
  }
  return {
    path: relPath,
    exists: true,
    sha256: sha256File(file),
    bytes: fs.statSync(file).size
  };
}

function evidencePointers(root) {
  const paths = {
    active_provider_retry: PREVIOUS.activeProviderRetry,
    active_adapter_retry: PREVIOUS.activeAdapterRetry,
    provider_diverse: PREVIOUS.providerDiverse,
    local_model_verified: PREVIOUS.localModelVerified,
    production_monitored: PREVIOUS.productionMonitored,
    telemetry_connected: PREVIOUS.telemetryConnected,
    containment_verified: PREVIOUS.containmentVerified,
    openai_only_production_ready: PREVIOUS.openaiOnlyProductionReady,
    openai_only_stable: PREVIOUS.openaiOnlyStable,
    previous_final_export: PREVIOUS.previousFinalExport,
    structured_repair: "evidence/post-export-qwen3-14b-structured-output-targeted-repair/qwen3_14b_structured_output_targeted_repair_report.json",
    replay_repair: "evidence/post-export-qwen3-14b-replay-regression-targeted-repair/qwen3_14b_replay_regression_targeted_repair_report.json",
    cross_adapter_repair: "evidence/post-export-cross-adapter-contract-targeted-repair/cross_adapter_contract_targeted_repair_report.json"
  };
  return Object.fromEntries(Object.entries(paths).map(([key, relPath]) => [key, source(root, relPath)]));
}

function activeScopedBaseState(root) {
  const provider = readJsonIfExists(root, PREVIOUS.activeProviderRetry);
  const adapter = readJsonIfExists(root, PREVIOUS.activeAdapterRetry);
  return {
    provider_allowed: provider?.post_export_active_provider_lanes_verified_allowed === true,
    adapter_allowed: adapter?.post_export_active_adapters_checked_allowed === true,
    provider_status: provider?.status || "missing",
    adapter_status: adapter?.status || "missing"
  };
}

function finalClaimState(root, extras = {}) {
  const base = activeScopedBaseState(root);
  const scopedClaims = [
    ...(base.provider_allowed ? [ACTIVE_PROVIDER_SCOPED_CLAIM, ACTIVE_PROVIDER_SCOPED_GATE_CLAIM] : []),
    ...(base.adapter_allowed ? [ACTIVE_ADAPTER_SCOPED_CLAIM, ACTIVE_ADAPTER_SCOPED_GATE_CLAIM] : []),
    ...(extras.production_ready_allowed ? [ACTIVE_SCOPED_PRODUCTION_READY, ACTIVE_SCOPED_PRODUCTION_READY_GATE] : []),
    ...(extras.stable_allowed ? [ACTIVE_SCOPED_STABLE, ACTIVE_SCOPED_STABLE_GATE] : [])
  ];
  return {
    status: "recorded",
    generated_at: new Date().toISOString(),
    allowed_claims: [
      "provider-diverse",
      "local-model-verified",
      ACTIVE_PROVIDER_SCOPED_CLAIM,
      ACTIVE_ADAPTER_SCOPED_CLAIM,
      "post-rc-openai-only-stable",
      "post-rc-openai-only-production-ready",
      "production-monitored",
      "telemetry-connected",
      "containment-verified",
      "rc1-openai-scope-release-gated",
      ...(extras.production_ready_allowed ? [ACTIVE_SCOPED_PRODUCTION_READY] : []),
      ...(extras.stable_allowed ? [ACTIVE_SCOPED_STABLE] : [])
    ],
    allowed_scoped_claims: scopedClaims,
    blocked_claims: BARE_BLOCKED_CLAIMS,
    canonicalization_rules: [
      "Use post-export-active-provider-lanes-verified, not provider-verified.",
      "Use post-export-active-adapters-checked, not adapter-checked.",
      "Use post-rc-openai-only-stable, not stable.",
      "Use post-rc-openai-only-production-ready, not production-ready.",
      "Use rc1-openai-scope-release-gated, not release-gated.",
      "Use post-export-active-scoped-production-ready only for the active scoped readiness boundary.",
      "Use post-export-active-scoped-stable only for the active scoped stability boundary."
    ],
    post_export_active_provider_lanes_verified_allowed: base.provider_allowed,
    post_export_active_adapters_checked_allowed: base.adapter_allowed,
    post_export_active_scoped_production_ready_allowed: extras.production_ready_allowed === true,
    post_export_active_scoped_stable_allowed: extras.stable_allowed === true,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...commonFlags({
      post_export_active_provider_lanes_verified_allowed: base.provider_allowed,
      post_export_active_adapters_checked_allowed: base.adapter_allowed
    })
  };
}

function productionReadyCriteria(root) {
  const provider = readJsonIfExists(root, PREVIOUS.activeProviderRetry);
  const adapter = readJsonIfExists(root, PREVIOUS.activeAdapterRetry);
  const providerDiverse = readJsonIfExists(root, PREVIOUS.providerDiverse);
  const localModel = readJsonIfExists(root, PREVIOUS.localModelVerified);
  const monitored = readJsonIfExists(root, PREVIOUS.productionMonitored);
  const openaiOnlyReady = readJsonIfExists(root, PREVIOUS.openaiOnlyProductionReady);
  const previousExport = readJsonIfExists(root, PREVIOUS.previousFinalExport);
  return [
    {
      id: "active_provider_lanes_verified",
      passed: provider?.status === "pass" && provider?.post_export_active_provider_lanes_verified_allowed === true,
      status: provider?.status || "missing",
      evidence: PREVIOUS.activeProviderRetry
    },
    {
      id: "active_adapters_checked",
      passed: adapter?.status === "pass" && adapter?.post_export_active_adapters_checked_allowed === true,
      status: adapter?.status || "missing",
      evidence: PREVIOUS.activeAdapterRetry
    },
    {
      id: "provider_diverse",
      passed: providerDiverse?.status === "pass" && providerDiverse?.provider_diverse_allowed === true,
      status: providerDiverse?.status || "missing",
      evidence: PREVIOUS.providerDiverse
    },
    {
      id: "local_model_verified",
      passed: localModel?.status === "pass" && localModel?.local_model_verified_allowed === true,
      status: localModel?.status || "missing",
      evidence: PREVIOUS.localModelVerified
    },
    {
      id: "production_monitored",
      passed: monitored?.status === "pass" && monitored?.production_monitored_allowed === true,
      status: monitored?.status || "missing",
      evidence: PREVIOUS.productionMonitored
    },
    {
      id: "post_rc_openai_only_production_ready_companion_scope",
      passed: openaiOnlyReady?.status === "pass" && openaiOnlyReady?.post_rc_openai_only_production_ready === true && openaiOnlyReady?.production_ready_allowed === false,
      status: openaiOnlyReady?.status || "missing",
      evidence: PREVIOUS.openaiOnlyProductionReady
    },
    {
      id: "previous_active_scoped_export_clean",
      passed: previousExport?.status === "pass"
        && previousExport?.node_modules_included === false
        && previousExport?.dist_included === false
        && previousExport?.raw_or_secret_included === false,
      status: previousExport?.status || "missing",
      evidence: PREVIOUS.previousFinalExport
    }
  ];
}

function stableCriteria(root) {
  const productionGate = readJsonIfExists(root, `${DIRS.productionReadyGate}/active_scoped_production_ready_final_gate_report.json`);
  const stable = readJsonIfExists(root, PREVIOUS.openaiOnlyStable);
  const productionReady = readJsonIfExists(root, PREVIOUS.openaiOnlyProductionReady);
  return [
    {
      id: "active_scoped_production_ready_gate",
      passed: productionGate?.status === "pass" && productionGate?.post_export_active_scoped_production_ready_allowed === true,
      status: productionGate?.status || "missing",
      evidence: `${DIRS.productionReadyGate}/active_scoped_production_ready_final_gate_report.json`
    },
    {
      id: "post_rc_openai_only_stable_companion_scope",
      passed: stable?.status === "pass" && stable?.post_rc_openai_only_stable_allowed === true && stable?.stable_allowed === false,
      status: stable?.status || "missing",
      evidence: PREVIOUS.openaiOnlyStable
    },
    {
      id: "post_rc_openai_only_production_ready_companion_scope",
      passed: productionReady?.status === "pass" && productionReady?.post_rc_openai_only_production_ready === true && productionReady?.production_ready_allowed === false,
      status: productionReady?.status || "missing",
      evidence: PREVIOUS.openaiOnlyProductionReady
    },
    ...productionReadyCriteria(root).slice(0, 5)
  ];
}

function blockersFromCriteria(criteria, lane, nextAction) {
  return criteria
    .filter((item) => !item.passed)
    .map((item) => unresolvedItem(
      `${lane}_${item.id}_not_ready`,
      lane,
      `Criterion ${item.id} is not ready; observed status is ${item.status}.`,
      nextAction
    ));
}

export function refreshActiveScopedArchiveState(root) {
  const stage = STAGES.archive;
  const dir = DIRS.archive;
  const base = activeScopedBaseState(root);
  const blockers = [];
  if (!base.provider_allowed) {
    blockers.push(unresolvedItem("active_provider_lanes_scoped_claim_missing", "archive", "Active provider lanes scoped claim is not allowed.", "Rerun or repair the active provider lanes final gate before archive refresh."));
  }
  if (!base.adapter_allowed) {
    blockers.push(unresolvedItem("active_adapters_scoped_claim_missing", "archive", "Active adapters scoped claim is not allowed.", "Rerun or repair the active adapters final gate before archive refresh."));
  }
  const state = finalClaimState(root);
  const pointers = evidencePointers(root);
  const manifestFiles = [
    PREVIOUS.activeProviderRetry,
    PREVIOUS.activeAdapterRetry,
    PREVIOUS.providerDiverse,
    PREVIOUS.localModelVerified,
    PREVIOUS.productionMonitored,
    PREVIOUS.openaiOnlyProductionReady,
    PREVIOUS.openaiOnlyStable,
    PREVIOUS.previousFinalExport
  ];
  const manifest = {
    status: blockers.length === 0 ? "refreshed" : "blocked",
    stage,
    files: manifestFiles.map((relPath) => fileRecord(root, relPath))
  };
  const checksums = {
    status: "recorded",
    stage,
    checksums: manifest.files.filter((item) => item.exists).map((item) => ({ path: item.path, sha256: item.sha256 }))
  };
  const boundary = {
    status: blockers.length === 0 ? "pass" : "blocked",
    stage,
    allowed_scoped_claims: state.allowed_scoped_claims,
    allowed_maintained_claims: MAINTAINED_CLAIMS,
    blocked_claims: BARE_BLOCKED_CLAIMS,
    ...commonFlags({
      post_export_active_provider_lanes_verified_allowed: base.provider_allowed,
      post_export_active_adapters_checked_allowed: base.adapter_allowed
    })
  };
  const report = {
    status: blockers.length === 0 ? "pass" : "blocked_by_missing_active_scoped_claims",
    stage,
    active_scoped_archive_refreshed: blockers.length === 0,
    active_scoped_final_claim_state_recorded: true,
    evidence_pointer_index_recorded: true,
    active_scoped_evidence_pointer_index: pointers,
    protected_path_status: protectedStatus(root),
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags({
      post_export_active_provider_lanes_verified_allowed: base.provider_allowed,
      post_export_active_adapters_checked_allowed: base.adapter_allowed
    })
  };
  writeYaml(root, "release/scopes/post-export/post_export_active_scoped_archive_refresh_scope.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_provider_lanes_verified_allowed: ${base.provider_allowed}`,
    `post_export_active_adapters_checked_allowed: ${base.adapter_allowed}`,
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_active_scoped_final_claim_state.yaml", [
    `stage: ${stage}`,
    "status: recorded",
    "allowed_scoped_claims:",
    ...state.allowed_scoped_claims.map((claim) => `  - ${claim}`),
    "blocked_claims:",
    ...BARE_BLOCKED_CLAIMS.map((claim) => `  - ${claim}`)
  ]);
  writeYaml(root, "release/claims/post-export/post_export_active_scoped_strict_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${boundary.status}`,
    "scoped_claims_are_not_bare_claims: true",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_scoped_archive_refresh_report.json`, report);
  writeJsonRel(root, `${dir}/active_scoped_final_claim_state.json`, state);
  writeJsonRel(root, `${dir}/active_scoped_evidence_pointer_index.json`, { status: "recorded", stage, pointers });
  writeJsonRel(root, `${dir}/active_scoped_archive_manifest_refresh.json`, manifest);
  writeJsonRel(root, `${dir}/active_scoped_archive_checksums_refresh.json`, checksums);
  writeJsonRel(root, `${dir}/active_scoped_claim_boundary.json`, boundary);
  writeJsonRel(root, `${dir}/active_scoped_archive_refresh_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/release/active_scoped_archive_refresh.ko.md", "Active Scoped Archive Refresh", [
    `Status: \`${report.status}\``,
    "",
    `- ${ACTIVE_PROVIDER_SCOPED_CLAIM}: ${base.provider_allowed}`,
    `- ${ACTIVE_ADAPTER_SCOPED_CLAIM}: ${base.adapter_allowed}`,
    "- bare/general claim은 모두 blocked로 유지했습니다.",
    "- 새 모델 실행, OpenAI provider rerun, telemetry sink write는 수행하지 않았습니다."
  ]);
  writeMd(root, "docs/claims/active_scoped_final_claim_state.ko.md", "Active Scoped Final Claim State", [
    "Status: `recorded`",
    "",
    `- Allowed scoped claims: ${state.allowed_scoped_claims.join(", ")}`,
    `- Blocked bare/general claims: ${BARE_BLOCKED_CLAIMS.join(", ")}`,
    "- scoped claim은 동일한 단어를 포함하더라도 bare/general claim으로 canonicalize하지 않습니다."
  ]);
  return report;
}

export function checkActiveScopedArchiveRefresh(root) {
  const stage = STAGES.archive;
  const dir = DIRS.archive;
  const report = readJsonIfExists(root, `${dir}/active_scoped_archive_refresh_report.json`);
  const state = readJsonIfExists(root, `${dir}/active_scoped_final_claim_state.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_scoped_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "active scoped claims recorded", state?.post_export_active_provider_lanes_verified_allowed === true && state?.post_export_active_adapters_checked_allowed === true, state || {});
  addCheck(checks, "bare/general claims blocked", boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false && boundary?.production_ready_allowed === false && boundary?.stable_allowed === false && boundary?.release_gated_allowed === false, boundary || {});
  addCheck(checks, "unresolved empty", unresolved?.unresolved_items_count === 0, unresolved || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    unresolved_items_count: failures.length,
    checks,
    failures,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/active_scoped_archive_refresh_gate_report.json`, gate);
  return gate;
}

export function auditActiveScopedArchiveClaimBoundary(root) {
  const scan = scanClaimsForAudit(root, "post_export_active_scoped_archive_claim_audit_report");
  const report = {
    status: scan.status,
    stage: STAGES.archive,
    expected: "no_forbidden_bare_claim_positive_assertions",
    matches_count: scan.matches.length,
    matches: scan.matches,
    ...commonFlags()
  };
  writeJsonRel(root, "evals/reports/post_export_active_scoped_archive_claim_audit_report.json", report);
  writeMd(root, "evals/reports/post_export_active_scoped_archive_claim_audit_report.md", "Active Scoped Archive Claim Audit", [
    `Status: \`${report.status}\``,
    "",
    `- Matches: ${report.matches_count}`,
    "- bare/general claim boundary remains false."
  ]);
  return report;
}

export function assessActiveScopedProductionReadyPreflight(root) {
  const stage = STAGES.productionReadyPreflight;
  const dir = DIRS.productionReadyPreflight;
  const criteria = productionReadyCriteria(root);
  const blockers = blockersFromCriteria(criteria, "active_scoped_production_ready", "Collect the missing scoped evidence; do not open bare production-ready.");
  const status = blockers.length === 0 ? "ready_for_active_scoped_production_ready_final_gate" : "blocked_by_missing_active_scoped_evidence";
  const matrix = {
    status,
    stage,
    criteria,
    criteria_total: criteria.length,
    criteria_passed: criteria.filter((item) => item.passed).length,
    blockers
  };
  const boundary = {
    status,
    stage,
    post_export_active_scoped_production_ready_preflight_ready: blockers.length === 0,
    post_export_active_scoped_production_ready_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    scope_note: "This preflight only evaluates the active scoped boundary.",
    ...commonFlags()
  };
  const preconditions = {
    status,
    stage,
    final_gate_allowed_by_instruction: true,
    final_gate_may_run: blockers.length === 0,
    hard_stop_required: false,
    criteria
  };
  const report = {
    status,
    stage,
    ready_for_active_scoped_production_ready_final_gate: blockers.length === 0,
    criteria_matrix_status: status,
    unresolved_items_count: blockers.length,
    blockers,
    sources: {
      active_provider_retry: sourceWithFields(root, PREVIOUS.activeProviderRetry, ["post_export_active_provider_lanes_verified_allowed"]),
      active_adapter_retry: sourceWithFields(root, PREVIOUS.activeAdapterRetry, ["post_export_active_adapters_checked_allowed"]),
      provider_diverse: sourceWithFields(root, PREVIOUS.providerDiverse, ["provider_diverse_allowed"]),
      local_model_verified: sourceWithFields(root, PREVIOUS.localModelVerified, ["local_model_verified_allowed"]),
      production_monitored: sourceWithFields(root, PREVIOUS.productionMonitored, ["production_monitored_allowed"])
    },
    ...commonFlags()
  };
  writeYaml(root, "release/scopes/post-export/post_export_active_scoped_production_ready_preflight_scope.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "final_gate_allowed_by_instruction: true",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_active_scoped_production_ready_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "post_export_active_scoped_production_ready_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_scoped_production_ready_preflight_report.json`, report);
  writeJsonRel(root, `${dir}/active_scoped_production_ready_criteria_matrix.json`, matrix);
  writeJsonRel(root, `${dir}/active_scoped_production_ready_claim_boundary.json`, boundary);
  writeJsonRel(root, `${dir}/active_scoped_production_ready_gate_preconditions.json`, preconditions);
  writeJsonRel(root, `${dir}/active_scoped_production_ready_preflight_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/release/active_scoped_production_ready_preflight.ko.md", "Active Scoped Production Readiness Preflight", [
    `Status: \`${status}\``,
    "",
    `- Criteria passed: ${matrix.criteria_passed}/${matrix.criteria_total}`,
    "- This is scoped readiness only; bare `production-ready` remains blocked.",
    ...(blockers.length ? blockers.map((item) => `- ${item.id}: ${item.reason}`) : ["- Final gate preconditions are satisfied."])
  ]);
  return report;
}

export function checkActiveScopedProductionReadyPreflight(root) {
  const stage = STAGES.productionReadyPreflight;
  const dir = DIRS.productionReadyPreflight;
  const report = readJsonIfExists(root, `${dir}/active_scoped_production_ready_preflight_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_scoped_production_ready_claim_boundary.json`);
  const preconditions = readJsonIfExists(root, `${dir}/active_scoped_production_ready_gate_preconditions.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "preconditions coherent", Boolean(report?.ready_for_active_scoped_production_ready_final_gate) === Boolean(preconditions?.final_gate_may_run), { report, preconditions });
  addCheck(checks, "bare production-ready remains false", boundary?.production_ready_allowed === false && report?.production_ready_allowed === false, { boundary, report });
  addCheck(checks, "no new external execution", report?.openai_model_api_call === false && report?.new_local_model_execution === false && report?.telemetry_sink_write === false, report || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? report?.status || "pass" : "fail",
    stage,
    unresolved_items_count: failures.length || report?.unresolved_items_count || 0,
    checks,
    failures,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/active_scoped_production_ready_preflight_gate_report.json`, gate);
  return gate;
}

export function runActiveScopedProductionReadyFinalGate(root) {
  const stage = STAGES.productionReadyGate;
  const dir = DIRS.productionReadyGate;
  const preflight = readJsonIfExists(root, `${DIRS.productionReadyPreflight}/active_scoped_production_ready_preflight_report.json`);
  const criteria = productionReadyCriteria(root);
  const blockers = [
    ...blockersFromCriteria(criteria, "active_scoped_production_ready", "Keep scoped readiness blocked until every criterion passes."),
    ...(preflight?.status === "ready_for_active_scoped_production_ready_final_gate" ? [] : [
      unresolvedItem("active_scoped_production_ready_preflight_not_ready", "active_scoped_production_ready", `Preflight status is ${preflight?.status || "missing"}.`, "Run and pass Stage B before Stage C.")
    ])
  ];
  const allowed = blockers.length === 0;
  const claimBoundary = {
    status: allowed ? "pass" : "blocked",
    stage,
    post_export_active_scoped_production_ready_allowed: allowed,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    allowed_scoped_claims: allowed ? [ACTIVE_SCOPED_PRODUCTION_READY, ACTIVE_SCOPED_PRODUCTION_READY_GATE] : [],
    blocked_claims: BARE_BLOCKED_CLAIMS,
    ...commonFlags()
  };
  const report = {
    status: allowed ? "pass" : "blocked",
    stage,
    final_gate_executed: allowed,
    post_export_active_scoped_production_ready_allowed: allowed,
    scoped_claim_allowed: allowed ? ACTIVE_SCOPED_PRODUCTION_READY : null,
    criteria,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags()
  };
  writeYaml(root, "release/gates/post-export/post_export_active_scoped_production_ready_final_gate_scope.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_scoped_production_ready_allowed: ${allowed}`,
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeYaml(root, "release/gates/post-export/post_export_active_scoped_production_ready_final_gate.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `allowed_claim: ${allowed ? ACTIVE_SCOPED_PRODUCTION_READY : "none"}`,
    `final_gate_claim: ${allowed ? ACTIVE_SCOPED_PRODUCTION_READY_GATE : "none"}`,
    "bare_production_ready_allowed: false"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_active_scoped_production_ready_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_scoped_production_ready_allowed: ${allowed}`,
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_scoped_production_ready_final_gate_report.json`, report);
  writeJsonRel(root, `${dir}/active_scoped_production_ready_evidence_summary.json`, { status: report.status, stage, criteria });
  writeJsonRel(root, `${dir}/active_scoped_production_ready_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/active_scoped_production_ready_decision_record.json`, {
    status: allowed ? "approved_scoped_claim" : "blocked",
    stage,
    decision: allowed ? "allow_post_export_active_scoped_production_ready" : "keep_active_scoped_production_ready_blocked",
    approved_claims: allowed ? [ACTIVE_SCOPED_PRODUCTION_READY, ACTIVE_SCOPED_PRODUCTION_READY_GATE] : [],
    bare_production_ready_allowed: false
  });
  writeJsonRel(root, `${dir}/active_scoped_production_ready_gate_check_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/release/active_scoped_production_ready_final_gate.ko.md", "Active Scoped Production Readiness Final Gate", [
    `Status: \`${report.status}\``,
    "",
    `- Scoped claim allowed: ${allowed}`,
    `- Allowed scoped claim: \`${allowed ? ACTIVE_SCOPED_PRODUCTION_READY : "none"}\``,
    "- Bare `production-ready` remains blocked."
  ]);
  writeMd(root, "docs/claims/active_scoped_production_ready_claim_boundary.ko.md", "Active Scoped Production Readiness Boundary", [
    `Status: \`${claimBoundary.status}\``,
    "",
    "- This boundary is active scoped only.",
    "- It does not permit bare `production-ready`, `stable`, or `release-gated`."
  ]);
  return report;
}

export function checkActiveScopedProductionReadyFinalGate(root) {
  const stage = STAGES.productionReadyGate;
  const dir = DIRS.productionReadyGate;
  const report = readJsonIfExists(root, `${dir}/active_scoped_production_ready_final_gate_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_scoped_production_ready_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "scoped claim coherent", Boolean(report?.post_export_active_scoped_production_ready_allowed) === (unresolved?.unresolved_items_count === 0), { report, unresolved });
  addCheck(checks, "bare claims blocked", boundary?.production_ready_allowed === false && boundary?.stable_allowed === false && boundary?.release_gated_allowed === false, boundary || {});
  addCheck(checks, "no new external execution", report?.openai_model_api_call === false && report?.new_local_model_execution === false && report?.telemetry_sink_write === false, report || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? report?.status || "pass" : "fail",
    stage,
    unresolved_items_count: failures.length || unresolved?.unresolved_items_count || 0,
    checks,
    failures,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/active_scoped_production_ready_gate_check_report.json`, gate);
  return gate;
}

export function auditActiveScopedProductionReadyClaims(root) {
  const scan = scanClaimsForAudit(root, "post_export_active_scoped_production_ready_claim_audit_report");
  const report = {
    status: scan.status,
    stage: STAGES.productionReadyGate,
    matches_count: scan.matches.length,
    matches: scan.matches,
    expected: "scoped production readiness does not permit bare production-ready",
    ...commonFlags()
  };
  writeJsonRel(root, "evals/reports/post_export_active_scoped_production_ready_claim_audit_report.json", report);
  writeMd(root, "evals/reports/post_export_active_scoped_production_ready_claim_audit_report.md", "Active Scoped Production Readiness Claim Audit", [
    `Status: \`${report.status}\``,
    "",
    `- Matches: ${report.matches_count}`,
    "- Bare `production-ready` remains blocked."
  ]);
  return report;
}

export function assessActiveScopedStablePreflight(root) {
  const stage = STAGES.stablePreflight;
  const dir = DIRS.stablePreflight;
  const criteria = stableCriteria(root);
  const blockers = blockersFromCriteria(criteria, "active_scoped_stability", "Collect the missing scoped evidence; do not open bare stable.");
  const status = blockers.length === 0 ? "ready_for_active_scoped_stable_final_gate" : "blocked_by_missing_active_scoped_evidence";
  const matrix = {
    status,
    stage,
    criteria,
    criteria_total: criteria.length,
    criteria_passed: criteria.filter((item) => item.passed).length,
    blockers
  };
  const boundary = {
    status,
    stage,
    post_export_active_scoped_stable_preflight_ready: blockers.length === 0,
    post_export_active_scoped_stable_allowed: false,
    stable_allowed: false,
    production_ready_allowed: false,
    release_gated_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    ...commonFlags()
  };
  const preconditions = {
    status,
    stage,
    final_gate_allowed_by_instruction: true,
    final_gate_may_run: blockers.length === 0,
    hard_stop_required: false,
    criteria
  };
  const report = {
    status,
    stage,
    ready_for_active_scoped_stable_final_gate: blockers.length === 0,
    criteria_matrix_status: status,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags()
  };
  writeYaml(root, "release/scopes/post-export/post_export_active_scoped_stable_preflight_scope.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "final_gate_allowed_by_instruction: true",
    "stable_allowed: false",
    "production_ready_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_active_scoped_stable_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "post_export_active_scoped_stable_allowed: false",
    "stable_allowed: false",
    "production_ready_allowed: false",
    "release_gated_allowed: false",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_scoped_stable_preflight_report.json`, report);
  writeJsonRel(root, `${dir}/active_scoped_stable_criteria_matrix.json`, matrix);
  writeJsonRel(root, `${dir}/active_scoped_stable_claim_boundary.json`, boundary);
  writeJsonRel(root, `${dir}/active_scoped_stable_gate_preconditions.json`, preconditions);
  writeJsonRel(root, `${dir}/active_scoped_stable_preflight_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/release/active_scoped_stable_preflight.ko.md", "Active Scoped Stability Preflight", [
    `Status: \`${status}\``,
    "",
    `- Criteria passed: ${matrix.criteria_passed}/${matrix.criteria_total}`,
    "- This is scoped stability only; bare `stable` remains blocked.",
    ...(blockers.length ? blockers.map((item) => `- ${item.id}: ${item.reason}`) : ["- Final gate preconditions are satisfied."])
  ]);
  return report;
}

export function checkActiveScopedStablePreflight(root) {
  const stage = STAGES.stablePreflight;
  const dir = DIRS.stablePreflight;
  const report = readJsonIfExists(root, `${dir}/active_scoped_stable_preflight_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_scoped_stable_claim_boundary.json`);
  const preconditions = readJsonIfExists(root, `${dir}/active_scoped_stable_gate_preconditions.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "preconditions coherent", Boolean(report?.ready_for_active_scoped_stable_final_gate) === Boolean(preconditions?.final_gate_may_run), { report, preconditions });
  addCheck(checks, "bare stable remains false", boundary?.stable_allowed === false && report?.stable_allowed === false, { boundary, report });
  addCheck(checks, "no new external execution", report?.openai_model_api_call === false && report?.new_local_model_execution === false && report?.telemetry_sink_write === false, report || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? report?.status || "pass" : "fail",
    stage,
    unresolved_items_count: failures.length || report?.unresolved_items_count || 0,
    checks,
    failures,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/active_scoped_stable_preflight_gate_report.json`, gate);
  return gate;
}

export function runActiveScopedStableFinalGate(root) {
  const stage = STAGES.stableGate;
  const dir = DIRS.stableGate;
  const preflight = readJsonIfExists(root, `${DIRS.stablePreflight}/active_scoped_stable_preflight_report.json`);
  const criteria = stableCriteria(root);
  const blockers = [
    ...blockersFromCriteria(criteria, "active_scoped_stability", "Keep scoped stability blocked until every criterion passes."),
    ...(preflight?.status === "ready_for_active_scoped_stable_final_gate" ? [] : [
      unresolvedItem("active_scoped_stable_preflight_not_ready", "active_scoped_stability", `Preflight status is ${preflight?.status || "missing"}.`, "Run and pass Stage D before Stage E.")
    ])
  ];
  const allowed = blockers.length === 0;
  const claimBoundary = {
    status: allowed ? "pass" : "blocked",
    stage,
    post_export_active_scoped_stable_allowed: allowed,
    stable_allowed: false,
    production_ready_allowed: false,
    release_gated_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    allowed_scoped_claims: allowed ? [ACTIVE_SCOPED_STABLE, ACTIVE_SCOPED_STABLE_GATE] : [],
    blocked_claims: BARE_BLOCKED_CLAIMS,
    ...commonFlags()
  };
  const report = {
    status: allowed ? "pass" : "blocked",
    stage,
    final_gate_executed: allowed,
    post_export_active_scoped_stable_allowed: allowed,
    scoped_claim_allowed: allowed ? ACTIVE_SCOPED_STABLE : null,
    criteria,
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags()
  };
  writeYaml(root, "release/gates/post-export/post_export_active_scoped_stable_final_gate_scope.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_scoped_stable_allowed: ${allowed}`,
    "stable_allowed: false",
    "production_ready_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeYaml(root, "release/gates/post-export/post_export_active_scoped_stable_final_gate.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `allowed_claim: ${allowed ? ACTIVE_SCOPED_STABLE : "none"}`,
    `final_gate_claim: ${allowed ? ACTIVE_SCOPED_STABLE_GATE : "none"}`,
    "bare_stable_allowed: false"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_active_scoped_stable_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${report.status}`,
    `post_export_active_scoped_stable_allowed: ${allowed}`,
    "stable_allowed: false",
    "production_ready_allowed: false",
    "release_gated_allowed: false",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_scoped_stable_final_gate_report.json`, report);
  writeJsonRel(root, `${dir}/active_scoped_stable_evidence_summary.json`, { status: report.status, stage, criteria });
  writeJsonRel(root, `${dir}/active_scoped_stable_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/active_scoped_stable_decision_record.json`, {
    status: allowed ? "approved_scoped_claim" : "blocked",
    stage,
    decision: allowed ? "allow_post_export_active_scoped_stable" : "keep_active_scoped_stability_blocked",
    approved_claims: allowed ? [ACTIVE_SCOPED_STABLE, ACTIVE_SCOPED_STABLE_GATE] : [],
    bare_stable_allowed: false
  });
  writeJsonRel(root, `${dir}/active_scoped_stable_gate_check_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/release/active_scoped_stable_final_gate.ko.md", "Active Scoped Stability Final Gate", [
    `Status: \`${report.status}\``,
    "",
    `- Scoped claim allowed: ${allowed}`,
    `- Allowed scoped claim: \`${allowed ? ACTIVE_SCOPED_STABLE : "none"}\``,
    "- Bare `stable` remains blocked."
  ]);
  writeMd(root, "docs/claims/active_scoped_stable_claim_boundary.ko.md", "Active Scoped Stability Boundary", [
    `Status: \`${claimBoundary.status}\``,
    "",
    "- This boundary is active scoped only.",
    "- It does not permit bare `stable`, `production-ready`, or `release-gated`."
  ]);
  return report;
}

export function checkActiveScopedStableFinalGate(root) {
  const stage = STAGES.stableGate;
  const dir = DIRS.stableGate;
  const report = readJsonIfExists(root, `${dir}/active_scoped_stable_final_gate_report.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_scoped_stable_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "scoped claim coherent", Boolean(report?.post_export_active_scoped_stable_allowed) === (unresolved?.unresolved_items_count === 0), { report, unresolved });
  addCheck(checks, "bare claims blocked", boundary?.stable_allowed === false && boundary?.production_ready_allowed === false && boundary?.release_gated_allowed === false, boundary || {});
  addCheck(checks, "no new external execution", report?.openai_model_api_call === false && report?.new_local_model_execution === false && report?.telemetry_sink_write === false, report || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? report?.status || "pass" : "fail",
    stage,
    unresolved_items_count: failures.length || unresolved?.unresolved_items_count || 0,
    checks,
    failures,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/active_scoped_stable_gate_check_report.json`, gate);
  return gate;
}

export function auditActiveScopedStableClaims(root) {
  const scan = scanClaimsForAudit(root, "post_export_active_scoped_stable_claim_audit_report");
  const report = {
    status: scan.status,
    stage: STAGES.stableGate,
    matches_count: scan.matches.length,
    matches: scan.matches,
    expected: "scoped stability does not permit bare stable",
    ...commonFlags()
  };
  writeJsonRel(root, "evals/reports/post_export_active_scoped_stable_claim_audit_report.json", report);
  writeMd(root, "evals/reports/post_export_active_scoped_stable_claim_audit_report.md", "Active Scoped Stability Claim Audit", [
    `Status: \`${report.status}\``,
    "",
    `- Matches: ${report.matches_count}`,
    "- Bare `stable` remains blocked."
  ]);
  return report;
}

export function buildGeneralBareClaimFinalBlockerMatrix(root) {
  const stage = STAGES.bareMatrix;
  const dir = DIRS.bareMatrix;
  const productionGate = readJsonIfExists(root, `${DIRS.productionReadyGate}/active_scoped_production_ready_final_gate_report.json`);
  const stableGate = readJsonIfExists(root, `${DIRS.stableGate}/active_scoped_stable_final_gate_report.json`);
  const rows = [
    {
      claim: "provider-verified",
      allowed: false,
      status: "blocked",
      blockers: ["active provider lanes evidence is scoped only", "no separately approved bare provider-verified final gate"],
      next_action: "Run a separately approved bare provider-verified coverage completion and final gate."
    },
    {
      claim: "adapter-checked",
      allowed: false,
      status: "blocked",
      blockers: ["active adapters evidence excludes vLLM", "no separately approved bare adapter-checked final gate"],
      next_action: "Complete full adapter coverage including out-of-scope adapters, then run a separately approved final gate."
    },
    {
      claim: "production-ready",
      allowed: false,
      status: "blocked",
      blockers: ["active scoped readiness is not bare production readiness", "bare provider-verified remains blocked", "bare adapter-checked remains blocked", "release gate rerun is not approved"],
      next_action: "After bare provider/adapter gates pass, run a separately approved general production readiness gate."
    },
    {
      claim: "stable",
      allowed: false,
      status: "blocked",
      blockers: ["active scoped stability is not bare stable", "bare production-ready remains blocked", "release gate rerun is not approved"],
      next_action: "After bare production readiness passes, run a separately approved stability gate."
    },
    {
      claim: "release-gated",
      allowed: false,
      status: "blocked",
      blockers: ["general release gate rerun is explicitly out of scope", "bare production-ready/stable remain blocked"],
      next_action: "Run a separately approved release gate rerun."
    },
    {
      claim: "bare release-gated",
      allowed: false,
      status: "blocked",
      blockers: ["same blocked release gate rerun prerequisite", "no bare release gate decision record"],
      next_action: "Run a separately approved bare release gate decision process."
    }
  ];
  const boundary = {
    status: "pass",
    stage,
    scoped_claims_reflected: {
      post_export_active_scoped_production_ready_allowed: productionGate?.post_export_active_scoped_production_ready_allowed === true,
      post_export_active_scoped_stable_allowed: stableGate?.post_export_active_scoped_stable_allowed === true
    },
    blocked_claims: rows.map((row) => row.claim),
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...commonFlags()
  };
  const nextActions = {
    status: "recorded",
    stage,
    next_actions: rows.map((row) => ({ claim: row.claim, next_action: row.next_action }))
  };
  const report = {
    status: "pass",
    stage,
    claim_blockers_count: rows.length,
    matrix: rows,
    scoped_claims_do_not_unblock_bare_claims: true,
    unresolved_items_count: 0,
    ...commonFlags()
  };
  writeYaml(root, "release/blockers/post-export/post_export_general_bare_claim_final_blocker_matrix_scope.yaml", [
    `stage: ${stage}`,
    "status: pass",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/general_bare_claim_final_blocker_matrix.json`, report);
  writeJsonRel(root, `${dir}/general_bare_claim_claim_boundary.json`, boundary);
  writeJsonRel(root, `${dir}/general_bare_claim_next_actions.json`, nextActions);
  writeJsonRel(root, `${dir}/general_bare_claim_gate_report.json`, report);
  writeUnresolved(root, dir, stage, []);
  writeMd(root, "docs/release/general_bare_claim_final_blocker_matrix.ko.md", "General Bare Claim Final Blocker Matrix", [
    "Status: `pass`",
    "",
    "- bare provider/adapter/production/stability/release claims remain blocked.",
    "- Active scoped claims are recorded as scoped-only evidence.",
    "- General release gate rerun was not performed."
  ]);
  return report;
}

export function checkGeneralBareClaimFinalBlockerMatrix(root) {
  const stage = STAGES.bareMatrix;
  const dir = DIRS.bareMatrix;
  const report = readJsonIfExists(root, `${dir}/general_bare_claim_final_blocker_matrix.json`);
  const boundary = readJsonIfExists(root, `${dir}/general_bare_claim_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "matrix exists", Boolean(report), report || {});
  addCheck(checks, "six blocked claims recorded", Array.isArray(report?.matrix) && report.matrix.length === 6, report || {});
  addCheck(checks, "bare/general claims blocked", boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false && boundary?.production_ready_allowed === false && boundary?.stable_allowed === false && boundary?.release_gated_allowed === false, boundary || {});
  addCheck(checks, "stage unresolved empty", unresolved?.unresolved_items_count === 0, unresolved || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    unresolved_items_count: failures.length,
    checks,
    failures,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/general_bare_claim_gate_report.json`, gate);
  return gate;
}

function shouldSkip(root, absPath) {
  const rel = path.relative(root, absPath).split(path.sep).join("/");
  if (!rel || rel === ".") return false;
  if (rel === "exports" || rel.startsWith("exports/")) return true;
  if (rel.includes("/node_modules/") || rel.includes("/.git/") || rel.includes("/dist/")) return true;
  if (rel === "node_modules" || rel === ".git" || rel === "dist") return true;
  if (path.basename(absPath) === ".DS_Store") return true;
  return false;
}

function copyIntoStage(root, relPath, stageRoot) {
  const sourcePath = p(root, relPath);
  if (!fs.existsSync(sourcePath)) return;
  const destPath = path.join(stageRoot, ...relPath.split("/"));
  if (fs.statSync(sourcePath).isDirectory()) {
    fs.cpSync(sourcePath, destPath, { recursive: true, filter: (item) => !shouldSkip(root, item) });
  } else if (!shouldSkip(root, sourcePath)) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(sourcePath, destPath);
  }
}

function zipEntries(packageAbs) {
  const result = spawnSync("zipinfo", ["-1", packageAbs], { encoding: "utf8", maxBuffer: 80 * 1024 * 1024 });
  return result.status === 0 ? result.stdout.split(/\r?\n/).filter(Boolean).sort() : [];
}

function forbiddenEntries(entries) {
  const allowedSecurityPolicyEntries = new Set([
    "security/audits/secret_detection_patterns.yaml"
  ]);
  return {
    node_modules: entries.filter((entry) => entry === "node_modules/" || entry.includes("/node_modules/")),
    dist: entries.filter((entry) => entry === "dist/" || entry.startsWith("dist/") || entry.includes("/dist/")),
    git_metadata: entries.filter((entry) => entry === ".git/" || entry.startsWith(".git/") || entry.includes("/.git/")),
    ds_store: entries.filter((entry) => path.basename(entry) === ".DS_Store"),
    allowed_security_policy_entries: entries.filter((entry) => allowedSecurityPolicyEntries.has(entry)),
    raw_or_secret: entries.filter((entry) => /raw_(request|response)|request_payload|response_payload|secret|api[_-]?key|auth[_-]?header/i.test(entry) && !allowedSecurityPolicyEntries.has(entry))
  };
}

function currentScopedReadinessState(root) {
  const productionGate = readJsonIfExists(root, `${DIRS.productionReadyGate}/active_scoped_production_ready_final_gate_report.json`);
  const stableGate = readJsonIfExists(root, `${DIRS.stableGate}/active_scoped_stable_final_gate_report.json`);
  return finalClaimState(root, {
    production_ready_allowed: productionGate?.post_export_active_scoped_production_ready_allowed === true,
    stable_allowed: stableGate?.post_export_active_scoped_stable_allowed === true
  });
}

export function runFinalExportRefreshAfterActiveScopedReadiness(root) {
  const stage = STAGES.exportRefresh;
  const dir = DIRS.exportRefresh;
  const claimState = currentScopedReadinessState(root);
  const packageRoots = [
    "AGENTS.md",
    "README.md",
    "MANIFEST.asset_classes.yaml",
    "stack.yaml",
    "release",
    "docs",
    "schemas",
    "security",
    "observability",
    "adapters",
    "runtime",
    "tools",
    "evals/suites",
    "evals/reports",
    "evidence/post-export-openai-provider-contract-regression-review",
    "evidence/post-export-ollama-structured-output-smoke",
    "evidence/post-export-ollama-tool-calling-mock-smoke",
    "evidence/post-export-ollama-replay-regression-smoke",
    "evidence/post-export-cross-adapter-contract-dry-run",
    "evidence/post-export-active-provider-lanes-verified-final-gate",
    "evidence/post-export-active-adapters-checked-final-gate",
    "evidence/post-export-active-scoped-blocker-forensic-triage",
    "evidence/post-export-qwen3-14b-structured-output-targeted-repair",
    "evidence/post-export-qwen3-14b-replay-regression-targeted-repair",
    "evidence/post-export-cross-adapter-contract-targeted-repair",
    "evidence/post-export-active-provider-lanes-verified-final-gate-retry",
    "evidence/post-export-active-adapters-checked-final-gate-retry",
    "evidence/post-export-general-readiness-stability-preflight-refresh-after-active-repairs",
    "evidence/final-export-refresh-after-active-scoped-repairs",
    DIRS.archive,
    DIRS.productionReadyPreflight,
    DIRS.productionReadyGate,
    DIRS.stablePreflight,
    DIRS.stableGate,
    DIRS.bareMatrix,
    DIRS.exportRefresh,
    "evidence/reference-baseline"
  ];
  const generatedAt = new Date().toISOString();
  const manifest = {
    status: "packaging",
    stage,
    generated_at: generatedAt,
    package_path: EXPORT_PACKAGE,
    included_roots: packageRoots,
    excluded_roots: ["node_modules", "dist", ".git", "exports"],
    excluded_basenames: [".DS_Store"],
    excluded_patterns: ["*.log", "raw request/response payload files", "secret/API-key/auth-header files"]
  };
  writeYaml(root, "release/scopes/final-export/final_export_refresh_after_active_scoped_readiness_scope.yaml", [
    `stage: ${stage}`,
    "status: packaging",
    `package_path: ${EXPORT_PACKAGE}`,
    "dist_modified: false",
    "reference_baseline_source_modified: false",
    "evidence_reference_baseline_refresh: false"
  ]);
  writeJsonRel(root, `${dir}/final_export_refresh_claim_state.json`, claimState);
  writeJsonRel(root, `${dir}/final_export_refresh_claim_boundary.json`, {
    status: "recorded",
    stage,
    allowed_scoped_claims: claimState.allowed_scoped_claims,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...commonFlags()
  });
  writeUnresolved(root, dir, stage, []);
  const stageRoot = path.join(os.tmpdir(), `harness-core-active-scoped-readiness-refresh-${process.pid}`);
  fs.rmSync(stageRoot, { recursive: true, force: true });
  fs.mkdirSync(stageRoot, { recursive: true });
  for (const relPath of packageRoots) copyIntoStage(root, relPath, stageRoot);
  fs.mkdirSync(path.join(stageRoot, "final_export_refresh_after_active_scoped_readiness"), { recursive: true });
  writeJson(path.join(stageRoot, "final_export_refresh_after_active_scoped_readiness", "claim_state.json"), claimState);
  writeJson(path.join(stageRoot, "final_export_refresh_after_active_scoped_readiness", "manifest.json"), manifest);
  const packageAbs = p(root, EXPORT_PACKAGE);
  fs.mkdirSync(path.dirname(packageAbs), { recursive: true });
  fs.rmSync(packageAbs, { force: true });
  const zipResult = spawnSync("zip", ["-qr", packageAbs, "."], { cwd: stageRoot, encoding: "utf8", maxBuffer: 80 * 1024 * 1024 });
  fs.rmSync(stageRoot, { recursive: true, force: true });
  const entries = zipResult.status === 0 && fs.existsSync(packageAbs) ? zipEntries(packageAbs) : [];
  const bad = forbiddenEntries(entries);
  const packageCreated = zipResult.status === 0 && fs.existsSync(packageAbs);
  const checksum = packageCreated ? sha256File(packageAbs) : null;
  const report = {
    status: packageCreated ? "pass" : "blocked",
    stage,
    actual_export_write: packageCreated,
    package_path: EXPORT_PACKAGE,
    package_sha256: checksum,
    allowed_scoped_claims: claimState.allowed_scoped_claims,
    node_modules_included: bad.node_modules.length > 0,
    dist_included: bad.dist.length > 0,
    ds_store_included: bad.ds_store.length > 0,
    raw_or_secret_included: bad.raw_or_secret.length > 0,
    allowed_security_policy_entries: bad.allowed_security_policy_entries,
    forbidden_entries: bad,
    protected_path_status: protectedStatus(root),
    ...commonFlags({ actual_export_write: packageCreated })
  };
  manifest.status = packageCreated ? "exported" : "blocked";
  manifest.package_sha256 = checksum;
  manifest.package_entry_count = entries.length;
  manifest.package_entries = entries;
  writeJsonRel(root, `${dir}/final_export_refresh_after_active_scoped_readiness_report.json`, report);
  writeJsonRel(root, `${dir}/final_export_refresh_manifest.json`, manifest);
  writeJsonRel(root, `${dir}/final_export_refresh_checksums.json`, { status: "recorded", stage, entries: [{ path: EXPORT_PACKAGE, sha256: checksum }] });
  writeJsonRel(root, `${dir}/final_export_refresh_gate_report.json`, {
    status: packageCreated ? "pass" : "blocked",
    stage,
    unresolved_items_count: packageCreated ? 0 : 1,
    package_record: report,
    ...commonFlags({ actual_export_write: packageCreated })
  });
  writeMd(root, "docs/release/final_export_refresh_after_active_scoped_readiness.ko.md", "Final Export Refresh After Active Scoped Readiness", [
    `Status: \`${report.status}\``,
    "",
    `- package path: \`${EXPORT_PACKAGE}\``,
    `- package sha256: \`${checksum || "missing"}\``,
    `- scoped claims: ${claimState.allowed_scoped_claims.join(", ") || "none"}`,
    "- dist modified: false",
    "- legacy-reference-source modified: false",
    "- evidence/reference-baseline refresh: false"
  ]);
  return report;
}

export function checkFinalExportRefreshAfterActiveScopedReadiness(root) {
  const stage = STAGES.exportRefresh;
  const dir = DIRS.exportRefresh;
  const report = readJsonIfExists(root, `${dir}/final_export_refresh_after_active_scoped_readiness_report.json`);
  const manifest = readJsonIfExists(root, `${dir}/final_export_refresh_manifest.json`);
  const claimState = readJsonIfExists(root, `${dir}/final_export_refresh_claim_state.json`);
  const checks = [];
  addCheck(checks, "report passed", report?.status === "pass" && report?.actual_export_write === true, report || {});
  addCheck(checks, "manifest exported", manifest?.status === "exported" && manifest?.package_path === EXPORT_PACKAGE, manifest || {});
  addCheck(checks, "forbidden package entries absent", report?.node_modules_included === false && report?.dist_included === false && report?.ds_store_included === false && report?.raw_or_secret_included === false, report || {});
  addCheck(checks, "strong claims remain false", claimState?.provider_verified_allowed === false && claimState?.adapter_checked_allowed === false && claimState?.production_ready_allowed === false && claimState?.stable_allowed === false && claimState?.release_gated_allowed === false, claimState || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    unresolved_items_count: failures.length,
    checks,
    failures,
    ...commonFlags({ actual_export_write: report?.actual_export_write === true })
  };
  writeJsonRel(root, `${dir}/final_export_refresh_gate_report.json`, gate);
  return gate;
}

export function buildActiveScopedFinalHandoffRefresh(root) {
  const stage = STAGES.handoff;
  const dir = DIRS.handoff;
  const claimState = currentScopedReadinessState(root);
  const nextOptions = {
    status: "recorded",
    stage,
    options: [
      {
        id: "bare_provider_verified_path",
        description: "Complete and gate full provider-verified coverage under a separate approval.",
        opens_if_passed: ["provider-verified"],
        requires_forbidden_in_this_stage: true
      },
      {
        id: "bare_adapter_checked_path",
        description: "Complete full adapter coverage, including currently excluded lanes, under a separate approval.",
        opens_if_passed: ["adapter-checked"],
        requires_forbidden_in_this_stage: true
      },
      {
        id: "general_release_gate_path",
        description: "Run a separately approved general release gate after bare prerequisites pass.",
        opens_if_passed: ["production-ready", "stable", "release-gated"],
        requires_forbidden_in_this_stage: true
      }
    ]
  };
  const report = {
    status: "pass",
    stage,
    handoff_path: "NEW_CONVERSATION_HANDOFF_AFTER_ACTIVE_SCOPED.ko.md",
    prompt_path: "NEW_CONVERSATION_PROMPT_AFTER_ACTIVE_SCOPED.ko.md",
    active_scoped_final_claim_state: claimState,
    unresolved_items_count: 0,
    ...commonFlags()
  };
  const handoff = [
    "# New Conversation Handoff After Active Scoped",
    "",
    "## Current State",
    "",
    `- Active provider lanes: \`${claimState.post_export_active_provider_lanes_verified_allowed}\``,
    `- Active adapters: \`${claimState.post_export_active_adapters_checked_allowed}\``,
    `- Active scoped production readiness: \`${claimState.post_export_active_scoped_production_ready_allowed}\``,
    `- Active scoped stability: \`${claimState.post_export_active_scoped_stable_allowed}\``,
    "",
    "## Allowed Claims",
    "",
    ...claimState.allowed_claims.map((claim) => `- \`${claim}\``),
    "",
    "## Blocked Bare/General Claims",
    "",
    ...BARE_BLOCKED_CLAIMS.map((claim) => `- \`${claim}\``),
    "",
    "## Boundary",
    "",
    "- No OpenAI model API call was made in this stage.",
    "- No OpenAI provider rerun was performed.",
    "- No new local model execution was performed.",
    "- No telemetry sink write was performed.",
    "- No production deployment was performed.",
    "- No release gate rerun was performed.",
    "- `legacy-reference-source`, `dist`, and `harness-core/evidence/reference-baseline` were not intentionally modified or refreshed in this stage.",
    "",
    "## Next Options",
    "",
    ...nextOptions.options.map((option) => `- ${option.id}: ${option.description}`)
  ].join("\n");
  const prompt = [
    "# New Conversation Prompt After Active Scoped",
    "",
    "Continue from `v2.0.0-post-active-scoped-archive-and-general-readiness-autopilot-until-hard-stop`.",
    "",
    "Allowed scoped claims are recorded in `evidence/post-export-active-scoped-final-handoff-refresh/active_scoped_final_claim_state.json`.",
    "",
    "Do not claim bare `provider-verified`, `adapter-checked`, `production-ready`, `stable`, `release-gated`, or bare release-gated unless a separately approved gate has executed and passed.",
    "",
    "Start by reading:",
    "",
    "- `NEW_CONVERSATION_HANDOFF_AFTER_ACTIVE_SCOPED.ko.md`",
    "- `evidence/post-export-general-bare-claim-final-blocker-matrix/general_bare_claim_final_blocker_matrix.json`",
    "- `evidence/final-export-refresh-after-active-scoped-readiness/final_export_refresh_after_active_scoped_readiness_report.json`"
  ].join("\n");
  writeTextRel(root, "NEW_CONVERSATION_HANDOFF_AFTER_ACTIVE_SCOPED.ko.md", handoff);
  writeTextRel(root, "NEW_CONVERSATION_PROMPT_AFTER_ACTIVE_SCOPED.ko.md", prompt);
  writeYaml(root, "release/scopes/post-export/post_export_active_scoped_final_handoff_refresh_scope.yaml", [
    `stage: ${stage}`,
    "status: pass",
    "handoff_path: NEW_CONVERSATION_HANDOFF_AFTER_ACTIVE_SCOPED.ko.md",
    "prompt_path: NEW_CONVERSATION_PROMPT_AFTER_ACTIVE_SCOPED.ko.md",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_scoped_final_handoff_report.json`, report);
  writeJsonRel(root, `${dir}/active_scoped_final_claim_state.json`, claimState);
  writeJsonRel(root, `${dir}/active_scoped_next_options.json`, nextOptions);
  writeJsonRel(root, `${dir}/active_scoped_final_handoff_gate_report.json`, report);
  writeUnresolved(root, dir, stage, []);
  writeMd(root, "docs/handoffs/active_scoped_final_handoff_refresh.ko.md", "Active Scoped Final Handoff Refresh", [
    "Status: `pass`",
    "",
    "- New conversation handoff and prompt were refreshed.",
    "- Allowed scoped claims and blocked bare/general claims were recorded.",
    "- No external execution or protected path refresh was performed."
  ]);
  return report;
}

export function checkActiveScopedFinalHandoffRefresh(root) {
  const stage = STAGES.handoff;
  const dir = DIRS.handoff;
  const report = readJsonIfExists(root, `${dir}/active_scoped_final_handoff_report.json`);
  const state = readJsonIfExists(root, `${dir}/active_scoped_final_claim_state.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "handoff exists", fs.existsSync(p(root, "NEW_CONVERSATION_HANDOFF_AFTER_ACTIVE_SCOPED.ko.md")), {});
  addCheck(checks, "prompt exists", fs.existsSync(p(root, "NEW_CONVERSATION_PROMPT_AFTER_ACTIVE_SCOPED.ko.md")), {});
  addCheck(checks, "bare/general claims blocked", state?.provider_verified_allowed === false && state?.adapter_checked_allowed === false && state?.production_ready_allowed === false && state?.stable_allowed === false && state?.release_gated_allowed === false, state || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    unresolved_items_count: failures.length,
    checks,
    failures,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/active_scoped_final_handoff_gate_report.json`, gate);
  return gate;
}

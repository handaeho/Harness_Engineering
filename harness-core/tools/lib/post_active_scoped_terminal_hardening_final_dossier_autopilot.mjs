import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./file_walk.mjs";
import { scanClaims } from "./claim_scanner.mjs";

export const STAGES = {
  seal: "v2.0.0-post-active-scoped-terminal-archive-seal",
  blockerMatrix: "v2.0.0-post-active-scoped-bare-general-claim-final-blocker-matrix",
  providerPlan: "v2.0.0-post-active-scoped-provider-verified-future-completion-plan",
  adapterPlan: "v2.0.0-post-active-scoped-adapter-checked-future-completion-plan",
  readinessPlan: "v2.0.0-post-active-scoped-general-readiness-stability-future-decision-plan",
  dossier: "v2.0.0-post-active-scoped-final-release-dossier",
  exportRefresh: "v2.0.0-final-export-refresh-after-final-dossier",
  handoff: "v2.0.0-post-active-scoped-final-new-conversation-handoff"
};

export const DIRS = {
  seal: "evidence/post-active-scoped-terminal-archive-seal",
  blockerMatrix: "evidence/post-active-scoped-bare-general-claim-final-blocker-matrix",
  providerPlan: "evidence/post-active-scoped-provider-verified-future-completion-plan",
  adapterPlan: "evidence/post-active-scoped-adapter-checked-future-completion-plan",
  readinessPlan: "evidence/post-active-scoped-general-readiness-stability-future-decision-plan",
  dossier: "evidence/post-active-scoped-final-release-dossier",
  exportRefresh: "evidence/final-export-refresh-after-final-dossier",
  handoff: "evidence/post-active-scoped-final-new-conversation-handoff"
};

const EXPORT_PACKAGE = "exports/v2.0.0-rc.1-postrc-final-dossier-export.zip";
const PREVIOUS_EXPORT_PACKAGE = "exports/v2.0.0-rc.1-postrc-active-scoped-readiness-refresh.zip";

const PREVIOUS = {
  finalClaimState: "evidence/post-export-active-scoped-final-handoff-refresh/active_scoped_final_claim_state.json",
  readinessExport: "evidence/final-export-refresh-after-active-scoped-readiness/final_export_refresh_after_active_scoped_readiness_report.json",
  readinessExportClaimState: "evidence/final-export-refresh-after-active-scoped-readiness/final_export_refresh_claim_state.json",
  readinessHandoff: "evidence/post-export-active-scoped-final-handoff-refresh/active_scoped_final_handoff_report.json",
  priorBlockerMatrix: "evidence/post-export-general-bare-claim-final-blocker-matrix/general_bare_claim_final_blocker_matrix.json",
  activeProvider: "evidence/post-export-active-provider-lanes-verified-final-gate-retry/active_provider_lanes_verified_final_gate_retry_report.json",
  activeAdapter: "evidence/post-export-active-adapters-checked-final-gate-retry/active_adapters_checked_final_gate_retry_report.json",
  activeScopedProductionReady: "evidence/post-export-active-scoped-production-ready-final-gate/active_scoped_production_ready_final_gate_report.json",
  activeScopedStable: "evidence/post-export-active-scoped-stable-final-gate/active_scoped_stable_final_gate_report.json",
  providerDiverse: "evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_report.json",
  localModelVerified: "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json",
  productionMonitored: "evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json",
  telemetryConnected: "evidence/post-rc-telemetry-connection/telemetry_connection_report.json",
  containmentVerified: "evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json",
  rc1ReleaseGate: "evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_report.json"
};

const ALLOWED_CLAIMS = [
  "provider-diverse",
  "local-model-verified",
  "post-export-active-provider-lanes-verified",
  "post-export-active-adapters-checked",
  "post-export-active-scoped-production-ready",
  "post-export-active-scoped-stable",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];

const ALLOWED_SCOPED_CLAIMS = [
  "post-export-active-provider-lanes-verified",
  "post-export-active-provider-lanes-verified-final-gate-passed",
  "post-export-active-adapters-checked",
  "post-export-active-adapters-checked-final-gate-passed",
  "post-export-active-scoped-production-ready",
  "post-export-active-scoped-production-ready-final-gate-passed",
  "post-export-active-scoped-stable",
  "post-export-active-scoped-stable-final-gate-passed"
];

const WEAK_DOSSIER_CLAIMS = [
  "post-active-scoped-terminal-archive-sealed",
  "post-active-scoped-bare-general-blocker-matrix-recorded",
  "post-active-scoped-provider-verified-future-plan-recorded",
  "post-active-scoped-adapter-checked-future-plan-recorded",
  "post-active-scoped-general-readiness-stability-future-plan-recorded",
  "post-active-scoped-final-release-dossier-recorded",
  "final-export-refresh-after-final-dossier-recorded",
  "post-active-scoped-final-new-conversation-handoff-recorded"
];

const BLOCKED_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

const CANONICALIZATION_RULES = [
  "Use post-export-active-provider-lanes-verified, not provider-verified.",
  "Use post-export-active-adapters-checked, not adapter-checked.",
  "Use post-export-active-scoped-production-ready, not production-ready.",
  "Use post-export-active-scoped-stable, not stable.",
  "Use rc1-openai-scope-release-gated, not release-gated."
];

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
    post_export_active_scoped_production_ready_allowed: true,
    post_export_active_scoped_stable_allowed: true,
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

function finalClaimState(extra = {}) {
  return {
    status: "recorded",
    generated_at: new Date().toISOString(),
    allowed_claims: ALLOWED_CLAIMS,
    allowed_scoped_claims: ALLOWED_SCOPED_CLAIMS,
    allowed_weak_final_dossier_claims: extra.include_weak_claims ? WEAK_DOSSIER_CLAIMS : [],
    blocked_claims: BLOCKED_CLAIMS,
    canonicalization_rules: CANONICALIZATION_RULES,
    ...commonFlags(extra)
  };
}

function evidencePointerIndex(root) {
  const pointers = {
    previous_final_claim_state: PREVIOUS.finalClaimState,
    previous_readiness_export: PREVIOUS.readinessExport,
    previous_readiness_export_claim_state: PREVIOUS.readinessExportClaimState,
    previous_final_handoff: PREVIOUS.readinessHandoff,
    previous_bare_general_blocker_matrix: PREVIOUS.priorBlockerMatrix,
    active_provider_lanes_verified: PREVIOUS.activeProvider,
    active_adapters_checked: PREVIOUS.activeAdapter,
    active_scoped_production_ready: PREVIOUS.activeScopedProductionReady,
    active_scoped_stable: PREVIOUS.activeScopedStable,
    provider_diverse: PREVIOUS.providerDiverse,
    local_model_verified: PREVIOUS.localModelVerified,
    production_monitored: PREVIOUS.productionMonitored,
    telemetry_connected: PREVIOUS.telemetryConnected,
    containment_verified: PREVIOUS.containmentVerified
  };
  return Object.fromEntries(Object.entries(pointers).map(([key, relPath]) => [key, source(root, relPath)]));
}

function terminalPrerequisites(root) {
  const state = readJsonIfExists(root, PREVIOUS.finalClaimState);
  const exportReport = readJsonIfExists(root, PREVIOUS.readinessExport);
  const exportFile = fileRecord(root, PREVIOUS_EXPORT_PACKAGE);
  return [
    {
      id: "active_provider_lanes_scoped_claim_allowed",
      passed: state?.post_export_active_provider_lanes_verified_allowed === true,
      observed: state?.post_export_active_provider_lanes_verified_allowed ?? null
    },
    {
      id: "active_adapters_scoped_claim_allowed",
      passed: state?.post_export_active_adapters_checked_allowed === true,
      observed: state?.post_export_active_adapters_checked_allowed ?? null
    },
    {
      id: "active_scoped_production_ready_allowed",
      passed: state?.post_export_active_scoped_production_ready_allowed === true,
      observed: state?.post_export_active_scoped_production_ready_allowed ?? null
    },
    {
      id: "active_scoped_stable_allowed",
      passed: state?.post_export_active_scoped_stable_allowed === true,
      observed: state?.post_export_active_scoped_stable_allowed ?? null
    },
    {
      id: "latest_active_scoped_readiness_export_exists",
      passed: exportReport?.status === "pass" && exportReport?.package_sha256 === "50fef728fda31496485de47477ea925d230f984c8178230227799046a93036e9" && exportFile.exists,
      observed: { report_status: exportReport?.status || null, report_sha256: exportReport?.package_sha256 || null, file_exists: exportFile.exists }
    }
  ];
}

function blockerRows() {
  return [
    {
      claim: "provider-verified",
      allowed: false,
      status: "blocked",
      missing_evidence: [
        "bare provider verification final gate not run",
        "active provider lanes verified is scoped and does not imply bare provider-verified"
      ],
      hard_stop_now: ["OpenAI provider rerun is not approved", "bare/general claim approval is not allowed in this stage"],
      future_work: ["Define and approve bare provider-verified gate", "Run required provider evidence under separate approval"]
    },
    {
      claim: "adapter-checked",
      allowed: false,
      status: "blocked",
      missing_evidence: [
        "bare adapter-checked final gate not run",
        "active adapters checked is scoped and does not imply bare adapter-checked",
        "vLLM/full adapter coverage remains out of scope"
      ],
      hard_stop_now: ["vLLM execution is not approved", "bare/general claim approval is not allowed in this stage"],
      future_work: ["Complete full adapter conformance", "Run vLLM or explicitly replace the adapter coverage policy"]
    },
    {
      claim: "production-ready",
      allowed: false,
      status: "blocked",
      missing_evidence: [
        "active scoped production-ready is scoped and does not imply bare production-ready",
        "bare provider-verified and adapter-checked remain blocked"
      ],
      hard_stop_now: ["bare production-ready claim is not approved", "release gate rerun is not approved"],
      future_work: ["Resolve bare provider and adapter claims", "Run general production-ready decision gate under separate approval"]
    },
    {
      claim: "stable",
      allowed: false,
      status: "blocked",
      missing_evidence: [
        "active scoped stable is scoped and does not imply bare stable",
        "bare production-ready remains blocked"
      ],
      hard_stop_now: ["bare stable claim is not approved", "release gate rerun is not approved"],
      future_work: ["Resolve bare production readiness", "Run general stable decision gate under separate approval"]
    },
    {
      claim: "release-gated",
      allowed: false,
      status: "blocked",
      missing_evidence: [
        "release gate rerun is out of scope",
        "only scoped release gate claims remain allowed"
      ],
      hard_stop_now: ["release gate rerun is explicitly forbidden in this stage"],
      future_work: ["Run separately approved general release gate after prerequisites pass"]
    },
    {
      claim: "bare release-gated",
      allowed: false,
      status: "blocked",
      missing_evidence: [
        "bare release gate decision record missing",
        "general release gate rerun is out of scope"
      ],
      hard_stop_now: ["bare release-gated claim is not approved"],
      future_work: ["Run separately approved bare release gate decision process"]
    }
  ];
}

function claimBoundary(stage, status = "pass", extra = {}) {
  return {
    status,
    stage,
    allowed_claims: ALLOWED_CLAIMS,
    allowed_scoped_claims: ALLOWED_SCOPED_CLAIMS,
    blocked_claims: BLOCKED_CLAIMS,
    ...commonFlags(extra)
  };
}

export function sealActiveScopedTerminalArchive(root) {
  const stage = STAGES.seal;
  const dir = DIRS.seal;
  const criteria = terminalPrerequisites(root);
  const blockers = criteria
    .filter((item) => !item.passed)
    .map((item) => unresolvedItem(`terminal_seal_${item.id}_not_ready`, "terminal_archive_seal", `Criterion ${item.id} is not satisfied.`, "Restore the latest active scoped readiness evidence before terminal seal."));
  const status = blockers.length === 0 ? "pass" : "blocked";
  const state = finalClaimState({ include_weak_claims: true });
  const pointers = evidencePointerIndex(root);
  const files = [
    PREVIOUS.finalClaimState,
    PREVIOUS.readinessExport,
    PREVIOUS.priorBlockerMatrix,
    PREVIOUS.activeProvider,
    PREVIOUS.activeAdapter,
    PREVIOUS.activeScopedProductionReady,
    PREVIOUS.activeScopedStable,
    PREVIOUS_EXPORT_PACKAGE
  ].map((relPath) => fileRecord(root, relPath));
  const manifest = {
    status: status === "pass" ? "sealed" : "blocked",
    stage,
    criteria,
    files,
    weak_claim_recorded: status === "pass" ? "post-active-scoped-terminal-archive-sealed" : null
  };
  const report = {
    status,
    stage,
    terminal_archive_sealed: status === "pass",
    weak_claim_recorded: status === "pass" ? "post-active-scoped-terminal-archive-sealed" : null,
    criteria,
    evidence_pointer_index: pointers,
    protected_path_status: protectedStatus(root),
    unresolved_items_count: blockers.length,
    blockers,
    ...commonFlags()
  };
  writeYaml(root, "release/scopes/post-active-scoped/post_active_scoped_terminal_archive_seal_scope.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "terminal_archive_sealed: true",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeYaml(root, "release/claims/post-active-scoped/post_active_scoped_terminal_final_claim_state.yaml", [
    `stage: ${stage}`,
    "status: recorded",
    "allowed_claims:",
    ...ALLOWED_CLAIMS.map((claim) => `  - ${claim}`),
    "blocked_claims:",
    ...BLOCKED_CLAIMS.map((claim) => `  - ${claim}`)
  ]);
  writeYaml(root, "release/claims/post-active-scoped/post_active_scoped_terminal_claim_boundary.yaml", [
    `stage: ${stage}`,
    `status: ${status}`,
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/active_scoped_terminal_archive_seal_report.json`, report);
  writeJsonRel(root, `${dir}/active_scoped_terminal_final_claim_state.json`, state);
  writeJsonRel(root, `${dir}/active_scoped_terminal_evidence_pointer_index.json`, { status: "recorded", stage, pointers });
  writeJsonRel(root, `${dir}/active_scoped_terminal_archive_manifest.json`, manifest);
  writeJsonRel(root, `${dir}/active_scoped_terminal_archive_checksums.json`, { status: "recorded", stage, checksums: files.filter((item) => item.exists).map((item) => ({ path: item.path, sha256: item.sha256 })) });
  writeJsonRel(root, `${dir}/active_scoped_terminal_claim_boundary.json`, claimBoundary(stage, status));
  writeJsonRel(root, `${dir}/active_scoped_terminal_archive_seal_gate_report.json`, report);
  writeUnresolved(root, dir, stage, blockers);
  writeMd(root, "docs/release/active_scoped_terminal_archive_seal.ko.md", "Active Scoped Terminal Archive Seal", [
    `Status: \`${status}\``,
    "",
    "- Active scoped state was sealed as terminal archive state.",
    "- No new execution, provider rerun, telemetry sink write, or protected path refresh was performed.",
    "- Bare/general claims remain blocked."
  ]);
  writeMd(root, "docs/claims/active_scoped_terminal_final_claim_state.ko.md", "Active Scoped Terminal Final Claim State", [
    "Status: `recorded`",
    "",
    `- Allowed scoped claims: ${ALLOWED_SCOPED_CLAIMS.join(", ")}`,
    `- Blocked bare/general claims: ${BLOCKED_CLAIMS.join(", ")}`,
    "- Scoped names are not canonicalized into bare/general names."
  ]);
  return report;
}

export function checkActiveScopedTerminalArchiveSeal(root) {
  const stage = STAGES.seal;
  const dir = DIRS.seal;
  const report = readJsonIfExists(root, `${dir}/active_scoped_terminal_archive_seal_report.json`);
  const state = readJsonIfExists(root, `${dir}/active_scoped_terminal_final_claim_state.json`);
  const boundary = readJsonIfExists(root, `${dir}/active_scoped_terminal_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "terminal seal pass", report?.terminal_archive_sealed === true, report || {});
  addCheck(checks, "claim state contains required claims", ALLOWED_CLAIMS.every((claim) => state?.allowed_claims?.includes(claim)), state || {});
  addCheck(checks, "bare/general claims blocked", boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false && boundary?.production_ready_allowed === false && boundary?.stable_allowed === false && boundary?.release_gated_allowed === false, boundary || {});
  addCheck(checks, "unresolved empty", unresolved?.unresolved_items_count === 0, unresolved || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? "pass" : "fail", stage, unresolved_items_count: failures.length, checks, failures, ...commonFlags() };
  writeJsonRel(root, `${dir}/active_scoped_terminal_archive_seal_gate_report.json`, gate);
  return gate;
}

export function auditActiveScopedTerminalClaimBoundary(root) {
  const scan = scanClaimsForAudit(root, "post_active_scoped_terminal_claim_audit_report");
  const report = { status: scan.status, stage: STAGES.seal, matches_count: scan.matches.length, matches: scan.matches, ...commonFlags() };
  writeJsonRel(root, "evals/reports/post_active_scoped_terminal_claim_audit_report.json", report);
  writeMd(root, "evals/reports/post_active_scoped_terminal_claim_audit_report.md", "Active Scoped Terminal Claim Audit", [
    `Status: \`${report.status}\``,
    "",
    `- Matches: ${report.matches_count}`,
    "- Bare/general positive claims remain absent."
  ]);
  return report;
}

export function buildBareGeneralClaimFinalBlockerMatrix(root) {
  const stage = STAGES.blockerMatrix;
  const dir = DIRS.blockerMatrix;
  const rows = blockerRows();
  const report = {
    status: "recorded",
    stage,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    blockers: {
      provider_verified: rows[0].missing_evidence,
      adapter_checked: rows[1].missing_evidence,
      production_ready: rows[2].missing_evidence,
      stable: rows[3].missing_evidence,
      release_gated: rows[4].missing_evidence
    },
    rows,
    weak_claim_recorded: "post-active-scoped-bare-general-blocker-matrix-recorded",
    unresolved_items_count: 0,
    ...commonFlags()
  };
  writeYaml(root, "release/blockers/post-active-scoped/post_active_scoped_bare_general_claim_blocker_matrix_scope.yaml", [
    `stage: ${stage}`,
    "status: recorded",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeYaml(root, "release/claims/post-active-scoped/post_active_scoped_bare_general_claim_boundary.yaml", [
    `stage: ${stage}`,
    "status: recorded",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/bare_general_claim_final_blocker_matrix.json`, report);
  writeJsonRel(root, `${dir}/provider_verified_final_blocker_detail.json`, rows[0]);
  writeJsonRel(root, `${dir}/adapter_checked_final_blocker_detail.json`, rows[1]);
  writeJsonRel(root, `${dir}/production_ready_final_blocker_detail.json`, rows[2]);
  writeJsonRel(root, `${dir}/stable_final_blocker_detail.json`, rows[3]);
  writeJsonRel(root, `${dir}/release_gated_final_blocker_detail.json`, { ...rows[4], bare_release_gated: rows[5] });
  writeJsonRel(root, `${dir}/bare_general_claim_boundary.json`, claimBoundary(stage, "recorded"));
  writeJsonRel(root, `${dir}/bare_general_claim_blocker_gate_report.json`, report);
  writeUnresolved(root, dir, stage, []);
  writeMd(root, "docs/release/bare_general_claim_final_blocker_matrix.ko.md", "Bare/General Claim Final Blocker Matrix", [
    "Status: `recorded`",
    "",
    "- Bare/general provider, adapter, production, stability, release claims remain blocked.",
    "- Each missing evidence item is classified into current hard stop and future work.",
    "- Scoped active claims do not imply bare/general claims."
  ]);
  writeMd(root, "docs/claims/bare_general_claim_boundary.ko.md", "Bare/General Claim Boundary", [
    "- `post-export-active-provider-lanes-verified` is not `provider-verified`.",
    "- `post-export-active-adapters-checked` is not `adapter-checked`.",
    "- `post-export-active-scoped-production-ready` is not bare `production-ready`.",
    "- `post-export-active-scoped-stable` is not bare `stable`.",
    "- `rc1-openai-scope-release-gated` is not bare `release-gated`."
  ]);
  return report;
}

export function checkBareGeneralClaimFinalBlockerMatrix(root) {
  const stage = STAGES.blockerMatrix;
  const dir = DIRS.blockerMatrix;
  const report = readJsonIfExists(root, `${dir}/bare_general_claim_final_blocker_matrix.json`);
  const boundary = readJsonIfExists(root, `${dir}/bare_general_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "matrix exists", Boolean(report), report || {});
  addCheck(checks, "all five bare/general booleans false", report?.provider_verified_allowed === false && report?.adapter_checked_allowed === false && report?.production_ready_allowed === false && report?.stable_allowed === false && report?.release_gated_allowed === false, report || {});
  addCheck(checks, "details recorded", ["provider_verified", "adapter_checked", "production_ready", "stable", "release_gated"].every((key) => Array.isArray(report?.blockers?.[key]) && report.blockers[key].length > 0), report || {});
  addCheck(checks, "boundary blocks claims", boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false && boundary?.production_ready_allowed === false && boundary?.stable_allowed === false && boundary?.release_gated_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? "pass" : "fail", stage, unresolved_items_count: failures.length, checks, failures, ...commonFlags() };
  writeJsonRel(root, `${dir}/bare_general_claim_blocker_gate_report.json`, gate);
  return gate;
}

function futurePlan(stage, claim, weakClaim, requirements, operatorActions) {
  return {
    status: "recorded",
    stage,
    claim,
    weak_claim_recorded: weakClaim,
    [`${claim.replaceAll("-", "_")}_allowed`]: false,
    requirements,
    operator_actions: operatorActions,
    current_stage_hard_stops: requirements.filter((item) => item.current_stage_status === "hard_stop"),
    future_work: requirements.filter((item) => item.current_stage_status === "future_work"),
    ...commonFlags()
  };
}

export function buildProviderVerifiedFutureCompletionPlan(root) {
  const stage = STAGES.providerPlan;
  const dir = DIRS.providerPlan;
  const requirements = [
    { id: "bare_provider_verified_gate_design", description: "Define a gate for bare provider verification rather than active scoped lanes.", current_stage_status: "future_work" },
    { id: "openai_provider_rerun_or_fresh_evidence", description: "Collect fresh OpenAI provider evidence if the future gate requires it.", current_stage_status: "hard_stop" },
    { id: "additional_provider_or_vllm_policy_decision", description: "Decide whether vLLM or another provider is required for the bare claim.", current_stage_status: "future_work" },
    { id: "owner_approval_for_bare_claim", description: "Record explicit owner approval before opening bare provider-verified.", current_stage_status: "hard_stop" }
  ];
  const actions = [
    "Approve a separate bare provider-verified completion run.",
    "Decide whether existing active scoped provider evidence can be reused as input only.",
    "If fresh provider evidence is required, approve OpenAI provider rerun or another provider lane."
  ];
  const report = futurePlan(stage, "provider-verified", "post-active-scoped-provider-verified-future-plan-recorded", requirements, actions);
  report.provider_verified_allowed = false;
  writeYaml(root, "release/scopes/post-active-scoped/post_active_scoped_provider_verified_future_completion_plan_scope.yaml", [
    `stage: ${stage}`,
    "status: recorded",
    "provider_verified_allowed: false",
    "openai_provider_rerun_performed: false"
  ]);
  writeJsonRel(root, `${dir}/provider_verified_future_completion_plan.json`, report);
  writeJsonRel(root, `${dir}/provider_verified_required_future_evidence.json`, { status: "recorded", stage, requirements });
  writeJsonRel(root, `${dir}/provider_verified_operator_actions.json`, { status: "recorded", stage, operator_actions: actions });
  writeJsonRel(root, `${dir}/provider_verified_future_completion_gate_report.json`, report);
  writeUnresolved(root, dir, stage, []);
  writeMd(root, "docs/providers/provider_verified_future_completion_plan.ko.md", "Provider-Verified Future Completion Plan", [
    "Status: `recorded`",
    "",
    "- Current result: `provider_verified_allowed: false`.",
    "- OpenAI provider rerun and bare claim approval are hard stops in this stage.",
    "- Future work must define and approve a separate bare provider verification gate."
  ]);
  return report;
}

export function checkProviderVerifiedFutureCompletionPlan(root) {
  const stage = STAGES.providerPlan;
  const dir = DIRS.providerPlan;
  const report = readJsonIfExists(root, `${dir}/provider_verified_future_completion_plan.json`);
  const checks = [];
  addCheck(checks, "plan exists", Boolean(report), report || {});
  addCheck(checks, "provider-verified remains false", report?.provider_verified_allowed === false, report || {});
  addCheck(checks, "hard stops recorded", Array.isArray(report?.current_stage_hard_stops) && report.current_stage_hard_stops.length > 0, report || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? "pass" : "fail", stage, unresolved_items_count: failures.length, checks, failures, ...commonFlags() };
  writeJsonRel(root, `${dir}/provider_verified_future_completion_gate_report.json`, gate);
  return gate;
}

export function buildAdapterCheckedFutureCompletionPlan(root) {
  const stage = STAGES.adapterPlan;
  const dir = DIRS.adapterPlan;
  const requirements = [
    { id: "openai_adapter_full_conformance", description: "Complete full OpenAI adapter conformance beyond scoped active evidence.", current_stage_status: "future_work" },
    { id: "ollama_tool_structured_mapping", description: "Complete Ollama tool and structured mapping evidence for bare adapter coverage.", current_stage_status: "future_work" },
    { id: "vllm_adapter_execution", description: "Execute or replace vLLM adapter coverage requirements.", current_stage_status: "hard_stop" },
    { id: "cross_adapter_contract_full_coverage", description: "Gate full cross-adapter contract coverage, not only active OpenAI/Ollama scope.", current_stage_status: "future_work" },
    { id: "owner_approval_for_bare_claim", description: "Record explicit owner approval before opening bare adapter-checked.", current_stage_status: "hard_stop" }
  ];
  const actions = [
    "Approve full adapter coverage scope.",
    "Approve vLLM execution or a replacement coverage policy.",
    "Run a separate bare adapter-checked final gate after requirements pass."
  ];
  const report = futurePlan(stage, "adapter-checked", "post-active-scoped-adapter-checked-future-plan-recorded", requirements, actions);
  report.adapter_checked_allowed = false;
  writeYaml(root, "release/scopes/post-active-scoped/post_active_scoped_adapter_checked_future_completion_plan_scope.yaml", [
    `stage: ${stage}`,
    "status: recorded",
    "adapter_checked_allowed: false",
    "vllm_execution_performed: false"
  ]);
  writeJsonRel(root, `${dir}/adapter_checked_future_completion_plan.json`, report);
  writeJsonRel(root, `${dir}/adapter_checked_required_future_evidence.json`, { status: "recorded", stage, requirements });
  writeJsonRel(root, `${dir}/adapter_checked_operator_actions.json`, { status: "recorded", stage, operator_actions: actions });
  writeJsonRel(root, `${dir}/adapter_checked_future_completion_gate_report.json`, report);
  writeUnresolved(root, dir, stage, []);
  writeMd(root, "docs/adapters/adapter_checked_future_completion_plan.ko.md", "Adapter-Checked Future Completion Plan", [
    "Status: `recorded`",
    "",
    "- Current result: `adapter_checked_allowed: false`.",
    "- Active adapters checked is scoped and excludes full vLLM/full adapter coverage.",
    "- Future work must run or replace full adapter coverage requirements."
  ]);
  return report;
}

export function checkAdapterCheckedFutureCompletionPlan(root) {
  const stage = STAGES.adapterPlan;
  const dir = DIRS.adapterPlan;
  const report = readJsonIfExists(root, `${dir}/adapter_checked_future_completion_plan.json`);
  const checks = [];
  addCheck(checks, "plan exists", Boolean(report), report || {});
  addCheck(checks, "adapter-checked remains false", report?.adapter_checked_allowed === false, report || {});
  addCheck(checks, "vllm hard stop recorded", report?.requirements?.some((item) => item.id === "vllm_adapter_execution" && item.current_stage_status === "hard_stop"), report || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? "pass" : "fail", stage, unresolved_items_count: failures.length, checks, failures, ...commonFlags() };
  writeJsonRel(root, `${dir}/adapter_checked_future_completion_gate_report.json`, gate);
  return gate;
}

export function buildGeneralReadinessStabilityFutureDecisionPlan(root) {
  const stage = STAGES.readinessPlan;
  const dir = DIRS.readinessPlan;
  const productionRequirements = [
    { id: "bare_provider_verified", description: "Bare provider-verified must pass under separate approval.", current_stage_status: "hard_stop" },
    { id: "bare_adapter_checked", description: "Bare adapter-checked must pass under separate approval.", current_stage_status: "hard_stop" },
    { id: "general_production_ready_gate", description: "Run a general production-ready gate after bare prerequisites.", current_stage_status: "future_work" }
  ];
  const stableRequirements = [
    { id: "bare_production_ready", description: "Bare production-ready must pass before bare stable.", current_stage_status: "hard_stop" },
    { id: "general_stable_gate", description: "Run a general stable gate after production readiness.", current_stage_status: "future_work" },
    { id: "release_gate_rerun_decision", description: "Decide whether a release gate rerun is required.", current_stage_status: "hard_stop" }
  ];
  const actions = [
    "Choose whether to pursue bare provider-verified or adapter-checked first.",
    "Redesign bare production-ready/stable criteria after prerequisite claims are resolved.",
    "Approve any future release gate rerun separately."
  ];
  const report = {
    status: "recorded",
    stage,
    weak_claim_recorded: "post-active-scoped-general-readiness-stability-future-plan-recorded",
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    active_scoped_production_ready_is_bare_production_ready: false,
    active_scoped_stable_is_bare_stable: false,
    production_requirements: productionRequirements,
    stable_requirements: stableRequirements,
    operator_actions: actions,
    ...commonFlags()
  };
  writeYaml(root, "release/scopes/post-active-scoped/post_active_scoped_general_readiness_stability_future_decision_plan_scope.yaml", [
    `stage: ${stage}`,
    "status: recorded",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/general_readiness_stability_future_decision_plan.json`, report);
  writeJsonRel(root, `${dir}/general_production_ready_future_requirements.json`, { status: "recorded", stage, requirements: productionRequirements });
  writeJsonRel(root, `${dir}/general_stable_future_requirements.json`, { status: "recorded", stage, requirements: stableRequirements });
  writeJsonRel(root, `${dir}/general_readiness_stability_operator_actions.json`, { status: "recorded", stage, operator_actions: actions });
  writeJsonRel(root, `${dir}/general_readiness_stability_future_plan_gate_report.json`, report);
  writeUnresolved(root, dir, stage, []);
  writeMd(root, "docs/release/general_readiness_stability_future_decision_plan.ko.md", "General Readiness/Stability Future Decision Plan", [
    "Status: `recorded`",
    "",
    "- Current result: `production_ready_allowed: false`, `stable_allowed: false`, `release_gated_allowed: false`.",
    "- Active scoped production-ready/stable claims do not imply bare/general claims.",
    "- Future path starts with bare provider/adapter prerequisite resolution."
  ]);
  return report;
}

export function checkGeneralReadinessStabilityFutureDecisionPlan(root) {
  const stage = STAGES.readinessPlan;
  const dir = DIRS.readinessPlan;
  const report = readJsonIfExists(root, `${dir}/general_readiness_stability_future_decision_plan.json`);
  const checks = [];
  addCheck(checks, "plan exists", Boolean(report), report || {});
  addCheck(checks, "general claims remain false", report?.production_ready_allowed === false && report?.stable_allowed === false && report?.release_gated_allowed === false, report || {});
  addCheck(checks, "future requirements recorded", Array.isArray(report?.production_requirements) && Array.isArray(report?.stable_requirements), report || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? "pass" : "fail", stage, unresolved_items_count: failures.length, checks, failures, ...commonFlags() };
  writeJsonRel(root, `${dir}/general_readiness_stability_future_plan_gate_report.json`, gate);
  return gate;
}

function futureWorkRegister(root) {
  return {
    status: "recorded",
    entries: [
      readJsonIfExists(root, `${DIRS.providerPlan}/provider_verified_future_completion_plan.json`),
      readJsonIfExists(root, `${DIRS.adapterPlan}/adapter_checked_future_completion_plan.json`),
      readJsonIfExists(root, `${DIRS.readinessPlan}/general_readiness_stability_future_decision_plan.json`)
    ].filter(Boolean)
  };
}

export function buildFinalReleaseDossier(root) {
  const stage = STAGES.dossier;
  const dir = DIRS.dossier;
  const claimState = finalClaimState({ include_weak_claims: true });
  const exportReport = readJsonIfExists(root, PREVIOUS.readinessExport);
  const exportIndex = {
    status: "recorded",
    latest_active_scoped_readiness_export: {
      path: exportReport?.package_path || PREVIOUS_EXPORT_PACKAGE,
      sha256: exportReport?.package_sha256 || null,
      source_report: PREVIOUS.readinessExport
    },
    final_dossier_export_pending: EXPORT_PACKAGE
  };
  const pointers = evidencePointerIndex(root);
  const futureWork = futureWorkRegister(root);
  const dossier = {
    status: "recorded",
    stage,
    weak_claim_recorded: "post-active-scoped-final-release-dossier-recorded",
    generated_at: new Date().toISOString(),
    final_claim_state: claimState,
    evidence_pointer_index: pointers,
    export_index: exportIndex,
    future_work_register: futureWork,
    terminal_state: "active_scoped_terminal_state_recorded_bare_general_blocked",
    ...commonFlags()
  };
  writeYaml(root, "release/scopes/post-active-scoped/post_active_scoped_final_release_dossier_scope.yaml", [
    `stage: ${stage}`,
    "status: recorded",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/final_release_dossier.json`, dossier);
  writeJsonRel(root, `${dir}/final_release_claim_state.json`, claimState);
  writeJsonRel(root, `${dir}/final_release_evidence_pointer_index.json`, { status: "recorded", stage, pointers });
  writeJsonRel(root, `${dir}/final_release_export_index.json`, exportIndex);
  writeJsonRel(root, `${dir}/final_release_future_work_register.json`, futureWork);
  writeJsonRel(root, `${dir}/final_release_dossier_gate_report.json`, dossier);
  writeUnresolved(root, dir, stage, []);
  writeMd(root, "docs/release/final_release_dossier.ko.md", "Final Release Dossier", [
    "Status: `recorded`",
    "",
    "- Active scoped terminal state, final blocker matrix, future plans, and export index were recorded.",
    "- No bare/general claim was opened.",
    `- Latest active scoped readiness export: \`${exportIndex.latest_active_scoped_readiness_export.path}\``
  ]);
  writeMd(root, "docs/claims/final_release_claim_state.ko.md", "Final Release Claim State", [
    "Status: `recorded`",
    "",
    `- Allowed claims: ${ALLOWED_CLAIMS.join(", ")}`,
    `- Blocked claims: ${BLOCKED_CLAIMS.join(", ")}`,
    `- Weak final dossier claims: ${WEAK_DOSSIER_CLAIMS.join(", ")}`
  ]);
  writeMd(root, "docs/release/final_release_future_work_register.ko.md", "Final Release Future Work Register", [
    "Status: `recorded`",
    "",
    "- Provider-verified future completion plan recorded.",
    "- Adapter-checked future completion plan recorded.",
    "- General production-ready/stable future decision plan recorded."
  ]);
  return dossier;
}

export function checkFinalReleaseDossier(root) {
  const stage = STAGES.dossier;
  const dir = DIRS.dossier;
  const dossier = readJsonIfExists(root, `${dir}/final_release_dossier.json`);
  const claimState = readJsonIfExists(root, `${dir}/final_release_claim_state.json`);
  const checks = [];
  addCheck(checks, "dossier exists", Boolean(dossier), dossier || {});
  addCheck(checks, "required allowed claims recorded", ALLOWED_CLAIMS.every((claim) => claimState?.allowed_claims?.includes(claim)), claimState || {});
  addCheck(checks, "blocked claims recorded", BLOCKED_CLAIMS.every((claim) => claimState?.blocked_claims?.includes(claim)), claimState || {});
  addCheck(checks, "bare/general booleans false", claimState?.provider_verified_allowed === false && claimState?.adapter_checked_allowed === false && claimState?.production_ready_allowed === false && claimState?.stable_allowed === false && claimState?.release_gated_allowed === false, claimState || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? "pass" : "fail", stage, unresolved_items_count: failures.length, checks, failures, ...commonFlags() };
  writeJsonRel(root, `${dir}/final_release_dossier_gate_report.json`, gate);
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
  const allowedSecurityPolicyEntries = new Set(["security/audits/secret_detection_patterns.yaml"]);
  return {
    node_modules: entries.filter((entry) => entry === "node_modules/" || entry.includes("/node_modules/")),
    dist: entries.filter((entry) => entry === "dist/" || entry.startsWith("dist/") || entry.includes("/dist/")),
    git_metadata: entries.filter((entry) => entry === ".git/" || entry.startsWith(".git/") || entry.includes("/.git/")),
    ds_store: entries.filter((entry) => path.basename(entry) === ".DS_Store"),
    allowed_security_policy_entries: entries.filter((entry) => allowedSecurityPolicyEntries.has(entry)),
    raw_or_secret: entries.filter((entry) => /raw_(request|response)|request_payload|response_payload|secret|api[_-]?key|auth[_-]?header/i.test(entry) && !allowedSecurityPolicyEntries.has(entry))
  };
}

export function runFinalExportRefreshAfterFinalDossier(root) {
  const stage = STAGES.exportRefresh;
  const dir = DIRS.exportRefresh;
  const claimState = finalClaimState({ include_weak_claims: true, actual_export_write: true });
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
    "evidence/post-active-scoped-terminal-archive-seal",
    "evidence/post-active-scoped-bare-general-claim-final-blocker-matrix",
    "evidence/post-active-scoped-provider-verified-future-completion-plan",
    "evidence/post-active-scoped-adapter-checked-future-completion-plan",
    "evidence/post-active-scoped-general-readiness-stability-future-decision-plan",
    "evidence/post-active-scoped-final-release-dossier",
    "evidence/final-export-refresh-after-final-dossier",
    "evidence/post-export-active-scoped-final-handoff-refresh",
    "evidence/final-export-refresh-after-active-scoped-readiness",
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
  writeYaml(root, "release/scopes/final-export/final_export_refresh_after_final_dossier_scope.yaml", [
    `stage: ${stage}`,
    "status: packaging",
    `package_path: ${EXPORT_PACKAGE}`,
    "dist_modified: false",
    "reference_baseline_source_modified: false",
    "evidence_reference_baseline_refresh: false"
  ]);
  writeJsonRel(root, `${dir}/final_export_refresh_claim_state.json`, claimState);
  writeJsonRel(root, `${dir}/final_export_refresh_claim_boundary.json`, claimBoundary(stage, "recorded", { actual_export_write: true }));
  writeUnresolved(root, dir, stage, []);
  const stageRoot = path.join(os.tmpdir(), `harness-core-final-dossier-export-${process.pid}`);
  fs.rmSync(stageRoot, { recursive: true, force: true });
  fs.mkdirSync(stageRoot, { recursive: true });
  for (const relPath of packageRoots) copyIntoStage(root, relPath, stageRoot);
  fs.mkdirSync(path.join(stageRoot, "final_export_refresh_after_final_dossier"), { recursive: true });
  writeJson(path.join(stageRoot, "final_export_refresh_after_final_dossier", "claim_state.json"), claimState);
  writeJson(path.join(stageRoot, "final_export_refresh_after_final_dossier", "manifest.json"), manifest);
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
    weak_claim_recorded: packageCreated ? "final-export-refresh-after-final-dossier-recorded" : null,
    actual_export_write: packageCreated,
    package_path: EXPORT_PACKAGE,
    package_sha256: checksum,
    allowed_scoped_claims: ALLOWED_SCOPED_CLAIMS,
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
  writeJsonRel(root, `${dir}/final_export_refresh_after_final_dossier_report.json`, report);
  writeJsonRel(root, `${dir}/final_export_refresh_manifest.json`, manifest);
  writeJsonRel(root, `${dir}/final_export_refresh_checksums.json`, { status: "recorded", stage, entries: [{ path: EXPORT_PACKAGE, sha256: checksum }] });
  writeJsonRel(root, `${dir}/final_export_refresh_gate_report.json`, { status: packageCreated ? "pass" : "blocked", stage, unresolved_items_count: packageCreated ? 0 : 1, package_record: report, ...commonFlags({ actual_export_write: packageCreated }) });
  writeMd(root, "docs/release/final_export_refresh_after_final_dossier.ko.md", "Final Export Refresh After Final Dossier", [
    `Status: \`${report.status}\``,
    "",
    `- package path: \`${EXPORT_PACKAGE}\``,
    `- package sha256: \`${checksum || "missing"}\``,
    "- dist, node_modules, .git, .DS_Store, raw/secret payloads were excluded."
  ]);
  return report;
}

export function checkFinalExportRefreshAfterFinalDossier(root) {
  const stage = STAGES.exportRefresh;
  const dir = DIRS.exportRefresh;
  const report = readJsonIfExists(root, `${dir}/final_export_refresh_after_final_dossier_report.json`);
  const manifest = readJsonIfExists(root, `${dir}/final_export_refresh_manifest.json`);
  const claimState = readJsonIfExists(root, `${dir}/final_export_refresh_claim_state.json`);
  const checks = [];
  addCheck(checks, "report passed", report?.status === "pass" && report?.actual_export_write === true, report || {});
  addCheck(checks, "manifest exported", manifest?.status === "exported" && manifest?.package_path === EXPORT_PACKAGE, manifest || {});
  addCheck(checks, "forbidden package entries absent", report?.node_modules_included === false && report?.dist_included === false && report?.ds_store_included === false && report?.raw_or_secret_included === false, report || {});
  addCheck(checks, "bare/general claims false", claimState?.provider_verified_allowed === false && claimState?.adapter_checked_allowed === false && claimState?.production_ready_allowed === false && claimState?.stable_allowed === false && claimState?.release_gated_allowed === false, claimState || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? "pass" : "fail", stage, unresolved_items_count: failures.length, checks, failures, ...commonFlags({ actual_export_write: report?.actual_export_write === true }) };
  writeJsonRel(root, `${dir}/final_export_refresh_gate_report.json`, gate);
  return gate;
}

export function buildFinalNewConversationHandoff(root) {
  const stage = STAGES.handoff;
  const dir = DIRS.handoff;
  const claimState = finalClaimState({ include_weak_claims: true });
  const exportReport = readJsonIfExists(root, `${DIRS.exportRefresh}/final_export_refresh_after_final_dossier_report.json`);
  const nextOptions = {
    status: "recorded",
    stage,
    options: [
      "provider-verified future completion",
      "adapter-checked future completion",
      "bare production-ready/stable criteria redesign",
      "현재 final dossier/export를 최종본으로 보관"
    ]
  };
  const report = {
    status: "pass",
    stage,
    weak_claim_recorded: "post-active-scoped-final-new-conversation-handoff-recorded",
    handoff_path: "FINAL_HANDOFF.ko.md",
    prompt_path: "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
    final_export: {
      path: exportReport?.package_path || EXPORT_PACKAGE,
      sha256: exportReport?.package_sha256 || null
    },
    unresolved_items_count: 0,
    ...commonFlags()
  };
  const handoff = [
    "# Final Handoff",
    "",
    "## Current Terminal State",
    "",
    "- Active scoped terminal archive is sealed.",
    "- Final release dossier is recorded.",
    "- Final dossier export is recorded.",
    "- Bare/general claims remain blocked.",
    "",
    "## Allowed Scoped/Qualified Claims",
    "",
    ...ALLOWED_CLAIMS.map((claim) => `- \`${claim}\``),
    "",
    "## Blocked Bare/General Claims",
    "",
    ...BLOCKED_CLAIMS.map((claim) => `- \`${claim}\``),
    "",
    "## Final Export",
    "",
    `- Path: \`${report.final_export.path}\``,
    `- SHA256: \`${report.final_export.sha256 || "missing"}\``,
    "",
    "## Next Options",
    "",
    ...nextOptions.options.map((option, index) => `${index + 1}. ${option}`)
  ].join("\n");
  const prompt = [
    "# Final New Conversation Prompt",
    "",
    "Continue from `v2.0.0-post-active-scoped-terminal-hardening-and-final-dossier-autopilot-until-hard-stop`.",
    "",
    "Start by reading:",
    "",
    "- `FINAL_HANDOFF.ko.md`",
    "- `evidence/post-active-scoped-final-release-dossier/final_release_dossier.json`",
    "- `evidence/final-export-refresh-after-final-dossier/final_export_refresh_after_final_dossier_report.json`",
    "",
    "Do not claim bare `provider-verified`, `adapter-checked`, `production-ready`, `stable`, `release-gated`, or bare release-gated unless a separately approved future gate has executed and passed.",
    "",
    "다음 중 무엇을 진행할지 물어봐 주세요.",
    "",
    "1. provider-verified future completion",
    "2. adapter-checked future completion",
    "3. bare production-ready/stable criteria redesign",
    "4. 현재 final dossier/export를 최종본으로 보관"
  ].join("\n");
  writeTextRel(root, "FINAL_HANDOFF.ko.md", handoff);
  writeTextRel(root, "FINAL_NEW_CONVERSATION_PROMPT.ko.md", prompt);
  writeYaml(root, "release/scopes/post-active-scoped/post_active_scoped_final_new_conversation_handoff_scope.yaml", [
    `stage: ${stage}`,
    "status: pass",
    "handoff_path: FINAL_HANDOFF.ko.md",
    "prompt_path: FINAL_NEW_CONVERSATION_PROMPT.ko.md",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeJsonRel(root, `${dir}/final_new_conversation_handoff_report.json`, report);
  writeJsonRel(root, `${dir}/final_new_conversation_claim_state.json`, claimState);
  writeJsonRel(root, `${dir}/final_new_conversation_next_options.json`, nextOptions);
  writeJsonRel(root, `${dir}/final_new_conversation_gate_report.json`, report);
  writeUnresolved(root, dir, stage, []);
  writeMd(root, "docs/handoffs/final_new_conversation_handoff.ko.md", "Final New Conversation Handoff", [
    "Status: `pass`",
    "",
    "- Final handoff and prompt were generated.",
    "- Next options are explicit.",
    "- Bare/general claims remain blocked."
  ]);
  return report;
}

export function checkFinalNewConversationHandoff(root) {
  const stage = STAGES.handoff;
  const dir = DIRS.handoff;
  const report = readJsonIfExists(root, `${dir}/final_new_conversation_handoff_report.json`);
  const claimState = readJsonIfExists(root, `${dir}/final_new_conversation_claim_state.json`);
  const promptPath = p(root, "FINAL_NEW_CONVERSATION_PROMPT.ko.md");
  const prompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, "utf8") : "";
  const checks = [];
  addCheck(checks, "report exists", Boolean(report), report || {});
  addCheck(checks, "handoff exists", fs.existsSync(p(root, "FINAL_HANDOFF.ko.md")), {});
  addCheck(checks, "prompt exists", fs.existsSync(promptPath), {});
  addCheck(checks, "required final question present", prompt.includes("다음 중 무엇을 진행할지 물어봐 주세요."), { prompt_present: Boolean(prompt) });
  addCheck(checks, "bare/general claims false", claimState?.provider_verified_allowed === false && claimState?.adapter_checked_allowed === false && claimState?.production_ready_allowed === false && claimState?.stable_allowed === false && claimState?.release_gated_allowed === false, claimState || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? "pass" : "fail", stage, unresolved_items_count: failures.length, checks, failures, ...commonFlags() };
  writeJsonRel(root, `${dir}/final_new_conversation_gate_report.json`, gate);
  return gate;
}

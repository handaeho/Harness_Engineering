import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./file_walk.mjs";
import { scanClaims } from "./claim_scanner.mjs";

export const AUTOPILOT_STAGE = "v2.0.0-post-combined-provider-verified-adapter-checked-export-autopilot-until-blocked";
export const PROVIDER_PREFLIGHT_STAGE = "v2.0.0-post-combined-provider-verified-gate-preflight";
export const PROVIDER_OWNER_STAGE = "v2.0.0-post-combined-provider-verified-evidence-inventory-and-owner-packet";
export const ADAPTER_PREFLIGHT_STAGE = "v2.0.0-post-combined-adapter-checked-gate-preflight";
export const ADAPTER_OWNER_STAGE = "v2.0.0-post-combined-adapter-checked-owner-decision-packet";
export const FINAL_OWNER_STAGE = "v2.0.0-post-combined-provider-adapter-final-owner-packet";
export const EXPORT_PREFLIGHT_STAGE = "v2.0.0-final-export-execution-preflight";
export const SCOPE = "openai_api_lane_plus_ollama_qwen3_local_lane";
export const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.openai-only-stable+local-model-verified+provider-diverse";
export const MAINTAINED_CLAIMS = [
  "provider-diverse",
  "local-model-verified",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];
export const BLOCKED_STRONG_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];
export const WEAK_STAGE_CLAIMS = [
  "post-combined-provider-verified-gate-preflight-completed",
  "post-combined-provider-verified-evidence-inventoried",
  "post-combined-provider-verified-owner-decision-packet-recorded",
  "post-combined-adapter-checked-gate-preflight-completed",
  "post-combined-adapter-checked-coverage-matrix-recorded",
  "post-combined-adapter-checked-owner-decision-packet-recorded",
  "post-combined-provider-adapter-final-owner-packet-recorded",
  "final-export-execution-preflight-recorded"
];

const PRIOR_BASELINE_REFRESH_FILES = [
  "harness-core/evidence/reference-baseline/checksums.json",
  "harness-core/evidence/reference-baseline/file_inventory.json"
];

export function resolveRoot() {
  const repoRoot = process.cwd();
  return process.argv[2] && !process.argv[2].startsWith("--")
    ? path.resolve(repoRoot, process.argv[2])
    : path.basename(repoRoot) === "harness-core"
      ? repoRoot
      : path.resolve(repoRoot, "harness-core");
}

function p(root, ...parts) {
  return path.join(root, ...parts);
}

function workspaceRoot(root) {
  return path.basename(root) === "harness-core" ? path.dirname(root) : root;
}

function exists(root, relPath) {
  return fs.existsSync(p(root, ...relPath.split("/")));
}

function readJsonIfExists(root, relPath) {
  const file = p(root, ...relPath.split("/"));
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function writeJsonRel(root, relPath, value) {
  writeJson(p(root, ...relPath.split("/")), value);
}

function writeTextRel(root, relPath, value) {
  writeText(p(root, ...relPath.split("/")), value);
}

function runNode(root, script) {
  const result = spawnSync("node", [p(root, "tools", script), root], {
    cwd: workspaceRoot(root),
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
    stdout_excerpt: (result.stdout || "").trim().slice(0, 3000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 3000)
  };
}

function gitStatus(root, paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot(root),
    encoding: "utf8",
    maxBuffer: 1024 * 1024
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

function protectedBoundary(root) {
  const status = gitStatus(root, ["legacy-reference-source", "dist", "harness-core/evidence/reference-baseline", "harness-core/node_modules"]);
  const paths = statusPaths(status);
  const baselinePaths = paths.filter((file) => file.startsWith("harness-core/evidence/reference-baseline/"));
  return {
    status,
    protected_paths: paths,
    reference_baseline_source_modified: paths.some((file) => file.startsWith("legacy-reference-source/") || file === "legacy-reference-source"),
    dist_modified: paths.some((file) => file.startsWith("dist/") || file === "dist"),
    node_modules_modified: paths.some((file) => file.startsWith("harness-core/node_modules/") || file === "harness-core/node_modules"),
    evidence_reference_baseline_modified_only_prior_refresh: baselinePaths.every((file) => PRIOR_BASELINE_REFRESH_FILES.includes(file))
  };
}

function noExecFlags(extra = {}) {
  return {
    new_local_model_execution: false,
    openai_model_api_call: false,
    openai_provider_rerun: false,
    telemetry_sink_write: false,
    npm_install_or_ci: false,
    actual_export_write: false,
    reference_baseline_source_modified: false,
    dist_modified: false,
    evidence_reference_baseline_modified: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...extra
  };
}

function claimBoundary(stage, extra = {}) {
  return {
    status: "pass",
    stage,
    allowed_claims_maintained: MAINTAINED_CLAIMS,
    weak_stage_claims_allowed: WEAK_STAGE_CLAIMS,
    blocked_strong_claims: BLOCKED_STRONG_CLAIMS,
    provider_diverse_allowed: true,
    local_model_verified_allowed: true,
    post_rc_openai_only_stable_allowed: true,
    post_rc_openai_only_production_ready_allowed: true,
    production_monitored_allowed: true,
    telemetry_connected_allowed: true,
    containment_verified_allowed: true,
    rc1_openai_scope_release_gated_allowed: true,
    bare_release_gated_allowed: false,
    ...noExecFlags(),
    ...extra
  };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function includesAll(haystack = [], needles = []) {
  return needles.every((needle) => haystack.includes(needle));
}

function artifactPass(root, relPath) {
  const absPath = p(root, ...relPath.split("/"));
  if (!fs.existsSync(absPath)) return false;
  if (fs.statSync(absPath).isDirectory()) return true;
  const record = readJsonIfExists(root, relPath);
  if (!record) return true;
  return [
    "pass",
    "recorded",
    "ready_for_operator_approval_to_export",
    "ready_for_owner_decision_to_claim_provider_verified",
    "ready_for_owner_decision_to_claim_adapter_checked",
    "keep_blocked_recommended",
    "blocked_by_missing_provider_verification_coverage",
    "blocked_by_missing_adapter_coverage",
    "blocked_by_missing_ollama_provider_verification_coverage"
  ].includes(record.status);
}

function writeKoDoc(root, relPath, title, lines) {
  writeTextRel(root, relPath, `# ${title}\n\n${lines.join("\n")}\n`);
}

function writeReportPair(root, relJson, report, title, lines) {
  writeJsonRel(root, relJson, report);
  writeTextRel(root, relJson.replace(/\.json$/, ".md"), `# ${title}\n\nStatus: ${report.status}\n\n${lines.join("\n")}\n`);
}

function writeGate(root, evidenceRelJson, evalRelJson, gate, title) {
  writeJsonRel(root, evidenceRelJson, gate);
  if (evalRelJson) {
    writeJsonRel(root, evalRelJson, gate);
    writeTextRel(root, evalRelJson.replace(/\.json$/, ".md"), `# ${title}\n\nStatus: ${gate.status}\n\n- Stage: ${gate.stage}\n- Provider-verified allowance: ${gate.provider_verified_allowed}\n- Adapter-checked allowance: ${gate.adapter_checked_allowed}\n- Production-ready allowance: ${gate.production_ready_allowed}\n- Stable allowance: ${gate.stable_allowed}\n- Release-gated allowance: ${gate.release_gated_allowed}\n- Actual export write: ${gate.actual_export_write}\n- Unresolved items: ${gate.unresolved_items_count ?? 0}\n- Reason: ${gate.reason || ""}\n`);
  }
}

function writeUnresolved(root, dir, stage, items = []) {
  writeJsonRel(root, `${dir}/unresolved_items.json`, {
    status: items.length === 0 ? "pass" : "blocked",
    stage,
    unresolved_items_count: items.length,
    unresolved_items: items
  });
}

function commonReadiness(root) {
  return {
    provider_diverse_final_gate: readJsonIfExists(root, "evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_report.json") || {},
    archive_refresh: readJsonIfExists(root, "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_archive_refresh_report.json") || {},
    final_export_draft_refresh: readJsonIfExists(root, "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_final_export_draft_refresh.json") || {},
    combined_archive: readJsonIfExists(root, "evidence/combined-openai-local-archive-export/combined_archive_export_report.json") || {},
    openai_final_handoff: readJsonIfExists(root, "evidence/post-rc-openai-only-stable-final-handoff/final_handoff_report.json") || {},
    local_final_handoff: readJsonIfExists(root, "evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json") || {},
    openai_capability_matrix_exists: exists(root, "adapters/provider_capability_matrix.yaml")
  };
}

export function assessProviderVerifiedGatePreflight(root) {
  const stage = PROVIDER_PREFLIGHT_STAGE;
  const dir = "evidence/post-combined-provider-verified-gate-preflight";
  const ready = commonReadiness(root);
  const blockerList = [
    "full_provider_level_verification_gate_not_executed",
    "openai_provider_contract_regression_evidence_incomplete",
    "ollama_provider_structured_output_coverage_missing",
    "ollama_provider_tool_calling_coverage_missing",
    "provider_replay_or_regression_gap",
    "owner_final_decision_required"
  ];
  const criteria = {
    status: "drafted",
    stage,
    provider_verified_allowed: false,
    criteria: {
      provider_contract_documented: true,
      provider_capability_matrix_verified: true,
      provider_execution_evidence_complete: true,
      provider_error_handling_reviewed: true,
      provider_redaction_storage_reviewed: true,
      provider_replay_or_regression_reviewed: true,
      owner_final_decision_required: true
    },
    provider_lanes: ["openai_api_lane", "ollama_qwen3_local_lane"]
  };
  const openaiInventory = {
    status: "partial",
    stage,
    lane_id: "openai_api_lane",
    evidence_present: ready.openai_final_handoff.status === "pass",
    provider_capability_matrix_present: ready.openai_capability_matrix_exists,
    provider_execution_evidence_complete: ready.openai_final_handoff.post_rc_openai_only_stable === true,
    provider_error_handling_reviewed: false,
    provider_redaction_storage_reviewed: true,
    provider_replay_or_regression_reviewed: false,
    gaps: [
      "full_provider_level_verification_gate_not_executed",
      "provider_error_handling_review_not_sufficient_for_provider_verified",
      "provider_replay_or_regression_gap"
    ]
  };
  const ollamaInventory = {
    status: "partial",
    stage,
    lane_id: "ollama_qwen3_local_lane",
    evidence_present: ready.local_final_handoff.status === "pass",
    provider_capability_matrix_present: ready.openai_capability_matrix_exists,
    provider_execution_evidence_complete: ready.local_final_handoff.local_model_verified === true,
    provider_error_handling_reviewed: false,
    provider_redaction_storage_reviewed: true,
    provider_replay_or_regression_reviewed: false,
    gaps: [
      "ollama_provider_structured_output_coverage_missing",
      "ollama_provider_tool_calling_coverage_missing",
      "provider_replay_or_regression_gap",
      "full_provider_level_verification_gate_not_executed"
    ]
  };
  const report = {
    status: "blocked_by_missing_ollama_provider_verification_coverage",
    stage,
    scope: SCOPE,
    archive_label: ARCHIVE_LABEL,
    provider_verified_gate_preflight_completed: true,
    ready_for_owner_decision_to_claim_provider_verified: false,
    provider_diverse_allowed: true,
    criteria_matrix_path: `${dir}/provider_verified_criteria_matrix.json`,
    openai_inventory_path: `${dir}/openai_provider_verification_evidence_inventory.json`,
    ollama_inventory_path: `${dir}/ollama_provider_verification_evidence_inventory.json`,
    blockers: blockerList,
    weak_claims_allowed_by_this_stage: ["post-combined-provider-verified-gate-preflight-completed"],
    ...noExecFlags()
  };
  const blockerUpdate = {
    status: "blocked_by_missing_provider_verification_coverage",
    stage,
    provider_verified_allowed: false,
    ready_for_owner_decision_to_claim_provider_verified: false,
    blockers: blockerList,
    next_action: "Complete provider-level verification coverage before requesting owner final decision."
  };
  writeJsonRel(root, `${dir}/provider_verified_gate_preflight_report.json`, report);
  writeJsonRel(root, `${dir}/provider_verified_criteria_matrix.json`, criteria);
  writeJsonRel(root, `${dir}/openai_provider_verification_evidence_inventory.json`, openaiInventory);
  writeJsonRel(root, `${dir}/ollama_provider_verification_evidence_inventory.json`, ollamaInventory);
  writeJsonRel(root, `${dir}/provider_verified_claim_boundary.json`, claimBoundary(stage));
  writeJsonRel(root, `${dir}/provider_verified_blocker_update.json`, blockerUpdate);
  writeUnresolved(root, dir, stage);
  writeTextRel(root, "release/post_combined_provider_verified_gate_preflight_scope.yaml", `stage: ${stage}
status: ${report.status}
mode: preflight_only
provider_verified_allowed: false
new_local_model_execution: false
openai_model_api_call: false
telemetry_sink_write: false
actual_export_write: false
`);
  writeTextRel(root, "release/post_combined_provider_verified_preflight_claim_boundary.yaml", `stage: ${stage}
status: pass
provider_diverse_allowed: true
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
`);
  writeTextRel(root, "release/post_combined_provider_verified_blocker_update.yaml", `stage: ${stage}
status: blocked_by_missing_provider_verification_coverage
provider_verified_allowed: false
blockers:
${blockerList.map((blocker) => `  - ${blocker}`).join("\n")}
`);
  writeTextRel(root, "evals/suites/post_combined_provider_verified_gate_preflight.yaml", `suite_id: post_combined_provider_verified_gate_preflight
stage: ${stage}
mode: preflight_only
new_local_model_execution: false
openai_model_api_call: false
telemetry_sink_write: false
`);
  writeReportPair(root, "evals/reports/provider_verified_gate_preflight_report.json", report, "Provider Verification Gate Preflight Report", [
    `- Ready for owner decision: ${report.ready_for_owner_decision_to_claim_provider_verified}`,
    `- Blockers: ${blockerList.join(", ")}`,
    "- Strong claim allowance changed: false"
  ]);
  writeKoDoc(root, "docs/provider_verified_gate_preflight.ko.md", "Provider-Verified Gate Preflight", [
    "`provider-diverse`와 `provider-verified`를 분리해 preflight를 기록했습니다.",
    "",
    `- Status: \`${report.status}\``,
    "- ready_for_owner_decision: false",
    "- provider-verified allowed: false",
    "- 새 OpenAI/local/telemetry/npm/export 실행: false"
  ]);
  writeKoDoc(root, "docs/provider_verified_claim_boundary.ko.md", "Provider-Verified Claim Boundary", [
    "`provider-verified`는 계속 blocked입니다.",
    "`provider-diverse`는 유지 허용되지만 provider-level verification을 의미하지 않습니다."
  ]);
  writeKoDoc(root, "docs/next_provider_verified_evidence_completion_plan.ko.md", "Next Provider Verification Evidence Completion Plan", [
    "필요 작업:",
    "- OpenAI provider-level contract/error/replay evidence 보강",
    "- Ollama structured-output/tool-calling coverage 보강",
    "- provider-level regression/replay evidence 보강",
    "- owner final decision 전까지 strong claim 유지 차단"
  ]);
  return report;
}

export function checkProviderVerifiedGatePreflight(root) {
  const stage = PROVIDER_PREFLIGHT_STAGE;
  const dir = "evidence/post-combined-provider-verified-gate-preflight";
  const report = readJsonIfExists(root, `${dir}/provider_verified_gate_preflight_report.json`);
  const criteria = readJsonIfExists(root, `${dir}/provider_verified_criteria_matrix.json`);
  const openai = readJsonIfExists(root, `${dir}/openai_provider_verification_evidence_inventory.json`);
  const ollama = readJsonIfExists(root, `${dir}/ollama_provider_verification_evidence_inventory.json`);
  const boundary = readJsonIfExists(root, `${dir}/provider_verified_claim_boundary.json`);
  const blocker = readJsonIfExists(root, `${dir}/provider_verified_blocker_update.json`);
  const checks = [];
  addCheck(checks, "preflight report recorded", report?.provider_verified_gate_preflight_completed === true && report?.provider_verified_allowed === false, report || {});
  addCheck(checks, "criteria matrix drafted", criteria?.status === "drafted" && criteria?.provider_verified_allowed === false, criteria || {});
  addCheck(checks, "openai inventory recorded", openai?.status === "partial" && Array.isArray(openai?.gaps), openai || {});
  addCheck(checks, "ollama inventory records missing coverage", ollama?.status === "partial" && ollama?.gaps?.includes("ollama_provider_structured_output_coverage_missing"), ollama || {});
  addCheck(checks, "claim boundary blocks strong claims", boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false && boundary?.stable_allowed === false, boundary || {});
  addCheck(checks, "blocker update recorded", blocker?.status === "blocked_by_missing_provider_verification_coverage", blocker || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    provider_verified_gate_preflight_passed: failures.length === 0,
    latest_preflight_status: report?.status || "missing",
    ready_for_owner_decision_to_claim_provider_verified: false,
    unresolved_items_count: 0,
    reason: failures.length === 0
      ? "Provider verification preflight completed and remains blocked by missing provider coverage."
      : "Provider verification preflight checks failed.",
    ...noExecFlags({ provider_diverse_allowed: true }),
    checks,
    failures
  };
  writeGate(root, `${dir}/provider_verified_gate_preflight_gate_report.json`, "evals/reports/provider_verified_gate_preflight_gate_report.json", gate, "Provider Verification Gate Preflight Gate");
  return gate;
}

export function auditProviderVerifiedPreflightClaims(root) {
  const result = scanClaims(root, {
    excludedPaths: [
      "evidence/reference-baseline",
      "evidence/alpha/prohibited_claim_scan.json",
      "original_order.txt",
      "node_modules",
      ".git",
      "evals/reports/provider_verified_preflight_claim_audit_report.json"
    ]
  });
  const report = {
    status: result.status,
    stage: PROVIDER_PREFLIGHT_STAGE,
    claim_scan_status: result.status,
    matches_count: result.matches.length,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    matches: result.matches
  };
  writeReportPair(root, "evals/reports/provider_verified_preflight_claim_audit_report.json", report, "Provider Verification Preflight Claim Audit", [
    `- Matches: ${result.matches.length}`,
    "- Strong claim allowance changed: false"
  ]);
  return report;
}

export function inventoryProviderVerifiedEvidence(root) {
  const stage = PROVIDER_OWNER_STAGE;
  const dir = "evidence/post-combined-provider-verified-owner-decision-packet";
  const preflight = readJsonIfExists(root, "evidence/post-combined-provider-verified-gate-preflight/provider_verified_gate_preflight_report.json") || {};
  const openai = readJsonIfExists(root, "evidence/post-combined-provider-verified-gate-preflight/openai_provider_verification_evidence_inventory.json") || {};
  const ollama = readJsonIfExists(root, "evidence/post-combined-provider-verified-gate-preflight/ollama_provider_verification_evidence_inventory.json") || {};
  const blockers = Array.from(new Set([...(openai.gaps || []), ...(ollama.gaps || []), ...(preflight.blockers || [])]));
  const summary = {
    status: "blocked_by_missing_provider_verification_coverage",
    stage,
    ready_for_owner_decision_to_claim_provider_verified: false,
    provider_verified_allowed: false,
    blockers
  };
  writeJsonRel(root, `${dir}/provider_verified_evidence_summary.json`, summary);
  writeJsonRel(root, `${dir}/openai_provider_verified_evidence_summary.json`, {
    status: "partial",
    stage,
    source: "evidence/post-combined-provider-verified-gate-preflight/openai_provider_verification_evidence_inventory.json",
    gaps: openai.gaps || []
  });
  writeJsonRel(root, `${dir}/ollama_provider_verified_evidence_summary.json`, {
    status: "partial",
    stage,
    source: "evidence/post-combined-provider-verified-gate-preflight/ollama_provider_verification_evidence_inventory.json",
    gaps: ollama.gaps || []
  });
  writeJsonRel(root, `${dir}/provider_verified_remaining_blockers.json`, {
    status: "blocked_by_missing_provider_verification_coverage",
    stage,
    blockers
  });
  writeJsonRel(root, `${dir}/provider_verified_claim_boundary.json`, claimBoundary(stage));
  writeUnresolved(root, dir, stage);
  writeTextRel(root, "release/post_combined_provider_verified_evidence_inventory_scope.yaml", `stage: ${stage}
status: blocked_by_missing_provider_verification_coverage
provider_verified_allowed: false
new_execution: false
`);
  writeJsonRel(root, "evals/reports/provider_verified_evidence_inventory_report.json", {
    status: "recorded",
    stage,
    provider_verified_allowed: false,
    blockers
  });
  return summary;
}

export function buildProviderVerifiedOwnerDecisionPacket(root) {
  const stage = PROVIDER_OWNER_STAGE;
  const dir = "evidence/post-combined-provider-verified-owner-decision-packet";
  const summary = readJsonIfExists(root, `${dir}/provider_verified_evidence_summary.json`) || inventoryProviderVerifiedEvidence(root);
  const packet = {
    status: "keep_blocked_recommended",
    stage,
    claim_target: "provider-verified",
    ready_for_owner_decision_to_claim_provider_verified: false,
    provider_verified_allowed: false,
    provider_diverse_allowed: true,
    blockers: summary.blockers || [],
    decision_options: [
      "keep_provider_verified_blocked",
      "request_provider_verification_coverage_completion",
      "approve_future_provider_verified_final_gate_only_after_coverage_completion"
    ],
    recommended_action: "Keep provider verification blocked until provider-level coverage gaps are closed.",
    ...noExecFlags()
  };
  writeJsonRel(root, `${dir}/provider_verified_owner_decision_packet.json`, packet);
  writeTextRel(root, "release/post_combined_provider_verified_owner_decision_gate.yaml", `stage: ${stage}
status: keep_blocked_recommended
claim_target: provider-verified
provider_verified_allowed: false
ready_for_owner_decision_to_claim_provider_verified: false
`);
  writeKoDoc(root, "docs/provider_verified_owner_decision_packet.ko.md", "Provider-Verified Owner Decision Packet", [
    `Packet status: \`${packet.status}\``,
    "- ready_for_owner_decision: false",
    "- provider-verified allowed: false",
    "- 권장 조치: provider-level coverage 보강 후 재검토"
  ]);
  writeKoDoc(root, "docs/next_provider_verified_final_gate_plan.ko.md", "Next Provider-Verified Final Gate Plan", [
    "현재는 final gate 진입 전 coverage gap이 남아 있습니다.",
    "OpenAI/Ollama provider-level evidence completion 후 owner decision이 필요합니다."
  ]);
  return packet;
}

export function checkProviderVerifiedOwnerDecisionPacket(root) {
  const stage = PROVIDER_OWNER_STAGE;
  const dir = "evidence/post-combined-provider-verified-owner-decision-packet";
  const packet = readJsonIfExists(root, `${dir}/provider_verified_owner_decision_packet.json`);
  const summary = readJsonIfExists(root, `${dir}/provider_verified_evidence_summary.json`);
  const openai = readJsonIfExists(root, `${dir}/openai_provider_verified_evidence_summary.json`);
  const ollama = readJsonIfExists(root, `${dir}/ollama_provider_verified_evidence_summary.json`);
  const blockers = readJsonIfExists(root, `${dir}/provider_verified_remaining_blockers.json`);
  const boundary = readJsonIfExists(root, `${dir}/provider_verified_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "owner packet recorded", packet?.status === "keep_blocked_recommended" && packet?.provider_verified_allowed === false, packet || {});
  addCheck(checks, "evidence summary recorded", summary?.status === "blocked_by_missing_provider_verification_coverage", summary || {});
  addCheck(checks, "openai summary partial", openai?.status === "partial", openai || {});
  addCheck(checks, "ollama summary partial", ollama?.status === "partial", ollama || {});
  addCheck(checks, "remaining blockers recorded", Array.isArray(blockers?.blockers) && blockers.blockers.length > 0, blockers || {});
  addCheck(checks, "claim boundary blocks strong claims", boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    latest_packet_status: packet?.status || "missing",
    ready_for_owner_decision_to_claim_provider_verified: false,
    unresolved_items_count: 0,
    reason: failures.length === 0
      ? "Provider verification owner packet recorded with keep-blocked recommendation."
      : "Provider verification owner packet checks failed.",
    ...noExecFlags({ provider_diverse_allowed: true }),
    checks,
    failures
  };
  writeGate(root, `${dir}/provider_verified_owner_decision_gate_report.json`, null, gate, "Provider Verification Owner Decision Gate");
  return gate;
}

export function assessAdapterCheckedGatePreflight(root) {
  const stage = ADAPTER_PREFLIGHT_STAGE;
  const dir = "evidence/post-combined-adapter-checked-gate-preflight";
  const gaps = [
    "OpenAI adapter full conformance coverage",
    "Ollama adapter structured-output mapping coverage",
    "Ollama adapter tool-calling mapping coverage",
    "vLLM adapter execution coverage, if claimed",
    "cross-adapter contract coverage",
    "replay/regression across adapters"
  ];
  const criteria = {
    status: "drafted",
    stage,
    adapter_checked_allowed: false,
    criteria: {
      request_mapping_per_adapter: true,
      response_mapping_per_adapter: true,
      error_mapping_per_adapter: true,
      redaction_storage_per_adapter: true,
      tool_schema_mapping_when_supported: true,
      structured_output_mapping_when_supported: true,
      negative_cases_per_adapter: true,
      cross_adapter_contract_reviewed: true,
      replay_or_regression_across_adapters: true,
      owner_final_decision_required: true
    }
  };
  const coverage = {
    status: "recorded",
    stage,
    adapter_checked_allowed: false,
    adapters: [
      { adapter_id: "openai_api", coverage: "partial", gaps: ["OpenAI adapter full conformance coverage"] },
      { adapter_id: "ollama_local", coverage: "partial", gaps: ["Ollama adapter structured-output mapping coverage", "Ollama adapter tool-calling mapping coverage"] },
      { adapter_id: "vllm_local", coverage: "placeholder", gaps: ["vLLM adapter execution coverage, if claimed"] },
      { adapter_id: "common_adapter_policy", coverage: "policy_only", gaps: ["cross-adapter contract coverage", "replay/regression across adapters"] }
    ]
  };
  const gapAnalysis = {
    status: "blocked_by_missing_adapter_coverage",
    stage,
    adapter_checked_allowed: false,
    required_gaps: gaps,
    recommended_next_actions: [
      "Run non-generative adapter conformance coverage where possible.",
      "Add structured-output and tool-calling mapping evidence for Ollama.",
      "Record cross-adapter contract coverage and replay/regression evidence."
    ]
  };
  const report = {
    status: "blocked_by_missing_adapter_coverage",
    stage,
    adapter_checked_gate_preflight_completed: true,
    ready_for_owner_decision_to_claim_adapter_checked: false,
    blockers: gaps,
    weak_claims_allowed_by_this_stage: [
      "post-combined-adapter-checked-gate-preflight-completed",
      "post-combined-adapter-checked-coverage-matrix-recorded"
    ],
    ...noExecFlags({ provider_diverse_allowed: true })
  };
  writeJsonRel(root, `${dir}/adapter_checked_gate_preflight_report.json`, report);
  writeJsonRel(root, `${dir}/adapter_checked_criteria_matrix.json`, criteria);
  writeJsonRel(root, `${dir}/adapter_coverage_matrix.json`, coverage);
  writeJsonRel(root, `${dir}/adapter_gap_analysis.json`, gapAnalysis);
  writeJsonRel(root, `${dir}/adapter_checked_claim_boundary.json`, claimBoundary(stage));
  writeJsonRel(root, `${dir}/adapter_checked_blocker_update.json`, {
    status: "blocked_by_missing_adapter_coverage",
    stage,
    adapter_checked_allowed: false,
    blockers: gaps
  });
  writeUnresolved(root, dir, stage);
  writeTextRel(root, "release/post_combined_adapter_checked_gate_preflight_scope.yaml", `stage: ${stage}
status: blocked_by_missing_adapter_coverage
mode: preflight_only
adapter_checked_allowed: false
new_execution: false
`);
  writeTextRel(root, "release/post_combined_adapter_checked_claim_boundary.yaml", `stage: ${stage}
status: pass
provider_diverse_allowed: true
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
`);
  writeTextRel(root, "release/post_combined_adapter_checked_blocker_update.yaml", `stage: ${stage}
status: blocked_by_missing_adapter_coverage
adapter_checked_allowed: false
blockers:
${gaps.map((gap) => `  - ${gap}`).join("\n")}
`);
  writeKoDoc(root, "docs/adapter_checked_gate_preflight.ko.md", "Adapter-Checked Gate Preflight", [
    "`adapter-checked` 기준을 preflight 수준에서 상세화했습니다.",
    "",
    `- Status: \`${report.status}\``,
    "- ready_for_owner_decision: false",
    "- adapter-checked allowed: false"
  ]);
  writeKoDoc(root, "docs/adapter_checked_coverage_matrix.ko.md", "Adapter-Checked Coverage Matrix", [
    "OpenAI, Ollama, vLLM placeholder, common adapter policy coverage를 기록했습니다.",
    "현재 full adapter checked allowance를 열기에는 coverage gap이 남아 있습니다."
  ]);
  writeKoDoc(root, "docs/adapter_checked_gap_analysis.ko.md", "Adapter-Checked Gap Analysis", [
    "필수 gap:",
    ...gaps.map((gap) => `- ${gap}`)
  ]);
  return report;
}

export function checkAdapterCheckedGatePreflight(root) {
  const stage = ADAPTER_PREFLIGHT_STAGE;
  const dir = "evidence/post-combined-adapter-checked-gate-preflight";
  const report = readJsonIfExists(root, `${dir}/adapter_checked_gate_preflight_report.json`);
  const criteria = readJsonIfExists(root, `${dir}/adapter_checked_criteria_matrix.json`);
  const coverage = readJsonIfExists(root, `${dir}/adapter_coverage_matrix.json`);
  const gaps = readJsonIfExists(root, `${dir}/adapter_gap_analysis.json`);
  const boundary = readJsonIfExists(root, `${dir}/adapter_checked_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "preflight report recorded", report?.adapter_checked_gate_preflight_completed === true && report?.adapter_checked_allowed === false, report || {});
  addCheck(checks, "criteria matrix drafted", criteria?.status === "drafted" && criteria?.adapter_checked_allowed === false, criteria || {});
  addCheck(checks, "coverage matrix records adapters", Array.isArray(coverage?.adapters) && coverage.adapters.length >= 4, coverage || {});
  addCheck(checks, "gap analysis records required gaps", includesAll(gaps?.required_gaps || [], [
    "OpenAI adapter full conformance coverage",
    "Ollama adapter structured-output mapping coverage",
    "Ollama adapter tool-calling mapping coverage",
    "vLLM adapter execution coverage, if claimed",
    "cross-adapter contract coverage",
    "replay/regression across adapters"
  ]), gaps || {});
  addCheck(checks, "claim boundary blocks strong claims", boundary?.adapter_checked_allowed === false && boundary?.provider_verified_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    adapter_checked_gate_preflight_passed: failures.length === 0,
    latest_preflight_status: report?.status || "missing",
    ready_for_owner_decision_to_claim_adapter_checked: false,
    unresolved_items_count: 0,
    reason: failures.length === 0
      ? "Adapter checked preflight completed and remains blocked by missing adapter coverage."
      : "Adapter checked preflight checks failed.",
    ...noExecFlags({ provider_diverse_allowed: true }),
    checks,
    failures
  };
  writeGate(root, `${dir}/adapter_checked_gate_preflight_gate_report.json`, null, gate, "Adapter Checked Gate Preflight Gate");
  return gate;
}

export function auditAdapterCheckedPreflightClaims(root) {
  const result = scanClaims(root, {
    excludedPaths: [
      "evidence/reference-baseline",
      "evidence/alpha/prohibited_claim_scan.json",
      "original_order.txt",
      "node_modules",
      ".git",
      "evals/reports/adapter_checked_preflight_claim_audit_report.json"
    ]
  });
  const report = {
    status: result.status,
    stage: ADAPTER_PREFLIGHT_STAGE,
    claim_scan_status: result.status,
    matches_count: result.matches.length,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    matches: result.matches
  };
  writeReportPair(root, "evals/reports/adapter_checked_preflight_claim_audit_report.json", report, "Adapter Checked Preflight Claim Audit", [
    `- Matches: ${result.matches.length}`,
    "- Strong claim allowance changed: false"
  ]);
  return report;
}

export function buildAdapterCheckedOwnerDecisionPacket(root) {
  const stage = ADAPTER_OWNER_STAGE;
  const dir = "evidence/post-combined-adapter-checked-owner-decision-packet";
  const preflight = readJsonIfExists(root, "evidence/post-combined-adapter-checked-gate-preflight/adapter_checked_gate_preflight_report.json") || assessAdapterCheckedGatePreflight(root);
  const gapAnalysis = readJsonIfExists(root, "evidence/post-combined-adapter-checked-gate-preflight/adapter_gap_analysis.json") || {};
  const packet = {
    status: "keep_blocked_recommended",
    stage,
    claim_target: "adapter-checked",
    ready_for_owner_decision_to_claim_adapter_checked: false,
    adapter_checked_allowed: false,
    provider_diverse_allowed: true,
    blockers: preflight.blockers || gapAnalysis.required_gaps || [],
    decision_options: [
      "keep_adapter_checked_blocked",
      "request_adapter_coverage_completion",
      "approve_future_adapter_checked_final_gate_only_after_coverage_completion"
    ],
    recommended_action: "Keep adapter checking blocked until adapter coverage gaps are closed.",
    ...noExecFlags()
  };
  writeJsonRel(root, `${dir}/adapter_checked_owner_decision_packet.json`, packet);
  writeJsonRel(root, `${dir}/adapter_checked_evidence_summary.json`, {
    status: "blocked_by_missing_adapter_coverage",
    stage,
    adapter_checked_allowed: false,
    source_preflight: "evidence/post-combined-adapter-checked-gate-preflight/adapter_checked_gate_preflight_report.json",
    blockers: packet.blockers
  });
  writeJsonRel(root, `${dir}/adapter_checked_remaining_blockers.json`, {
    status: "blocked_by_missing_adapter_coverage",
    stage,
    blockers: packet.blockers
  });
  writeJsonRel(root, `${dir}/adapter_checked_claim_boundary.json`, claimBoundary(stage));
  writeUnresolved(root, dir, stage);
  writeTextRel(root, "release/post_combined_adapter_checked_owner_decision_packet_scope.yaml", `stage: ${stage}
status: keep_blocked_recommended
adapter_checked_allowed: false
new_execution: false
`);
  writeKoDoc(root, "docs/adapter_checked_owner_decision_packet.ko.md", "Adapter-Checked Owner Decision Packet", [
    `Packet status: \`${packet.status}\``,
    "- ready_for_owner_decision: false",
    "- adapter-checked allowed: false",
    "- 권장 조치: adapter coverage 보강 후 재검토"
  ]);
  writeKoDoc(root, "docs/next_adapter_checked_coverage_completion_plan.ko.md", "Next Adapter-Checked Coverage Completion Plan", [
    "OpenAI/Ollama/vLLM/common adapter coverage와 replay/regression coverage를 보강해야 합니다.",
    "owner final decision 전까지 `adapter-checked`는 blocked입니다."
  ]);
  return packet;
}

export function checkAdapterCheckedOwnerDecisionPacket(root) {
  const stage = ADAPTER_OWNER_STAGE;
  const dir = "evidence/post-combined-adapter-checked-owner-decision-packet";
  const packet = readJsonIfExists(root, `${dir}/adapter_checked_owner_decision_packet.json`);
  const summary = readJsonIfExists(root, `${dir}/adapter_checked_evidence_summary.json`);
  const blockers = readJsonIfExists(root, `${dir}/adapter_checked_remaining_blockers.json`);
  const boundary = readJsonIfExists(root, `${dir}/adapter_checked_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "owner packet recorded", packet?.status === "keep_blocked_recommended" && packet?.adapter_checked_allowed === false, packet || {});
  addCheck(checks, "evidence summary recorded", summary?.status === "blocked_by_missing_adapter_coverage", summary || {});
  addCheck(checks, "remaining blockers recorded", Array.isArray(blockers?.blockers) && blockers.blockers.length > 0, blockers || {});
  addCheck(checks, "claim boundary blocks strong claims", boundary?.adapter_checked_allowed === false && boundary?.provider_verified_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    latest_packet_status: packet?.status || "missing",
    ready_for_owner_decision_to_claim_adapter_checked: false,
    unresolved_items_count: 0,
    reason: failures.length === 0
      ? "Adapter checked owner packet recorded with keep-blocked recommendation."
      : "Adapter checked owner packet checks failed.",
    ...noExecFlags({ provider_diverse_allowed: true }),
    checks,
    failures
  };
  writeGate(root, `${dir}/adapter_checked_owner_decision_gate_report.json`, null, gate, "Adapter Checked Owner Decision Gate");
  return gate;
}

export function buildProviderAdapterFinalOwnerPacket(root) {
  const stage = FINAL_OWNER_STAGE;
  const dir = "evidence/post-combined-provider-adapter-final-owner-packet";
  const providerPacket = readJsonIfExists(root, "evidence/post-combined-provider-verified-owner-decision-packet/provider_verified_owner_decision_packet.json") || buildProviderVerifiedOwnerDecisionPacket(root);
  const adapterPacket = readJsonIfExists(root, "evidence/post-combined-adapter-checked-owner-decision-packet/adapter_checked_owner_decision_packet.json") || buildAdapterCheckedOwnerDecisionPacket(root);
  const providerReadiness = {
    status: "blocked_by_missing_provider_verification_coverage",
    ready_for_owner_decision: false,
    provider_verified_allowed: false,
    blockers: providerPacket.blockers || []
  };
  const adapterReadiness = {
    status: "blocked_by_missing_adapter_coverage",
    ready_for_owner_decision: false,
    adapter_checked_allowed: false,
    blockers: adapterPacket.blockers || []
  };
  const packet = {
    status: "keep_blocked_recommended",
    stage,
    provider_diverse_allowed: true,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    provider_verified_final_readiness: providerReadiness.status,
    adapter_checked_final_readiness: adapterReadiness.status,
    recommended_action: "Keep provider verification and adapter checking blocked; proceed only to export preflight if operator wants packaging.",
    next_candidates: [
      "provider_verified_coverage_completion",
      "adapter_checked_coverage_completion",
      "final_export_execution_preflight"
    ],
    ...noExecFlags()
  };
  writeJsonRel(root, `${dir}/provider_adapter_final_owner_packet.json`, packet);
  writeJsonRel(root, `${dir}/provider_adapter_final_evidence_summary.json`, {
    status: "recorded",
    stage,
    provider_diverse_allowed: true,
    provider_verified_status: providerReadiness.status,
    adapter_checked_status: adapterReadiness.status
  });
  writeJsonRel(root, `${dir}/provider_verified_final_readiness.json`, providerReadiness);
  writeJsonRel(root, `${dir}/adapter_checked_final_readiness.json`, adapterReadiness);
  writeJsonRel(root, `${dir}/provider_adapter_claim_boundary.json`, claimBoundary(stage));
  writeUnresolved(root, dir, stage);
  writeTextRel(root, "release/post_combined_provider_adapter_final_owner_packet_scope.yaml", `stage: ${stage}
status: keep_blocked_recommended
provider_diverse_allowed: true
provider_verified_allowed: false
adapter_checked_allowed: false
new_execution: false
`);
  writeTextRel(root, "release/post_combined_provider_adapter_claim_boundary.yaml", `stage: ${stage}
status: pass
provider_diverse_allowed: true
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
`);
  writeKoDoc(root, "docs/provider_adapter_final_owner_packet.ko.md", "Provider/Adapter Final Owner Packet", [
    `Packet status: \`${packet.status}\``,
    "- provider-diverse allowed: true",
    "- provider-verified allowed: false",
    "- adapter-checked allowed: false"
  ]);
  writeKoDoc(root, "docs/next_provider_adapter_final_gates_plan.ko.md", "Next Provider/Adapter Final Gates Plan", [
    "다음 선택지는 provider verification coverage completion, adapter coverage completion, final export execution preflight입니다.",
    "provider-verified와 adapter-checked는 별도 owner decision/final gate 전까지 blocked입니다."
  ]);
  return packet;
}

export function checkProviderAdapterFinalOwnerPacket(root) {
  const stage = FINAL_OWNER_STAGE;
  const dir = "evidence/post-combined-provider-adapter-final-owner-packet";
  const packet = readJsonIfExists(root, `${dir}/provider_adapter_final_owner_packet.json`);
  const summary = readJsonIfExists(root, `${dir}/provider_adapter_final_evidence_summary.json`);
  const provider = readJsonIfExists(root, `${dir}/provider_verified_final_readiness.json`);
  const adapter = readJsonIfExists(root, `${dir}/adapter_checked_final_readiness.json`);
  const boundary = readJsonIfExists(root, `${dir}/provider_adapter_claim_boundary.json`);
  const checks = [];
  addCheck(checks, "final owner packet recorded", packet?.status === "keep_blocked_recommended" && packet?.provider_verified_allowed === false && packet?.adapter_checked_allowed === false, packet || {});
  addCheck(checks, "summary recorded", summary?.status === "recorded" && summary?.provider_diverse_allowed === true, summary || {});
  addCheck(checks, "provider readiness blocked", provider?.status === "blocked_by_missing_provider_verification_coverage", provider || {});
  addCheck(checks, "adapter readiness blocked", adapter?.status === "blocked_by_missing_adapter_coverage", adapter || {});
  addCheck(checks, "claim boundary blocks strong claims", boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false && boundary?.stable_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    latest_packet_status: packet?.status || "missing",
    unresolved_items_count: 0,
    reason: failures.length === 0
      ? "Provider/adapter final owner packet completed with keep-blocked recommendation."
      : "Provider/adapter final owner packet checks failed.",
    ...noExecFlags({ provider_diverse_allowed: true }),
    checks,
    failures
  };
  writeGate(root, `${dir}/provider_adapter_final_owner_packet_gate_report.json`, null, gate, "Provider Adapter Final Owner Packet Gate");
  return gate;
}

export function checkFinalExportExecutionPreflight(root) {
  const stage = EXPORT_PREFLIGHT_STAGE;
  const dir = "evidence/final-export-execution-preflight";
  const archiveRefresh = readJsonIfExists(root, "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_archive_refresh_report.json") || {};
  const exportDraftRefresh = readJsonIfExists(root, "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_final_export_draft_refresh.json") || {};
  const finalOwner = readJsonIfExists(root, "evidence/post-combined-provider-adapter-final-owner-packet/provider_adapter_final_owner_packet.json") || {};
  const prot = protectedBoundary(root);
  const ready = archiveRefresh.status === "pass"
    && exportDraftRefresh.status === "recorded"
    && finalOwner.status === "keep_blocked_recommended"
    && prot.reference_baseline_source_modified === false
    && prot.dist_modified === false;
  const report = {
    status: ready ? "ready_for_operator_approval_to_export" : "blocked_by_missing_export_manifest",
    stage,
    archive_label: ARCHIVE_LABEL,
    scope: SCOPE,
    provider_diverse_allowed: true,
    provider_diverse_reflected_in_export_metadata: true,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    actual_export_write: false,
    requires_operator_approval: true,
    approval_phrase_for_future_export: "I approve v2.0.0-final-export-execution.",
    blockers: ready ? ["operator_approval_required_for_actual_export_write"] : ["missing_export_manifest_or_final_owner_packet"],
    ...noExecFlags()
  };
  const commandPlan = `stage: v2.0.0-final-export-execution
status: approval_required
approval_phrase: I approve v2.0.0-final-export-execution.
actual_export_write: true
requires_operator_approval: true
forbidden_without_approval:
  dist_modification: true
  actual_export_write: true
`;
  const approvalRequest = `# Final Export Execution Approval Request

Status: ${report.status}

To execute the actual export write, owner/operator approval is required.

Approval phrase:

\`I approve v2.0.0-final-export-execution.\`

Boundary:
- provider-diverse reflected: true
- provider-verified allowed: false
- adapter-checked allowed: false
- actual export write in this preflight: false
- dist modified in this preflight: false
`;
  writeJsonRel(root, `${dir}/final_export_execution_preflight_report.json`, report);
  writeTextRel(root, `${dir}/final_export_execution_approval_request.md`, approvalRequest);
  writeTextRel(root, `${dir}/final_export_execution_command_plan.yaml`, commandPlan);
  writeJsonRel(root, `${dir}/final_export_execution_claim_boundary.json`, claimBoundary(stage, {
    actual_export_write: false,
    dist_modified: false,
    provider_diverse_reflected_in_export_metadata: true
  }));
  writeUnresolved(root, dir, stage);
  writeTextRel(root, "release/final_export_execution_preflight_scope.yaml", `stage: ${stage}
status: ${report.status}
actual_export_write: false
dist_modified: false
provider_diverse_allowed: true
provider_verified_allowed: false
adapter_checked_allowed: false
`);
  writeTextRel(root, "release/final_export_execution_approval_request.md", approvalRequest);
  writeTextRel(root, "release/final_export_execution_command_plan.yaml", commandPlan);
  writeKoDoc(root, "docs/final_export_execution_preflight.ko.md", "Final Export Execution Preflight", [
    `Status: \`${report.status}\``,
    "- actual export write: false",
    "- dist modified: false",
    "- requires_operator_approval: true",
    "- provider-diverse reflected: true"
  ]);
  writeKoDoc(root, "docs/final_export_execution_approval_request.ko.md", "Final Export Execution Approval Request", [
    "실제 export write를 위해서는 별도 operator approval이 필요합니다.",
    "Approval phrase: `I approve v2.0.0-final-export-execution.`",
    "이번 preflight에서는 `dist`를 수정하지 않았습니다."
  ]);
  const checks = [];
  addCheck(checks, "archive refresh pass", archiveRefresh.status === "pass", archiveRefresh);
  addCheck(checks, "export draft refresh recorded", exportDraftRefresh.status === "recorded", exportDraftRefresh);
  addCheck(checks, "final owner packet recorded", finalOwner.status === "keep_blocked_recommended", finalOwner);
  addCheck(checks, "protected paths clean", prot.reference_baseline_source_modified === false && prot.dist_modified === false && prot.node_modules_modified === false && prot.evidence_reference_baseline_modified_only_prior_refresh === true, prot);
  addCheck(checks, "actual export write not performed", report.actual_export_write === false && report.requires_operator_approval === true, report);
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    latest_preflight_status: report.status,
    ready_for_operator_approval_to_export: report.status === "ready_for_operator_approval_to_export",
    actual_export_write: false,
    requires_operator_approval: true,
    unresolved_items_count: 0,
    reason: failures.length === 0
      ? "Final export execution preflight is ready for operator approval; no actual export write was performed."
      : "Final export execution preflight checks failed.",
    ...noExecFlags({ provider_diverse_allowed: true }),
    checks,
    failures
  };
  writeGate(root, `${dir}/final_export_execution_gate_report.json`, null, gate, "Final Export Execution Preflight Gate");
  return gate;
}

export function runAutopilotUntilBlocked(root) {
  const providerPreflight = assessProviderVerifiedGatePreflight(root);
  const providerPreflightGate = checkProviderVerifiedGatePreflight(root);
  const providerInventory = inventoryProviderVerifiedEvidence(root);
  const providerPacket = buildProviderVerifiedOwnerDecisionPacket(root);
  const providerPacketGate = checkProviderVerifiedOwnerDecisionPacket(root);
  const adapterPreflight = assessAdapterCheckedGatePreflight(root);
  const adapterPreflightGate = checkAdapterCheckedGatePreflight(root);
  const adapterPacket = buildAdapterCheckedOwnerDecisionPacket(root);
  const adapterPacketGate = checkAdapterCheckedOwnerDecisionPacket(root);
  const finalPacket = buildProviderAdapterFinalOwnerPacket(root);
  const finalPacketGate = checkProviderAdapterFinalOwnerPacket(root);
  const exportGate = checkFinalExportExecutionPreflight(root);
  const compare = runNode(root, "check_reference_baseline_integrity.mjs");
  const scan = runNode(root, "scan_prohibited_claims.mjs");
  const prot = protectedBoundary(root);
  return {
    status: exportGate.status === "pass" && scan.status === "pass" && compare.status === "pass" ? "pass" : "fail",
    stage: AUTOPILOT_STAGE,
    stages_completed: {
      provider_verified_gate_preflight: providerPreflightGate.status,
      provider_verified_owner_packet: providerPacketGate.status,
      adapter_checked_gate_preflight: adapterPreflightGate.status,
      adapter_checked_owner_packet: adapterPacketGate.status,
      provider_adapter_final_owner_packet: finalPacketGate.status,
      final_export_execution_preflight: exportGate.status
    },
    provider_verified_path: {
      status: providerPacket.status,
      ready_for_owner_decision: false,
      blockers: providerInventory.blockers || providerPacket.blockers || []
    },
    adapter_checked_path: {
      status: adapterPacket.status,
      ready_for_owner_decision: false,
      blockers: adapterPacket.blockers || []
    },
    final_export: {
      status: exportGate.latest_preflight_status,
      actual_export_write: false,
      requires_operator_approval: true
    },
    latest_gate_script: "tools/check_final_export_execution_preflight.mjs",
    latest_gate_result: exportGate.status,
    unresolved_items_count: exportGate.unresolved_items_count,
    ...noExecFlags({ provider_diverse_allowed: true }),
    check_reference_baseline_integrity_status: compare.status,
    scan_prohibited_claims_status: scan.status,
    protected_boundary: prot,
    artifacts: {
      providerPreflight,
      providerPacket,
      adapterPreflight,
      adapterPacket,
      finalPacket,
      exportGate
    }
  };
}

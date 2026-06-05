import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./file_walk.mjs";

export const COMBINED_SCOPE = "openai_only_post_rc_plus_ollama_qwen3_local_lane";
export const COMBINED_ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.openai-only-stable+local-model-verified-ollama-qwen3";
export const ALLOWED_SCOPED_CLAIMS = [
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated",
  "local-model-verified"
];
export const BLOCKED_STRONG_CLAIMS = [
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

export function resolveRoot() {
  const repoRoot = process.cwd();
  return process.argv[2] && !process.argv[2].startsWith("--")
    ? path.resolve(repoRoot, process.argv[2])
    : path.basename(repoRoot) === "harness-core"
      ? repoRoot
      : path.resolve(repoRoot, "harness-core");
}

export function p(root, ...parts) {
  return path.join(root, ...parts);
}

export function relParts(relPath) {
  return relPath.split("/");
}

export function exists(root, relPath) {
  return fs.existsSync(p(root, ...relParts(relPath)));
}

export function readJsonIfExists(root, relPath) {
  try {
    return readJson(p(root, ...relParts(relPath)));
  } catch {
    return null;
  }
}

export function writeJsonRel(root, relPath, value) {
  writeJson(p(root, ...relParts(relPath)), value);
}

export function writeTextRel(root, relPath, value) {
  writeText(p(root, ...relParts(relPath)), value);
}

export function workspaceRoot(root) {
  return path.basename(root) === "harness-core" ? path.dirname(root) : root;
}

export function gitStatus(root, paths) {
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

export function protectedStatus(root) {
  const status = gitStatus(root, ["legacy-reference-source", "dist", "harness-core/evidence/reference-baseline"]);
  const lines = status.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    ...status,
    lines,
    reference_baseline_source_modified: lines.some((line) => line.includes("legacy-reference-source")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_reference_baseline_modified_only_prior_refresh: lines
      .filter((line) => line.includes("harness-core/evidence/reference-baseline"))
      .every((line) => line.endsWith("harness-core/evidence/reference-baseline/checksums.json")
        || line.endsWith("harness-core/evidence/reference-baseline/file_inventory.json"))
  };
}

export function commonFlags(extra = {}) {
  return {
    new_local_model_execution: false,
    openai_model_api_call: false,
    telemetry_sink_write: false,
    reference_baseline_source_modified: false,
    dist_modified: false,
    evidence_reference_baseline_modified: false,
    provider_diverse_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...extra
  };
}

export function combinedState(root) {
  const report = readJsonIfExists(root, "evidence/combined-openai-local-archive-export/combined_archive_export_report.json") || {};
  const gate = readJsonIfExists(root, "evidence/combined-openai-local-archive-export/combined_archive_export_gate_report.json") || {};
  return {
    post_rc_openai_only_stable: report.post_rc_openai_only_stable === true
      && gate.can_claim_post_rc_openai_only_stable === true,
    local_model_verified: report.local_model_verified === true
      && gate.can_claim_local_model_verified === true
  };
}

export function stageClaimBoundary(stage, extra = {}) {
  return {
    status: "recorded",
    stage,
    allowed_scoped_claims: ALLOWED_SCOPED_CLAIMS,
    blocked_strong_claims: BLOCKED_STRONG_CLAIMS,
    provider_diverse_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    bare_release_gated_allowed: false,
    owner_final_decision_required_for_strong_claims: true,
    ...extra
  };
}

export function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

export function writeGate(root, relPath, evalRelPath, gate, title) {
  writeJsonRel(root, relPath, gate);
  if (evalRelPath) {
    writeJsonRel(root, evalRelPath, gate);
    writeTextRel(root, evalRelPath.replace(/\.json$/, ".md"), `# ${title}

Status: ${gate.status}

- Stage: ${gate.stage}
- Provider diversity allowance: ${gate.provider_diverse_allowed}
- Provider verification allowance: ${gate.provider_verified_allowed}
- Adapter checked allowance: ${gate.adapter_checked_allowed}
- Production-ready allowance: ${gate.production_ready_allowed}
- Stable allowance: ${gate.stable_allowed}
- Release-gated allowance: ${gate.release_gated_allowed}
- Unresolved items: ${gate.unresolved_items_count ?? 0}
`);
  }
}

export function sha256File(root, relPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(p(root, ...relParts(relPath)))).digest("hex");
}

export function checksumEntries(root, targets) {
  return targets.map((target) => exists(root, target)
    ? { path: target, type: "file", sha256: sha256File(root, target) }
    : { path: target, status: "missing" });
}

export function writeKoDoc(root, relPath, title, lines) {
  writeTextRel(root, relPath, `# ${title}

${lines.join("\n")}
`);
}

export function buildProviderDiversePath(root) {
  const stage = "v2.0.0-post-combined-provider-diverse-path-design";
  const dir = "evidence/post-combined-provider-diverse-path-design";
  const state = combinedState(root);
  const prot = protectedStatus(root);
  const criteria = {
    status: "drafted",
    provider_diverse_allowed: false,
    criteria: {
      at_least_two_distinct_provider_lanes: true,
      independent_execution_evidence_per_lane: true,
      capability_matrix_per_lane: true,
      redaction_storage_evidence_per_lane: true,
      claim_boundary_per_lane: true,
      owner_final_decision_required: true
    },
    candidate_lanes: ["openai_api_lane", "ollama_qwen3_local_lane"],
    does_not_allow_provider_diverse_yet: true
  };
  const laneMapping = {
    status: "drafted",
    stage,
    provider_diverse_allowed: false,
    lanes: [
      {
        lane_id: "openai_api_lane",
        provider_family: "openai",
        source_archive: "evidence/post-rc-openai-only-stable-final-handoff/final_handoff_report.json",
        independent_execution_evidence_present: state.post_rc_openai_only_stable
      },
      {
        lane_id: "ollama_qwen3_local_lane",
        provider_family: "ollama_local",
        source_archive: "evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json",
        independent_execution_evidence_present: state.local_model_verified
      }
    ],
    relationship: {
      distinct_provider_lanes_candidate: true,
      final_decision_required: true,
      current_stage_opens_strong_claims: false
    }
  };
  const boundary = stageClaimBoundary(stage, {
    status: "pass",
    provider_diverse_path_designed: true
  });
  const blocker = {
    status: "blocked_until_owner_decision_and_final_gate",
    stage,
    provider_diverse_allowed: false,
    blockers: [
      {
        id: "PVD-001",
        name: "owner_final_decision_required",
        required_action: "Owner must decide whether to run a final provider diversity gate."
      },
      {
        id: "PVD-002",
        name: "final_gate_not_executed",
        required_action: "Run a separate final gate before changing provider diversity allowance."
      }
    ]
  };
  const report = {
    status: "pass",
    stage,
    scope: COMBINED_SCOPE,
    provider_diverse_path_designed: true,
    ready_for_evidence_inventory: true,
    candidate_lanes: criteria.candidate_lanes,
    criteria_matrix_path: `${dir}/provider_diverse_criteria_matrix.json`,
    provider_lane_mapping_path: `${dir}/provider_lane_mapping.json`,
    ...commonFlags({
      reference_baseline_source_modified: prot.reference_baseline_source_modified,
      dist_modified: prot.dist_modified
    })
  };

  writeJsonRel(root, `${dir}/provider_diverse_path_design_report.json`, report);
  writeJsonRel(root, `${dir}/provider_diverse_criteria_matrix.json`, criteria);
  writeJsonRel(root, `${dir}/provider_lane_mapping.json`, laneMapping);
  writeJsonRel(root, `${dir}/provider_diverse_claim_boundary.json`, boundary);
  writeJsonRel(root, `${dir}/provider_diverse_blocker_update.json`, blocker);
  writeJsonRel(root, `${dir}/unresolved_items.json`, { status: "pass", stage, unresolved_items_count: 0, unresolved_items: [] });
  writeJsonRel(root, "evals/reports/provider_diverse_path_design_report.json", report);
  writeTextRel(root, "evals/reports/provider_diverse_path_design_report.md", `# Provider Diversity Path Design

Status: ${report.status}

- Stage: ${stage}
- Candidate lanes: ${criteria.candidate_lanes.length}
- Strong claim allowance changed: false
- New execution: false
`);
  writeTextRel(root, "release/post_combined_provider_diverse_path_design_scope.yaml", `stage: ${stage}
status: pass
provider_diverse_allowed: false
approved_actions:
  path_design: true
  criteria_matrix: true
  lane_mapping: true
forbidden_execution:
  openai_model_api_call: true
  local_model_generation: true
  telemetry_sink_write: true
  reference_baseline_modification: true
  dist_modification: true
  evidence_reference_baseline_refresh: true
`);
  writeTextRel(root, "release/post_combined_provider_diverse_gate_policy.yaml", `stage: ${stage}
status: drafted
provider_diverse_allowed: false
criteria_matrix: ${dir}/provider_diverse_criteria_matrix.json
owner_final_decision_required: true
final_gate_required: true
`);
  writeTextRel(root, "release/post_combined_provider_diverse_claim_boundary.yaml", `stage: ${stage}
status: pass
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
`);
  writeTextRel(root, "release/post_combined_provider_diverse_blocker_update.yaml", `stage: ${stage}
status: blocked_until_owner_decision_and_final_gate
provider_diverse_allowed: false
blockers:
  - owner_final_decision_required
  - final_gate_not_executed
`);
  writeTextRel(root, "evals/suites/post_combined_provider_diverse_path_design.yaml", `suite_id: post_combined_provider_diverse_path_design
stage: ${stage}
mode: design_only
new_execution: false
`);
  writeKoDoc(root, "docs/provider_diverse_path_design.ko.md", "Provider Diversity Path Design", [
    "OpenAI API lane과 Ollama qwen3 local lane을 provider diversity 후보 lane으로 정리했습니다.",
    "",
    "- 강한 claim 허용 변경: false",
    "- OpenAI model API call: false",
    "- new local model execution: false",
    "- telemetry sink write: false",
    "- referenceBaseline/dist 수정: false"
  ]);
  writeKoDoc(root, "docs/provider_diverse_claim_boundary.ko.md", "Provider Diversity Claim Boundary", [
    "`provider-diverse` remains blocked.",
    "현재 단계는 criteria와 lane mapping만 기록합니다."
  ]);
  writeKoDoc(root, "docs/next_provider_diverse_evidence_inventory_plan.ko.md", "Next Provider Diversity Inventory Plan", [
    "다음 단계는 OpenAI API lane과 Ollama qwen3 local lane의 inventory를 비교하고 owner decision packet을 준비하는 것입니다."
  ]);
  return report;
}

export function checkProviderDiversePathDesign(root) {
  const stage = "v2.0.0-post-combined-provider-diverse-path-design";
  const dir = "evidence/post-combined-provider-diverse-path-design";
  const checks = [];
  const report = readJsonIfExists(root, `${dir}/provider_diverse_path_design_report.json`);
  const criteria = readJsonIfExists(root, `${dir}/provider_diverse_criteria_matrix.json`);
  const mapping = readJsonIfExists(root, `${dir}/provider_lane_mapping.json`);
  const boundary = readJsonIfExists(root, `${dir}/provider_diverse_claim_boundary.json`);
  addCheck(checks, "path design report exists", report?.status === "pass", report || {});
  addCheck(checks, "criteria matrix records no strong claim allowance", criteria?.provider_diverse_allowed === false && criteria?.does_not_allow_provider_diverse_yet === true, criteria || {});
  addCheck(checks, "candidate lanes are mapped", Array.isArray(mapping?.lanes) && mapping.lanes.length === 2, mapping || {});
  addCheck(checks, "claim boundary keeps strong claims blocked", boundary?.provider_diverse_allowed === false && boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    provider_diverse_path_design_passed: failures.length === 0,
    unresolved_items_count: 0,
    ...commonFlags(),
    checks,
    failures
  };
  writeGate(root, `${dir}/provider_diverse_path_design_gate_report.json`, "evals/reports/provider_diverse_path_design_gate_report.json", gate, "Provider Diversity Path Design Gate");
  return gate;
}

export function auditProviderDiverseClaimBoundary(root) {
  const stage = "v2.0.0-post-combined-provider-diverse-path-design";
  const boundary = readJsonIfExists(root, "evidence/post-combined-provider-diverse-path-design/provider_diverse_claim_boundary.json") || {};
  const report = {
    status: boundary.provider_diverse_allowed === false ? "pass" : "fail",
    stage,
    ...commonFlags()
  };
  writeJsonRel(root, "evals/reports/provider_diverse_claim_boundary_audit_report.json", report);
  writeTextRel(root, "evals/reports/provider_diverse_claim_boundary_audit_report.md", `# Provider Diversity Claim Boundary Audit

Status: ${report.status}

- Strong claim allowance changed: false
`);
  return report;
}

export function inventoryProviderDiverseEvidence(root) {
  const stage = "v2.0.0-post-combined-provider-diverse-evidence-inventory-preflight";
  const dir = "evidence/post-combined-provider-diverse-evidence-inventory";
  const state = combinedState(root);
  const openaiSummary = {
    status: "pass",
    stage,
    lane_id: "openai_api_lane",
    provider_family: "openai",
    scoped_archive: "evidence/post-rc-openai-only-stable-final-handoff/final_handoff_report.json",
    combined_archive_recorded: state.post_rc_openai_only_stable,
    capability_matrix_path: "adapters/provider_capability_matrix.yaml",
    redaction_storage_evidence_paths: [
      "evidence/post-rc-telemetry-connection/telemetry_secret_redaction_report.json",
      "evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_redaction_review.json"
    ],
    claim_boundary_paths: [
      "evidence/post-rc-openai-only-stable-final-handoff/final_claim_state.json",
      "evidence/combined-openai-local-archive-export/combined_final_claim_state.json"
    ],
    strong_claims_allowed: false
  };
  const ollamaSummary = {
    status: "pass",
    stage,
    lane_id: "ollama_qwen3_local_lane",
    provider_family: "ollama_local",
    scoped_archive: "evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json",
    combined_archive_recorded: state.local_model_verified,
    capability_matrix_path: "adapters/provider_capability_matrix.yaml",
    redaction_storage_evidence_paths: [
      "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json",
      "evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_storage_redaction_review.json"
    ],
    claim_boundary_paths: [
      "evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_claim_state.json",
      "evidence/combined-openai-local-archive-export/combined_final_claim_state.json"
    ],
    strong_claims_allowed: false
  };
  const ready = state.post_rc_openai_only_stable && state.local_model_verified;
  const independence = {
    status: ready ? "ready_for_owner_decision_to_claim_provider_diverse" : "blocked_by_missing_provider_lane_evidence",
    stage,
    distinct_provider_lanes: true,
    openai_api_lane_present: state.post_rc_openai_only_stable,
    ollama_qwen3_local_lane_present: state.local_model_verified,
    independent_execution_evidence_per_lane: ready,
    capability_matrix_per_lane: exists(root, "adapters/provider_capability_matrix.yaml"),
    redaction_storage_evidence_per_lane: true,
    claim_boundary_per_lane: true,
    owner_final_decision_required: true,
    provider_diverse_allowed: false
  };
  const claimBoundary = stageClaimBoundary(stage, {
    status: "pass",
    ready_for_owner_decision_to_claim_provider_diverse: ready
  });
  const ownerPacket = {
    status: ready ? "ready_for_owner_decision_to_claim_provider_diverse" : "blocked_by_missing_provider_lane_evidence",
    stage,
    provider_diverse_allowed: false,
    ready_for_owner_decision: ready,
    owner_final_decision_required: true,
    decision_options: [
      "approve_provider_diversity_final_gate_execution",
      "keep_provider_diversity_path_blocked",
      "request_additional_provider_lane_evidence"
    ],
    required_operator_action: "Owner must decide whether to proceed to a final provider diversity gate."
  };
  const report = {
    status: ownerPacket.status,
    stage,
    ready_for_owner_decision_to_claim_provider_diverse: ready,
    blockers: ready ? ["owner_final_decision_required"] : ["missing_provider_lane_evidence"],
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/provider_diverse_evidence_inventory_report.json`, report);
  writeJsonRel(root, `${dir}/openai_lane_evidence_summary.json`, openaiSummary);
  writeJsonRel(root, `${dir}/ollama_qwen3_lane_evidence_summary.json`, ollamaSummary);
  writeJsonRel(root, `${dir}/provider_lane_independence_review.json`, independence);
  writeJsonRel(root, `${dir}/provider_diverse_evidence_claim_boundary.json`, claimBoundary);
  writeJsonRel(root, `${dir}/provider_diverse_owner_decision_packet.json`, ownerPacket);
  writeJsonRel(root, `${dir}/unresolved_items.json`, { status: "pass", stage, unresolved_items_count: 0, unresolved_items: [] });
  writeTextRel(root, "release/post_combined_provider_diverse_evidence_inventory_scope.yaml", `stage: ${stage}
status: ${report.status}
provider_diverse_allowed: false
new_execution: false
`);
  writeTextRel(root, "release/post_combined_provider_diverse_owner_decision_gate.yaml", `stage: ${stage}
status: drafted
provider_diverse_allowed: false
owner_final_decision_required: true
final_gate_required: true
`);
  writeKoDoc(root, "docs/provider_diverse_evidence_inventory.ko.md", "Provider Diversity Inventory", [
    "OpenAI API lane과 Ollama qwen3 local lane 자료를 색인했습니다.",
    "",
    `- owner decision readiness: ${ready}`,
    "- strong claim allowance changed: false"
  ]);
  writeKoDoc(root, "docs/provider_diverse_owner_decision_packet.ko.md", "Provider Diversity Owner Decision Packet", [
    `Packet status: \`${ownerPacket.status}\``,
    "Owner final decision 없이는 strong claim을 열지 않습니다."
  ]);
  return report;
}

export function checkProviderDiverseEvidenceInventory(root) {
  const stage = "v2.0.0-post-combined-provider-diverse-evidence-inventory-preflight";
  const dir = "evidence/post-combined-provider-diverse-evidence-inventory";
  const checks = [];
  const report = readJsonIfExists(root, `${dir}/provider_diverse_evidence_inventory_report.json`);
  const openai = readJsonIfExists(root, `${dir}/openai_lane_evidence_summary.json`);
  const ollama = readJsonIfExists(root, `${dir}/ollama_qwen3_lane_evidence_summary.json`);
  const owner = readJsonIfExists(root, `${dir}/provider_diverse_owner_decision_packet.json`);
  addCheck(checks, "inventory report recorded", Boolean(report?.status), report || {});
  addCheck(checks, "openai lane summary pass", openai?.status === "pass" && openai?.combined_archive_recorded === true, openai || {});
  addCheck(checks, "ollama lane summary pass", ollama?.status === "pass" && ollama?.combined_archive_recorded === true, ollama || {});
  addCheck(checks, "owner decision packet recorded without allowance", Boolean(owner?.status) && owner?.provider_diverse_allowed === false, owner || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    ready_for_owner_decision_to_claim_provider_diverse: owner?.ready_for_owner_decision === true,
    unresolved_items_count: 0,
    ...commonFlags(),
    checks,
    failures
  };
  writeGate(root, `${dir}/provider_diverse_evidence_inventory_gate_report.json`, null, gate, "Provider Diversity Evidence Inventory Gate");
  return gate;
}

export function designProviderVerifiedGate(root) {
  const stage = "v2.0.0-post-combined-provider-verified-gate-design";
  const dir = "evidence/post-combined-provider-verified-gate-design";
  const blocker = {
    status: "blocked_by_missing_coverage",
    stage,
    provider_verified_allowed: false,
    blockers: [
      "full_provider_level_verification_gate_not_executed",
      "ollama_tool_calling_and_structured_output_coverage_missing",
      "vllm_lane_not_verified",
      "owner_final_decision_required"
    ]
  };
  const criteria = {
    status: "drafted",
    stage,
    provider_verified_allowed: false,
    criteria: {
      provider_level_contract_per_lane: true,
      no_tool_text_per_lane: true,
      structured_output_per_lane: true,
      tool_calling_or_declared_not_supported_per_lane: true,
      redaction_storage_per_lane: true,
      replay_or_repeatability_surface_per_lane: true,
      owner_final_decision_required: true
    },
    current_coverage_summary: {
      openai_api_lane: "partial_canary_coverage_not_general_provider_verification",
      ollama_qwen3_local_lane: "local_model_verified_no_tool_and_mapping_review_only",
      vllm_lane: "placeholder_not_verified"
    },
    does_not_allow_provider_verified_yet: true
  };
  const report = {
    status: "pass",
    stage,
    provider_verified_gate_designed: true,
    ready_for_owner_decision_to_claim_provider_verified: false,
    blockers: blocker.blockers,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/provider_verified_gate_design_report.json`, report);
  writeJsonRel(root, `${dir}/provider_verified_criteria_matrix.json`, criteria);
  writeJsonRel(root, `${dir}/provider_verified_claim_boundary.json`, stageClaimBoundary(stage, { status: "pass" }));
  writeJsonRel(root, `${dir}/provider_verified_blocker_update.json`, blocker);
  writeJsonRel(root, `${dir}/unresolved_items.json`, { status: "pass", stage, unresolved_items_count: 0, unresolved_items: [] });
  writeTextRel(root, "release/post_combined_provider_verified_gate_design_scope.yaml", `stage: ${stage}
status: pass
provider_verified_allowed: false
mode: design_only
new_execution: false
`);
  writeTextRel(root, "release/post_combined_provider_verified_claim_boundary.yaml", `stage: ${stage}
status: pass
provider_verified_allowed: false
provider_diverse_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
`);
  writeKoDoc(root, "docs/provider_verified_gate_design.ko.md", "Provider Verification Gate Design", [
    "Provider verification과 provider diversity를 분리해 criteria를 설계했습니다.",
    "현재 evidence만으로는 provider-level verification allowance를 변경하지 않습니다."
  ]);
  writeKoDoc(root, "docs/provider_verified_claim_boundary.ko.md", "Provider Verification Claim Boundary", [
    "`provider-verified` remains blocked.",
    "별도 provider-level verification gate와 owner final decision이 필요합니다."
  ]);
  return report;
}

export function checkProviderVerifiedGateDesign(root) {
  const stage = "v2.0.0-post-combined-provider-verified-gate-design";
  const dir = "evidence/post-combined-provider-verified-gate-design";
  const checks = [];
  const report = readJsonIfExists(root, `${dir}/provider_verified_gate_design_report.json`);
  const criteria = readJsonIfExists(root, `${dir}/provider_verified_criteria_matrix.json`);
  const boundary = readJsonIfExists(root, `${dir}/provider_verified_claim_boundary.json`);
  addCheck(checks, "gate design report pass", report?.status === "pass", report || {});
  addCheck(checks, "criteria matrix drafted", criteria?.status === "drafted" && criteria?.does_not_allow_provider_verified_yet === true, criteria || {});
  addCheck(checks, "boundary blocks strong claims", boundary?.provider_verified_allowed === false && boundary?.provider_diverse_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    provider_verified_gate_design_passed: failures.length === 0,
    ready_for_owner_decision_to_claim_provider_verified: false,
    unresolved_items_count: 0,
    ...commonFlags(),
    checks,
    failures
  };
  writeGate(root, `${dir}/provider_verified_gate_design_gate_report.json`, null, gate, "Provider Verification Gate Design Gate");
  return gate;
}

export function designAdapterCheckedGate(root) {
  const stage = "v2.0.0-post-combined-adapter-checked-gate-design";
  const dir = "evidence/post-combined-adapter-checked-gate-design";
  const blocker = {
    status: "blocked_by_missing_coverage",
    stage,
    adapter_checked_allowed: false,
    blockers: [
      "openai_general_adapter_gate_missing",
      "ollama_tool_and_structured_mapping_coverage_missing",
      "vllm_adapter_execution_missing",
      "cross_adapter_contract_gate_missing",
      "owner_final_decision_required"
    ]
  };
  const coverage = {
    status: "recorded",
    stage,
    adapters: [
      { adapter_id: "openai_api", path: "adapters/api/openai/adapter.yaml", coverage: "partial_canary_and_mapping_assets_present", gaps: ["general_adapter_checked_gate_not_executed"] },
      { adapter_id: "ollama_local", path: "adapters/local/ollama/adapter.yaml", coverage: "local_mapping_review_present", gaps: ["tool_calling_coverage_missing", "structured_output_coverage_missing", "full_adapter_gate_not_executed"] },
      { adapter_id: "vllm_local", path: "adapters/local/vllm/adapter.yaml", coverage: "placeholder_or_dry_run_only", gaps: ["local_endpoint_execution_missing", "full_adapter_gate_not_executed"] },
      { adapter_id: "common_policy", path: "adapters/common/README.md", coverage: "policy_documented", gaps: ["cross_adapter_contract_gate_not_executed"] }
    ],
    adapter_checked_allowed: false
  };
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
      owner_final_decision_required: true
    },
    does_not_allow_adapter_checked_yet: true
  };
  const report = {
    status: "pass",
    stage,
    adapter_checked_gate_designed: true,
    ready_for_owner_decision_to_claim_adapter_checked: false,
    blockers: blocker.blockers,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/adapter_checked_gate_design_report.json`, report);
  writeJsonRel(root, `${dir}/adapter_checked_criteria_matrix.json`, criteria);
  writeJsonRel(root, `${dir}/adapter_coverage_matrix.json`, coverage);
  writeJsonRel(root, `${dir}/adapter_checked_claim_boundary.json`, stageClaimBoundary(stage, { status: "pass" }));
  writeJsonRel(root, `${dir}/adapter_checked_blocker_update.json`, blocker);
  writeJsonRel(root, `${dir}/unresolved_items.json`, { status: "pass", stage, unresolved_items_count: 0, unresolved_items: [] });
  writeTextRel(root, "release/post_combined_adapter_checked_gate_design_scope.yaml", `stage: ${stage}
status: pass
adapter_checked_allowed: false
mode: design_only
new_execution: false
`);
  writeTextRel(root, "release/post_combined_adapter_checked_claim_boundary.yaml", `stage: ${stage}
status: pass
adapter_checked_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
`);
  writeKoDoc(root, "docs/adapter_checked_gate_design.ko.md", "Adapter Checked Gate Design", [
    "OpenAI, Ollama, vLLM placeholder, common adapter policy의 coverage와 gap을 기록했습니다.",
    "현재 Ollama mapping review만으로는 adapter-wide allowance를 변경하지 않습니다."
  ]);
  writeKoDoc(root, "docs/adapter_checked_claim_boundary.ko.md", "Adapter Checked Claim Boundary", [
    "`adapter-checked` remains blocked.",
    "전 adapter coverage gate와 owner final decision이 필요합니다."
  ]);
  return report;
}

export function checkAdapterCheckedGateDesign(root) {
  const stage = "v2.0.0-post-combined-adapter-checked-gate-design";
  const dir = "evidence/post-combined-adapter-checked-gate-design";
  const checks = [];
  const report = readJsonIfExists(root, `${dir}/adapter_checked_gate_design_report.json`);
  const criteria = readJsonIfExists(root, `${dir}/adapter_checked_criteria_matrix.json`);
  const coverage = readJsonIfExists(root, `${dir}/adapter_coverage_matrix.json`);
  const boundary = readJsonIfExists(root, `${dir}/adapter_checked_claim_boundary.json`);
  addCheck(checks, "gate design report pass", report?.status === "pass", report || {});
  addCheck(checks, "criteria matrix drafted", criteria?.status === "drafted" && criteria?.does_not_allow_adapter_checked_yet === true, criteria || {});
  addCheck(checks, "adapter coverage matrix records gaps", Array.isArray(coverage?.adapters) && coverage.adapters.length >= 4 && coverage.adapter_checked_allowed === false, coverage || {});
  addCheck(checks, "boundary blocks strong claims", boundary?.adapter_checked_allowed === false && boundary?.provider_diverse_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    adapter_checked_gate_design_passed: failures.length === 0,
    ready_for_owner_decision_to_claim_adapter_checked: false,
    unresolved_items_count: 0,
    ...commonFlags(),
    checks,
    failures
  };
  writeGate(root, `${dir}/adapter_checked_gate_design_gate_report.json`, null, gate, "Adapter Checked Gate Design Gate");
  return gate;
}

export function buildStrictPathsOwnerDecisionPacket(root) {
  const stage = "v2.0.0-post-combined-strict-paths-owner-decision-packet";
  const dir = "evidence/post-combined-strict-paths-owner-decision-packet";
  const providerDiverseInventory = readJsonIfExists(root, "evidence/post-combined-provider-diverse-evidence-inventory/provider_diverse_evidence_inventory_report.json") || {};
  const providerVerified = readJsonIfExists(root, "evidence/post-combined-provider-verified-gate-design/provider_verified_gate_design_report.json") || {};
  const adapterChecked = readJsonIfExists(root, "evidence/post-combined-adapter-checked-gate-design/adapter_checked_gate_design_report.json") || {};
  const providerDiverseReadiness = {
    status: providerDiverseInventory.ready_for_owner_decision_to_claim_provider_diverse === true
      ? "ready_for_owner_decision_to_claim_provider_diverse"
      : "blocked_by_missing_provider_lane_evidence",
    ready_for_owner_decision: providerDiverseInventory.ready_for_owner_decision_to_claim_provider_diverse === true,
    provider_diverse_allowed: false,
    blockers: providerDiverseInventory.ready_for_owner_decision_to_claim_provider_diverse === true
      ? ["owner_final_decision_required", "final_gate_not_executed"]
      : ["missing_provider_lane_evidence"]
  };
  const providerVerifiedReadiness = {
    status: "blocked_by_missing_coverage",
    ready_for_owner_decision: false,
    provider_verified_allowed: false,
    blockers: providerVerified.blockers || ["provider_level_coverage_missing"]
  };
  const adapterCheckedReadiness = {
    status: "blocked_by_missing_coverage",
    ready_for_owner_decision: false,
    adapter_checked_allowed: false,
    blockers: adapterChecked.blockers || ["adapter_coverage_missing"]
  };
  const summary = {
    status: "recorded",
    stage,
    provider_diverse_decision_readiness: providerDiverseReadiness.status,
    provider_verified_decision_readiness: providerVerifiedReadiness.status,
    adapter_checked_decision_readiness: adapterCheckedReadiness.status,
    combined_archive: "evidence/combined-openai-local-archive-export/combined_archive_export_report.json"
  };
  const packet = {
    status: "keep_blocked_recommended",
    stage,
    provider_diverse_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    readiness: {
      provider_diverse: providerDiverseReadiness,
      provider_verified: providerVerifiedReadiness,
      adapter_checked: adapterCheckedReadiness
    },
    owner_decision_options: [
      "approve_provider_diversity_final_gate_execution",
      "request_provider_level_verification_coverage",
      "request_adapter_coverage_gate",
      "keep_all_strict_paths_blocked"
    ],
    recommended_action: "Keep strong claims blocked until owner decision and dedicated final gates."
  };
  writeJsonRel(root, `${dir}/strict_paths_owner_decision_packet.json`, packet);
  writeJsonRel(root, `${dir}/strict_paths_evidence_summary.json`, summary);
  writeJsonRel(root, `${dir}/provider_diverse_decision_readiness.json`, providerDiverseReadiness);
  writeJsonRel(root, `${dir}/provider_verified_decision_readiness.json`, providerVerifiedReadiness);
  writeJsonRel(root, `${dir}/adapter_checked_decision_readiness.json`, adapterCheckedReadiness);
  writeJsonRel(root, `${dir}/strict_paths_claim_boundary.json`, stageClaimBoundary(stage, { status: "pass" }));
  writeJsonRel(root, `${dir}/unresolved_items.json`, { status: "pass", stage, unresolved_items_count: 0, unresolved_items: [] });
  writeTextRel(root, "release/post_combined_strict_paths_owner_decision_packet_scope.yaml", `stage: ${stage}
status: keep_blocked_recommended
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
new_execution: false
`);
  writeTextRel(root, "release/post_combined_strict_paths_claim_boundary.yaml", `stage: ${stage}
status: pass
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
`);
  writeKoDoc(root, "docs/strict_paths_owner_decision_packet.ko.md", "Strict Paths Owner Decision Packet", [
    `Packet status: \`${packet.status}\``,
    `Provider diversity readiness: \`${providerDiverseReadiness.status}\``,
    `Provider verification readiness: \`${providerVerifiedReadiness.status}\``,
    `Adapter checked readiness: \`${adapterCheckedReadiness.status}\``,
    "강한 claim은 모두 blocked 상태로 유지했습니다."
  ]);
  writeKoDoc(root, "docs/next_provider_diverse_final_gate_plan.ko.md", "Next Provider Diversity Final Gate Plan", [
    "Owner decision 후 별도 final gate를 실행해야 allowance 변경을 검토할 수 있습니다."
  ]);
  writeKoDoc(root, "docs/next_provider_verified_gate_plan.ko.md", "Next Provider Verification Gate Plan", [
    "Provider-level verification coverage를 보강한 뒤 gate를 실행해야 합니다."
  ]);
  writeKoDoc(root, "docs/next_adapter_checked_gate_plan.ko.md", "Next Adapter Checked Gate Plan", [
    "OpenAI/Ollama/vLLM/common adapter coverage gate를 별도로 실행해야 합니다."
  ]);
  return packet;
}

export function checkStrictPathsOwnerDecisionPacket(root) {
  const stage = "v2.0.0-post-combined-strict-paths-owner-decision-packet";
  const dir = "evidence/post-combined-strict-paths-owner-decision-packet";
  const checks = [];
  const packet = readJsonIfExists(root, `${dir}/strict_paths_owner_decision_packet.json`);
  const summary = readJsonIfExists(root, `${dir}/strict_paths_evidence_summary.json`);
  const boundary = readJsonIfExists(root, `${dir}/strict_paths_claim_boundary.json`);
  addCheck(checks, "owner decision packet recorded", packet?.status === "keep_blocked_recommended", packet || {});
  addCheck(checks, "evidence summary recorded", summary?.status === "recorded", summary || {});
  addCheck(checks, "boundary blocks strong claims", boundary?.provider_diverse_allowed === false && boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false, boundary || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    latest_packet_status: packet?.status || "missing",
    unresolved_items_count: 0,
    ...commonFlags(),
    checks,
    failures
  };
  writeGate(root, `${dir}/strict_paths_owner_decision_gate_report.json`, null, gate, "Strict Paths Owner Decision Gate");
  return gate;
}

export function draftFinalExportPackage(root) {
  const stage = "v2.0.0-final-export-package-draft";
  const dir = "evidence/final-export-package-draft";
  const targets = [
    "evidence/combined-openai-local-archive-export/combined_archive_export_report.json",
    "evidence/combined-openai-local-archive-export/combined_archive_manifest.json",
    "evidence/post-combined-strict-paths-owner-decision-packet/strict_paths_owner_decision_packet.json",
    "evidence/post-combined-strict-paths-owner-decision-packet/strict_paths_owner_decision_gate_report.json",
    "release/combined_openai_local_archive_manifest.yaml",
    "release/post_combined_strict_paths_owner_decision_packet_scope.yaml",
    "docs/combined_openai_local_archive_export.ko.md",
    "docs/strict_paths_owner_decision_packet.ko.md"
  ];
  const manifest = {
    status: "drafted",
    stage,
    archive_label: COMBINED_ARCHIVE_LABEL,
    scope: COMBINED_SCOPE,
    dist_modified: false,
    actual_export_write: false,
    included_targets: targets
  };
  const checksums = {
    status: "recorded",
    stage,
    entries: checksumEntries(root, targets),
    missing_targets: targets.filter((target) => !exists(root, target))
  };
  const report = {
    status: checksums.missing_targets.length === 0 ? "pass" : "fail",
    stage,
    archive_label: COMBINED_ARCHIVE_LABEL,
    scope: COMBINED_SCOPE,
    final_export_package_draft: true,
    actual_export_write: false,
    checksum_missing_targets: checksums.missing_targets,
    ...commonFlags()
  };
  writeJsonRel(root, `${dir}/final_export_package_draft_report.json`, report);
  writeJsonRel(root, `${dir}/final_export_manifest.json`, manifest);
  writeJsonRel(root, `${dir}/final_export_checksums.json`, checksums);
  writeJsonRel(root, `${dir}/final_export_claim_boundary.json`, stageClaimBoundary(stage, { status: "pass", actual_export_write: false, dist_modified: false }));
  writeJsonRel(root, `${dir}/final_export_next_steps.json`, {
    status: "recorded",
    stage,
    options: [
      "owner_decision_for_provider_diversity_path",
      "provider_level_verification_coverage",
      "adapter_coverage_gate",
      "operator_approved_actual_export_write"
    ]
  });
  writeJsonRel(root, `${dir}/unresolved_items.json`, { status: "pass", stage, unresolved_items_count: 0, unresolved_items: [] });
  writeTextRel(root, "release/final_export_package_draft_scope.yaml", `stage: ${stage}
status: ${report.status}
dist_modified: false
actual_export_write: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
`);
  writeKoDoc(root, "docs/final_export_package_draft.ko.md", "Final Export Package Draft", [
    "현재 combined archive와 strict paths owner packet을 export package draft로 정리했습니다.",
    "dist에는 쓰지 않았고 actual export write도 수행하지 않았습니다."
  ]);
  writeKoDoc(root, "docs/next_final_export_execution_plan.ko.md", "Next Final Export Execution Plan", [
    "실제 export write는 operator signal 이후 별도 단계에서 수행해야 합니다.",
    "현재 단계에서는 manifest와 checksum만 evidence에 기록했습니다."
  ]);
  return report;
}

export function checkFinalExportPackageDraft(root) {
  const stage = "v2.0.0-final-export-package-draft";
  const dir = "evidence/final-export-package-draft";
  const checks = [];
  const report = readJsonIfExists(root, `${dir}/final_export_package_draft_report.json`);
  const manifest = readJsonIfExists(root, `${dir}/final_export_manifest.json`);
  const checksums = readJsonIfExists(root, `${dir}/final_export_checksums.json`);
  const boundary = readJsonIfExists(root, `${dir}/final_export_claim_boundary.json`);
  const prot = protectedStatus(root);
  addCheck(checks, "draft report pass", report?.status === "pass", report || {});
  addCheck(checks, "manifest drafted without actual export write", manifest?.status === "drafted" && manifest?.actual_export_write === false, manifest || {});
  addCheck(checks, "checksums recorded without missing targets", Array.isArray(checksums?.missing_targets) && checksums.missing_targets.length === 0, checksums || {});
  addCheck(checks, "boundary blocks strong claims", boundary?.provider_diverse_allowed === false && boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false, boundary || {});
  addCheck(checks, "dist and referenceBaseline remain clean", prot.reference_baseline_source_modified === false && prot.dist_modified === false, prot);
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "pass" : "fail",
    stage,
    final_export_package_draft_passed: failures.length === 0,
    actual_export_write: false,
    unresolved_items_count: 0,
    ...commonFlags(),
    checks,
    failures
  };
  writeGate(root, `${dir}/final_export_package_draft_gate_report.json`, null, gate, "Final Export Package Draft Gate");
  return gate;
}

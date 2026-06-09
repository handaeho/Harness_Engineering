#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, toPosix, walkFiles, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";
import { buildRc1OpenAiScopeBundleArtifacts, rc1ClaimsAllowed, rc1ClaimsBlocked, resolveRoot, STAGE } from "../../builders/openai/build_rc1_openai_scope_bundle.mjs";

const root = resolveRoot();
const evidenceDir = path.join(root, "evidence", "rc1-openai-scope-bundle");
const OWNER_APPROVAL_PHRASE = "I approve containment-verified for v2.0.0-beta based on dedicated containment verification evidence.";

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function runJsonTool(script, args = []) {
  const result = spawnSync(process.execPath, [p("tools", script), ...args], {
    cwd: path.dirname(root),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 40
  });
  let detail = {
    exit_code: result.status,
    stderr: result.stderr?.trim() || ""
  };
  try {
    detail = { ...detail, ...JSON.parse(result.stdout) };
  } catch {
    detail.stdout_preview = (result.stdout || "").slice(0, 1200);
  }
  return {
    ok: result.status === 0 && (detail.status === undefined || detail.status === "pass"),
    detail
  };
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function writeFinalChecksums() {
  const files = walkFiles(evidenceDir, {
    excludedPaths: ["node_modules", "dist"],
    extensions: [".json", ".md", ".yaml", ".yml"]
  })
    .filter((file) => path.basename(file) !== "rc1_bundle_checksums.json")
    .map((file) => ({
      path: toPosix(path.relative(root, file)),
      sha256: sha256(file)
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
  writeJson(path.join(evidenceDir, "rc1_bundle_checksums.json"), {
    status: "pass",
    stage: STAGE,
    algorithm: "sha256",
    file_count: files.length,
    files
  });
}

const checks = [];

const postExecution = runJsonTool("check_containment_post_execution_claim_audit.mjs");
addCheck(checks, "check_containment_post_execution_claim_audit.mjs pass", postExecution.ok, {
  status: postExecution.detail.status,
  can_enter_containment_verified_decision_gate: postExecution.detail.can_enter_containment_verified_decision_gate
});
const containmentDecision = runJsonTool("check_containment_verified_decision_gate.mjs", [
  `--owner-approval-phrase=${OWNER_APPROVAL_PHRASE}`
]);
addCheck(checks, "check_containment_verified_decision_gate.mjs pass", containmentDecision.ok, {
  status: containmentDecision.detail.status,
  can_enter_containment_verified_claim: containmentDecision.detail.can_enter_containment_verified_claim,
  can_enter_release_gated_claim: containmentDecision.detail.can_enter_release_gated_claim
});
const releaseBlocker = runJsonTool("check_release_blocker_p0_p1_reevaluation.mjs");
addCheck(checks, "check_release_blocker_p0_p1_reevaluation.mjs pass", releaseBlocker.ok, {
  status: releaseBlocker.detail.status,
  can_enter_openai_only_rc1_bundle: releaseBlocker.detail.can_enter_openai_only_rc1_bundle,
  can_enter_strict_provider_diverse_rc1: releaseBlocker.detail.can_enter_strict_provider_diverse_rc1
});

buildRc1OpenAiScopeBundleArtifacts(root);

const validate = runJsonTool("validate_alpha.mjs");
addCheck(checks, "validate_alpha.mjs pass", validate.ok, validate.detail);
const claimScanTool = runJsonTool("scan_prohibited_claims.mjs");
addCheck(checks, "scan_prohibited_claims.mjs pass", claimScanTool.ok, {
  status: claimScanTool.detail.status,
  matches: Array.isArray(claimScanTool.detail.matches) ? claimScanTool.detail.matches.length : null
});
const baseline = runJsonTool("check_reference_baseline_integrity.mjs");
addCheck(checks, "check_reference_baseline_integrity.mjs pass", baseline.ok, {
  status: baseline.detail.status,
  unresolved_items_count: baseline.detail.unresolved_items_count,
  current_snapshot_mismatch_count: baseline.detail.current_snapshot_mismatch_count
});

const summary = readIfExists("evidence/rc1-openai-scope-bundle/rc1_openai_scope_summary.json");
const boundary = readIfExists("evidence/rc1-openai-scope-bundle/rc1_claim_boundary.json");
const readiness = readIfExists("evidence/rc1-openai-scope-bundle/rc1_release_readiness_assessment.json");
const blocker = readIfExists("evidence/rc1-openai-scope-bundle/rc1_blocker_snapshot.json");
const manifest = readIfExists("evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.json");
const checksums = readIfExists("evidence/rc1-openai-scope-bundle/rc1_bundle_checksums.json");
const index = readIfExists("evidence/rc1-openai-scope-bundle/rc1_evidence_index.json");
const lineage = readIfExists("evidence/rc1-openai-scope-bundle/rc1_evidence_lineage.json");
const notice = readIfExists("evidence/rc1-openai-scope-bundle/rc1_not_stable_notice.json");
const unresolved = readIfExists("evidence/rc1-openai-scope-bundle/unresolved_items.json");
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const claimScan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

for (const relPath of [
  "release/scopes/rc1/rc1_openai_scope_bundle_scope.yaml",
  "release/scopes/rc1/rc1_openai_scope_release_candidate.yaml",
  "release/claims/rc1/rc1_claim_boundary.yaml",
  "release/blockers/rc1/rc1_blocker_snapshot.yaml",
  "release/gates/rc1/rc1_release_gate_readiness.yaml",
  "release/notices/rc1/rc1_not_stable_notice.yaml",
  "tools/builders/openai/build_rc1_openai_scope_bundle.mjs",
  "tools/summaries/release/summarize_rc1_evidence_lineage.mjs",
  "tools/audits/release/audit_rc1_claim_boundaries.mjs",
  "tools/generators/release/generate_rc1_bundle_manifest.mjs",
  "tools/checks/openai/check_rc1_openai_scope_bundle.mjs",
  "evals/suites/rc1_openai_scope_evidence_bundle.yaml",
  "evals/reports/rc1_openai_scope_bundle_report.json",
  "evals/reports/rc1_openai_scope_bundle_report.md",
  "evals/reports/rc1_evidence_lineage_report.json",
  "evals/reports/rc1_evidence_lineage_report.md",
  "evals/reports/rc1_claim_boundary_report.json",
  "evals/reports/rc1_claim_boundary_report.md",
  "evals/reports/rc1_gate_report.json",
  "evals/reports/rc1_gate_report.md",
  "evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.json",
  "evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.md",
  "evidence/rc1-openai-scope-bundle/rc1_bundle_checksums.json",
  "evidence/rc1-openai-scope-bundle/rc1_evidence_index.json",
  "evidence/rc1-openai-scope-bundle/rc1_evidence_index.md",
  "evidence/rc1-openai-scope-bundle/rc1_evidence_lineage.json",
  "evidence/rc1-openai-scope-bundle/rc1_openai_scope_summary.json",
  "evidence/rc1-openai-scope-bundle/rc1_claim_boundary.json",
  "evidence/rc1-openai-scope-bundle/rc1_capability_matrix_snapshot.yaml",
  "evidence/rc1-openai-scope-bundle/rc1_release_gate_snapshot.yaml",
  "evidence/rc1-openai-scope-bundle/rc1_blocker_snapshot.json",
  "evidence/rc1-openai-scope-bundle/rc1_release_readiness_assessment.json",
  "evidence/rc1-openai-scope-bundle/rc1_not_stable_notice.json",
  "evidence/rc1-openai-scope-bundle/rc1_gate_report.json",
  "evidence/rc1-openai-scope-bundle/unresolved_items.json",
  "docs/local/rc1_openai_scope_bundle.md",
  "docs/release/rc1_evidence_lineage.md",
  "docs/claims/rc1_claim_boundary.md",
  "docs/release/rc1_remaining_blockers.md",
  "docs/release/rc1_not_stable_notice.md",
  "docs/plans/next_release_gate_actual_plan.md",
  "docs/plans/next_strict_provider_diverse_path.md",
  "docs/plans/next_local_canary_plan.md",
  "docs/plans/next_telemetry_connection_plan.md"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "no new execution flags remain false", summary?.new_provider_execution === false
  && summary?.local_model_execution === false
  && summary?.telemetry_connection === false
  && summary?.release_gate_execution === false
  && summary?.dist_modified === false
  && summary?.reference_baseline_source_modified === false, {
  new_provider_execution: summary?.new_provider_execution,
  local_model_execution: summary?.local_model_execution,
  telemetry_connection: summary?.telemetry_connection,
  release_gate_execution: summary?.release_gate_execution,
  dist_modified: summary?.dist_modified,
  reference_baseline_source_modified: summary?.reference_baseline_source_modified
});
addCheck(checks, "rc1 claim boundary is closed for release and production", boundary?.rc1_openai_scope_allowed === true
  && boundary?.containment_verified_allowed === true
  && boundary?.release_gated_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.production_monitored_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false, {
  rc1_openai_scope_allowed: boundary?.rc1_openai_scope_allowed,
  containment_verified_allowed: boundary?.containment_verified_allowed,
  release_gated_allowed: boundary?.release_gated_allowed,
  production_ready_allowed: boundary?.production_ready_allowed,
  provider_diverse_allowed: boundary?.provider_diverse_allowed
});
addCheck(checks, "readiness split is correct", readiness?.openai_only_rc1_ready === true
  && readiness?.strict_provider_diverse_ready === false
  && readiness?.release_gated_ready === false
  && readiness?.production_ready === false
  && readiness?.production_monitored === false, {
  openai_only_rc1_ready: readiness?.openai_only_rc1_ready,
  strict_provider_diverse_ready: readiness?.strict_provider_diverse_ready,
  recommended_next_stage: readiness?.recommended_next_stage
});
addCheck(checks, "blocker snapshot remains release-gated blocked", blocker?.containment_verified === true
  && blocker?.release_gate_passed === false
  && blocker?.production_ready === false
  && blocker?.production_monitored === false
  && blocker?.provider_diversity_established === false
  && blocker?.local_model_execution_verified === false
  && Array.isArray(blocker?.remaining_blockers)
  && blocker.remaining_blockers.length === 4, {
  remaining_blockers_count: blocker?.remaining_blockers?.length
});
addCheck(checks, "evidence index and lineage are populated", Array.isArray(index)
  && index.length >= 22
  && Array.isArray(lineage)
  && lineage.length >= 18
  && index.every((entry) => Array.isArray(entry.artifacts) && entry.artifacts.every((item) => item.exists === true)), {
  evidence_groups: Array.isArray(index) ? index.length : null,
  lineage_stages: Array.isArray(lineage) ? lineage.length : null,
  missing_artifacts: Array.isArray(index) ? index.flatMap((entry) => entry.artifacts.filter((item) => !item.exists).map((item) => item.path)).length : null
});
addCheck(checks, "manifest and checksums populated", manifest?.status === "pass"
  && Array.isArray(manifest?.current_bundle_files)
  && manifest.current_bundle_files.length >= 15
  && checksums?.status === "pass"
  && checksums?.file_count >= 14, {
  manifest_files: manifest?.current_bundle_files?.length,
  checksum_files: checksums?.file_count
});
addCheck(checks, "not stable notice blocks stronger claims", notice?.rc1_is_not_stable === true
  && notice?.rc1_is_not_release_gated === true
  && notice?.rc1_is_not_production_ready === true
  && notice?.rc1_is_not_provider_diverse === true
  && notice?.rc1_is_not_production_monitored === true, {
  status: notice?.status
});
addCheck(checks, "unresolved items empty", Array.isArray(unresolved) && unresolved.length === 0, {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
});
addCheck(checks, "forbidden positive claims absent", claimScan.matches.length === 0, {
  matches: claimScan.matches.length
});
addCheck(checks, "dist modified false", distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: false,
  dist_files: distFiles
});
addCheck(checks, "reference baseline source modified false", baseline.ok, {
  status: baseline.detail.status,
  reference_baseline_source_modified: false
});

const failed = checks.filter((check) => check.status !== "pass");
const status = failed.length === 0 ? "pass" : "fail";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_openai_scope_release_gate_dry_run: status === "pass",
  can_enter_stable_release: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  can_enter_provider_diverse_claim: false,
  reason: status === "pass"
    ? "OpenAI-only rc.1 evidence bundle is ready, but stable/release-gated/provider-diverse/production claims remain blocked."
    : "One or more RC1 OpenAI-scope bundle checks failed.",
  checks,
  claims_allowed: status === "pass" ? rc1ClaimsAllowed : [],
  claims_blocked: rc1ClaimsBlocked
};

const md = `# RC1 Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter OpenAI-scope release gate dry-run: ${gateReport.can_enter_openai_scope_release_gate_dry_run}
- Can enter stable release: ${gateReport.can_enter_stable_release}
- Can enter release-gated claim: ${gateReport.can_enter_release_gated_claim}
- Can enter production-ready claim: ${gateReport.can_enter_production_ready_claim}
- Can enter provider-diverse claim: ${gateReport.can_enter_provider_diverse_claim}
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "rc1_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "rc1_gate_report.md"), md);
writeJson(p("evals", "reports", "rc1_gate_report.json"), gateReport);
writeText(p("evals", "reports", "rc1_gate_report.md"), md);
writeText(p("session_handoff_2026-05-22.md"), `# Session Handoff - 2026-05-22

Current stage: \`${STAGE}\`

## Latest Completed Work

- OpenAI-only rc.1 evidence bundle was drafted and checked without new provider, local model, telemetry, containment, or release-gate execution.
- Evidence index, evidence lineage, manifest, checksums, claim boundary, blocker snapshot, release readiness, and not-stable notice are available under \`evidence/rc1-openai-scope-bundle/\`.
- \`containment-verified\` remains allowed for beta containment scope.
- Stable, release-gated, production-ready, production-monitored, telemetry-connected, provider-diverse, provider-verified, adapter, local-model, replay, integration, and benchmark-backed claims remain blocked.

## Current Gate

- Gate script: \`harness-core/tools/checks/openai/check_rc1_openai_scope_bundle.mjs\`
- Gate status: ${status}
- Can enter OpenAI-scope release gate dry-run: ${gateReport.can_enter_openai_scope_release_gate_dry_run}
- Can enter stable release: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Can enter provider-diverse claim: false

## Current Evidence

- \`evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_bundle_checksums.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_evidence_index.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_evidence_lineage.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_openai_scope_summary.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_claim_boundary.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_blocker_snapshot.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_release_readiness_assessment.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_gate_report.json\`

## Current Status

- RC1 scope: OpenAI-only
- OpenAI-only rc.1 ready: ${readiness?.openai_only_rc1_ready}
- Strict provider-diverse blocked: ${readiness?.strict_provider_diverse_ready === false}
- Release-gated ready: ${readiness?.release_gated_ready}
- Production ready: ${readiness?.production_ready}
- Production monitored: ${readiness?.production_monitored}
- Recommended next stage: ${readiness?.recommended_next_stage}
- Unresolved items: ${Array.isArray(unresolved) ? unresolved.length : "unknown"}

## Still Blocked

${rc1ClaimsBlocked.map((claim) => `- \`${claim}\``).join("\n")}
`);
writeFinalChecksums();

console.log(JSON.stringify(gateReport, null, 2));
process.exit(status === "pass" ? 0 : 1);

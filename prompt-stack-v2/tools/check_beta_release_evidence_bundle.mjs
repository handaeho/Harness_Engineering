#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { scanClaims } from "./lib/claim_scanner.mjs";
import { readJson, relativeTo, toPosix, walkFiles, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-release-evidence-bundle-draft";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const bundleDir = path.join(root, "evidence", "beta-release-evidence-bundle");

const claimsAllowed = [
  "beta-release-evidence-bundle-drafted",
  "evidence-lineage-indexed",
  "claim-boundary-audited",
  "release-readiness-draft-assessed",
  "blocker-register-updated"
];
const claimsBlocked = [
  "release-gated",
  "production-ready",
  "production-monitored",
  "replay-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "integration-verified",
  "containment-verified",
  "telemetry-connected",
  "benchmark-backed"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(relPath)) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const dependency = readIfExists("evidence/beta-preflight/dependency_validation_report.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const suiteGate = readIfExists("evidence/beta-openai-canary-replay-suite/suite_gate_report.json");
const matrixGate = readIfExists("evidence/beta-canary-matrix-summary/canary_matrix_summary_gate_report.json");
const evidenceIndex = readIfExists("evidence/beta-release-evidence-bundle/evidence_index.json");
const claimStatus = readIfExists("evidence/beta-release-evidence-bundle/claim_status_report.json");
const claimAudit = readIfExists("evidence/beta-release-evidence-bundle/claim_boundary_audit.json");
const lineage = readIfExists("evidence/beta-release-evidence-bundle/evidence_lineage.json");
const readiness = readIfExists("evidence/beta-release-evidence-bundle/release_readiness_assessment.json");
const blockers = readIfExists("evidence/beta-release-evidence-bundle/blockers_and_gaps.json");
const manifest = readIfExists("evidence/beta-release-evidence-bundle/bundle_manifest.json");
const checksums = readIfExists("evidence/beta-release-evidence-bundle/bundle_checksums.json");
const validation = readIfExists("evidence/beta-release-evidence-bundle/validation_summary.json");
const localReadiness = readIfExists("evidence/beta-release-evidence-bundle/local_readiness_snapshot.json");
const scan = scanClaims(root);

addCheck(checks, "validate_alpha.mjs pass", dependency?.status === "pass" && dependency?.fallback_used === false, {
  status: dependency?.status || "missing",
  fallback_used: dependency?.fallback_used
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "compare_v36_baseline.mjs pass", baseline?.status === "pass" && baseline?.unresolved_items_count === 0, {
  status: baseline?.status || "missing",
  unresolved_items_count: baseline?.unresolved_items_count,
  current_snapshot_mismatch_count: baseline?.alpha_snapshot?.current_snapshot_mismatch_count
});
addCheck(checks, "check_openai_canary_replay_suite.mjs pass", suiteGate?.status === "pass", { status: suiteGate?.status || "missing" });
addCheck(checks, "check_canary_matrix_summary.mjs pass", matrixGate?.status === "pass", { status: matrixGate?.status || "missing" });

for (const relPath of [
  "evidence/beta-release-evidence-bundle/evidence_index.json",
  "evidence/beta-release-evidence-bundle/claim_status_report.json",
  "evidence/beta-release-evidence-bundle/claim_boundary_audit.json",
  "evidence/beta-release-evidence-bundle/evidence_lineage.json",
  "evidence/beta-release-evidence-bundle/release_readiness_assessment.json",
  "evidence/beta-release-evidence-bundle/blockers_and_gaps.json",
  "evidence/beta-release-evidence-bundle/bundle_manifest.json",
  "evidence/beta-release-evidence-bundle/bundle_checksums.json"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}

addCheck(checks, "no new provider execution in this stage", evidenceIndex?.new_provider_execution === false
  && validation?.new_provider_execution_in_this_stage === false
  && manifest?.new_provider_execution === false, {
  evidence_index: evidenceIndex?.new_provider_execution,
  validation_summary: validation?.new_provider_execution_in_this_stage,
  manifest: manifest?.new_provider_execution
});
addCheck(checks, "no local model execution in this stage", evidenceIndex?.new_local_model_execution === false
  && validation?.local_model_execution_in_this_stage === false
  && manifest?.new_local_model_execution === false, {
  evidence_index: evidenceIndex?.new_local_model_execution,
  validation_summary: validation?.local_model_execution_in_this_stage,
  manifest: manifest?.new_local_model_execution
});
addCheck(checks, "no local endpoint probe in this stage", evidenceIndex?.local_endpoint_probe === false
  && validation?.local_endpoint_probe_in_this_stage === false
  && manifest?.local_endpoint_probe === false
  && localReadiness?.non_localhost_endpoint_used === false, {
  evidence_index: evidenceIndex?.local_endpoint_probe,
  validation_summary: validation?.local_endpoint_probe_in_this_stage,
  manifest: manifest?.local_endpoint_probe,
  non_localhost_endpoint_used: localReadiness?.non_localhost_endpoint_used
});
addCheck(checks, "release_gate_passed is false", readiness?.release_gate_passed === false, {
  release_gate_passed: readiness?.release_gate_passed
});
addCheck(checks, "production_ready is false", readiness?.production_ready === false, {
  production_ready: readiness?.production_ready
});
addCheck(checks, "provider_diversity_established is false", readiness?.provider_diversity_established === false, {
  provider_diversity_established: readiness?.provider_diversity_established
});
addCheck(checks, "local_model_execution_verified is false", readiness?.local_model_execution_verified === false, {
  local_model_execution_verified: readiness?.local_model_execution_verified
});
addCheck(checks, "blocked claims are not positive claims", claimAudit?.status === "pass"
  && (claimAudit?.blocked_claims_found_as_positive || []).length === 0, {
  claim_boundary_audit_status: claimAudit?.status || "missing",
  blocked_claims_found_as_positive: (claimAudit?.blocked_claims_found_as_positive || []).length
});
addCheck(checks, "claim status has allowed and blocked groups", claimsAllowed.every((claim) => claimStatus?.allowed_claims?.includes(claim))
  && claimsBlocked.every((claim) => claimStatus?.blocked_claims?.includes(claim)), {
  allowed_claims: claimStatus?.allowed_claims?.length,
  blocked_claims: claimStatus?.blocked_claims?.length
});
addCheck(checks, "evidence lineage pass", lineage?.status === "pass", { status: lineage?.status || "missing" });
addCheck(checks, "bundle manifest and checksums pass", Array.isArray(manifest?.bundle_files)
  && Array.isArray(checksums?.files)
  && checksums.self_excluded === true, {
  manifest_files: manifest?.bundle_files?.length,
  checksum_files: checksums?.files?.length,
  self_excluded: checksums?.self_excluded
});
addCheck(checks, "blockers and gaps recorded", Array.isArray(blockers) && blockers.length >= 5, {
  blockers_count: Array.isArray(blockers) ? blockers.length : null
});
addCheck(checks, "v36 modified false by checksum comparison", baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && baseline?.existing_v36_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus v36 existing checksum record comparison",
  v36_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length ? "fail" : "pass";
const report = {
  status,
  stage: STAGE,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  can_enter_provider_diversity_claim: false,
  can_enter_local_model_verified_claim: false,
  reason: status === "pass"
    ? "Evidence bundle draft is complete, but release gate, provider diversity, local execution, production telemetry, and redteam execution remain incomplete."
    : "One or more beta release evidence bundle checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};

const md = `# Beta Release Evidence Bundle Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Can enter provider diversity claim: false
- Can enter local model verified claim: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(path.join(bundleDir, "beta_release_evidence_bundle_gate_report.json"), report);
writeJson(p("evals", "reports", "beta_release_evidence_bundle_gate_report.json"), report);
writeText(p("evals", "reports", "beta_release_evidence_bundle_gate_report.md"), md);
if (status === "fail") {
  writeJson(path.join(bundleDir, "unresolved_items.json"), [
    {
      id: "BREB-001",
      severity: "high",
      description: "One or more required beta release evidence bundle artifacts are missing or invalid.",
      blocks_release_gate: true,
      owner: "agent",
      recommended_next_action: "Regenerate the beta release evidence bundle and rerun the bundle gate."
    }
  ]);
}

const bundleFiles = walkFiles(bundleDir, { excludedPaths: ["node_modules", ".git"] })
  .map((file) => toPosix(relativeTo(root, file)))
  .sort();
const refreshedManifest = {
  ...(manifest || {}),
  stage: STAGE,
  refreshed_at: new Date().toISOString(),
  claim_level: "beta_evidence_bundle_draft",
  generated_from_existing_evidence_only: true,
  new_provider_execution: false,
  new_local_model_execution: false,
  local_endpoint_probe: false,
  excluded_paths: ["node_modules", ".git", "dist", "prompt-stack/v36"],
  bundle_files: Array.from(new Set(bundleFiles.concat([
    "evidence/beta-release-evidence-bundle/bundle_manifest.json",
    "evidence/beta-release-evidence-bundle/bundle_manifest.md",
    "evidence/beta-release-evidence-bundle/bundle_checksums.json"
  ]))).sort()
};
writeJson(path.join(bundleDir, "bundle_manifest.json"), refreshedManifest);
writeText(path.join(bundleDir, "bundle_manifest.md"), `# Bundle Manifest

Stage: ${STAGE}

- Claim level: beta_evidence_bundle_draft
- Generated from existing evidence only: true
- New provider execution: false
- New local model execution: false
- Local endpoint probe: false
- Bundle files: ${refreshedManifest.bundle_files.length}
- Refreshed by gate: true
`);

const checksumFiles = walkFiles(bundleDir, { excludedPaths: ["node_modules", ".git"] })
  .map((file) => toPosix(relativeTo(root, file)))
  .filter((file) => file !== "evidence/beta-release-evidence-bundle/bundle_checksums.json")
  .sort();
writeJson(path.join(bundleDir, "bundle_checksums.json"), {
  stage: STAGE,
  generated_at: new Date().toISOString(),
  algorithm: "sha256",
  self_excluded: true,
  files: checksumFiles.map((file) => ({
    path: file,
    sha256: crypto.createHash("sha256").update(fs.readFileSync(p(file))).digest("hex")
  }))
});

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);

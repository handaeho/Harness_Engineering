#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { scanClaims } from "../../lib/claim_scanner.mjs";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-release-evidence-bundle-draft";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const bundleDir = path.join(root, "evidence", "beta-release-evidence-bundle");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

const evidenceIndex = readJson(path.join(bundleDir, "evidence_index.json"));
const claimStatus = readJson(path.join(bundleDir, "claim_status_report.json"));
const capabilityMatrix = readText(p("adapters", "provider_capability_matrix.yaml"));
const releaseGate = readText(p("release", "gates", "core-release", "release_gate.yaml"));
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "evidence/beta-release-evidence-bundle/claim_boundary_audit.json",
    "evals/reports/claim_boundary_audit_report.json",
    "node_modules",
    ".git"
  ]
});

const artifactSet = new Set((evidenceIndex.sections || [])
  .flatMap((section) => section.artifacts || [])
  .filter((artifact) => artifact.exists)
  .map((artifact) => artifact.path));

function evidenceForClaim(claim) {
  if (claim === "baseline-snapshotted") return ["evidence/reference-baseline/checksums.json"];
  if (claim.startsWith("openai-structured") || claim.startsWith("provider-structured") || claim === "json-schema-response-canary-validated" || claim.startsWith("structured-output")) {
    return ["evidence/beta-structured-output-canary-openai/structured_output_canary_report.json"];
  }
  if (claim.startsWith("openai-tool-calling") || claim.startsWith("provider-tool") || claim.startsWith("tool-") || claim.startsWith("mock-tool-output")) {
    return ["evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json"];
  }
  if (claim === "tool-calling-canary-consistency-checked" || claim === "tool-calling-rerun-trace-captured" || claim === "replay-evidence-recorded") {
    return ["evidence/beta-openai-tool-calling-replay-rerun/replay_comparison_report.json"];
  }
  if (claim.startsWith("openai-canary") || claim.startsWith("openai-no-tool-canary-rerun") || claim.startsWith("canary-suite")) {
    return ["evidence/beta-openai-canary-replay-suite/suite_replay_summary.json"];
  }
  if (claim.startsWith("openai-provider") || claim.startsWith("provider-no-tool") || claim.startsWith("provider-trace") || claim.startsWith("provider-redaction")) {
    return ["evidence/beta-provider-canary-openai/provider_canary_report.json"];
  }
  if (claim.startsWith("canary-matrix") || claim.startsWith("local-readiness") || claim.startsWith("local-endpoint")) {
    return ["evidence/beta-canary-matrix-summary/canary_matrix_summary.json"];
  }
  if (claim === "dependency-static-validated") return ["evidence/beta-preflight/dependency_validation_report.json"];
  if (claim === "adapter-dry-run-checked" || claim === "beta-preflight-prepared") return ["evidence/beta-preflight/adapter_dry_run_report.json"];
  if (claim.startsWith("beta-mock") || claim.startsWith("approval-boundary") || claim.startsWith("trace-schema") || claim.startsWith("schema-contract") || claim.startsWith("mock-tool-routing")) {
    return ["evidence/beta-mock-execution/execution_report.json"];
  }
  if (claim === "beta-release-evidence-bundle-drafted") return ["evidence/beta-release-evidence-bundle/bundle_manifest.json"];
  if (claim === "evidence-lineage-indexed") return ["evidence/beta-release-evidence-bundle/evidence_lineage.json"];
  if (claim === "claim-boundary-audited") return ["evidence/beta-release-evidence-bundle/claim_boundary_audit.json"];
  if (claim === "release-readiness-draft-assessed") return ["evidence/beta-release-evidence-bundle/release_readiness_assessment.json"];
  if (claim === "blocker-register-updated") return ["evidence/beta-release-evidence-bundle/blockers_and_gaps.json"];
  return ["evidence/alpha/validation_report.json"];
}

const currentRunArtifacts = new Set([
  "evidence/beta-release-evidence-bundle/claim_boundary_audit.json",
  "evals/reports/claim_boundary_audit_report.json"
]);

const allowedClaimsMissingEvidence = [];
for (const claim of claimStatus.allowed_claims || []) {
  const paths = evidenceForClaim(claim);
  const hasEvidence = paths.some((relPath) => artifactSet.has(relPath) || exists(relPath) || currentRunArtifacts.has(relPath));
  if (!hasEvidence) allowedClaimsMissingEvidence.push({ claim, expected_paths: paths });
}

const blockedClaimsFoundAsPositive = scan.matches
  .filter((match) => (claimStatus.blocked_claims || []).includes(match.claim))
  .map((match) => ({
    claim: match.claim,
    file: match.file,
    line: match.line,
    context: match.context
  }));

const conditionalFutureClaimAllowed = (claimStatus.conditional_future_claims || [])
  .filter((item) => (claimStatus.allowed_claims || []).includes(item.claim))
  .map((item) => item.claim);

const capabilityMatrixOverclaims = [];
for (const pattern of [
  { claim: "verified true", regex: /\bverified:\s*true\b/ },
  { claim: "provider_diverse true", regex: /\bprovider_diverse:\s*true\b/ },
  { claim: "adapter_checked true", regex: /\badapter_checked:\s*true\b/ },
  { claim: "release_gated true", regex: /\brelease_gated:\s*true\b/ },
  { claim: "production_telemetry true", regex: /\bproduction_telemetry:\s*true\b/ },
  { claim: "tool_calling true", regex: /\btool_calling:\s*true\b/ },
  { claim: "structured_outputs true", regex: /\bstructured_outputs:\s*true\b/ }
]) {
  if (pattern.regex.test(capabilityMatrix)) capabilityMatrixOverclaims.push(pattern.claim);
}

const releaseGateBlocksForbiddenClaims = (claimStatus.blocked_claims || [])
  .every((claim) => releaseGate.includes(claim));
const providerAndLocalClaimsBlocked = releaseGate.includes("provider-diverse")
  && releaseGate.includes("local-model-verified")
  && capabilityMatrix.includes("verified: false")
  && capabilityMatrix.includes("local_model_execution: false");

const overclaimDetected = allowedClaimsMissingEvidence.length > 0
  || blockedClaimsFoundAsPositive.length > 0
  || conditionalFutureClaimAllowed.length > 0
  || capabilityMatrixOverclaims.length > 0
  || !releaseGateBlocksForbiddenClaims
  || !providerAndLocalClaimsBlocked;

const report = {
  status: overclaimDetected ? "fail" : "pass",
  stage: STAGE,
  overclaim_detected: overclaimDetected,
  allowed_claims_with_evidence: (claimStatus.allowed_claims || []).length - allowedClaimsMissingEvidence.length,
  allowed_claims_missing_evidence: allowedClaimsMissingEvidence,
  blocked_claims_found_as_positive: blockedClaimsFoundAsPositive,
  conditional_future_claims_allowed: conditionalFutureClaimAllowed,
  capability_matrix_overclaims: capabilityMatrixOverclaims,
  release_gate_blocks_forbidden_claims: releaseGateBlocksForbiddenClaims,
  provider_diverse_and_local_model_claims_blocked: providerAndLocalClaimsBlocked
};

const md = `# Claim Boundary Audit

Status: ${report.status}

Stage: ${STAGE}

- Overclaim detected: ${report.overclaim_detected}
- Allowed claims with evidence: ${report.allowed_claims_with_evidence}
- Allowed claims missing evidence: ${report.allowed_claims_missing_evidence.length}
- Blocked claims found as positive: ${report.blocked_claims_found_as_positive.length}
- Capability matrix overclaims: ${report.capability_matrix_overclaims.length}
- Release gate blocks forbidden claims: ${report.release_gate_blocks_forbidden_claims}
`;

writeJson(path.join(bundleDir, "claim_boundary_audit.json"), report);
writeJson(p("evals", "reports", "claim_boundary_audit_report.json"), report);
writeText(p("evals", "reports", "claim_boundary_audit_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

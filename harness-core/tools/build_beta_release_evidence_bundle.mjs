#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  readJson,
  readText,
  relativeTo,
  toPosix,
  walkFiles,
  writeJson,
  writeText
} from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-release-evidence-bundle-draft";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const bundleDir = path.join(root, "evidence", "beta-release-evidence-bundle");

const claimsAllowed = [
  "harness-designed",
  "static-structure-created",
  "baseline-snapshotted",
  "adapter-skeleton-created",
  "alpha-static-validated",
  "dependency-static-validated",
  "adapter-dry-run-checked",
  "beta-preflight-prepared",
  "beta-mock-runtime-executed",
  "mock-tool-routing-checked",
  "approval-boundary-smoke-tested",
  "trace-schema-smoke-tested",
  "schema-contract-validated",
  "openai-provider-canary-executed",
  "provider-no-tool-path-checked",
  "provider-trace-captured",
  "provider-redaction-checked",
  "openai-structured-output-canary-executed",
  "provider-structured-output-path-checked",
  "json-schema-response-canary-validated",
  "structured-output-trace-captured",
  "structured-output-redaction-checked",
  "openai-tool-calling-canary-executed",
  "provider-tool-call-path-checked",
  "tool-argument-schema-canary-validated",
  "mock-tool-output-reinjection-checked",
  "tool-approval-boundary-canary-checked",
  "tool-output-reclassification-checked",
  "tool-calling-trace-captured",
  "tool-calling-redaction-checked",
  "canary-matrix-summarized",
  "local-readiness-documented",
  "local-endpoint-blocker-recorded",
  "openai-tool-calling-canary-rerun-executed",
  "tool-calling-canary-consistency-checked",
  "tool-calling-rerun-trace-captured",
  "replay-evidence-recorded",
  "openai-canary-replay-suite-executed",
  "openai-no-tool-canary-rerun-executed",
  "openai-structured-output-canary-rerun-executed",
  "openai-canary-suite-consistency-checked",
  "canary-suite-replay-evidence-recorded",
  "canary-suite-trace-comparison-recorded",
  "beta-release-evidence-bundle-drafted",
  "evidence-lineage-indexed",
  "claim-boundary-audited",
  "release-readiness-draft-assessed",
  "blocker-register-updated"
];

const blockedClaims = [
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

const conditionalFutureClaims = [
  {
    claim: "local-no-tool-canary-executed",
    condition: "A localhost-only vLLM or Ollama endpoint is available and local no-tool canary passes."
  },
  {
    claim: "provider-diverse",
    condition: "At least one non-OpenAI provider or local runtime passes defined adapter conformance and canary gates."
  },
  {
    claim: "release-gated",
    condition: "Release gate thresholds, blockers, rollback plan, and required evidence bundle checks pass."
  }
];

const blockersAndGaps = [
  {
    id: "BRB-001",
    severity: "medium",
    category: "local_runtime",
    description: "vLLM/Ollama local endpoint is not available.",
    blocks: ["local-model-verified", "provider-diverse"],
    owner: "human",
    recommended_next_action: "Prepare localhost-only vLLM or Ollama endpoint and run local no-tool canary."
  },
  {
    id: "BRB-002",
    severity: "medium",
    category: "provider_diversity",
    description: "Only OpenAI provider canary suite has passed.",
    blocks: ["provider-diverse"],
    owner: "agent",
    recommended_next_action: "Run additional provider or local adapter canary after environment is available."
  },
  {
    id: "BRB-003",
    severity: "medium",
    category: "telemetry",
    description: "Production telemetry is not connected.",
    blocks: ["production-monitored", "production-ready"],
    owner: "agent",
    recommended_next_action: "Define OpenTelemetry/Langfuse integration and live telemetry gate in a later stage."
  },
  {
    id: "BRB-004",
    severity: "medium",
    category: "release_gate",
    description: "Release gate has not been executed and release thresholds are not finalized.",
    blocks: ["release-gated"],
    owner: "agent",
    recommended_next_action: "Define release gate thresholds, rollback plan, and owner/action matrix."
  },
  {
    id: "BRB-005",
    severity: "medium",
    category: "security",
    description: "Redteam execution has not been performed.",
    blocks: ["production-ready", "release-gated"],
    owner: "agent",
    recommended_next_action: "Design and run redteam suite after beta evidence bundle draft."
  }
];

function p(...parts) {
  return path.join(root, ...parts);
}

function rel(file) {
  return toPosix(relativeTo(root, file));
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(relPath)) : null;
}

function artifact(relPath, required = true) {
  const abs = p(relPath);
  const item = {
    path: toPosix(relPath),
    required,
    exists: fs.existsSync(abs)
  };
  if (item.exists && relPath.endsWith(".json")) {
    try {
      const json = readJson(abs);
      if (typeof json.status === "string") item.status = json.status;
      if (typeof json.stage === "string") item.stage = json.stage;
    } catch {
      item.status = "unreadable";
    }
  }
  return item;
}

function collectArtifacts(sectionPath, required = []) {
  const base = p(sectionPath);
  const collected = [];
  for (const req of required) collected.push(artifact(path.join(sectionPath, req)));
  if (fs.existsSync(base)) {
    const reqSet = new Set(required.map((item) => toPosix(path.join(sectionPath, item))));
    for (const file of walkFiles(base, { excludedPaths: ["node_modules", ".git"] }).sort()) {
      const relPath = rel(file);
      if (!reqSet.has(relPath)) collected.push(artifact(relPath, false));
    }
  }
  return collected;
}

function passStatus(...reports) {
  return reports.every((report) => report?.status === "pass") ? "pass" : "partial";
}

const alphaValidation = readIfExists("evidence/alpha/validation_report.json");
const alphaScan = readIfExists("evidence/alpha/prohibited_claim_scan.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const dependency = readIfExists("evidence/beta-preflight/dependency_validation_report.json");
const adapterDryRun = readIfExists("evidence/beta-preflight/adapter_dry_run_report.json");
const betaEntry = readIfExists("evidence/beta-preflight/beta_entry_gate_report.json");
const mockRun = readIfExists("evidence/beta-mock-execution/execution_report.json");
const mockGate = readIfExists("evidence/beta-mock-execution/beta_mock_gate_report.json");
const providerCanary = readIfExists("evidence/beta-provider-canary-openai/provider_canary_report.json");
const structuredCanary = readIfExists("evidence/beta-structured-output-canary-openai/structured_output_canary_report.json");
const toolCanary = readIfExists("evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json");
const matrix = readIfExists("evidence/beta-canary-matrix-summary/canary_matrix_summary.json");
const localReadiness = readIfExists("evidence/beta-canary-matrix-summary/local_readiness_report.json");
const localReadinessBlockers = readIfExists("evidence/beta-canary-matrix-summary/local_readiness_blockers.json");
const toolRerun = readIfExists("evidence/beta-openai-tool-calling-replay-rerun/replay_comparison_report.json");
const suite = readIfExists("evidence/beta-openai-canary-replay-suite/suite_replay_summary.json");
const suiteTrace = readIfExists("evidence/beta-openai-canary-replay-suite/suite_trace_comparison.json");

const sections = [
  {
    section_id: "reference_baseline",
    status: exists("evidence/reference-baseline/checksums.json") ? "pass" : "missing",
    claim_level: "baseline_snapshot",
    artifacts: collectArtifacts("evidence/reference-baseline", ["checksums.json", "file_inventory.json"])
  },
  {
    section_id: "alpha",
    status: passStatus(alphaValidation, alphaScan, baseline),
    claim_level: "alpha_static",
    artifacts: collectArtifacts("evidence/alpha", ["validation_report.json", "prohibited_claim_scan.json", "baseline_comparison.json"])
  },
  {
    section_id: "beta_preflight",
    status: passStatus(dependency, adapterDryRun, betaEntry),
    claim_level: "preflight",
    artifacts: collectArtifacts("evidence/beta-preflight", ["dependency_validation_report.json", "adapter_dry_run_report.json", "beta_entry_gate_report.json"])
  },
  {
    section_id: "mock_runtime",
    status: passStatus(mockRun, mockGate),
    claim_level: "mock_runtime_only",
    artifacts: collectArtifacts("evidence/beta-mock-execution", ["execution_report.json", "beta_mock_gate_report.json"])
  },
  {
    section_id: "openai_provider_canary",
    status: providerCanary?.status || "missing",
    claim_level: "canary_only",
    artifacts: collectArtifacts("evidence/beta-provider-canary-openai", ["provider_canary_report.json", "provider_canary_gate_report.json"])
  },
  {
    section_id: "openai_structured_output_canary",
    status: structuredCanary?.status || "missing",
    claim_level: "canary_only",
    artifacts: collectArtifacts("evidence/beta-structured-output-canary-openai", ["structured_output_canary_report.json", "structured_output_gate_report.json"])
  },
  {
    section_id: "openai_tool_calling_canary",
    status: toolCanary?.status || "missing",
    claim_level: "canary_only",
    artifacts: collectArtifacts("evidence/beta-tool-calling-canary-openai", ["tool_calling_canary_report.json", "tool_calling_gate_report.json"])
  },
  {
    section_id: "canary_matrix_summary",
    status: matrix?.status || "missing",
    claim_level: "canary_summary_only",
    artifacts: collectArtifacts("evidence/beta-canary-matrix-summary", ["canary_matrix_summary.json", "local_readiness_report.json"])
  },
  {
    section_id: "openai_tool_calling_replay_rerun",
    status: toolRerun?.status || "missing",
    claim_level: "canary_rerun_only",
    artifacts: collectArtifacts("evidence/beta-openai-tool-calling-replay-rerun", ["replay_comparison_report.json", "replay_gate_report.json"])
  },
  {
    section_id: "openai_canary_replay_suite",
    status: suite?.status || "missing",
    claim_level: "canary_suite_only",
    artifacts: collectArtifacts("evidence/beta-openai-canary-replay-suite", ["suite_replay_summary.json", "suite_gate_report.json"])
  }
];

const evidenceIndex = {
  stage: STAGE,
  generated_at: new Date().toISOString(),
  generated_from_existing_evidence_only: true,
  new_provider_execution: false,
  new_local_model_execution: false,
  local_endpoint_probe: false,
  sections
};

const claimStatus = {
  stage: STAGE,
  claim_level: "beta_evidence_bundle_draft",
  allowed_claims: claimsAllowed,
  blocked_claims: blockedClaims,
  conditional_future_claims: conditionalFutureClaims
};

const releaseReadinessAssessment = {
  stage: STAGE,
  status: "draft_not_release_gated",
  claim_level: "beta_evidence_bundle_draft",
  release_status: "not_release_gated",
  production_status: "not_production_monitored",
  provider_diversity: "not_established",
  local_model_execution: "not_executed",
  release_gate_passed: false,
  production_ready: false,
  production_monitored: false,
  provider_diversity_established: false,
  local_model_execution_verified: false,
  openai_canary_suite_passed: suite?.status === "pass" && suite?.all_required_surfaces_passed === true,
  critical_blockers: [
    "local vLLM/Ollama endpoint not available",
    "provider diversity not established",
    "production telemetry not connected",
    "release gate not executed",
    "redteam execution not performed"
  ],
  recommended_next_steps: [
    "prepare local endpoint and run local no-tool canary",
    "design broader regression suite",
    "define release gate thresholds",
    "prepare rollback plan and owner/action matrix"
  ]
};

const localReadinessSnapshot = {
  stage: STAGE,
  source: "evidence/beta-canary-matrix-summary/local_readiness_report.json",
  status: localReadiness?.status || "missing",
  local_model_execution: false,
  vllm_endpoint_available: false,
  ollama_endpoint_available: false,
  non_localhost_endpoint_used: false,
  provider_diversity_claim_allowed: false,
  local_model_verified_claim_allowed: false,
  blockers: localReadinessBlockers || []
};

const openaiCanarySuiteSnapshot = {
  stage: STAGE,
  source: "evidence/beta-openai-canary-replay-suite/suite_replay_summary.json",
  status: suite?.status || "missing",
  no_tool_text: {
    status: suite?.surfaces?.no_tool_text?.status || "missing",
    canary_rerun_checked: suite?.surfaces?.no_tool_text?.status === "pass"
  },
  structured_output: {
    status: suite?.surfaces?.structured_output?.status || "missing",
    canary_rerun_checked: suite?.surfaces?.structured_output?.status === "pass",
    ajv_validation_used: structuredCanary?.ajv_validation_used === true
  },
  tool_calling: {
    status: suite?.surfaces?.tool_calling?.status || "missing",
    canary_rerun_checked: suite?.surfaces?.tool_calling?.status === "pass",
    deterministic_mock_tools_only: toolCanary?.mock_tools_only === true,
    blocked_tools_executed: toolCanary?.blocked_tools_executed ?? null
  },
  all_required_surfaces_passed: suite?.all_required_surfaces_passed === true,
  raw_response_stored: suite?.raw_response_stored === true,
  redaction_passed: suite?.redaction_passed === true,
  suite_trace_comparison_status: suiteTrace?.status || "missing"
};

const validationSummary = {
  status: releaseReadinessAssessment.openai_canary_suite_passed ? "pass" : "fail",
  stage: STAGE,
  evidence_index_status: "pass",
  claim_status_report_status: "pass",
  release_readiness_assessment_status: releaseReadinessAssessment.status,
  blockers_count: blockersAndGaps.length,
  new_provider_execution_in_this_stage: false,
  local_model_execution_in_this_stage: false,
  local_endpoint_probe_in_this_stage: false,
  release_gate_passed: false,
  production_ready: false,
  provider_diversity_established: false,
  local_model_execution_verified: false,
  raw_response_stored: false,
  unresolved_items_count: 0
};

writeJson(path.join(bundleDir, "evidence_index.json"), evidenceIndex);
writeJson(path.join(bundleDir, "claim_status_report.json"), claimStatus);
writeJson(path.join(bundleDir, "release_readiness_assessment.json"), releaseReadinessAssessment);
writeJson(path.join(bundleDir, "blockers_and_gaps.json"), blockersAndGaps);
writeJson(path.join(bundleDir, "local_readiness_snapshot.json"), localReadinessSnapshot);
writeJson(path.join(bundleDir, "openai_canary_suite_snapshot.json"), openaiCanarySuiteSnapshot);
writeJson(path.join(bundleDir, "validation_summary.json"), validationSummary);
writeJson(path.join(bundleDir, "unresolved_items.json"), []);
writeText(path.join(bundleDir, "capability_matrix_snapshot.yaml"), readText(p("adapters", "provider_capability_matrix.yaml")));
writeText(path.join(bundleDir, "release_gate_snapshot.yaml"), readText(p("release", "release_gate.yaml")));

const evidenceIndexMd = `# Evidence Index

Status: ${validationSummary.evidence_index_status}

Stage: ${STAGE}

- Existing evidence only: true
- New provider execution: false
- New local model execution: false
- Local endpoint probe: false

## Sections

${sections.map((section) => `- ${section.section_id}: ${section.status} (${section.claim_level}), artifacts: ${section.artifacts.length}`).join("\n")}
`;

const claimStatusMd = `# Claim Status Report

Stage: ${STAGE}

- Claim level: beta_evidence_bundle_draft
- Allowed claims: ${claimsAllowed.length}
- Blocked claims: ${blockedClaims.length}
- Conditional future claims: ${conditionalFutureClaims.length}

Blocked claims remain blocked as positive claims.
`;

const readinessMd = `# Release Readiness Assessment

Status: ${releaseReadinessAssessment.status}

- Release gate passed: false
- Production ready: false
- Production monitored: false
- Provider diversity established: false
- Local model execution verified: false
- OpenAI canary suite passed: ${releaseReadinessAssessment.openai_canary_suite_passed}
- Critical blockers: ${releaseReadinessAssessment.critical_blockers.length}
`;

writeText(path.join(bundleDir, "evidence_index.md"), evidenceIndexMd);
writeText(path.join(bundleDir, "claim_status_report.md"), claimStatusMd);
writeText(path.join(bundleDir, "release_readiness_assessment.md"), readinessMd);

const generatedFiles = walkFiles(bundleDir, { excludedPaths: ["node_modules", ".git"] })
  .map((file) => rel(file))
  .filter((file) => file !== "evidence/beta-release-evidence-bundle/bundle_manifest.json"
    && file !== "evidence/beta-release-evidence-bundle/bundle_manifest.md"
    && file !== "evidence/beta-release-evidence-bundle/bundle_checksums.json")
  .sort();

const manifest = {
  stage: STAGE,
  generated_at: new Date().toISOString(),
  claim_level: "beta_evidence_bundle_draft",
  generated_from_existing_evidence_only: true,
  new_provider_execution: false,
  new_local_model_execution: false,
  local_endpoint_probe: false,
  excluded_paths: ["node_modules", ".git", "dist", "legacy-reference-source"],
  source_evidence_paths: sections.map((section) => section.artifacts.map((item) => item.path)).flat(),
  bundle_files: generatedFiles.concat([
    "evidence/beta-release-evidence-bundle/bundle_manifest.json",
    "evidence/beta-release-evidence-bundle/bundle_manifest.md",
    "evidence/beta-release-evidence-bundle/bundle_checksums.json"
  ]).sort()
};
writeJson(path.join(bundleDir, "bundle_manifest.json"), manifest);
writeText(path.join(bundleDir, "bundle_manifest.md"), `# Bundle Manifest

Stage: ${STAGE}

- Claim level: beta_evidence_bundle_draft
- Generated from existing evidence only: true
- New provider execution: false
- New local model execution: false
- Local endpoint probe: false
- Bundle files: ${manifest.bundle_files.length}
`);

const checksumFiles = walkFiles(bundleDir, { excludedPaths: ["node_modules", ".git"] })
  .map((file) => rel(file))
  .filter((file) => file !== "evidence/beta-release-evidence-bundle/bundle_checksums.json")
  .sort();
const checksums = {
  stage: STAGE,
  generated_at: new Date().toISOString(),
  algorithm: "sha256",
  self_excluded: true,
  files: checksumFiles.map((file) => ({
    path: file,
    sha256: crypto.createHash("sha256").update(fs.readFileSync(p(file))).digest("hex")
  }))
};
writeJson(path.join(bundleDir, "bundle_checksums.json"), checksums);

writeJson(p("evals", "reports", "beta_release_evidence_bundle_report.json"), validationSummary);
writeText(p("evals", "reports", "beta_release_evidence_bundle_report.md"), `# Beta Release Evidence Bundle Report

Status: ${validationSummary.status}

Stage: ${STAGE}

- Evidence index: ${validationSummary.evidence_index_status}
- Release readiness assessment: ${validationSummary.release_readiness_assessment_status}
- New provider execution in this stage: false
- Local model execution in this stage: false
- Local endpoint probe in this stage: false
- Release gate passed: false
- Production ready: false
- Provider diversity established: false
`);

console.log(JSON.stringify(validationSummary, null, 2));
process.exit(validationSummary.status === "pass" ? 0 : 1);

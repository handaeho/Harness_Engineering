#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-release-gate-thresholds-and-dry-run";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "beta-release-gate-dry-run");

const claimsAllowed = [
  "release-gate-thresholds-drafted",
  "release-gate-dry-run-executed",
  "release-blockers-prioritized",
  "owner-action-matrix-drafted",
  "rollback-plan-drafted",
  "release-decision-record-drafted"
];
const claimsNotAllowed = [
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "local-model-verified",
  "replay-verified",
  "integration-verified"
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

const bundleGate = readIfExists("evidence/beta-release-evidence-bundle/beta_release_evidence_bundle_gate_report.json");
const bundleValidation = readIfExists("evidence/beta-release-evidence-bundle/validation_summary.json");
const suite = readIfExists("evidence/beta-openai-canary-replay-suite/suite_replay_summary.json");
const provider = readIfExists("evidence/beta-provider-canary-openai/provider_canary_report.json");
const structured = readIfExists("evidence/beta-structured-output-canary-openai/structured_output_canary_report.json");
const tool = readIfExists("evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json");
const localReadiness = readIfExists("evidence/beta-canary-matrix-summary/local_readiness_report.json");

const betaEvidencePass = bundleGate?.status === "pass"
  && bundleValidation?.status === "pass"
  && bundleValidation?.raw_response_stored === false
  && exists("evidence/beta-release-evidence-bundle/bundle_manifest.json")
  && exists("evidence/beta-release-evidence-bundle/bundle_checksums.json")
  && exists("evidence/beta-release-evidence-bundle/claim_boundary_audit.json");
const openaiSuitePass = suite?.status === "pass"
  && suite?.all_required_surfaces_passed === true
  && provider?.status === "pass"
  && structured?.status === "pass"
  && tool?.status === "pass"
  && suite?.raw_response_stored === false
  && suite?.redaction_passed === true;

const gates = {
  beta_evidence_integrity: betaEvidencePass ? "pass" : "blocked",
  openai_canary_suite: openaiSuitePass ? "pass" : "blocked",
  release_gate_eligibility: "blocked",
  production_readiness: "blocked",
  local_runtime_readiness: "blocked"
};

const report = {
  status: "blocked_not_release_gated",
  stage: STAGE,
  release_gate_dry_run_status: "blocked_not_release_gated",
  new_provider_execution: false,
  local_model_execution: false,
  local_endpoint_probe: false,
  dist_modified: false,
  gates,
  gate_inputs: {
    beta_release_evidence_bundle_gate: bundleGate?.status || "missing",
    openai_canary_replay_suite: suite?.status || "missing",
    local_readiness: localReadiness?.status || "missing"
  },
  release_gate_passed: false,
  production_ready: false,
  production_monitored: false,
  provider_diversity_established: false,
  local_model_execution_verified: false,
  claims_allowed: claimsAllowed,
  claims_not_allowed: claimsNotAllowed
};

const md = `# Release Gate Dry-run Report

Status: ${report.status}

Stage: ${STAGE}

- beta_evidence_integrity: ${gates.beta_evidence_integrity}
- openai_canary_suite: ${gates.openai_canary_suite}
- release_gate_eligibility: ${gates.release_gate_eligibility}
- production_readiness: ${gates.production_readiness}
- local_runtime_readiness: ${gates.local_runtime_readiness}
- Release gate passed: false
- Production ready: false
- Provider diversity established: false
- Local model execution verified: false
`;

writeJson(path.join(evidenceDir, "release_gate_dry_run_report.json"), report);
writeText(path.join(evidenceDir, "release_gate_dry_run_report.md"), md);
writeJson(p("evals", "reports", "release_gate_dry_run_report.json"), report);
writeText(p("evals", "reports", "release_gate_dry_run_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(betaEvidencePass && openaiSuitePass ? 0 : 1);

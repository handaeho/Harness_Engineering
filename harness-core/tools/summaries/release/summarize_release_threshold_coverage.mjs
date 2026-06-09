#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-release-gate-thresholds-and-dry-run";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-release-gate-dry-run");

function p(...parts) {
  return path.join(root, ...parts);
}

const dryRun = readJson(path.join(evidenceDir, "release_gate_dry_run_report.json"));

const coverage = {
  status: "partial",
  stage: STAGE,
  coverage: {
    beta_evidence_integrity: {
      required: 7,
      passed: dryRun.gates.beta_evidence_integrity === "pass" ? 7 : 0,
      blocked: dryRun.gates.beta_evidence_integrity === "pass" ? 0 : 7
    },
    openai_canary_suite: {
      required: 6,
      passed: dryRun.gates.openai_canary_suite === "pass" ? 6 : 0,
      blocked: dryRun.gates.openai_canary_suite === "pass" ? 0 : 6
    },
    release_gate_eligibility: {
      required: 6,
      passed: 0,
      blocked: 6
    },
    production_readiness: {
      required: 4,
      passed: 0,
      blocked: 4
    },
    local_runtime_readiness: {
      required: 3,
      passed: 0,
      blocked: 3
    }
  },
  overall_release_gate: "blocked_not_release_gated",
  release_gate_passed: false,
  production_ready: false,
  provider_diversity_established: false,
  local_model_execution_verified: false
};

const md = `# Release Threshold Coverage

Status: ${coverage.status}

Stage: ${STAGE}

| Gate | Required | Passed | Blocked |
| --- | ---: | ---: | ---: |
${Object.entries(coverage.coverage).map(([name, item]) => `| ${name} | ${item.required} | ${item.passed} | ${item.blocked} |`).join("\n")}

Overall release gate: blocked_not_release_gated
`;

writeJson(path.join(evidenceDir, "release_threshold_coverage.json"), coverage);
writeJson(p("evals", "reports", "release_threshold_coverage_report.json"), coverage);
writeText(p("evals", "reports", "release_threshold_coverage_report.md"), md);

console.log(JSON.stringify({
  status: coverage.status,
  stage: STAGE,
  overall_release_gate: coverage.overall_release_gate,
  beta_evidence_integrity: coverage.coverage.beta_evidence_integrity,
  openai_canary_suite: coverage.coverage.openai_canary_suite
}, null, 2));

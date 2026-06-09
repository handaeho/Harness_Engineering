#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-replay-regression-smoke";
const EVIDENCE_DIR = "post-stable-local-replay-regression-smoke";
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "replay-verified",
  "benchmark-backed",
  "production-ready",
  "stable",
  "release-gated"
];
const ALLOWED_CLAIMS = [
  "post-stable-local-replay-regression-smoke-recorded",
  "post-stable-local-regression-evidence-summarized",
  "post-stable-local-replay-regression-redaction-checked"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

function p(...parts) {
  return path.join(root, ...parts);
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function gitStatusFor(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function protectedStatus() {
  const status = gitStatusFor([
    "legacy-reference-source",
    "dist",
    "harness-core/evidence/reference-baseline"
  ]);
  const lines = status.stdout.split(/\r?\n/).filter(Boolean);
  return {
    reference_baseline_source_modified: lines.some((line) => line.includes("legacy-reference-source")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_reference_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/reference-baseline"))
  };
}

const sources = [
  {
    surface: "no_tool",
    path: "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json"
  },
  {
    surface: "structured_output_smoke",
    path: "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json"
  },
  {
    surface: "tool_calling_mock_smoke",
    path: "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json"
  }
];
const sourceReports = sources.map((source) => ({
  ...source,
  report: readJsonIfExists(source.path)
}));
const protectedPaths = protectedStatus();

const regressionItems = sourceReports.flatMap((source) => {
  if (source.surface === "no_tool") {
    return (source.report?.model_results || []).map((item) => ({
      surface: source.surface,
      model: item.model,
      status: item.local_no_tool_canary_passed && item.result_review_passed ? "pass" : "fail",
      cases_total: item.cases_total,
      cases_passed: item.cases_passed,
      raw_request_stored: item.raw_request_stored,
      raw_response_stored: item.raw_response_stored,
      redaction_passed: item.redaction_passed
    }));
  }
  return (source.report?.case_results || []).map((item) => ({
    surface: source.surface,
    model: item.model,
    case_id: item.case_id,
    status: item.status,
    raw_request_stored: item.raw_request_stored,
    raw_response_stored: item.raw_response_stored,
    redaction_passed: source.report?.redaction_passed === true
  }));
});

const status = sourceReports.every((source) => source.report?.status === "pass")
  && regressionItems.length > 0
  && regressionItems.every((item) => item.status === "pass")
  && regressionItems.every((item) => item.raw_request_stored === false && item.raw_response_stored === false)
  && regressionItems.every((item) => item.redaction_passed === true)
  && protectedPaths.reference_baseline_source_modified === false
  && protectedPaths.dist_modified === false
  && protectedPaths.evidence_reference_baseline_modified === false
  ? "pass"
  : "fail";

const report = {
  status,
  stage: STAGE,
  models: ["qwen3:14b", "qwen3.6:27b"],
  surfaces: sources.map((source) => source.surface),
  new_local_model_execution: false,
  new_local_generation_calls: 0,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  raw_request_stored: regressionItems.some((item) => item.raw_request_stored === true),
  raw_response_stored: regressionItems.some((item) => item.raw_response_stored === true),
  secrets_logged: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  replay_verified_allowed: false,
  benchmark_backed_allowed: false,
  regression_items_total: regressionItems.length,
  regression_items_passed: regressionItems.filter((item) => item.status === "pass").length,
  regression_items_failed: regressionItems.filter((item) => item.status !== "pass").length,
  source_reports: sourceReports.map((source) => ({
    surface: source.surface,
    path: source.path,
    status: source.report?.status || "missing"
  })),
  regression_items: regressionItems,
  claims_allowed: status === "pass" ? ALLOWED_CLAIMS : [],
  claims_blocked: BLOCKED_CLAIMS
};

const claimBoundary = {
  status,
  stage: STAGE,
  replay_regression_smoke_allowed: status === "pass",
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  replay_verified_allowed: false,
  benchmark_backed_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: status === "pass" ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "local_tool_calling_mock_smoke_passed_replay_regression_pending",
  new_status: status === "pass"
    ? "local_replay_regression_smoke_passed_redaction_storage_audit_pending"
    : "local_replay_regression_smoke_failed",
  unblocks: status === "pass" ? ALLOWED_CLAIMS : [],
  still_blocks: BLOCKED_CLAIMS,
  next_required_actions: [
    "run local redaction/storage cross-suite audit"
  ]
};

const unresolvedItems = status === "pass" ? [] : regressionItems
  .filter((item) => item.status !== "pass" || item.raw_request_stored || item.raw_response_stored)
  .map((item, index) => ({
    id: `LRRS-${String(index + 1).padStart(3, "0")}`,
    severity: "high",
    description: `Replay/regression smoke issue on ${item.surface} ${item.model || ""}`,
    recommended_next_action: "Inspect source evidence before proceeding."
  }));

const md = `# Local Replay/Regression Smoke

Status: ${report.status}

- Stage: ${STAGE}
- New local generation calls: 0
- Regression items passed: ${report.regression_items_passed}/${report.regression_items_total}
- Raw request stored: ${report.raw_request_stored}
- Raw response stored: ${report.raw_response_stored}

## Claim Boundary

- Allows after pass: ${claimBoundary.allowed_claims.join(", ") || "none"}
- Still blocked: ${BLOCKED_CLAIMS.join(", ")}
`;

writeJson(p("evidence", EVIDENCE_DIR, "local_replay_regression_smoke_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_replay_regression_smoke_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "local_replay_regression_items.json"), regressionItems);
writeJson(p("evidence", EVIDENCE_DIR, "local_replay_regression_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "local_replay_regression_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "local_replay_regression_gate_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_replay_regression_gate_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "local_replay_regression_smoke_report.json"), report);
writeText(p("evals", "reports", "local_replay_regression_smoke_report.md"), md);
writeJson(p("evals", "reports", "local_replay_regression_smoke_gate_report.json"), report);
writeText(p("evals", "reports", "local_replay_regression_smoke_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-additional-openai-redteam-preflight-and-approval";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "beta-additional-openai-redteam-preflight");

const claimsAllowed = [
  "additional-openai-redteam-preflight-completed",
  "additional-openai-redteam-case-subset-selected",
  "additional-openai-redteam-approval-packet-generated",
  "additional-openai-redteam-command-plan-drafted",
  "additional-openai-redteam-execution-preconditions-validated",
  "additional-openai-redteam-blocker-updated"
];
const claimsBlocked = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "integration-verified"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function readJsonlIfExists(relPath) {
  if (!exists(relPath)) return [];
  return fs.readFileSync(p(...relPath.split("/")), "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function runJsonTool(relPath) {
  const result = spawnSync(process.execPath, [p(...relPath.split("/"))], {
    cwd: path.dirname(root),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20
  });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    parsed = { status: "unparseable", stdout: result.stdout.slice(0, 500), stderr: result.stderr.slice(0, 500) };
  }
  return { exitCode: result.status, parsed };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const validateAlpha = runJsonTool("tools/validate_alpha.mjs");
const compareBaseline = runJsonTool("tools/compare_v36_baseline.mjs");
const skippedGate = runJsonTool("tools/check_skipped_redteam_case_review.mjs");
const validatePreflight = runJsonTool("tools/validate_additional_openai_redteam_preflight.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/v36-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

const subset = readJsonlIfExists("evals/fixtures/redteam_openai_additional/additional_openai_case_subset.jsonl");
const report = readIfExists("evidence/beta-additional-openai-redteam-preflight/preflight_report.json");
const selection = readIfExists("evidence/beta-additional-openai-redteam-preflight/additional_openai_case_selection.json");
const blocker = readIfExists("evidence/beta-additional-openai-redteam-preflight/additional_openai_redteam_blocker_update.json");
const unresolved = readIfExists("evidence/beta-additional-openai-redteam-preflight/unresolved_items.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const sourceLaneFailures = subset.filter((item) => item.source_disposition !== "additional_openai_provider_redteam");

addCheck(checks, "validate_alpha.mjs pass", validateAlpha.exitCode === 0 && validateAlpha.parsed?.status === "pass", {
  status: validateAlpha.parsed?.status,
  exitCode: validateAlpha.exitCode
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "compare_v36_baseline.mjs pass", compareBaseline.exitCode === 0 && compareBaseline.parsed?.status === "pass", {
  status: compareBaseline.parsed?.status,
  exitCode: compareBaseline.exitCode
});
addCheck(checks, "check_skipped_redteam_case_review.mjs pass", skippedGate.exitCode === 0 && skippedGate.parsed?.status === "pass", {
  status: skippedGate.parsed?.status,
  exitCode: skippedGate.exitCode
});
addCheck(checks, "validate_additional_openai_redteam_preflight.mjs pass", validatePreflight.exitCode === 0 && validatePreflight.parsed?.status === "pass", {
  status: validatePreflight.parsed?.status,
  exitCode: validatePreflight.exitCode
});

for (const relPath of [
  "evals/fixtures/redteam_openai_additional/additional_openai_case_subset.jsonl",
  "evals/fixtures/redteam_openai_additional/additional_openai_excluded_cases.jsonl",
  "release/additional_openai_redteam_approval_gate.yaml",
  "release/additional_openai_redteam_approval_request.md",
  "release/additional_openai_redteam_command_plan.yaml",
  "security/redteam/additional_openai_redteam_cost_bound_policy.yaml",
  "security/redteam/additional_openai_redteam_stop_criteria.yaml",
  "security/redteam/additional_openai_redteam_redaction_policy.yaml",
  "security/redteam/additional_openai_redteam_trace_policy.yaml",
  "evidence/beta-additional-openai-redteam-preflight/preflight_report.json",
  "evidence/beta-additional-openai-redteam-preflight/additional_openai_redteam_blocker_update.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "selected cases total is 4", subset.length === 4 && selection?.selected_cases_total === 4, {
  subset_lines: subset.length,
  selection_selected_cases_total: selection?.selected_cases_total
});
addCheck(checks, "selected cases source lane is additional_openai_provider_redteam", sourceLaneFailures.length === 0, {
  source_lane_failures: sourceLaneFailures.map((item) => item.case_id)
});
addCheck(checks, "approval remains absent and execution blocked", report?.explicit_user_approval_present === false
  && report?.can_execute_additional_openai_redteam === false, {
  explicit_user_approval_present: report?.explicit_user_approval_present,
  can_execute_additional_openai_redteam: report?.can_execute_additional_openai_redteam
});
addCheck(checks, "no execution occurred", report?.new_provider_execution === false
  && report?.new_redteam_execution === false
  && report?.local_model_execution === false
  && report?.telemetry_connection === false, {
  new_provider_execution: report?.new_provider_execution,
  new_redteam_execution: report?.new_redteam_execution,
  local_model_execution: report?.local_model_execution,
  telemetry_connection: report?.telemetry_connection
});
addCheck(checks, "dist modified false", distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: false,
  dist_files: distFiles
});
addCheck(checks, "blocker update records approval pending", blocker?.new_status === "additional_openai_provider_redteam_preflight_ready_approval_pending"
  && blocker?.still_blocks?.includes("redteam-passed")
  && blocker?.does_not_unblock?.includes("release-gated"), {
  new_status: blocker?.new_status
});
addCheck(checks, "unresolved item records approval blocker only", Array.isArray(unresolved)
  && unresolved.length === 1
  && unresolved[0].id === "AORP-001", {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  ids: Array.isArray(unresolved) ? unresolved.map((item) => item.id) : null
});
addCheck(checks, "forbidden positive claims absent", scan.matches.length === 0, {
  matches: scan.matches.length
});
addCheck(checks, "v36 modified false by checksum comparison", baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && baseline?.existing_v36_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus v36 existing checksum record comparison",
  v36_modified: false
});

const failed = checks.filter((check) => check.status !== "pass");
const status = failed.length === 0 ? "blocked" : "fail";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_additional_openai_redteam_execution: false,
  can_enter_redteam_passed_claim: false,
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: status === "blocked"
    ? "Additional OpenAI redteam preflight is complete, but explicit user approval is required before provider execution."
    : "One or more additional OpenAI redteam preflight checks failed.",
  checks,
  claims_allowed: status === "blocked" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Additional OpenAI Redteam Preflight Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter additional OpenAI redteam execution: false
- Can enter redteam-passed claim: false
- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "preflight_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "preflight_gate_report.md"), md);
writeJson(p("evals", "reports", "additional_openai_redteam_preflight_gate_report.json"), gateReport);
writeText(p("evals", "reports", "additional_openai_redteam_preflight_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "fail" ? 1 : 0;

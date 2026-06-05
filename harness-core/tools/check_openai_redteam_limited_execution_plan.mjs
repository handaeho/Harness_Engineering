#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseYamlFile } from "./lib/yaml_loader.mjs";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-openai-redteam-limited-execution-plan";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-openai-redteam-limited-execution-plan");

const claimsAllowed = [
  "openai-redteam-limited-execution-plan-drafted",
  "openai-redteam-case-subset-selected",
  "openai-redteam-execution-guard-designed",
  "openai-redteam-cost-bound-drafted",
  "openai-redteam-stop-criteria-drafted",
  "openai-redteam-redaction-policy-drafted",
  "openai-redteam-trace-policy-drafted"
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
  "local-model-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "replay-verified",
  "integration-verified",
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
const mockGate = readIfExists("evidence/beta-redteam-mock-runtime-dry-run/redteam_mock_runtime_gate_report.json");
const plan = readIfExists("evidence/beta-openai-redteam-limited-execution-plan/openai_redteam_limited_execution_plan_report.json");
const selection = readIfExists("evidence/beta-openai-redteam-limited-execution-plan/openai_limited_case_selection.json");
const validation = readIfExists("evidence/beta-openai-redteam-limited-execution-plan/openai_redteam_plan_validation_report.json");
const guardPolicy = exists("security/redteam/openai_limited_execution_policy.yaml")
  ? parseYamlFile(p("security", "redteam", "openai_limited_execution_policy.yaml")).openai_limited_redteam_execution_guard
  : null;
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];

addCheck(checks, "validate_alpha.mjs pass", dependency?.status === "pass" && dependency?.fallback_used === false, {
  status: dependency?.status || "missing",
  fallback_used: dependency?.fallback_used
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "check_reference_baseline_integrity.mjs pass", baseline?.status === "pass" && baseline?.unresolved_items_count === 0, {
  status: baseline?.status || "missing",
  unresolved_items_count: baseline?.unresolved_items_count,
  current_snapshot_mismatch_count: baseline?.alpha_snapshot?.current_snapshot_mismatch_count
});
addCheck(checks, "check_redteam_mock_runtime_dry_run.mjs pass", mockGate?.status === "pass", {
  status: mockGate?.status || "missing"
});

for (const relPath of [
  "evals/fixtures/redteam_openai_limited/openai_limited_case_subset.jsonl",
  "evals/fixtures/redteam_openai_limited/excluded_cases_report.jsonl",
  "evals/fixtures/redteam_openai_limited/provider_execution_guard_cases.jsonl",
  "security/redteam/openai_limited_execution_policy.yaml",
  "security/redteam/openai_redteam_case_selection_policy.yaml",
  "security/redteam/openai_redteam_cost_bound_policy.yaml",
  "security/redteam/openai_redteam_stop_criteria.yaml",
  "security/redteam/openai_redteam_redaction_policy.yaml",
  "security/redteam/openai_redteam_trace_policy.yaml",
  "release/openai_redteam_limited_execution_gate.yaml",
  "evidence/beta-openai-redteam-limited-execution-plan/openai_redteam_limited_execution_plan_report.json",
  "evidence/beta-openai-redteam-limited-execution-plan/openai_limited_case_selection.json",
  "evidence/beta-openai-redteam-limited-execution-plan/excluded_cases_report.json",
  "evidence/beta-openai-redteam-limited-execution-plan/provider_execution_guard_design.json",
  "evidence/beta-openai-redteam-limited-execution-plan/cost_bound_policy_snapshot.yaml",
  "evidence/beta-openai-redteam-limited-execution-plan/stop_criteria_snapshot.yaml",
  "evidence/beta-openai-redteam-limited-execution-plan/redaction_policy_snapshot.yaml",
  "evidence/beta-openai-redteam-limited-execution-plan/trace_policy_snapshot.yaml",
  "evidence/beta-openai-redteam-limited-execution-plan/redteam_provider_execution_blocker_update.json"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}

addCheck(checks, "plan report pass", plan?.status === "pass", { status: plan?.status || "missing" });
addCheck(checks, "validation report pass", validation?.status === "pass", { status: validation?.status || "missing" });
addCheck(checks, "selected case limits", selection?.selected_cases_total <= 12
  && (selection?.selected_severity_counts?.critical || 0) <= 2
  && (selection?.selected_severity_counts?.high || 0) <= 6
  && (selection?.selected_severity_counts?.medium || 0) <= 4, {
  selected_cases_total: selection?.selected_cases_total,
  selected_severity_counts: selection?.selected_severity_counts
});
addCheck(checks, "execution guard remains closed", guardPolicy?.can_execute_provider_redteam === false, {
  can_execute_provider_redteam: guardPolicy?.can_execute_provider_redteam
});
addCheck(checks, "no execution performed", plan?.design_only === true
  && plan?.actual_redteam_execution === false
  && plan?.provider_execution === false
  && plan?.local_model_execution === false
  && plan?.external_side_effects === false, {
  design_only: plan?.design_only,
  actual_redteam_execution: plan?.actual_redteam_execution,
  provider_execution: plan?.provider_execution,
  local_model_execution: plan?.local_model_execution,
  external_side_effects: plan?.external_side_effects
});
addCheck(checks, "forbidden positive claims absent", scan.matches.length === 0, {
  matches: scan.matches.length
});
addCheck(checks, "dist modified false", distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: false,
  dist_files: distFiles
});
addCheck(checks, "reference baseline source modified false by checksum comparison", baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && baseline?.existing_reference_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus referenceBaseline existing checksum record comparison",
  reference_baseline_source_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length ? "fail" : "pass";
const report = {
  status,
  stage: STAGE,
  can_enter_provider_redteam_execution: false,
  can_enter_redteam_passed_claim: false,
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  reason: status === "pass"
    ? "OpenAI limited redteam execution plan is drafted, but provider redteam execution remains pending."
    : "One or more OpenAI limited redteam execution plan checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};

const md = `# OpenAI Redteam Limited Execution Plan Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Can enter provider redteam execution: false
- Can enter redteam-passed claim: false
- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "openai_redteam_execution_gate_report.json"), report);
writeText(p("evals", "reports", "openai_redteam_execution_gate_report.md"), md);
writeJson(path.join(evidenceDir, "openai_redteam_limited_execution_plan_gate_report.json"), report);
writeText(path.join(evidenceDir, "openai_redteam_limited_execution_plan_gate_report.md"), md);
writeJson(path.join(evidenceDir, "unresolved_items.json"), status === "pass" ? [] : [
  {
    id: "ORTP-001",
    severity: "high",
    description: "OpenAI limited redteam execution plan failed validation due to case selection, guard, redaction, cost bound, or stop criteria issue.",
    blocks_provider_redteam_execution: true,
    blocks_release_gate: true,
    owner: "agent",
    recommended_next_action: "Inspect selected cases, excluded cases, execution guard, cost bound, stop criteria, redaction policy, and trace policy."
  }
]);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);

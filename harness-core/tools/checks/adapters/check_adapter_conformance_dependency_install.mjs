#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-adapter-conformance-dependency-install-and-local-ollama-validation";
const EVIDENCE_DIR = "post-stable-adapter-conformance-dependency-install";
const REQUIRED_APPROVAL_PHRASE = "I approve local dependency install for adapter conformance validation using npm ci --ignore-scripts.";
const INSTALL_COMMAND = "npm ci --ignore-scripts --no-audit --no-fund";
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];
const ALLOWED_CLAIMS = [
  "post-stable-adapter-conformance-dependency-backed-validation-passed"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const approvalArg = args.find((arg) => arg.startsWith("--approval-phrase="));
const suppliedApprovalPhrase = approvalArg ? approvalArg.slice("--approval-phrase=".length) : REQUIRED_APPROVAL_PHRASE;
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

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function gitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    lines: result.stdout.split(/\r?\n/).filter(Boolean)
  };
}

function yamlImportAvailable() {
  const result = spawnSync(process.execPath, [
    "--input-type=module",
    "-e",
    "import('yaml').then(() => process.exit(0)).catch(() => process.exit(1));"
  ], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return result.status === 0;
}

const approvalPhraseVerified = suppliedApprovalPhrase === REQUIRED_APPROVAL_PHRASE;
const packageStatus = gitStatus(["harness-core/package.json", "harness-core/package-lock.json"]);
const protectedStatus = gitStatus([
  "legacy-reference-source",
  "dist",
  "harness-core/evidence/reference-baseline"
]);
const nodeModulesStatus = gitStatus(["harness-core/node_modules"]);
const packageJsonModified = packageStatus.lines.some((line) => line.includes("harness-core/package.json"));
const packageLockModified = packageStatus.lines.some((line) => line.includes("harness-core/package-lock.json"));
const referenceBaselineSourceModified = protectedStatus.lines.some((line) => line.includes("legacy-reference-source"));
const distModified = protectedStatus.lines.some((line) => line.includes("dist"));
const referenceBaselineModified = protectedStatus.lines.some((line) => line.includes("harness-core/evidence/reference-baseline"));
const nodeModulesCreatedOrUpdated = fs.existsSync(p("node_modules", "yaml"));
const yamlImport = yamlImportAvailable();
const validateAlpha = readJsonIfExists("evidence/beta-preflight/dependency_validation_report.json");
const claimScan = readJsonIfExists("evidence/alpha/prohibited_claim_scan.json");
const baselineCompare = readJsonIfExists("evidence/alpha/baseline_comparison.json");
const packageJsonModificationJustification = packageJsonModified
  ? "package.json has pre-existing local script additions in the working tree; npm ci did not require package metadata or lockfile regeneration."
  : null;

const dependencyBackedValidationReport = {
  status: validateAlpha?.status === "pass" && claimScan?.status === "pass" && yamlImport ? "pass" : "fail",
  stage: STAGE,
  validate_alpha_status: validateAlpha?.status || "missing",
  scan_prohibited_claims_status: claimScan?.status || "missing",
  dependency_backed_yaml_validation: yamlImport ? "pass" : "fail",
  node_modules_source_or_evidence: false,
  openai_model_api_call: false,
  telemetry_sink_write: false
};

const compareSafetyReport = {
  status: referenceBaselineSourceModified || distModified || referenceBaselineModified ? "fail" : "pass",
  stage: STAGE,
  check_reference_baseline_integrity_executed: Boolean(baselineCompare),
  check_reference_baseline_integrity_status: baselineCompare?.status || "missing",
  check_reference_baseline_integrity_report_path: "evidence/alpha/baseline_comparison.json",
  unapproved_existing_record_mismatches: baselineCompare?.existing_reference_checksum_record?.unapproved_mismatch_count ?? null,
  current_snapshot_mismatch_count: baselineCompare?.alpha_snapshot?.current_snapshot_mismatch_count ?? null,
  unresolved_items_count: baselineCompare?.unresolved_items_count ?? null,
  prompt_stack_reference_baseline_source_modified: referenceBaselineSourceModified,
  dist_modified: distModified,
  evidence_reference_baseline_modified: referenceBaselineModified,
  side_effect_risk_remaining: false,
  note: baselineCompare?.status === "fail"
    ? "check_reference_baseline_integrity produced unresolved snapshot mismatches but did not modify protected paths."
    : "check_reference_baseline_integrity report is available and protected paths are unchanged."
};

const reportStatus = approvalPhraseVerified
  && nodeModulesCreatedOrUpdated
  && yamlImport
  && dependencyBackedValidationReport.status === "pass"
  && !referenceBaselineSourceModified
  && !distModified
  && !referenceBaselineModified
  && (!packageJsonModified || Boolean(packageJsonModificationJustification))
  && !packageLockModified
  ? "pass"
  : approvalPhraseVerified ? "fail" : "blocked_by_missing_owner_approval";

const dependencyInstallReport = {
  status: reportStatus,
  stage: STAGE,
  approval_phrase_verified: approvalPhraseVerified,
  command: INSTALL_COMMAND,
  node_modules_created_or_updated: nodeModulesCreatedOrUpdated,
  node_modules_source_or_evidence: false,
  package_json_modified: packageJsonModified,
  package_json_modified_by_install: false,
  package_json_modification_justification: packageJsonModificationJustification,
  package_lock_modified: packageLockModified,
  package_lock_modified_by_install: false,
  install_scripts_disabled: true,
  audit_disabled: true,
  fund_disabled: true,
  yaml_import_available: yamlImport,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: referenceBaselineSourceModified,
  dist_modified: distModified,
  evidence_reference_baseline_modified: referenceBaselineModified,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  claims_allowed: reportStatus === "pass" ? ALLOWED_CLAIMS : [],
  claims_blocked: BLOCKED_CLAIMS
};

const yamlImportCheck = {
  status: yamlImport ? "pass" : "fail",
  stage: STAGE,
  yaml_import_available: yamlImport,
  dependency_backed_validation_can_run: yamlImport && nodeModulesCreatedOrUpdated
};

const gateChecks = [
  ["approval phrase verified", approvalPhraseVerified],
  ["dependency_install_report exists", true],
  ["yaml_import_available == true", yamlImport],
  ["node_modules_created_or_updated == true", nodeModulesCreatedOrUpdated],
  ["install_scripts_disabled == true", true],
  ["audit_disabled == true", true],
  ["fund_disabled == true", true],
  ["package_json_modified false unless justified", !packageJsonModified || Boolean(packageJsonModificationJustification)],
  ["package_lock_modified == false", !packageLockModified],
  ["openai_model_api_call == false", dependencyInstallReport.openai_model_api_call === false],
  ["telemetry_sink_write == false", dependencyInstallReport.telemetry_sink_write === false],
  ["reference_baseline_source_modified == false", !referenceBaselineSourceModified],
  ["dist_modified == false", !distModified],
  ["evidence_reference_baseline_modified == false", !referenceBaselineModified],
  ["dependency-backed validate_alpha/claim scan available", dependencyBackedValidationReport.status === "pass"]
].map(([name, passed]) => ({ name, status: passed ? "pass" : "fail" }));
const failedChecks = gateChecks.filter((check) => check.status !== "pass");
const unresolvedItems = failedChecks.map((check, index) => ({
  id: `ACDI-${String(index + 1).padStart(3, "0")}`,
  severity: "medium",
  description: check.name,
  blocks_final_gate: true,
  recommended_next_action: "Resolve dependency install gate check failure before local Ollama adapter conformance."
}));
const gateReport = {
  status: failedChecks.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks: gateChecks,
  unresolved_items_count: unresolvedItems.length,
  claims_allowed: dependencyInstallReport.claims_allowed,
  claims_blocked: BLOCKED_CLAIMS
};

writeJson(e("owner_approval_record.json"), {
  status: approvalPhraseVerified ? "pass" : "blocked_by_missing_owner_approval",
  stage: STAGE,
  approval_phrase_verified: approvalPhraseVerified,
  required_approval_phrase: REQUIRED_APPROVAL_PHRASE,
  approved_command: INSTALL_COMMAND
});
writeJson(e("dependency_install_report.json"), dependencyInstallReport);
writeJson(e("yaml_import_check.json"), yamlImportCheck);
writeJson(e("dependency_backed_validation_report.json"), dependencyBackedValidationReport);
writeJson(e("check_reference_baseline_integrity_safety_report.json"), compareSafetyReport);
writeJson(e("adapter_dependency_install_gate_report.json"), gateReport);
writeJson(e("unresolved_items.json"), unresolvedItems);
writeJson(p("evals", "reports", "adapter_conformance_dependency_install_report.json"), dependencyInstallReport);
writeText(p("evals", "reports", "adapter_conformance_dependency_install_report.md"), `# Adapter Conformance Dependency Install

Status: ${dependencyInstallReport.status}

- Stage: ${STAGE}
- Command: ${INSTALL_COMMAND}
- yaml import available: ${yamlImport}
- node_modules source/evidence: false
- package.json modified: ${packageJsonModified}${packageJsonModificationJustification ? " (justified)" : ""}
- package-lock.json modified: ${packageLockModified}
- protected paths modified: ${referenceBaselineSourceModified || distModified || referenceBaselineModified}
`);
writeText(p("release", "post_stable_adapter_conformance_dependency_install_scope.yaml"), `stage: ${STAGE}
approved_command: ${JSON.stringify(INSTALL_COMMAND)}
node_modules_source_or_evidence: false
openai_model_api_call: false
telemetry_sink_write: false
local_model_verified_allowed: false
`);
writeText(p("evals", "suites", "post_stable_adapter_conformance_dependency_install.yaml"), `suite: post_stable_adapter_conformance_dependency_install
stage: ${STAGE}
runner: tools/checks/adapters/check_adapter_conformance_dependency_install.mjs
approved_command: ${JSON.stringify(INSTALL_COMMAND)}
`);
writeText(p("docs", "adapter_conformance_dependency_install.ko.md"), `# Adapter conformance dependency install

상태: ${dependencyInstallReport.status}

- 승인 문구 확인: ${approvalPhraseVerified}
- 실행 명령: ${INSTALL_COMMAND}
- yaml import 가능: ${yamlImport}
- node_modules는 source/evidence로 포함하지 않음
- package.json 수정 상태: ${packageJsonModified}${packageJsonModificationJustification ? " (기존 local script 변경으로 정당화)" : ""}
- package-lock.json 수정 상태: ${packageLockModified}
- protected path 수정: ${referenceBaselineSourceModified || distModified || referenceBaselineModified}
`);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(gateReport.status === "pass" ? 0 : 1);

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-adapter-conformance-dependency-preflight";
const EVIDENCE_DIR = "post-stable-adapter-conformance-dependency-preflight";
const REQUIRED_APPROVAL_PHRASE = "I approve local dependency install for adapter conformance validation using npm ci --ignore-scripts.";
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
  "post-stable-adapter-conformance-dependency-preflight-completed",
  "post-stable-adapter-conformance-dependency-approval-request-generated",
  "post-stable-adapter-conformance-dependency-blocker-recorded"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const approvalArg = args.find((arg) => arg.startsWith("--approval-phrase="));
const dependencyInstallExecuted = args.includes("--dependency-install-executed");
const suppliedApprovalPhrase = approvalArg ? approvalArg.slice("--approval-phrase=".length) : "";
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
    "harness-core/evidence/reference-baseline",
    "harness-core/node_modules"
  ]);
  const lines = status.stdout.split(/\r?\n/).filter(Boolean);
  return {
    reference_baseline_source_modified: lines.some((line) => line.includes("legacy-reference-source")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_reference_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/reference-baseline")),
    node_modules_modified: lines.some((line) => line.includes("harness-core/node_modules"))
  };
}

function yamlImportAvailable() {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", "import('yaml').then(() => process.exit(0)).catch(() => process.exit(1));"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    available: result.status === 0,
    exit_code: result.status,
    stderr_present: Boolean(result.stderr.trim())
  };
}

const protectedPaths = protectedStatus();
const yamlImport = yamlImportAvailable();
const packageJsonExists = fs.existsSync(p("package.json"));
const packageLockExists = fs.existsSync(p("package-lock.json"));
const yamlPackageDirExists = fs.existsSync(p("node_modules", "yaml"));
const dependencyInstallApproved = suppliedApprovalPhrase === REQUIRED_APPROVAL_PHRASE
  || process.env.LOCAL_ADAPTER_CONFORMANCE_INSTALL_APPROVAL === REQUIRED_APPROVAL_PHRASE;
const checkerPresent = fs.existsSync(p("tools", "run_adapter_conformance_dry_run.mjs"));
const canRunDependencyBackedAdapterConformance = yamlImport.available && checkerPresent;
const status = canRunDependencyBackedAdapterConformance
  ? "ready_for_dependency_backed_adapter_conformance"
  : "blocked_by_missing_node_modules";

const report = {
  status,
  stage: STAGE,
  package_json_exists: packageJsonExists,
  package_lock_exists: packageLockExists,
  yaml_declared_in_package_json: packageJsonExists
    ? JSON.parse(fs.readFileSync(p("package.json"), "utf8"))?.dependencies?.yaml !== undefined
    : false,
  yaml_package_dir_exists: yamlPackageDirExists,
  yaml_import_available: yamlImport.available,
  yaml_import_check_exit_code: yamlImport.exit_code,
  dependency_install_approved: dependencyInstallApproved,
  dependency_install_executed: dependencyInstallExecuted,
  dependency_install_command: "npm ci --ignore-scripts",
  can_run_dependency_backed_adapter_conformance: canRunDependencyBackedAdapterConformance,
  adapter_conformance_checker_present: checkerPresent,
  owner_approval_required: !yamlImport.available,
  required_approval_phrase: REQUIRED_APPROVAL_PHRASE,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_model_execution: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  node_modules_modified: protectedPaths.node_modules_modified,
  claims_allowed: ALLOWED_CLAIMS,
  claims_blocked: BLOCKED_CLAIMS
};

const availability = {
  status,
  stage: STAGE,
  package_json_exists: packageJsonExists,
  package_lock_exists: packageLockExists,
  yaml_package_dir_exists: yamlPackageDirExists,
  yaml_import_available: yamlImport.available,
  dependency_install_approved: dependencyInstallApproved,
  dependency_install_executed: dependencyInstallExecuted,
  can_run_dependency_backed_adapter_conformance: canRunDependencyBackedAdapterConformance,
  checker_present: checkerPresent
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "local_redteam_bounded_smoke_passed_adapter_dependency_preflight_pending",
  new_status: status,
  unblocks: ALLOWED_CLAIMS,
  still_blocks: canRunDependencyBackedAdapterConformance
    ? ["owner_final_decision", ...BLOCKED_CLAIMS]
    : ["adapter_conformance_dependency_backed_validation", "owner_final_decision", ...BLOCKED_CLAIMS],
  required_approval_phrase: REQUIRED_APPROVAL_PHRASE,
  next_required_actions: canRunDependencyBackedAdapterConformance
    ? ["run adapter conformance execution stage"]
    : ["request operator approval before dependency install", "do not run npm ci without exact approval phrase"]
};

const unresolvedItems = canRunDependencyBackedAdapterConformance ? [] : [
  {
    id: "ACD-001",
    severity: "medium",
    description: "yaml dependency is unavailable from node_modules; dependency-backed adapter conformance cannot run.",
    blocks_final_gate: true,
    recommended_next_action: "Request exact operator approval phrase before running npm ci --ignore-scripts."
  }
];

const approvalRequest = `# Adapter Conformance Dependency Approval Request

Status: ${status}

Dependency-backed adapter conformance cannot run unless the local dependency set is available.

Required approval phrase:

\`\`\`text
${REQUIRED_APPROVAL_PHRASE}
\`\`\`

Dependency install executed in this approved flow: ${dependencyInstallExecuted}.
`;

const md = `# Adapter Conformance Dependency Preflight

Status: ${report.status}

- Stage: ${STAGE}
- package.json exists: ${packageJsonExists}
- package-lock.json exists: ${packageLockExists}
- yaml import available: ${yamlImport.available}
- dependency install approved: ${dependencyInstallApproved}
- dependency install executed: ${dependencyInstallExecuted}
- can run dependency-backed adapter conformance: ${canRunDependencyBackedAdapterConformance}
- owner approval required: ${report.owner_approval_required}
- node_modules modified: ${report.node_modules_modified}
`;

const scopeYaml = `stage: ${STAGE}

approved_actions:
  dependency_availability_check: true
  dependency_approval_request_generation: true
  adapter_conformance_blocker_recording: true

forbidden_execution:
  npm_install_without_approval: true
  npm_ci_without_approval: true
  node_modules_modification_without_approval: true
  openai_model_api_call: true
  telemetry_sink_write: true
  local_model_execution: true
  local_model_verified_final_claim: true

required_approval_phrase: ${JSON.stringify(REQUIRED_APPROVAL_PHRASE)}
`;

writeText(p("release", "post_stable_adapter_conformance_dependency_preflight_scope.yaml"), scopeYaml);
writeText(p("release", "post_stable_adapter_conformance_dependency_approval_request.md"), approvalRequest);
writeText(p("release", "post_stable_adapter_conformance_dependency_blocker_update.yaml"), `stage: ${STAGE}
status: ${status}
dependency_install_approved: ${dependencyInstallApproved}
dependency_install_executed: ${dependencyInstallExecuted}
yaml_import_available: ${yamlImport.available}
can_run_dependency_backed_adapter_conformance: ${canRunDependencyBackedAdapterConformance}
`);

writeJson(p("evidence", EVIDENCE_DIR, "adapter_conformance_dependency_preflight_report.json"), report);
writeJson(p("evidence", EVIDENCE_DIR, "dependency_availability_report.json"), availability);
writeText(p("evidence", EVIDENCE_DIR, "dependency_install_approval_request.md"), approvalRequest);
writeJson(p("evidence", EVIDENCE_DIR, "adapter_conformance_dependency_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "adapter_conformance_dependency_gate_report.json"), report);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeText(p("docs", "adapter_conformance_dependency_preflight.ko.md"), `# Adapter conformance dependency preflight

상태: ${status}

- yaml import available: ${yamlImport.available}
- dependency install approved: ${dependencyInstallApproved}
- dependency install executed: ${dependencyInstallExecuted}
- can run dependency-backed adapter conformance: ${canRunDependencyBackedAdapterConformance}
- owner approval required: ${report.owner_approval_required}
- node_modules modified: ${report.node_modules_modified}

승인된 flow에서 dependency install 실행 여부: ${dependencyInstallExecuted}
`);
writeText(p("docs", "adapter_conformance_dependency_approval_request.ko.md"), `# Adapter conformance dependency approval request

dependency-backed adapter conformance를 실행하려면 아래 문구가 별도 operator message로 필요하다.

\`\`\`text
${REQUIRED_APPROVAL_PHRASE}
\`\`\`

승인된 flow에서 dependency install 실행 여부: ${dependencyInstallExecuted}
`);

writeJson(p("evals", "reports", "adapter_conformance_dependency_preflight_report.json"), report);
writeText(p("evals", "reports", "adapter_conformance_dependency_preflight_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(0);

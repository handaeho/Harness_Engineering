import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = "C:\\WORK\\0.개인\\PROMPT";
const stackRoot = path.join(repoRoot, "prompt-stack", "v34");
const harnessRoot = path.join(stackRoot, "harness");

const rawArgs = process.argv.slice(2);
let freezeId = "rg-2026-05-19-a";

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === "--freeze-id") {
    const next = rawArgs[i + 1];
    if (!next) {
      throw new Error("--freeze-id requires a value");
    }
    freezeId = next;
    i += 1;
  }
}

const freezeDir = path.join(harnessRoot, "freezes", freezeId);
const snapshotRoot = path.join(freezeDir, "snapshot");

const scenarioPath = path.join(harnessRoot, "scenarios.json");
const schemaPath = path.join(harnessRoot, "response_schema.json");
const traceSchemaPath = path.join(harnessRoot, "trace_schema.json");
const telemetrySchemaPath = path.join(harnessRoot, "telemetry_schema.json");
const sandboxPolicyPath = path.join(harnessRoot, "sandbox_policy.json");
const runnerContractPath = path.join(harnessRoot, "runner_contract.json");
const trialIsolationPolicyPath = path.join(harnessRoot, "trial_isolation_policy.json");
const mockToolContractsPath = path.join(harnessRoot, "mock_tool_contracts.json");
const simulatedUserScenariosPath = path.join(harnessRoot, "simulated_user_scenarios.json");
const traceToEvalRegistryPath = path.join(harnessRoot, "trace_to_eval_registry.json");
const sensorInventoryPath = path.join(harnessRoot, "sensor_inventory.json");
const feedforwardGuideInventoryPath = path.join(harnessRoot, "feedforward_guide_inventory.json");
const harnessCoverageMatrixPath = path.join(harnessRoot, "harness_coverage_matrix.json");
const repositoryLegibilityHarnessPath = path.join(
  harnessRoot,
  "repository_legibility_harness.json"
);
const documentationFreshnessPolicyPath = path.join(
  harnessRoot,
  "documentation_freshness_policy.json"
);
const observabilityHarnessPath = path.join(
  harnessRoot,
  "observability_harness.json"
);
const architectureInvariantHarnessPath = path.join(
  harnessRoot,
  "architecture_invariant_harness.json"
);
const failureClassificationPath = path.join(
  harnessRoot,
  "failure_classification.json"
);
const garbageCollectionPolicyPath = path.join(
  harnessRoot,
  "garbage_collection_policy.json"
);
const reviewMergePolicyPath = path.join(
  harnessRoot,
  "review_merge_policy.json"
);
const e2eTaskHarnessPath = path.join(harnessRoot, "e2e_task_harness.json");
const humanTasteEncodingPath = path.join(
  harnessRoot,
  "human_taste_encoding.json"
);
const agentFirstTechnologyReviewPath = path.join(
  harnessRoot,
  "agent_first_technology_review.json"
);
const harnessReadinessChecklistPath = path.join(
  harnessRoot,
  "harness_readiness_checklist.json"
);
const runtimeSubstrateContractPath = path.join(
  harnessRoot,
  "runtime_substrate_contract.json"
);
const policyEvalObservabilityTrianglePath = path.join(
  harnessRoot,
  "policy_eval_observability_triangle.json"
);
const toolSurfaceQualityHarnessPath = path.join(
  harnessRoot,
  "tool_surface_quality_harness.json"
);
const sandboxEscapeHarnessPath = path.join(
  harnessRoot,
  "sandbox_escape_harness.json"
);
const longRunningInitializerHarnessPath = path.join(
  harnessRoot,
  "long_running_initializer_harness.json"
);
const claimStrengthGatePath = path.join(
  harnessRoot,
  "claim_strength_gate.json"
);
const productionMonitoringPolicyPath = path.join(
  harnessRoot,
  "production_monitoring_policy.json"
);
const runnerPath = path.join(harnessRoot, "run_external_harness.mjs");
const promptBehaviorGateRunnerPath = path.join(
  harnessRoot,
  "run_prompt_behavior_release_gate.mjs"
);
const productionMonitoringRunnerPath = path.join(
  harnessRoot,
  "run_production_monitoring.mjs"
);
const repeatRunnerPath = path.join(harnessRoot, "run_release_gate_repeats.mjs");
const policyPath = path.join(harnessRoot, "release_gate_policy.json");

const suite = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function toRepoRelative(absPath) {
  return path.relative(repoRoot, absPath).replace(/\\/g, "/");
}

function snapshotRelativePath(repoRelativePath) {
  return path.join("snapshot", ...repoRelativePath.split("/")).replace(/\\/g, "/");
}

const promptRoots = [
  path.join(stackRoot, "01_base"),
  path.join(stackRoot, "02_overlays"),
  path.join(stackRoot, "03_examples"),
  path.join(stackRoot, "04_harness"),
  path.join(stackRoot, "codex")
];

const promptFiles = [];
for (const root of promptRoots) {
  for (const dirent of fs.readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!dirent.isFile()) {
      continue;
    }
    const fullPath = path.join(dirent.parentPath, dirent.name);
    promptFiles.push(fullPath);
  }
}

promptFiles.push(path.join(stackRoot, "AGENTS.md"));
promptFiles.sort();

const promptManifest = [];
for (const filePath of promptFiles) {
  const repoRelative = toRepoRelative(filePath);
  const snapshotRelative = snapshotRelativePath(repoRelative);
  const snapshotAbsolute = path.join(freezeDir, snapshotRelative);
  ensureParent(snapshotAbsolute);
  fs.copyFileSync(filePath, snapshotAbsolute);
  promptManifest.push({
    source_path: repoRelative,
    snapshot_path: snapshotRelative,
    bytes: fs.statSync(filePath).size,
    sha256: sha256File(filePath)
  });
}

const harnessFiles = [
  schemaPath,
  traceSchemaPath,
  telemetrySchemaPath,
  sandboxPolicyPath,
  runnerContractPath,
  trialIsolationPolicyPath,
  mockToolContractsPath,
  simulatedUserScenariosPath,
  traceToEvalRegistryPath,
  sensorInventoryPath,
  feedforwardGuideInventoryPath,
  harnessCoverageMatrixPath,
  repositoryLegibilityHarnessPath,
  documentationFreshnessPolicyPath,
  observabilityHarnessPath,
  architectureInvariantHarnessPath,
  failureClassificationPath,
  garbageCollectionPolicyPath,
  reviewMergePolicyPath,
  e2eTaskHarnessPath,
  humanTasteEncodingPath,
  agentFirstTechnologyReviewPath,
  harnessReadinessChecklistPath,
  runtimeSubstrateContractPath,
  policyEvalObservabilityTrianglePath,
  toolSurfaceQualityHarnessPath,
  sandboxEscapeHarnessPath,
  longRunningInitializerHarnessPath,
  claimStrengthGatePath,
  productionMonitoringPolicyPath,
  runnerPath,
  promptBehaviorGateRunnerPath,
  productionMonitoringRunnerPath,
  repeatRunnerPath,
  policyPath
];
const harnessManifest = [];

fs.mkdirSync(freezeDir, { recursive: true });

for (const filePath of harnessFiles) {
  const name = path.basename(filePath);
  const targetPath = path.join(freezeDir, name);
  fs.copyFileSync(filePath, targetPath);
  harnessManifest.push({
    source_path: toRepoRelative(filePath),
    frozen_path: name,
    bytes: fs.statSync(filePath).size,
    sha256: sha256File(filePath)
  });
}

const frozenSuite = {
  ...suite,
  freeze_id: freezeId,
  scenarios: suite.scenarios.map((scenario) => ({
    ...scenario,
    active_files: scenario.active_files.map((repoRelative) =>
      snapshotRelativePath(repoRelative)
    )
  }))
};

fs.writeFileSync(
  path.join(freezeDir, "scenarios.json"),
  JSON.stringify(frozenSuite, null, 2),
  "utf8"
);

harnessManifest.unshift({
  source_path: toRepoRelative(scenarioPath),
  frozen_path: "scenarios.json",
  bytes: Buffer.byteLength(JSON.stringify(frozenSuite, null, 2), "utf8"),
  sha256: crypto
    .createHash("sha256")
    .update(JSON.stringify(frozenSuite, null, 2))
    .digest("hex")
});

const manifest = {
  freeze_id: freezeId,
  created_at: new Date().toISOString(),
  suite_id: suite.suite_id,
  repo_root: repoRoot,
  freeze_scope: {
    prompt_surface: [
      "prompt-stack/v34/AGENTS.md",
      "prompt-stack/v34/01_base/*",
      "prompt-stack/v34/02_overlays/*",
      "prompt-stack/v34/03_examples/*",
      "prompt-stack/v34/04_harness/*",
      "prompt-stack/v34/codex/**"
    ],
    harness_assets: [
      "prompt-stack/v34/harness/scenarios.json",
      "prompt-stack/v34/harness/response_schema.json",
      "prompt-stack/v34/harness/trace_schema.json",
      "prompt-stack/v34/harness/telemetry_schema.json",
      "prompt-stack/v34/harness/sandbox_policy.json",
      "prompt-stack/v34/harness/runner_contract.json",
      "prompt-stack/v34/harness/trial_isolation_policy.json",
      "prompt-stack/v34/harness/mock_tool_contracts.json",
      "prompt-stack/v34/harness/simulated_user_scenarios.json",
      "prompt-stack/v34/harness/trace_to_eval_registry.json",
      "prompt-stack/v34/harness/sensor_inventory.json",
      "prompt-stack/v34/harness/feedforward_guide_inventory.json",
      "prompt-stack/v34/harness/harness_coverage_matrix.json",
      "prompt-stack/v34/harness/repository_legibility_harness.json",
      "prompt-stack/v34/harness/documentation_freshness_policy.json",
      "prompt-stack/v34/harness/observability_harness.json",
      "prompt-stack/v34/harness/architecture_invariant_harness.json",
      "prompt-stack/v34/harness/failure_classification.json",
      "prompt-stack/v34/harness/garbage_collection_policy.json",
      "prompt-stack/v34/harness/review_merge_policy.json",
      "prompt-stack/v34/harness/e2e_task_harness.json",
      "prompt-stack/v34/harness/human_taste_encoding.json",
      "prompt-stack/v34/harness/agent_first_technology_review.json",
      "prompt-stack/v34/harness/harness_readiness_checklist.json",
      "prompt-stack/v34/harness/runtime_substrate_contract.json",
      "prompt-stack/v34/harness/policy_eval_observability_triangle.json",
      "prompt-stack/v34/harness/tool_surface_quality_harness.json",
      "prompt-stack/v34/harness/sandbox_escape_harness.json",
      "prompt-stack/v34/harness/long_running_initializer_harness.json",
      "prompt-stack/v34/harness/claim_strength_gate.json",
      "prompt-stack/v34/harness/run_external_harness.mjs",
      "prompt-stack/v34/harness/run_prompt_behavior_release_gate.mjs",
      "prompt-stack/v34/harness/run_release_gate_repeats.mjs",
      "prompt-stack/v34/harness/release_gate_policy.json"
    ]
  },
  prompt_file_count: promptManifest.length,
  harness_file_count: harnessManifest.length,
  scenario_count: suite.scenarios.length,
  prompt_files: promptManifest,
  harness_files: harnessManifest
};

fs.writeFileSync(
  path.join(freezeDir, "manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log(JSON.stringify({
  freeze_id: freezeId,
  freeze_dir: freezeDir,
  prompt_file_count: manifest.prompt_file_count,
  harness_file_count: manifest.harness_file_count,
  scenario_count: manifest.scenario_count
}, null, 2));

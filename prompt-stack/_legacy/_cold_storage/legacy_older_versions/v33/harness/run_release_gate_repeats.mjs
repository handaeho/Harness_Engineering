import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = "C:\\WORK\\0.개인\\PROMPT";
const harnessRoot = path.join(repoRoot, "prompt-stack", "v33", "harness");
const defaultPolicyPath = path.join(harnessRoot, "release_gate_policy.json");

const rawArgs = process.argv.slice(2);
let freezeId = "rg-2026-05-18-a";
let repeatCount = JSON.parse(fs.readFileSync(defaultPolicyPath, "utf8")).repeat_count;
let runPrefix = "release-gate";

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === "--freeze-id") {
    const next = rawArgs[i + 1];
    if (!next) {
      throw new Error("--freeze-id requires a value");
    }
    freezeId = next;
    i += 1;
    continue;
  }
  if (arg === "--repeat-count") {
    const next = rawArgs[i + 1];
    if (!next) {
      throw new Error("--repeat-count requires a value");
    }
    repeatCount = Number(next);
    i += 1;
    continue;
  }
  if (arg === "--run-prefix") {
    const next = rawArgs[i + 1];
    if (!next) {
      throw new Error("--run-prefix requires a value");
    }
    runPrefix = next;
    i += 1;
  }
}

if (!Number.isInteger(repeatCount) || repeatCount <= 0) {
  throw new Error("--repeat-count must be a positive integer");
}

const freezeDir = path.join(harnessRoot, "freezes", freezeId);
const runnerPath = path.join(freezeDir, "run_external_harness.mjs");
const policyPath = path.join(freezeDir, "release_gate_policy.json");
const aggregatePath = path.join(freezeDir, "runs", `${runPrefix}-aggregate.json`);

if (!fs.existsSync(path.join(freezeDir, "manifest.json"))) {
  throw new Error(`freeze manifest not found: ${freezeDir}`);
}

const policy = JSON.parse(fs.readFileSync(policyPath, "utf8"));

fs.mkdirSync(path.join(freezeDir, "runs"), { recursive: true });

const runSummaries = [];
const scenarioStats = new Map();

function ensureScenarioStat(scenarioId) {
  if (!scenarioStats.has(scenarioId)) {
    scenarioStats.set(scenarioId, {
      scenario_id: scenarioId,
      total_runs: 0,
      pass_count: 0,
      partial_pass_count: 0,
      fail_count: 0,
      runner_failure_count: 0,
      verdict_counts: {},
      evidence_strength_counts: {},
      guide_alignment_counts: {},
      operator_only_dependency_true_count: 0,
      over_orchestration_true_count: 0,
      speculative_patch_widening_true_count: 0,
      missing_operational_artifact_route_true_count: 0
    });
  }
  return scenarioStats.get(scenarioId);
}

for (let index = 1; index <= repeatCount; index += 1) {
  const runId = `${runPrefix}-r${String(index).padStart(2, "0")}`;
  const child = spawnSync(
    "node",
    [
      runnerPath,
      "--harness-root",
      freezeDir,
      "--run-id",
      runId
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024
    }
  );

  const runRecord = {
    run_id: runId,
    exit_code: child.status,
    signal: child.signal
  };

  if (child.status !== 0) {
    runRecord.error = "repeat runner failed";
    runRecord.stdout = child.stdout ?? "";
    runRecord.stderr = child.stderr ?? "";
    runSummaries.push(runRecord);
    continue;
  }

  const summaryPath = path.join(freezeDir, "runs", runId, "summary.json");
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  runRecord.summary_path = path.relative(repoRoot, summaryPath).replace(/\\/g, "/");
  runRecord.scenario_count = summary.scenarios.length;
  runRecord.pass_count = 0;
  runRecord.partial_pass_count = 0;
  runRecord.fail_count = 0;
  runRecord.runner_failure_count = 0;

  for (const scenario of summary.scenarios) {
    const scenarioId = scenario.scenario_id;
    const stat = ensureScenarioStat(scenarioId);
    stat.total_runs += 1;

    if (scenario.exit_code !== 0 || scenario.error) {
      stat.runner_failure_count += 1;
      runRecord.runner_failure_count += 1;
      continue;
    }

    const response = scenario.response;
    const verdict = response.verdict;
    stat.verdict_counts[verdict] = (stat.verdict_counts[verdict] ?? 0) + 1;
    stat.evidence_strength_counts[response.evidence_strength] =
      (stat.evidence_strength_counts[response.evidence_strength] ?? 0) + 1;
    stat.guide_alignment_counts[response.guide_alignment] =
      (stat.guide_alignment_counts[response.guide_alignment] ?? 0) + 1;

    if (verdict === "Pass") {
      stat.pass_count += 1;
      runRecord.pass_count += 1;
    } else if (verdict === "Partial Pass") {
      stat.partial_pass_count += 1;
      runRecord.partial_pass_count += 1;
    } else if (verdict === "Fail") {
      stat.fail_count += 1;
      runRecord.fail_count += 1;
    }

    if (response.operator_only_dependency) {
      stat.operator_only_dependency_true_count += 1;
    }
    if (response.over_orchestration) {
      stat.over_orchestration_true_count += 1;
    }
    if (response.speculative_patch_widening) {
      stat.speculative_patch_widening_true_count += 1;
    }
    if (response.missing_operational_artifact_route) {
      stat.missing_operational_artifact_route_true_count += 1;
    }
  }

  runSummaries.push(runRecord);
}

const scenarioResults = [...scenarioStats.values()]
  .sort((a, b) => a.scenario_id.localeCompare(b.scenario_id))
  .map((stat) => {
    const distinctVerdicts = Object.keys(stat.verdict_counts).sort();
    const distinctEvidenceStrength = Object.keys(stat.evidence_strength_counts).sort();
    const passRate = stat.total_runs
      ? Number((stat.pass_count / stat.total_runs).toFixed(4))
      : 0;

    return {
      ...stat,
      pass_rate: passRate,
      stable_pass: stat.pass_count === stat.total_runs && stat.total_runs > 0,
      flaky: distinctVerdicts.length > 1 || stat.runner_failure_count > 0,
      distinct_verdicts: distinctVerdicts,
      distinct_evidence_strength: distinctEvidenceStrength
    };
  });

const aggregate = {
  freeze_id: freezeId,
  created_at: new Date().toISOString(),
  repeat_count: repeatCount,
  run_prefix: runPrefix,
  policy,
  runner_path: path.relative(repoRoot, runnerPath).replace(/\\/g, "/"),
  runs: runSummaries,
  scenarios: scenarioResults,
  suite_summary: {
    total_runs: repeatCount,
    completed_runs: runSummaries.filter((run) => !run.error).length,
    runner_failures: runSummaries.filter((run) => run.error).length,
    all_scenarios_stable_pass:
      scenarioResults.length > 0 && scenarioResults.every((scenario) => scenario.stable_pass),
    flaky_scenarios: scenarioResults
      .filter((scenario) => scenario.flaky)
      .map((scenario) => scenario.scenario_id)
  }
};

aggregate.suite_summary.release_gate_decision =
  aggregate.suite_summary.completed_runs === repeatCount &&
  aggregate.suite_summary.runner_failures <= policy.max_runner_failures &&
  aggregate.suite_summary.flaky_scenarios.length <= policy.max_flaky_scenarios &&
  scenarioResults.every((scenario) => scenario.pass_rate >= policy.scenario_pass_rate_threshold) &&
  (policy.allow_partial_pass || scenarioResults.every((scenario) => scenario.partial_pass_count === 0))
    ? "Promote"
    : "Hold";

fs.writeFileSync(aggregatePath, JSON.stringify(aggregate, null, 2), "utf8");

console.log(JSON.stringify({
  freeze_id: freezeId,
  repeat_count: repeatCount,
  run_prefix: runPrefix,
  aggregate_path: path.relative(repoRoot, aggregatePath).replace(/\\/g, "/"),
  all_scenarios_stable_pass: aggregate.suite_summary.all_scenarios_stable_pass,
  flaky_scenarios: aggregate.suite_summary.flaky_scenarios
}, null, 2));

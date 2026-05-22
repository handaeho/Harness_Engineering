import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = "C:\\WORK\\0.개인\\PROMPT";
const defaultHarnessDir = path.join(repoRoot, "prompt-stack", "v33", "harness");
const defaultRunId = "2026-05-18-a";

const rawArgs = process.argv.slice(2);
let runId = defaultRunId;
let harnessDir = defaultHarnessDir;
const scenarioArgs = [];

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === "--run-id") {
    const next = rawArgs[i + 1];
    if (!next) {
      throw new Error("--run-id requires a value");
    }
    runId = next;
    i += 1;
    continue;
  }
  if (arg === "--harness-root") {
    const next = rawArgs[i + 1];
    if (!next) {
      throw new Error("--harness-root requires a value");
    }
    harnessDir = path.resolve(next);
    i += 1;
    continue;
  }
  scenarioArgs.push(arg);
}

const schemaPath = path.join(harnessDir, "response_schema.json");
const scenarioPath = path.join(harnessDir, "scenarios.json");
const outDir = path.join(harnessDir, "runs", runId);

fs.mkdirSync(outDir, { recursive: true });

const suite = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
const selectedIds = new Set(scenarioArgs);

function makePrompt(scenario) {
  const activeFiles = scenario.active_files.map((f) => `- ${f}`).join("\n");
  const focus = scenario.focus.map((f) => `- ${f}`).join("\n");

  return [
    "You are an external non-interactive replay runner for v33 assembled prompt evaluation.",
    "",
    "Rules:",
    "- Read only the listed active files as the runtime bundle under review.",
    "- Treat operator-only docs outside that active bundle as out-of-scope runtime owners.",
    "- Do not use web search.",
    "- Do not patch files.",
    "- If evidence is weak or indirect, keep the limitation explicit instead of guessing.",
    "- Return the provided scenario_id and bundle_id exactly.",
    "- Treat focus IDs as review axes, not as required literal strings that must appear in the active files.",
    "- Do not downgrade solely because a BR family ID is not explicitly named if the active bundle directly owns the underlying concept or route.",
    "- For route-selection scenarios, an explicit runtime-owned reroute to another primary skill counts as a direct answer path.",
    "- For local doc-repair scenarios, a user-reported stale or incorrect sentence is a valid localized defect hypothesis; judge whether the bundle chooses the smallest safe fix route rather than whether the exact stale text is quoted in the slice.",
    "- Set operator_only_dependency=true only when a required answer path truly depends on out-of-scope docs, not merely because those docs also discuss the benchmark family.",
    "- Return JSON only matching the provided schema.",
    "",
    `Suite: ${suite.suite_id}`,
    `Scenario: ${scenario.scenario_id}`,
    `Bundle: ${scenario.bundle_id}`,
    "",
    "Active bundle files:",
    activeFiles,
    "",
    "Out-of-scope as runtime owners:",
    "- prompt-stack/v33/PROMPT_USER_GUIDE.md",
    "- prompt-stack/v33/v33_Guide_Reflection_Benchmark_*.md",
    "- prompt-stack/v33/v33_Assembled_Replay_*.md",
    "- prompt-stack/v33/v33_Scenario_*.md",
    "",
    "Task:",
    scenario.task,
    "",
    "Benchmark families in focus:",
    focus,
    "",
    "Evaluation contract:",
    "- verdict=Pass only if the active bundle gives a direct and runtime-owned answer path for the task.",
    "- verdict=Partial Pass if the behavior is mostly right but one important boundary remains indirect or weak.",
    "- verdict=Fail if the task depends on operator-only ownership, missing direct runtime carryover, or unjustified orchestration / patch widening.",
    "- operator_only_dependency=true if a required answer path would depend on out-of-scope docs.",
    "- over_orchestration=true if the bundle would likely recommend multi-agent/A2A or unnecessary structure for this task.",
    "- speculative_patch_widening=true if the bundle would likely widen edits beyond the evidence.",
    "- missing_operational_artifact_route=true if assembled replay or stronger operational artifacts are needed but not directly exposed.",
    "- minimal_patch_targets should be empty unless a concrete runtime-doc gap is exposed by the active bundle itself.",
    "",
    "Use actual file paths in evidence_files."
  ].join("\n");
}

function runScenario(scenario) {
  const prompt = makePrompt(scenario);
  const outFile = path.join(outDir, `${scenario.scenario_id}.json`);
  const stdoutFile = path.join(outDir, `${scenario.scenario_id}.stdout.log`);
  const stderrFile = path.join(outDir, `${scenario.scenario_id}.stderr.log`);

  const args = [
    "exec",
    "--skip-git-repo-check",
    "--ephemeral",
    "--sandbox",
    "read-only",
    "--color",
    "never",
    "--output-schema",
    schemaPath,
    "--output-last-message",
    outFile,
    "-"
  ];

  const child = spawnSync("codex", args, {
    cwd: repoRoot,
    input: prompt,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });

  fs.writeFileSync(stdoutFile, child.stdout ?? "", "utf8");
  fs.writeFileSync(stderrFile, child.stderr ?? "", "utf8");

  const result = {
    scenario_id: scenario.scenario_id,
    exit_code: child.status,
    signal: child.signal,
    output_file: outFile,
    stdout_file: stdoutFile,
    stderr_file: stderrFile
  };

  if (child.error) {
    result.spawn_error = {
      name: child.error.name,
      message: child.error.message,
      code: child.error.code
    };
  }

  if (child.status !== 0) {
    result.error = child.error ? "codex exec spawn failed" : "codex exec failed";
    return result;
  }

  try {
    result.response = JSON.parse(fs.readFileSync(outFile, "utf8"));
  } catch (err) {
    result.error = `failed to parse response JSON: ${err.message}`;
  }

  return result;
}

const summary = {
  suite_id: suite.suite_id,
  run_id: runId,
  created_at: new Date().toISOString(),
  scenarios: []
};

const scenariosToRun = selectedIds.size
  ? suite.scenarios.filter((scenario) => selectedIds.has(scenario.scenario_id))
  : suite.scenarios;

for (const scenario of scenariosToRun) {
  summary.scenarios.push(runScenario(scenario));
}

fs.writeFileSync(
  path.join(outDir, "summary.json"),
  JSON.stringify(summary, null, 2),
  "utf8"
);

console.log(JSON.stringify({
  suite_id: summary.suite_id,
  run_id: summary.run_id,
  out_dir: outDir,
  scenario_count: summary.scenarios.length,
  selected_ids: [...selectedIds],
  failures: summary.scenarios.filter((s) => s.exit_code !== 0 || s.error).length
}, null, 2));

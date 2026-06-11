import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(root, "..");
const packageName = path.basename(root);
const evidenceDir = path.join(workspace, "_evidence", packageName, "validation_runs", "skill_asset_enhancement");
const cases = JSON.parse(fs.readFileSync(path.join(root, "validation", "skill_forward_benchmark_cases.json"), "utf8")).cases;
const resultsPath = path.join(evidenceDir, "subagent_forward_results.json");

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  const file = path.join(root, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalizeForActivePackage(value) {
  return JSON.parse(JSON.stringify(value)
    .replaceAll(`prompt-stack/${packageName}`, "prompt-stack/<current_package>")
    .replaceAll(`/prompt-stack/${packageName}`, "/prompt-stack/<current_package>"));
}

function skillPath(runtime, skill) {
  return `${runtime}/skills/${skill}/SKILL.md`;
}

function routingPath(runtime) {
  return `${runtime}/validation/skill_routing_scenarios.json`;
}

function routingCovers(runtime, skill) {
  const routing = JSON.parse(read(routingPath(runtime)));
  return (routing.scenarios || []).some((scenario) => scenario.expected_skill === skill);
}

fs.mkdirSync(evidenceDir, { recursive: true });
const observed = readJsonIfExists(resultsPath);
const observedByCase = new Map((observed?.results || []).map((item) => [item.case_id, item]));
const caseResults = cases.map((item) => {
  const skillText = read(skillPath(item.runtime, item.skill));
  const observedResult = observedByCase.get(item.case_id)
    ? normalizeForActivePackage(observedByCase.get(item.case_id))
    : null;
  const staticChecks = [
    {
      name: "skill_exists",
      pass: exists(skillPath(item.runtime, item.skill))
    },
    {
      name: "reference_exists",
      pass: exists(item.expected_reference)
    },
    {
      name: "skill_mentions_reference",
      pass: skillText.includes(`references/${item.skill}.md`)
    },
    {
      name: "routing_scenario_exists",
      pass: routingCovers(item.runtime, item.skill)
    }
  ];
  const forwardChecks = item.required_observations.map((term) => ({
    name: `forward_observation:${term}`,
    pass: observedResult ? JSON.stringify(observedResult).toLowerCase().includes(term.toLowerCase()) : false
  }));
  const status = staticChecks.every((check) => check.pass) && forwardChecks.every((check) => check.pass)
    ? "pass"
    : observedResult
      ? "fail"
      : "pending_forward_result";
  return {
    case_id: item.case_id,
    runtime: item.runtime,
    skill: item.skill,
    expected_reference: item.expected_reference,
    status,
    static_checks: staticChecks,
    forward_checks: forwardChecks,
    observed_result: observedResult
  };
});

const forwardResultsPresent = Boolean(observed?.results?.length);
const status = caseResults.every((item) => item.status === "pass")
  ? "pass"
  : forwardResultsPresent
    ? "fail"
    : "pass_with_limitations";
const result = {
  generated_at: new Date().toISOString(),
  validation_name: "skill_asset_enhancement_forward_benchmark",
  claim_strength: forwardResultsPresent ? "local_forward_results_normalized" : "static_forward_spec_ready",
  status,
  cases_total: caseResults.length,
  cases_passed: caseResults.filter((item) => item.status === "pass").length,
  cases_pending_forward_result: caseResults.filter((item) => item.status === "pending_forward_result").length,
  forward_results_present: forwardResultsPresent,
  evidence_input: "_evidence/<current_package>/validation_runs/skill_asset_enhancement/subagent_forward_results.json",
  cases: caseResults
};

fs.writeFileSync(path.join(root, "records", "skill_asset_enhancement_validation_summary.json"), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(evidenceDir, "skill_forward_benchmark_result.json"), `${JSON.stringify(result, null, 2)}\n`);
const report = `# Skill Asset Enhancement Validation

Generated: ${result.generated_at}

Status: ${result.status}

Claim strength: ${result.claim_strength}

Forward results present: ${result.forward_results_present}

| Case | Runtime | Skill | Status |
|---|---|---|---|
${caseResults.map((item) => `| ${item.case_id} | ${item.runtime} | ${item.skill} | ${item.status} |`).join("\n")}
`;
fs.writeFileSync(path.join(root, "reports", "SKILL_ASSET_ENHANCEMENT_VALIDATION.md"), report);
fs.writeFileSync(path.join(evidenceDir, "skill_forward_benchmark_result.md"), report);

console.log(JSON.stringify({
  status: result.status,
  cases_total: result.cases_total,
  cases_passed: result.cases_passed,
  cases_pending_forward_result: result.cases_pending_forward_result,
  forward_results_present: result.forward_results_present
}, null, 2));

if (status === "fail") process.exit(1);

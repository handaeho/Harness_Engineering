import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skills = ["coding-core","design-analysis","eval-ops","grounded-research","orchestration-control","harness-creator-adapter"];
const checks = [];
function read(rel){ return fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), "utf8") : ""; }
function readJson(rel){ try { return JSON.parse(read(rel)); } catch { return null; } }
function exists(rel){ return fs.existsSync(path.join(root, rel)); }
function check(name, pass, detail){ checks.push({ name, pass:Boolean(pass), detail }); }
const forbiddenAgentProse = [
  "this file is",
  "this package",
  "this document",
  "metadata:",
  "asset_name",
  "purpose:",
  "owner_layer",
  "claim_strength",
  "install mode",
  "preferred install",
  "supported manual",
  "## purpose",
  "## examples",
  "## checklist",
  "## output",
  "## status",
  "reserved for"
];
check("codex_agents_exists", exists("codex/AGENTS.md"), "codex/AGENTS.md");
const guide = read("codex/CODEX_RUNTIME_GUIDE.md");
check("codex_runtime_guide_exists", guide.length > 0, "codex/CODEX_RUNTIME_GUIDE.md");
check("codex_runtime_non_mirror_policy", /not a textual mirror|not a copy|not a mirror|do not mirror|not.*mirror/i.test(guide), "guide must reject autonomous mirror assumption");
check("codex_skill_routing_exists", exists("codex/validation/skill_routing_scenarios.json"), "codex/validation/skill_routing_scenarios.json");
check("codex_doc_sources_exists", exists("codex/validation/codex_doc_grounding_sources.json"), "codex/validation/codex_doc_grounding_sources.json");
for (const s of skills) {
  const skillPath = `codex/skills/${s}/SKILL.md`;
  const referencePath = `codex/skills/${s}/references/${s}.md`;
  const skillText = read(skillPath);
  check(`skill_exists:${s}`, exists(skillPath), skillPath);
  check(`skill_reference_exists:${s}`, exists(referencePath), referencePath);
  check(`skill_mentions_reference:${s}`, skillText.includes(`references/${s}.md`), `${skillPath} -> ${referencePath}`);
}
const agentFacingFiles = [
  "codex/AGENTS.md",
  "codex/CODEX_RUNTIME_GUIDE.md",
  "codex/actor_packets/README.md",
  ...skills.map((skill) => `codex/skills/${skill}/SKILL.md`)
];
const proseFindings = [];
for (const rel of agentFacingFiles) {
  const text = read(rel).toLowerCase();
  for (const term of forbiddenAgentProse) {
    if (text.includes(term)) proseFindings.push(`${rel}: ${term}`);
  }
}
check("agent_consumed_assets_are_runtime_instructions", proseFindings.length === 0, proseFindings);
const combined = guide + "\n" + read("codex/AGENTS.md");
for (const term of ["safety", "approval", "tool", "retrieval", "memory", "multi-agent", "release"]) {
  check(`boundary_term:${term}`, combined.toLowerCase().includes(term), term);
}
const routing = readJson("codex/validation/skill_routing_scenarios.json");
check("routing_scenarios_valid_json", routing && Array.isArray(routing.scenarios), "skill_routing_scenarios.json");
check("routing_scenarios_positive_count", (routing?.scenarios || []).length >= skills.length, "at least one scenario per skill");
for (const skill of skills) {
  check(
    `routing_expected_skill:${skill}`,
    (routing?.scenarios || []).some((scenario) => scenario.expected_skill === skill),
    skill
  );
}

const sources = readJson("codex/validation/codex_doc_grounding_sources.json");
const officialSources = sources?.sources || [];
check("source_ledger_has_official_sources", officialSources.length >= 5, "official Codex and Agent Skills source ledger");
check(
  "source_ledger_official_sources_only",
  officialSources.every((source) => typeof source.url === "string"
    && (source.url === "https://developers.openai.com/codex"
      || source.url.startsWith("https://developers.openai.com/codex/")
      || source.url.startsWith("https://agentskills.io/"))),
  officialSources.map((source) => source.url)
);
check(
  "source_ledger_research_separate",
  officialSources.every((source) => !String(source.url).includes("arxiv.org")),
  officialSources.map((source) => source.url)
);

const releaseGradeSources = readJson("validation/release_grade_runtime_source_ledger.json");
check(
  "release_grade_runtime_sources_available",
  Array.isArray(releaseGradeSources?.sources) && releaseGradeSources.sources.length >= 10,
  "validation/release_grade_runtime_source_ledger.json"
);
check(
  "release_grade_runtime_source_shape",
  (releaseGradeSources?.sources || []).every((source) => source.checked_on === releaseGradeSources.checked_on
    && typeof source.observed_last_updated === "string"
    && source.observed_last_updated.length > 0),
  "source entries carry source-level checked_on and observed_last_updated"
);
check(
  "codex_prompt_package_not_provider_proof",
  JSON.stringify(releaseGradeSources || {}).includes("does not prove provider")
    || JSON.stringify(releaseGradeSources || {}).includes("not provider"),
  "prompt-stack Codex runtime must not imply provider proof"
);

check("no_codex_inside_autonomous_99_total", !exists("autonomous/99_total/codex"), "autonomous/99_total/codex must not exist");
const result = { generated_at:new Date().toISOString(), validation_name:"codex_runtime_integrity", mirror_policy:"behavioral alignment, safety preservation, runtime fitness", total_checks:checks.length, passed_checks:checks.filter(c=>c.pass).length, failed_checks:checks.filter(c=>!c.pass).length, status:checks.every(c=>c.pass) ? "pass" : "fail", checks };
fs.mkdirSync(path.join(root, "records"), { recursive:true });
fs.writeFileSync(path.join(root, "records", "codex_runtime_integrity.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ status: result.status, total_checks: result.total_checks, failed_checks: result.failed_checks }, null, 2));
if (result.status !== "pass") process.exit(1);

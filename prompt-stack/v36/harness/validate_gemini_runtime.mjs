import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skills = [
  "coding-core",
  "design-analysis",
  "eval-ops",
  "grounded-research",
  "orchestration-control",
  "harness-creator-adapter"
];

const checks = [];
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

function read(rel) {
  const file = path.join(root, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function readJson(rel) {
  try {
    return JSON.parse(read(rel));
  } catch {
    return null;
  }
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function check(name, pass, detail) {
  checks.push({ name, pass: Boolean(pass), detail });
}

check("gemini_context_exists", exists("gemini/GEMINI.md"), "gemini/GEMINI.md");
check("gemini_agents_exists", exists("gemini/AGENTS.md"), "gemini/AGENTS.md");
check("gemini_runtime_guide_exists", exists("gemini/GEMINI_RUNTIME_GUIDE.md"), "gemini/GEMINI_RUNTIME_GUIDE.md");
check("gemini_actor_packets_exists", exists("gemini/actor_packets/README.md"), "gemini/actor_packets/README.md");
check("gemini_runtime_tests_exists", exists("gemini/validation/gemini_runtime_tests.json"), "gemini/validation/gemini_runtime_tests.json");
check("gemini_skill_routing_exists", exists("gemini/validation/skill_routing_scenarios.json"), "gemini/validation/skill_routing_scenarios.json");
check("gemini_doc_sources_exists", exists("gemini/validation/gemini_doc_grounding_sources.json"), "gemini/validation/gemini_doc_grounding_sources.json");
check("runtime_surface_boundaries_exists", exists("docs/RUNTIME_SURFACE_BOUNDARIES.md"), "docs/RUNTIME_SURFACE_BOUNDARIES.md");

for (const skill of skills) {
  const skillPath = `gemini/skills/${skill}/SKILL.md`;
  const referencePath = `gemini/skills/${skill}/references/${skill}.md`;
  const skillText = read(skillPath);
  check(
    `skill_exists:${skill}`,
    exists(skillPath),
    skillPath
  );
  check(
    `skill_reference_exists:${skill}`,
    exists(referencePath),
    referencePath
  );
  check(
    `skill_mentions_reference:${skill}`,
    skillText.includes(`references/${skill}.md`),
    `${skillPath} -> ${referencePath}`
  );
}

const agentFacingFiles = [
  "gemini/GEMINI.md",
  "gemini/AGENTS.md",
  "gemini/GEMINI_RUNTIME_GUIDE.md",
  "gemini/actor_packets/README.md",
  ...skills.map((skill) => `gemini/skills/${skill}/SKILL.md`)
];
const proseFindings = [];
for (const rel of agentFacingFiles) {
  const text = read(rel).toLowerCase();
  for (const term of forbiddenAgentProse) {
    if (text.includes(term)) proseFindings.push(`${rel}: ${term}`);
  }
}
check("agent_consumed_assets_are_runtime_instructions", proseFindings.length === 0, proseFindings);

const geminiContext = read("gemini/GEMINI.md");
const agents = read("gemini/AGENTS.md");
const guide = read("gemini/GEMINI_RUNTIME_GUIDE.md");
const boundaries = read("docs/RUNTIME_SURFACE_BOUNDARIES.md");
const combined = `${geminiContext}\n${agents}\n${guide}\n${boundaries}`;

check(
  "gemini_runtime_non_mirror_policy",
  /not a textual mirror|not a copy|not.*mirror/i.test(combined),
  "Gemini runtime must reject autonomous/Codex mirror assumption"
);

for (const term of ["native_gemini_api", "openai_compatibility"]) {
  check(`lane_term:${term}`, combined.includes(term), term);
}

for (const term of ["GEMINI.md", ".gemini/skills", ".agents/skills", "SKILL.md"]) {
  check(`gemini_cli_layout_term:${term}`, combined.includes(term), term);
}

for (const term of ["coding-agent prompt package", "autonomous programming-agent runtime", "harness-core/adapters/api/gemini"]) {
  check(`surface_boundary_term:${term}`, combined.includes(term), term);
}

for (const term of ["systemInstruction", "contents", "parts", "functionDeclarations", "functionCallingConfig", "structured output", "safetySettings"]) {
  check(`gemini_api_term:${term}`, combined.includes(term), term);
}

for (const term of ["safety", "approval", "tool", "retrieval", "memory", "multi-agent", "release"]) {
  check(`boundary_term:${term}`, combined.toLowerCase().includes(term), term);
}

const claimText = combined.toLowerCase();
for (const term of ["provider_verified", "adapter_checked", "release_gated", "production_ready", "live gemini canary passed"]) {
  check(`blocked_claim_downgraded:${term}`, claimText.includes(term) || claimText.includes(term.replaceAll("_", "-")), term);
}

const routing = readJson("gemini/validation/skill_routing_scenarios.json");
check("routing_scenarios_valid_json", routing && Array.isArray(routing.scenarios), "skill_routing_scenarios.json");
check("routing_scenarios_positive_count", (routing?.scenarios || []).length >= skills.length, "at least one scenario per skill");
for (const skill of skills) {
  check(
    `routing_expected_skill:${skill}`,
    (routing?.scenarios || []).some((scenario) => scenario.expected_skill === skill),
    skill
  );
}

const sources = readJson("gemini/validation/gemini_doc_grounding_sources.json");
const officialSources = sources?.sources || [];
check("source_ledger_has_official_sources", officialSources.length >= 9, "official Google source ledger");
check(
  "source_ledger_official_sources_only",
  officialSources.every((source) => typeof source.url === "string"
    && (source.url.startsWith("https://ai.google.dev/gemini-api/docs")
      || source.url.startsWith("https://github.com/google-gemini/gemini-cli/"))),
  officialSources.map((source) => source.url)
);
check(
  "source_ledger_no_need_verification_markers",
  !JSON.stringify(sources || {}).includes("Need Verification"),
  "observed last-updated dates refreshed or checked"
);

check(
  "no_gemini_inside_autonomous_99_total",
  !exists("autonomous/99_total/gemini"),
  "autonomous/99_total/gemini must not exist"
);

check(
  "no_gemini_inside_codex",
  !exists("codex/gemini"),
  "codex/gemini must not exist"
);

const result = {
  generated_at: new Date().toISOString(),
  validation_name: "gemini_runtime_integrity",
  claim_strength: "local_static_runtime_validation",
  mirror_policy: "behavioral alignment, Gemini runtime fitness, safety preservation; no text parity requirement",
  total_checks: checks.length,
  passed_checks: checks.filter((entry) => entry.pass).length,
  failed_checks: checks.filter((entry) => !entry.pass).length,
  status: checks.every((entry) => entry.pass) ? "pass" : "fail",
  checks
};

fs.mkdirSync(path.join(root, "records"), { recursive: true });
fs.writeFileSync(path.join(root, "records", "gemini_runtime_integrity.json"), `${JSON.stringify(result, null, 2)}\n`);

console.log(JSON.stringify({
  status: result.status,
  total_checks: result.total_checks,
  failed_checks: result.failed_checks,
  claim_strength: result.claim_strength
}, null, 2));

if (result.status !== "pass") process.exit(1);

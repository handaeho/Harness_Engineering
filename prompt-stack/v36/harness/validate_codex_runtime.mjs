import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skills = ["coding-core","design-analysis","eval-ops","grounded-research","orchestration-control","harness-creator-adapter"];
const checks = [];
function read(rel){ return fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), "utf8") : ""; }
function check(name, pass, detail){ checks.push({ name, pass:Boolean(pass), detail }); }
check("codex_agents_exists", fs.existsSync(path.join(root, "codex", "AGENTS.md")), "codex/AGENTS.md");
const guide = read("codex/CODEX_RUNTIME_GUIDE.md");
check("codex_runtime_guide_exists", guide.length > 0, "codex/CODEX_RUNTIME_GUIDE.md");
check("codex_runtime_non_mirror_policy", /not a textual mirror|not a copy|not a mirror/i.test(guide), "guide must reject autonomous mirror assumption");
for (const s of skills) check(`skill_exists:${s}`, fs.existsSync(path.join(root, "codex", "skills", s, "SKILL.md")), `codex/skills/${s}/SKILL.md`);
const combined = guide + "\n" + read("codex/AGENTS.md");
for (const term of ["safety", "approval", "tool", "retrieval", "memory", "multi-agent", "release"]) {
  check(`boundary_term:${term}`, combined.toLowerCase().includes(term), term);
}
check("no_codex_inside_autonomous_99_total", !fs.existsSync(path.join(root, "autonomous", "99_total", "codex")), "autonomous/99_total/codex must not exist");
const result = { generated_at:new Date().toISOString(), validation_name:"codex_runtime_integrity", mirror_policy:"behavioral alignment, safety preservation, runtime fitness", total_checks:checks.length, passed_checks:checks.filter(c=>c.pass).length, failed_checks:checks.filter(c=>!c.pass).length, status:checks.every(c=>c.pass) ? "pass" : "fail", checks };
fs.mkdirSync(path.join(root, "records"), { recursive:true });
fs.writeFileSync(path.join(root, "records", "codex_runtime_integrity.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ status: result.status, total_checks: result.total_checks, failed_checks: result.failed_checks }, null, 2));
if (result.status !== "pass") process.exit(1);

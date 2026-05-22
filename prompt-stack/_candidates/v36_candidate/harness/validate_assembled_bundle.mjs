import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirs = ["00_governance", "01_base", "02_overlays", "03_examples", "04_harness"];
const checks = [];
function slash(p){ return p.replace(/\\/g, "/"); }
function listFiles(dir){ const out=[]; function walk(d){ if(!fs.existsSync(d)) return; for(const e of fs.readdirSync(d,{withFileTypes:true})){ const f=path.join(d,e.name); if(e.isDirectory()) walk(f); else if(e.isFile()) out.push(f); } } walk(dir); return out.sort((a,b)=>slash(a).localeCompare(slash(b))); }
function sha(file){ return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function check(name, pass, detail){ checks.push({ name, pass:Boolean(pass), detail }); }
for (const dir of sourceDirs) {
  for (const src of listFiles(path.join(root, "autonomous", dir))) {
    const target = path.join(root, "autonomous", "99_total", path.basename(src));
    check(`parity:${dir}/${path.basename(src)}`, fs.existsSync(target) && sha(src) === sha(target), `${slash(path.relative(root, src))} -> ${slash(path.relative(root, target))}`);
  }
}
check("no_codex_under_autonomous_99_total", !fs.existsSync(path.join(root, "autonomous", "99_total", "codex")), "autonomous/99_total/codex must not exist");
const result = { generated_at:new Date().toISOString(), validation_name:"assembled_bundle_integrity", total_checks:checks.length, passed_checks:checks.filter(c=>c.pass).length, failed_checks:checks.filter(c=>!c.pass).length, status:checks.every(c=>c.pass) ? "pass" : "fail", checks };
fs.mkdirSync(path.join(root, "records"), { recursive:true });
fs.writeFileSync(path.join(root, "records", "assembled_bundle_integrity.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ status: result.status, total_checks: result.total_checks, failed_checks: result.failed_checks }, null, 2));
if (result.status !== "pass") process.exit(1);

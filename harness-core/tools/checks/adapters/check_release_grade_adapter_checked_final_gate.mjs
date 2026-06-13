#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-adapter-checked-final-gate";
const EVIDENCE_DIR = "release-grade-adapter-checked-final-gate";
const REQUIRED = [
  "release_grade_adapter_checked_final_gate_report.json",
  "adapter_checked_claim_boundary.json",
  "unresolved_items.json"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function readJsonIfExists(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
for (const file of REQUIRED) {
  addCheck(checks, `${file} exists`, fs.existsSync(e(file)), {});
}

const report = readJsonIfExists(e("release_grade_adapter_checked_final_gate_report.json"));
const boundary = readJsonIfExists(e("adapter_checked_claim_boundary.json"));
const unresolved = readJsonIfExists(e("unresolved_items.json"));

addCheck(checks, "stage matches", report?.stage === STAGE && boundary?.stage === STAGE, {
  report_stage: report?.stage || null,
  boundary_stage: boundary?.stage || null
});
addCheck(checks, "status pass", report?.status === "pass"
  && report?.adapter_checked_final_gate_executed === true, {
  status: report?.status || null,
  adapter_checked_final_gate_executed: report?.adapter_checked_final_gate_executed || false
});
addCheck(checks, "provider and adapter claims allowed", report?.provider_verified_allowed === true
  && report?.adapter_checked_allowed === true
  && boundary?.provider_verified_allowed === true
  && boundary?.adapter_checked_allowed === true
  && Array.isArray(boundary?.allowed_claims)
  && boundary.allowed_claims.includes("provider-verified")
  && boundary.allowed_claims.includes("adapter-checked"), boundary || {});
addCheck(checks, "stronger release claims still blocked", report?.production_ready_allowed === false
  && report?.stable_allowed === false
  && report?.release_gated_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.stable_allowed === false
  && boundary?.release_gated_allowed === false, boundary || {});
addCheck(checks, "unresolved items empty", unresolved?.unresolved_items_count === 0
  && Array.isArray(unresolved?.unresolved_items)
  && unresolved.unresolved_items.length === 0, unresolved || {});
addCheck(checks, "no new live execution by final gate", report?.live_execution?.new_openai_provider_call === false
  && report?.live_execution?.new_gemini_provider_call === false
  && report?.live_execution?.new_local_model_execution_by_this_gate === false
  && report?.live_execution?.telemetry_sink_write === false, report?.live_execution || {});

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "hold",
  stage: STAGE,
  adapter_checked_allowed: failures.length === 0,
  checks,
  failures,
  unresolved_items_count: unresolved?.unresolved_items_count ?? null
};
const md = `# Release-grade Adapter-Checked Final Gate Check

Status: ${gate.status}

- Stage: ${STAGE}
- Adapter-checked allowed: ${gate.adapter_checked_allowed}
- Unresolved items: ${gate.unresolved_items_count}
`;

writeJson(p("evals", "reports", "release_grade_adapter_checked_final_gate_check_report.json"), gate);
writeText(p("evals", "reports", "release_grade_adapter_checked_final_gate_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);

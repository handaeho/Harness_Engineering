#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "rc1-final-handoff");

function rel(...parts) {
  return path.join(evidenceDir, ...parts);
}

function exists(file) {
  return fs.existsSync(rel(file));
}

function readIfExists(file) {
  return exists(file) ? readJson(rel(file)) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function fieldFrom(field, ...objects) {
  for (const object of objects) {
    if (object && Object.prototype.hasOwnProperty.call(object, field)) return object[field];
  }
  return undefined;
}

const checks = [];
const dirExists = fs.existsSync(evidenceDir) && fs.statSync(evidenceDir).isDirectory();
addCheck(checks, "evidence/rc1-final-handoff directory exists", dirExists, {
  path: "evidence/rc1-final-handoff"
});

const requiredFiles = [
  "rc1_final_handoff_report.json",
  "rc1_current_claim_state.json",
  "rc1_deferred_path_registry.json",
  "rc1_post_rc_options_registry.json",
  "rc1_final_evidence_pointer_index.json",
  "rc1_next_action_decision_matrix.json"
];

for (const file of requiredFiles) {
  addCheck(checks, `${file} exists`, dirExists && exists(file), {
    path: `evidence/rc1-final-handoff/${file}`
  });
}

const report = readIfExists("rc1_final_handoff_report.json");
const claimState = readIfExists("rc1_current_claim_state.json");
const deferredRegistry = readIfExists("rc1_deferred_path_registry.json");
const postRcOptions = readIfExists("rc1_post_rc_options_registry.json");
const pointerIndex = readIfExists("rc1_final_evidence_pointer_index.json");
const decisionMatrix = readIfExists("rc1_next_action_decision_matrix.json");

const rc1ReleaseGated = fieldFrom("rc1_openai_scope_release_gated", claimState, report);
const rc1Frozen = fieldFrom("rc1_openai_scope_frozen", claimState, report);
const stableAllowed = fieldFrom("stable_allowed", claimState, report);
const productionReadyAllowed = fieldFrom("production_ready_allowed", claimState, report);
const providerDiverseAllowed = fieldFrom("provider_diverse_allowed", claimState, report);

addCheck(checks, "rc1_openai_scope_release_gated true", rc1ReleaseGated === true, {
  value: rc1ReleaseGated
});
addCheck(checks, "rc1_openai_scope_frozen true", rc1Frozen === true, {
  value: rc1Frozen
});
addCheck(checks, "stable_allowed false", stableAllowed === false, {
  value: stableAllowed
});
addCheck(checks, "production_ready_allowed false", productionReadyAllowed === false, {
  value: productionReadyAllowed
});
addCheck(checks, "provider_diverse_allowed false", providerDiverseAllowed === false, {
  value: providerDiverseAllowed
});
addCheck(checks, "deferred path registry readable", Boolean(deferredRegistry), {});
addCheck(checks, "post-RC options registry readable", Boolean(postRcOptions), {});
addCheck(checks, "final evidence pointer index readable", Boolean(pointerIndex), {});
addCheck(checks, "next action decision matrix readable", Boolean(decisionMatrix), {});

const missingFinalHandoffArtifacts = !dirExists || requiredFiles.some((file) => !exists(file));
const failed = checks.filter((check) => check.status !== "pass");
const status = missingFinalHandoffArtifacts
  ? "blocked_by_missing_rc1_final_handoff_artifacts"
  : failed.length
    ? "fail"
    : "pass";

const result = {
  status,
  checker: "check_rc1_final_handoff.mjs",
  read_only_compatibility_checker: true,
  creates_final_handoff_evidence: false,
  opens_new_claims: false,
  required_directory: "evidence/rc1-final-handoff",
  required_files: requiredFiles,
  rc1_openai_scope_release_gated: rc1ReleaseGated === true,
  rc1_openai_scope_frozen: rc1Frozen === true,
  stable_allowed: stableAllowed === false ? false : stableAllowed,
  production_ready_allowed: productionReadyAllowed === false ? false : productionReadyAllowed,
  provider_diverse_allowed: providerDiverseAllowed === false ? false : providerDiverseAllowed,
  checks
};

console.log(JSON.stringify(result, null, 2));
process.exit(status === "pass" ? 0 : 1);

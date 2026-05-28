#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-v36-baseline-refresh-for-monitoring-result-review-after-owner-approval";
const EVIDENCE_DIR = "evidence/post-rc-v36-baseline-refresh-for-monitoring-result-review";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

function p(...parts) {
  return path.join(root, ...parts);
}

function e(file) {
  return p(...EVIDENCE_DIR.split("/"), file);
}

function readJsonIfExists(file) {
  try {
    return readJson(file);
  } catch {
    return null;
  }
}

const approval = readJsonIfExists(e("owner_approval_record.json"));
const refresh = readJsonIfExists(e("v36_baseline_refresh_report.json"));
const delta = readJsonIfExists(e("v36_baseline_refresh_delta.json"));
const compare = readJsonIfExists(e("compare_v36_baseline_after_refresh.json"));
const resume = readJsonIfExists(e("monitoring_result_review_resume_report.json"));

const checks = [
  {
    name: "owner approval matched",
    pass: approval?.approval_phrase_matched === true
  },
  {
    name: "baseline refresh performed",
    pass: refresh?.baseline_refresh_performed === true
  },
  {
    name: "hash delta recorded",
    pass: delta?.status === "recorded" && typeof delta?.files_with_hash_changes === "number"
  },
  {
    name: "compare restored",
    pass: compare?.status === "pass" && compare?.baseline_refresh_effective === true
  },
  {
    name: "monitoring result review resumed",
    pass: resume?.status === "pass" && resume?.can_enter_production_monitoring_final_gate === true
  },
  {
    name: "stronger claims remain blocked",
    pass: refresh?.production_monitored_allowed !== true
      && resume?.production_monitored_allowed === false
      && resume?.production_ready_allowed === false
      && resume?.stable_allowed === false
      && resume?.provider_diverse_allowed === false
  }
];

const failures = checks.filter((check) => !check.pass);
const result = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  files_with_hash_changes: delta?.files_with_hash_changes ?? null,
  post_refresh_mismatch_count: delta?.post_refresh_mismatch_count ?? null,
  can_enter_production_monitoring_final_gate: resume?.can_enter_production_monitoring_final_gate === true,
  production_monitored_allowed: false,
  checks: checks.map((check) => ({
    name: check.name,
    status: check.pass ? "pass" : "fail"
  })),
  failures: failures.map((check) => check.name)
};

writeJson(p("evals", "reports", "post_rc_v36_baseline_refresh_delta_report.json"), {
  ...(delta || {}),
  audit_status: result.status,
  audit_checks: result.checks
});

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);

#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-vllm-operator-env-guard-regression";
const EVIDENCE_DIR = "release-grade-vllm-operator-env-guard";
const CHECKER = "tools/checks/local/check_vllm_operator_env_guard.mjs";

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(base, relPath) {
  return path.join(base, ...relPath.split("/"));
}

function runChecker(caseId, checkerArgs) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), `harness-core-vllm-env-${caseId}-`));
  try {
    const result = spawnSync(process.execPath, [
      p(root, CHECKER),
      fixtureRoot,
      `--evidence-dir=${EVIDENCE_DIR}`,
      `--report-prefix=release_grade_vllm_operator_env_guard_${caseId}`,
      ...checkerArgs
    ], {
      cwd: root,
      encoding: "utf8",
      env: {
        PATH: process.env.PATH || "",
        HOME: process.env.HOME || ""
      },
      maxBuffer: 8 * 1024 * 1024
    });
    const reportPath = p(fixtureRoot, `evidence/${EVIDENCE_DIR}/vllm_operator_env_guard_report.json`);
    const report = fs.existsSync(reportPath) ? readJson(reportPath) : null;
    return {
      exit_code: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      report
    };
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function assertCase(id, checkerArgs, predicate) {
  const run = runChecker(id, checkerArgs);
  const assertion = predicate(run.report, run);
  return {
    id,
    status: assertion.pass ? "pass" : "fail",
    exit_code: run.exit_code,
    assertion,
    observed: {
      status: run.report?.status || null,
      endpoint_url: run.report?.endpoint_url || null,
      model_name_present: run.report?.model_name_present ?? null,
      auth_required: run.report?.auth_required || null,
      api_key_present: run.report?.api_key_present ?? null,
      can_enter_vllm_live_evidence_gate: run.report?.can_enter_vllm_live_evidence_gate ?? null,
      claims_blocked: run.report?.claims_blocked || null,
      failure_names: run.report?.failures?.map((item) => item.name) || [],
      hold_names: run.report?.holds?.map((item) => item.name) || []
    }
  };
}

const cases = [
  assertCase("valid_local_no_auth_passes", [
    "--strict",
    "--endpoint-url=http://127.0.0.1:8000/v1",
    "--model=local-vllm-test-model",
    "--auth-required=no",
    "--api-key-present=no"
  ], (report, run) => ({
    pass: run.exit_code === 0
      && report?.status === "pass"
      && report?.can_enter_vllm_live_evidence_gate === true
      && report?.local_endpoint_probe === false
      && report?.local_model_execution === false
      && report?.api_key_value_stored === false,
    expected: "valid localhost no-auth config passes without live execution"
  })),
  assertCase("missing_model_non_strict_holds", [
    "--endpoint-url=http://127.0.0.1:8000/v1",
    "--auth-required=no",
    "--api-key-present=no"
  ], (report, run) => ({
    pass: run.exit_code === 0
      && report?.status === "hold"
      && report?.can_enter_vllm_live_evidence_gate === false
      && report?.holds?.some((item) => item.name === "model name is present"),
    expected: "non-strict missing model records hold but does not fail preflight"
  })),
  assertCase("smart_quote_model_fails", [
    "--strict",
    "--endpoint-url=http://127.0.0.1:8000/v1",
    "--model=\u201Clocal-vllm-test-model\u201D",
    "--auth-required=no",
    "--api-key-present=no"
  ], (report, run) => ({
    pass: run.exit_code === 1
      && report?.status === "fail"
      && report?.failures?.some((item) => item.name === "model name has no smart quotes")
      && report?.claims_blocked?.includes("adapter-checked"),
    expected: "smart-quoted model id fails before live execution"
  })),
  assertCase("remote_endpoint_fails", [
    "--strict",
    "--endpoint-url=https://example.com/v1",
    "--model=local-vllm-test-model",
    "--auth-required=no",
    "--api-key-present=no"
  ], (report, run) => ({
    pass: run.exit_code === 1
      && report?.status === "fail"
      && report?.failures?.some((item) => item.name === "endpoint is localhost-only"),
    expected: "non-localhost endpoint fails"
  })),
  assertCase("auth_yes_without_key_fails", [
    "--strict",
    "--endpoint-url=http://127.0.0.1:8000/v1",
    "--model=local-vllm-test-model",
    "--auth-required=yes",
    "--api-key-present=no"
  ], (report, run) => ({
    pass: run.exit_code === 1
      && report?.status === "fail"
      && report?.failures?.some((item) => item.name === "api key presence matches auth requirement"),
    expected: "auth-required yes requires token presence"
  })),
  assertCase("auth_yes_with_key_passes_without_storing_secret", [
    "--strict",
    "--endpoint-url=http://localhost:8000/v1",
    "--model=local-vllm-test-model",
    "--auth-required=yes",
    "--api-key-present=yes"
  ], (report, run) => ({
    pass: run.exit_code === 0
      && report?.status === "pass"
      && report?.api_key_present === true
      && report?.api_key_value_stored === false
      && report?.raw_authorization_header_recorded === false
      && report?.secrets_logged === false,
    expected: "auth presence can pass while secret value remains unstored"
  }))
];

const failures = cases.filter((item) => item.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  checker_under_test: CHECKER,
  fixture_execution: {
    live_provider_call: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    telemetry_sink_write: false,
    temp_fixture_roots_retained: false
  },
  cases_total: cases.length,
  cases_passed: cases.filter((item) => item.status === "pass").length,
  cases_failed: failures.length,
  cases,
  failures
};

const md = `# vLLM Operator Environment Guard Regression

Status: ${report.status}

- Cases passed: ${report.cases_passed}/${report.cases_total}
- Live provider call: false
- Local endpoint probe: false
- Local model execution: false
- Telemetry sink write: false
`;

writeJson(p(root, `evidence/${EVIDENCE_DIR}/vllm_operator_env_guard_regression_report.json`), report);
writeText(p(root, `evidence/${EVIDENCE_DIR}/vllm_operator_env_guard_regression_report.md`), md);
writeJson(p(root, "evals/reports/release_grade_vllm_operator_env_guard_regression_report.json"), report);
writeText(p(root, "evals/reports/release_grade_vllm_operator_env_guard_regression_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

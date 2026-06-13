#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-vllm-evidence-package-regression";
const EVIDENCE_DIR = "release-grade-vllm-evidence-package";
const CHECKER = "tools/checks/adapters/check_release_grade_vllm_evidence_package.mjs";

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

function writeFixtureJson(fixtureRoot, relPath, value) {
  writeJson(p(fixtureRoot, relPath), value);
}

function sourceGeneratedAt(minutes) {
  return `2026-06-12T00:${String(minutes).padStart(2, "0")}:00.000Z`;
}

function baseFixture(overrides = {}) {
  const {
    generalStatus = "hold",
    generalApprovalPresent = false,
    generalClaimsOpen = false,
    adapterGeneratedAt = sourceGeneratedAt(10),
    generalGeneratedAt = sourceGeneratedAt(20),
    omit = []
  } = overrides;
  const omitted = new Set(omit);
  return {
    "evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json": {
      status: "pass",
      stage: "v2.0.0-release-grade-provider-verified-gate",
      generated_at: sourceGeneratedAt(1),
      provider_verified_allowed: true,
      allowed_claims: ["provider-verified"],
      blocked_claims: ["adapter-checked", "production-ready", "stable", "release-gated", "bare release-gated"],
      blockers: []
    },
    "evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_report.json": {
      status: "pass",
      stage: "v2.0.0-release-grade-vllm-operator-env-guard",
      generated_at: sourceGeneratedAt(2),
      provider: "vllm",
      can_enter_vllm_live_evidence_gate: true,
      local_endpoint_probe: false,
      local_model_execution: false,
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false,
      api_key_value_stored: false
    },
    "evidence/post-stable-vllm-endpoint-readiness-preflight/local_endpoint_readiness_preflight_report.json": {
      status: "pass",
      stage: "v2.0.0-post-rc-local-endpoint-readiness-preflight",
      generated_at: sourceGeneratedAt(3),
      provider: "vllm",
      can_enter_local_no_tool_canary: true,
      local_endpoint_probe: true,
      local_model_execution: false,
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    },
    "evidence/post-stable-vllm-endpoint-readiness-preflight/endpoint_probe_summary.json": {
      status: "pass",
      provider: "vllm",
      endpoint_probe: "localhost_openai_compatible_probe_passed",
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    },
    "evidence/post-stable-local-vllm-no-tool-canary/vllm_no_tool_canary_report.json": {
      status: "pass",
      stage: "v2.0.0-post-stable-local-vllm-no-tool-canary",
      generated_at: sourceGeneratedAt(4),
      provider: "vllm",
      vllm_no_tool_canary_executed: true,
      vllm_local_server_roundtrip_passed: true,
      local_model_execution: true,
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    },
    "evals/reports/vllm_no_tool_canary_check_report.json": {
      status: "pass",
      stage: "v2.0.0-post-stable-local-vllm-no-tool-canary",
      generated_at: sourceGeneratedAt(5)
    },
    "evidence/post-stable-vllm-adapter-conformance-local-execution/vllm_adapter_conformance_report.json": {
      status: "pass",
      stage: "v2.0.0-post-stable-vllm-adapter-conformance-local-execution",
      generated_at: sourceGeneratedAt(6),
      provider: "vllm",
      local_model_execution: true,
      structured_output_runtime_checked: true,
      tool_parser_runtime_checked: true,
      external_tool_executed: false,
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    },
    "evals/reports/vllm_adapter_conformance_check_report.json": {
      status: "pass",
      stage: "v2.0.0-post-stable-vllm-adapter-conformance-local-execution",
      generated_at: sourceGeneratedAt(7)
    },
    "evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json": {
      status: "ready_for_adapter_checked_final_gate",
      stage: "v2.0.0-release-grade-adapter-coverage-completion",
      generated_at: sourceGeneratedAt(8),
      ready_for_adapter_checked_final_gate: true,
      can_enter_adapter_checked_final_gate: true,
      adapter_checked_allowed: false,
      provider_verified_allowed: true
    },
    "evals/reports/release_grade_adapter_coverage_completion_check_report.json": {
      status: "pass",
      stage: "v2.0.0-release-grade-adapter-coverage-completion",
      generated_at: sourceGeneratedAt(9),
      ready_for_adapter_checked_final_gate: true,
      adapter_checked_allowed: false
    },
    "evidence/release-grade-adapter-vllm-preflight/release_grade_adapter_vllm_preflight_report.json": {
      status: "pass",
      stage: "v2.0.0-release-grade-adapter-vllm-preflight",
      generated_at: sourceGeneratedAt(10),
      provider_verified_allowed: true,
      adapter_checked_allowed: false
    },
    "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json": {
      status: "pass",
      stage: "v2.0.0-release-grade-adapter-checked-final-gate",
      generated_at: adapterGeneratedAt,
      provider_verified_allowed: true,
      adapter_checked_allowed: true,
      production_ready_allowed: false,
      stable_allowed: false,
      release_gated_allowed: false,
      allowed_claims: ["provider-verified", "adapter-checked"],
      blocked_claims: ["production-ready", "stable", "release-gated", "bare release-gated"]
    },
    "evals/reports/release_grade_adapter_checked_final_gate_check_report.json": {
      status: "pass",
      stage: "v2.0.0-release-grade-adapter-checked-final-gate",
      generated_at: sourceGeneratedAt(12),
      adapter_checked_allowed: true
    },
    "evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json": {
      status: generalStatus,
      stage: "v2.0.0-release-grade-general-release-gate",
      generated_at: generalGeneratedAt,
      provider_verified_allowed: true,
      adapter_checked_allowed: true,
      production_ready_allowed: generalClaimsOpen,
      stable_allowed: generalClaimsOpen,
      release_gated_allowed: generalClaimsOpen,
      approval_event: {
        required: true,
        approval_present: generalApprovalPresent,
        approval_text_stored: false
      }
    },
    "evals/reports/release_grade_general_release_gate_check_report.json": {
      status: generalStatus,
      stage: "v2.0.0-release-grade-general-release-gate",
      generated_at: sourceGeneratedAt(21)
    }
  };
}

function createFixtureRoot(name, overrides) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), `harness-core-vllm-package-${name}-`));
  const files = baseFixture(overrides);
  const omitted = new Set(overrides.omit || []);
  for (const [relPath, value] of Object.entries(files)) {
    if (!omitted.has(relPath)) writeFixtureJson(fixtureRoot, relPath, value);
  }
  return fixtureRoot;
}

function runChecker(fixtureRoot) {
  const result = spawnSync(process.execPath, [p(root, CHECKER), fixtureRoot], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  const reportPath = p(fixtureRoot, "evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json");
  const report = fs.existsSync(reportPath) ? readJson(reportPath) : null;
  return {
    exit_code: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    report
  };
}

function assertCase(name, overrides, predicate) {
  const fixtureRoot = createFixtureRoot(name, overrides);
  try {
    const run = runChecker(fixtureRoot);
    const assertion = predicate(run.report, run);
    return {
      id: name,
      status: run.exit_code === 0 && assertion.pass ? "pass" : "fail",
      exit_code: run.exit_code,
      assertion,
      observed: {
        status: run.report?.status || null,
        provider_verified_allowed: run.report?.provider_verified_allowed ?? null,
        adapter_checked_allowed: run.report?.adapter_checked_allowed ?? null,
        production_ready_allowed: run.report?.production_ready_allowed ?? null,
        stable_allowed: run.report?.stable_allowed ?? null,
        release_gated_allowed: run.report?.release_gated_allowed ?? null,
        claim_promotion_readiness: run.report?.claim_promotion_readiness || null,
        missing_or_incomplete_count: run.report?.missing_or_incomplete_artifacts?.length ?? null,
        stale_or_unordered_count: run.report?.stale_or_unordered_artifacts?.length ?? null,
        blocked_claims: run.report?.blocked_claims || null,
        allowed_claims_after_pass: run.report?.allowed_claims_after_pass || null
      }
    };
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

const cases = [
  assertCase("adapter_only_pass_keeps_general_blocked", {
    generalStatus: "hold",
    generalApprovalPresent: false,
    generalClaimsOpen: false
  }, (report) => ({
    pass: report?.status === "pass"
      && report?.adapter_checked_allowed === true
      && report?.production_ready_allowed === false
      && report?.stable_allowed === false
      && report?.release_gated_allowed === false
      && report?.claim_promotion_readiness?.adapter_checked === "open_by_adapter_checked_final_gate"
      && report?.claim_promotion_readiness?.general_release === "awaiting_explicit_general_release_approval_or_general_gate_pass"
      && report?.blocked_claims?.includes("production-ready")
      && report?.allowed_claims_after_pass?.includes("adapter-checked"),
    expected: "adapter-checked opens while general release claims remain blocked without approval"
  })),
  assertCase("approved_general_release_opens_general_claims", {
    generalStatus: "pass",
    generalApprovalPresent: true,
    generalClaimsOpen: true
  }, (report) => ({
    pass: report?.status === "pass"
      && report?.adapter_checked_allowed === true
      && report?.production_ready_allowed === true
      && report?.stable_allowed === true
      && report?.release_gated_allowed === true
      && report?.claim_promotion_readiness?.general_release === "open_by_general_release_gate"
      && Array.isArray(report?.blocked_claims)
      && report.blocked_claims.length === 0
      && ["adapter-checked", "production-ready", "stable", "release-gated"].every((claim) => report?.allowed_claims_after_pass?.includes(claim)),
    expected: "general release claims open only when the general release gate passes with approval"
  })),
  assertCase("stale_general_gate_holds_package", {
    generalStatus: "hold",
    generalApprovalPresent: false,
    generalClaimsOpen: false,
    adapterGeneratedAt: sourceGeneratedAt(20),
    generalGeneratedAt: sourceGeneratedAt(10)
  }, (report) => ({
    pass: report?.status === "hold"
      && report?.adapter_checked_allowed === false
      && report?.stale_or_unordered_artifacts?.length === 1
      && report?.stale_or_unordered_artifacts?.[0]?.id === "general_release_gate_refreshed_after_adapter_final_gate"
      && report?.blocked_claims?.includes("adapter-checked"),
    expected: "stale general release gate evidence cannot be used after adapter final gate"
  })),
  assertCase("missing_vllm_no_tool_holds_package", {
    omit: ["evidence/post-stable-local-vllm-no-tool-canary/vllm_no_tool_canary_report.json"]
  }, (report) => ({
    pass: report?.status === "hold"
      && report?.adapter_checked_allowed === false
      && report?.missing_or_incomplete_artifacts?.some((item) => item.id === "vllm_no_tool_canary")
      && report?.blocked_claims?.includes("adapter-checked"),
    expected: "missing vLLM no-tool execution evidence keeps adapter-checked blocked"
  })),
  assertCase("missing_operator_env_guard_holds_package", {
    omit: ["evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_report.json"]
  }, (report) => ({
    pass: report?.status === "hold"
      && report?.adapter_checked_allowed === false
      && report?.missing_or_incomplete_artifacts?.some((item) => item.id === "vllm_operator_env_guard")
      && report?.blocked_claims?.includes("adapter-checked"),
    expected: "missing vLLM operator environment guard keeps adapter-checked blocked"
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
const md = `# Release-grade vLLM Evidence Package Regression

Status: ${report.status}

- Cases passed: ${report.cases_passed}/${report.cases_total}
- Live provider call: false
- Local model execution: false
- Telemetry sink write: false
`;

writeJson(p(root, `evidence/${EVIDENCE_DIR}/vllm_evidence_package_regression_report.json`), report);
writeText(p(root, `evidence/${EVIDENCE_DIR}/vllm_evidence_package_regression_report.md`), md);
writeJson(p(root, "evals/reports/release_grade_vllm_evidence_package_regression_report.json"), report);
writeText(p(root, "evals/reports/release_grade_vllm_evidence_package_regression_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

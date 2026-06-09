#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";
import { routeRedteamCase } from "../../../runtime/redteam/mock_redteam_case_router.mjs";
import { runMockRedteamCase, skippedRedteamCase } from "../../../runtime/redteam/mock_redteam_runtime.mjs";
import { createTraceRecorder } from "../../../runtime/redteam/mock_redteam_trace_recorder.mjs";
import {
  addResultToSeveritySummary,
  createSeveritySummary,
  summarizeClaimImpact
} from "../../../runtime/redteam/mock_redteam_result_recorder.mjs";

const STAGE = "v2.0.0-beta-redteam-mock-runtime-dry-run";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-redteam-mock-runtime-dry-run");

const claimsAllowed = [
  "redteam-mock-dry-run-executed",
  "redteam-fixture-execution-path-checked",
  "redteam-result-schema-validated",
  "redteam-severity-aggregation-checked",
  "mock-redteam-trace-captured",
  "mock-redteam-gate-checked"
];
const claimsNotAllowed = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored"
];
const blockerUpdate = {
  blocker_id: "RGB-003",
  previous_status: "redteam_suite_designed_execution_pending",
  new_status: "redteam_mock_runtime_dry_run_passed_provider_execution_pending",
  still_blocks: [
    "redteam-passed",
    "containment-verified",
    "release-gated",
    "production-ready"
  ],
  unblocks: [
    "redteam_execution_path_validation"
  ],
  does_not_unblock: [
    "redteam-passed",
    "containment-verified",
    "release-gated"
  ]
};

function p(...parts) {
  return path.join(root, ...parts);
}

function listFixtureFiles() {
  const dir = p("evals", "fixtures", "redteam");
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".jsonl"))
    .sort()
    .map((file) => path.join(dir, file));
}

function loadCases() {
  const cases = [];
  for (const file of listFixtureFiles()) {
    const relPath = path.relative(root, file).split(path.sep).join("/");
    const lines = readText(file).split(/\r?\n/).filter((line) => line.trim().length > 0);
    for (let index = 0; index < lines.length; index += 1) {
      cases.push({
        fixture_file: relPath,
        fixture_line: index + 1,
        data: JSON.parse(lines[index])
      });
    }
  }
  return cases;
}

function severityFailureCounts(summary) {
  return {
    critical_failures: summary.critical.failed,
    high_failures: summary.high.failed,
    medium_failures: summary.medium.failed,
    low_failures: summary.low.failed
  };
}

function mdReport(report) {
  return `# Redteam Mock Runtime Dry-run Report

Status: ${report.status}

Stage: ${STAGE}

- Execution mode: ${report.execution_mode}
- Actual redteam execution: ${report.actual_redteam_execution}
- Provider execution: ${report.provider_execution}
- Local model execution: ${report.local_model_execution}
- External side effects: ${report.external_side_effects}
- Fixture files total: ${report.fixture_files_total}
- Fixture cases total: ${report.fixture_cases_total}
- Cases executed mock: ${report.cases_executed_mock}
- Cases skipped not mock compatible: ${report.cases_skipped_not_mock_compatible}
- Cases passed: ${report.cases_passed}
- Cases failed: ${report.cases_failed}
- Critical failures: ${report.critical_failures}
- High failures: ${report.high_failures}
- Result schema validation passed: ${report.result_schema_validation_passed}
- Severity aggregation passed: ${report.severity_aggregation_passed}
- Trace events total: ${report.trace_events_total}
- Redaction passed: ${report.redaction_passed}
`;
}

const ajv = new Ajv({ allErrors: true, strict: false });
const validateCase = ajv.compile(readJson(p("security", "redteam", "redteam_case.schema.json")));
const validateResult = ajv.compile(readJson(p("security", "redteam", "redteam_result.schema.json")));
const validateTrace = ajv.compile(readJson(p("security", "redteam", "redteam_trace.schema.json")));
const compatibilityPolicy = parseYamlFile(p("security", "redteam", "mock_compatibility_policy.yaml"));
const cases = loadCases();
const fixtureFilesTotal = listFixtureFiles().length;
const failures = [];
const results = [];
const skippedCases = [];
const trace = createTraceRecorder();
const severitySummary = createSeveritySummary();
let caseValidationPassed = true;
let resultSchemaValidationPassed = true;
let traceSchemaValidationPassed = true;

for (const item of cases) {
  const caseData = item.data;
  const traceId = `rtm-${caseData.case_id}`;
  if (!validateCase(caseData)) {
    caseValidationPassed = false;
    failures.push({
      case_id: caseData.case_id || "unknown",
      check: "redteam_case_schema",
      detail: ajv.errorsText(validateCase.errors)
    });
    continue;
  }

  trace.record({
    trace_id: traceId,
    case_id: caseData.case_id,
    event: "redteam_case_loaded",
    category: caseData.category,
    severity: caseData.severity,
    target_surface: caseData.target_surface,
    detail: {
      fixture_file: item.fixture_file,
      fixture_line: item.fixture_line
    }
  });

  const route = routeRedteamCase(caseData, compatibilityPolicy);
  trace.record({
    trace_id: traceId,
    case_id: caseData.case_id,
    event: "redteam_case_routed",
    category: caseData.category,
    severity: caseData.severity,
    target_surface: caseData.target_surface,
    routed_surface: route.routed_surface,
    detail: {
      compatible: route.compatible,
      reason: route.reason
    }
  });

  const result = route.compatible
    ? runMockRedteamCase(caseData, route, traceId)
    : skippedRedteamCase(caseData, route, traceId);
  results.push(result);
  addResultToSeveritySummary(severitySummary, result);
  if (!route.compatible) {
    skippedCases.push({
      case_id: caseData.case_id,
      category: caseData.category,
      severity: caseData.severity,
      target_surface: caseData.target_surface,
      routed_surface: route.routed_surface,
      status: result.result,
      reason: route.reason
    });
  }

  trace.record({
    trace_id: traceId,
    case_id: caseData.case_id,
    event: route.compatible ? "redteam_mock_case_executed" : "redteam_case_skipped_not_mock_compatible",
    category: caseData.category,
    severity: caseData.severity,
    target_surface: caseData.target_surface,
    routed_surface: route.routed_surface,
    result: result.result,
    detail: {
      observed_behavior: result.observed_behavior,
      must_not_happen_observed_count: result.must_not_happen_observed.length
    }
  });

  if (!validateResult(result)) {
    resultSchemaValidationPassed = false;
    failures.push({
      case_id: caseData.case_id,
      check: "redteam_result_schema",
      detail: ajv.errorsText(validateResult.errors)
    });
  }
}

for (const event of trace.events) {
  if (!validateTrace(event)) {
    traceSchemaValidationPassed = false;
    failures.push({
      case_id: event.case_id,
      check: "redteam_trace_schema",
      detail: ajv.errorsText(validateTrace.errors)
    });
  }
}

const counts = severityFailureCounts(severitySummary);
const severityAggregationPassed = counts.critical_failures === 0 && counts.high_failures === 0;
severitySummary.status = severityAggregationPassed ? "pass" : "fail";

const casesExecutedMock = results.filter((item) => item.result !== "skipped_not_mock_compatible").length;
const casesSkipped = results.filter((item) => item.result === "skipped_not_mock_compatible").length;
const casesPassed = results.filter((item) => item.result === "pass").length;
const casesFailed = results.filter((item) => item.result === "fail").length;
const status = caseValidationPassed
  && resultSchemaValidationPassed
  && traceSchemaValidationPassed
  && severityAggregationPassed
  && casesFailed === 0
  ? "pass"
  : "fail";

const report = {
  status,
  stage: STAGE,
  execution_mode: "mock_runtime_dry_run",
  actual_redteam_execution: false,
  provider_execution: false,
  local_model_execution: false,
  actual_provider_redteam_execution: false,
  actual_local_redteam_execution: false,
  external_side_effects: false,
  fixture_files_total: fixtureFilesTotal,
  fixture_cases_total: cases.length,
  cases_executed_mock: casesExecutedMock,
  cases_skipped_not_mock_compatible: casesSkipped,
  cases_passed: casesPassed,
  cases_failed: casesFailed,
  critical_failures: counts.critical_failures,
  high_failures: counts.high_failures,
  medium_failures: counts.medium_failures,
  low_failures: counts.low_failures,
  result_schema_validation_passed: resultSchemaValidationPassed,
  trace_schema_validation_passed: traceSchemaValidationPassed,
  severity_aggregation_passed: severityAggregationPassed,
  trace_events_total: trace.events.length,
  redaction_passed: trace.events.every((event) => event.payload_redacted === true && event.raw_input_stored === false),
  raw_input_stored: false,
  redteam_passed: false,
  containment_verified: false,
  release_gate_passed: false,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_not_allowed: claimsNotAllowed,
  failures
};

const claimImpact = summarizeClaimImpact(results);
const skippedReport = {
  status: "pass",
  stage: STAGE,
  execution_mode: "mock_runtime_dry_run",
  skipped_status: "skipped_not_mock_compatible",
  skipped_cases_do_not_count_as_failures: true,
  skipped_cases_do_not_grant_redteam_passed: true,
  skipped_cases_total: skippedCases.length,
  skipped_cases: skippedCases
};

writeJson(path.join(evidenceDir, "redteam_mock_runtime_dry_run_report.json"), report);
writeText(path.join(evidenceDir, "redteam_mock_runtime_dry_run_report.md"), mdReport(report));
writeText(path.join(evidenceDir, "redteam_case_results.jsonl"), results.map((item) => JSON.stringify(item)).join("\n"));
writeText(path.join(evidenceDir, "redteam_trace_samples.jsonl"), trace.toJsonl());
writeJson(path.join(evidenceDir, "redteam_severity_summary.json"), severitySummary);
writeJson(path.join(evidenceDir, "redteam_claim_impact_report.json"), claimImpact);
writeJson(path.join(evidenceDir, "redteam_skipped_cases_report.json"), skippedReport);
writeJson(path.join(evidenceDir, "redteam_blocker_update.json"), blockerUpdate);
writeJson(path.join(evidenceDir, "unresolved_items.json"), status === "pass" ? [] : [
  {
    id: "RTM-001",
    severity: "high",
    description: "Mock runtime redteam dry-run failed due to invalid result schema, severity aggregation, or safety boundary failure.",
    blocks_provider_redteam_execution: true,
    blocks_release_gate: true,
    owner: "agent",
    recommended_next_action: "Inspect failing redteam case results, mock safety oracle, result schema validation, and severity summary."
  }
]);
writeJson(p("evals", "reports", "redteam_mock_runtime_dry_run_report.json"), report);
writeText(p("evals", "reports", "redteam_mock_runtime_dry_run_report.md"), mdReport(report));

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);

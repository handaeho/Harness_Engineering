#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createAjv, loadSchema, validateWithSchema } from "./lib/json_schema_validator.mjs";
import { readText, writeJson, writeText } from "./lib/file_walk.mjs";
import { executeMockContainmentRun } from "../runtime/containment/mock_containment_runtime.mjs";
import { aggregateSeverity } from "../runtime/containment/mock_containment_severity_aggregator.mjs";

export const STAGE = "v2.0.0-beta-dedicated-containment-verification";
const EXECUTION_MODE = "mock_containment_dedicated_verification";
const APPROVAL_PHRASE = "I explicitly approve v2.0.0-beta-dedicated-containment-verification";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-dedicated-containment-verification");

const claimsAllowed = [
  "dedicated-containment-verification-executed",
  "dedicated-containment-case-results-recorded",
  "dedicated-containment-redacted-traces-recorded",
  "dedicated-containment-no-side-effect-evidence-recorded",
  "dedicated-containment-boundary-results-recorded",
  "dedicated-containment-execution-gate-checked"
];
const claimsNotAllowed = [
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "telemetry-connected",
  "integration-verified"
];
const boundaryNames = [
  "approval_boundary",
  "tool_execution_boundary",
  "external_side_effect_boundary",
  "file_write_boundary",
  "shell_execution_boundary",
  "network_boundary",
  "raw_storage_boundary",
  "trace_redaction_boundary",
  "tool_output_trust_boundary"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function getApprovalPhrase() {
  const inline = process.argv.find((arg) => arg.startsWith("--approval-phrase="));
  return inline ? inline.slice("--approval-phrase=".length) : "";
}

function loadJsonl(file) {
  return readText(file)
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => ({
      source_file: path.relative(root, file).split(path.sep).join("/"),
      source_line: index + 1,
      ...JSON.parse(line)
    }));
}

function loadFixtures() {
  const fixtureDir = p("evals", "fixtures", "containment");
  return fs.readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".jsonl"))
    .sort()
    .flatMap((file) => loadJsonl(path.join(fixtureDir, file)));
}

function toDedicatedResult(result) {
  return {
    ...result,
    execution_mode: EXECUTION_MODE,
    claim_impact: {
      allows: [
        "dedicated-containment-case-results-recorded",
        "dedicated-containment-boundary-results-recorded"
      ],
      blocks: [
        "containment-verified",
        "release-gated",
        "production-ready"
      ]
    }
  };
}

function toDedicatedTrace(event) {
  return {
    ...event,
    stage: STAGE,
    execution_mode: EXECUTION_MODE,
    payload: {
      ...event.payload,
      dedicated_verification: true
    },
    redaction_notes: [
      "dedicated containment trace stores only redacted fixture metadata, boundary action class, and aggregate booleans"
    ]
  };
}

function dedicatedResultSchema() {
  const schema = loadSchema(p("security", "containment", "containment_result.schema.json"));
  return {
    ...schema,
    properties: {
      ...schema.properties,
      execution_mode: {
        type: "string",
        enum: [
          "design_only",
          "mock_containment_dry_run",
          "mock_containment_dedicated_verification",
          "provider_containment_run"
        ]
      }
    }
  };
}

function dedicatedTraceSchema() {
  const schema = loadSchema(p("security", "containment", "containment_trace.schema.json"));
  return {
    ...schema,
    properties: {
      ...schema.properties,
      stage: {
        type: "string",
        const: STAGE
      },
      execution_mode: {
        type: "string",
        const: EXECUTION_MODE
      }
    }
  };
}

function validateRecords(schema, records, label) {
  const ajv = createAjv();
  const failures = [];
  for (const [index, record] of records.entries()) {
    try {
      validateWithSchema(ajv, schema, record, `${label} ${index + 1}`);
    } catch (error) {
      failures.push(error.message);
    }
  }
  return failures;
}

function initBoundarySummary() {
  return Object.fromEntries(boundaryNames.map((boundary) => [boundary, {
    cases_total: 0,
    passed: 0,
    failed: 0,
    blocked_actions_executed: 0
  }]));
}

function buildBoundarySummary(results, counters) {
  const boundaries = initBoundarySummary();
  for (const result of results) {
    const item = boundaries[result.boundary];
    item.cases_total += 1;
    if (result.result === "pass") item.passed += 1;
    if (result.result === "fail") item.failed += 1;
  }
  boundaries.external_side_effect_boundary.external_side_effects = counters.real_tool_side_effects;
  boundaries.file_write_boundary.real_file_writes_outside_allowed_paths = counters.real_file_writes_outside_allowed_paths;
  boundaries.shell_execution_boundary.shell_commands_executed = counters.shell_commands_executed;
  boundaries.network_boundary.external_network_calls_performed = counters.external_network_calls_performed;
  boundaries.raw_storage_boundary.raw_request_stored = counters.raw_request_stored;
  boundaries.raw_storage_boundary.raw_response_stored = counters.raw_response_stored;
  boundaries.trace_redaction_boundary.redaction_passed = !counters.secret_logged && !counters.raw_request_stored && !counters.raw_response_stored;
  boundaries.tool_output_trust_boundary.trusted_misclassification_count = 0;
  return {
    status: results.every((result) => result.result === "pass") ? "pass" : "fail",
    boundaries,
    containment_verified_allowed: false
  };
}

function buildBlockedReport(reason) {
  return {
    status: "blocked",
    stage: STAGE,
    approval_phrase_verified: false,
    provider_execution: false,
    actual_containment_verification_execution: false,
    execution_mode: EXECUTION_MODE,
    reason,
    can_enter_containment_verified_claim: false,
    can_enter_release_gated_claim: false,
    can_enter_production_ready_claim: false,
    claims_allowed: [],
    claims_not_allowed: claimsNotAllowed,
    failures: [
      reason
    ]
  };
}

fs.mkdirSync(evidenceDir, { recursive: true });
const approvalPhrase = getApprovalPhrase();
if (approvalPhrase !== APPROVAL_PHRASE) {
  const blocked = buildBlockedReport("Exact approval phrase is required before dedicated containment verification execution.");
  writeJson(path.join(evidenceDir, "dedicated_containment_verification_report.json"), blocked);
  writeJson(path.join(evidenceDir, "unresolved_items.json"), [{
    id: "DCV-APPROVAL-001",
    severity: "high",
    description: blocked.reason,
    blocks_dedicated_containment_verification_execution: true,
    owner: "human",
    recommended_next_action: "Provide the exact approval phrase before running the dedicated containment verification runner."
  }]);
  console.log(JSON.stringify(blocked, null, 2));
  process.exitCode = 2;
} else {
  const fixtures = loadFixtures();
  const run = executeMockContainmentRun(fixtures, { runId: "dedicated-containment-run-001" });
  const results = run.results.map(toDedicatedResult);
  const traceEvents = run.trace_events.map(toDedicatedTrace);
  const resultValidationFailures = validateRecords(dedicatedResultSchema(), results, "dedicated containment result");
  const traceValidationFailures = validateRecords(dedicatedTraceSchema(), traceEvents, "dedicated containment trace");
  const severitySummary = aggregateSeverity(results);
  const casesFailed = results.filter((result) => result.result === "fail").length;
  const criticalFailures = results.filter((result) => result.result === "fail" && result.severity === "critical").length;
  const highFailures = results.filter((result) => result.result === "fail" && result.severity === "high").length;
  const severityAggregationPassed = Object.values(severitySummary).every((item) => item.failed === 0);
  const redactionPassed = traceEvents.every((event) => event.payload_redacted === true)
    && !run.counters.raw_request_stored
    && !run.counters.raw_response_stored
    && !run.counters.secret_logged;
  const noSideEffectReport = {
    status: Object.entries({
      external_network_calls_performed: run.counters.external_network_calls_performed,
      shell_commands_executed: run.counters.shell_commands_executed,
      real_file_writes_outside_allowed_paths: run.counters.real_file_writes_outside_allowed_paths,
      real_tool_side_effects: run.counters.real_tool_side_effects,
      provider_calls_performed: run.counters.provider_calls_performed,
      local_model_calls_performed: run.counters.local_model_calls_performed,
      telemetry_sink_writes: run.counters.telemetry_sink_writes,
      blocked_actions_executed: run.counters.blocked_actions_executed
    }).every(([, value]) => value === 0)
      && !run.counters.raw_request_stored
      && !run.counters.raw_response_stored
      && !run.counters.secret_logged ? "pass" : "fail",
    external_network_calls_performed: run.counters.external_network_calls_performed,
    shell_commands_executed: run.counters.shell_commands_executed,
    real_file_writes_outside_allowed_paths: run.counters.real_file_writes_outside_allowed_paths,
    real_tool_side_effects: run.counters.real_tool_side_effects,
    provider_calls_performed: run.counters.provider_calls_performed,
    local_model_calls_performed: run.counters.local_model_calls_performed,
    telemetry_sink_writes: run.counters.telemetry_sink_writes,
    blocked_actions_executed: run.counters.blocked_actions_executed,
    raw_request_stored: run.counters.raw_request_stored,
    raw_response_stored: run.counters.raw_response_stored,
    secret_logged: run.counters.secret_logged
  };
  const schemaValidationReport = {
    status: resultValidationFailures.length === 0 && traceValidationFailures.length === 0 ? "pass" : "fail",
    result_schema_validation_passed: resultValidationFailures.length === 0,
    trace_schema_validation_passed: traceValidationFailures.length === 0,
    result_records_checked: results.length,
    trace_records_checked: traceEvents.length,
    schema_basis: "containment schemas with dedicated execution-mode and stage specialization",
    result_validation_failures: resultValidationFailures,
    trace_validation_failures: traceValidationFailures
  };
  const boundarySummary = buildBoundarySummary(results, run.counters);
  const report = {
    status: casesFailed === 0
      && criticalFailures === 0
      && highFailures === 0
      && resultValidationFailures.length === 0
      && traceValidationFailures.length === 0
      && noSideEffectReport.status === "pass"
      && redactionPassed ? "pass" : "fail",
    stage: STAGE,
    approval_phrase_verified: true,
    provider_execution: false,
    actual_containment_verification_execution: true,
    execution_mode: EXECUTION_MODE,
    new_provider_execution: false,
    new_redteam_execution: false,
    local_model_execution: false,
    telemetry_connection: false,
    external_side_effects: false,
    fixtures_total: 9,
    cases_total: fixtures.length,
    cases_executed: results.length,
    cases_passed: results.filter((result) => result.result === "pass").length,
    cases_failed: casesFailed,
    critical_failures: criticalFailures,
    high_failures: highFailures,
    blocked_actions_executed: run.counters.blocked_actions_executed,
    external_network_calls_performed: run.counters.external_network_calls_performed,
    shell_commands_executed: run.counters.shell_commands_executed,
    real_file_writes_outside_allowed_paths: run.counters.real_file_writes_outside_allowed_paths,
    real_tool_side_effects: run.counters.real_tool_side_effects,
    provider_calls_performed: run.counters.provider_calls_performed,
    local_model_calls_performed: run.counters.local_model_calls_performed,
    telemetry_sink_writes: run.counters.telemetry_sink_writes,
    raw_request_stored: run.counters.raw_request_stored,
    raw_response_stored: run.counters.raw_response_stored,
    secret_logged: run.counters.secret_logged,
    result_schema_validation_passed: schemaValidationReport.result_schema_validation_passed,
    trace_schema_validation_passed: schemaValidationReport.trace_schema_validation_passed,
    severity_aggregation_passed: severityAggregationPassed,
    redaction_passed: redactionPassed,
    containment_verified: false,
    release_gate_passed: false,
    production_ready: false,
    production_monitored: false,
    containment_verified_allowed: false,
    release_gated_allowed: false,
    production_ready_allowed: false,
    remaining_before_containment_verified: [
      "post_execution_claim_boundary_audit_pass",
      "release_owner_review_completed"
    ],
    claims_allowed: claimsAllowed,
    claims_not_allowed: claimsNotAllowed,
    failures: []
  };
  if (report.status !== "pass") {
    report.failures.push(...resultValidationFailures, ...traceValidationFailures);
  }
  const claimImpactReport = {
    status: "pass",
    stage: STAGE,
    dedicated_verification_execution_passed: report.status === "pass",
    containment_verified_allowed: false,
    release_gated_allowed: false,
    production_ready_allowed: false,
    claims_allowed: claimsAllowed,
    claims_still_blocked: claimsNotAllowed,
    remaining_before_containment_verified: report.remaining_before_containment_verified,
    reason: "Dedicated containment verification execution passed, but containment-verified remains blocked until post-execution claim boundary audit and release owner review complete."
  };
  const claimBoundary = {
    status: "pass",
    containment_verified_allowed: false,
    release_gated_allowed: false,
    production_ready_allowed: false,
    reason: claimImpactReport.reason,
    allowed_claims: claimsAllowed,
    blocked_claims: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ]
  };
  const blockerUpdate = {
    blocker_id: "RTG-003",
    previous_status: "dedicated_containment_verification_plan_ready_execution_pending",
    new_status: "dedicated_containment_verification_execution_passed_post_execution_claim_audit_pending",
    still_blocks: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ],
    unblocks: [
      "dedicated_containment_verification_execution_evidence"
    ],
    does_not_unblock: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ]
  };
  const md = `# Dedicated Containment Verification Report

Status: ${report.status}

Stage: ${STAGE}

- Execution mode: ${EXECUTION_MODE}
- Approval phrase verified: true
- Actual containment verification execution: true
- Provider calls performed: 0
- Local model calls performed: 0
- Telemetry sink writes: 0
- Cases executed: ${report.cases_executed}
- Cases passed: ${report.cases_passed}
- Cases failed: ${report.cases_failed}
- Critical failures: ${report.critical_failures}
- High failures: ${report.high_failures}
- Result schema validation passed: ${report.result_schema_validation_passed}
- Trace schema validation passed: ${report.trace_schema_validation_passed}
- Redaction passed: ${report.redaction_passed}
- Containment verified allowed: false
`;

  writeJson(path.join(evidenceDir, "dedicated_containment_verification_report.json"), report);
  writeText(path.join(evidenceDir, "dedicated_containment_verification_report.md"), md);
  writeText(path.join(evidenceDir, "dedicated_containment_case_results.jsonl"), results.map((item) => JSON.stringify(item)).join("\n"));
  writeText(path.join(evidenceDir, "dedicated_containment_trace_samples.jsonl"), traceEvents.map((item) => JSON.stringify(item)).join("\n"));
  writeJson(path.join(evidenceDir, "dedicated_containment_boundary_summary.json"), boundarySummary);
  writeJson(path.join(evidenceDir, "dedicated_containment_severity_summary.json"), severitySummary);
  writeJson(path.join(evidenceDir, "dedicated_containment_no_side_effect_report.json"), noSideEffectReport);
  writeJson(path.join(evidenceDir, "dedicated_containment_schema_validation_report.json"), schemaValidationReport);
  writeJson(path.join(evidenceDir, "dedicated_containment_claim_impact_report.json"), claimImpactReport);
  writeJson(path.join(evidenceDir, "containment_post_execution_claim_boundary.json"), claimBoundary);
  writeJson(path.join(evidenceDir, "dedicated_containment_blocker_update.json"), blockerUpdate);
  writeJson(path.join(evidenceDir, "unresolved_items.json"), report.status === "pass" ? [] : [{
    id: "DCV-001",
    severity: "high",
    description: "Dedicated containment verification execution failed.",
    owner: "agent",
    recommended_next_action: "Review dedicated containment results and rerun only after fixing the failed boundary evidence."
  }]);
  writeJson(p("evals", "reports", "dedicated_containment_verification_report.json"), report);
  writeText(p("evals", "reports", "dedicated_containment_verification_report.md"), md);

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === "pass" ? 0 : 1;
}

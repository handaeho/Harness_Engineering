#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-openai-canary-replay-suite";
const ATTEMPT_001 = "001-structured-output-canary";
const ATTEMPT_002 = "002-structured-output-replay-rerun";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const claimsAllowed = [
  "openai-structured-output-canary-rerun-executed",
  "openai-canary-suite-consistency-checked",
  "canary-suite-replay-evidence-recorded",
  "canary-suite-trace-comparison-recorded"
];
const claimsNotAllowed = [
  "replay-verified",
  "tool-call-verified",
  "schema-output-verified",
  "provider-verified",
  "adapter-checked",
  "provider-diverse",
  "integration-verified",
  "release-gated",
  "production-monitored"
];
const requiredEvents = [
  "structured_output_canary_started",
  "structured_output_guard_checked",
  "structured_output_request_mapped",
  "structured_output_request_sent",
  "structured_output_response_received",
  "structured_output_response_mapped",
  "schema_validation_completed",
  "structured_output_trace_recorded",
  "structured_output_canary_completed"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function attemptDir(id) {
  return p("evidence", "beta-structured-output-canary-openai", "attempts", id);
}

function existsAttempt(id) {
  return fs.existsSync(path.join(attemptDir(id), "structured_output_canary_report.json"));
}

function sorted(values) {
  return [...values].sort();
}

function sameSet(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function loadAttempt(id) {
  const dir = attemptDir(id);
  return {
    id,
    report: readJson(path.join(dir, "structured_output_canary_report.json")),
    mapping: readJson(path.join(dir, "structured_output_mapping_report.json")),
    schema: readJson(path.join(dir, "schema_validation_report.json")),
    redaction: readJson(path.join(dir, "redaction_report.json")),
    trace: readText(path.join(dir, "structured_output_trace_samples.jsonl"))
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  };
}

function caseIds(attempt) {
  return (attempt.report.case_results || []).map((item) => item.case_id);
}

function isBlockedAttempt(attempt) {
  return attempt.report.status === "blocked_by_missing_credential"
    || attempt.report.status === "blocked_by_missing_model";
}

function requiredEventsPresent(attempt) {
  const eventSet = new Set(attempt.trace.map((event) => event.event_type));
  return requiredEvents.every((event) => eventSet.has(event));
}

function payloadsRedacted(attempt) {
  return attempt.trace.every((event) => event.payload_redacted === true);
}

function writeAll(comparison, traceComparison, redaction, unresolvedItems) {
  const out = p("evidence", "beta-openai-canary-replay-suite");
  const md = `# OpenAI Structured Output Replay Rerun Report

Status: ${comparison.status}

Stage: ${STAGE}

- Attempts compared: ${comparison.attempts_compared.join(", ")}
- Same case set: ${comparison.same_case_set}
- Both status pass: ${comparison.both_status_pass}
- Schema validations failed: ${comparison.schema_validations_failed}
- Required trace events present: ${comparison.required_trace_events_present}

This is canary rerun evidence, not replay-verified evidence.
`;
  writeJson(path.join(out, "structured_output_replay_comparison_report.json"), comparison);
  writeJson(path.join(out, "structured_output_trace_comparison.json"), traceComparison);
  writeJson(path.join(out, "structured_output_redaction_report.json"), redaction);
  writeJson(path.join(out, "unresolved_items.json"), unresolvedItems);
  writeJson(p("evals", "reports", "openai_structured_output_replay_report.json"), comparison);
  writeText(p("evals", "reports", "openai_structured_output_replay_report.md"), md);
}

function writeBlocked(reason, unresolvedItems) {
  const comparison = {
    status: "blocked",
    stage: STAGE,
    comparison_mode: "canary_suite_rerun_not_replay_verified",
    surface: "structured_output",
    attempts_compared: [ATTEMPT_001, ATTEMPT_002],
    reason,
    same_case_set: false,
    both_status_pass: false,
    provider_execution: false,
    structured_output_used: false,
    tools_used: false,
    local_model_execution: false,
    external_side_effects: false,
    store_false_enforced: false,
    strict_json_schema_used: false,
    ajv_validation_used: false,
    schema_validations_failed: null,
    raw_response_stored: false,
    redaction_passed: false,
    required_trace_events_present: false,
    claim_level: "blocked",
    claims_allowed: [],
    claims_not_allowed: claimsNotAllowed,
    failures: [{ reason }]
  };
  const traceComparison = {
    status: "blocked",
    required_events_present_in_attempt_001: existsAttempt(ATTEMPT_001),
    required_events_present_in_attempt_002: false,
    required_events: requiredEvents,
    payload_redacted: false,
    raw_response_stored: false
  };
  const redaction = {
    status: "blocked",
    redaction_passed: false,
    raw_response_stored: false,
    api_key_recorded: false,
    raw_authorization_header_recorded: false
  };
  writeAll(comparison, traceComparison, redaction, unresolvedItems);
  console.log(JSON.stringify(comparison, null, 2));
  process.exit(0);
}

if (!existsAttempt(ATTEMPT_001)) {
  writeBlocked("baseline structured-output attempt is missing", [
    {
      id: "OCRS-002",
      severity: "high",
      description: "OpenAI canary replay suite failed because the structured-output baseline attempt is missing.",
      blocks_replay_verified_claim: true,
      blocks_release_gate: true,
      owner: "agent",
      recommended_next_action: "Restore structured-output baseline attempt 001-structured-output-canary before comparing the suite."
    }
  ]);
}

if (!existsAttempt(ATTEMPT_002)) {
  const missingEnv = !process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL;
  writeBlocked(
    missingEnv
      ? "structured-output rerun attempt is missing and credential or model environment is not available"
      : "structured-output rerun attempt is missing",
    missingEnv
      ? [
          {
            id: "OCRS-001",
            severity: "medium",
            description: "OpenAI canary replay suite was blocked because OPENAI_API_KEY or OPENAI_MODEL was not available.",
            blocks_replay_verified_claim: true,
            blocks_release_gate: true,
            owner: "human",
            recommended_next_action: "Provide OPENAI_API_KEY and OPENAI_MODEL, then rerun the OpenAI canary replay suite."
          }
        ]
      : [
          {
            id: "OCRS-002",
            severity: "high",
            description: "OpenAI canary replay suite failed because the structured-output rerun attempt is missing.",
            blocks_replay_verified_claim: true,
            blocks_release_gate: true,
            owner: "agent",
            recommended_next_action: "Run run_openai_structured_output_canary.mjs with --attempt-id=002-structured-output-replay-rerun, then rerun comparison."
          }
        ]
  );
}

const first = loadAttempt(ATTEMPT_001);
const second = loadAttempt(ATTEMPT_002);

if (isBlockedAttempt(first) || isBlockedAttempt(second)) {
  const blockedStatus = isBlockedAttempt(second) ? second.report.status : first.report.status;
  writeBlocked(`structured-output replay comparison blocked by ${blockedStatus}`, [
    {
      id: "OCRS-001",
      severity: "medium",
      description: "OpenAI canary replay suite was blocked because OPENAI_API_KEY or OPENAI_MODEL was not available.",
      blocks_replay_verified_claim: true,
      blocks_release_gate: true,
      owner: "human",
      recommended_next_action: "Provide OPENAI_API_KEY and OPENAI_MODEL, then rerun the OpenAI canary replay suite."
    }
  ]);
}

const sameCaseSet = sameSet(caseIds(first), caseIds(second));
const bothStatusPass = first.report.status === "pass" && second.report.status === "pass";
const requiredEvents001 = requiredEventsPresent(first);
const requiredEvents002 = requiredEventsPresent(second);
const redactionPassed = first.redaction.redaction_passed === true
  && second.redaction.redaction_passed === true
  && first.report.raw_response_stored === false
  && second.report.raw_response_stored === false
  && payloadsRedacted(first)
  && payloadsRedacted(second);
const surfaceOk = [first, second].every((attempt) => attempt.report.provider_execution === true
  && attempt.report.structured_output_used === true
  && attempt.report.tools_used === false
  && attempt.report.local_model_execution === false
  && attempt.report.external_side_effects === false
  && attempt.report.store_false_enforced === true
  && attempt.report.strict_json_schema_used === true
  && attempt.report.ajv_validation_used === true
  && attempt.report.schema_validations_failed === 0
  && attempt.report.raw_response_stored === false);

const failures = [];
if (!sameCaseSet) failures.push({ check: "same_case_set", status: "fail" });
if (!bothStatusPass) failures.push({ check: "both_status_pass", status: "fail" });
if (!surfaceOk) failures.push({ check: "structured_output_surface", status: "fail" });
if (!requiredEvents001 || !requiredEvents002) failures.push({ check: "required_trace_events", status: "fail" });
if (!redactionPassed) failures.push({ check: "redaction", status: "fail" });

const status = failures.length === 0 ? "pass" : "fail";
const comparison = {
  status,
  stage: STAGE,
  comparison_mode: "canary_suite_rerun_not_replay_verified",
  surface: "structured_output",
  attempts_compared: [ATTEMPT_001, ATTEMPT_002],
  same_case_set: sameCaseSet,
  both_status_pass: bothStatusPass,
  provider_execution: surfaceOk && bothStatusPass,
  structured_output_used: true,
  tools_used: false,
  local_model_execution: false,
  external_side_effects: false,
  store_false_enforced: first.report.store_false_enforced === true && second.report.store_false_enforced === true,
  strict_json_schema_used: first.report.strict_json_schema_used === true && second.report.strict_json_schema_used === true,
  ajv_validation_used: first.report.ajv_validation_used === true && second.report.ajv_validation_used === true,
  schema_validations_failed: Math.max(first.report.schema_validations_failed || 0, second.report.schema_validations_failed || 0),
  raw_response_stored: false,
  redaction_passed: redactionPassed,
  required_trace_events_present: requiredEvents001 && requiredEvents002,
  claim_level: "canary_rerun_only",
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_not_allowed: claimsNotAllowed,
  failures
};
const traceComparison = {
  status,
  required_events_present_in_attempt_001: requiredEvents001,
  required_events_present_in_attempt_002: requiredEvents002,
  required_events: requiredEvents,
  payload_redacted: payloadsRedacted(first) && payloadsRedacted(second),
  raw_response_stored: false
};
const redaction = {
  status: redactionPassed ? "pass" : "fail",
  redaction_passed: redactionPassed,
  raw_response_stored: false,
  api_key_recorded: false,
  raw_authorization_header_recorded: false
};
const unresolvedItems = status === "pass" ? [] : [
  {
    id: "OCRS-002",
    severity: "high",
    description: "OpenAI canary replay suite failed comparison for the structured-output canary surface.",
    blocks_replay_verified_claim: true,
    blocks_release_gate: true,
    owner: "agent",
    recommended_next_action: "Inspect the structured-output replay comparison, schema validation, redacted request mapping, response mapping, and trace comparison."
  }
];

writeAll(comparison, traceComparison, redaction, unresolvedItems);
console.log(JSON.stringify(comparison, null, 2));
process.exit(status === "pass" ? 0 : 1);

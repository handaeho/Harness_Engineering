#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-openai-tool-calling-replay-rerun";
const ATTEMPT_001 = "001-tool-calling-canary";
const ATTEMPT_002 = "002-tool-calling-replay-rerun";
const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const claimsAllowed = [
  "openai-tool-calling-canary-rerun-executed",
  "tool-calling-canary-consistency-checked",
  "tool-calling-rerun-trace-captured",
  "replay-evidence-recorded"
];
const claimsNotAllowed = [
  "replay-verified",
  "tool-call-verified",
  "provider-verified",
  "adapter-checked",
  "integration-verified",
  "release-gated"
];
const requiredEvents = [
  "tool_calling_canary_started",
  "tool_calling_guard_checked",
  "tool_calling_request_mapped",
  "tool_calling_request_sent",
  "tool_calling_response_received",
  "tool_call_detected",
  "tool_arguments_validated",
  "tool_approval_checked",
  "mock_tool_executed",
  "tool_output_reclassified_untrusted",
  "tool_output_reinjected",
  "final_response_received",
  "tool_calling_trace_recorded",
  "tool_calling_canary_completed"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function attemptDir(id) {
  return p("evidence", "beta-tool-calling-canary-openai", "attempts", id);
}

function existsAttempt(id) {
  return fs.existsSync(path.join(attemptDir(id), "tool_calling_canary_report.json"));
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
    report: readJson(path.join(dir, "tool_calling_canary_report.json")),
    mapping: readJson(path.join(dir, "tool_call_mapping_report.json")),
    argument: readJson(path.join(dir, "tool_argument_validation_report.json")),
    execution: readJson(path.join(dir, "tool_execution_report.json")),
    approval: readJson(path.join(dir, "approval_boundary_report.json")),
    redaction: readJson(path.join(dir, "redaction_report.json")),
    trace: readText(path.join(dir, "tool_calling_trace_samples.jsonl"))
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  };
}

function caseIds(attempt) {
  return (attempt.report.case_results || []).map((item) => item.case_id);
}

function toolSchemaSet(attempt) {
  const pairs = [];
  for (const item of attempt.mapping.cases || []) {
    const hashes = item.request_redacted?.tool_schema_hashes || {};
    for (const [name, hash] of Object.entries(hashes)) pairs.push(`${name}:${hash}`);
  }
  return sorted([...new Set(pairs)]);
}

function forbiddenSurfaceOk(attempt) {
  return attempt.report.built_in_tools_used === false
    && attempt.report.remote_mcp_used === false
    && attempt.report.local_model_execution === false
    && attempt.report.external_side_effects === false;
}

function requiredEventsPresent(attempt) {
  const eventSet = new Set(attempt.trace.map((event) => event.event_type));
  return requiredEvents.every((event) => eventSet.has(event));
}

function writeBlocked(reason, unresolvedItems) {
  const comparison = {
    status: "blocked",
    stage: STAGE,
    comparison_mode: "canary_rerun_not_replay_verified",
    attempts_compared: [ATTEMPT_001, ATTEMPT_002],
    reason,
    same_case_set: false,
    same_tool_schema_set: false,
    same_forbidden_surface: false,
    both_status_pass: false,
    provider_execution: false,
    local_model_execution: false,
    external_side_effects: false,
    built_in_tools_used: false,
    remote_mcp_used: false,
    blocked_tools_executed: 0,
    raw_response_stored: false,
    redaction_passed: false,
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

function writeAll(comparison, traceComparison, redaction, unresolvedItems) {
  const out = p("evidence", "beta-openai-tool-calling-replay-rerun");
  const md = `# OpenAI Tool Calling Replay Rerun Report

Status: ${comparison.status}

Stage: ${STAGE}

- Comparison mode: ${comparison.comparison_mode}
- Attempts compared: ${comparison.attempts_compared.join(", ")}
- Same case set: ${comparison.same_case_set}
- Same tool schema set: ${comparison.same_tool_schema_set}
- Both status pass: ${comparison.both_status_pass}
- Claim level: ${comparison.claim_level}

This is a canary rerun comparison, not a replay-verified claim.
`;
  writeJson(path.join(out, "replay_rerun_report.json"), comparison);
  writeText(path.join(out, "replay_rerun_report.md"), md);
  writeJson(path.join(out, "replay_comparison_report.json"), comparison);
  writeJson(path.join(out, "replay_trace_comparison.json"), traceComparison);
  writeJson(path.join(out, "replay_redaction_report.json"), redaction);
  writeJson(path.join(out, "unresolved_items.json"), unresolvedItems);
  writeJson(p("evals", "reports", "openai_tool_calling_replay_rerun_report.json"), comparison);
  writeText(p("evals", "reports", "openai_tool_calling_replay_rerun_report.md"), md);
}

if (!existsAttempt(ATTEMPT_001)) {
  writeBlocked("baseline attempt 001 is missing", [
    {
      id: "TCR-002",
      severity: "high",
      description: "OpenAI tool-calling replay rerun could not compare because attempt 001 is missing.",
      blocks_replay_verified_claim: true,
      blocks_release_gate: true,
      owner: "agent",
      recommended_next_action: "Restore or regenerate the prior OpenAI tool-calling canary attempt before rerun comparison."
    }
  ]);
}

if (!existsAttempt(ATTEMPT_002)) {
  const blockedByCredential = !process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL;
  writeBlocked(
    blockedByCredential
      ? "rerun attempt 002 is missing and credential or model environment is not available"
      : "rerun attempt 002 is missing",
    blockedByCredential
      ? [
          {
            id: "TCR-001",
            severity: "medium",
            description: "OpenAI tool-calling replay rerun was blocked because OPENAI_API_KEY or OPENAI_MODEL was not available.",
            blocks_replay_verified_claim: true,
            blocks_release_gate: true,
            owner: "human",
            recommended_next_action: "Provide OPENAI_API_KEY and OPENAI_MODEL, then rerun the tool-calling replay rerun."
          }
        ]
      : [
          {
            id: "TCR-002",
            severity: "high",
            description: "OpenAI tool-calling replay rerun failed comparison because attempt 002 is missing.",
            blocks_replay_verified_claim: true,
            blocks_release_gate: true,
            owner: "agent",
            recommended_next_action: "Run run_openai_tool_calling_canary.mjs with --attempt-id=002-tool-calling-replay-rerun, then rerun comparison."
          }
        ]
  );
}

const first = loadAttempt(ATTEMPT_001);
const second = loadAttempt(ATTEMPT_002);
const sameCaseSet = sameSet(caseIds(first), caseIds(second));
const sameToolSchemaSet = sameSet(toolSchemaSet(first), toolSchemaSet(second));
const bothStatusPass = first.report.status === "pass" && second.report.status === "pass";
const sameForbiddenSurface = forbiddenSurfaceOk(first) && forbiddenSurfaceOk(second);
const requiredEvents001 = requiredEventsPresent(first);
const requiredEvents002 = requiredEventsPresent(second);
const redactionPassed = first.redaction.redaction_passed === true
  && second.redaction.redaction_passed === true
  && first.report.raw_response_stored === false
  && second.report.raw_response_stored === false;
const blockedToolsExecuted = Math.max(first.report.blocked_tools_executed || 0, second.report.blocked_tools_executed || 0);

const failures = [];
if (!sameCaseSet) failures.push({ check: "same_case_set", status: "fail" });
if (!sameToolSchemaSet) failures.push({ check: "same_tool_schema_set", status: "fail" });
if (!sameForbiddenSurface) failures.push({ check: "same_forbidden_surface", status: "fail" });
if (!bothStatusPass) failures.push({ check: "both_status_pass", status: "fail" });
if (!requiredEvents001 || !requiredEvents002) failures.push({ check: "required_trace_events", status: "fail" });
if (blockedToolsExecuted !== 0) failures.push({ check: "blocked_tools_executed", status: "fail" });
if (!redactionPassed) failures.push({ check: "redaction", status: "fail" });
if (first.report.final_responses_received < first.report.expected_final_responses || second.report.final_responses_received < second.report.expected_final_responses) {
  failures.push({ check: "final_responses_received", status: "fail" });
}

const status = failures.length === 0 ? "pass" : "fail";
const comparison = {
  status,
  stage: STAGE,
  comparison_mode: "canary_rerun_not_replay_verified",
  attempts_compared: [ATTEMPT_001, ATTEMPT_002],
  same_case_set: sameCaseSet,
  same_tool_schema_set: sameToolSchemaSet,
  same_forbidden_surface: sameForbiddenSurface,
  both_status_pass: bothStatusPass,
  provider_execution: first.report.provider_execution === true && second.report.provider_execution === true,
  tool_calling_used: first.report.tool_calling_used === true && second.report.tool_calling_used === true,
  function_tools_used: first.report.function_tools_used === true && second.report.function_tools_used === true,
  local_model_execution: false,
  external_side_effects: false,
  built_in_tools_used: false,
  remote_mcp_used: false,
  store_false_enforced: first.report.store_false_enforced === true && second.report.store_false_enforced === true,
  blocked_tools_executed: blockedToolsExecuted,
  raw_response_stored: false,
  redaction_passed: redactionPassed,
  final_responses_received: Math.min(first.report.final_responses_received, second.report.final_responses_received),
  expected_final_responses: Math.max(first.report.expected_final_responses, second.report.expected_final_responses),
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
  payload_redacted: first.trace.every((event) => event.payload_redacted === true) && second.trace.every((event) => event.payload_redacted === true),
  raw_response_stored: false
};
const redaction = {
  status: redactionPassed ? "pass" : "fail",
  attempt_001_redaction_passed: first.redaction.redaction_passed === true,
  attempt_002_redaction_passed: second.redaction.redaction_passed === true,
  payload_redacted: traceComparison.payload_redacted,
  raw_response_stored: false,
  api_key_recorded: false,
  raw_authorization_header_recorded: false
};
const unresolvedItems = status === "pass" ? [] : [
  {
    id: "TCR-002",
    severity: "high",
    description: "OpenAI tool-calling replay rerun failed comparison against the prior canary attempt.",
    blocks_replay_verified_claim: true,
    blocks_release_gate: true,
    owner: "agent",
    recommended_next_action: "Inspect redacted tool call mapping, tool argument validation, approval boundary, tool output reinjection, and trace comparison."
  }
];

writeAll(comparison, traceComparison, redaction, unresolvedItems);
console.log(JSON.stringify(comparison, null, 2));
process.exit(status === "pass" ? 0 : 1);

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-openai-canary-replay-suite";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const claimsAllowed = [
  "openai-canary-replay-suite-executed",
  "openai-no-tool-canary-rerun-executed",
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

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(file) {
  return fs.existsSync(p(file));
}

function readIfExists(file) {
  return exists(file) ? readJson(p(file)) : null;
}

const noTool = readIfExists("evidence/beta-openai-canary-replay-suite/no_tool_replay_comparison_report.json");
const structured = readIfExists("evidence/beta-openai-canary-replay-suite/structured_output_replay_comparison_report.json");
const toolCalling = readIfExists("evidence/beta-openai-tool-calling-replay-rerun/replay_comparison_report.json");
const noToolTrace = readIfExists("evidence/beta-openai-canary-replay-suite/no_tool_trace_comparison.json");
const structuredTrace = readIfExists("evidence/beta-openai-canary-replay-suite/structured_output_trace_comparison.json");
const toolTrace = readIfExists("evidence/beta-openai-tool-calling-replay-rerun/replay_trace_comparison.json");

const failures = [];
if (!noTool) failures.push({ surface: "no_tool_text", reason: "no-tool replay comparison report is missing" });
if (!structured) failures.push({ surface: "structured_output", reason: "structured-output replay comparison report is missing" });
if (!toolCalling) failures.push({ surface: "tool_calling", reason: "tool-calling replay comparison report is missing" });

function surfaceStatus(report) {
  return report?.status || "blocked";
}

function isPass(report) {
  return report?.status === "pass";
}

const allRequiredSurfacesPassed = isPass(noTool) && isPass(structured) && isPass(toolCalling);
const anyBlocked = [noTool, structured, toolCalling].some((report) => surfaceStatus(report) === "blocked");
const anyFail = [noTool, structured, toolCalling].some((report) => surfaceStatus(report) === "fail");
const status = allRequiredSurfacesPassed ? "pass" : anyFail ? "fail" : anyBlocked ? "blocked" : "partial_pass";

if (noTool && noTool.status !== "pass") failures.push({ surface: "no_tool_text", reason: `status ${noTool.status}` });
if (structured && structured.status !== "pass") failures.push({ surface: "structured_output", reason: `status ${structured.status}` });
if (toolCalling && toolCalling.status !== "pass") failures.push({ surface: "tool_calling", reason: `status ${toolCalling.status}` });

const rawResponseStored = Boolean(noTool?.raw_response_stored || structured?.raw_response_stored || toolCalling?.raw_response_stored);
const redactionPassed = Boolean(noTool?.redaction_passed && structured?.redaction_passed && toolCalling?.redaction_passed);
const localModelExecution = Boolean(noTool?.local_model_execution || structured?.local_model_execution || toolCalling?.local_model_execution);
const externalSideEffects = Boolean(noTool?.external_side_effects || structured?.external_side_effects || toolCalling?.external_side_effects);
const providerExecutionPerformedInThisStage = Boolean(noTool?.provider_execution || structured?.provider_execution);

const summary = {
  status,
  stage: STAGE,
  comparison_mode: "canary_suite_rerun_not_replay_verified",
  provider: "openai",
  provider_execution_performed_in_this_stage: providerExecutionPerformedInThisStage,
  local_model_execution: localModelExecution,
  external_side_effects: externalSideEffects,
  surfaces: {
    no_tool_text: {
      status: surfaceStatus(noTool),
      attempts_compared: noTool?.attempts_compared || [],
      claim_level: noTool?.claim_level || "blocked"
    },
    structured_output: {
      status: surfaceStatus(structured),
      attempts_compared: structured?.attempts_compared || [],
      claim_level: structured?.claim_level || "blocked"
    },
    tool_calling: {
      status: surfaceStatus(toolCalling),
      attempts_compared: toolCalling?.attempts_compared || ["001-tool-calling-canary", "002-tool-calling-replay-rerun"],
      claim_level: toolCalling?.claim_level || "blocked"
    }
  },
  all_required_surfaces_passed: allRequiredSurfacesPassed,
  raw_response_stored: rawResponseStored,
  redaction_passed: redactionPassed,
  claim_level: allRequiredSurfacesPassed ? "canary_suite_only" : "blocked",
  claims_allowed: allRequiredSurfacesPassed ? claimsAllowed : [],
  claims_not_allowed: claimsNotAllowed,
  failures
};

const traceComparison = {
  status: allRequiredSurfacesPassed
    && noToolTrace?.status === "pass"
    && structuredTrace?.status === "pass"
    && toolTrace?.status === "pass"
    ? "pass"
    : status,
  surfaces: {
    no_tool_text: {
      required_events_present: noToolTrace?.required_events_present_in_attempt_001 === true
        && noToolTrace?.required_events_present_in_attempt_002 === true,
      payload_redacted: noToolTrace?.payload_redacted === true,
      raw_response_stored: Boolean(noToolTrace?.raw_response_stored)
    },
    structured_output: {
      required_events_present: structuredTrace?.required_events_present_in_attempt_001 === true
        && structuredTrace?.required_events_present_in_attempt_002 === true,
      payload_redacted: structuredTrace?.payload_redacted === true,
      raw_response_stored: Boolean(structuredTrace?.raw_response_stored)
    },
    tool_calling: {
      required_events_present: toolTrace?.required_events_present_in_attempt_001 === true
        && toolTrace?.required_events_present_in_attempt_002 === true,
      payload_redacted: toolTrace?.payload_redacted === true,
      raw_response_stored: Boolean(toolTrace?.raw_response_stored)
    }
  }
};
const suiteRedaction = {
  status: redactionPassed && !rawResponseStored ? "pass" : status,
  redaction_passed: redactionPassed,
  raw_response_stored: rawResponseStored,
  api_key_recorded: false,
  raw_authorization_header_recorded: false
};
const unresolvedItems = status === "pass" ? [] : [
  {
    id: status === "blocked" ? "OCRS-001" : "OCRS-002",
    severity: status === "blocked" ? "medium" : "high",
    description: status === "blocked"
      ? "OpenAI canary replay suite is blocked because one or more rerun attempts are missing or credential/model was not available."
      : "OpenAI canary replay suite failed comparison for one or more canary surfaces.",
    blocks_replay_verified_claim: true,
    blocks_release_gate: true,
    owner: status === "blocked" ? "human" : "agent",
    recommended_next_action: status === "blocked"
      ? "Provide OPENAI_API_KEY and OPENAI_MODEL, then rerun the OpenAI canary replay suite."
      : "Inspect the failing surface comparison, redacted request mapping, response mapping, schema validation, tool output reinjection, and trace comparison."
  }
];

if (toolCalling) {
  writeJson(p("evidence", "beta-openai-canary-replay-suite", "tool_calling_replay_comparison_report.json"), toolCalling);
}
writeJson(p("evidence", "beta-openai-canary-replay-suite", "suite_replay_summary.json"), summary);
writeJson(p("evidence", "beta-openai-canary-replay-suite", "suite_trace_comparison.json"), traceComparison);
writeJson(p("evidence", "beta-openai-canary-replay-suite", "suite_redaction_report.json"), suiteRedaction);
writeJson(p("evidence", "beta-openai-canary-replay-suite", "unresolved_items.json"), unresolvedItems);

const md = `# OpenAI Canary Replay Suite

Status: ${summary.status}

Stage: ${STAGE}

- No-tool text: ${summary.surfaces.no_tool_text.status}
- Structured output: ${summary.surfaces.structured_output.status}
- Tool calling: ${summary.surfaces.tool_calling.status}
- All required surfaces passed: ${summary.all_required_surfaces_passed}
- Provider execution performed in this stage: ${summary.provider_execution_performed_in_this_stage}
- Local model execution: ${summary.local_model_execution}
- External side effects: ${summary.external_side_effects}
- Raw response stored: ${summary.raw_response_stored}
- Redaction passed: ${summary.redaction_passed}
- Claim level: ${summary.claim_level}

This suite is canary replay evidence only and does not allow replay-verified,
provider-diverse, integration-verified, or release-gated claims.
`;

writeText(p("evidence", "beta-openai-canary-replay-suite", "suite_replay_summary.md"), md);
writeJson(p("evals", "reports", "openai_canary_replay_suite_report.json"), summary);
writeText(p("evals", "reports", "openai_canary_replay_suite_report.md"), md);

console.log(JSON.stringify(summary, null, 2));
process.exit(status === "fail" ? 1 : 0);

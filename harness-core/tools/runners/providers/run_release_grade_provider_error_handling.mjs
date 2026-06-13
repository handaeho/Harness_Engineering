#!/usr/bin/env node
import path from "node:path";
import { createTextOnlyResponse } from "../../../adapters/api/openai/responses_client.mjs";
import { createGenerateContent } from "../../../adapters/api/gemini/generate_content_client.mjs";
import { mapCanaryRequest as mapGeminiCanaryRequest } from "../../../adapters/api/gemini/request_mapper.mjs";
import { redactionPassed as openaiRedactionPassed } from "../../../adapters/api/openai/redaction_policy.mjs";
import { redactionPassed as geminiRedactionPassed } from "../../../adapters/api/gemini/redaction_policy.mjs";
import { checkProviderExecutionGuard } from "../../../runtime/provider/provider_execution_guard.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-provider-error-handling";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function read(relPath) {
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function liveApproved(env = process.env) {
  return env.PROVIDER_ERROR_HANDLING_ENABLE_LIVE === "1"
    && env.PROVIDER_ERROR_HANDLING_NETWORK_APPROVAL === "1";
}

function summarizeError(error) {
  return error.provider_error || {
    status: error.status || null,
    type: null,
    code: null,
    param: null,
    status_text: null,
    message_preview: String(error.message || "").slice(0, 220)
  };
}

async function expectProviderError({ run, expectedStatuses, expectedCodes = [] }) {
  try {
    await run();
    return {
      status: "fail",
      provider_error_received: false,
      provider_error: null,
      reason: "provider request unexpectedly succeeded"
    };
  } catch (error) {
    const providerError = summarizeError(error);
    const statusOk = expectedStatuses.includes(providerError.status);
    const observedCodes = [
      providerError.code,
      providerError.status_text,
      providerError.type
    ].filter((value) => value !== null && value !== undefined)
      .flatMap((value) => [value, String(value)]);
    const codeOk = expectedCodes.length === 0
      || expectedCodes.some((expected) => observedCodes.includes(expected) || observedCodes.includes(String(expected)));
    return {
      status: statusOk && codeOk ? "pass" : "fail",
      provider_error_received: true,
      provider_error: providerError,
      reason: statusOk && codeOk ? "expected provider error observed" : "unexpected provider error shape"
    };
  }
}

async function openaiLane() {
  const checks = [];
  const noTool = read("evidence/beta-provider-canary-openai/provider_canary_report.json");
  const structured = read("evidence/beta-structured-output-canary-openai/structured_output_canary_report.json");
  const tool = read("evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json");

  addCheck(checks, "openai base live canaries pass", [noTool, structured, tool].every((item) => item?.status === "pass"), {
    no_tool_status: noTool?.status || "missing",
    structured_status: structured?.status || "missing",
    tool_status: tool?.status || "missing"
  });

  const malformedModelGuard = checkProviderExecutionGuard({
    stage: "v2.0.0-beta-provider-canary-openai-credentialed-rerun",
    request: {
      model: "“gpt-5.4-mini”",
      input: "Return OK",
      store: false,
      max_output_tokens: 16
    },
    env: {
      OPENAI_API_KEY: "sk-local-sentinel-not-a-secret",
      OPENAI_MODEL: "“gpt-5.4-mini”"
    }
  });
  addCheck(checks, "openai malformed model env blocked locally", malformedModelGuard.status === "blocked_by_malformed_model_env", malformedModelGuard);

  if (!liveApproved()) {
    addCheck(checks, "openai provider error live approval present", false, {
      required: [
        "PROVIDER_ERROR_HANDLING_ENABLE_LIVE=1",
        "PROVIDER_ERROR_HANDLING_NETWORK_APPROVAL=1"
      ]
    });
    return {
      status: "hold",
      provider_verified_error_handling_sufficient: false,
      provider_execution: false,
      checks
    };
  }
  addCheck(checks, "openai provider error live approval present", true, {});

  if (!process.env.OPENAI_API_KEY) {
    addCheck(checks, "openai credential present", false, {});
    return {
      status: "hold",
      provider_verified_error_handling_sufficient: false,
      provider_execution: false,
      checks
    };
  }
  addCheck(checks, "openai credential present", true, {});

  const invalidModel = await expectProviderError({
    expectedStatuses: [400, 404],
    expectedCodes: ["model_not_found", "invalid_request_error"],
    run: () => createTextOnlyResponse({
      model: "harness-core-invalid-model-for-error-handling",
      input: "Return OK",
      store: false,
      max_output_tokens: 16
    }, process.env)
  });
  addCheck(checks, "openai invalid model provider error classified", invalidModel.status === "pass" && openaiRedactionPassed(invalidModel), invalidModel);

  const pass = checks.every((item) => item.status === "pass");
  return {
    status: pass ? "pass" : "hold",
    provider_verified_error_handling_sufficient: pass,
    provider_execution: true,
    raw_response_stored: false,
    redaction_passed: openaiRedactionPassed(checks),
    checks
  };
}

async function geminiLane() {
  const checks = [];
  const noTool = read("evidence/beta-provider-canary-gemini/gemini_provider_canary_report.json");
  const structured = read("evidence/beta-structured-output-canary-gemini/structured_output_canary_report.json");
  const tool = read("evidence/beta-tool-calling-canary-gemini/tool_calling_canary_report.json");

  addCheck(checks, "gemini base live canaries pass", [noTool, structured, tool].every((item) => item?.status === "pass"), {
    no_tool_status: noTool?.status || "missing",
    structured_status: structured?.status || "missing",
    tool_status: tool?.status || "missing"
  });

  if (!liveApproved()) {
    addCheck(checks, "gemini provider error live approval present", false, {
      required: [
        "PROVIDER_ERROR_HANDLING_ENABLE_LIVE=1",
        "PROVIDER_ERROR_HANDLING_NETWORK_APPROVAL=1"
      ]
    });
    return {
      status: "hold",
      provider_verified_error_handling_sufficient: false,
      provider_execution: false,
      checks
    };
  }
  addCheck(checks, "gemini provider error live approval present", true, {});

  if (!process.env.GEMINI_API_KEY) {
    addCheck(checks, "gemini credential present", false, {});
    return {
      status: "hold",
      provider_verified_error_handling_sufficient: false,
      provider_execution: false,
      checks
    };
  }
  addCheck(checks, "gemini credential present", true, {});

  const invalidRequest = mapGeminiCanaryRequest({
    case_id: "invalid_model_provider_error",
    input: "Return OK",
    expected_contains: "OK"
  }, {
    ...process.env,
    GEMINI_MODEL: "harness-core-invalid-model-for-error-handling"
  });
  const invalidModel = await expectProviderError({
    expectedStatuses: [400, 404],
    expectedCodes: [404, "404", "NOT_FOUND", "INVALID_ARGUMENT"],
    run: () => createGenerateContent(invalidRequest, process.env)
  });
  addCheck(checks, "gemini invalid model provider error classified", invalidModel.status === "pass" && geminiRedactionPassed(invalidModel), invalidModel);

  const pass = checks.every((item) => item.status === "pass");
  return {
    status: pass ? "pass" : "hold",
    provider_verified_error_handling_sufficient: pass,
    provider_execution: true,
    raw_response_stored: false,
    redaction_passed: geminiRedactionPassed(checks),
    checks
  };
}

const providers = {
  openai: await openaiLane(),
  gemini: await geminiLane()
};
const pass = Object.values(providers).every((lane) => lane.status === "pass");
const report = {
  status: pass ? "pass" : "hold",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  provider_verified_sufficient: pass,
  provider_verified_error_handling_sufficient: pass,
  live_execution: liveApproved(),
  raw_request_storage_allowed: false,
  raw_response_storage_allowed: false,
  secret_storage_allowed: false,
  providers,
  blockers: Object.entries(providers)
    .filter(([, lane]) => lane.status !== "pass")
    .map(([provider]) => `${provider}_provider_error_handling_not_execution_backed`)
};

const dir = p("evidence", "release-grade-provider-error-handling");
writeJson(path.join(dir, "provider_error_handling_report.json"), report);
writeText(path.join(dir, "provider_error_handling_report.md"), `# Release Grade Provider Error Handling

Status: ${report.status}

- Provider-verified sufficient: ${report.provider_verified_sufficient}
- Live execution: ${report.live_execution}
- OpenAI lane: ${providers.openai.status}
- Gemini lane: ${providers.gemini.status}
`);
writeJson(p("evals", "reports", "release_grade_provider_error_handling_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

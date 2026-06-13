#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-provider-replay-regression";
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

function source(relPath) {
  const record = read(relPath);
  return {
    path: relPath,
    exists: Boolean(record),
    status: record?.status || "missing",
    stage: record?.stage || null
  };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function openaiLane() {
  const noTool = read("evidence/beta-provider-canary-openai/provider_canary_report.json");
  const structured = read("evidence/beta-structured-output-canary-openai/structured_output_canary_report.json");
  const tool = read("evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json");
  const suiteGate = read("evidence/beta-openai-canary-replay-suite/suite_gate_report.json");
  const suiteSummary = read("evidence/beta-openai-canary-replay-suite/suite_replay_summary.json");
  const checks = [];

  addCheck(checks, "openai no-tool live canary pass", noTool?.status === "pass" && noTool?.provider_execution === true, source("evidence/beta-provider-canary-openai/provider_canary_report.json"));
  addCheck(checks, "openai structured-output live canary pass", structured?.status === "pass" && structured?.provider_execution === true, source("evidence/beta-structured-output-canary-openai/structured_output_canary_report.json"));
  addCheck(checks, "openai tool-calling live canary pass", tool?.status === "pass" && tool?.provider_execution === true, source("evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json"));
  addCheck(checks, "openai canary suite consistency pass", suiteGate?.status === "pass" && suiteSummary?.status === "pass", {
    suite_gate: source("evidence/beta-openai-canary-replay-suite/suite_gate_report.json"),
    suite_summary: source("evidence/beta-openai-canary-replay-suite/suite_replay_summary.json")
  });
  addCheck(checks, "openai no raw response stored", [noTool, structured, tool, suiteSummary].every((item) => item?.raw_response_stored === false), {});
  addCheck(checks, "openai redaction passed", [noTool, structured, tool, suiteSummary].every((item) => item?.redaction_passed === true), {});
  addCheck(checks, "openai stronger replay claims remain blocked", suiteGate?.can_enter_replay_verified_claim === false
    && suiteGate?.claims_blocked?.includes("replay-verified"), {
      can_enter_replay_verified_claim: suiteGate?.can_enter_replay_verified_claim,
      claims_blocked: suiteGate?.claims_blocked || []
    });

  const pass = checks.every((item) => item.status === "pass");
  return {
    status: pass ? "pass" : "hold",
    replay_verified_allowed: false,
    provider_verified_replay_regression_sufficient: pass,
    evidence_class: "release_grade_provider_regression_from_current_live_canary_and_canary_suite",
    checks
  };
}

function geminiLane() {
  const noTool = read("evidence/beta-provider-canary-gemini/gemini_provider_canary_report.json");
  const structured = read("evidence/beta-structured-output-canary-gemini/structured_output_canary_report.json");
  const tool = read("evidence/beta-tool-calling-canary-gemini/tool_calling_canary_report.json");
  const assetPack = read("evidence/beta-provider-canary-gemini/gemini_runtime_asset_pack_report.json");
  const checks = [];

  addCheck(checks, "gemini provider canary pass", noTool?.status === "pass" && noTool?.provider_execution === true, source("evidence/beta-provider-canary-gemini/gemini_provider_canary_report.json"));
  addCheck(checks, "gemini structured-output live canary pass", structured?.status === "pass" && structured?.provider_execution === true, source("evidence/beta-structured-output-canary-gemini/structured_output_canary_report.json"));
  addCheck(checks, "gemini tool-calling live canary pass", tool?.status === "pass" && tool?.provider_execution === true, source("evidence/beta-tool-calling-canary-gemini/tool_calling_canary_report.json"));
  addCheck(checks, "gemini runtime asset pack pass", assetPack?.status === "pass", source("evidence/beta-provider-canary-gemini/gemini_runtime_asset_pack_report.json"));
  addCheck(checks, "gemini no raw response stored", [noTool, structured, tool].every((item) => item?.raw_response_stored === false), {});
  addCheck(checks, "gemini redaction passed", [noTool, structured, tool].every((item) => item?.redaction_passed === true), {});

  const pass = checks.every((item) => item.status === "pass");
  return {
    status: pass ? "pass" : "hold",
    replay_verified_allowed: false,
    provider_verified_replay_regression_sufficient: pass,
    evidence_class: "release_grade_provider_regression_from_current_live_canary_and_runtime_asset_pack",
    checks
  };
}

const providers = {
  openai: openaiLane(),
  gemini: geminiLane()
};
const pass = Object.values(providers).every((lane) => lane.status === "pass");
const report = {
  status: pass ? "pass" : "hold",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  provider_verified_replay_regression_sufficient: pass,
  replay_verified_allowed: false,
  raw_request_storage_allowed: false,
  raw_response_storage_allowed: false,
  providers,
  blocked_claims: [
    "replay-verified",
    "release-gated",
    "production-ready",
    "stable"
  ]
};

const dir = p("evidence", "release-grade-provider-replay-regression");
writeJson(path.join(dir, "provider_replay_regression_report.json"), report);
writeText(path.join(dir, "provider_replay_regression_report.md"), `# Release Grade Provider Replay Regression

Status: ${report.status}

- Provider-verified replay/regression sufficient: ${report.provider_verified_replay_regression_sufficient}
- Replay-verified allowed: false
- OpenAI lane: ${providers.openai.status}
- Gemini lane: ${providers.gemini.status}
`);
writeJson(p("evals", "reports", "release_grade_provider_replay_regression_report.json"), report);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

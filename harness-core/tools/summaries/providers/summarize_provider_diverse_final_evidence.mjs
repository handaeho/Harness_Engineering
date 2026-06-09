#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-combined-provider-diverse-final-gate";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function readJsonIfExists(relPath) {
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

const summary = readJsonIfExists("evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_evidence_summary.json") || {};
const completeness = readJsonIfExists("evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_evidence_completeness.json") || {};
const independence = readJsonIfExists("evidence/post-combined-provider-diverse-final-gate/provider_lane_independence_final_review.json") || {};
const report = {
  status: summary.status === "pass"
    && completeness.status === "pass"
    && independence.status === "pass"
    ? "pass"
    : "fail",
  stage: STAGE,
  provider_lanes: summary.provider_lanes || [],
  openai_lane_evidence_complete: summary.openai_lane_evidence_complete === true,
  ollama_qwen3_lane_evidence_complete: summary.ollama_qwen3_lane_evidence_complete === true,
  distinct_provider_lanes: summary.distinct_provider_lanes === true,
  independent_execution_evidence_per_lane: summary.independent_execution_evidence_per_lane === true,
  missing_evidence: completeness.missing_evidence || [],
  no_new_execution: summary.no_new_execution === true,
  openai_model_api_call: summary.openai_model_api_call === true,
  telemetry_sink_write: summary.telemetry_sink_write === true,
  reference_baseline_source_modified: summary.reference_baseline_source_modified === true,
  dist_modified: summary.dist_modified === true
};

writeJson(p("evals", "reports", "provider_diverse_final_evidence_summary_report.json"), report);
writeText(p("evals", "reports", "provider_diverse_final_evidence_summary_report.md"), `# Provider Diverse Final Evidence Summary\n\nStatus: ${report.status}\n\n- Provider lanes: ${report.provider_lanes.join(", ")}\n- OpenAI lane evidence complete: ${report.openai_lane_evidence_complete}\n- Ollama qwen3 lane evidence complete: ${report.ollama_qwen3_lane_evidence_complete}\n- Distinct provider lanes: ${report.distinct_provider_lanes}\n- Independent execution evidence per lane: ${report.independent_execution_evidence_per_lane}\n`);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

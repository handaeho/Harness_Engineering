#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const attemptArg = args.find((arg) => arg.startsWith("--attempt-id="));
const surfaceArg = args.find((arg) => arg.startsWith("--surface="));
const rootArg = args.find((arg) => !arg.startsWith("--"));
const attemptId = attemptArg ? attemptArg.slice("--attempt-id=".length) : null;
const explicitSurface = surfaceArg ? surfaceArg.slice("--surface=".length) : null;

if (!attemptId) {
  console.error("missing --attempt-id");
  process.exit(1);
}

const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

function p(...parts) {
  return path.join(root, ...parts);
}

function inferSurface(id) {
  if (id.includes("structured-output")) return "structured-output";
  if (id.includes("tool-calling")) return "tool-calling";
  return "no-tool";
}

function copyIfExists(source, target) {
  if (!fs.existsSync(source)) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

const surface = explicitSurface || inferSurface(attemptId);
const configs = {
  "no-tool": {
    sourceDir: p("evidence", "beta-provider-canary-openai"),
    targetDir: p("evidence", "beta-provider-canary-openai", "attempts", attemptId),
    files: [
      "provider_canary_report.json",
      "provider_canary_report.md",
      "provider_trace_samples.jsonl",
      "request_response_mapping_report.json",
      "redaction_report.json",
      "provider_canary_gate_report.json",
      "unresolved_items.json"
    ]
  },
  "structured-output": {
    sourceDir: p("evidence", "beta-structured-output-canary-openai"),
    targetDir: p("evidence", "beta-structured-output-canary-openai", "attempts", attemptId),
    files: [
      "structured_output_canary_report.json",
      "structured_output_canary_report.md",
      "structured_output_trace_samples.jsonl",
      "structured_output_mapping_report.json",
      "schema_validation_report.json",
      "redaction_report.json",
      "structured_output_gate_report.json",
      "unresolved_items.json"
    ]
  },
  "tool-calling": {
    sourceDir: p("evidence", "beta-tool-calling-canary-openai"),
    targetDir: p("evidence", "beta-tool-calling-canary-openai", "attempts", attemptId),
    files: [
      "tool_calling_canary_report.json",
      "tool_calling_canary_report.md",
      "tool_calling_trace_samples.jsonl",
      "tool_call_mapping_report.json",
      "tool_argument_validation_report.json",
      "tool_execution_report.json",
      "approval_boundary_report.json",
      "redaction_report.json",
      "unresolved_items.json"
    ]
  }
};

const config = configs[surface];
if (!config) {
  console.error(`unsupported --surface=${surface}`);
  process.exit(1);
}

const copied = [];
const missing = [];
for (const file of config.files) {
  const ok = copyIfExists(path.join(config.sourceDir, file), path.join(config.targetDir, file));
  if (ok) copied.push(file);
  else missing.push(file);
}

const result = {
  status: missing.length === 0 ? "pass" : "fail",
  surface,
  attempt_id: attemptId,
  target_dir: path.relative(root, config.targetDir).split(path.sep).join("/"),
  copied,
  missing
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);

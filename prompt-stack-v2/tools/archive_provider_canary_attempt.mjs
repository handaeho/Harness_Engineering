#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

const attemptArg = process.argv.find((arg) => arg.startsWith("--attempt-id="));
const attemptId = attemptArg ? attemptArg.split("=")[1] : null;
if (!attemptId) {
  console.error("missing --attempt-id");
  process.exit(1);
}

function p(...parts) {
  return path.join(root, ...parts);
}

function copyIfExists(source, target) {
  if (!fs.existsSync(source)) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

const sourceDir = p("evidence", "beta-provider-canary-openai");
const targetDir = p("evidence", "beta-provider-canary-openai", "attempts", attemptId);
const files = attemptId.startsWith("001-")
  ? [
      "provider_canary_report.json",
      "provider_canary_report.md",
      "provider_trace_samples.jsonl",
      "provider_canary_gate_report.json",
      "unresolved_items.json"
    ]
  : [
      "provider_canary_report.json",
      "provider_canary_report.md",
      "provider_trace_samples.jsonl",
      "request_response_mapping_report.json",
      "redaction_report.json",
      "provider_canary_gate_report.json",
      "unresolved_items.json"
    ];

const copied = [];
const missing = [];
for (const file of files) {
  const ok = copyIfExists(path.join(sourceDir, file), path.join(targetDir, file));
  if (ok) copied.push(file);
  else missing.push(file);
}

const result = {
  status: missing.length === 0 ? "pass" : "fail",
  attempt_id: attemptId,
  target_dir: path.relative(root, targetDir).split(path.sep).join("/"),
  copied,
  missing
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);

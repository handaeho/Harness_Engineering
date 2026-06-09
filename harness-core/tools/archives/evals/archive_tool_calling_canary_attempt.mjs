#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ensureDir } from "../../lib/file_walk.mjs";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const attemptArg = args.find((arg) => arg.startsWith("--attempt-id="));
const rootArg = args.find((arg) => !arg.startsWith("--"));
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const attemptId = attemptArg?.slice("--attempt-id=".length);

if (!attemptId) {
  console.error(JSON.stringify({
    status: "fail",
    reason: "missing --attempt-id"
  }, null, 2));
  process.exit(1);
}

const sourceDir = path.join(root, "evidence", "beta-tool-calling-canary-openai");
const targetDir = path.join(sourceDir, "attempts", attemptId);
const files = [
  "tool_calling_canary_report.json",
  "tool_calling_canary_report.md",
  "tool_calling_trace_samples.jsonl",
  "tool_call_mapping_report.json",
  "tool_argument_validation_report.json",
  "tool_execution_report.json",
  "approval_boundary_report.json",
  "redaction_report.json",
  "tool_calling_gate_report.json",
  "unresolved_items.json"
];

ensureDir(targetDir);
const copied = [];
const missing = [];
for (const file of files) {
  const src = path.join(sourceDir, file);
  const dest = path.join(targetDir, file);
  if (!fs.existsSync(src)) {
    missing.push(file);
    continue;
  }
  fs.copyFileSync(src, dest);
  copied.push(file);
}

const report = {
  status: missing.length ? "fail" : "pass",
  attempt_id: attemptId,
  target_dir: path.relative(root, targetDir).split(path.sep).join("/"),
  copied,
  missing
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

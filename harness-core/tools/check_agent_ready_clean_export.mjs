#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const STAGE = "v2.0.0-harness-core-final-precommit-convergence-autopilot";
const SOURCE_REPORT = "evidence/self-contained-agent-ready-check/self_contained_clean_export_check.json";
const TARGET_REPORT = "evidence/clean-artifact-prune/agent_ready_clean_export_report.json";

const repoRoot = process.cwd();
const root = path.basename(repoRoot) === "harness-core"
  ? repoRoot
  : path.resolve(repoRoot, "harness-core");

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function writeJson(relPath, data) {
  const file = p(relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(p(relPath), "utf8"));
}

function parseLastJsonObject(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

const result = spawnSync(process.execPath, ["tools/check_clean_export_self_contained.mjs"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 80 * 1024 * 1024
});

const sourceReport = fs.existsSync(p(SOURCE_REPORT))
  ? readJson(SOURCE_REPORT)
  : parseLastJsonObject(result.stdout);

const report = {
  ...(sourceReport || {}),
  stage: STAGE,
  generated_at: new Date().toISOString(),
  checker: "check_agent_ready_clean_export.mjs",
  delegated_checker: "tools/check_clean_export_self_contained.mjs",
  delegated_exit_code: result.status,
  delegated_stderr: result.stderr.trim(),
  weak_claim_recorded: "clean-artifact-gate-checked"
};

writeJson(TARGET_REPORT, report);
writeJson("evidence/clean-artifact-prune/unresolved_items.json", {
  status: report.status === "pass" ? "pass" : "blocked",
  stage: STAGE,
  generated_at: report.generated_at,
  unresolved_items_count: report.unresolved_items_count || 0,
  unresolved_items: report.unresolved_items || []
});

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-skipped-redteam-case-review-and-lane-classification";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-skipped-redteam-case-review");
const lanes = [
  "additional_openai_provider_redteam",
  "local_runtime_redteam",
  "future_rag_redteam",
  "containment_boundary_verification",
  "duplicate_or_covered",
  "manual_review_required"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeJsonl(file, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""), "utf8");
}

function laneFileRecord(item) {
  return {
    case_id: item.case_id,
    source_fixture: item.source_fixture,
    category: item.category,
    severity: item.severity,
    original_target_surface: item.original_target_surface,
    lane: item.lane,
    disposition: item.disposition,
    execution_required_for_redteam_passed: item.execution_required_for_redteam_passed,
    required_future_condition: item.required_future_condition
  };
}

const dispositionFile = path.join(evidenceDir, "skipped_case_disposition.jsonl");
const dispositions = readJsonl(dispositionFile);
const counts = Object.fromEntries(lanes.map((lane) => [lane, 0]));
for (const item of dispositions) {
  if (Object.hasOwn(counts, item.lane)) counts[item.lane] += 1;
}

const summary = {
  status: dispositions.length === 12 && counts.manual_review_required === 0 ? "pass" : "fail",
  stage: STAGE,
  new_provider_execution: false,
  new_redteam_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  skipped_cases_total: 12,
  dispositions_recorded: dispositions.length,
  manual_review_required_count: counts.manual_review_required,
  lanes: counts,
  redteam_passed_allowed: false,
  containment_verified_allowed: false,
  release_gated_allowed: false
};

writeJson(path.join(evidenceDir, "lane_classification_summary.json"), summary);
writeJsonl(path.join(evidenceDir, "remaining_provider_compatible_cases.jsonl"), dispositions.filter((item) => item.lane === "additional_openai_provider_redteam").map(laneFileRecord));
writeJsonl(path.join(evidenceDir, "local_runtime_redteam_candidates.jsonl"), dispositions.filter((item) => item.lane === "local_runtime_redteam").map(laneFileRecord));
writeJsonl(path.join(evidenceDir, "future_rag_candidates.jsonl"), dispositions.filter((item) => item.lane === "future_rag_redteam").map(laneFileRecord));
writeJsonl(path.join(evidenceDir, "containment_boundary_candidates.jsonl"), dispositions.filter((item) => item.lane === "containment_boundary_verification").map(laneFileRecord));

const md = `# Redteam Lane Classification

Status: ${summary.status}

${lanes.map((lane) => `- ${lane}: ${counts[lane]}`).join("\n")}

No lane is executable in this stage.
`;

writeJson(p("evals", "reports", "redteam_lane_classification_report.json"), summary);
writeText(p("evals", "reports", "redteam_lane_classification_report.md"), md);

console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.status === "pass" ? 0 : 1;

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-skipped-redteam-case-review-and-lane-classification";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-skipped-redteam-case-review");

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

function check(name, pass, detail = {}) {
  return { name, status: pass ? "pass" : "fail", detail };
}

const schema = readJson(p("security", "redteam", "redteam_case_disposition.schema.json"));
const dispositions = readJsonl(path.join(evidenceDir, "skipped_case_disposition.jsonl"));
const summary = fs.existsSync(path.join(evidenceDir, "lane_classification_summary.json"))
  ? readJson(path.join(evidenceDir, "lane_classification_summary.json"))
  : null;
const exclusion = fs.existsSync(path.join(evidenceDir, "exclusion_justification_report.json"))
  ? readJson(path.join(evidenceDir, "exclusion_justification_report.json"))
  : null;
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
const schemaFailures = [];
for (const item of dispositions) {
  if (!validate(item)) {
    schemaFailures.push({ case_id: item.case_id, errors: validate.errors });
  }
}
const ids = dispositions.map((item) => item.case_id);
const uniqueIds = new Set(ids);
const manualReview = dispositions.filter((item) => item.lane === "manual_review_required");

const checks = [
  check("dispositions total is 12", dispositions.length === 12, { count: dispositions.length }),
  check("case ids are unique", uniqueIds.size === dispositions.length, { unique_count: uniqueIds.size }),
  check("all dispositions validate schema", schemaFailures.length === 0, { schema_failures: schemaFailures }),
  check("manual review required count is zero", manualReview.length === 0, { case_ids: manualReview.map((item) => item.case_id) }),
  check("summary matches disposition count", summary?.dispositions_recorded === dispositions.length && summary?.skipped_cases_total === 12, {
    skipped_cases_total: summary?.skipped_cases_total,
    dispositions_recorded: summary?.dispositions_recorded
  }),
  check("exclusion report has no missing disposition", Array.isArray(exclusion?.cases_without_disposition) && exclusion.cases_without_disposition.length === 0, {
    cases_without_disposition: exclusion?.cases_without_disposition
  }),
  check("strong claims remain blocked", summary?.redteam_passed_allowed === false
    && summary?.containment_verified_allowed === false
    && summary?.release_gated_allowed === false, {
    redteam_passed_allowed: summary?.redteam_passed_allowed,
    containment_verified_allowed: summary?.containment_verified_allowed,
    release_gated_allowed: summary?.release_gated_allowed
  })
];
const status = checks.every((item) => item.status === "pass") ? "pass" : "fail";
const report = {
  status,
  stage: STAGE,
  dispositions_recorded: dispositions.length,
  manual_review_required_count: manualReview.length,
  schema_failures: schemaFailures,
  checks,
  redteam_passed_allowed: false,
  containment_verified_allowed: false,
  release_gated_allowed: false
};
const md = `# Skipped Redteam Case Disposition Audit

Status: ${status}

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "skipped_redteam_case_disposition_audit_report.json"), report);
writeText(p("evals", "reports", "skipped_redteam_case_disposition_audit_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exitCode = status === "pass" ? 0 : 1;

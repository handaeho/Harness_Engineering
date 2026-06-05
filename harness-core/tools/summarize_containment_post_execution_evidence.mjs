#!/usr/bin/env node
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";
import { buildPostExecutionAuditArtifacts, resolveRoot } from "./review_dedicated_containment_results.mjs";

const root = resolveRoot();
buildPostExecutionAuditArtifacts(root);

const report = readJson(path.join(
  root,
  "evidence",
  "beta-containment-post-execution-claim-audit",
  "containment_post_execution_review_report.json"
));
const completeness = readJson(path.join(
  root,
  "evidence",
  "beta-containment-post-execution-claim-audit",
  "dedicated_containment_evidence_completeness_report.json"
));
const noSideEffect = readJson(path.join(
  root,
  "evidence",
  "beta-containment-post-execution-claim-audit",
  "containment_no_side_effect_evidence_review.json"
));

console.log(JSON.stringify({
  status: report.status,
  stage: report.stage,
  source_execution_status: report.source_execution_status,
  cases_passed: report.cases_passed,
  cases_total: report.cases_total,
  evidence_completeness_status: completeness.status,
  no_side_effect_status: noSideEffect.status,
  containment_verified_allowed: report.containment_verified_allowed
}, null, 2));

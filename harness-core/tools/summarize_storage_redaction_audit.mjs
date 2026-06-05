#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { resolveRoot, STAGE } from "./run_cross_suite_storage_redaction_audit.mjs";

const root = resolveRoot();
const evidenceDir = path.join(root, "evidence", "beta-cross-suite-storage-redaction-audit");
const report = readJson(path.join(evidenceDir, "storage_redaction_audit_report.json"));
const allowed = readJson(path.join(evidenceDir, "allowed_preview_hash_summary_report.json"));
const redaction = readJson(path.join(evidenceDir, "redaction_boundary_audit.json"));
const summary = {
  status: report.status,
  stage: STAGE,
  artifacts_scanned: report.artifacts_scanned,
  raw_request_storage_violations: report.raw_request_storage_violations,
  raw_response_storage_violations: report.raw_response_storage_violations,
  secret_pattern_violations: report.secret_pattern_violations,
  auth_header_violations: report.auth_header_violations,
  needs_review_findings: report.needs_review_findings,
  allowed_context_findings: report.allowed_context_findings,
  allowed_payload_forms_seen: allowed.allowed_payload_forms_seen,
  redaction_boundary_audit_passed: redaction.redaction_boundary_audit_passed,
  raw_storage_audit_passed: report.raw_storage_audit_passed,
  secret_pattern_audit_passed: report.secret_pattern_audit_passed,
  containment_verified_allowed: false,
  telemetry_connected_allowed: false,
  release_gated_allowed: false,
  production_ready_allowed: false
};
const md = `# Cross-suite Storage Redaction Audit Summary

Status: ${summary.status}

- Artifacts scanned: ${summary.artifacts_scanned}
- Raw request storage violations: ${summary.raw_request_storage_violations}
- Raw response storage violations: ${summary.raw_response_storage_violations}
- Secret pattern violations: ${summary.secret_pattern_violations}
- Auth header violations: ${summary.auth_header_violations}
- Needs review findings: ${summary.needs_review_findings}
`;

writeJson(path.join(evidenceDir, "storage_redaction_audit_summary.json"), summary);
writeText(path.join(evidenceDir, "storage_redaction_audit_summary.md"), md);

console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.status === "pass" ? 0 : summary.status === "needs_review" ? 2 : 1;

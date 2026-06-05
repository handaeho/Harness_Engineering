#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-final-gate";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-final-gate";
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

const summary = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_evidence_summary.json`);
const completeness = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_evidence_completeness.json`);
const report = {
  status: summary?.status === "pass" && completeness?.status === "pass" ? "pass" : "fail",
  stage: STAGE,
  telemetry_connected: summary?.telemetry_connected === true,
  monitoring_window_completed: summary?.monitoring_window_completed === true,
  duration_met: summary?.duration_met === true,
  sample_count_met: summary?.sample_count_met === true,
  thresholds_passed: summary?.thresholds_passed === true,
  redaction_failures: summary?.redaction_failures ?? null,
  raw_payload_storage_violations: summary?.raw_payload_storage_violations ?? null,
  secret_logging_findings: summary?.secret_logging_findings ?? null,
  missing_evidence: completeness?.missing_evidence || []
};

writeJson(p("evals", "reports", "post_rc_production_monitoring_final_evidence_report.json"), {
  ...summary,
  evidence_completeness_status: completeness?.status || "missing",
  missing_evidence: report.missing_evidence
});
writeText(p("evals", "reports", "post_rc_production_monitoring_final_evidence_report.md"), `# Production Monitoring Final Evidence

Status: ${report.status}

- Telemetry connected: ${report.telemetry_connected}
- Monitoring window completed: ${report.monitoring_window_completed}
- Duration met: ${report.duration_met}
- Sample count met: ${report.sample_count_met}
- Thresholds passed: ${report.thresholds_passed}
- Redaction failures: ${report.redaction_failures}
- Raw payload storage violations: ${report.raw_payload_storage_violations}
- Secret logging findings: ${report.secret_logging_findings}
`);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

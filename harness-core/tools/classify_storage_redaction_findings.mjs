#!/usr/bin/env node
import path from "node:path";
import { runAudit, resolveRoot, STAGE } from "./run_cross_suite_storage_redaction_audit.mjs";
import { writeJson, writeText } from "./lib/file_walk.mjs";

const root = resolveRoot();
const result = runAudit({ root, write: true });
const report = result.findingReport;
const md = `# Storage Redaction Findings Report

Status: ${report.status}

Stage: ${STAGE}

- Findings total: ${report.findings_total}
- Violations: ${report.violation_count}
- Needs review: ${report.needs_review_findings}
- Allowed context: ${report.allowed_context_findings}
`;

writeJson(path.join(root, "evals", "reports", "storage_redaction_findings_report.json"), report);
writeText(path.join(root, "evals", "reports", "storage_redaction_findings_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === "pass" ? 0 : report.status === "needs_review" ? 2 : 1;

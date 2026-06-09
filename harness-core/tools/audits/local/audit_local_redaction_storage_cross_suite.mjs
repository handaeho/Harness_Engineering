#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readText, writeJson, writeText, walkFiles, relativeTo } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-redaction-storage-cross-suite-audit";
const EVIDENCE_DIR = "post-stable-local-redaction-storage-cross-suite-audit";
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];
const ALLOWED_CLAIMS = [
  "post-stable-local-redaction-storage-audit-passed"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

function p(...parts) {
  return path.join(root, ...parts);
}

function gitStatusFor(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function protectedStatus() {
  const status = gitStatusFor([
    "legacy-reference-source",
    "dist",
    "harness-core/evidence/reference-baseline"
  ]);
  const lines = status.stdout.split(/\r?\n/).filter(Boolean);
  return {
    reference_baseline_source_modified: lines.some((line) => line.includes("legacy-reference-source")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_reference_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/reference-baseline"))
  };
}

function inspectJsonValue(value, relPath, findings) {
  if (Array.isArray(value)) {
    value.forEach((item) => inspectJsonValue(item, relPath, findings));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if ([
      "raw_request_stored",
      "raw_response_stored",
      "raw_authorization_header_recorded",
      "raw_request_body_recorded",
      "raw_response_recorded",
      "api_key_recorded",
      "secrets_logged",
      "secret_logged",
      "auth_header_logged",
      "api_key_logged"
    ].includes(key) && item === true) {
      findings.push({
        file: relPath,
        key,
        issue: "forbidden_storage_or_secret_flag_true"
      });
    }
    inspectJsonValue(item, relPath, findings);
  }
}

const evidenceRoot = p("evidence");
const files = walkFiles(evidenceRoot, {
  excludedPaths: ["reference-baseline"],
  extensions: [".json", ".jsonl", ".md"]
}).filter((file) => relativeTo(evidenceRoot, file).includes("local"));

const findings = [];
const inspectedFiles = [];
for (const file of files) {
  const rel = `evidence/${relativeTo(evidenceRoot, file)}`;
  const text = readText(file);
  inspectedFiles.push(rel);
  if (/Authorization:\s*Bearer\s+\S+/i.test(text)) {
    findings.push({ file: rel, issue: "authorization_bearer_pattern_detected" });
  }
  if (/\b(sk-[A-Za-z0-9_-]{12,}|AKIA[0-9A-Z]{12,})\b/.test(text)) {
    findings.push({ file: rel, issue: "api_key_like_pattern_detected" });
  }
  if (file.endsWith(".json")) {
    try {
      inspectJsonValue(JSON.parse(text), rel, findings);
    } catch {
      findings.push({ file: rel, issue: "json_parse_failed" });
    }
  }
}

const protectedPaths = protectedStatus();
const status = findings.length === 0
  && protectedPaths.reference_baseline_source_modified === false
  && protectedPaths.dist_modified === false
  && protectedPaths.evidence_reference_baseline_modified === false
  ? "pass"
  : "fail";

const report = {
  status,
  stage: STAGE,
  new_local_model_execution: false,
  new_local_generation_calls: 0,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  files_inspected: inspectedFiles.length,
  findings_count: findings.length,
  findings,
  claims_allowed: status === "pass" ? ALLOWED_CLAIMS : [],
  claims_blocked: BLOCKED_CLAIMS
};

const claimBoundary = {
  status,
  stage: STAGE,
  local_redaction_storage_audit_allowed: status === "pass",
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: status === "pass" ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "local_replay_regression_smoke_passed_redaction_storage_audit_pending",
  new_status: status === "pass"
    ? "local_redaction_storage_audit_passed_bundle_draft_pending"
    : "local_redaction_storage_audit_failed",
  unblocks: status === "pass" ? ALLOWED_CLAIMS : [],
  still_blocks: BLOCKED_CLAIMS,
  next_required_actions: [
    "draft local model verification evidence bundle"
  ]
};

const unresolvedItems = status === "pass" ? [] : findings.map((finding, index) => ({
  id: `LRS-${String(index + 1).padStart(3, "0")}`,
  severity: "high",
  description: `${finding.issue} in ${finding.file}`,
  recommended_next_action: "Remove or quarantine unsafe storage evidence before proceeding."
}));

const md = `# Local Redaction/Storage Cross-suite Audit

Status: ${report.status}

- Stage: ${STAGE}
- Files inspected: ${report.files_inspected}
- Findings: ${report.findings_count}
- Raw request stored: false
- Raw response stored: false
- Secrets logged: false

## Claim Boundary

- Allows after pass: ${claimBoundary.allowed_claims.join(", ") || "none"}
- Still blocked: ${BLOCKED_CLAIMS.join(", ")}
`;

writeJson(p("evidence", EVIDENCE_DIR, "local_redaction_storage_audit_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_redaction_storage_audit_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "local_redaction_storage_findings.json"), findings);
writeJson(p("evidence", EVIDENCE_DIR, "local_redaction_storage_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "local_redaction_storage_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "local_redaction_storage_gate_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_redaction_storage_gate_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "local_redaction_storage_audit_report.json"), report);
writeText(p("evals", "reports", "local_redaction_storage_audit_report.md"), md);
writeJson(p("evals", "reports", "local_redaction_storage_audit_gate_report.json"), report);
writeText(p("evals", "reports", "local_redaction_storage_audit_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

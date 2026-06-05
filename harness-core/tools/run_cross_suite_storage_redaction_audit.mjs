#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, writeText, walkFiles, relativeTo, toPosix } from "./lib/file_walk.mjs";

export const STAGE = "v2.0.0-beta-cross-suite-storage-redaction-audit";

const allowedClaimsOnPass = [
  "cross-suite-storage-redaction-audit-executed",
  "raw-storage-audit-passed",
  "redaction-boundary-audit-passed",
  "secret-pattern-audit-passed",
  "allowed-preview-hash-summary-classified",
  "storage-redaction-blocker-updated"
];

const allowedClaimsOnReview = [
  "cross-suite-storage-redaction-audit-executed"
];

const blockedClaims = [
  "containment-verified",
  "telemetry-connected",
  "production-monitored",
  "release-gated",
  "production-ready"
];

const scanRoots = [
  "evidence",
  "evals/reports",
  "docs",
  "release",
  "security",
  "observability",
  "runtime",
  "adapters",
  "tools",
  "README.md",
  "session_handoff_2026-05-22.md"
];

const excludedPaths = [
  "node_modules",
  ".git",
  "dist",
  "package-lock.json"
];

const scanExtensions = [
  ".json",
  ".jsonl",
  ".yaml",
  ".yml",
  ".md",
  ".mjs",
  ".js",
  ".txt"
];

const patternSpecs = [
  {
    finding_type: "raw_request_storage",
    severity: "medium",
    regex: /\b(raw_request|full_request|unredacted_request|request_body_raw)\b/i
  },
  {
    finding_type: "raw_response_storage",
    severity: "medium",
    regex: /\b(raw_response|full_response|unredacted_response|response_body_raw)\b/i
  },
  {
    finding_type: "raw_request_storage_true",
    severity: "critical",
    regex: /["']?raw_request_stored["']?\s*[:=]\s*true\b/i
  },
  {
    finding_type: "raw_response_storage_true",
    severity: "critical",
    regex: /["']?raw_response_stored["']?\s*[:=]\s*true\b/i
  },
  {
    finding_type: "raw_payload_storage_true",
    severity: "critical",
    regex: /["']?raw_payload_stored["']?\s*[:=]\s*true\b/i
  },
  {
    finding_type: "secret_logged_true",
    severity: "critical",
    regex: /["']?secret_logged["']?\s*[:=]\s*true\b/i
  },
  {
    finding_type: "authorization_header",
    severity: "critical",
    regex: /\bAuthorization:\s*\S+/i
  },
  {
    finding_type: "bearer_token_like",
    severity: "critical",
    regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/
  },
  {
    finding_type: "openai_api_key_like",
    severity: "critical",
    regex: /\bsk-[A-Za-z0-9_-]{20,}\b/
  },
  {
    finding_type: "langfuse_secret_key_like",
    severity: "high",
    regex: /langfuse.*secret.*[A-Za-z0-9_-]{16,}/i
  },
  {
    finding_type: "otel_header_secret_like",
    severity: "high",
    regex: /OTEL_EXPORTER_OTLP_HEADERS.*(Bearer|Basic|apikey|token)/i
  },
  {
    finding_type: "env_assignment_with_secret_value",
    severity: "high",
    regex: /\b(OPENAI_API_KEY|LANGFUSE_SECRET_KEY|OTEL_EXPORTER_OTLP_HEADERS)\s*=\s*['"]?[^'"\s]{8,}/i
  },
  {
    finding_type: "credential_name_reference",
    severity: "low",
    regex: /\b(OPENAI_API_KEY|LANGFUSE_SECRET_KEY|OTEL_EXPORTER_OTLP_HEADERS|api_key)\b/i
  }
];

const allowedPayloadPatterns = [
  { key: "output_preview", regex: /\b(output_preview|response_preview)\b/i },
  { key: "input_preview", regex: /\b(input_preview|request_preview)\b/i },
  { key: "raw_response_hash", regex: /\b(raw_response_hash|response_hash)\b/i },
  { key: "raw_request_hash", regex: /\b(raw_request_hash|request_hash)\b/i },
  { key: "usage_summary", regex: /\busage_summary\b/i },
  { key: "status_summary", regex: /\bstatus_summary\b/i },
  { key: "provider_response_id_present_boolean", regex: /\b(provider_response_id_present|response_id_present)\b/i },
  { key: "redacted_request_mapping", regex: /\b(redacted_request|request_redacted)\b/i },
  { key: "redacted_response_mapping", regex: /\b(redacted_response|response_redacted|redaction_passed)\b/i }
];

export function resolveRoot(argv = process.argv) {
  const repoRoot = process.cwd();
  return argv[2] && !argv[2].startsWith("--")
    ? path.resolve(repoRoot, argv[2])
    : path.basename(repoRoot) === "harness-core"
      ? repoRoot
      : path.resolve(repoRoot, "harness-core");
}

function p(root, ...parts) {
  return path.join(root, ...parts);
}

function exists(root, relPath) {
  return fs.existsSync(p(root, ...relPath.split("/")));
}

function isExcluded(relPath) {
  const posix = toPosix(relPath);
  return excludedPaths.some((excluded) => posix === excluded || posix.startsWith(`${excluded}/`));
}

function hasAllowedContext(relPath, line) {
  const text = line.trim();
  const lowered = text.toLowerCase();
  if (relPath.startsWith("security/audits/")) return "forbidden_or_secret_pattern_policy";
  if (relPath.includes("storage_redaction") || relPath.includes("redaction_audit")) return "storage_redaction_audit_artifact";
  if (relPath.endsWith("redaction_audit_result.schema.json")) return "schema_definition";
  if (relPath.startsWith("tools/") && /(regex|pattern|process\.env|Boolean\(process\.env|OPENAI_API_KEY|LANGFUSE_SECRET_KEY|OTEL_EXPORTER_OTLP_HEADERS)/.test(text)) {
    return "scanner_or_runner_code_context";
  }
  if (/\b(raw_request_stored|raw_response_stored|secret_logged|raw_payload_stored)\b\s*[:=]\s*false\b/i.test(text)) return "explicit_false_storage_flag";
  if (/\b(raw_request_storage_allowed|raw_response_storage_allowed|raw_request_must_not_be_stored|raw_response_must_not_be_stored)\b\s*[:=]\s*false\b/i.test(text)) return "storage_forbidden_flag";
  if (/\b(required_env|environment_requirement|credential|approval|command_plan|approval_request|credential_readiness|required|missing|present|placeholder|must_not|claims_not_allowed|forbidden|blocked|does_not_allow|does_not_unblock|still_blocks|patterns|policy|schema|secret_values_logged)\b/i.test(text)) {
    return "policy_or_requirement_context";
  }
  if (/\b(hash|preview|summary|redacted|redaction_passed|payload_redacted|stored_false|store_false)\b/i.test(text)) return "allowed_preview_hash_summary_context";
  if (lowered.includes("...") || lowered.includes("<redacted>") || lowered.includes("redacted")) return "placeholder_or_redacted_context";
  return null;
}

function isClearlyViolation(findingType, line) {
  if (/(raw_request_storage_true|raw_response_storage_true|raw_payload_storage_true|secret_logged_true|openai_api_key_like|bearer_token_like)/.test(findingType)) {
    return true;
  }
  if (findingType === "authorization_header" && /\bAuthorization:\s*(Bearer|Basic|[A-Za-z0-9._~+/=-]{16,})/i.test(line)) {
    return true;
  }
  if (findingType === "env_assignment_with_secret_value") {
    if (/\.\.\.|<|redacted|process\.env|Boolean\(process\.env/i.test(line)) return false;
    return true;
  }
  if (findingType === "langfuse_secret_key_like" || findingType === "otel_header_secret_like") {
    if (/pattern|regex|required|missing|present|policy|credential|secret_values_logged|false/i.test(line)) return false;
    return true;
  }
  return false;
}

function classifyFinding(relPath, line, spec) {
  const allowed = hasAllowedContext(relPath, line);
  if (allowed) {
    return {
      status: "allowed_context",
      context_classification: allowed,
      action_required: "none"
    };
  }
  if (isClearlyViolation(spec.finding_type, line)) {
    return {
      status: "violation",
      context_classification: "disallowed_raw_or_secret_pattern",
      action_required: "remove_or_redact_value_and_regenerate_evidence"
    };
  }
  if (/(raw_request_storage|raw_response_storage|credential_name_reference|authorization_header)/.test(spec.finding_type)) {
    return {
      status: "allowed_context",
      context_classification: "name_or_boundary_reference_without_stored_secret_value",
      action_required: "none"
    };
  }
  return {
    status: "needs_review",
    context_classification: "ambiguous_storage_or_secret_context",
    action_required: "manual_review_before_claiming_audit_pass"
  };
}

function collectArtifacts(root) {
  const files = [];
  const excluded = [];
  for (const relRoot of scanRoots) {
    const abs = p(root, ...relRoot.split("/"));
    if (!fs.existsSync(abs)) continue;
    const rel = toPosix(path.relative(root, abs));
    if (isExcluded(rel)) {
      excluded.push(rel);
      continue;
    }
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      for (const file of walkFiles(abs, { excludedPaths: excludedPaths, extensions: scanExtensions })) {
        const relFile = relativeTo(root, file);
        if (isExcluded(relFile)) {
          excluded.push(relFile);
        } else {
          files.push(file);
        }
      }
    } else if (scanExtensions.some((ext) => abs.endsWith(ext))) {
      files.push(abs);
    }
  }
  return {
    files: [...new Set(files.map((file) => path.resolve(file)))].sort(),
    excluded: [...new Set([...excluded, ...excludedPaths])]
  };
}

function scanFile(root, file) {
  const rel = relativeTo(root, file);
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/);
  const findings = [];
  const allowedPayloadForms = [];

  lines.forEach((line, index) => {
    for (const allowed of allowedPayloadPatterns) {
      if (allowed.regex.test(line)) {
        allowedPayloadForms.push({
          artifact_path: rel,
          payload_form: allowed.key,
          line_or_offset: index + 1,
          classification: "allowed_preview_hash_summary"
        });
      }
    }
    for (const spec of patternSpecs) {
      if (!spec.regex.test(line)) continue;
      const classified = classifyFinding(rel, line, spec);
      findings.push({
        artifact_path: rel,
        finding_type: spec.finding_type,
        severity: spec.severity,
        status: classified.status,
        line_or_offset: index + 1,
        context_classification: classified.context_classification,
        action_required: classified.action_required
      });
    }
  });

  return { findings, allowedPayloadForms };
}

function countBy(items, predicate) {
  return items.filter(predicate).length;
}

function summarizeAllowedPayloads(items) {
  const byForm = {};
  for (const item of items) {
    byForm[item.payload_form] = (byForm[item.payload_form] || 0) + 1;
  }
  return {
    status: "pass",
    allowed_payload_forms_seen: byForm,
    total_allowed_payload_references: items.length,
    samples: items.slice(0, 50)
  };
}

function splitFindings(findings) {
  return {
    rawStorageFindings: findings.filter((finding) => finding.finding_type.includes("raw_") || finding.finding_type.includes("full_")),
    secretPatternFindings: findings.filter((finding) => /secret|api_key|bearer|authorization|credential|otel|langfuse/i.test(finding.finding_type))
  };
}

function buildBlockerUpdate(status) {
  const pass = status === "pass";
  return {
    blocker_id: "CVR-002",
    previous_status: "cross_suite_raw_storage_and_redaction_audit_not_complete",
    new_status: pass
      ? "cross_suite_storage_redaction_audit_completed"
      : "cross_suite_storage_redaction_audit_needs_review",
    still_blocks: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ],
    unblocks: pass ? [
      "cross_suite_raw_storage_audit_pass",
      "cross_suite_redaction_audit_pass"
    ] : [],
    does_not_unblock: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ]
  };
}

function buildClaimBoundary(status) {
  return {
    status,
    containment_verified_allowed: false,
    telemetry_connected_allowed: false,
    release_gated_allowed: false,
    production_ready_allowed: false,
    reason: "Cross-suite storage/redaction audit may satisfy one containment remaining criterion, but containment-verified remains blocked until dedicated containment verification and remaining criteria pass.",
    allowed_claims: status === "pass" ? [
      "cross-suite-storage-redaction-audit-executed",
      "raw-storage-audit-passed",
      "redaction-boundary-audit-passed",
      "secret-pattern-audit-passed"
    ] : [
      "cross-suite-storage-redaction-audit-executed"
    ],
    blocked_claims: [
      "containment-verified",
      "release-gated",
      "production-ready",
      "telemetry-connected"
    ]
  };
}

function buildMarkdown(report) {
  return `# Cross-suite Storage Redaction Audit Report

Status: ${report.status}

Stage: ${STAGE}

- Artifacts scanned: ${report.artifacts_scanned}
- Raw request storage violations: ${report.raw_request_storage_violations}
- Raw response storage violations: ${report.raw_response_storage_violations}
- Secret pattern violations: ${report.secret_pattern_violations}
- Auth header violations: ${report.auth_header_violations}
- Needs review findings: ${report.needs_review_findings}
- Allowed context findings: ${report.allowed_context_findings}
- Raw storage audit passed: ${report.raw_storage_audit_passed}
- Secret pattern audit passed: ${report.secret_pattern_audit_passed}
- Redaction boundary audit passed: ${report.redaction_boundary_audit_passed}
`;
}

export function runAudit(options = {}) {
  const root = options.root || resolveRoot();
  const evidenceDir = p(root, "evidence", "beta-cross-suite-storage-redaction-audit");
  const { files, excluded } = collectArtifacts(root);
  const artifactIndex = files.map((file) => {
    const stat = fs.statSync(file);
    return {
      artifact_path: relativeTo(root, file),
      bytes: stat.size,
      extension: path.extname(file) || null
    };
  });

  const allFindings = [];
  const allowedPayloadForms = [];
  for (const file of files) {
    const result = scanFile(root, file);
    allFindings.push(...result.findings);
    allowedPayloadForms.push(...result.allowedPayloadForms);
  }

  const rawRequestViolations = countBy(allFindings, (finding) => finding.status === "violation"
    && /raw_request|full_request|request_body_raw|raw_payload/.test(finding.finding_type));
  const rawResponseViolations = countBy(allFindings, (finding) => finding.status === "violation"
    && /raw_response|full_response|response_body_raw/.test(finding.finding_type));
  const authHeaderViolations = countBy(allFindings, (finding) => finding.status === "violation"
    && /authorization|bearer/.test(finding.finding_type));
  const secretPatternViolations = countBy(allFindings, (finding) => finding.status === "violation"
    && !/authorization|bearer/.test(finding.finding_type)
    && /secret|api_key|otel|langfuse|env_assignment/.test(finding.finding_type));
  const needsReview = countBy(allFindings, (finding) => finding.status === "needs_review");
  const allowedContexts = countBy(allFindings, (finding) => finding.status === "allowed_context");
  const pass = rawRequestViolations === 0
    && rawResponseViolations === 0
    && secretPatternViolations === 0
    && authHeaderViolations === 0
    && needsReview === 0;
  const status = pass ? "pass" : (needsReview > 0 ? "needs_review" : "fail");
  const report = {
    status,
    stage: STAGE,
    new_provider_execution: false,
    new_redteam_execution: false,
    containment_fixture_rerun: false,
    local_model_execution: false,
    telemetry_connection: false,
    dist_modified: false,
    artifacts_scanned: artifactIndex.length,
    artifacts_excluded: excluded,
    raw_request_storage_violations: rawRequestViolations,
    raw_response_storage_violations: rawResponseViolations,
    secret_pattern_violations: secretPatternViolations,
    auth_header_violations: authHeaderViolations,
    needs_review_findings: needsReview,
    allowed_context_findings: allowedContexts,
    redaction_boundary_audit_passed: pass,
    raw_storage_audit_passed: rawRequestViolations === 0 && rawResponseViolations === 0 && needsReview === 0,
    secret_pattern_audit_passed: secretPatternViolations === 0 && authHeaderViolations === 0 && needsReview === 0,
    claims_allowed: status === "pass" ? allowedClaimsOnPass : allowedClaimsOnReview,
    claims_not_allowed: blockedClaims,
    failures: allFindings.filter((finding) => finding.status === "violation" || finding.status === "needs_review").slice(0, 200)
  };
  const { rawStorageFindings, secretPatternFindings } = splitFindings(allFindings);
  const redactionBoundaryAudit = {
    status,
    redaction_boundary_audit_passed: report.redaction_boundary_audit_passed,
    raw_storage_audit_passed: report.raw_storage_audit_passed,
    secret_pattern_audit_passed: report.secret_pattern_audit_passed,
    findings_total: allFindings.length,
    violation_count: countBy(allFindings, (finding) => finding.status === "violation"),
    needs_review_findings: needsReview,
    containment_verified_allowed: false,
    telemetry_connected_allowed: false,
    release_gated_allowed: false,
    production_ready_allowed: false
  };
  const blockerUpdate = buildBlockerUpdate(status);
  const claimBoundary = buildClaimBoundary(status);
  const unresolved = status === "pass" ? [] : [
    {
      id: "CSRA-001",
      severity: status === "needs_review" ? "medium" : "high",
      description: "Cross-suite storage/redaction audit found violations or findings needing review.",
      owner: "agent",
      recommended_next_action: "Review raw_storage_findings.json and secret_pattern_findings.json, redact or classify findings, then rerun check_cross_suite_storage_redaction_audit.mjs."
    }
  ];
  const allowedPayloadReport = summarizeAllowedPayloads(allowedPayloadForms);
  const findingReport = {
    status,
    findings_total: allFindings.length,
    violation_count: countBy(allFindings, (finding) => finding.status === "violation"),
    needs_review_findings: needsReview,
    allowed_context_findings: allowedContexts,
    findings_by_status: {
      allowed_context: allowedContexts,
      needs_review: needsReview,
      violation: countBy(allFindings, (finding) => finding.status === "violation")
    }
  };

  if (options.write !== false) {
    writeJson(p(evidenceDir, "storage_redaction_audit_report.json"), report);
    writeText(p(evidenceDir, "storage_redaction_audit_report.md"), buildMarkdown(report));
    writeJson(p(evidenceDir, "scanned_artifact_index.json"), {
      status: "recorded",
      artifacts_scanned: artifactIndex.length,
      artifacts: artifactIndex,
      artifacts_excluded: excluded
    });
    writeJson(p(evidenceDir, "raw_storage_findings.json"), {
      status,
      findings_total: rawStorageFindings.length,
      findings: rawStorageFindings
    });
    writeJson(p(evidenceDir, "secret_pattern_findings.json"), {
      status,
      findings_total: secretPatternFindings.length,
      findings: secretPatternFindings
    });
    writeJson(p(evidenceDir, "allowed_preview_hash_summary_report.json"), allowedPayloadReport);
    writeJson(p(evidenceDir, "redaction_boundary_audit.json"), redactionBoundaryAudit);
    writeJson(p(evidenceDir, "storage_redaction_claim_boundary.json"), claimBoundary);
    writeJson(p(evidenceDir, "storage_redaction_blocker_update.json"), blockerUpdate);
    writeJson(p(evidenceDir, "unresolved_items.json"), unresolved);
    writeJson(p(root, "evals", "reports", "cross_suite_storage_redaction_audit_report.json"), report);
    writeText(p(root, "evals", "reports", "cross_suite_storage_redaction_audit_report.md"), buildMarkdown(report));
    writeJson(p(root, "evals", "reports", "storage_redaction_findings_report.json"), findingReport);
    writeText(p(root, "evals", "reports", "storage_redaction_findings_report.md"), `# Storage Redaction Findings Report

Status: ${status}

- Findings total: ${findingReport.findings_total}
- Violations: ${findingReport.violation_count}
- Needs review: ${findingReport.needs_review_findings}
- Allowed context: ${findingReport.allowed_context_findings}
`);
  }

  return {
    report,
    artifactIndex,
    rawStorageFindings,
    secretPatternFindings,
    allowedPayloadReport,
    redactionBoundaryAudit,
    blockerUpdate,
    claimBoundary,
    unresolved,
    findingReport
  };
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = runAudit({ root: resolveRoot(), write: true });
  console.log(JSON.stringify(result.report, null, 2));
  process.exitCode = result.report.status === "pass" ? 0 : result.report.status === "needs_review" ? 2 : 1;
}

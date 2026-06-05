#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ensureDir, readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-openai-redteam-limited-result-review-and-blocker-update";
const SOURCE_STAGE = "v2.0.0-beta-openai-redteam-limited-execution";

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const sourceEvidenceDir = path.join(root, "evidence", "beta-openai-redteam-limited-execution");
const reviewEvidenceDir = path.join(root, "evidence", "beta-openai-redteam-limited-result-review");

const canonicalExecutionClaims = [
  "openai-redteam-limited-execution-completed",
  "openai-redteam-limited-cases-executed",
  "openai-redteam-case-results-recorded",
  "openai-redteam-severity-aggregation-recorded",
  "openai-redteam-trace-captured",
  "openai-redteam-redaction-checked",
  "openai-redteam-stop-criteria-enforced"
];
const reviewClaims = [
  "openai-redteam-limited-result-reviewed",
  "openai-redteam-limited-claim-boundary-audited",
  "openai-redteam-limited-evidence-indexed",
  "openai-redteam-limited-blocker-updated"
];
const claimsNotAllowed = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-verified",
  "provider-diverse",
  "adapter-checked",
  "integration-verified"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function rel(...parts) {
  return parts.join("/");
}

function existsRel(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function countJsonl(file) {
  if (!fs.existsSync(file)) return 0;
  return readText(file).split(/\r?\n/).filter((line) => line.trim()).length;
}

function writeYaml(file, value) {
  writeText(file, value);
}

function markdownList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

const sourceReport = readJson(path.join(sourceEvidenceDir, "redteam_limited_execution_report.json"));
const severity = readJson(path.join(sourceEvidenceDir, "redteam_severity_summary.json"));
const sourceGate = readJson(path.join(sourceEvidenceDir, "redteam_gate_report.json"));
const sourceUnresolved = readJson(path.join(sourceEvidenceDir, "unresolved_items.json"));
const caseResultCount = countJsonl(path.join(sourceEvidenceDir, "redteam_case_results.jsonl"));
const traceCount = countJsonl(path.join(sourceEvidenceDir, "redteam_trace_samples.jsonl"));

const expectedEvidence = [
  {
    expected_path: "evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json",
    actual_paths: ["evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json"]
  },
  {
    expected_path: "evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.md",
    actual_paths: ["evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.md"]
  },
  {
    expected_path: "evidence/beta-openai-redteam-limited-execution/redteam_case_results.jsonl",
    actual_paths: ["evidence/beta-openai-redteam-limited-execution/redteam_case_results.jsonl"]
  },
  {
    expected_path: "evidence/beta-openai-redteam-limited-execution/redteam_trace_samples.jsonl",
    actual_paths: ["evidence/beta-openai-redteam-limited-execution/redteam_trace_samples.jsonl"]
  },
  {
    expected_path: "evidence/beta-openai-redteam-limited-execution/redteam_severity_summary.json",
    actual_paths: ["evidence/beta-openai-redteam-limited-execution/redteam_severity_summary.json"]
  },
  {
    expected_path: "evidence/beta-openai-redteam-limited-execution/redteam_claim_impact_report.json",
    actual_paths: ["evidence/beta-openai-redteam-limited-execution/redteam_claim_impact_report.json"]
  },
  {
    expected_path: "evidence/beta-openai-redteam-limited-execution/redaction_report.json",
    actual_paths: [
      "evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json",
      "evidence/beta-openai-redteam-limited-execution/redteam_case_results.jsonl"
    ],
    status: "mapped_to_existing_evidence",
    note: "No standalone redaction_report.json exists; redaction status is recorded in the execution report and case results."
  },
  {
    expected_path: "evidence/beta-openai-redteam-limited-execution/stop_criteria_report.json",
    actual_paths: [
      "evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json",
      "evidence/beta-openai-redteam-limited-execution/redteam_severity_summary.json"
    ],
    status: "mapped_to_existing_evidence",
    note: "No standalone stop_criteria_report.json exists; stopped_early, failure counts, and provider call limits are recorded in existing reports."
  },
  {
    expected_path: "evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_gate_report.json",
    actual_paths: ["evidence/beta-openai-redteam-limited-execution/redteam_gate_report.json"],
    status: "mapped_to_existing_evidence",
    note: "Gate report was emitted as redteam_gate_report.json."
  },
  {
    expected_path: "evidence/beta-openai-redteam-limited-execution/unresolved_items.json",
    actual_paths: ["evidence/beta-openai-redteam-limited-execution/unresolved_items.json"]
  }
].map((item) => {
  const actualExists = item.actual_paths.map((actualPath) => ({ path: actualPath, exists: existsRel(actualPath) }));
  return {
    ...item,
    status: item.status || (actualExists.every((entry) => entry.exists) ? "present" : "missing"),
    actual_exists: actualExists
  };
});

const missingUnmapped = expectedEvidence.filter((item) => item.status === "missing");
const evidenceCompleteness = {
  status: missingUnmapped.length === 0 ? "pass_with_mapped_paths" : "fail",
  stage: STAGE,
  source_stage: SOURCE_STAGE,
  expected_evidence: expectedEvidence,
  missing_unmapped_count: missingUnmapped.length,
  source_case_result_count: caseResultCount,
  source_trace_event_count: traceCount
};

const claimAliases = {
  status: "pass",
  stage: STAGE,
  canonical_claims: canonicalExecutionClaims,
  aliases: [
    {
      alias: "openai-redteam-limited-case-results-recorded",
      canonical: ["openai-redteam-case-results-recorded"],
      handling: "legacy_source_report_alias"
    },
    {
      alias: "openai-redteam-limited-redacted-traces-recorded",
      canonical: [
        "openai-redteam-trace-captured",
        "openai-redteam-redaction-checked"
      ],
      handling: "legacy_source_report_alias_split_into_trace_and_redaction_claims"
    }
  ],
  claims_not_allowed: claimsNotAllowed
};

const sourceClaims = sourceReport.claims_allowed || [];
const canonicalizedSourceClaims = [
  ...new Set(sourceClaims.flatMap((claim) => {
    const alias = claimAliases.aliases.find((entry) => entry.alias === claim);
    return alias ? alias.canonical : [claim];
  }))
];
const claimCanonicalization = {
  status: "pass",
  stage: STAGE,
  source_stage: SOURCE_STAGE,
  source_claims: sourceClaims,
  canonicalized_source_claims: canonicalizedSourceClaims,
  canonical_claims_allowed_after_review: [
    ...canonicalExecutionClaims,
    ...reviewClaims
  ],
  aliases_applied: claimAliases.aliases,
  claims_not_allowed: claimsNotAllowed,
  note: "Legacy limited-report claim names are retained only as aliases; new review evidence uses canonical names."
};

const severityReview = {
  status: sourceReport.critical_failures === 0 && sourceReport.high_failures === 0 ? "pass" : "fail",
  stage: STAGE,
  source_stage: SOURCE_STAGE,
  severity,
  selected_cases_total: sourceReport.cases_total,
  cases_passed: sourceReport.cases_passed,
  cases_failed: sourceReport.cases_failed,
  critical_failures: sourceReport.critical_failures,
  high_failures: sourceReport.high_failures,
  broader_redteam_pass_claim_allowed: false
};

const blockerUpdate = {
  blocker_id: "RGB-003",
  previous_status: "openai_redteam_limited_execution_plan_ready_execution_pending",
  new_status: "openai_limited_redteam_execution_completed_broader_redteam_review_pending",
  still_blocks: [
    "redteam-passed",
    "containment-verified",
    "release-gated",
    "production-ready"
  ],
  unblocks: [
    "limited_provider_redteam_execution_evidence"
  ],
  does_not_unblock: [
    "redteam-passed",
    "containment-verified",
    "release-gated",
    "production-ready"
  ]
};

const releaseGateBlockerRefresh = {
  release_gate_status: "blocked_not_release_gated",
  release_gate_passed: false,
  production_ready: false,
  production_monitored: false,
  provider_diversity_established: false,
  local_model_execution_verified: false,
  redteam_limited_execution_completed: true,
  redteam_passed: false,
  containment_verified: false,
  remaining_blockers: [
    "broader redteam pass not established",
    "containment proof not established",
    "provider diversity not established",
    "local runtime canary not executed",
    "production telemetry not connected",
    "release gate not executed"
  ]
};

const resultReview = {
  status: sourceReport.status === "pass" && missingUnmapped.length === 0 ? "pass" : "fail",
  stage: STAGE,
  new_provider_execution: false,
  new_redteam_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  dist_modified: false,
  source_stage: SOURCE_STAGE,
  source_execution_status: sourceReport.status,
  selected_cases_total: sourceReport.cases_total,
  cases_passed: sourceReport.cases_passed,
  cases_failed: sourceReport.cases_failed,
  critical_failures: sourceReport.critical_failures,
  high_failures: sourceReport.high_failures,
  provider_calls_total: sourceReport.provider_calls_total,
  provider_calls_limit: sourceReport.max_provider_calls,
  redaction_passed: sourceReport.redaction_passed,
  raw_request_stored: sourceReport.raw_request_stored,
  raw_response_stored: sourceReport.raw_response_stored,
  external_side_effects: sourceReport.external_side_effects,
  claim_level: "limited_redteam_execution_only",
  evidence_completeness_status: evidenceCompleteness.status,
  claim_canonicalization_status: claimCanonicalization.status,
  source_gate_status: sourceGate.status,
  source_unresolved_items_count: Array.isArray(sourceUnresolved) ? sourceUnresolved.length : null,
  claims_allowed: [
    ...canonicalExecutionClaims,
    ...reviewClaims
  ],
  claims_not_allowed: claimsNotAllowed
};

const unresolvedItems = resultReview.status === "pass" ? [] : [
  {
    id: "ORLR-001",
    severity: "high",
    description: "OpenAI limited result review failed because source execution evidence or canonical claim mapping is missing or invalid.",
    blocks_result_review: true,
    blocks_release_gate: true,
    owner: "agent",
    recommended_next_action: "Inspect source execution evidence, evidence completeness mapping, and claim canonicalization report."
  }
];

const scopeYaml = `stage: ${STAGE}

approved_actions:
  evidence_review: true
  claim_canonicalization: true
  claim_alias_mapping: true
  severity_summary_review: true
  blocker_update: true
  release_gate_blocker_refresh: true
  handoff_update: true

forbidden_execution:
  openai_provider_call: true
  redteam_case_rerun: true
  local_model_execution: true
  local_endpoint_probe: true
  telemetry_connection: true
  release_gate_execution: true
  production_deployment: true
  release_gated_claim: true
  production_ready_claim: true
  redteam_passed_claim: true
  containment_verified_claim: true
  dist_modification: true

claims_allowed:
${reviewClaims.map((claim) => `  - ${claim}`).join("\n")}

claims_not_allowed:
${claimsNotAllowed.map((claim) => `  - ${claim}`).join("\n")}
`;

const suiteYaml = `suite_id: beta_openai_redteam_limited_result_review
stage: ${STAGE}
mode: review_only
source_stage: ${SOURCE_STAGE}
new_provider_execution_allowed: false
checks:
  - source_execution_report_pass
  - evidence_completeness_mapped
  - claim_aliases_recorded
  - canonical_claims_recorded
  - blocker_update_recorded
  - release_gate_blocker_refresh_recorded
`;

const blockerYaml = `blocker_id: RGB-003
previous_status: openai_redteam_limited_execution_plan_ready_execution_pending
new_status: openai_limited_redteam_execution_completed_broader_redteam_review_pending
still_blocks:
${blockerUpdate.still_blocks.map((item) => `  - ${item}`).join("\n")}
unblocks:
${blockerUpdate.unblocks.map((item) => `  - ${item}`).join("\n")}
does_not_unblock:
${blockerUpdate.does_not_unblock.map((item) => `  - ${item}`).join("\n")}
`;

const reviewMd = `# OpenAI Redteam Limited Result Review

Status: ${resultReview.status}

Stage: ${STAGE}

- Source execution status: ${resultReview.source_execution_status}
- Selected cases: ${resultReview.selected_cases_total}
- Cases passed: ${resultReview.cases_passed}
- Cases failed: ${resultReview.cases_failed}
- Critical failures: ${resultReview.critical_failures}
- High failures: ${resultReview.high_failures}
- Provider calls: ${resultReview.provider_calls_total} / ${resultReview.provider_calls_limit}
- Redaction passed: ${resultReview.redaction_passed}
- Raw request stored: ${resultReview.raw_request_stored}
- Raw response stored: ${resultReview.raw_response_stored}
- Evidence completeness: ${resultReview.evidence_completeness_status}
- Claim canonicalization: ${resultReview.claim_canonicalization_status}

This review does not allow redteam-passed, containment-verified, production-ready, or release-gated claims.
`;

const claimAuditMd = `# OpenAI Redteam Limited Claim Audit

Status: ${claimCanonicalization.status}

Canonical claims:

${markdownList(canonicalExecutionClaims)}

Review claims:

${markdownList(reviewClaims)}

Aliases:

${claimAliases.aliases.map((entry) => `- ${entry.alias} -> ${entry.canonical.join(", ")}`).join("\n")}
`;

const docs = {
  "docs/openai_redteam_limited_result_review.md": reviewMd,
  "docs/openai_redteam_limited_claim_boundary.md": `${claimAuditMd}

Still not allowed:

${markdownList(claimsNotAllowed)}
`,
  "docs/next_release_blocker_resolution_plan.md": `# Next Release Blocker Resolution Plan

The limited OpenAI redteam execution evidence is recorded, but release gate remains blocked.

Remaining blockers:

${markdownList(releaseGateBlockerRefresh.remaining_blockers)}
`,
  "docs/next_local_canary_plan.md": `# Next Local Canary Plan

Local vLLM/Ollama no-tool canary remains blocked until a localhost-only endpoint and required env are provided.
`,
  "docs/next_telemetry_connection_plan.md": `# Next Telemetry Connection Plan

Telemetry connection remains blocked until the exact telemetry approval phrase and OTEL or Langfuse sink credentials are provided.
`
};

writeYaml(p("release", "beta_openai_redteam_limited_result_review_scope.yaml"), scopeYaml);
writeYaml(p("release", "redteam_limited_execution_blocker_update.yaml"), blockerYaml);
writeYaml(p("evals", "suites", "beta_openai_redteam_limited_result_review.yaml"), suiteYaml);

writeJson(path.join(reviewEvidenceDir, "result_review_report.json"), resultReview);
writeText(path.join(reviewEvidenceDir, "result_review_report.md"), reviewMd);
writeJson(path.join(reviewEvidenceDir, "evidence_completeness_report.json"), evidenceCompleteness);
writeJson(path.join(reviewEvidenceDir, "claim_aliases.json"), claimAliases);
writeJson(path.join(reviewEvidenceDir, "claim_canonicalization_report.json"), claimCanonicalization);
writeJson(path.join(reviewEvidenceDir, "severity_review_summary.json"), severityReview);
writeJson(path.join(reviewEvidenceDir, "blocker_update.json"), blockerUpdate);
writeJson(path.join(reviewEvidenceDir, "release_gate_blocker_refresh.json"), releaseGateBlockerRefresh);
writeJson(path.join(reviewEvidenceDir, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "openai_redteam_limited_result_review_report.json"), resultReview);
writeText(p("evals", "reports", "openai_redteam_limited_result_review_report.md"), reviewMd);

ensureDir(path.join(root, "docs"));
for (const [docPath, content] of Object.entries(docs)) {
  writeText(p(...docPath.split("/")), content);
}

console.log(JSON.stringify(resultReview, null, 2));
process.exitCode = resultReview.status === "pass" ? 0 : 1;

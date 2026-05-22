import fs from "node:fs";
import { relativeTo, toPosix, walkFiles } from "./file_walk.mjs";

export const prohibitedClaims = [
  "adapter-checked",
  "provider-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "local-no-tool-canary-executed",
  "vllm-no-tool-canary-executed",
  "ollama-no-tool-canary-executed",
  "local-model-verified",
  "telemetry-connected",
  "production-ready",
  "production-monitored",
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "replay-verified",
  "benchmark-backed",
  "provider-diverse",
  "integration-verified",
  "stable",
  "release-gated"
];

export const allowedPositiveClaims = [
  "harness-designed",
  "static-structure-created",
  "baseline-snapshotted",
  "adapter-skeleton-created",
  "alpha-static-validated",
  "dependency-static-validated",
  "adapter-dry-run-checked",
  "beta-preflight-prepared",
  "beta-mock-runtime-executed",
  "mock-tool-routing-checked",
  "approval-boundary-smoke-tested",
  "trace-schema-smoke-tested",
  "schema-contract-validated",
  "openai-provider-canary-executed",
  "provider-no-tool-path-checked",
  "provider-trace-captured",
  "provider-redaction-checked",
  "openai-structured-output-canary-executed",
  "provider-structured-output-path-checked",
  "json-schema-response-canary-validated",
  "structured-output-trace-captured",
  "structured-output-redaction-checked",
  "openai-tool-calling-canary-executed",
  "provider-tool-call-path-checked",
  "tool-argument-schema-canary-validated",
  "mock-tool-output-reinjection-checked",
  "tool-approval-boundary-canary-checked",
  "tool-output-reclassification-checked",
  "tool-calling-trace-captured",
  "tool-calling-redaction-checked",
  "canary-matrix-summarized",
  "local-readiness-documented",
  "local-endpoint-blocker-recorded",
  "openai-tool-calling-canary-rerun-executed",
  "tool-calling-canary-consistency-checked",
  "tool-calling-rerun-trace-captured",
  "replay-evidence-recorded",
  "openai-canary-replay-suite-executed",
  "openai-no-tool-canary-rerun-executed",
  "openai-structured-output-canary-rerun-executed",
  "openai-canary-suite-consistency-checked",
  "canary-suite-replay-evidence-recorded",
  "canary-suite-trace-comparison-recorded",
  "beta-release-evidence-bundle-drafted",
  "evidence-lineage-indexed",
  "claim-boundary-audited",
  "release-readiness-draft-assessed",
  "blocker-register-updated",
  "release-gate-thresholds-drafted",
  "release-gate-dry-run-executed",
  "release-blockers-prioritized",
  "owner-action-matrix-drafted",
  "rollback-plan-drafted",
  "release-decision-record-drafted",
  "redteam-suite-designed",
  "redteam-fixtures-authored",
  "redteam-taxonomy-mapped",
  "redteam-severity-rubric-drafted",
  "redteam-execution-gate-designed",
  "redteam-blocker-updated",
  "redteam-mock-dry-run-executed",
  "redteam-fixture-execution-path-checked",
  "redteam-result-schema-validated",
  "redteam-severity-aggregation-checked",
  "mock-redteam-trace-captured",
  "mock-redteam-gate-checked",
  "openai-redteam-limited-execution-plan-drafted",
  "openai-redteam-case-subset-selected",
  "openai-redteam-execution-guard-designed",
  "openai-redteam-cost-bound-drafted",
  "openai-redteam-stop-criteria-drafted",
  "openai-redteam-redaction-policy-drafted",
  "openai-redteam-trace-policy-drafted",
  "openai-redteam-limited-execution-preflight-completed",
  "openai-redteam-approval-packet-generated",
  "openai-redteam-credential-readiness-checked",
  "openai-redteam-command-plan-drafted",
  "openai-redteam-execution-preconditions-validated",
  "openai-redteam-limited-execution-completed",
  "openai-redteam-limited-cases-executed",
  "openai-redteam-case-results-recorded",
  "openai-redteam-severity-aggregation-recorded",
  "openai-redteam-trace-captured",
  "openai-redteam-redaction-checked",
  "openai-redteam-stop-criteria-enforced",
  "openai-redteam-limited-case-results-recorded",
  "openai-redteam-limited-redacted-traces-recorded",
  "openai-redteam-limited-result-reviewed",
  "openai-redteam-limited-claim-boundary-audited",
  "openai-redteam-limited-evidence-indexed",
  "openai-redteam-limited-blocker-updated",
  "broader-redteam-pass-gate-designed",
  "redteam-coverage-matrix-drafted",
  "redteam-gap-analysis-recorded",
  "redteam-pass-thresholds-drafted",
  "redteam-pass-claim-boundary-audited",
  "redteam-remaining-execution-lanes-indexed",
  "skipped-redteam-cases-reviewed",
  "redteam-case-lanes-classified",
  "redteam-case-dispositions-recorded",
  "redteam-skipped-case-gap-refined",
  "redteam-future-execution-lanes-drafted",
  "redteam-skipped-case-blocker-updated",
  "additional-openai-redteam-preflight-completed",
  "additional-openai-redteam-case-subset-selected",
  "additional-openai-redteam-approval-packet-generated",
  "additional-openai-redteam-command-plan-drafted",
  "additional-openai-redteam-execution-preconditions-validated",
  "additional-openai-redteam-blocker-updated",
  "additional-openai-redteam-execution-completed",
  "additional-openai-redteam-cases-executed",
  "additional-openai-redteam-case-results-recorded",
  "additional-openai-redteam-redacted-traces-recorded",
  "containment-boundary-verification-designed",
  "containment-boundary-taxonomy-drafted",
  "containment-fixtures-authored",
  "containment-coverage-matrix-drafted",
  "containment-claim-boundary-audited",
  "containment-verification-gate-designed",
  "containment-blocker-updated",
  "containment-boundary-mock-dry-run-executed",
  "containment-fixture-execution-path-checked",
  "containment-result-schema-validated",
  "containment-trace-schema-validated",
  "containment-no-side-effect-boundary-checked",
  "containment-severity-aggregation-recorded",
  "containment-mock-gate-checked",
  "containment-verification-gate-refined",
  "containment-evidence-mapped",
  "containment-proof-levels-classified",
  "containment-remaining-criteria-recorded",
  "containment-release-blocker-refreshed",
  "containment-claim-boundary-audited",
  "cross-suite-storage-redaction-audit-executed",
  "raw-storage-audit-passed",
  "redaction-boundary-audit-passed",
  "secret-pattern-audit-passed",
  "allowed-preview-hash-summary-classified",
  "storage-redaction-blocker-updated",
  "dedicated-containment-verification-plan-drafted",
  "dedicated-containment-runner-contract-drafted",
  "dedicated-containment-acceptance-criteria-drafted",
  "containment-risk-acceptance-policy-drafted",
  "containment-dedicated-verification-gate-designed",
  "containment-dedicated-verification-blocker-updated",
  "dedicated-containment-verification-executed",
  "dedicated-containment-case-results-recorded",
  "dedicated-containment-redacted-traces-recorded",
  "dedicated-containment-no-side-effect-evidence-recorded",
  "dedicated-containment-boundary-results-recorded",
  "dedicated-containment-execution-gate-checked",
  "dedicated-containment-boundaries-checked",
  "dedicated-containment-no-side-effect-verified",
  "dedicated-containment-result-schema-validated",
  "dedicated-containment-trace-schema-validated",
  "dedicated-containment-severity-aggregation-recorded",
  "dedicated-containment-contract-guard-checked",
  "containment-post-execution-audit-completed",
  "containment-evidence-completeness-audited",
  "containment-claim-boundary-post-audited",
  "containment-owner-review-drafted",
  "containment-claim-decision-drafted",
  "containment-post-execution-blocker-updated",
  "containment-verified-decision-gate-executed",
  "containment-evidence-sufficiency-audited",
  "containment-owner-final-decision-recorded",
  "containment-verified-claim-boundary-audited",
  "containment-release-blocker-updated",
  "release-blockers-reevaluated",
  "p0-p1-blockers-refreshed",
  "rc1-readiness-assessed",
  "release-path-decision-matrix-drafted",
  "release-claim-boundary-after-containment-audited",
  "owner-action-matrix-refreshed",
  "rc1-openai-scope-evidence-bundle-drafted",
  "rc1-evidence-lineage-indexed",
  "rc1-claim-boundary-audited",
  "rc1-blocker-snapshot-recorded",
  "rc1-release-readiness-assessed",
  "rc1-openai-only-scope-declared",
  "rc1-system-of-record-snapshot-recorded",
  "rc1-release-gate-dry-run-executed",
  "rc1-openai-scope-gate-evaluated",
  "rc1-local-endpoint-deferred-recorded",
  "rc1-provider-diversity-deferred-recorded",
  "rc1-release-decision-draft-recorded",
  "rc1-release-gate-actual-preconditions-drafted",
  "rc1-release-gate-actual-preflight-completed",
  "rc1-release-gate-approval-packet-generated",
  "rc1-release-gate-command-plan-drafted",
  "rc1-rollback-readiness-checked",
  "rc1-owner-action-readiness-checked",
  "rc1-local-endpoint-deferral-confirmed",
  "rc1-provider-diversity-deferral-confirmed",
  "rc1-release-gate-actual-executed",
  "rc1-openai-scope-release-gate-passed",
  "rc1-openai-scope-release-decision-recorded",
  "rc1-openai-scope-release-gated",
  "rc1-local-endpoint-deferral-maintained",
  "rc1-provider-diversity-deferral-maintained",
  "rc1-openai-scope-release-gate-actual-passed",
  "rc1-release-approval-recorded",
  "rc1-release-decision-recorded",
  "rc1-actual-gate-claim-boundary-recorded",
  "containment-verified",
  "agents-md-root-entrypoint-added",
  "system-of-record-aligned",
  "asset-classes-manifested",
  "directory-roles-documented",
  "naming-conventions-documented",
  "agent-workflow-documented",
  "production-telemetry-design-drafted",
  "otel-genai-mapping-drafted",
  "langfuse-integration-plan-drafted",
  "telemetry-dashboard-spec-drafted",
  "telemetry-anomaly-thresholds-drafted",
  "telemetry-claim-gate-designed",
  "telemetry-blocker-updated",
  "production-telemetry-connection-preflight-completed",
  "telemetry-approval-packet-generated",
  "telemetry-credential-readiness-checked",
  "telemetry-payload-shape-validated",
  "telemetry-exporter-guard-checked",
  "telemetry-connection-command-plan-drafted",
  "telemetry-connection-blocker-updated",
  "execution-readiness-dashboard-drafted",
  "blocker-resolution-plan-drafted",
  "approval-requirements-indexed",
  "environment-requirements-indexed",
  "command-plans-indexed",
  "claim-impact-matrix-drafted",
  "path-portability-audited"
];

const allowedContextPattern = /(not|never|blocked|blocks|prohibited|forbidden|deferred|later|without|must not|does not|is not|are not|not_allowed|claim_not_allowed|claims_not_allowed|forbidden_claims|blocked_claims|claims_blocked|prohibited_claim|prohibited_positive_claim|blocked_claims_found_as_positive|conditional_future_claims|claim_still_not_allowed|checklist|enum|fixture|policy|rule|does_not_allow|does_not_unblock|does_not_unlock|still_blocks|still_not_allowed|blocked|still_blocked|disallow|absent|can enter|why_not_stable|not_stable_notice|local_endpoint_deferred|AGENTS\\.md blocked claim list|current claim status|금지|차단|조건|정의|보류|미허용|불가)/i;

export function isPositiveClaim(line, claim) {
  if (!line.includes(claim)) return false;
  if (allowedContextPattern.test(line)) return false;

  const escaped = claim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fieldPattern = new RegExp(`^(status|claim|claim_strength|final_claim_strength|release_status|summary_claim)\\s*[:=]\\s*["']?${escaped}["']?\\s*$`, "i");
  const achievementPattern = new RegExp(`\\b(is|are|was|were|as|now)\\s+["']?${escaped}["']?\\b`, "i");
  const achievedPattern = new RegExp(`\\b${escaped}\\s+(status|claim|evidence|state|ready|passed)\\b`, "i");

  return fieldPattern.test(line) || achievementPattern.test(line) || achievedPattern.test(line);
}

function isConditionallyAllowedPositiveClaim(root, claim) {
  if (claim !== "containment-verified") return false;
  try {
    const decisionPath = `${root}/evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json`;
    const decision = JSON.parse(fs.readFileSync(decisionPath, "utf8").replace(/^\uFEFF/, ""));
    return decision.status === "containment_verified_decision_approved"
      && decision.owner_final_decision_present === true
      && decision.owner_final_decision === "approve_containment_verified"
      && decision.containment_verified_allowed === true
      && decision.release_gated_allowed === false
      && decision.production_ready_allowed === false;
  } catch {
    return false;
  }
}

export function scanClaims(root, options = {}) {
  const excludedPaths = options.excludedPaths || [
    "evidence/v36-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ];
  const files = walkFiles(root, {
    excludedPaths,
    extensions: [".md", ".json", ".jsonl", ".yaml", ".yml", ".mjs", ".js", ".txt"]
  });
  const matches = [];
  const allowed_mentions = [];

  for (const file of files) {
    const rel = toPosix(relativeTo(root, file));
    const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const context = lines[i].trim();
      for (const claim of prohibitedClaims) {
        if (!context.includes(claim)) continue;
        if (isPositiveClaim(context, claim)) {
          if (isConditionallyAllowedPositiveClaim(root, claim)) {
            allowed_mentions.push({
              file: rel,
              claim,
              line: i + 1,
              context,
              reason: "conditionally_allowed_after_owner_decision"
            });
          } else {
            matches.push({ file: rel, claim, line: i + 1, context });
          }
        } else {
          allowed_mentions.push({
            file: rel,
            claim,
            line: i + 1,
            context,
            reason: allowedContextPattern.test(context) ? "allowed_context" : "non_positive_reference"
          });
        }
      }
    }
  }

  return {
    status: matches.length === 0 ? "pass" : "fail",
    scanned_files: files.length,
    excluded_paths: excludedPaths,
    allowed_positive_claims: allowedPositiveClaims,
    allowed_mentions,
    matches
  };
}

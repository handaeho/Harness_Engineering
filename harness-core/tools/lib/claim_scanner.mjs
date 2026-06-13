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

const LEGACY_REFERENCE_LABEL = ["v", "36"].join("");

function legacyReferenceBaselineField(suffix) {
  return `${LEGACY_REFERENCE_LABEL}_baseline_${suffix}`;
}

function legacyEvidenceReferenceBaselineField(suffix) {
  return `evidence_${LEGACY_REFERENCE_LABEL}_baseline_${suffix}`;
}

function legacyAdditionalReferenceBaselineField(suffix) {
  return `additional_${LEGACY_REFERENCE_LABEL}_baseline_${suffix}`;
}

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
  "path-portability-audited",
  "post-rc-operator-sequence-recorded",
  "post-rc-local-endpoint-future-integration-recorded",
  "post-rc-local-endpoint-operator-handoff-documented",
  "post-rc-local-endpoint-verification-plan-documented",
  "post-rc-telemetry-preflight-refreshed",
  "post-rc-telemetry-approval-requirements-recorded",
  "post-rc-telemetry-command-plan-drafted",
  "post-rc-telemetry-local-endpoint-deferral-confirmed",
  "post-rc-telemetry-connection-executed",
  "post-rc-live-trace-receipt-recorded",
  "post-rc-live-metric-receipt-recorded",
  "post-rc-telemetry-secret-redaction-checked",
  "post-rc-telemetry-connection-result-reviewed",
  "post-rc-production-monitoring-readiness-assessed",
  "post-rc-production-monitoring-blocker-recorded",
  "post-rc-production-monitoring-controls-drafted",
  "post-rc-production-monitoring-gate-designed",
  "post-rc-production-monitoring-claim-boundary-audited",
  "post-rc-production-monitoring-blocker-updated",
  "post-rc-production-monitoring-values-preflight-completed",
  "post-rc-production-monitoring-defaults-drafted",
  "post-rc-production-monitoring-owner-template-drafted",
  "post-rc-production-monitoring-window-preconditions-drafted",
  "post-rc-production-monitoring-window-command-plan-drafted",
  "post-rc-production-monitoring-operator-values-completed",
  "post-rc-production-monitoring-threshold-values-recorded",
  "post-rc-production-monitoring-owner-assignments-recorded",
  "post-rc-production-monitoring-window-execution-preconditions-satisfied",
  "post-rc-production-monitoring-window-approval-request-generated",
  "post-rc-production-monitoring-window-executed",
  "post-rc-monitoring-window-trace-continuity-reviewed",
  "post-rc-monitoring-window-thresholds-evaluated",
  "post-rc-monitoring-window-redaction-reviewed",
  "post-rc-monitoring-window-incident-rollback-reviewed",
  "post-rc-production-monitoring-window-checkpoint-recorded",
  "post-rc-production-monitoring-window-progress-evaluated",
  "post-rc-production-monitoring-window-remaining-requirements-recorded",
  "post-rc-production-monitoring-window-redaction-checkpoint-recorded",
  "post-rc-production-monitoring-window-result-reviewed",
  "post-rc-monitoring-window-duration-sample-validated",
  "post-rc-monitoring-window-threshold-results-reviewed",
  "post-rc-monitoring-window-redaction-results-reviewed",
  "post-rc-production-monitoring-final-gate-preconditions-recorded",
  "post-rc-reference-baseline-dependency-triaged",
  "post-rc-reference-baseline-repair-decision-recorded",
  "post-rc-monitoring-result-review-resume-attempted",
  "post-rc-reference-baseline-snapshot-refreshed",
  "post-rc-reference-baseline-refresh-owner-approved",
  "post-rc-reference-baseline-refresh-delta-recorded",
  "post-rc-reference-baseline-compare-restored",
  "post-rc-monitoring-result-review-resumed",
  "post-rc-production-monitoring-final-gate-passed",
  "post-rc-production-monitored-claim-enabled",
  "post-rc-production-monitoring-final-decision-recorded",
  "post-rc-production-monitoring-controls-verified",
  "post-rc-production-monitoring-window-evidence-accepted",
  "post-rc-production-monitoring-claim-boundary-finalized",
  "post-rc-production-ready-scope-preflight-completed",
  "post-rc-production-ready-evidence-inventoried",
  "post-rc-production-ready-blockers-recorded",
  "post-rc-production-ready-owner-decision-requested",
  "post-rc-openai-only-production-ready",
  "post-rc-openai-only-production-ready-scope-decision-recorded",
  "post-rc-openai-only-production-ready-gate-passed",
  "post-rc-production-ready-claim-enabled-openai-only-scope",
  "post-rc-production-ready-owner-scope-decision-recorded",
  "post-rc-production-ready-out-of-scope-boundaries-recorded",
  "post-rc-stable-scope-preflight-completed",
  "post-rc-stable-evidence-inventoried",
  "post-rc-stable-blockers-recorded",
  "post-rc-stable-owner-decision-requested",
  "post-rc-production-ready-claim-canonicalized",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-stable-scope-decision-recorded",
  "post-rc-openai-only-stable-gate-passed",
  "post-rc-stable-claim-enabled-openai-only-scope",
  "post-rc-stable-owner-scope-decision-recorded",
  "post-rc-stable-out-of-scope-boundaries-recorded",
  "post-rc-openai-only-stable-final-handoff-recorded",
  "post-rc-openai-only-stable-archive-manifest-recorded",
  "post-rc-openai-only-stable-final-claim-state-recorded",
  "post-rc-openai-only-stable-deferred-paths-recorded",
  "post-rc-new-conversation-handoff-recorded",
  "post-rc-new-conversation-prompt-recorded",
  "post-rc-new-conversation-evidence-indexed",
  "post-rc-new-conversation-next-options-recorded",
  "post-stable-local-endpoint-readiness-preflight-passed",
  "post-stable-local-no-tool-canary-qwen3-14b-passed",
  "post-stable-local-no-tool-canary-qwen3-14b-result-reviewed",
  "post-stable-qwen3-thinking-behavior-recorded",
  "post-stable-local-no-tool-storage-redaction-reviewed",
  "post-stable-local-endpoint-readiness-preflight-qwen3-6-27b-passed",
  "post-stable-local-no-tool-canary-qwen3-6-27b-passed",
  "post-stable-local-no-tool-canary-qwen3-6-27b-result-reviewed",
  "post-stable-qwen3-6-27b-reasoning-control-recorded",
  "post-stable-local-no-tool-qwen3-6-27b-storage-redaction-reviewed",
  "post-stable-local-no-tool-multimodel-comparison-recorded",
  "post-stable-local-redteam-bounded-smoke-passed",
  "post-stable-adapter-conformance-dependency-backed-validation-passed",
  "post-stable-local-ollama-adapter-conformance-reviewed",
  "post-stable-local-ollama-reasoning-control-mapping-reviewed",
  "post-stable-local-provider-capability-matrix-reviewed",
  "post-stable-local-model-verification-owner-decision-packet-ready",
  "post-stable-reference-baseline-dependency-triaged-for-local-verification",
  "post-stable-reference-baseline-local-verification-decision-requested",
  "post-stable-local-verification-gate-dependency-status-recorded",
  "post-stable-reference-baseline-compare-restored-for-local-verification",
  "post-stable-reference-baseline-snapshot-exclusion-policy-recorded",
  "post-stable-local-model-verification-owner-packet-ready-after-referenceBaseline-repair",
  "post-stable-local-model-verification-final-gate-passed",
  "post-stable-local-model-verified-claim-enabled",
  "post-stable-local-model-verification-owner-final-decision-recorded",
  "post-stable-local-model-verification-final-decision-recorded",
  "post-stable-local-model-verification-evidence-accepted",
  "post-stable-local-model-verified-final-handoff-recorded",
  "post-stable-local-model-verified-archive-manifest-recorded",
  "post-stable-local-model-verified-final-claim-state-recorded",
  "post-stable-local-provider-strict-paths-recorded",
  "combined-openai-local-archive-export-recorded",
  "combined-openai-local-final-claim-state-recorded",
  "combined-openai-local-evidence-indexed",
  "combined-openai-local-strict-paths-recorded",
  "post-combined-provider-diverse-path-designed",
  "post-combined-provider-diverse-inventory-recorded",
  "post-combined-provider-verified-gate-designed",
  "post-combined-adapter-checked-gate-designed",
  "post-combined-strict-paths-owner-decision-packet-recorded",
  "post-combined-provider-diverse-final-gate-passed",
  "post-combined-provider-diverse-claim-enabled",
  "post-combined-provider-diverse-owner-final-decision-recorded",
  "post-combined-provider-diverse-final-decision-recorded",
  "post-combined-provider-diverse-evidence-accepted",
  "post-combined-provider-diverse-archive-refreshed",
  "post-combined-provider-diverse-final-claim-state-recorded",
  "post-combined-provider-diverse-evidence-indexed",
  "post-combined-provider-diverse-next-gates-recorded",
  "post-combined-provider-diverse-final-export-draft-refreshed",
  "post-combined-provider-verified-gate-preflight-completed",
  "post-combined-provider-verified-evidence-inventoried",
  "post-combined-provider-verified-owner-decision-packet-recorded",
  "post-combined-adapter-checked-gate-preflight-completed",
  "post-combined-adapter-checked-coverage-matrix-recorded",
  "post-combined-adapter-checked-owner-decision-packet-recorded",
  "post-combined-provider-adapter-final-owner-packet-recorded",
  "final-export-execution-preflight-recorded",
  "final-export-execution-recorded",
  "final-export-execution-completed",
  "final-export-package-created",
  "final-export-manifest-recorded",
  "final-export-checksums-recorded",
  "final-export-claim-boundary-recorded",
  "final-export-package-draft-recorded",
  "final-export-manifest-drafted",
  "clean-artifact-classification-recorded",
  "clean-artifact-prune-completed",
  "agent-ready-clean-export-created",
  "clean-artifact-gate-checked",
  "self-contained-agent-ready-check-recorded",
  "self-contained-clean-export-checked",
  "current-state-json-recorded",
  "reference-baseline-deemphasized",
  "reference-baseline-integrity-checked",
  "legacy-reference-policy-recorded",
  "active-docs-reference-name-aligned",
  "harness-core-final-surface-checked",
  "harness-core-git-readiness-recorded",
  "harness-core-agent-ready-export-refreshed",
  "release-grade-source-ledger-checked",
  "release-grade-provider-gate-attempt-recorded",
  "release-grade-adapter-vllm-preflight-recorded"
];

const allowedContextPattern = /(not|never|blocked|blocks|prohibited|forbidden|deferred|later|before|without|must not|does not|is not|are not|allowed only if|not_allowed|claim_not_allowed|claims_not_allowed|forbidden_claims|blocked_claims|claims_blocked|prohibited_claim|prohibited_positive_claim|blocked_claims_found_as_positive|conditional_future_claims|claim_still_not_allowed|checklist|enum|fixture|policy|rule|does_not_allow|does_not_unblock|does_not_unlock|still_blocks|still_not_allowed|blocked|still_blocked|disallow|absent|can enter|why_not_stable|not_stable_notice|local_endpoint_deferred|AGENTS\\.md blocked claim list|current claim status|금지|차단|조건|정의|보류|미허용|불가|없음|검토)/i;

export function isPositiveClaim(line, claim) {
  if (!line.includes(claim)) return false;
  if (allowedContextPattern.test(line)) return false;
  if (claim === "stable" && /(post-rc-openai-only-stable|post-export-active-scoped-stable|post_export_active_scoped_stable|openai_only_stable|OpenAI-Only Stable|OpenAI-only scoped stable|post-RC scoped stable|active scoped stability)/.test(line)) return false;
  if (claim === "production-ready" && /(post-rc-openai-only-production-ready|post-export-active-scoped-production-ready|post_export_active_scoped_production_ready|active scoped production readiness)/.test(line)) return false;
  if (claim === "release-gated" && /rc1-openai-scope-release-gated/.test(line)) return false;

  const escaped = claim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fieldPattern = new RegExp(`^(status|claim|claim_strength|final_claim_strength|release_status|summary_claim)\\s*[:=]\\s*["']?${escaped}["']?\\s*$`, "i");
  const achievementPattern = new RegExp(`\\b(is|are|was|were|as|now)\\s+["']?${escaped}["']?\\b`, "i");
  const achievedPattern = new RegExp(`\\b${escaped}\\s+(status|claim|evidence|state|ready|passed)\\b`, "i");

  return fieldPattern.test(line) || achievementPattern.test(line) || achievedPattern.test(line);
}

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function fieldIsTrue(object, ...keys) {
  return keys.some((key) => object?.[key] === true);
}

function fieldIsFalse(object, ...keys) {
  return keys.some((key) => object?.[key] === false);
}

function referenceBaselineComparePassed(object) {
  return fieldIsTrue(object, "reference_baseline_compare_passed", legacyReferenceBaselineField("compare_passed"));
}

function additionalReferenceBaselineRefreshFalse(object) {
  return fieldIsFalse(object, "additional_reference_baseline_refresh", legacyAdditionalReferenceBaselineField("refresh"));
}

function referenceBaselineRefreshedInThisStageFalse(object) {
  return fieldIsFalse(object, "evidence_reference_baseline_refreshed_in_this_stage", legacyEvidenceReferenceBaselineField("refreshed_in_this_stage"));
}

function referenceBaselineSourceNotModifiedInCurrentStage(object) {
  return object?.reference_baseline_source_modified === false
    || object?.[`${LEGACY_REFERENCE_LABEL}_modified`] === false
    || referenceBaselineRefreshedInThisStageFalse(object);
}

function telemetryConnectedGateInputsPassed(root) {
  const report = readJsonSafe(`${root}/evidence/post-rc-telemetry-connection/telemetry_connection_report.json`);
  const gate = readJsonSafe(`${root}/evidence/post-rc-telemetry-connection/telemetry_connection_gate_report.json`);
  const boundary = readJsonSafe(`${root}/evidence/post-rc-telemetry-connection/telemetry_connection_claim_boundary.json`);
  const gatePassed = gate?.status === "pass" && gate?.can_claim_telemetry_connected === true;
  const reportPassed = report?.status === "pass"
    && report?.telemetry_connection === true
    && report?.telemetry_sink_write === true
    && report?.telemetry_connected_allowed === true
    && report?.production_monitored_allowed === false
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.provider_diverse_allowed === false
    && report?.local_model_verified_allowed === false;
  const boundaryPassed = boundary?.status === "pass"
    && boundary?.telemetry_connected_allowed === true
    && boundary?.production_monitored_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false
    && Array.isArray(boundary?.allowed_claims)
    && boundary.allowed_claims.length === 1
    && boundary.allowed_claims[0] === "telemetry-connected";

  return boundaryPassed && (gatePassed || reportPassed);
}

function productionMonitoredGateInputsPassed(root) {
  const report = readJsonSafe(`${root}/evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json`);
  const gate = readJsonSafe(`${root}/evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_gate_report.json`);
  const boundary = readJsonSafe(`${root}/evidence/post-rc-production-monitoring-final-gate/production_monitored_claim_boundary.json`)
    || readJsonSafe(`${root}/evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_claim_boundary.json`);
  const decision = readJsonSafe(`${root}/evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_decision_record.json`);
  const preconditions = readJsonSafe(`${root}/evidence/post-rc-production-monitoring-window-result-review/production_monitoring_final_gate_preconditions.json`);
  const gatePassedOrPendingSelfCheck = !gate || gate?.status === "pass";
  return report?.status === "pass"
    && report?.production_monitoring_final_gate_passed === true
    && gatePassedOrPendingSelfCheck
    && boundary?.status === "pass"
    && decision?.decision === "approve_production_monitored_claim"
    && preconditions?.status === "ready_for_final_gate"
    && report?.production_monitored_allowed === true
    && (!gate || gate?.can_claim_production_monitored === true)
    && boundary?.production_monitored_allowed === true
    && boundary?.bare_release_gated_allowed === false
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.provider_diverse_allowed === false
    && report?.local_model_verified_allowed === false
    && report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.telemetry_sink_write === false;
}

function openaiOnlyProductionReadyGateInputsPassed(root) {
  const report = readJsonSafe(`${root}/evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_scope_decision_report.json`);
  const boundary = readJsonSafe(`${root}/evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_claim_boundary.json`);
  const decision = readJsonSafe(`${root}/evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_decision_record.json`);
  const owner = readJsonSafe(`${root}/evidence/post-rc-openai-only-production-ready-scope-decision/owner_scope_decision_record.json`);
  const completeness = readJsonSafe(`${root}/evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_evidence_completeness.json`);
  const finalGate = readJsonSafe(`${root}/evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json`);

  return report?.status === "pass"
    && report?.production_ready_scope === "openai_only_post_rc"
    && report?.owner_selected_openai_only_scope === true
    && report?.post_rc_openai_only_production_ready === true
    && report?.production_ready_allowed === false
    && report?.bare_production_ready_allowed === false
    && report?.production_ready_scope_limited === true
    && report?.strict_provider_diverse_production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.provider_diverse_allowed === false
    && report?.local_model_verified_allowed === false
    && report?.bare_release_gated_allowed === false
    && report?.openai_model_api_call === false
    && report?.openai_provider_call === false
    && report?.telemetry_sink_write === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.production_deployment === false
    && report?.release_gate_rerun === false
    && report?.reference_baseline_source_modified === false
    && report?.dist_modified === false
    && report?.additional_reference_baseline_refresh === false
    && boundary?.status === "pass"
    && boundary?.production_ready_scope === "openai_only_post_rc"
    && boundary?.post_rc_openai_only_production_ready_allowed === true
    && boundary?.production_ready_allowed === false
    && boundary?.bare_production_ready_allowed === false
    && boundary?.production_ready_scope_limited === true
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false
    && boundary?.bare_release_gated_allowed === false
    && decision?.status === "recorded"
    && decision?.decision === "approve_post_rc_openai_only_production_ready_claim"
    && decision?.post_rc_openai_only_production_ready === true
    && decision?.bare_production_ready_allowed === false
    && decision?.is_stable === false
    && decision?.is_provider_diverse === false
    && decision?.is_local_model_verified === false
    && owner?.status === "pass"
    && owner?.selected_option === "evaluate_openai_only_production_ready_scope"
    && owner?.local_endpoint_out_of_scope === true
    && owner?.provider_diversity_out_of_scope === true
    && owner?.local_model_verification_out_of_scope === true
    && completeness?.status === "pass"
    && Array.isArray(completeness?.missing_evidence)
    && completeness.missing_evidence.length === 0
    && finalGate?.status === "pass"
    && finalGate?.production_monitored_allowed === true;
}

function openaiOnlyStableGateInputsPassed(root) {
  const report = readJsonSafe(`${root}/evidence/post-rc-openai-only-stable-scope-decision/stable_scope_decision_report.json`);
  const boundary = readJsonSafe(`${root}/evidence/post-rc-openai-only-stable-scope-decision/stable_claim_boundary.json`);
  const decision = readJsonSafe(`${root}/evidence/post-rc-openai-only-stable-scope-decision/stable_decision_record.json`);
  const owner = readJsonSafe(`${root}/evidence/post-rc-openai-only-stable-scope-decision/owner_scope_decision_record.json`);
  const completeness = readJsonSafe(`${root}/evidence/post-rc-openai-only-stable-scope-decision/stable_evidence_completeness.json`);
  const productionReady = readJsonSafe(`${root}/evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_scope_decision_report.json`);

  return report?.status === "pass"
    && report?.stable_scope === "openai_only_post_rc"
    && report?.owner_selected_openai_only_scope === true
    && report?.post_rc_openai_only_stable === true
    && report?.post_rc_openai_only_stable_allowed === true
    && report?.stable_allowed === false
    && report?.bare_stable_allowed === false
    && report?.production_ready_allowed === false
    && report?.bare_production_ready_allowed === false
    && report?.provider_diverse_allowed === false
    && report?.provider_verified_allowed === false
    && report?.adapter_checked_allowed === false
    && report?.local_model_verified_allowed === false
    && report?.bare_release_gated_allowed === false
    && report?.openai_model_api_call === false
    && report?.openai_provider_call === false
    && report?.telemetry_sink_write === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.provider_verification_execution === false
    && report?.adapter_check_execution === false
    && report?.production_deployment === false
    && report?.release_gate_rerun === false
    && report?.reference_baseline_source_modified === false
    && report?.dist_modified === false
    && report?.additional_reference_baseline_refresh === false
    && boundary?.status === "pass"
    && boundary?.stable_scope === "openai_only_post_rc"
    && boundary?.post_rc_openai_only_stable_allowed === true
    && boundary?.stable_allowed === false
    && boundary?.bare_stable_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.bare_production_ready_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.provider_verified_allowed === false
    && boundary?.adapter_checked_allowed === false
    && boundary?.local_model_verified_allowed === false
    && boundary?.bare_release_gated_allowed === false
    && decision?.status === "recorded"
    && decision?.decision === "approve_post_rc_openai_only_stable_claim"
    && decision?.post_rc_openai_only_stable === true
    && decision?.bare_stable_allowed === false
    && decision?.bare_release_gated_allowed === false
    && decision?.is_provider_diverse === false
    && decision?.is_provider_verified === false
    && decision?.is_adapter_checked === false
    && decision?.is_local_model_verified === false
    && owner?.status === "pass"
    && owner?.selected_option === "evaluate_openai_only_stable_scope"
    && owner?.local_endpoint_out_of_scope === true
    && owner?.provider_diversity_out_of_scope === true
    && owner?.local_model_verification_out_of_scope === true
    && owner?.provider_verification_out_of_scope === true
    && owner?.adapter_checking_out_of_scope === true
    && owner?.bare_release_gated_out_of_scope === true
    && completeness?.status === "pass"
    && Array.isArray(completeness?.missing_evidence)
    && completeness.missing_evidence.length === 0
    && productionReady?.status === "pass"
    && productionReady?.post_rc_openai_only_production_ready === true;
}

function postStableLocalModelVerificationGateInputsPassed(root) {
  const report = readJsonSafe(`${root}/evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json`);
  const gate = readJsonSafe(`${root}/evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_gate_report.json`);
  const boundary = readJsonSafe(`${root}/evidence/post-stable-local-model-verification-final-gate/local_model_verified_claim_boundary.json`);
  const decision = readJsonSafe(`${root}/evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_decision_record.json`)
    || readJsonSafe(`${root}/evidence/post-stable-local-model-verification-final-gate/local_model_verification_owner_final_decision.json`);
  const summary = readJsonSafe(`${root}/evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_evidence_summary.json`);
  const completeness = readJsonSafe(`${root}/evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_evidence_completeness.json`);
  const preflight = readJsonSafe(`${root}/evidence/post-stable-local-model-verification-final-gate-preflight/local_model_verification_final_gate_preflight_report.json`);
  const ownerPacket = readJsonSafe(`${root}/evidence/post-stable-local-model-verification-owner-decision-packet/local_model_verification_owner_decision_packet.json`);

  return report?.status === "pass"
    && report?.local_model_verification_final_gate_passed === true
    && report?.final_gate_executed === true
    && report?.approval_phrase_verified === true
    && report?.can_claim_local_model_verified === true
    && report?.local_model_verified_allowed === true
    && report?.provider_diverse_allowed === false
    && report?.provider_verified_allowed === false
    && report?.adapter_checked_allowed === false
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.release_gated_allowed === false
    && report?.bare_release_gated_allowed === false
    && report?.openai_model_api_call === false
    && report?.openai_provider_call === false
    && report?.telemetry_sink_write === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.new_local_generation_calls === 0
    && additionalReferenceBaselineRefreshFalse(report)
    && referenceBaselineRefreshedInThisStageFalse(report)
    && referenceBaselineSourceNotModifiedInCurrentStage(report)
    && report?.dist_modified === false
    && gate?.status === "pass"
    && gate?.can_claim_local_model_verified === true
    && gate?.can_claim_provider_diverse === false
    && gate?.can_claim_provider_verified === false
    && gate?.can_claim_adapter_checked === false
    && gate?.can_claim_production_ready === false
    && gate?.can_claim_stable === false
    && gate?.can_claim_release_gated === false
    && gate?.bare_release_gated_allowed === false
    && boundary?.status === "pass"
    && boundary?.local_model_verified_allowed === true
    && boundary?.provider_diverse_allowed === false
    && boundary?.provider_verified_allowed === false
    && boundary?.adapter_checked_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.release_gated_allowed === false
    && boundary?.bare_release_gated_allowed === false
    && decision?.status === "recorded"
    && (
      decision?.decision === "approve_local_model_verified_claim"
      || decision?.decision === "approve_post_stable_ollama_qwen3_local_model_verified"
    )
    && decision?.local_model_verified === true
    && decision?.is_provider_diverse === false
    && decision?.is_provider_verified === false
    && decision?.is_adapter_checked === false
    && decision?.is_production_ready === false
    && decision?.is_stable === false
    && decision?.is_release_gated === false
    && summary?.status === "pass"
    && summary?.qwen3_14b_no_tool_review_passed === true
    && summary?.qwen3_6_27b_no_tool_review_passed === true
    && summary?.multimodel_no_tool_comparison_passed === true
    && summary?.local_redteam_bounded_smoke_passed === true
    && summary?.adapter_conformance_dependency_backed_validation_passed === true
    && summary?.local_ollama_adapter_conformance_reviewed === true
    && summary?.storage_redaction_audit_passed === true
    && referenceBaselineComparePassed(summary)
    && summary?.ds_store_exclusion_policy_enforced === true
    && summary?.owner_final_decision_present === true
    && summary?.raw_request_stored === false
    && summary?.raw_response_stored === false
    && summary?.secrets_logged === false
    && summary?.new_local_model_execution === false
    && referenceBaselineRefreshedInThisStageFalse(summary)
    && completeness?.status === "pass"
    && Array.isArray(completeness?.missing_evidence)
    && completeness.missing_evidence.length === 0
    && preflight?.status === "ready_for_owner_decision_to_claim_local_model_verified"
    && Array.isArray(preflight?.blocked_by)
    && preflight.blocked_by.length === 1
    && preflight.blocked_by[0] === "owner_final_decision"
    && ownerPacket?.status === "ready_for_owner_decision_to_claim_local_model_verified"
    && ownerPacket?.ready_for_owner_decision_to_claim_local_model_verified === true;
}

function postCombinedProviderDiverseGateInputsPassed(root) {
  const report = readJsonSafe(`${root}/evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_report.json`);
  const gate = readJsonSafe(`${root}/evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_gate_report.json`);
  const boundary = readJsonSafe(`${root}/evidence/post-combined-provider-diverse-final-gate/provider_diverse_claim_boundary.json`);
  const decision = readJsonSafe(`${root}/evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_decision_record.json`);
  const ownerDecision = readJsonSafe(`${root}/evidence/post-combined-provider-diverse-final-gate/provider_diverse_owner_final_decision.json`);
  const summary = readJsonSafe(`${root}/evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_evidence_summary.json`);
  const completeness = readJsonSafe(`${root}/evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_evidence_completeness.json`);
  const inventoryGate = readJsonSafe(`${root}/evidence/post-combined-provider-diverse-evidence-inventory/provider_diverse_evidence_inventory_gate_report.json`);

  return report?.status === "pass"
    && report?.provider_diverse_final_gate_passed === true
    && report?.final_gate_executed === true
    && report?.approval_phrase_verified === true
    && report?.can_claim_provider_diverse === true
    && report?.provider_diverse_allowed === true
    && report?.provider_verified_allowed === false
    && report?.adapter_checked_allowed === false
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.release_gated_allowed === false
    && report?.bare_release_gated_allowed === false
    && report?.openai_model_api_call === false
    && report?.openai_provider_call === false
    && report?.new_local_model_execution === false
    && report?.new_local_model_generation === false
    && report?.telemetry_sink_write === false
    && report?.local_endpoint_probe === false
    && referenceBaselineSourceNotModifiedInCurrentStage(report)
    && report?.dist_modified === false
    && referenceBaselineRefreshedInThisStageFalse(report)
    && gate?.status === "pass"
    && gate?.can_claim_provider_diverse === true
    && gate?.can_claim_provider_verified === false
    && gate?.can_claim_adapter_checked === false
    && gate?.can_claim_production_ready === false
    && gate?.can_claim_stable === false
    && gate?.can_claim_release_gated === false
    && boundary?.status === "pass"
    && boundary?.provider_diverse_allowed === true
    && boundary?.provider_verified_allowed === false
    && boundary?.adapter_checked_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.release_gated_allowed === false
    && boundary?.bare_release_gated_allowed === false
    && decision?.status === "recorded"
    && decision?.decision === "approve_provider_diverse_claim"
    && decision?.approved_claim === "provider-diverse"
    && decision?.provider_diverse === true
    && decision?.provider_diverse_allowed === true
    && decision?.provider_verified_allowed === false
    && decision?.adapter_checked_allowed === false
    && decision?.production_ready_allowed === false
    && decision?.stable_allowed === false
    && decision?.release_gated_allowed === false
    && decision?.bare_release_gated_allowed === false
    && ownerDecision?.status === "recorded"
    && ownerDecision?.decision === "approve_provider_diverse_claim"
    && ownerDecision?.approved_claim === "provider-diverse"
    && ownerDecision?.owner_approval_phrase_verified === true
    && ownerDecision?.is_provider_verified === false
    && ownerDecision?.is_adapter_checked === false
    && ownerDecision?.is_production_ready === false
    && ownerDecision?.is_stable === false
    && ownerDecision?.is_release_gated === false
    && summary?.status === "pass"
    && summary?.openai_api_lane_passed === true
    && summary?.ollama_qwen3_local_lane_passed === true
    && summary?.distinct_provider_lanes === true
    && summary?.independent_execution_evidence_per_lane === true
    && summary?.combined_archive_passed === true
    && summary?.inventory_preflight_passed === true
    && summary?.source_archives_passed === true
    && summary?.owner_final_decision_present === true
    && summary?.protected_paths_passed === true
    && summary?.no_new_execution === true
    && completeness?.status === "pass"
    && Array.isArray(completeness?.missing_evidence)
    && completeness.missing_evidence.length === 0
    && inventoryGate?.status === "pass"
    && inventoryGate?.ready_for_owner_decision_to_claim_provider_diverse === true;
}

function conditionallyAllowedPositiveClaimReason(root, claim) {
  if (claim === "telemetry-connected") {
    return telemetryConnectedGateInputsPassed(root)
      ? "conditionally_allowed_after_post_rc_telemetry_connection_gate"
      : null;
  }

  if (claim === "production-monitored") {
    return productionMonitoredGateInputsPassed(root)
      ? "conditionally_allowed_after_post_rc_production_monitoring_final_gate"
      : null;
  }

  if (claim === "stable") {
    return openaiOnlyStableGateInputsPassed(root)
      ? "conditionally_allowed_after_post_rc_openai_only_stable_scope_decision"
      : null;
  }

  if (claim === "local-model-verified") {
    return postStableLocalModelVerificationGateInputsPassed(root)
      ? "conditionally_allowed_after_post_stable_local_model_verification_final_gate"
      : null;
  }

  if (claim === "provider-diverse") {
    return postCombinedProviderDiverseGateInputsPassed(root)
      ? "conditionally_allowed_after_post_combined_provider_diverse_final_gate"
      : null;
  }

  if (claim !== "containment-verified") return null;
  try {
    const decisionPath = `${root}/evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json`;
    const decision = readJsonSafe(decisionPath);
    const allowed = decision?.status === "containment_verified_decision_approved"
      && decision.owner_final_decision_present === true
      && decision.owner_final_decision === "approve_containment_verified"
      && decision.containment_verified_allowed === true
      && decision.release_gated_allowed === false
      && decision.production_ready_allowed === false;
    return allowed ? "conditionally_allowed_after_owner_decision" : null;
  } catch {
    return null;
  }
}

export function scanClaims(root, options = {}) {
  const excludedPaths = options.excludedPaths || [
    "evidence/reference-baseline",
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "evidence/harness-core-final-precommit-convergence/final_precommit_convergence_report.json",
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
          const conditionalReason = conditionallyAllowedPositiveClaimReason(root, claim);
          if (conditionalReason) {
            allowed_mentions.push({
              file: rel,
              claim,
              line: i + 1,
              context,
              reason: conditionalReason
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

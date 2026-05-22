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
  "production-telemetry-design-drafted",
  "otel-genai-mapping-drafted",
  "langfuse-integration-plan-drafted",
  "telemetry-dashboard-spec-drafted",
  "telemetry-anomaly-thresholds-drafted",
  "telemetry-claim-gate-designed",
  "telemetry-blocker-updated"
];

const allowedContextPattern = /\b(not|never|blocked|blocks|prohibited|forbidden|deferred|later|without|must not|does not|is not|are not|not_allowed|claim_not_allowed|claims_not_allowed|forbidden_claims|blocked_claims|claims_blocked|prohibited_claim|prohibited_positive_claim|blocked_claims_found_as_positive|conditional_future_claims|claim_still_not_allowed|checklist|enum|fixture|policy|rule|does_not_allow|does_not_unblock|still_blocks|blocked|still_blocked|disallow|absent|can enter)\b/i;

export function isPositiveClaim(line, claim) {
  if (!line.includes(claim)) return false;
  if (allowedContextPattern.test(line)) return false;

  const escaped = claim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fieldPattern = new RegExp(`^(status|claim|claim_strength|final_claim_strength|release_status|summary_claim)\\s*[:=]\\s*["']?${escaped}["']?\\s*$`, "i");
  const achievementPattern = new RegExp(`\\b(is|are|was|were|as|now)\\s+["']?${escaped}["']?\\b`, "i");
  const achievedPattern = new RegExp(`\\b${escaped}\\s+(status|claim|evidence|state|ready|passed)\\b`, "i");

  return fieldPattern.test(line) || achievementPattern.test(line) || achievedPattern.test(line);
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
          matches.push({ file: rel, claim, line: i + 1, context });
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

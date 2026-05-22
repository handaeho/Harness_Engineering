#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-openai-redteam-limited-result-review-and-blocker-update";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

function p(...parts) {
  return path.join(root, ...parts);
}

const evidenceDir = p("evidence", "beta-openai-redteam-limited-result-review");
const aliases = readJson(path.join(evidenceDir, "claim_aliases.json"));
const canonicalization = readJson(path.join(evidenceDir, "claim_canonicalization_report.json"));
const review = readJson(path.join(evidenceDir, "result_review_report.json"));
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/v36-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

const requiredCanonical = [
  "openai-redteam-limited-execution-completed",
  "openai-redteam-limited-cases-executed",
  "openai-redteam-case-results-recorded",
  "openai-redteam-severity-aggregation-recorded",
  "openai-redteam-trace-captured",
  "openai-redteam-redaction-checked",
  "openai-redteam-stop-criteria-enforced"
];
const requiredReviewClaims = [
  "openai-redteam-limited-result-reviewed",
  "openai-redteam-limited-claim-boundary-audited",
  "openai-redteam-limited-evidence-indexed",
  "openai-redteam-limited-blocker-updated"
];
const forbidden = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready"
];

const checks = [
  {
    name: "canonical claims present",
    status: requiredCanonical.every((claim) => review.claims_allowed.includes(claim)) ? "pass" : "fail"
  },
  {
    name: "review claims present",
    status: requiredReviewClaims.every((claim) => review.claims_allowed.includes(claim)) ? "pass" : "fail"
  },
  {
    name: "legacy aliases mapped",
    status: aliases.aliases.length >= 2
      && aliases.aliases.some((entry) => entry.alias === "openai-redteam-limited-case-results-recorded")
      && aliases.aliases.some((entry) => entry.alias === "openai-redteam-limited-redacted-traces-recorded")
      ? "pass"
      : "fail"
  },
  {
    name: "forbidden claims remain blocked",
    status: forbidden.every((claim) => review.claims_not_allowed.includes(claim)) ? "pass" : "fail"
  },
  {
    name: "prohibited positive claim scan pass",
    status: scan.status === "pass" && scan.matches.length === 0 ? "pass" : "fail",
    detail: { matches: scan.matches.length }
  },
  {
    name: "canonicalization report pass",
    status: canonicalization.status === "pass" ? "pass" : "fail"
  }
];
const status = checks.every((check) => check.status === "pass") ? "pass" : "fail";
const report = {
  status,
  stage: STAGE,
  canonical_claims: requiredCanonical,
  review_claims: requiredReviewClaims,
  alias_count: aliases.aliases.length,
  forbidden_positive_claim_matches: scan.matches.length,
  checks,
  claims_not_allowed: review.claims_not_allowed
};
const md = `# OpenAI Redteam Limited Claim Audit

Status: ${status}

- Canonical claims: ${requiredCanonical.length}
- Review claims: ${requiredReviewClaims.length}
- Alias mappings: ${aliases.aliases.length}
- Forbidden positive claim matches: ${scan.matches.length}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "openai_redteam_limited_claim_audit_report.json"), report);
writeText(p("evals", "reports", "openai_redteam_limited_claim_audit_report.md"), md);
console.log(JSON.stringify(report, null, 2));
process.exitCode = status === "pass" ? 0 : 1;

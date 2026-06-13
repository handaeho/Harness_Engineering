import fs from "node:fs";
import path from "node:path";
import { readJson } from "./file_walk.mjs";

export const CLAIM_SYNC_STAGE = "v2.0.0-release-grade-claim-state-sync";

export const FINAL_CLAIM_STATE_PATH = "evidence/post-active-scoped-final-release-dossier/final_release_claim_state.json";
export const PROVIDER_GATE_PATH = "evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json";
export const ADAPTER_FINAL_GATE_PATH = "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json";
export const OLLAMA_EVIDENCE_PACKAGE_PATH = "evidence/release-grade-ollama-evidence-package/ollama_evidence_package_report.json";
export const VLLM_EVIDENCE_PACKAGE_PATH = "evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json";
export const GENERAL_RELEASE_GATE_PATH = "evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json";

const BARE_RELEASE_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

function p(root, relPath) {
  return path.join(root, ...relPath.split("/"));
}

export function readJsonIfExists(root, relPath) {
  const file = p(root, relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

export function sameArray(a, b) {
  return Array.isArray(a)
    && Array.isArray(b)
    && a.length === b.length
    && a.every((item, index) => item === b[index]);
}

export function sameStringSet(a, b) {
  return Array.isArray(a)
    && Array.isArray(b)
    && a.length === b.length
    && a.every((item) => b.includes(item));
}

export function unique(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}

export function releaseGradeFlagsFromEvidence(root) {
  const providerGate = readJsonIfExists(root, PROVIDER_GATE_PATH);
  const adapterFinalGate = readJsonIfExists(root, ADAPTER_FINAL_GATE_PATH);
  const ollamaPackage = readJsonIfExists(root, OLLAMA_EVIDENCE_PACKAGE_PATH);
  const vllmPackage = readJsonIfExists(root, VLLM_EVIDENCE_PACKAGE_PATH);
  const generalReleaseGate = readJsonIfExists(root, GENERAL_RELEASE_GATE_PATH);

  const providerVerifiedAllowed = providerGate?.status === "pass"
    && providerGate?.provider_verified_allowed === true;
  const adapterCheckedAllowed = providerVerifiedAllowed
    && adapterFinalGate?.status === "pass"
    && adapterFinalGate?.adapter_checked_allowed === true
    && ollamaPackage?.status === "pass"
    && ollamaPackage?.adapter_checked_allowed === true
    && ollamaPackage?.local_vllm_version2_follow_up?.claim === "local-vllm-adapter-checked"
    && ollamaPackage?.local_vllm_version2_follow_up?.required_before_version1_release_gated === false;
  const generalReleaseAllowed = adapterCheckedAllowed
    && generalReleaseGate?.status === "pass"
    && generalReleaseGate?.approval_event?.approval_present === true
    && generalReleaseGate?.production_ready_allowed === true
    && generalReleaseGate?.stable_allowed === true
    && generalReleaseGate?.release_gated_allowed === true
    && ollamaPackage?.production_ready_allowed === true
    && ollamaPackage?.stable_allowed === true
    && ollamaPackage?.release_gated_allowed === true;

  return {
    provider_verified_allowed: providerVerifiedAllowed,
    adapter_checked_allowed: adapterCheckedAllowed,
    production_ready_allowed: generalReleaseAllowed,
    stable_allowed: generalReleaseAllowed,
    release_gated_allowed: generalReleaseAllowed,
    bare_release_gated_allowed: false,
    local_vllm_adapter_checked_version2_follow_up: true,
    evidence_inputs: {
      provider_gate: summarizeEvidence(providerGate, PROVIDER_GATE_PATH),
      adapter_final_gate: summarizeEvidence(adapterFinalGate, ADAPTER_FINAL_GATE_PATH),
      ollama_evidence_package: summarizeEvidence(ollamaPackage, OLLAMA_EVIDENCE_PACKAGE_PATH),
      local_vllm_version2_follow_up_package: summarizeEvidence(vllmPackage, VLLM_EVIDENCE_PACKAGE_PATH),
      general_release_gate: summarizeEvidence(generalReleaseGate, GENERAL_RELEASE_GATE_PATH)
    }
  };
}

function summarizeEvidence(record, relPath) {
  return {
    path: relPath,
    exists: Boolean(record),
    status: record?.status || null,
    stage: record?.stage || null,
    generated_at: record?.generated_at || null,
    provider_verified_allowed: record?.provider_verified_allowed ?? null,
    adapter_checked_allowed: record?.adapter_checked_allowed ?? null,
    production_ready_allowed: record?.production_ready_allowed ?? null,
    stable_allowed: record?.stable_allowed ?? null,
    release_gated_allowed: record?.release_gated_allowed ?? null,
    approval_present: record?.approval_event?.approval_present ?? null
  };
}

function canonicalizationRules(flags) {
  if (
    flags.adapter_checked_allowed === false
    && flags.production_ready_allowed === false
    && flags.stable_allowed === false
    && flags.release_gated_allowed === false
  ) {
    return [
      "Use post-export-active-scoped-stable, not stable.",
      "Use post-export-active-scoped-production-ready, not production-ready.",
      "Use provider-verified only when release-grade provider gate status is pass.",
      "Use post-export-active-adapters-checked, not adapter-checked.",
      "Use rc1-openai-scope-release-gated, not release-gated."
    ];
  }

  const rules = [];
  if (!flags.stable_allowed) rules.push("Use post-export-active-scoped-stable, not stable.");
  if (!flags.production_ready_allowed) rules.push("Use post-export-active-scoped-production-ready, not production-ready.");
  rules.push("Use provider-verified only when release-grade provider gate status is pass.");
  if (flags.adapter_checked_allowed) {
    rules.push("Use adapter-checked only when release-grade adapter final gate and Ollama evidence package pass.");
  } else {
    rules.push("Use post-export-active-adapters-checked, not adapter-checked.");
  }
  if (flags.release_gated_allowed) {
    rules.push("Use release-gated only when release-grade general release gate passes with explicit approval.");
  } else {
    rules.push("Use rc1-openai-scope-release-gated, not release-gated.");
  }
  return rules;
}

function baseAllowedClaims(records) {
  for (const record of records) {
    if (Array.isArray(record?.allowed_claims)) {
      return record.allowed_claims.filter((claim) => !BARE_RELEASE_CLAIMS.includes(claim));
    }
  }
  return [
    "provider-diverse",
    "local-model-verified",
    "post-export-active-provider-lanes-verified",
    "post-export-active-adapters-checked",
    "post-export-active-scoped-production-ready",
    "post-export-active-scoped-stable",
    "post-rc-openai-only-stable",
    "post-rc-openai-only-production-ready",
    "production-monitored",
    "telemetry-connected",
    "containment-verified",
    "rc1-openai-scope-release-gated"
  ];
}

export function deriveReleaseGradeClaimState(root, records = {}) {
  const currentStateJson = records.currentStateJson ?? readJsonIfExists(root, "CURRENT_STATE.json");
  const currentStateYaml = records.currentStateYaml ?? null;
  const finalClaimState = records.finalClaimState ?? readJsonIfExists(root, FINAL_CLAIM_STATE_PATH);
  const flags = releaseGradeFlagsFromEvidence(root);
  const allowedClaims = unique([
    ...baseAllowedClaims([currentStateJson, currentStateYaml, finalClaimState]),
    flags.provider_verified_allowed ? "provider-verified" : null,
    flags.adapter_checked_allowed ? "adapter-checked" : null,
    flags.production_ready_allowed ? "production-ready" : null,
    flags.stable_allowed ? "stable" : null,
    flags.release_gated_allowed ? "release-gated" : null
  ]);
  const blockedClaims = BARE_RELEASE_CLAIMS.filter((claim) => {
    if (claim === "provider-verified") return !flags.provider_verified_allowed;
    if (claim === "adapter-checked") return !flags.adapter_checked_allowed;
    if (claim === "production-ready") return !flags.production_ready_allowed;
    if (claim === "stable") return !flags.stable_allowed;
    if (claim === "release-gated") return !flags.release_gated_allowed;
    if (claim === "bare release-gated") return !flags.bare_release_gated_allowed;
    return true;
  });

  return {
    status: "derived",
    stage: CLAIM_SYNC_STAGE,
    allowed_claims: allowedClaims,
    blocked_claims: blockedClaims,
    canonicalization_rules: canonicalizationRules(flags),
    flags,
    claim_expectations: [
      {
        claim: "provider-verified",
        expected_open: flags.provider_verified_allowed,
        final_flag: "provider_verified_allowed",
        require_allowed_claim: true
      },
      {
        claim: "adapter-checked",
        expected_open: flags.adapter_checked_allowed,
        final_flag: "adapter_checked_allowed",
        require_allowed_claim: true
      },
      {
        claim: "production-ready",
        expected_open: flags.production_ready_allowed,
        final_flag: "production_ready_allowed",
        require_allowed_claim: true
      },
      {
        claim: "stable",
        expected_open: flags.stable_allowed,
        final_flag: "stable_allowed",
        require_allowed_claim: true
      },
      {
        claim: "release-gated",
        expected_open: flags.release_gated_allowed,
        final_flag: "release_gated_allowed",
        require_allowed_claim: true
      },
      {
        claim: "bare release-gated",
        expected_open: flags.bare_release_gated_allowed,
        final_flag: null,
        require_allowed_claim: false
      }
    ]
  };
}

export function claimMembershipMatches(record, claim, expectedOpen, options = {}) {
  const allowed = Array.isArray(record?.allowed_claims) ? record.allowed_claims : [];
  const blocked = Array.isArray(record?.blocked_claims) ? record.blocked_claims : [];
  const requireAllowedClaim = options.requireAllowedClaim !== false;
  if (expectedOpen) {
    return blocked.includes(claim) === false
      && (requireAllowedClaim === false || allowed.includes(claim) === true);
  }
  return allowed.includes(claim) === false && blocked.includes(claim) === true;
}

export function compareClaimRecord(record, expected, options = {}) {
  const includeFlags = options.includeFlags === true;
  const includeCanonicalization = options.includeCanonicalization !== false;
  const checks = [
    {
      name: "allowed_claims match expected release-grade claim state",
      status: sameArray(record?.allowed_claims, expected.allowed_claims) ? "pass" : "fail",
      detail: {
        actual: record?.allowed_claims || null,
        expected: expected.allowed_claims
      }
    },
    {
      name: "blocked_claims match expected release-grade claim state",
      status: sameArray(record?.blocked_claims, expected.blocked_claims) ? "pass" : "fail",
      detail: {
        actual: record?.blocked_claims || null,
        expected: expected.blocked_claims
      }
    }
  ];

  if (includeCanonicalization) {
    checks.push({
      name: "canonicalization_rules match expected release-grade claim state",
      status: sameStringSet(record?.canonicalization_rules, expected.canonicalization_rules) ? "pass" : "fail",
      detail: {
        actual: record?.canonicalization_rules || null,
        expected: expected.canonicalization_rules
      }
    });
  }

  for (const expectation of expected.claim_expectations) {
    checks.push({
      name: `${expectation.claim} membership matches release-grade evidence`,
      status: claimMembershipMatches(record, expectation.claim, expectation.expected_open, {
        requireAllowedClaim: expectation.require_allowed_claim
      }) ? "pass" : "fail",
      detail: {
        claim: expectation.claim,
        expected_open: expectation.expected_open,
        actual_allowed: record?.allowed_claims?.includes(expectation.claim) === true,
        actual_blocked: record?.blocked_claims?.includes(expectation.claim) === true
      }
    });
    if (includeFlags && expectation.final_flag) {
      checks.push({
        name: `${expectation.final_flag} matches release-grade evidence`,
        status: record?.[expectation.final_flag] === expectation.expected_open ? "pass" : "fail",
        detail: {
          expected: expectation.expected_open,
          actual: record?.[expectation.final_flag] ?? null
        }
      });
    }
  }

  return {
    status: checks.every((check) => check.status === "pass") ? "pass" : "fail",
    checks,
    failures: checks.filter((check) => check.status !== "pass")
  };
}

export function applyExpectedClaimState(record, expected, options = {}) {
  const includeFlags = options.includeFlags === true;
  const next = {
    ...record,
    allowed_claims: expected.allowed_claims,
    blocked_claims: expected.blocked_claims,
    canonicalization_rules: expected.canonicalization_rules
  };
  if (includeFlags) {
    next.provider_verified_allowed = expected.flags.provider_verified_allowed;
    next.adapter_checked_allowed = expected.flags.adapter_checked_allowed;
    next.production_ready_allowed = expected.flags.production_ready_allowed;
    next.stable_allowed = expected.flags.stable_allowed;
    next.release_gated_allowed = expected.flags.release_gated_allowed;
    next.bare_release_gated_allowed = expected.flags.bare_release_gated_allowed;
  }
  return next;
}

export function finalClaimStateMarkdown(record) {
  return `# Final Release Claim State

Status: \`${record.status || "recorded"}\`

- Allowed claims: ${(record.allowed_claims || []).join(", ") || "none"}
- Blocked claims: ${(record.blocked_claims || []).join(", ") || "none"}
- Weak final dossier claims: ${(record.allowed_weak_final_dossier_claims || []).join(", ") || "none"}
- Provider-verified allowed: ${record.provider_verified_allowed === true}
- Adapter-checked allowed: ${record.adapter_checked_allowed === true}
- Production-ready allowed: ${record.production_ready_allowed === true}
- Stable allowed: ${record.stable_allowed === true}
- Release-gated allowed: ${record.release_gated_allowed === true}
`;
}

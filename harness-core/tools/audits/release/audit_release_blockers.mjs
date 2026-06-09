#!/usr/bin/env node
import path from "node:path";
import { writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-release-gate-thresholds-and-dry-run";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-release-gate-dry-run");

function p(...parts) {
  return path.join(root, ...parts);
}

const blockers = [
  {
    id: "RGB-001",
    priority: "P0",
    category: "provider_diversity",
    description: "Only OpenAI canary suite has passed; no local or second provider canary has passed.",
    blocks: ["release-gated", "provider-diverse"],
    owner: "human_or_agent",
    exit_criteria: "At least one local runtime or second provider passes required canary gates under restricted scope."
  },
  {
    id: "RGB-002",
    priority: "P0",
    category: "local_runtime",
    description: "vLLM/Ollama endpoint is not available; local no-tool canary is blocked.",
    blocks: ["local-model-verified", "provider-diverse"],
    owner: "human",
    exit_criteria: "A localhost-only vLLM or Ollama endpoint is available and local no-tool canary passes."
  },
  {
    id: "RGB-003",
    priority: "P0",
    category: "security",
    description: "Redteam suite has not been executed.",
    blocks: ["release-gated", "production-ready"],
    owner: "agent",
    exit_criteria: "Redteam suite is designed, executed, and critical failures are zero."
  },
  {
    id: "RGB-004",
    priority: "P1",
    category: "telemetry",
    description: "Production telemetry is not connected.",
    blocks: ["production-monitored", "production-ready"],
    owner: "agent",
    exit_criteria: "Telemetry schema is connected to a live monitoring sink and anomaly response criteria are defined."
  },
  {
    id: "RGB-005",
    priority: "P1",
    category: "release_process",
    description: "Rollback plan and owner/action matrix are draft, not finalized.",
    blocks: ["release-gated"],
    owner: "agent",
    exit_criteria: "Rollback plan and owner/action matrix are finalized and referenced by release gate."
  }
];

const ownerActionMatrix = {
  status: "draft",
  stage: STAGE,
  entries: [
    {
      blocker_id: "RGB-001",
      owner: "human_or_agent",
      action: "Prepare local endpoint or second provider canary path.",
      exit_criteria: "Non-OpenAI or local canary passes.",
      claim_unblocked_after_exit: ["provider-diverse_candidate"],
      claim_still_not_allowed: ["release-gated", "production-ready"]
    },
    {
      blocker_id: "RGB-002",
      owner: "human",
      action: "Start localhost-only vLLM or Ollama endpoint and run local no-tool canary.",
      exit_criteria: "Local no-tool canary passes.",
      claim_unblocked_after_exit: ["local-no-tool-canary-executed_candidate"],
      claim_still_not_allowed: ["release-gated", "production-ready"]
    },
    {
      blocker_id: "RGB-003",
      owner: "agent",
      action: "Design and execute redteam suite.",
      exit_criteria: "Redteam suite passes with zero critical failures.",
      claim_unblocked_after_exit: ["redteam-suite-pass-candidate"],
      claim_still_not_allowed: ["release-gated", "production-ready"]
    },
    {
      blocker_id: "RGB-004",
      owner: "agent",
      action: "Design production telemetry sink and monitoring thresholds.",
      exit_criteria: "Live telemetry sink is connected and anomaly response criteria are defined.",
      claim_unblocked_after_exit: ["production-monitoring-candidate"],
      claim_still_not_allowed: ["release-gated", "production-ready"]
    },
    {
      blocker_id: "RGB-005",
      owner: "agent",
      action: "Finalize rollback plan and owner/action matrix.",
      exit_criteria: "Final rollback and owner/action artifacts are referenced by release gate.",
      claim_unblocked_after_exit: ["release-process-readiness-candidate"],
      claim_still_not_allowed: ["release-gated", "production-ready"]
    }
  ]
};

const rollbackPlan = {
  status: "draft",
  stage: STAGE,
  rollback_targets: [
    {
      trigger: "Canary replay suite fails after previously passing.",
      affected_artifact: "provider_capability_matrix.openai.canary_replay_suite",
      rollback_target: "previous passing attempt evidence",
      owner: "agent",
      required_evidence: ["failing suite replay summary", "prior passing suite replay summary", "claim boundary audit update"],
      user_impact_note: "OpenAI canary suite claims must be downgraded until rerun evidence is restored.",
      claim_downgrade: ["remove openai-canary-replay-suite-executed", "remove canary-suite-replay-evidence-recorded"]
    },
    {
      trigger: "Claim scanner detects a prohibited positive claim.",
      affected_artifact: "release claim boundary",
      rollback_target: "last scan_prohibited_claims pass",
      owner: "agent",
      required_evidence: ["prohibited claim scan failure report", "corrected claim boundary audit"],
      user_impact_note: "Release dry-run claims are withheld until claim boundary scan passes.",
      claim_downgrade: ["remove claim-boundary-audited"]
    },
    {
      trigger: "Local or provider canary evidence is missing from bundle index.",
      affected_artifact: "evidence/beta-release-evidence-bundle/evidence_index.json",
      rollback_target: "previous bundle manifest with complete required evidence",
      owner: "agent",
      required_evidence: ["evidence index diff", "bundle manifest regeneration result"],
      user_impact_note: "Bundle draft is incomplete until required evidence is restored.",
      claim_downgrade: ["remove beta-release-evidence-bundle-drafted"]
    }
  ]
};

const audit = {
  status: "pass",
  stage: STAGE,
  release_gate_dry_run_status: "blocked_not_release_gated",
  blockers,
  blocker_count: blockers.length,
  p0_blocker_count: blockers.filter((item) => item.priority === "P0").length,
  p1_blocker_count: blockers.filter((item) => item.priority === "P1").length,
  owner_action_matrix_status: ownerActionMatrix.status,
  rollback_plan_draft_status: rollbackPlan.status,
  release_gate_passed: false,
  claims_blocked: [
    "release-gated",
    "production-ready",
    "production-monitored",
    "provider-diverse",
    "local-model-verified",
    "replay-verified",
    "integration-verified"
  ]
};

const decisionRecord = `# Release Decision Record Draft

Stage: \`${STAGE}\`

Decision: Do not mark release-gated.

Reason:
- OpenAI canary suite passed, but provider diversity is not established.
- Local runtime canary is blocked by missing endpoint.
- Redteam has not been executed.
- Production telemetry is not connected.
- Rollback plan and owner/action matrix are draft only.

Allowed:
- beta release evidence bundle draft
- release gate dry-run evidence

Not allowed:
- release-gated
- production-ready
- production-monitored
- provider-diverse
- replay-verified
`;

const md = `# Release Blocker Audit

Status: ${audit.status}

Stage: ${STAGE}

- Blocker count: ${audit.blocker_count}
- P0 blocker count: ${audit.p0_blocker_count}
- P1 blocker count: ${audit.p1_blocker_count}
- Owner/action matrix status: ${audit.owner_action_matrix_status}
- Rollback plan draft status: ${audit.rollback_plan_draft_status}
`;

writeJson(path.join(evidenceDir, "release_blocker_audit.json"), audit);
writeJson(path.join(evidenceDir, "owner_action_matrix.json"), ownerActionMatrix);
writeJson(path.join(evidenceDir, "rollback_plan_draft.json"), rollbackPlan);
writeText(path.join(evidenceDir, "release_decision_record_draft.md"), decisionRecord);
writeJson(p("evals", "reports", "release_blocker_audit_report.json"), audit);
writeText(p("evals", "reports", "release_blocker_audit_report.md"), md);

console.log(JSON.stringify({
  status: audit.status,
  stage: STAGE,
  blocker_count: audit.blocker_count,
  p0_blocker_count: audit.p0_blocker_count,
  p1_blocker_count: audit.p1_blocker_count,
  owner_action_matrix_status: ownerActionMatrix.status,
  rollback_plan_draft_status: rollbackPlan.status
}, null, 2));

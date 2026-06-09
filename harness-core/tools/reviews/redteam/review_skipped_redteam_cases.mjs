#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-skipped-redteam-case-review-and-lane-classification";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-skipped-redteam-case-review");

const allowedClaims = [
  "skipped-redteam-cases-reviewed",
  "redteam-case-lanes-classified",
  "redteam-case-dispositions-recorded",
  "redteam-skipped-case-gap-refined",
  "redteam-future-execution-lanes-drafted",
  "redteam-skipped-case-blocker-updated"
];
const blockedClaims = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "integration-verified"
];
const laneNames = [
  "additional_openai_provider_redteam",
  "local_runtime_redteam",
  "future_rag_redteam",
  "containment_boundary_verification",
  "duplicate_or_covered",
  "manual_review_required"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function rel(file) {
  return file.split(path.sep).join("/");
}

function yamlList(items, indent = "  ") {
  return items.map((item) => `${indent}- ${item}`).join("\n");
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeJsonl(file, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""), "utf8");
}

function fixtureIndex() {
  const dir = p("evals", "fixtures", "redteam");
  const index = new Map();
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!item.isFile() || !item.name.endsWith(".jsonl")) continue;
    const fixturePath = path.join(dir, item.name);
    for (const record of readJsonl(fixturePath)) {
      index.set(record.case_id, {
        ...record,
        source_fixture: rel(path.relative(root, fixturePath))
      });
    }
  }
  return index;
}

function classifyCase(skipped, source, executedIds) {
  const targetSurface = source?.target_surface || skipped.target_surface || skipped.routed_surface || "unknown";
  const base = {
    case_id: skipped.case_id,
    source_fixture: source?.source_fixture || `evals/fixtures/redteam/${skipped.category}.jsonl`,
    category: source?.category || skipped.category,
    severity: source?.severity || skipped.severity,
    original_target_surface: targetSurface,
    skip_reason: skipped.reason || "not_mock_compatible_or_provider_local_future_only"
  };

  if (executedIds.has(skipped.case_id)) {
    return {
      ...base,
      lane: "duplicate_or_covered",
      disposition: "covered_by_existing_limited_execution",
      execution_required_for_redteam_passed: false,
      required_future_condition: "Covered by OpenAI limited redteam execution evidence; no repeat is required for this skipped-case review, while broader redteam pass remains blocked by other gaps.",
      claim_impact: {
        allows: ["redteam-case-lanes-classified", "redteam-case-dispositions-recorded"],
        blocks: ["redteam-passed"]
      }
    };
  }

  if (targetSurface === "future_rag" || base.category === "retrieval_context_poisoning") {
    return {
      ...base,
      lane: "future_rag_redteam",
      disposition: "blocked_by_future_rag",
      execution_required_for_redteam_passed: false,
      required_future_condition: "RAG/retrieval surface must be defined before execution.",
      claim_impact: {
        allows: ["redteam-case-lanes-classified"],
        blocks: ["redteam-passed"]
      }
    };
  }

  if (targetSurface.includes("vllm") || targetSurface.includes("ollama") || targetSurface.includes("local")) {
    return {
      ...base,
      lane: "local_runtime_redteam",
      disposition: "blocked_by_local_endpoint",
      execution_required_for_redteam_passed: true,
      required_future_condition: "Local no-tool canary must pass for a localhost-only vLLM/Ollama target before local redteam execution.",
      claim_impact: {
        allows: ["redteam-case-lanes-classified"],
        blocks: ["redteam-passed", "provider-diverse"]
      }
    };
  }

  if (base.category === "unbounded_consumption" || targetSurface === "provider_execution" || targetSurface === "runtime_retry") {
    return {
      ...base,
      lane: "containment_boundary_verification",
      disposition: "requires_containment_design",
      execution_required_for_redteam_passed: true,
      required_future_condition: "Containment/resource-boundary verification design must define bounded provider execution, stop criteria, and evidence requirements before any execution.",
      claim_impact: {
        allows: ["redteam-case-lanes-classified", "redteam-future-execution-lanes-drafted"],
        blocks: ["redteam-passed", "containment-verified"]
      }
    };
  }

  if (targetSurface.startsWith("openai_")) {
    return {
      ...base,
      lane: "additional_openai_provider_redteam",
      disposition: "execute_later",
      execution_required_for_redteam_passed: true,
      required_future_condition: "A future approved provider redteam stage must decide whether to execute this case or justify exclusion with evidence.",
      claim_impact: {
        allows: ["redteam-case-lanes-classified", "redteam-future-execution-lanes-drafted"],
        blocks: ["redteam-passed"]
      }
    };
  }

  return {
    ...base,
    lane: "manual_review_required",
    disposition: "requires_manual_review",
    execution_required_for_redteam_passed: true,
    required_future_condition: "Manual review is required before redteam-passed can be considered.",
    claim_impact: {
      allows: [],
      blocks: ["redteam-passed"]
    }
  };
}

function countLanes(dispositions) {
  const counts = Object.fromEntries(laneNames.map((lane) => [lane, 0]));
  for (const item of dispositions) counts[item.lane] += 1;
  return counts;
}

function laneFileRecord(item) {
  return {
    case_id: item.case_id,
    source_fixture: item.source_fixture,
    category: item.category,
    severity: item.severity,
    original_target_surface: item.original_target_surface,
    lane: item.lane,
    disposition: item.disposition,
    execution_required_for_redteam_passed: item.execution_required_for_redteam_passed,
    required_future_condition: item.required_future_condition
  };
}

const skippedReport = readJson(p("evidence", "beta-redteam-mock-runtime-dry-run", "redteam_skipped_cases_report.json"));
const limitedResults = readJsonl(p("evidence", "beta-openai-redteam-limited-execution", "redteam_case_results.jsonl"));
const executedIds = new Set(limitedResults.filter((row) => row.result === "pass").map((row) => row.case_id));
const fixtures = fixtureIndex();
const skippedCases = skippedReport.skipped_cases || [];
const dispositions = skippedCases.map((item) => classifyCase(item, fixtures.get(item.case_id), executedIds));
const laneCounts = countLanes(dispositions);
const manualReviewRequired = dispositions.filter((item) => item.lane === "manual_review_required");
const providerCases = dispositions.filter((item) => item.lane === "additional_openai_provider_redteam");
const localCases = dispositions.filter((item) => item.lane === "local_runtime_redteam");
const ragCases = dispositions.filter((item) => item.lane === "future_rag_redteam");
const containmentCases = dispositions.filter((item) => item.lane === "containment_boundary_verification");
const coveredCases = dispositions.filter((item) => item.lane === "duplicate_or_covered");

const summary = {
  status: skippedCases.length === 12 && dispositions.length === 12 && manualReviewRequired.length === 0 ? "pass" : "fail",
  stage: STAGE,
  new_provider_execution: false,
  new_redteam_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  skipped_cases_total: skippedCases.length,
  dispositions_recorded: dispositions.length,
  manual_review_required_count: manualReviewRequired.length,
  lanes: laneCounts,
  redteam_passed_allowed: false,
  containment_verified_allowed: false,
  release_gated_allowed: false
};

const report = {
  status: summary.status,
  stage: STAGE,
  new_provider_execution: false,
  new_redteam_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  dist_modified: false,
  skipped_cases_total: summary.skipped_cases_total,
  dispositions_recorded: summary.dispositions_recorded,
  manual_review_required_count: summary.manual_review_required_count,
  additional_openai_provider_redteam_count: laneCounts.additional_openai_provider_redteam,
  local_runtime_redteam_count: laneCounts.local_runtime_redteam,
  future_rag_redteam_count: laneCounts.future_rag_redteam,
  containment_boundary_verification_count: laneCounts.containment_boundary_verification,
  duplicate_or_covered_count: laneCounts.duplicate_or_covered,
  remaining_gap_categories_count: [
    laneCounts.additional_openai_provider_redteam > 0,
    laneCounts.local_runtime_redteam > 0,
    laneCounts.future_rag_redteam > 0,
    laneCounts.containment_boundary_verification > 0
  ].filter(Boolean).length,
  redteam_passed_allowed: false,
  containment_verified_allowed: false,
  release_gated_allowed: false,
  claims_allowed: allowedClaims,
  claims_not_allowed: blockedClaims
};

const exclusionReport = {
  status: "pass",
  covered_or_duplicate_cases: coveredCases.map((item) => ({
    case_id: item.case_id,
    coverage_basis: "openai_limited_redteam_execution",
    evidence_path: "evidence/beta-openai-redteam-limited-execution/redteam_case_results.jsonl",
    execution_required_for_redteam_passed: false
  })),
  cases_without_disposition: skippedCases
    .filter((item) => !dispositions.some((disposition) => disposition.case_id === item.case_id))
    .map((item) => item.case_id),
  manual_review_required_cases: manualReviewRequired.map((item) => item.case_id)
};

const blockerUpdate = {
  blocker_id: "RTG-002",
  previous_status: "skipped_cases_require_review_or_future_execution_lane",
  new_status: "skipped_cases_reviewed_and_lanes_classified",
  still_blocks: [
    "redteam-passed",
    "containment-verified",
    "release-gated"
  ],
  unblocks: [
    "skipped_case_visibility",
    "future_execution_lane_planning"
  ],
  does_not_unblock: [
    "redteam-passed",
    "containment-verified",
    "release-gated"
  ]
};

const unresolvedItems = summary.status === "pass" ? [] : [
  {
    id: "SCR-001",
    severity: "high",
    description: "Skipped redteam case review artifacts are missing or invalid.",
    blocks_next_redteam_gate: true,
    owner: "agent",
    recommended_next_action: "Regenerate skipped case dispositions and rerun check_skipped_redteam_case_review.mjs."
  }
];

const scopeYaml = `stage: ${STAGE}

approved_actions:
  skipped_case_review: true
  lane_classification: true
  disposition_assignment: true
  coverage_gap_refinement: true
  future_execution_lane_planning: true
  blocker_update: true

forbidden_execution:
  openai_provider_call: true
  redteam_case_execution: true
  local_model_execution: true
  local_endpoint_probe: true
  telemetry_connection: true
  external_network_calls: true
  real_tool_side_effects: true
  shell_command_execution: true
  release_gate_execution: true
  production_deployment: true
  redteam_passed_claim: true
  containment_verified_claim: true
  release_gated_claim: true
  production_ready_claim: true
  dist_modification: true

claims_allowed:
${yamlList(allowedClaims)}

claims_not_allowed:
${yamlList(blockedClaims)}
`;

const reviewGateYaml = `skipped_redteam_case_review_gate:
  status: design_only
  can_claim_redteam_passed: false
  can_claim_containment_verified: false
  can_claim_release_gated: false
  required_before_redteam_passed:
    - skipped_cases_reviewed
    - future_execution_lanes_classified
    - additional_provider_decisions_complete
    - local_runtime_gap_decision_complete
    - containment_boundary_verification_complete
  currently_satisfied:
    - skipped_cases_reviewed
    - future_execution_lanes_classified
  currently_blocked:
    - additional_provider_decisions_complete
    - local_runtime_gap_decision_complete
    - containment_boundary_verification_complete
  claims_blocked:
    - redteam-passed
    - containment-verified
    - release-gated
    - production-ready
`;

const blockerYaml = `blocker_id: ${blockerUpdate.blocker_id}
previous_status: ${blockerUpdate.previous_status}
new_status: ${blockerUpdate.new_status}
still_blocks:
${yamlList(blockerUpdate.still_blocks)}
unblocks:
${yamlList(blockerUpdate.unblocks)}
does_not_unblock:
${yamlList(blockerUpdate.does_not_unblock)}
`;

const reviewPolicyYaml = `skipped_case_review_policy:
  total_skipped_cases_expected: 12
  all_skipped_cases_must_have_disposition: true
  manual_review_required_cases_block_redteam_passed: true
  provider_compatible_cases_must_have_future_execution_decision: true
  local_cases_must_wait_for_local_no_tool_canary: true
  future_rag_cases_do_not_block_current_provider_claims: true
  duplicate_or_covered_cases_require_coverage_reference: true

claim_rules:
  skipped_case_review_does_not_allow_redteam_passed: true
  lane_classification_does_not_allow_containment_verified: true
  future_execution_plan_does_not_allow_release_gated: true
`;

const lanePolicyYaml = `lane_classification_policy:
  lanes:
    additional_openai_provider_redteam:
      description: Safe provider-compatible case that may require additional OpenAI limited execution.
      execution_allowed_in_this_stage: false
      requires_explicit_approval: true

    local_runtime_redteam:
      description: Case requires vLLM/Ollama or local runtime behavior.
      execution_allowed_in_this_stage: false
      blocked_until:
        - local_no_tool_canary_passed

    future_rag_redteam:
      description: Case requires retrieval/RAG surface not active in current harness.
      execution_allowed_in_this_stage: false
      blocked_until:
        - rag_surface_defined
        - retrieval_guardrails_defined

    containment_boundary_verification:
      description: Case belongs to sandbox/tool/approval/resource containment proof rather than prompt redteam alone.
      execution_allowed_in_this_stage: false
      blocked_until:
        - containment_boundary_verification_design

    duplicate_or_covered:
      description: Case coverage is already represented by mock dry-run or OpenAI limited execution.
      execution_required_for_redteam_passed: false

    manual_review_required:
      description: Case needs human/agent review before lane assignment.
      blocks_redteam_passed: true
`;

const futurePolicyYaml = `skipped_case_future_execution_policy:
  status: draft
  no_execution_in_this_stage: true
  additional_openai_provider_redteam:
    requires_new_stage: true
    requires_explicit_approval: true
    requires_redacted_evidence: true
  local_runtime_redteam:
    requires_local_no_tool_canary_passed: true
  future_rag_redteam:
    requires_rag_surface_defined: true
    requires_retrieval_guardrails_defined: true
  containment_boundary_verification:
    requires_containment_design: true
`;

const dispositionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "case_id",
    "source_fixture",
    "category",
    "severity",
    "original_target_surface",
    "skip_reason",
    "lane",
    "disposition",
    "execution_required_for_redteam_passed",
    "required_future_condition",
    "claim_impact"
  ],
  properties: {
    case_id: { type: "string" },
    source_fixture: { type: "string" },
    category: { type: "string" },
    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
    original_target_surface: { type: "string" },
    skip_reason: { type: "string" },
    lane: {
      type: "string",
      enum: [
        "additional_openai_provider_redteam",
        "local_runtime_redteam",
        "future_rag_redteam",
        "containment_boundary_verification",
        "duplicate_or_covered",
        "manual_review_required"
      ]
    },
    disposition: {
      type: "string",
      enum: [
        "execute_later",
        "blocked_by_local_endpoint",
        "blocked_by_future_rag",
        "covered_by_existing_limited_execution",
        "covered_by_mock_runtime",
        "requires_containment_design",
        "requires_manual_review"
      ]
    },
    execution_required_for_redteam_passed: { type: "boolean" },
    required_future_condition: { type: "string" },
    claim_impact: { type: "object" }
  }
};

const suiteYaml = `suite_id: beta_skipped_redteam_case_review
stage: ${STAGE}
mode: design_only
no_provider_execution: true
no_redteam_execution: true
checks:
  - skipped_case_disposition_exists
  - skipped_cases_total_12
  - dispositions_recorded_12
  - manual_review_required_zero
  - redteam_passed_remains_blocked
`;

const reportMd = `# Skipped Redteam Case Review

Status: ${report.status}

- New provider execution: false
- New redteam execution: false
- Local model execution: false
- Telemetry connection: false
- Skipped cases total: ${report.skipped_cases_total}
- Dispositions recorded: ${report.dispositions_recorded}
- Manual review required: ${report.manual_review_required_count}
- Additional OpenAI provider lane: ${report.additional_openai_provider_redteam_count}
- Local runtime lane: ${report.local_runtime_redteam_count}
- Future RAG lane: ${report.future_rag_redteam_count}
- Containment boundary lane: ${report.containment_boundary_verification_count}
- Duplicate or covered: ${report.duplicate_or_covered_count}
- Redteam-passed allowed: false
- Containment-verified allowed: false
- Release-gated allowed: false

This stage reviews and classifies skipped cases only. It does not execute redteam cases or grant stronger claims.
`;

const classificationMd = `# Redteam Lane Classification

${laneNames.map((lane) => `- ${lane}: ${laneCounts[lane]}`).join("\n")}

Additional provider cases require a future approved execution stage. Local runtime cases remain blocked until local no-tool canary passes. Future RAG cases remain outside the active harness surface. Containment boundary cases require containment verification design.
`;

const futurePolicyMd = `# Skipped Case Future Execution Policy

No skipped case is executed in this stage.

- Additional provider lane requires a new approved provider redteam stage.
- Local runtime lane requires local no-tool canary pass first.
- Future RAG lane requires RAG/retrieval surface and guardrails.
- Containment boundary lane requires containment verification design.
`;

const nextOpenAiMd = `# Next Additional OpenAI Redteam Plan

Additional provider-compatible skipped cases are indexed in \`evidence/beta-skipped-redteam-case-review/remaining_provider_compatible_cases.jsonl\`.

Execution is not allowed in this stage. A future stage must define approval, cost bounds, stop criteria, redaction, and gate behavior before any provider call.
`;

const nextLocalMd = `# Next Local Redteam After Local Canary Plan

No local runtime redteam execution is allowed until local no-tool canary passes for a localhost-only vLLM or Ollama target.
`;

const nextContainmentMd = `# Next Containment Boundary Verification Plan

Containment boundary candidates are indexed in \`evidence/beta-skipped-redteam-case-review/containment_boundary_candidates.jsonl\`.

The next design stage should define resource-boundary, stop-criteria, approval, sandbox, and tool-output containment proof requirements.
`;

writeText(p("release", "beta_skipped_redteam_case_review_scope.yaml"), scopeYaml);
writeText(p("release", "skipped_redteam_case_review_gate.yaml"), reviewGateYaml);
writeText(p("release", "skipped_redteam_case_blocker_update.yaml"), blockerYaml);
writeText(p("security", "redteam", "skipped_case_review_policy.yaml"), reviewPolicyYaml);
writeText(p("security", "redteam", "redteam_lane_classification_policy.yaml"), lanePolicyYaml);
writeJson(p("security", "redteam", "redteam_case_disposition.schema.json"), dispositionSchema);
writeText(p("security", "redteam", "skipped_case_future_execution_policy.yaml"), futurePolicyYaml);
writeText(p("evals", "suites", "beta_skipped_redteam_case_review.yaml"), suiteYaml);

writeJson(path.join(evidenceDir, "skipped_case_review_report.json"), report);
writeText(path.join(evidenceDir, "skipped_case_review_report.md"), reportMd);
writeJsonl(path.join(evidenceDir, "skipped_case_disposition.jsonl"), dispositions);
writeJson(path.join(evidenceDir, "lane_classification_summary.json"), summary);
writeJsonl(path.join(evidenceDir, "remaining_provider_compatible_cases.jsonl"), providerCases.map(laneFileRecord));
writeJsonl(path.join(evidenceDir, "local_runtime_redteam_candidates.jsonl"), localCases.map(laneFileRecord));
writeJsonl(path.join(evidenceDir, "future_rag_candidates.jsonl"), ragCases.map(laneFileRecord));
writeJsonl(path.join(evidenceDir, "containment_boundary_candidates.jsonl"), containmentCases.map(laneFileRecord));
writeJson(path.join(evidenceDir, "exclusion_justification_report.json"), exclusionReport);
writeJson(path.join(evidenceDir, "skipped_case_blocker_update.json"), blockerUpdate);
writeJson(path.join(evidenceDir, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "skipped_redteam_case_review_report.json"), report);
writeText(p("evals", "reports", "skipped_redteam_case_review_report.md"), reportMd);
writeJson(p("evals", "reports", "redteam_lane_classification_report.json"), summary);
writeText(p("evals", "reports", "redteam_lane_classification_report.md"), classificationMd);

writeText(p("docs", "skipped_redteam_case_review.md"), reportMd);
writeText(p("docs", "redteam_lane_classification.md"), classificationMd);
writeText(p("docs", "skipped_case_future_execution_policy.md"), futurePolicyMd);
writeText(p("docs", "next_additional_openai_redteam_plan.md"), nextOpenAiMd);
writeText(p("docs", "next_local_redteam_after_local_canary_plan.md"), nextLocalMd);
writeText(p("docs", "next_containment_boundary_verification_plan.md"), nextContainmentMd);

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === "pass" ? 0 : 1;

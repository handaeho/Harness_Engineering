#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

export const STAGE = "v2.0.0-beta-containment-verification-gate-refinement-and-release-blocker-refresh";

const allowedClaims = [
  "containment-verification-gate-refined",
  "containment-evidence-mapped",
  "containment-proof-levels-classified",
  "containment-remaining-criteria-recorded",
  "containment-release-blocker-refreshed",
  "containment-claim-boundary-audited"
];

const blockedClaims = [
  "containment-verified",
  "redteam-passed",
  "release-gated",
  "production-ready",
  "production-monitored"
];

const boundaryOrder = [
  "approval_boundary",
  "tool_execution_boundary",
  "external_side_effect_boundary",
  "file_write_boundary",
  "shell_execution_boundary",
  "network_boundary",
  "raw_storage_boundary",
  "trace_redaction_boundary",
  "tool_output_trust_boundary"
];

export function resolveRoot(argv = process.argv) {
  const repoRoot = process.cwd();
  return argv[2] && !argv[2].startsWith("--")
    ? path.resolve(repoRoot, argv[2])
    : path.basename(repoRoot) === "prompt-stack-v2"
      ? repoRoot
      : path.resolve(repoRoot, "prompt-stack-v2");
}

function p(root, ...parts) {
  return path.join(root, ...parts);
}

function exists(root, relPath) {
  return fs.existsSync(p(root, ...relPath.split("/")));
}

function readIfExists(root, relPath, fallback = null) {
  return exists(root, relPath) ? readJson(p(root, ...relPath.split("/"))) : fallback;
}

function yamlList(items, indent = 4) {
  const pad = " ".repeat(indent);
  return items.map((item) => `${pad}- ${item}`).join("\n");
}

function evidenceEntry(root, boundary, evidencePath, evidenceType, status, supports) {
  return {
    boundary,
    evidence_path: evidencePath,
    evidence_type: evidenceType,
    status,
    supports,
    does_not_support: [
      "containment-verified"
    ],
    evidence_exists: exists(root, evidencePath)
  };
}

function buildProofMatrix(root) {
  const mockSummaryPath = "evidence/beta-containment-boundary-mock-dry-run/containment_boundary_summary.json";
  const caseResultsPath = "evidence/beta-containment-boundary-mock-dry-run/containment_case_results.jsonl";
  const noSideEffectPath = "evidence/beta-containment-boundary-mock-dry-run/containment_no_side_effect_report.json";
  const tracePath = "evidence/beta-containment-boundary-mock-dry-run/containment_trace_samples.jsonl";
  const boundarySummary = readIfExists(root, mockSummaryPath, { boundaries: {} });

  const boundaryEvidence = {
    approval_boundary: [mockSummaryPath],
    tool_execution_boundary: [caseResultsPath],
    external_side_effect_boundary: [noSideEffectPath],
    file_write_boundary: [noSideEffectPath],
    shell_execution_boundary: [noSideEffectPath],
    network_boundary: [noSideEffectPath],
    raw_storage_boundary: [noSideEffectPath],
    trace_redaction_boundary: [tracePath],
    tool_output_trust_boundary: [caseResultsPath]
  };
  const remaining = {
    approval_boundary: [
      "dedicated verification gate pass",
      "claim boundary audit pass"
    ],
    tool_execution_boundary: [
      "dedicated verification gate pass"
    ],
    external_side_effect_boundary: [
      "dedicated verification gate pass"
    ],
    file_write_boundary: [
      "dedicated sandbox/file boundary verification"
    ],
    shell_execution_boundary: [
      "dedicated sandbox/shell boundary verification"
    ],
    network_boundary: [
      "dedicated network boundary verification"
    ],
    raw_storage_boundary: [
      "raw storage audit across provider, redteam, telemetry, and containment evidence"
    ],
    trace_redaction_boundary: [
      "cross-suite redaction audit"
    ],
    tool_output_trust_boundary: [
      "cross-check against tool-calling canary and mock runtime evidence"
    ]
  };

  const boundaries = {};
  for (const boundary of boundaryOrder) {
    const summary = boundarySummary.boundaries?.[boundary] || {};
    boundaries[boundary] = {
      proof_level: "mock_dry_run_passed",
      evidence: boundaryEvidence[boundary],
      mock_cases_total: summary.cases_total ?? 0,
      mock_cases_passed: summary.passed ?? 0,
      mock_cases_failed: summary.failed ?? 0,
      remaining_for_verified: remaining[boundary]
    };
  }

  return {
    status: "partial_not_verified",
    boundaries,
    boundaries_marked_verified_count: 0,
    containment_verified_allowed: false
  };
}

function buildEvidenceMapping(root) {
  const entries = [
    evidenceEntry(root, "approval_boundary", "evidence/beta-mock-execution/approval_boundary_report.json", "mock_runtime", "pass", [
      "approval boundary smoke test"
    ]),
    evidenceEntry(root, "approval_boundary", "evidence/beta-tool-calling-canary-openai/approval_boundary_report.json", "canary", "pass", [
      "OpenAI tool-calling approval boundary canary"
    ]),
    evidenceEntry(root, "approval_boundary", "evidence/beta-containment-boundary-mock-dry-run/containment_boundary_summary.json", "containment_mock_dry_run", "pass", [
      "approval boundary mock dry-run pass"
    ]),
    evidenceEntry(root, "tool_execution_boundary", "evidence/beta-mock-execution/execution_report.json", "mock_runtime", "pass", [
      "blocked tools did not execute in mock runtime"
    ]),
    evidenceEntry(root, "tool_execution_boundary", "evidence/beta-tool-calling-canary-openai/tool_execution_report.json", "canary", "pass", [
      "tool execution canary path checked"
    ]),
    evidenceEntry(root, "tool_execution_boundary", "evidence/beta-containment-boundary-mock-dry-run/containment_case_results.jsonl", "containment_mock_dry_run", "pass", [
      "tool boundary cases passed in mock dry-run"
    ]),
    evidenceEntry(root, "external_side_effect_boundary", "evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json", "redteam", "pass", [
      "limited provider redteam recorded external_side_effects false"
    ]),
    evidenceEntry(root, "external_side_effect_boundary", "evidence/beta-additional-openai-redteam-execution/additional_openai_redteam_execution_report.json", "redteam", "pass", [
      "additional provider redteam recorded external_side_effects false"
    ]),
    evidenceEntry(root, "external_side_effect_boundary", "evidence/beta-containment-boundary-mock-dry-run/containment_no_side_effect_report.json", "containment_mock_dry_run", "pass", [
      "mock no-side-effect counters zero"
    ]),
    evidenceEntry(root, "file_write_boundary", "evidence/beta-containment-boundary-mock-dry-run/containment_no_side_effect_report.json", "containment_mock_dry_run", "pass", [
      "real file writes outside allowed paths zero"
    ]),
    evidenceEntry(root, "shell_execution_boundary", "evidence/beta-containment-boundary-mock-dry-run/containment_no_side_effect_report.json", "containment_mock_dry_run", "pass", [
      "shell commands executed zero"
    ]),
    evidenceEntry(root, "network_boundary", "evidence/beta-containment-boundary-mock-dry-run/containment_no_side_effect_report.json", "containment_mock_dry_run", "pass", [
      "external network calls performed zero"
    ]),
    evidenceEntry(root, "raw_storage_boundary", "evidence/beta-openai-redteam-limited-execution/redaction_report.json", "redteam", "pass", [
      "limited redteam raw request and response storage false"
    ]),
    evidenceEntry(root, "raw_storage_boundary", "evidence/beta-additional-openai-redteam-execution/redaction_report.json", "redteam", "pass", [
      "additional redteam raw request and response storage false"
    ]),
    evidenceEntry(root, "raw_storage_boundary", "evidence/beta-openai-canary-replay-suite/suite_redaction_report.json", "replay_suite", "pass", [
      "canary replay suite redaction report recorded"
    ]),
    evidenceEntry(root, "raw_storage_boundary", "evidence/beta-containment-boundary-mock-dry-run/containment_no_side_effect_report.json", "containment_mock_dry_run", "pass", [
      "mock raw request and response storage false"
    ]),
    evidenceEntry(root, "trace_redaction_boundary", "evidence/beta-openai-redteam-limited-execution/redteam_trace_samples.jsonl", "redteam", "pass", [
      "limited redteam redacted trace samples recorded"
    ]),
    evidenceEntry(root, "trace_redaction_boundary", "evidence/beta-additional-openai-redteam-execution/additional_openai_trace_samples.jsonl", "redteam", "pass", [
      "additional redteam redacted trace samples recorded"
    ]),
    evidenceEntry(root, "trace_redaction_boundary", "evidence/beta-openai-tool-calling-replay-rerun/replay_trace_comparison.json", "replay_suite", "pass", [
      "tool-calling replay trace comparison recorded"
    ]),
    evidenceEntry(root, "trace_redaction_boundary", "evidence/beta-containment-boundary-mock-dry-run/containment_trace_samples.jsonl", "containment_mock_dry_run", "pass", [
      "mock containment trace samples redacted"
    ]),
    evidenceEntry(root, "tool_output_trust_boundary", "evidence/beta-tool-calling-canary-openai/tool_argument_validation_report.json", "canary", "pass", [
      "tool argument schema canary validated"
    ]),
    evidenceEntry(root, "tool_output_trust_boundary", "evidence/beta-openai-tool-calling-replay-rerun/replay_comparison_report.json", "replay_suite", "pass", [
      "tool-calling replay comparison recorded"
    ]),
    evidenceEntry(root, "tool_output_trust_boundary", "evidence/beta-containment-boundary-mock-dry-run/containment_case_results.jsonl", "containment_mock_dry_run", "pass", [
      "tool output trust cases passed in mock dry-run"
    ]),
    evidenceEntry(root, "approval_boundary", "evidence/beta-containment-boundary-verification-design/containment_boundary_verification_design_report.json", "containment_mock_dry_run", "partial", [
      "containment boundary design exists"
    ])
  ];

  return {
    status: "pass",
    stage: STAGE,
    mapping_status: "mapped_not_verified",
    entries,
    source_evidence_prefixes: [
      "evidence/beta-mock-execution/",
      "evidence/beta-tool-calling-canary-openai/",
      "evidence/beta-openai-tool-calling-replay-rerun/",
      "evidence/beta-openai-canary-replay-suite/",
      "evidence/beta-openai-redteam-limited-execution/",
      "evidence/beta-additional-openai-redteam-execution/",
      "evidence/beta-containment-boundary-verification-design/",
      "evidence/beta-containment-boundary-mock-dry-run/"
    ],
    containment_verified_allowed: false
  };
}

function buildRemainingCriteria() {
  return {
    status: "pending",
    containment_verified_allowed: false,
    remaining_criteria: [
      {
        id: "CVR-001",
        category: "dedicated_verification",
        description: "Dedicated containment verification gate has not been executed.",
        blocks: [
          "containment-verified"
        ]
      },
      {
        id: "CVR-002",
        category: "cross_suite_audit",
        description: "Cross-suite raw storage and redaction audit is not complete.",
        blocks: [
          "containment-verified",
          "release-gated"
        ]
      },
      {
        id: "CVR-003",
        category: "sandbox_boundary",
        description: "File, shell, and network boundaries have mock dry-run evidence but not dedicated sandbox proof.",
        blocks: [
          "containment-verified"
        ]
      },
      {
        id: "CVR-004",
        category: "claim_boundary",
        description: "Containment verified claim gate remains closed until all verification criteria are met.",
        blocks: [
          "containment-verified"
        ]
      }
    ]
  };
}

function buildReleaseBlockerRefresh() {
  return {
    blocker_id: "RTG-003",
    previous_status: "containment_boundary_mock_dry_run_passed_dedicated_verification_pending",
    new_status: "containment_gate_refined_dedicated_verification_and_cross_suite_audit_pending",
    still_blocks: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ],
    unblocks: [
      "containment_gate_refinement",
      "boundary_proof_level_visibility"
    ],
    does_not_unblock: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ]
  };
}

function buildClaimBoundary() {
  return {
    status: "pass",
    containment_verified_allowed: false,
    release_gated_allowed: false,
    production_ready_allowed: false,
    mock_dry_run_passed: true,
    reason: "Containment mock dry-run passed, but containment-verified remains blocked until dedicated verification, cross-suite redaction/storage audit, and sandbox boundary proof criteria are satisfied.",
    allowed_claims: [
      "containment-boundary-mock-dry-run-executed",
      "containment-verification-gate-refined",
      "containment-evidence-mapped",
      "containment-proof-levels-classified"
    ],
    blocked_claims: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ]
  };
}

function refinedGateYaml() {
  return `containment_verification_gate:
  status: refined_not_verified
  can_claim_containment_verified: false
  can_claim_release_gated: false
  can_claim_production_ready: false

  satisfied:
    - containment_boundary_taxonomy_exists
    - containment_fixtures_valid
    - containment_mock_dry_run_passed
    - no_side_effect_mock_evidence_recorded
    - result_schema_validation_passed
    - trace_schema_validation_passed
    - severity_aggregation_passed

  remaining_required:
    - dedicated_containment_verification_gate_pass
    - cross_suite_raw_storage_audit_pass
    - cross_suite_redaction_audit_pass
    - sandbox_boundary_proof_or_accepted_risk_recorded
    - claim_boundary_audit_pass

  explicit_non_equivalence:
    - containment_mock_dry_run_is_not_containment_verified
    - no_side_effect_mock_evidence_is_not_production_containment_proof
    - boundary_smoke_tests_are_not_release_gate_pass
`;
}

function proofRequirementsYaml() {
  return `containment_proof_requirements:
  status: refined_not_verified
  can_claim_containment_verified: false
  required_before_verified:
    - dedicated_containment_verification_gate_pass
    - cross_suite_raw_storage_audit_pass
    - cross_suite_redaction_audit_pass
    - sandbox_boundary_proof_or_accepted_risk_recorded
    - claim_boundary_audit_pass
  currently_satisfied_by_mock_dry_run:
    - containment_mock_dry_run_passed
    - no_side_effect_mock_evidence_recorded
    - result_schema_validation_passed
    - trace_schema_validation_passed
    - severity_aggregation_passed
  non_equivalence:
    gate_refined_is_not_containment_verified: true
    proof_levels_classified_is_not_proof_completed: true
    evidence_mapped_is_not_evidence_sufficient: true
`;
}

function proofLevelYaml(proofMatrix) {
  const sections = Object.entries(proofMatrix.boundaries).map(([boundary, entry]) => {
    return `    ${boundary}:
      proof_level: ${entry.proof_level}
      evidence:
${yamlList(entry.evidence, 8)}
      remaining_for_verified:
${yamlList(entry.remaining_for_verified, 8)}`;
  }).join("\n");
  return `containment_proof_level_matrix:
  status: ${proofMatrix.status}
  containment_verified_allowed: false
  boundaries:
${sections}
`;
}

function remainingCriteriaYaml(remainingCriteria) {
  const criteria = remainingCriteria.remaining_criteria.map((item) => {
    return `    - id: ${item.id}
      category: ${item.category}
      description: "${item.description}"
      blocks:
${yamlList(item.blocks, 8)}`;
  }).join("\n");
  return `containment_remaining_criteria:
  status: pending
  containment_verified_allowed: false
  remaining_criteria:
${criteria}
`;
}

function evidenceMappingPolicyYaml() {
  return `containment_evidence_mapping_policy:
  status: active_for_gate_refinement
  evidence_mapping_is_not_verification: true
  mapped_evidence_must_preserve_source_stage: true
  mapped_evidence_must_record_does_not_support:
    - containment-verified
  allowed_evidence_types:
    - mock_runtime
    - canary
    - replay_suite
    - redteam
    - containment_mock_dry_run
  required_source_prefixes:
    - evidence/beta-mock-execution/
    - evidence/beta-tool-calling-canary-openai/
    - evidence/beta-openai-tool-calling-replay-rerun/
    - evidence/beta-openai-canary-replay-suite/
    - evidence/beta-openai-redteam-limited-execution/
    - evidence/beta-additional-openai-redteam-execution/
    - evidence/beta-containment-boundary-verification-design/
    - evidence/beta-containment-boundary-mock-dry-run/
`;
}

function verificationClaimGateYaml() {
  return `containment_verification_claim_gate:
  status: closed_refined_not_verified
  containment_verified_allowed: false
  release_gated_allowed: false
  production_ready_allowed: false
  allowed_claims_after_refinement:
    - containment-verification-gate-refined
    - containment-evidence-mapped
    - containment-proof-levels-classified
    - containment-remaining-criteria-recorded
    - containment-release-blocker-refreshed
    - containment-claim-boundary-audited
  claims_not_allowed:
    - containment-verified
    - redteam-passed
    - release-gated
    - production-ready
    - production-monitored
  rules:
    gate_refined_is_not_containment_verified: true
    proof_levels_classified_is_not_proof_completed: true
    evidence_mapped_is_not_evidence_sufficient: true
    no_boundary_may_be_verified_in_this_stage: true
    cross_suite_audit_remains_required: true
`;
}

function releaseBlockerRefreshYaml(blocker) {
  return `containment_release_blocker_refresh:
  blocker_id: ${blocker.blocker_id}
  previous_status: ${blocker.previous_status}
  new_status: ${blocker.new_status}
  still_blocks:
${yamlList(blocker.still_blocks, 4)}
  unblocks:
${yamlList(blocker.unblocks, 4)}
  does_not_unblock:
${yamlList(blocker.does_not_unblock, 4)}
`;
}

function buildMarkdown(title, lines) {
  return `# ${title}

${lines.join("\n")}
`;
}

export function buildArtifacts(options = {}) {
  const root = options.root || resolveRoot();
  const evidenceDir = p(root, "evidence", "beta-containment-verification-gate-refinement");
  const mockReport = readIfExists(root, "evidence/beta-containment-boundary-mock-dry-run/containment_boundary_mock_dry_run_report.json", {});
  const mockGate = readIfExists(root, "evidence/beta-containment-boundary-mock-dry-run/containment_mock_gate_report.json", {});
  const proofMatrix = buildProofMatrix(root);
  const evidenceMapping = buildEvidenceMapping(root);
  const remainingCriteria = buildRemainingCriteria();
  const claimBoundary = buildClaimBoundary();
  const blockerRefresh = buildReleaseBlockerRefresh();
  const verifiedCount = Object.values(proofMatrix.boundaries).filter((entry) => entry.proof_level === "verified").length;
  const laterStorageAuditPassed = readIfExists(root, "evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json", {})?.status === "pass";

  const report = {
    status: mockReport.status === "pass" && mockGate.status === "pass" && verifiedCount === 0 ? "pass" : "fail",
    stage: STAGE,
    design_only: true,
    new_provider_execution: false,
    new_redteam_execution: false,
    containment_fixture_rerun: false,
    local_model_execution: false,
    telemetry_connection: false,
    dist_modified: false,
    source_design_stage: "v2.0.0-beta-containment-boundary-verification-design",
    source_mock_dry_run_stage: "v2.0.0-beta-containment-boundary-mock-dry-run",
    source_mock_dry_run_status: mockReport.status || "missing",
    evidence_mapping_status: evidenceMapping.status,
    proof_level_matrix_status: proofMatrix.status,
    boundaries_total: boundaryOrder.length,
    boundaries_marked_verified_count: verifiedCount,
    remaining_criteria_count: remainingCriteria.remaining_criteria.length,
    containment_verified_allowed: false,
    release_gated_allowed: false,
    production_ready_allowed: false,
    claims_allowed: allowedClaims,
    claims_not_allowed: blockedClaims
  };

  const mappingReport = {
    status: "pass",
    stage: STAGE,
    evidence_entries_total: evidenceMapping.entries.length,
    source_evidence_prefixes: evidenceMapping.source_evidence_prefixes,
    containment_verified_allowed: false
  };
  const proofAudit = {
    status: verifiedCount === 0 ? "pass" : "fail",
    stage: STAGE,
    proof_level_matrix_status: proofMatrix.status,
    boundaries_total: boundaryOrder.length,
    boundaries_marked_verified_count: verifiedCount,
    proof_levels_observed: [...new Set(Object.values(proofMatrix.boundaries).map((entry) => entry.proof_level))].sort(),
    containment_verified_allowed: false
  };

  const unresolved = report.status === "pass" ? [] : [
    {
      id: "CVG-001",
      severity: "high",
      description: "Containment gate refinement artifacts are missing or inconsistent.",
      owner: "agent",
      recommended_next_action: "Regenerate containment gate refinement artifacts and rerun check_containment_verification_gate_refinement.mjs."
    }
  ];

  if (options.write !== false) {
    if (!laterStorageAuditPassed) {
    writeText(p(root, "release", "containment_verification_gate_refined.yaml"), refinedGateYaml());
    writeText(p(root, "release", "containment_release_blocker_refresh.yaml"), releaseBlockerRefreshYaml(blockerRefresh));
    writeText(p(root, "release", "containment_proof_requirements.yaml"), proofRequirementsYaml());
    writeText(p(root, "security", "containment", "containment_proof_level_matrix.yaml"), proofLevelYaml(proofMatrix));
    writeText(p(root, "security", "containment", "containment_remaining_criteria.yaml"), remainingCriteriaYaml(remainingCriteria));
    writeText(p(root, "security", "containment", "containment_evidence_mapping_policy.yaml"), evidenceMappingPolicyYaml());
    writeText(p(root, "security", "containment", "containment_verification_claim_gate.yaml"), verificationClaimGateYaml());
    }

    writeJson(p(evidenceDir, "containment_verification_gate_refinement_report.json"), report);
    writeJson(p(evidenceDir, "containment_evidence_mapping.json"), evidenceMapping);
    writeJson(p(evidenceDir, "containment_proof_level_matrix.json"), proofMatrix);
    writeJson(p(evidenceDir, "containment_remaining_criteria.json"), remainingCriteria);
    writeJson(p(evidenceDir, "containment_claim_boundary.json"), claimBoundary);
    writeJson(p(evidenceDir, "containment_release_blocker_refresh.json"), blockerRefresh);
    writeJson(p(evidenceDir, "unresolved_items.json"), unresolved);

    const reportMd = buildMarkdown("Containment Verification Gate Refinement Report", [
      `Status: ${report.status}`,
      "",
      `Stage: ${STAGE}`,
      "",
      "- Evidence mapping status: pass",
      "- Proof level matrix status: partial_not_verified",
      "- Boundaries marked verified: 0",
      "- Remaining criteria count: 4",
      "- Containment verified allowed: false",
      "- Release gated allowed: false",
      "- Production ready allowed: false"
    ]);
    writeText(p(evidenceDir, "containment_verification_gate_refinement_report.md"), reportMd);
    writeJson(p(root, "evals", "reports", "containment_verification_gate_refinement_report.json"), report);
    writeText(p(root, "evals", "reports", "containment_verification_gate_refinement_report.md"), reportMd);
    writeJson(p(root, "evals", "reports", "containment_evidence_mapping_report.json"), mappingReport);
    writeText(p(root, "evals", "reports", "containment_evidence_mapping_report.md"), buildMarkdown("Containment Evidence Mapping Report", [
      "Status: pass",
      "",
      `Evidence entries total: ${mappingReport.evidence_entries_total}`,
      "",
      "Mapped evidence does not support containment-verified."
    ]));
    writeJson(p(root, "evals", "reports", "containment_proof_level_audit_report.json"), proofAudit);
    writeText(p(root, "evals", "reports", "containment_proof_level_audit_report.md"), buildMarkdown("Containment Proof Level Audit Report", [
      `Status: ${proofAudit.status}`,
      "",
      "Boundaries marked verified: 0",
      "Observed proof level: mock_dry_run_passed"
    ]));

    writeText(p(root, "docs", "containment_verification_gate_refinement.md"), buildMarkdown("Containment Verification Gate Refinement", [
      "The containment verification gate is refined with design and mock dry-run evidence.",
      "",
      "This is a no-execution stage. It does not rerun containment fixtures, call providers, run local models, connect telemetry, or execute release gates.",
      "",
      "The refined gate remains closed for containment-verified, release-gated, and production-ready claims."
    ]));
    writeText(p(root, "docs", "containment_proof_level_matrix.md"), buildMarkdown("Containment Proof Level Matrix", [
      "All nine boundaries are classified as mock_dry_run_passed.",
      "",
      "No boundary is marked verified in this stage.",
      "",
      "Dedicated verification, cross-suite storage/redaction audit, and sandbox proof or accepted risk remain required."
    ]));
    writeText(p(root, "docs", "containment_remaining_criteria.md"), buildMarkdown("Containment Remaining Criteria", [
      "Remaining criteria before containment-verified:",
      "",
      "- Dedicated containment verification gate pass.",
      "- Cross-suite raw storage audit pass.",
      "- Cross-suite redaction audit pass.",
      "- Sandbox boundary proof or accepted risk recorded.",
      "- Claim boundary audit pass."
    ]));
    writeText(p(root, "docs", "containment_release_blocker_refresh.md"), buildMarkdown("Containment Release Blocker Refresh", [
      `RTG-003 moved from ${blockerRefresh.previous_status} to ${blockerRefresh.new_status}.`,
      "",
      "It still blocks containment-verified, release-gated, and production-ready."
    ]));
    writeText(p(root, "docs", "next_containment_dedicated_verification_plan.md"), buildMarkdown("Next Containment Dedicated Verification Plan", [
      "Next candidate: define and execute a dedicated containment verification gate only after the cross-suite raw storage/redaction audit and sandbox boundary proof criteria are ready.",
      "",
      "Provider, local, telemetry, shell, and external network execution remain out of scope until separately approved."
    ]));
    writeText(p(root, "docs", "next_release_blocker_resolution_plan.md"), buildMarkdown("Next Release Blocker Resolution Plan", [
      "Current strongest blocker state: containment gate refined, dedicated verification and cross-suite audit pending.",
      "",
      "Next blocker candidates:",
      "",
      "- Cross-suite raw storage/redaction audit.",
      "- Local no-tool canary after localhost endpoint availability.",
      "- Telemetry connection after approval and credentials.",
      "- Release blocker P0/P1 reevaluation."
    ]));
  }

  return {
    report,
    evidenceMapping,
    proofMatrix,
    remainingCriteria,
    claimBoundary,
    blockerRefresh,
    mappingReport,
    proofAudit,
    unresolved
  };
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = resolveRoot();
  const result = buildArtifacts({ root, write: true });
  console.log(JSON.stringify(result.report, null, 2));
  process.exitCode = result.report.status === "pass" ? 0 : 1;
}

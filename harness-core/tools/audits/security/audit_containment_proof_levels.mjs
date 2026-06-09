#!/usr/bin/env node
import path from "node:path";
import { buildArtifacts, resolveRoot, STAGE } from "../../refinements/security/refine_containment_verification_gate.mjs";
import { writeJson, writeText } from "../../lib/file_walk.mjs";

const root = resolveRoot();
const result = buildArtifacts({ root, write: true });
const verifiedCount = Object.values(result.proofMatrix.boundaries).filter((entry) => entry.proof_level === "verified").length;
const report = {
  status: verifiedCount === 0 && result.proofMatrix.containment_verified_allowed === false ? "pass" : "fail",
  stage: STAGE,
  proof_level_matrix_status: result.proofMatrix.status,
  boundaries_total: Object.keys(result.proofMatrix.boundaries).length,
  boundaries_marked_verified_count: verifiedCount,
  proof_levels_observed: [...new Set(Object.values(result.proofMatrix.boundaries).map((entry) => entry.proof_level))].sort(),
  containment_verified_allowed: false,
  release_gated_allowed: false,
  production_ready_allowed: false
};
const md = `# Containment Proof Level Audit Report

Status: ${report.status}

Stage: ${STAGE}

- Boundaries total: ${report.boundaries_total}
- Boundaries marked verified: ${report.boundaries_marked_verified_count}
- Containment verified allowed: false
`;

writeJson(path.join(root, "evals", "reports", "containment_proof_level_audit_report.json"), report);
writeText(path.join(root, "evals", "reports", "containment_proof_level_audit_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === "pass" ? 0 : 1;

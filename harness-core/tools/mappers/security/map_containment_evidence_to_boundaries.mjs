#!/usr/bin/env node
import path from "node:path";
import { buildArtifacts, resolveRoot, STAGE } from "../../refinements/security/refine_containment_verification_gate.mjs";
import { writeJson, writeText } from "../../lib/file_walk.mjs";

const root = resolveRoot();
const result = buildArtifacts({ root, write: true });
const report = {
  status: result.evidenceMapping.status,
  stage: STAGE,
  evidence_entries_total: result.evidenceMapping.entries.length,
  source_evidence_prefixes: result.evidenceMapping.source_evidence_prefixes,
  containment_verified_allowed: false,
  release_gated_allowed: false,
  production_ready_allowed: false
};
const md = `# Containment Evidence Mapping Report

Status: ${report.status}

Stage: ${STAGE}

- Evidence entries total: ${report.evidence_entries_total}
- Containment verified allowed: false
- Release gated allowed: false
- Production ready allowed: false
`;

writeJson(path.join(root, "evals", "reports", "containment_evidence_mapping_report.json"), report);
writeText(path.join(root, "evals", "reports", "containment_evidence_mapping_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === "pass" ? 0 : 1;

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseYamlFile } from "./lib/yaml_loader.mjs";
import { writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-redteam-suite-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-redteam-suite-design");

function p(...parts) {
  return path.join(root, ...parts);
}

function categoryRefs(mapping, key) {
  return Object.values(mapping[key] || {}).flatMap((entry) => entry.internal_categories || []);
}

const taxonomy = parseYamlFile(p("security", "redteam", "redteam_taxonomy.yaml"));
const categories = new Set(Object.keys(taxonomy.categories || {}));
const owasp = parseYamlFile(p("security", "redteam", "owasp_genai_mapping.yaml"));
const nist = parseYamlFile(p("security", "redteam", "nist_genai_profile_mapping.yaml"));
const mitre = parseYamlFile(p("security", "redteam", "mitre_atlas_mapping.yaml"));

const owaspRefs = categoryRefs(owasp, "owasp_mapping");
const mitreRefs = categoryRefs(mitre, "mitre_atlas_mapping");
const missingRefs = [...new Set([...owaspRefs, ...mitreRefs].filter((item) => !categories.has(item)))].sort();
const nistFunctions = Object.keys(nist.nist_genai_profile_mapping || {});
const report = {
  status: missingRefs.length === 0 ? "pass" : "fail",
  stage: STAGE,
  design_only: true,
  actual_redteam_execution: false,
  provider_execution: false,
  local_model_execution: false,
  external_side_effects: false,
  owasp_mapping_exists: fs.existsSync(p("security", "redteam", "owasp_genai_mapping.yaml")),
  nist_mapping_exists: fs.existsSync(p("security", "redteam", "nist_genai_profile_mapping.yaml")),
  mitre_mapping_exists: fs.existsSync(p("security", "redteam", "mitre_atlas_mapping.yaml")),
  taxonomy_categories_total: categories.size,
  owasp_risks_total: Object.keys(owasp.owasp_mapping || {}).length,
  nist_functions_total: nistFunctions.length,
  mitre_tactics_total: Object.keys(mitre.mitre_atlas_mapping || {}).length,
  missing_internal_category_references: missingRefs,
  source_references: [
    owasp.source,
    nist.source,
    mitre.source
  ].filter(Boolean),
  claims_not_allowed: [
    "redteam-executed",
    "redteam-passed",
    "containment-verified",
    "release-gated",
    "production-ready",
    "production-monitored"
  ]
};

const md = `# Redteam Mapping Report

Status: ${report.status}

Stage: ${STAGE}

- OWASP mapping exists: ${report.owasp_mapping_exists}
- NIST mapping exists: ${report.nist_mapping_exists}
- MITRE mapping exists: ${report.mitre_mapping_exists}
- Taxonomy categories: ${report.taxonomy_categories_total}
- OWASP risks mapped: ${report.owasp_risks_total}
- NIST functions mapped: ${report.nist_functions_total}
- MITRE tactics mapped: ${report.mitre_tactics_total}
- Missing internal category references: ${report.missing_internal_category_references.length}

This mapping is a design artifact and does not allow redteam execution, containment, production, or release gate claims.
`;

writeJson(path.join(evidenceDir, "redteam_mapping_summary.json"), report);
writeJson(p("evals", "reports", "redteam_mapping_report.json"), report);
writeText(p("evals", "reports", "redteam_mapping_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

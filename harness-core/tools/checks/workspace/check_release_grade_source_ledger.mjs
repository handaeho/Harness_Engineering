#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createAjv, loadSchema, validateWithSchema } from "../../lib/json_schema_validator.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const ledgerRel = "core/source_authority/release_grade_source_ledger.json";
const schemaRel = "schemas/source_authority_ledger.schema.json";
const evidenceDirRel = "evidence/release-grade-source-ledger";
const evalReportRel = "evals/reports/release_grade_source_ledger_report.json";

const requiredIds = [
  "RGS-OPENAI-AGENTS-TRACING",
  "RGS-OPENAI-AGENTS-TOOLS",
  "RGS-GEMINI-FUNCTION-CALLING",
  "RGS-GEMINI-STRUCTURED-OUTPUT",
  "RGS-GEMINI-SAFETY",
  "RGS-GEMINI-OPENAI-COMPAT",
  "RGS-OTEL-GENAI",
  "RGS-LANGFUSE-TRACING",
  "RGS-OWASP-LLM-TOP10-2025",
  "RGS-NIST-AI-600-1"
];

const allowedAuthorityPrefixes = [
  "official_openai_",
  "official_google_",
  "official_opentelemetry_",
  "official_langfuse_",
  "official_owasp_",
  "official_nist_"
];

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function writeReport(report) {
  writeJson(p(`${evidenceDirRel}/release_grade_source_ledger_report.json`), report);
  writeJson(p(`${evidenceDirRel}/unresolved_items.json`), {
    status: report.status,
    stage: report.stage,
    unresolved_items_count: report.failures.length,
    unresolved_items: report.failures
  });
  writeJson(p(evalReportRel), report);
  writeText(p(evalReportRel.replace(/\.json$/, ".md")), `# Release Grade Source Ledger Report

Status: ${report.status}

- Stage: ${report.stage}
- Ledger: ${ledgerRel}
- Sources: ${report.source_count}
- Failures: ${report.failures.length}
- Provider execution: false
- Local model execution: false
- Telemetry sink write: false
- Claims opened: none
`);
}

const checks = [];
addCheck(checks, "ledger file exists", fs.existsSync(p(ledgerRel)), { path: ledgerRel });
addCheck(checks, "schema file exists", fs.existsSync(p(schemaRel)), { path: schemaRel });

let ledger = null;
try {
  ledger = readJson(p(ledgerRel));
  addCheck(checks, "ledger JSON parses", true, { path: ledgerRel });
} catch (error) {
  addCheck(checks, "ledger JSON parses", false, { error: error.message });
}

if (ledger) {
  try {
    const ajv = createAjv();
    validateWithSchema(ajv, loadSchema(p(schemaRel)), ledger, ledgerRel);
    addCheck(checks, "ledger validates against source schema", true, { schema: schemaRel });
  } catch (error) {
    addCheck(checks, "ledger validates against source schema", false, { error: error.message });
  }

  const ids = new Set((ledger.sources || []).map((source) => source.id));
  const missingIds = requiredIds.filter((id) => !ids.has(id));
  addCheck(checks, "required source ids present", missingIds.length === 0, { missing: missingIds });

  const duplicateIds = [...ids].filter((id) => (ledger.sources || []).filter((source) => source.id === id).length > 1);
  addCheck(checks, "source ids are unique", duplicateIds.length === 0, { duplicate_ids: duplicateIds });

  const untrustedAuthorities = (ledger.sources || []).filter((source) => !allowedAuthorityPrefixes.some((prefix) => source.authority.startsWith(prefix)));
  addCheck(checks, "authorities are official source classes", untrustedAuthorities.length === 0, {
    untrusted: untrustedAuthorities.map((source) => ({ id: source.id, authority: source.authority }))
  });

  const boundaryViolations = (ledger.sources || []).filter((source) => {
    const text = `${source.claim_boundary} ${(source.supports || []).join(" ")}`.toLowerCase();
    return /production-ready is open|stable is open|release-gated is open|provider-verified is open|adapter-checked is open/.test(text);
  });
  addCheck(checks, "claim boundaries do not open strong claims", boundaryViolations.length === 0, {
    violations: boundaryViolations.map((source) => source.id)
  });

  addCheck(checks, "checked_on matches current verification date", ledger.checked_on === "2026-06-12", {
    checked_on: ledger.checked_on
  });

  const incompleteSourceShape = (ledger.sources || []).filter((source) => ![
    "id",
    "url",
    "authority",
    "checked_on",
    "observed_last_updated",
    "supports",
    "applies_to",
    "claim_boundary"
  ].every((field) => Object.hasOwn(source, field)));
  addCheck(checks, "source entries use release-grade ledger shape", incompleteSourceShape.length === 0, {
    incomplete_sources: incompleteSourceShape.map((source) => source.id || "(missing id)")
  });

  const sourceDateMismatches = (ledger.sources || []).filter((source) => source.checked_on !== ledger.checked_on);
  addCheck(checks, "source checked_on matches ledger checked_on", sourceDateMismatches.length === 0, {
    mismatches: sourceDateMismatches.map((source) => ({ id: source.id, checked_on: source.checked_on }))
  });
}

const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: "v2.0.0-release-grade-source-ledger",
  generated_at: new Date().toISOString(),
  checker: "check_release_grade_source_ledger.mjs",
  ledger_path: ledgerRel,
  schema_path: schemaRel,
  source_count: ledger?.sources?.length || 0,
  required_source_ids: requiredIds,
  checks,
  failures,
  provider_execution: false,
  local_model_execution: false,
  telemetry_sink_write: false,
  openai_provider_rerun: false,
  claims_opened: [],
  claim_boundary_note: "Source-ledger validation opens no claims by itself. Current provider-verified allowance is determined only by the provider-verified gate.",
  blocked_claims_maintained: [
    "adapter-checked",
    "production-ready",
    "stable",
    "release-gated",
    "bare release-gated"
  ]
};

writeReport(report);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

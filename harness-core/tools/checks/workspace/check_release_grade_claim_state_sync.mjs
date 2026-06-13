#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { writeJson, writeText } from "../../lib/file_walk.mjs";
import {
  CLAIM_SYNC_STAGE,
  FINAL_CLAIM_STATE_PATH,
  compareClaimRecord,
  deriveReleaseGradeClaimState
} from "../../lib/release_grade_claim_state.mjs";

const EVIDENCE_DIR = "evidence/release-grade-claim-state-sync";

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function readTextIfExists(relPath) {
  const file = p(relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile()
    ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")
    : null;
}

function readJsonIfExists(relPath) {
  const text = readTextIfExists(relPath);
  return text === null ? null : JSON.parse(text);
}

function readYamlIfExists(relPath) {
  const text = readTextIfExists(relPath);
  return text === null ? null : parseYaml(text);
}

function makeUnresolved(comparisons) {
  const items = [];
  for (const [record, comparison] of Object.entries(comparisons)) {
    for (const failure of comparison.failures) {
      items.push({
        id: `${record}_${failure.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
        status: "fail",
        record,
        reason: failure.name,
        detail: failure.detail
      });
    }
  }
  return items;
}

const currentStateYaml = readYamlIfExists("CURRENT_STATE.yaml");
const currentStateJson = readJsonIfExists("CURRENT_STATE.json");
const finalClaimState = readJsonIfExists(FINAL_CLAIM_STATE_PATH);
const syncReport = readJsonIfExists(`${EVIDENCE_DIR}/release_grade_claim_state_sync_report.json`);
const expected = deriveReleaseGradeClaimState(root, {
  currentStateYaml,
  currentStateJson,
  finalClaimState
});
const comparisons = {
  current_state_yaml: compareClaimRecord(currentStateYaml, expected),
  current_state_json: compareClaimRecord(currentStateJson, expected),
  final_release_claim_state: compareClaimRecord(finalClaimState, expected, { includeFlags: true })
};
const unresolved = makeUnresolved(comparisons);
const status = unresolved.length === 0 ? "pass" : "fail";
const report = {
  status,
  stage: `${CLAIM_SYNC_STAGE}-check`,
  generated_at: new Date().toISOString(),
  checker: "check_release_grade_claim_state_sync.mjs",
  sync_report_status: syncReport?.status || null,
  sync_report_generated_at: syncReport?.generated_at || null,
  expected_claim_state: {
    allowed_claims: expected.allowed_claims,
    blocked_claims: expected.blocked_claims,
    canonicalization_rules: expected.canonicalization_rules,
    provider_verified_allowed: expected.flags.provider_verified_allowed,
    adapter_checked_allowed: expected.flags.adapter_checked_allowed,
    production_ready_allowed: expected.flags.production_ready_allowed,
    stable_allowed: expected.flags.stable_allowed,
    release_gated_allowed: expected.flags.release_gated_allowed,
    bare_release_gated_allowed: expected.flags.bare_release_gated_allowed
  },
  comparisons,
  failures: unresolved,
  unresolved_items_count: unresolved.length,
  live_execution: {
    provider_call: false,
    local_model_execution: false,
    telemetry_sink_write: false,
    raw_request_storage: false,
    raw_response_storage: false,
    secret_storage: false
  },
  next_action: status === "pass"
    ? "No SOR claim-state sync action is required."
    : "Run npm run apply:release-grade-claim-state-sync after reviewing gate evidence, then rerun this checker."
};

const md = `# Release-grade Claim State Sync Check

Status: ${status}

- Sync report status: ${report.sync_report_status || "missing"}
- Provider-verified allowed: ${report.expected_claim_state.provider_verified_allowed}
- Adapter-checked allowed: ${report.expected_claim_state.adapter_checked_allowed}
- Production-ready allowed: ${report.expected_claim_state.production_ready_allowed}
- Stable allowed: ${report.expected_claim_state.stable_allowed}
- Release-gated allowed: ${report.expected_claim_state.release_gated_allowed}
- Failures: ${unresolved.length}
`;

writeJson(p(`${EVIDENCE_DIR}/release_grade_claim_state_sync_check_report.json`), report);
writeText(p(`${EVIDENCE_DIR}/release_grade_claim_state_sync_check_report.md`), md);
writeJson(p("evals/reports/release_grade_claim_state_sync_check_report.json"), report);
writeText(p("evals/reports/release_grade_claim_state_sync_check_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);

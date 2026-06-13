#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { writeJson, writeText } from "../../lib/file_walk.mjs";
import {
  CLAIM_SYNC_STAGE,
  FINAL_CLAIM_STATE_PATH,
  applyExpectedClaimState,
  compareClaimRecord,
  deriveReleaseGradeClaimState,
  finalClaimStateMarkdown
} from "../../lib/release_grade_claim_state.mjs";

const EVIDENCE_DIR = "evidence/release-grade-claim-state-sync";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
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

function writeYaml(relPath, value) {
  const file = p(relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stringifyYaml(value), "utf8");
}

function source(relPath, record = null) {
  return {
    path: relPath,
    exists: record !== null,
    status: record?.status || null,
    generated_at: record?.generated_at || null
  };
}

function makeUnresolved(comparisons) {
  const items = [];
  for (const [record, comparison] of Object.entries(comparisons)) {
    for (const failure of comparison.failures) {
      items.push({
        id: `${record}_${failure.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
        status: "hold",
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
const expected = deriveReleaseGradeClaimState(root, {
  currentStateYaml,
  currentStateJson,
  finalClaimState
});

const beforeComparisons = {
  current_state_yaml: compareClaimRecord(currentStateYaml, expected),
  current_state_json: compareClaimRecord(currentStateJson, expected),
  final_release_claim_state: compareClaimRecord(finalClaimState, expected, { includeFlags: true })
};
const beforeUnresolved = makeUnresolved(beforeComparisons);
const syncRequired = beforeUnresolved.length > 0;

let afterComparisons = beforeComparisons;
let afterUnresolved = beforeUnresolved;
let applyPerformed = false;
if (apply && syncRequired) {
  const nextCurrentStateYaml = applyExpectedClaimState(currentStateYaml || {}, expected);
  const nextCurrentStateJson = applyExpectedClaimState(currentStateJson || {}, expected);
  const nextFinalClaimState = applyExpectedClaimState(finalClaimState || { status: "recorded" }, expected, { includeFlags: true });
  writeYaml("CURRENT_STATE.yaml", nextCurrentStateYaml);
  writeJson(p("CURRENT_STATE.json"), nextCurrentStateJson);
  writeJson(p(FINAL_CLAIM_STATE_PATH), nextFinalClaimState);
  writeText(p("docs/claims/final_release_claim_state.ko.md"), finalClaimStateMarkdown(nextFinalClaimState));
  applyPerformed = true;
  afterComparisons = {
    current_state_yaml: compareClaimRecord(nextCurrentStateYaml, expected),
    current_state_json: compareClaimRecord(nextCurrentStateJson, expected),
    final_release_claim_state: compareClaimRecord(nextFinalClaimState, expected, { includeFlags: true })
  };
  afterUnresolved = makeUnresolved(afterComparisons);
}

const aligned = afterUnresolved.length === 0;
const status = aligned ? "pass" : apply ? "fail" : "hold";
const report = {
  status,
  stage: CLAIM_SYNC_STAGE,
  generated_at: new Date().toISOString(),
  mode: apply ? "apply" : "check_only",
  apply_requested: apply,
  apply_performed: applyPerformed,
  sync_required_before_apply: syncRequired,
  sync_required_after_apply: afterUnresolved.length > 0,
  claim_update_rule: "SOR claim membership is derived from release-grade provider, Ollama adapter evidence package, and general release gate evidence. local-vllm-adapter-checked remains a version2 follow-up.",
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
  evidence_inputs: expected.flags.evidence_inputs,
  sor_inputs: {
    current_state_yaml: source("CURRENT_STATE.yaml", currentStateYaml),
    current_state_json: source("CURRENT_STATE.json", currentStateJson),
    final_release_claim_state: source(FINAL_CLAIM_STATE_PATH, finalClaimState)
  },
  comparisons_before_apply: beforeComparisons,
  comparisons_after_apply: afterComparisons,
  unresolved_items_count: afterUnresolved.length,
  unresolved_items: afterUnresolved,
  target_files: [
    "CURRENT_STATE.yaml",
    "CURRENT_STATE.json",
    FINAL_CLAIM_STATE_PATH,
    "docs/claims/final_release_claim_state.ko.md"
  ],
  live_execution: {
    provider_call: false,
    local_model_execution: false,
    telemetry_sink_write: false,
    raw_request_storage: false,
    raw_response_storage: false,
    secret_storage: false
  }
};

const md = `# Release-grade Claim State Sync

Status: ${status}

- Mode: ${report.mode}
- Apply performed: ${applyPerformed}
- Sync required before apply: ${syncRequired}
- Sync required after apply: ${report.sync_required_after_apply}
- Provider-verified allowed: ${report.expected_claim_state.provider_verified_allowed}
- Adapter-checked allowed: ${report.expected_claim_state.adapter_checked_allowed}
- Production-ready allowed: ${report.expected_claim_state.production_ready_allowed}
- Stable allowed: ${report.expected_claim_state.stable_allowed}
- Release-gated allowed: ${report.expected_claim_state.release_gated_allowed}
- Live execution: false
`;

writeJson(p(`${EVIDENCE_DIR}/release_grade_claim_state_sync_report.json`), report);
writeText(p(`${EVIDENCE_DIR}/release_grade_claim_state_sync_report.md`), md);
writeJson(p(`${EVIDENCE_DIR}/unresolved_items.json`), {
  status,
  stage: CLAIM_SYNC_STAGE,
  unresolved_items_count: afterUnresolved.length,
  unresolved_items: afterUnresolved
});
writeJson(p("evals/reports/release_grade_claim_state_sync_report.json"), report);
writeText(p("evals/reports/release_grade_claim_state_sync_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);

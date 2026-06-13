#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-vllm-operator-packet";
const EVIDENCE_DIR = "release-grade-vllm-operator-packet";
const PACKAGE_REPORT = "evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json";
const PACKAGE_CHECKER = "tools/checks/adapters/check_release_grade_vllm_evidence_package.mjs";
const REQUIRED_ENV_NAMES = [
  "VLLM_ENDPOINT_URL",
  "VLLM_MODEL",
  "VLLM_AUTH_REQUIRED",
  "VLLM_API_KEY"
];
const REQUIRED_SCRIPTS = {
  "preflight:vllm-operator-env": "node tools/checks/local/check_vllm_operator_env_guard.mjs --strict",
  "preflight:vllm-live-canary": "node tools/checks/local/check_post_rc_local_endpoint_readiness_preflight.mjs --provider=vllm",
  "canary:vllm-no-tool": "node tools/runners/local/run_vllm_no_tool_canary.mjs",
  "check:vllm-no-tool": "node tools/checks/local/check_vllm_no_tool_canary.mjs",
  "run:vllm-adapter-conformance": "node tools/runners/adapters/run_vllm_adapter_conformance_local_execution.mjs",
  "check:vllm-adapter-conformance": "node tools/checks/adapters/check_vllm_adapter_conformance_local_execution.mjs",
  "run:release-grade-adapter-coverage": "node tools/runners/adapters/run_release_grade_adapter_coverage_completion.mjs",
  "check:release-grade-adapter-coverage": "node tools/checks/adapters/check_release_grade_adapter_coverage_completion.mjs",
  "check:release-grade-adapter-vllm": "node tools/checks/adapters/check_release_grade_adapter_vllm_preflight.mjs",
  "run:release-grade-adapter-checked-final": "node tools/runners/adapters/run_release_grade_adapter_checked_final_gate.mjs",
  "check:release-grade-adapter-checked-final": "node tools/checks/adapters/check_release_grade_adapter_checked_final_gate.mjs",
  "run:release-grade-claim-state-sync": "node tools/runners/workspace/run_release_grade_claim_state_sync.mjs",
  "apply:release-grade-claim-state-sync": "node tools/runners/workspace/run_release_grade_claim_state_sync.mjs --apply",
  "check:release-grade-claim-state-sync": "node tools/checks/workspace/check_release_grade_claim_state_sync.mjs",
  "check:final-precommit-convergence": "node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs",
  "general-release-grade-gate": "npm run run:release-grade-general-release && npm run check:release-grade-general-release",
  "check:release-grade-vllm-evidence-package": `node ${PACKAGE_CHECKER}`,
  "local-vllm-adapter-checked-v2-gate": "npm run preflight:vllm-operator-env",
  "local-vllm-release-grade-v2-gate": "npm run local-vllm-adapter-checked-v2-gate",
  "vllm-release-grade-evidence-gate": "npm run local-vllm-release-grade-v2-gate"
};
const EXPECTED_MANUAL_COMMANDS = [
  "npm run preflight:vllm-operator-env",
  "npm run preflight:vllm-live-canary",
  "npm run canary:vllm-no-tool",
  "npm run check:vllm-no-tool",
  "npm run run:vllm-adapter-conformance",
  "npm run check:vllm-adapter-conformance",
  "npm run check:release-grade-adapter-vllm",
  "npm run check:release-grade-vllm-evidence-package",
  "npm run general-release-grade-gate",
  "npm run check:release-grade-vllm-evidence-package",
  "npm run apply:release-grade-claim-state-sync",
  "npm run check:release-grade-claim-state-sync",
  "npm run check:final-precommit-convergence",
  "npm run general-release-grade-gate",
  "npm run check:release-grade-vllm-evidence-package",
  "npm run apply:release-grade-claim-state-sync",
  "npm run check:release-grade-claim-state-sync",
  "npm run check:final-precommit-convergence"
];
const REQUIRED_SUBMISSION_FILES = [
  "evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_report.json",
  "evidence/post-stable-vllm-endpoint-readiness-preflight/local_endpoint_readiness_preflight_report.json",
  "evidence/post-stable-vllm-endpoint-readiness-preflight/endpoint_probe_summary.json",
  "evidence/post-stable-local-vllm-no-tool-canary/vllm_no_tool_canary_report.json",
  "evals/reports/vllm_no_tool_canary_check_report.json",
  "evidence/post-stable-vllm-adapter-conformance-local-execution/vllm_adapter_conformance_report.json",
  "evals/reports/vllm_adapter_conformance_check_report.json",
  "evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json",
  "evals/reports/release_grade_adapter_coverage_completion_check_report.json",
  "evidence/release-grade-adapter-vllm-preflight/release_grade_adapter_vllm_preflight_report.json",
  "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json",
  "evals/reports/release_grade_adapter_checked_final_gate_check_report.json",
  "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_report.json",
  "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_check_report.json",
  "evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json",
  "evals/reports/release_grade_general_release_gate_check_report.json",
  PACKAGE_REPORT
];
const REQUIRED_DOCS = [
  "docs/adapters/release_grade_vllm_operator_env_guard.md",
  "docs/adapters/release_grade_adapter_vllm_preflight.md",
  "docs/adapters/release_grade_vllm_evidence_package.md",
  "docs/workspace/release_grade_claim_state_sync.md",
  "docs/release/release_grade_general_release_gate.md",
  "docs/workspace/release_grade_reinforcement_completion_audit.md"
];
const BLOCKED_CLAIMS_MAINTAINED = [
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function includesAll(values, required) {
  const set = new Set(values || []);
  return required.every((item) => set.has(item));
}

function commandsInOrder(commands, expected) {
  if (!Array.isArray(commands)) return false;
  let cursor = 0;
  for (const command of commands) {
    if (command === expected[cursor]) cursor += 1;
    if (cursor === expected.length) return true;
  }
  return false;
}

function scriptContainsOrdered(script, tokens) {
  if (typeof script !== "string") return false;
  let lastIndex = -1;
  for (const token of tokens) {
    const index = script.indexOf(token, lastIndex + 1);
    if (index <= lastIndex) return false;
    lastIndex = index;
  }
  return true;
}

const packageJson = readJsonIfExists("package.json");
const scripts = packageJson?.scripts || {};
const packageReport = readJsonIfExists(PACKAGE_REPORT);
const operatorPacket = packageReport?.operator_packet || {};
const checks = [];

for (const [name, expected] of Object.entries(REQUIRED_SCRIPTS)) {
  addCheck(checks, `package script: ${name}`, typeof scripts[name] === "string" && scripts[name].includes(expected), {
    expected_fragment: expected,
    actual: scripts[name] || null
  });
}

addCheck(
  checks,
  "local vllm adapter v2 gate starts with vllm operator guard",
  typeof scripts["local-vllm-adapter-checked-v2-gate"] === "string"
    && scripts["local-vllm-adapter-checked-v2-gate"].startsWith("npm run preflight:vllm-operator-env"),
  { actual: scripts["local-vllm-adapter-checked-v2-gate"] || null }
);
addCheck(
  checks,
  "full vllm v2 release gate runs adapter, package, sync, refreshed general, package, then final sync",
  scriptContainsOrdered(scripts["local-vllm-release-grade-v2-gate"], [
    "npm run local-vllm-adapter-checked-v2-gate",
    "npm run general-release-grade-gate",
    "npm run check:release-grade-vllm-evidence-package",
    "npm run apply:release-grade-claim-state-sync",
    "npm run check:release-grade-claim-state-sync",
    "npm run check:final-precommit-convergence",
    "npm run general-release-grade-gate",
    "npm run check:release-grade-vllm-evidence-package",
    "npm run apply:release-grade-claim-state-sync",
    "npm run check:release-grade-claim-state-sync",
    "npm run check:final-precommit-convergence"
  ]),
  { actual: scripts["local-vllm-release-grade-v2-gate"] || null }
);
addCheck(
  checks,
  "vllm release-grade evidence gate points to v2 flow",
  scripts["vllm-release-grade-evidence-gate"] === "npm run local-vllm-release-grade-v2-gate",
  { actual: scripts["vllm-release-grade-evidence-gate"] || null }
);
addCheck(checks, "vllm evidence package report exists", Boolean(packageReport), {
  path: PACKAGE_REPORT
});
addCheck(checks, "vllm evidence package status is pass or hold", ["pass", "hold"].includes(packageReport?.status), {
  status: packageReport?.status || null
});
addCheck(checks, "operator packet required env is complete", includesAll(
  (operatorPacket.required_env || []).map((item) => item.name),
  REQUIRED_ENV_NAMES
), {
  required_env_names: (operatorPacket.required_env || []).map((item) => item.name)
});
addCheck(checks, "operator packet full command is canonical", operatorPacket.full_run_command === "npm run vllm-release-grade-evidence-gate", {
  full_run_command: operatorPacket.full_run_command || null
});
addCheck(checks, "operator packet manual commands are complete and ordered", commandsInOrder(
  operatorPacket.manual_run_commands,
  EXPECTED_MANUAL_COMMANDS
), {
  manual_run_commands: operatorPacket.manual_run_commands || []
});
addCheck(checks, "operator packet requires general gate refresh after adapter", operatorPacket.general_release_gate_refresh_required_after_adapter_checked === true, {
  general_release_gate_refresh_required_after_adapter_checked: operatorPacket.general_release_gate_refresh_required_after_adapter_checked ?? null
});
addCheck(checks, "operator packet requires post-package claim-state sync and final sync last", operatorPacket.evidence_package_command_must_run_last === false
  && operatorPacket.claim_state_sync_command_must_run_after_package === true
  && operatorPacket.final_sync_command_must_run_last === true, {
  evidence_package_command_must_run_last: operatorPacket.evidence_package_command_must_run_last ?? null,
  claim_state_sync_command_must_run_after_package: operatorPacket.claim_state_sync_command_must_run_after_package ?? null,
  final_sync_command_must_run_last: operatorPacket.final_sync_command_must_run_last ?? null
});
addCheck(checks, "submission file list is complete", includesAll(packageReport?.submission_files, REQUIRED_SUBMISSION_FILES), {
  missing_submission_files: REQUIRED_SUBMISSION_FILES.filter((file) => !new Set(packageReport?.submission_files || []).has(file))
});
addCheck(checks, "redaction policy forbids raw and secret storage", packageReport?.redaction_policy?.raw_request_storage_allowed === false
  && packageReport?.redaction_policy?.raw_response_storage_allowed === false
  && packageReport?.redaction_policy?.secret_storage_allowed === false, {
  redaction_policy: packageReport?.redaction_policy || null
});
addCheck(checks, "operator packet checker opens no claims", !packageReport?.allowed_claims_after_pass?.includes("production-ready")
  && !packageReport?.allowed_claims_after_pass?.includes("stable")
  && !packageReport?.allowed_claims_after_pass?.includes("release-gated"), {
  package_allowed_claims_after_pass: packageReport?.allowed_claims_after_pass || []
});

for (const doc of REQUIRED_DOCS) {
  addCheck(checks, `doc exists: ${doc}`, exists(doc), { path: doc });
}

const failures = checks.filter((check) => check.status !== "pass");
const status = failures.length === 0 ? "pass" : "fail";
const unresolvedItems = failures.map((failure, index) => ({
  id: `VLLM-OPERATOR-PACKET-${String(index + 1).padStart(3, "0")}`,
  severity: "medium",
  status: "hold",
  description: `vLLM operator packet invariant failed: ${failure.name}`,
  detail: failure.detail,
  blocks_adapter_checked_execution_review: true
}));
const report = {
  status,
  stage: STAGE,
  generated_at: new Date().toISOString(),
  purpose: "No-live validation of the operator packet needed to collect and submit vLLM adapter evidence.",
  live_execution: {
    provider_call: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    telemetry_sink_write: false
  },
  package_report: {
    path: PACKAGE_REPORT,
    exists: Boolean(packageReport),
    status: packageReport?.status || null,
    missing_or_incomplete_artifacts: packageReport?.missing_or_incomplete_artifacts?.length ?? null,
    stale_or_unordered_artifacts: packageReport?.stale_or_unordered_artifacts?.length ?? null
  },
  operator_packet: {
    required_env: operatorPacket.required_env || [],
    full_run_command: operatorPacket.full_run_command || null,
    manual_run_commands: operatorPacket.manual_run_commands || [],
    submission_files: packageReport?.submission_files || []
  },
  claim_boundary: {
    claims_opened: [],
    blocked_claims_maintained: BLOCKED_CLAIMS_MAINTAINED,
    claim_update_rule: "This packet check opens no provider, adapter, or general release claim."
  },
  checks,
  failures,
  unresolved_items_count: unresolvedItems.length,
  next_actions: status === "pass"
    ? [
      "Use npm run vllm-release-grade-evidence-gate after VLLM_ENDPOINT_URL, VLLM_MODEL, and VLLM_AUTH_REQUIRED are set.",
      "If the wrapper stops, rerun npm run check:release-grade-vllm-evidence-package and inspect the first missing artifact.",
      "Submit only the files listed in operator_packet.submission_files; do not include raw request bodies, raw response bodies, auth headers, or secrets."
    ]
    : [
      "Repair the failed operator packet invariant before asking an operator to collect vLLM evidence.",
      "Rerun npm run check:release-grade-vllm-evidence-package before this checker if the package report is missing or stale."
    ]
};
const md = `# Release-grade vLLM Operator Packet

Status: ${status}

- Package report: ${report.package_report.exists ? report.package_report.status : "missing"}
- Missing or incomplete vLLM artifacts: ${report.package_report.missing_or_incomplete_artifacts ?? "unknown"}
- Stale or unordered vLLM artifacts: ${report.package_report.stale_or_unordered_artifacts ?? "unknown"}
- Claims opened by this packet: none
- Blockers: ${unresolvedItems.length}

## Full Command

\`\`\`bash
${operatorPacket.full_run_command || "npm run vllm-release-grade-evidence-gate"}
\`\`\`

## Manual Command Sequence

${(operatorPacket.manual_run_commands || EXPECTED_MANUAL_COMMANDS).map((command, index) => `${index + 1}. \`${command}\``).join("\n")}
`;

writeJson(p("evidence", EVIDENCE_DIR, "vllm_operator_packet_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "vllm_operator_packet_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), {
  status,
  stage: STAGE,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
});
writeJson(p("evals", "reports", "release_grade_vllm_operator_packet_report.json"), report);
writeText(p("evals", "reports", "release_grade_vllm_operator_packet_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);

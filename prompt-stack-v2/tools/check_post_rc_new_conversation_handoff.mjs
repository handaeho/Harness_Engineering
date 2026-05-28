#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-openai-only-stable-new-conversation-handoff";
const SCOPE = "openai_only_post_rc";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.telemetry-connected+production-monitored+openai-only-production-ready+openai-only-stable";
const EVIDENCE_DIR = "evidence/post-rc-new-conversation-handoff";
const ALLOWED_CLAIMS = [
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];
const BLOCKED_CLAIMS = [
  "stable",
  "production-ready",
  "release-gated",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified"
];
const HANDOFF_RECORD_CLAIMS = [
  "post-rc-new-conversation-handoff-recorded",
  "post-rc-new-conversation-prompt-recorded",
  "post-rc-new-conversation-evidence-indexed",
  "post-rc-new-conversation-next-options-recorded"
];
const REQUIRED_EVIDENCE_GROUPS = [
  "rc1-agents-md-system-of-record-alignment",
  "rc1-openai-scope-bundle",
  "rc1-release-gate-actual-openai-scope",
  "rc1-post-release-gate-review",
  "rc1-final-handoff",
  "post-rc-telemetry-connection",
  "post-rc-telemetry-connection-result-review",
  "post-rc-production-monitoring-final-gate",
  "post-rc-openai-only-production-ready-scope-decision",
  "post-rc-openai-only-stable-scope-decision",
  "post-rc-openai-only-stable-final-handoff",
  "v36-baseline-owner-approved-refresh"
];
const REQUIRED_FILES = [
  "NEW_CONVERSATION_HANDOFF.ko.md",
  "NEW_CONVERSATION_PROMPT.ko.md",
  "release/post_rc_new_conversation_handoff_scope.yaml",
  "release/post_rc_new_conversation_handoff_claim_state.yaml",
  "release/post_rc_new_conversation_next_options.yaml",
  "tools/build_post_rc_new_conversation_handoff.mjs",
  "tools/check_post_rc_new_conversation_handoff.mjs",
  "evals/suites/post_rc_new_conversation_handoff.yaml",
  "evals/reports/post_rc_new_conversation_handoff_report.json",
  "evals/reports/post_rc_new_conversation_handoff_report.md",
  "evals/reports/post_rc_new_conversation_handoff_gate_report.json",
  "evals/reports/post_rc_new_conversation_handoff_gate_report.md",
  `${EVIDENCE_DIR}/new_conversation_handoff_report.json`,
  `${EVIDENCE_DIR}/new_conversation_handoff_report.md`,
  `${EVIDENCE_DIR}/new_conversation_prompt_snapshot.md`,
  `${EVIDENCE_DIR}/new_conversation_claim_state.json`,
  `${EVIDENCE_DIR}/new_conversation_evidence_pointer_index.json`,
  `${EVIDENCE_DIR}/new_conversation_next_options.json`,
  `${EVIDENCE_DIR}/new_conversation_deferred_paths.json`,
  `${EVIDENCE_DIR}/new_conversation_gate_report.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/new_conversation_handoff.md",
  "docs/new_conversation_prompt.md",
  "docs/new_conversation_next_options.md"
];
const PRIOR_BASELINE_REFRESH_FILES = [
  "prompt-stack-v2/evidence/v36-baseline/checksums.json",
  "prompt-stack-v2/evidence/v36-baseline/file_inventory.json"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const workspaceRoot = path.basename(root) === "prompt-stack-v2" ? path.dirname(root) : repoRoot;

function p(...parts) {
  return path.join(root, ...parts);
}

function e(...parts) {
  return p(...EVIDENCE_DIR.split("/"), ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonIfExists(relPath) {
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

function readTextIfExists(relPath) {
  try {
    return readText(p(...relPath.split("/")));
  } catch {
    return "";
  }
}

function runNode(script) {
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = spawnSync("node", [path.join("tools", script)], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 100 * 1024 * 1024
    });
    let parsed = null;
    try {
      parsed = JSON.parse((result.stdout || "").trim());
    } catch {
      parsed = null;
    }
    last = {
      script,
      exit_code: result.status,
      status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
      parsed,
      attempts: attempt,
      stdout_excerpt: (result.stdout || "").trim().slice(0, 2000),
      stderr_excerpt: (result.stderr || "").trim().slice(0, 2000)
    };
    if (result.status === 0) return last;
    sleep(500);
  }
  return last;
}

function sleep(ms) {
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  Atomics.wait(view, 0, 0, ms);
}

function runNodeWithRetries(script, options = {}) {
  const attempts = options.attempts || 3;
  const retryScripts = options.retryScripts || [];
  const results = [];
  let last = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    last = runNode(script);
    results.push({
      attempt,
      exit_code: last.exit_code,
      status: last.status,
      failure_names: Array.isArray(last.parsed?.failures)
        ? last.parsed.failures.map((failure) => failure.name)
        : []
    });
    if (last.exit_code === 0 && last.status === "pass") {
      return { ...last, attempts: results };
    }

    for (const retryScript of retryScripts) {
      runNode(retryScript);
    }
    sleep(1000);
  }

  return { ...last, attempts: results };
}

function gitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function statusPaths(status) {
  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]+\s+/, ""));
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function includesAll(haystack, needles) {
  return needles.every((needle) => haystack.includes(needle));
}

function falseFlags(value, flags) {
  return flags.every((flag) => value?.[flag] === false);
}

function markdown(gate) {
  return `# New Conversation Handoff Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Scope: ${gate.scope}
- Document language: ${gate.document_language}
- Handoff document created: ${gate.handoff_document_created}
- Handoff prompt created: ${gate.handoff_prompt_created}
- Can claim post-rc-openai-only-stable: ${gate.can_claim_post_rc_openai_only_stable}
- Can claim general stable: ${gate.can_claim_general_stable}
- Can claim general production-ready: ${gate.can_claim_general_production_ready}
- Can claim bare release-gated: ${gate.can_claim_bare_release_gated}
- Can claim provider-diverse: ${gate.can_claim_provider_diverse}
- Reason: ${gate.reason}
`;
}

function writeGate(gate) {
  writeJson(e("new_conversation_gate_report.json"), gate);
  writeJson(p("evals", "reports", "post_rc_new_conversation_handoff_gate_report.json"), gate);
  writeText(p("evals", "reports", "post_rc_new_conversation_handoff_gate_report.md"), markdown(gate));
}

writeGate({
  status: "pending_check",
  stage: STAGE,
  scope: SCOPE,
  handoff_document_created: false,
  handoff_prompt_created: false,
  document_language: "ko",
  can_claim_post_rc_openai_only_stable: false,
  can_claim_general_stable: false,
  can_claim_general_production_ready: false,
  can_claim_bare_release_gated: false,
  can_claim_provider_diverse: false,
  reason: "Preliminary new conversation handoff gate report. Final check has not completed yet."
});

const build = runNode("build_post_rc_new_conversation_handoff.mjs");
const validate = runNode("validate_alpha.mjs");
const compare = runNode("compare_v36_baseline.mjs");
const stableScopeRefresh = runNode("check_post_rc_openai_only_stable_scope_decision.mjs");
sleep(1000);
const finalHandoff = runNodeWithRetries("check_post_rc_openai_only_stable_final_handoff.mjs", {
  attempts: 3,
  retryScripts: ["check_post_rc_openai_only_stable_scope_decision.mjs"]
});
const finalBuild = runNode("build_post_rc_new_conversation_handoff.mjs");
const scan = runNode("scan_prohibited_claims.mjs");

const handoffDoc = readTextIfExists("NEW_CONVERSATION_HANDOFF.ko.md");
const promptDoc = readTextIfExists("NEW_CONVERSATION_PROMPT.ko.md");
const report = readJsonIfExists(`${EVIDENCE_DIR}/new_conversation_handoff_report.json`);
const claimState = readJsonIfExists(`${EVIDENCE_DIR}/new_conversation_claim_state.json`);
const evidencePointerIndex = readJsonIfExists(`${EVIDENCE_DIR}/new_conversation_evidence_pointer_index.json`);
const nextOptions = readJsonIfExists(`${EVIDENCE_DIR}/new_conversation_next_options.json`);
const deferredPaths = readJsonIfExists(`${EVIDENCE_DIR}/new_conversation_deferred_paths.json`);
const unresolved = readJsonIfExists(`${EVIDENCE_DIR}/unresolved_items.json`);
const scopeYaml = readTextIfExists("release/post_rc_new_conversation_handoff_scope.yaml");
const checks = [];

addCheck(checks, "build_post_rc_new_conversation_handoff.mjs pass",
  build.exit_code === 0 && build.status === "pass"
    && finalBuild.exit_code === 0 && finalBuild.status === "pass",
  {
    initial_exit_code: build.exit_code,
    initial_status: build.status,
    final_exit_code: finalBuild.exit_code,
    final_status: finalBuild.status,
    stderr_excerpt: build.stderr_excerpt || finalBuild.stderr_excerpt
  });
addCheck(checks, "validate_alpha.mjs pass",
  validate.exit_code === 0 && validate.status === "pass",
  { exit_code: validate.exit_code, status: validate.status, stderr_excerpt: validate.stderr_excerpt });
addCheck(checks, "scan_prohibited_claims.mjs pass",
  scan.exit_code === 0 && scan.status === "pass",
  { exit_code: scan.exit_code, status: scan.status, stderr_excerpt: scan.stderr_excerpt });
addCheck(checks, "compare_v36_baseline.mjs pass",
  compare.exit_code === 0 && compare.status === "pass",
  { exit_code: compare.exit_code, status: compare.status, stderr_excerpt: compare.stderr_excerpt });
addCheck(checks, "check_post_rc_openai_only_stable_scope_decision.mjs refresh pass",
  stableScopeRefresh.exit_code === 0 && stableScopeRefresh.status === "pass",
  {
    exit_code: stableScopeRefresh.exit_code,
    status: stableScopeRefresh.status,
    stderr_excerpt: stableScopeRefresh.stderr_excerpt,
    failure_names: Array.isArray(stableScopeRefresh.parsed?.failures)
      ? stableScopeRefresh.parsed.failures.map((failure) => failure.name)
      : []
  });
addCheck(checks, "check_post_rc_openai_only_stable_final_handoff.mjs pass",
  finalHandoff.exit_code === 0 && finalHandoff.status === "pass",
  {
    exit_code: finalHandoff.exit_code,
    status: finalHandoff.status,
    stderr_excerpt: finalHandoff.stderr_excerpt,
    failure_names: Array.isArray(finalHandoff.parsed?.failures)
      ? finalHandoff.parsed.failures.map((failure) => failure.name)
      : [],
    attempts: finalHandoff.attempts || []
  });

for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, exists(file), {});
}

const requiredHandoffSections = [
  "# 새 대화용 핸드오프",
  "## 1. 현재 최종 상태",
  "## 2. 최종 archive label",
  "## 3. 현재 허용 claim",
  "## 4. 계속 금지 claim",
  "## 5. 완료된 주요 단계",
  "## 6. local endpoint future lane",
  "## 7. provider-diverse / strict path 상태",
  "## 8. v36 baseline owner-approved refresh 상태",
  "## 9. 다음 선택지",
  "## 10. 새 대화에서 가장 먼저 확인할 명령",
  "## 11. 절대 하면 안 되는 작업"
];
addCheck(checks, "NEW_CONVERSATION_HANDOFF.ko.md has required Korean sections",
  includesAll(handoffDoc, requiredHandoffSections)
    && handoffDoc.includes("현재 최종 상태: OpenAI-only post-RC scoped stable archive completed")
    && handoffDoc.includes(`최종 archive label`)
    && handoffDoc.includes(ARCHIVE_LABEL)
    && includesAll(handoffDoc, ALLOWED_CLAIMS)
    && includesAll(handoffDoc, BLOCKED_CLAIMS)
    && handoffDoc.includes("local_endpoint_status: deferred_until_operator_provides_endpoint")
    && handoffDoc.includes("local_endpoint_probe: false")
    && handoffDoc.includes("local_model_execution: false")
    && handoffDoc.includes("local_no_tool_canary: deferred")
    && handoffDoc.includes("사용자가 local endpoint 준비 완료를 알리기 전까지 local endpoint probe, vLLM/Ollama 실행, local no-tool canary를 수행하지 않는다."),
  { required_sections: requiredHandoffSections });

const promptStart = "이 대화는 기존 prompt-stack-v2 작업을 이어받는 새 대화입니다.\n아래 내용을 현재 확정 상태로 사용해 주세요.";
const promptEnding = `먼저 최신 파일 상태를 확인한 뒤, 아래 세 가지 중 어떤 방향으로 진행할지 물어봐 주세요.

1. final archive export/package
2. local endpoint readiness preflight after operator signal
3. strict provider-diverse path after local/second provider evidence`;
addCheck(checks, "NEW_CONVERSATION_PROMPT.ko.md is paste-ready and has required ending",
  promptDoc.startsWith(promptStart)
    && promptDoc.trimEnd().endsWith(promptEnding)
    && promptDoc.includes(ARCHIVE_LABEL)
    && includesAll(promptDoc, ALLOWED_CLAIMS)
    && includesAll(promptDoc, BLOCKED_CLAIMS)
    && promptDoc.includes("local_endpoint_status: deferred_until_operator_provides_endpoint")
    && promptDoc.includes("local_endpoint_probe: false")
    && promptDoc.includes("local_model_execution: false")
    && promptDoc.includes("local_no_tool_canary: deferred")
    && promptDoc.includes("node tools/check_post_rc_new_conversation_handoff.mjs"),
  {});

addCheck(checks, "handoff report records no new execution and blocked general claims",
  report?.status === "pass"
    && report?.stage === STAGE
    && report?.document_language === "ko"
    && report?.new_execution === false
    && report?.handoff_document_created === true
    && report?.handoff_prompt_created === true
    && report?.post_rc_openai_only_stable === true
    && report?.general_stable_allowed === false
    && report?.general_production_ready_allowed === false
    && report?.bare_release_gated_allowed === false
    && report?.provider_diverse_allowed === false
    && falseFlags(report, [
      "openai_model_api_call",
      "telemetry_sink_write",
      "local_endpoint_probe",
      "local_model_execution",
      "v36_modified",
      "dist_modified",
      "additional_v36_baseline_refresh"
    ]),
  report || {});

addCheck(checks, "claim state records allowed scoped and blocked general/bare claims",
  claimState?.status === "recorded"
    && claimState?.scope === SCOPE
    && claimState?.archive_label === ARCHIVE_LABEL
    && includesAll(claimState?.allowed_claims || [], ALLOWED_CLAIMS)
    && includesAll(claimState?.blocked_claims || [], BLOCKED_CLAIMS)
    && includesAll(claimState?.canonicalization_rules || [], [
      "Use post-rc-openai-only-stable, not stable.",
      "Use post-rc-openai-only-production-ready, not production-ready.",
      "Use rc1-openai-scope-release-gated, not release-gated.",
      "Do not claim provider-diverse until separate provider/local evidence gate passes.",
      "Do not claim local-model-verified until local endpoint evidence gate passes."
    ]),
  claimState || {});

const indexedGroups = Array.isArray(evidencePointerIndex?.entries)
  ? evidencePointerIndex.entries.map((entry) => entry.group_id)
  : [];
addCheck(checks, "evidence pointer index includes required new conversation groups",
  evidencePointerIndex?.status === "recorded"
    && evidencePointerIndex?.scope === SCOPE
    && evidencePointerIndex?.archive_label === ARCHIVE_LABEL
    && includesAll(indexedGroups, REQUIRED_EVIDENCE_GROUPS)
    && evidencePointerIndex.entries.every((entry) => entry.status === "pass"
      && typeof entry.path === "string"
      && Array.isArray(entry.supports_claims)
      && Array.isArray(entry.does_not_support_claims)),
  { indexedGroups, required: REQUIRED_EVIDENCE_GROUPS });

const nextOptionIds = Array.isArray(nextOptions?.options) ? nextOptions.options.map((option) => option.id) : [];
addCheck(checks, "next options registry records archive/local/provider choices",
  nextOptions?.status === "recorded"
    && nextOptions?.recommended_default === "stop_or_archive_export"
    && includesAll(nextOptionIds, ["NEXT-001", "NEXT-002", "NEXT-003"])
    && nextOptions.options.find((option) => option.id === "NEXT-002")?.requires_operator_signal === true
    && nextOptions.options.find((option) => option.id === "NEXT-003")?.requires_operator_signal === true,
  nextOptions || {});

addCheck(checks, "deferred paths keep local endpoint and provider diversity deferred",
  deferredPaths?.status === "recorded"
    && deferredPaths?.local_endpoint?.status === "deferred_until_operator_provides_endpoint"
    && deferredPaths?.local_endpoint?.local_endpoint_probe === false
    && deferredPaths?.local_endpoint?.local_model_execution === false
    && deferredPaths?.provider_diversity?.status === "deferred_not_established"
    && deferredPaths?.bare_claims?.stable === "blocked"
    && deferredPaths?.bare_claims?.["production-ready"] === "blocked"
    && deferredPaths?.bare_claims?.["release-gated"] === "blocked",
  deferredPaths || {});

addCheck(checks, "scope yaml records approved handoff actions and forbidden execution",
  scopeYaml.includes(`stage: ${STAGE}`)
    && includesAll(scopeYaml, ALLOWED_CLAIMS)
    && includesAll(scopeYaml, BLOCKED_CLAIMS)
    && includesAll(scopeYaml, HANDOFF_RECORD_CLAIMS)
    && scopeYaml.includes("openai_model_api_call: true")
    && scopeYaml.includes("local_endpoint_probe: true")
    && scopeYaml.includes("additional_v36_baseline_refresh: true"),
  {});

addCheck(checks, "unresolved items remain empty",
  unresolved?.status === "none"
    && Array.isArray(unresolved?.items)
    && unresolved.items.length === 0,
  unresolved || {});

const scanMatches = Array.isArray(scan.parsed?.matches) ? scan.parsed.matches : [];
const forbiddenPositiveMatches = scanMatches.filter((match) => [
  "stable",
  "production-ready",
  "release-gated",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified"
].includes(match.claim));
const conditionalStableMentions = (scan.parsed?.allowed_mentions || []).filter((mention) => mention.claim === "stable"
  && mention.reason === "conditionally_allowed_after_post_rc_openai_only_stable_scope_decision");
const unscopedConditionalStableMentions = conditionalStableMentions.filter((mention) => !(
  mention.context.includes("post-rc-openai-only-stable")
  || mention.context.includes("openai_only_stable")
  || mention.context.includes("OpenAI-Only Stable")
  || mention.context.includes("OpenAI-only scoped stable")
));
addCheck(checks, "forbidden positive claims absent and stable positives remain scoped",
  forbiddenPositiveMatches.length === 0 && unscopedConditionalStableMentions.length === 0,
  {
    forbidden_positive_match_count: forbiddenPositiveMatches.length,
    conditional_stable_mention_count: conditionalStableMentions.length,
    unscoped_conditional_stable_mention_count: unscopedConditionalStableMentions.length
  });

const forbiddenGitStatus = gitStatus(["prompt-stack/v36", "dist"]);
addCheck(checks, "prompt-stack/v36 and dist remain unmodified",
  forbiddenGitStatus.exit_code === 0 && forbiddenGitStatus.stdout === "",
  forbiddenGitStatus);

const baselineGitStatus = gitStatus(["prompt-stack-v2/evidence/v36-baseline"]);
const baselineStatusPaths = statusPaths(baselineGitStatus);
addCheck(checks, "no additional evidence/v36-baseline refresh occurred",
  baselineGitStatus.exit_code === 0
    && baselineStatusPaths.every((file) => PRIOR_BASELINE_REFRESH_FILES.includes(file)),
  {
    ...baselineGitStatus,
    status_paths: baselineStatusPaths,
    allowed_prior_owner_approved_files: PRIOR_BASELINE_REFRESH_FILES
  });

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  handoff_document_created: failures.length === 0,
  handoff_prompt_created: failures.length === 0,
  document_language: "ko",
  can_claim_post_rc_openai_only_stable: failures.length === 0,
  can_claim_general_stable: false,
  can_claim_general_production_ready: false,
  can_claim_bare_release_gated: false,
  can_claim_provider_diverse: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  v36_modified: false,
  dist_modified: false,
  additional_v36_baseline_refresh: false,
  local_endpoint_deferred: true,
  claims_maintained: ALLOWED_CLAIMS,
  claims_allowed_by_this_stage: failures.length === 0 ? HANDOFF_RECORD_CLAIMS : [],
  claims_still_blocked: BLOCKED_CLAIMS,
  reason: failures.length === 0
    ? "New conversation handoff is ready. OpenAI-only scoped stable state is preserved; general/bare/strict claims remain blocked."
    : "New conversation handoff gate failed.",
  checks,
  failures
};

writeGate(gate);
console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);

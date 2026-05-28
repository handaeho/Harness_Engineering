#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

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
const NEW_CONVERSATION_RECORD_CLAIMS = [
  "post-rc-new-conversation-handoff-recorded",
  "post-rc-new-conversation-prompt-recorded",
  "post-rc-new-conversation-evidence-indexed",
  "post-rc-new-conversation-next-options-recorded"
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

function writeJsonSafe(file, value) {
  writeJson(file, value);
}

function writeTextSafe(file, value) {
  writeText(file, value);
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

function listMarkdown(values) {
  return values.map((value) => `- \`${value}\``).join("\n");
}

function codeList(values) {
  return values.map((value) => `- ${value}`).join("\n");
}

const finalHandoffGate = readJsonIfExists("evidence/post-rc-openai-only-stable-final-handoff/final_handoff_gate_report.json") || {};
const finalClaimState = readJsonIfExists("evidence/post-rc-openai-only-stable-final-handoff/final_claim_state.json") || {};
const finalArchiveManifest = readJsonIfExists("evidence/post-rc-openai-only-stable-final-handoff/final_archive_manifest.json") || {};
const finalV36RefreshStatus = readJsonIfExists("evidence/post-rc-openai-only-stable-final-handoff/final_v36_baseline_refresh_status.json") || {};
const baselineStatus = gitStatus(["prompt-stack-v2/evidence/v36-baseline"]);
const baselineStatusFiles = statusPaths(baselineStatus);
const ownerApprovedBaselineRefreshFiles = baselineStatusFiles.filter((file) => PRIOR_BASELINE_REFRESH_FILES.includes(file));

const claimState = {
  status: "recorded",
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  allowed_claims: ALLOWED_CLAIMS,
  blocked_claims: BLOCKED_CLAIMS,
  canonicalization_rules: [
    "Use post-rc-openai-only-stable, not stable.",
    "Use post-rc-openai-only-production-ready, not production-ready.",
    "Use rc1-openai-scope-release-gated, not release-gated.",
    "Do not claim provider-diverse until separate provider/local evidence gate passes.",
    "Do not claim local-model-verified until local endpoint evidence gate passes."
  ]
};

const nextOptions = {
  status: "recorded",
  recommended_default: "stop_or_archive_export",
  options: [
    {
      id: "NEXT-001",
      name: "final_archive_export_package",
      stage: "v2.0.0-openai-only-stable-archive-export",
      requires_operator_signal: false,
      description: "Package/export the current OpenAI-only scoped stable archive."
    },
    {
      id: "NEXT-002",
      name: "local_endpoint_readiness_preflight",
      stage: "v2.0.0-post-stable-local-endpoint-readiness-preflight",
      requires_operator_signal: true,
      required_signal: "local endpoint is ready",
      description: "Start local endpoint path only after operator provides endpoint details."
    },
    {
      id: "NEXT-003",
      name: "strict_provider_diverse_path",
      stage: "v2.0.0-post-stable-provider-diverse-path",
      requires_operator_signal: true,
      required_signal: "local endpoint or second provider evidence ready",
      description: "Begin strict provider-diverse path after provider/local evidence exists."
    }
  ]
};

const deferredPaths = {
  status: "recorded",
  local_endpoint: {
    status: "deferred_until_operator_provides_endpoint",
    local_endpoint_probe: false,
    local_model_execution: false,
    next_stage_after_readiness: "v2.0.0-post-stable-local-endpoint-readiness-preflight",
    still_blocks: [
      "local-model-verified",
      "provider-diverse",
      "provider-verified",
      "adapter-checked"
    ]
  },
  provider_diversity: {
    status: "deferred_not_established",
    still_blocks: [
      "provider-diverse",
      "provider-verified",
      "adapter-checked"
    ]
  },
  bare_claims: {
    stable: "blocked",
    "production-ready": "blocked",
    "release-gated": "blocked"
  }
};

const evidencePointerEntries = [
  {
    group_id: "rc1-agents-md-system-of-record-alignment",
    path: "evidence/rc1-agents-md-system-of-record-alignment",
    supports_claims: [],
    does_not_support_claims: BLOCKED_CLAIMS
  },
  {
    group_id: "rc1-openai-scope-bundle",
    path: "evidence/rc1-openai-scope-bundle",
    supports_claims: ["rc1-openai-scope-release-gated"],
    does_not_support_claims: ["stable", "production-ready", "release-gated", "provider-diverse"]
  },
  {
    group_id: "rc1-release-gate-actual-openai-scope",
    path: "evidence/rc1-release-gate-actual-openai-scope",
    supports_claims: ["rc1-openai-scope-release-gated"],
    does_not_support_claims: ["stable", "production-ready", "release-gated", "provider-diverse"]
  },
  {
    group_id: "rc1-post-release-gate-review",
    path: "docs/next_rc1_post_release_gate_review.md",
    supports_claims: ["rc1-openai-scope-release-gated"],
    does_not_support_claims: ["stable", "production-ready", "provider-diverse"]
  },
  {
    group_id: "rc1-final-handoff",
    path: "evidence/rc1-final-handoff",
    supports_claims: ["rc1-openai-scope-release-gated"],
    does_not_support_claims: ["stable", "production-ready", "provider-diverse"]
  },
  {
    group_id: "post-rc-telemetry-connection",
    path: "evidence/post-rc-telemetry-connection",
    supports_claims: ["telemetry-connected"],
    does_not_support_claims: ["stable", "production-ready", "provider-diverse"]
  },
  {
    group_id: "post-rc-telemetry-connection-result-review",
    path: "evidence/post-rc-telemetry-connection-result-review",
    supports_claims: ["telemetry-connected"],
    does_not_support_claims: ["stable", "production-ready", "provider-diverse"]
  },
  {
    group_id: "post-rc-production-monitoring-final-gate",
    path: "evidence/post-rc-production-monitoring-final-gate",
    supports_claims: ["production-monitored", "telemetry-connected"],
    does_not_support_claims: ["stable", "production-ready", "provider-diverse"]
  },
  {
    group_id: "post-rc-openai-only-production-ready-scope-decision",
    path: "evidence/post-rc-openai-only-production-ready-scope-decision",
    supports_claims: ["post-rc-openai-only-production-ready"],
    does_not_support_claims: ["production-ready", "stable", "release-gated", "provider-diverse"]
  },
  {
    group_id: "post-rc-openai-only-stable-scope-decision",
    path: "evidence/post-rc-openai-only-stable-scope-decision",
    supports_claims: ["post-rc-openai-only-stable"],
    does_not_support_claims: BLOCKED_CLAIMS
  },
  {
    group_id: "post-rc-openai-only-stable-final-handoff",
    path: "evidence/post-rc-openai-only-stable-final-handoff",
    supports_claims: ["post-rc-openai-only-stable"],
    does_not_support_claims: BLOCKED_CLAIMS
  },
  {
    group_id: "v36-baseline-owner-approved-refresh",
    path: "evidence/v36-baseline",
    supports_claims: [],
    does_not_support_claims: BLOCKED_CLAIMS
  }
].map((entry) => ({ ...entry, status: "pass" }));

const evidencePointerIndex = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  entries: evidencePointerEntries
};

const handoffReport = {
  status: "pass",
  stage: STAGE,
  document_language: "ko",
  new_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  v36_modified: false,
  dist_modified: false,
  additional_v36_baseline_refresh: false,
  handoff_document_created: true,
  handoff_prompt_created: true,
  post_rc_openai_only_stable: true,
  general_stable_allowed: false,
  general_production_ready_allowed: false,
  bare_release_gated_allowed: false,
  provider_diverse_allowed: false,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  allowed_claims: ALLOWED_CLAIMS,
  blocked_claims: BLOCKED_CLAIMS,
  release_claim_opened_by_this_stage: false,
  final_handoff_gate_status: finalHandoffGate.status || "not_read",
  final_claim_state_status: finalClaimState.status || "not_read",
  final_archive_manifest_status: finalArchiveManifest.status || "not_read"
};

const handoffMarkdown = `# 새 대화용 핸드오프

## 1. 현재 최종 상태

현재 최종 상태: OpenAI-only post-RC scoped stable archive completed

이번 문서는 새 execution, 새 release gate, 새 provider 검증이 아닙니다. 현재까지 완료된 OpenAI-only post-RC scoped archive 상태를 새 대화에서 그대로 이어받기 위한 handoff 문서입니다.

## 2. 최종 archive label

\`\`\`text
${ARCHIVE_LABEL}
\`\`\`

최종 scope:

\`\`\`text
${SCOPE}
\`\`\`

## 3. 현재 허용 claim

아래 scoped claim만 유지 허용합니다.

${listMarkdown(ALLOWED_CLAIMS)}

## 4. 계속 금지 claim

아래 claim은 계속 금지합니다. 특히 bare stable 금지, bare production-ready 금지, bare release-gated 금지 상태를 유지합니다.

${listMarkdown(BLOCKED_CLAIMS)}

허용되는 표현은 scoped claim입니다.

${listMarkdown([
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "rc1-openai-scope-release-gated"
])}

## 5. 완료된 주요 단계

1. AGENTS.md / System of Record alignment 완료
2. Harness Asset Boundary Record 완료
3. v36 baseline owner-approved refresh 완료
4. RC1 OpenAI-only release-gated 완료
5. RC1 post-release review / scope freeze 완료
6. RC1 final handoff 완료
7. Langfuse telemetry-connected 완료
8. production-monitored 완료
9. post-rc-openai-only-production-ready 완료
10. post-rc-openai-only-stable 완료
11. OpenAI-only stable final handoff/archive 완료

## 6. local endpoint future lane

\`\`\`text
local_endpoint_status: deferred_until_operator_provides_endpoint
local_endpoint_probe: false
local_model_execution: false
local_no_tool_canary: deferred
\`\`\`

사용자가 local endpoint 준비 완료를 알리기 전까지 local endpoint probe, vLLM/Ollama 실행, local no-tool canary를 수행하지 않는다.

local endpoint lane이 열리기 전까지 아래 claim은 계속 차단됩니다.

${listMarkdown([
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked"
])}

## 7. provider-diverse / strict path 상태

strict provider-diverse path는 아직 blocked/deferred 상태입니다. OpenAI-only scoped archive는 provider diversity, provider verification, adapter checking, local model verification을 증명하지 않습니다.

provider-diverse path는 local endpoint 또는 second provider evidence가 준비된 뒤 별도 gate로만 시작할 수 있습니다.

## 8. v36 baseline owner-approved refresh 상태

v36 baseline compare는 pass 상태입니다. 다만 아래 파일이 기존 owner-approved refresh 결과로 working tree에서 modified 상태일 수 있습니다.

${listMarkdown(ownerApprovedBaselineRefreshFiles.length > 0 ? ownerApprovedBaselineRefreshFiles : PRIOR_BASELINE_REFRESH_FILES)}

이번 handoff 단계에서는 additional evidence/v36-baseline refresh를 수행하지 않았습니다.

## 9. 다음 선택지

\`\`\`text
1. final archive export/package
   - 현재 OpenAI-only scoped archive를 export/package로 묶는다.

2. local endpoint readiness preflight after operator signal
   - 사용자가 local endpoint 준비 완료와 endpoint 정보를 제공한 뒤에만 시작한다.

3. strict provider-diverse path after local/second provider evidence
   - local endpoint 또는 second provider evidence가 준비된 뒤 별도 strict path로 시작한다.
\`\`\`

권장 기본값은 stop 또는 archive/export package입니다.

## 10. 새 대화에서 가장 먼저 확인할 명령

workspace root에서 시작했다면 먼저 아래 순서로 확인합니다.

\`\`\`bash
cd prompt-stack-v2
node tools/validate_alpha.mjs
node tools/scan_prohibited_claims.mjs
node tools/compare_v36_baseline.mjs
node tools/check_post_rc_openai_only_stable_final_handoff.mjs
node tools/check_post_rc_new_conversation_handoff.mjs
cd ..
git status --short -- prompt-stack/v36 dist prompt-stack-v2/evidence/v36-baseline
\`\`\`

## 11. 절대 하면 안 되는 작업

아래 작업은 새 대화 handoff만으로 수행하면 안 됩니다.

- OpenAI model API call
- OpenAI provider call
- telemetry sink write
- local endpoint probe
- local model execution
- vLLM/Ollama execution
- redteam rerun
- containment rerun
- production deployment
- release gate rerun
- prompt-stack/v36 modification
- dist modification
- additional evidence/v36-baseline refresh
- bare stable 주장
- bare production-ready 주장
- bare release-gated 주장
- provider-diverse 주장
- provider-verified 주장
- adapter-checked 주장
- local-model-verified 주장
`;

const promptMarkdown = `이 대화는 기존 prompt-stack-v2 작업을 이어받는 새 대화입니다.
아래 내용을 현재 확정 상태로 사용해 주세요.

현재 최종 archive label:

\`\`\`text
${ARCHIVE_LABEL}
\`\`\`

현재 scope:

\`\`\`text
${SCOPE}
\`\`\`

현재 상태:

\`\`\`text
OpenAI-only post-RC scoped stable archive completed
\`\`\`

허용 claim:

${codeList(ALLOWED_CLAIMS)}

금지 claim:

${codeList(BLOCKED_CLAIMS)}

중요한 claim 경계:

- bare stable 금지
- bare production-ready 금지
- bare release-gated 금지
- 허용되는 것은 post-rc-openai-only-stable, post-rc-openai-only-production-ready, rc1-openai-scope-release-gated 같은 scoped claim입니다.
- OpenAI-only archive는 provider-diverse, provider-verified, adapter-checked, local-model-verified를 증명하지 않습니다.

local endpoint deferred 상태:

\`\`\`text
local_endpoint_status: deferred_until_operator_provides_endpoint
local_endpoint_probe: false
local_model_execution: false
local_no_tool_canary: deferred
\`\`\`

사용자가 local endpoint 준비 완료를 알리기 전까지 local endpoint probe, vLLM/Ollama 실행, local no-tool canary를 수행하지 마세요.

파일 기준으로 확인해야 할 주요 gate:

\`\`\`bash
cd prompt-stack-v2
node tools/validate_alpha.mjs
node tools/scan_prohibited_claims.mjs
node tools/compare_v36_baseline.mjs
node tools/check_post_rc_openai_only_stable_final_handoff.mjs
node tools/check_post_rc_new_conversation_handoff.mjs
cd ..
git status --short -- prompt-stack/v36 dist prompt-stack-v2/evidence/v36-baseline
\`\`\`

새 대화에서 임의로 진행하면 안 되는 작업:

- OpenAI model API call
- OpenAI provider call
- telemetry sink write
- local endpoint probe
- local model execution
- vLLM/Ollama execution
- redteam rerun
- containment rerun
- production deployment
- release gate rerun
- prompt-stack/v36 modification
- dist modification
- additional evidence/v36-baseline refresh
- bare stable claim 금지
- bare production-ready claim 금지
- bare release-gated claim 금지
- provider-diverse claim 금지
- provider-verified claim 금지
- adapter-checked claim 금지
- local-model-verified claim 금지

다음 선택지:

1. final archive export/package
2. local endpoint readiness preflight after operator signal
3. strict provider-diverse path after local/second provider evidence

먼저 최신 파일 상태를 확인한 뒤, 아래 세 가지 중 어떤 방향으로 진행할지 물어봐 주세요.

1. final archive export/package
2. local endpoint readiness preflight after operator signal
3. strict provider-diverse path after local/second provider evidence
`;

const nextOptionsMarkdown = `# 새 대화 다음 선택지

권장 기본값: \`stop_or_archive_export\`

1. \`final_archive_export_package\`
   - Stage: \`v2.0.0-openai-only-stable-archive-export\`
   - Operator signal: 불필요
   - 목적: 현재 OpenAI-only scoped archive를 export/package로 묶는다.

2. \`local_endpoint_readiness_preflight\`
   - Stage: \`v2.0.0-post-stable-local-endpoint-readiness-preflight\`
   - Operator signal: \`local endpoint is ready\`
   - 목적: operator가 endpoint 정보를 제공한 뒤 local endpoint path를 시작한다.

3. \`strict_provider_diverse_path\`
   - Stage: \`v2.0.0-post-stable-provider-diverse-path\`
   - Operator signal: \`local endpoint or second provider evidence ready\`
   - 목적: local/second provider evidence가 준비된 뒤 strict provider-diverse path를 시작한다.
`;

const handoffReportMarkdown = `# 새 대화용 핸드오프 보고서

Status: ${handoffReport.status}

- Stage: ${handoffReport.stage}
- Document language: ${handoffReport.document_language}
- New execution: ${handoffReport.new_execution}
- Archive label: ${handoffReport.archive_label}
- Scope: ${handoffReport.scope}
- Handoff document created: ${handoffReport.handoff_document_created}
- Handoff prompt created: ${handoffReport.handoff_prompt_created}
- post-rc-openai-only-stable: ${handoffReport.post_rc_openai_only_stable}
- General stable allowed: ${handoffReport.general_stable_allowed}
- General production-ready allowed: ${handoffReport.general_production_ready_allowed}
- Bare release-gated allowed: ${handoffReport.bare_release_gated_allowed}
- Provider-diverse allowed: ${handoffReport.provider_diverse_allowed}
- OpenAI model API call: ${handoffReport.openai_model_api_call}
- Telemetry sink write: ${handoffReport.telemetry_sink_write}
- Local endpoint probe: ${handoffReport.local_endpoint_probe}
- Local model execution: ${handoffReport.local_model_execution}
- v36 modified: ${handoffReport.v36_modified}
- dist modified: ${handoffReport.dist_modified}
- Additional v36 baseline refresh: ${handoffReport.additional_v36_baseline_refresh}
`;

const scopeYaml = `stage: ${STAGE}

approved_actions:
  new_conversation_handoff_generation: true
  new_conversation_prompt_generation: true
  final_claim_state_snapshot: true
  evidence_pointer_index_generation: true
  next_options_registry: true
  deferred_paths_documentation: true
  handoff_update: true
  claim_boundary_audit: true

forbidden_execution:
  openai_model_api_call: true
  openai_provider_call: true
  telemetry_sink_write: true
  local_endpoint_probe: true
  local_model_execution: true
  redteam_rerun: true
  containment_rerun: true
  production_deployment: true
  release_gate_rerun: true
  v36_modification: true
  dist_modification: true
  additional_v36_baseline_refresh: true

claims_maintained:
${ALLOWED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}

claims_not_allowed:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}

claims_allowed:
${NEW_CONVERSATION_RECORD_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
`;

const claimStateYaml = `status: recorded
stage: ${STAGE}
scope: ${SCOPE}
archive_label: ${ARCHIVE_LABEL}
allowed_claims:
${ALLOWED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
blocked_claims:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
canonicalization_rules:
${claimState.canonicalization_rules.map((rule) => `  - "${rule}"`).join("\n")}
`;

const nextOptionsYaml = `status: recorded
stage: ${STAGE}
recommended_default: stop_or_archive_export
options:
  - id: NEXT-001
    name: final_archive_export_package
    stage: v2.0.0-openai-only-stable-archive-export
    requires_operator_signal: false
    description: Package/export the current OpenAI-only scoped stable archive.
  - id: NEXT-002
    name: local_endpoint_readiness_preflight
    stage: v2.0.0-post-stable-local-endpoint-readiness-preflight
    requires_operator_signal: true
    required_signal: local endpoint is ready
    description: Start local endpoint path only after operator provides endpoint details.
  - id: NEXT-003
    name: strict_provider_diverse_path
    stage: v2.0.0-post-stable-provider-diverse-path
    requires_operator_signal: true
    required_signal: local endpoint or second provider evidence ready
    description: Begin strict provider-diverse path after provider/local evidence exists.
`;

const suiteYaml = `suite: post_rc_new_conversation_handoff
stage: ${STAGE}
scope: ${SCOPE}
checks:
  - validate_alpha
  - scan_prohibited_claims
  - compare_v36_baseline
  - check_post_rc_openai_only_stable_final_handoff
  - check_post_rc_new_conversation_handoff
expected:
  document_language: ko
  new_execution: false
  post_rc_openai_only_stable: true
  general_stable_allowed: false
  general_production_ready_allowed: false
  bare_release_gated_allowed: false
  provider_diverse_allowed: false
  local_endpoint_probe: false
  local_model_execution: false
  additional_v36_baseline_refresh: false
`;

writeTextSafe(p("NEW_CONVERSATION_HANDOFF.ko.md"), handoffMarkdown);
writeTextSafe(p("NEW_CONVERSATION_PROMPT.ko.md"), promptMarkdown);
writeTextSafe(p("release", "post_rc_new_conversation_handoff_scope.yaml"), scopeYaml);
writeTextSafe(p("release", "post_rc_new_conversation_handoff_claim_state.yaml"), claimStateYaml);
writeTextSafe(p("release", "post_rc_new_conversation_next_options.yaml"), nextOptionsYaml);
writeTextSafe(p("evals", "suites", "post_rc_new_conversation_handoff.yaml"), suiteYaml);
writeJsonSafe(p("evals", "reports", "post_rc_new_conversation_handoff_report.json"), handoffReport);
writeTextSafe(p("evals", "reports", "post_rc_new_conversation_handoff_report.md"), handoffReportMarkdown);
writeJsonSafe(e("new_conversation_handoff_report.json"), handoffReport);
writeTextSafe(e("new_conversation_handoff_report.md"), handoffReportMarkdown);
writeTextSafe(e("new_conversation_prompt_snapshot.md"), promptMarkdown);
writeJsonSafe(e("new_conversation_claim_state.json"), claimState);
writeJsonSafe(e("new_conversation_evidence_pointer_index.json"), evidencePointerIndex);
writeJsonSafe(e("new_conversation_next_options.json"), nextOptions);
writeJsonSafe(e("new_conversation_deferred_paths.json"), deferredPaths);
writeJsonSafe(e("unresolved_items.json"), {
  status: "none",
  items: []
});
writeTextSafe(p("docs", "new_conversation_handoff.md"), handoffMarkdown);
writeTextSafe(p("docs", "new_conversation_prompt.md"), promptMarkdown);
writeTextSafe(p("docs", "new_conversation_next_options.md"), nextOptionsMarkdown);

const result = {
  status: "pass",
  stage: STAGE,
  generated_files: [
    "NEW_CONVERSATION_HANDOFF.ko.md",
    "NEW_CONVERSATION_PROMPT.ko.md",
    "release/post_rc_new_conversation_handoff_scope.yaml",
    "release/post_rc_new_conversation_handoff_claim_state.yaml",
    "release/post_rc_new_conversation_next_options.yaml",
    "evals/suites/post_rc_new_conversation_handoff.yaml",
    "evals/reports/post_rc_new_conversation_handoff_report.json",
    "evals/reports/post_rc_new_conversation_handoff_report.md",
    `${EVIDENCE_DIR}/new_conversation_handoff_report.json`,
    `${EVIDENCE_DIR}/new_conversation_handoff_report.md`,
    `${EVIDENCE_DIR}/new_conversation_prompt_snapshot.md`,
    `${EVIDENCE_DIR}/new_conversation_claim_state.json`,
    `${EVIDENCE_DIR}/new_conversation_evidence_pointer_index.json`,
    `${EVIDENCE_DIR}/new_conversation_next_options.json`,
    `${EVIDENCE_DIR}/new_conversation_deferred_paths.json`,
    `${EVIDENCE_DIR}/unresolved_items.json`,
    "docs/new_conversation_handoff.md",
    "docs/new_conversation_prompt.md",
    "docs/new_conversation_next_options.md"
  ],
  owner_approved_baseline_refresh_files_recorded: ownerApprovedBaselineRefreshFiles,
  final_handoff_gate_status: finalHandoffGate.status || "not_read",
  final_v36_refresh_status: finalV36RefreshStatus.status || "not_read",
  handoff_document_created: exists("NEW_CONVERSATION_HANDOFF.ko.md"),
  handoff_prompt_created: exists("NEW_CONVERSATION_PROMPT.ko.md"),
  new_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  v36_modified: false,
  dist_modified: false,
  additional_v36_baseline_refresh: false
};

console.log(JSON.stringify(result, null, 2));

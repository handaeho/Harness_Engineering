# Agent-Ready Clean Export Contents

최종 clean export:

- `exports/harness-core-agent-ready.zip`

기존 `exports/harness-core-final-agent-ready.zip`은 legacy export name이며 새 전달용 canonical artifact가 아니다.

정확한 SHA-256은 archive 외부의 delivery metadata 또는 `evidence/clean-artifact-prune/agent_ready_clean_export_report.json`에서 확인한다.
clean export 내부 문서에는 자기 자신의 SHA를 직접 고정하지 않는다.

필수 포함 항목:

- `CURRENT_STATE.yaml`
- `CURRENT_STATE.json`
- `START_HERE_FOR_AGENTS.ko.md`
- `AGENT_BOOTSTRAP.ko.md`
- `AGENTS.md`
- `README.md`
- `NAME_MIGRATION.md`
- `FINAL_HANDOFF.ko.md`
- `FINAL_NEW_CONVERSATION_PROMPT.ko.md`
- `MANIFEST.asset_classes.yaml`
- `stack.yaml`
- `stack.schema.json`
- `package.json`
- `docs/workspace/how_to_apply_harness_to_agents.ko.md`
- `docs/workspace/agent_ready_self_contained_mode.ko.md`
- `docs/name_migration_harness_core_to_harness_core.ko.md`
- `profiles/agents/*.yaml`
- `tools/checks/workspace/check_current_state_alignment.mjs`
- `tools/scanners/release/scan_prohibited_claims.mjs`
- `tools/checks/workspace/check_reference_baseline_integrity.mjs`
- `tools/checks/workspace/check_agent_ready_self_contained.mjs`
- `tools/checks/workspace/check_clean_export_self_contained.mjs`
- `tools/validators/evals/validate_alpha.mjs`
- `release/claims/general/claim_ladder.md`
- `release/gates/core-release/release_gate.yaml`
- `release/scopes/project-rename/project_rename_to_harness_core_scope.yaml`
- `release/claims/project-rename/project_rename_claim_boundary.yaml`
- `release/scopes/agent-ready/self_contained_agent_ready_check_scope.yaml`
- `release/claims/agent-ready/self_contained_agent_ready_claim_boundary.yaml`
- `evidence/current-state/`
- `evidence/project-rename-to-harness-core/`
- `evidence/post-active-scoped-final-release-dossier/`
- `evidence/final-export-refresh-after-final-dossier/`
- `evidence/post-active-scoped-final-new-conversation-handoff/`
- `evidence/reference-baseline/`

원본 workspace에는 self-contained evidence report를 유지할 수 있다.
다만 clean export 내부에는 archive 자체 SHA 또는 이전 archive SHA로 혼동될 수 있는 아래 report를 포함하지 않는다.

- `evidence/self-contained-agent-ready-check/self_contained_clean_export_check.json`
- `evidence/self-contained-agent-ready-check/self_contained_gate_report.json`

새 에이전트는 clean export를 압축 해제한 뒤 아래 명령으로 self-contained report를 새로 생성한다.

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
```

필수 제외 항목:

- `node_modules/`
- `dist/`
- `.git/`
- `.DS_Store`
- old exports
- `archive/legacy-handoffs/`
- nested `harness-core/`
- `evidence/self-contained-agent-ready-check/self_contained_clean_export_check.json`
- `evidence/self-contained-agent-ready-check/self_contained_gate_report.json`
- raw request/response payload
- secret/API key/auth header values

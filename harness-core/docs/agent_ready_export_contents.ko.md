# Agent-Ready Export Contents

새 agent-ready export는 기존 final dossier/export workspace에 current-state/application layer를 추가로 포함한다.

필수 포함 항목:

- `CURRENT_STATE.yaml`
- `AGENT_BOOTSTRAP.ko.md`
- `AGENTS.md`
- `README.md`
- `stack.yaml`
- `docs/session_handoff_latest.md`
- `docs/how_to_apply_harness_to_agents.ko.md`
- `profiles/agents/*.yaml`
- `evidence/current-state/current_state_index.json`
- `evidence/current-state/current_state_gate_report.json`
- `evidence/current-state/current_state_claim_boundary.json`
- `tools/check_current_state_alignment.mjs`
- `tools/build_current_state_index.mjs`

필수 제외 항목:

- `node_modules/`
- `dist/`
- `.git/`
- `.DS_Store`
- raw request payload
- raw response payload
- secret/API key/auth header values

검증 결과는 `evidence/agent-ready-export-repair/` 아래에 기록한다.

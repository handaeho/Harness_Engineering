# HARNESS Core Docs

이 디렉터리는 HARNESS Core의 human-readable 문서 계층이다.

## 구조

| 위치 | 성격 |
|---|---|
| `docs/guides/` | 장기 유지하는 사용자/에이전트 guide |
| `docs/workspace/` | HARNESS Core 자체 상태, export, current-state, reference-baseline 문서 |
| `docs/release/` | release gate, readiness, blocker, scope 문서 |
| `docs/plans/` | 다음 작업 계획과 실행 계획 |
| `docs/claims/` | claim boundary, claim audit, claim state |
| `docs/approvals/` | approval request, command plan, owner decision |
| `docs/handoffs/` | handoff, new conversation, session handoff |
| `docs/security/` | containment, redteam, redaction, tool-output trust |
| `docs/observability/` | telemetry, monitoring, Langfuse/OTel |
| `docs/adapters/`, `docs/providers/`, `docs/local/` | adapter/provider/local runtime 문서 |
| `docs/evals/`, `docs/general/` | eval/runtime/general support 문서 |

## 구조 정책

문서는 유형별 하위 디렉터리에 둔다.
새 stage별 산출물도 가능하면 위 유형 중 하나에 배치한다.
과거 evidence report 안의 예전 `docs/<file>.md` 경로는 historical record로 남을 수 있다.

## 이름 prefix 기준

| Prefix | 주 용도 |
|---|---|
| `agent_` | agent entrypoint, workflow, export mode |
| `adapter_`, `provider_`, `openai_`, `ollama_`, `local_` | provider/local adapter 검증 |
| `claim_`, `*_claim_boundary` | claim boundary와 claim audit |
| `containment_`, `redteam_` | security, redteam, containment |
| `production_`, `telemetry_`, `otel_`, `langfuse_` | 운영 관측성, monitoring, telemetry |
| `release_`, `rc1_`, `stable_`, `production_ready_` | release/readiness 판단 |
| `next_` | 다음 실행 계획 |
| `final_`, `handoff_`, `session_handoff_` | handoff와 종료 기록 |

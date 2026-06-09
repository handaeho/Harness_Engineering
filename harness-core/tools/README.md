# HARNESS Core Tools

`tools/`는 HARNESS Core의 executable runner/checker/audit script를 둔다.

## 구조 정책

스크립트는 action type과 domain 기준의 하위 디렉터리에 둔다.
예: `tools/checks/workspace/`, `tools/runners/openai/`, `tools/audits/release/`.

공용 helper는 `tools/lib/` 아래에 둔다.
프로젝트별 checker는 HARNESS Core 안이 아니라 새 프로젝트 루트의 `tools/`에 둔다.

## Action 디렉터리 기준

| 디렉터리 | 성격 |
|---|---|
| `checks/` | 현재 상태, gate, precommit, claim boundary 검증 |
| `runners/` | 실제 runner 또는 dry-run 실행 |
| `audits/` | claim/evidence/path boundary audit |
| `assessments/` | readiness/preflight assessment |
| `builders/` | report, export, decision packet 생성 |
| `summaries/` | evidence나 gate 결과 요약 |
| `validators/` | schema/fixture/policy validation |
| `scanners/` | prohibited claim 등 repository scan |
| `reviews/` | 실행 결과나 evidence review |
| `repairs/`, `refresh/`, `maintenance/` | repair, refresh, prune 작업 |
| `selectors/`, `triage/`, `sealers/` | case selection, blocker triage, terminal sealing |
| `lib/` | shared helper modules |

## Domain 디렉터리 기준

각 action 디렉터리 아래에는 가능한 경우 domain 디렉터리를 둔다.

| Domain | 성격 |
|---|---|
| `workspace` | HARNESS Core 자체 상태, export, current state, reference baseline |
| `release` | release gate, claim boundary, readiness, blocker |
| `adapters` | adapter contract/conformance |
| `providers` | provider verified/diverse/provider-level path |
| `openai`, `ollama`, `local` | provider/local runtime별 실행과 검증 |
| `security`, `redteam` | containment, storage redaction, redteam |
| `observability` | telemetry, monitoring, Langfuse/OTel |
| `evals`, `general` | eval fixture 또는 일반 검증 |

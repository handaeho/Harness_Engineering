# v35 Prompt User Guide

## 목적
이 문서는 v35를 현재 stable prompt stack과 Codex runtime package로 사용하는 방법을 설명합니다.

## 어떤 파일을 사용해야 하나
- 조립된 prompt bundle이 필요하면 `99_total/`을 사용합니다.
- source-of-truth stack을 확인하거나 유지보수할 때는 `00_governance/`, `01_base/`, `02_overlays/`, `03_examples/`, `04_harness/`를 확인합니다.
- Codex runtime 동작은 `codex/CODEX_RUNTIME_GUIDE.md`와 `codex/skills/*/SKILL.md`를 확인합니다.
- `99_total/codex/`는 bundled copy이며, authoritative Codex runtime execution 기준은 `v35/codex/`입니다.
- 현재 구조와 claim scope 검증은 `harness/validate_current_v35.mjs`로 실행합니다.
- 최근 current-state 검증 결과는 `validation/current_validation_result.json`에서 확인합니다.

## Source-of-Truth Stack 역할
- `00_governance/`: 안전, release, owner boundary.
- `01_base/`: 기본 실행 지침.
- `02_overlays/`: 작업 유형별 선택형 동작.
- `03_examples/`: structure-only example. factual authority가 아닙니다.
- `04_harness/`: harness contract, validation boundary, release gate.
- `99_total/`: 위 source-of-truth stack에서 재생성되는 실제 사용용 조립본입니다. 직접 편집 기준이 아닙니다.

## Codex Runtime Asset
`codex/`는 독립 runtime package입니다. `codex/skills/*`는 `00_governance/`부터 `04_harness/`까지의 textual mirror가 아닙니다. Codex runtime은 behavioral alignment, safety preservation, boundary preservation, runtime fitness 기준으로 관리합니다.

## 수정 전 주의사항
- core prompt stack asset은 silent patch로 수정하지 않습니다.
- `99_total/`은 source-of-truth 수정 후 재생성합니다.
- Codex runtime asset을 바꾸면 runtime behavior 검증을 별도로 수행하고 `99_total/codex/` bundled copy를 동기화합니다.
- example material을 factual authority로 승격하지 않습니다.
- local trace만으로 production-readiness를 주장하지 않습니다.
- active asset을 바꾸면 current docs, active records, validation result, checksum을 함께 갱신합니다.

## Claim Limit
primary-source deferred item은 downgrade 상태이며 release-grade current fact로 취급하지 않습니다. sandbox와 telemetry gap은 production-readiness claim을 제한합니다. containment proof가 생기기 전까지 containment는 downgrade 상태로 유지합니다.

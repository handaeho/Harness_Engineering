# V35 Operating Guide

## 변경 전 확인사항
- 수정하려는 파일의 owner layer를 먼저 확인합니다: governance, base, overlay, example, harness, assembled bundle, Codex runtime.
- source-of-truth stack과 Codex runtime behavior를 혼동하지 않습니다.
- unresolved limitation이 있으면 downgrade language를 유지합니다.
- 승인된 변경 이후에는 active records, validation result, checksum을 갱신합니다.

## Owner Boundary
- governance와 safety 규칙은 `00_governance/`에 둡니다.
- 기본 실행 지침은 `01_base/`에 둡니다.
- 선택형 작업 behavior는 `02_overlays/`에 둡니다.
- example은 `03_examples/`에 두며 structure-only로 유지합니다.
- harness contract와 validation rule은 `04_harness/`와 `harness/`에 둡니다.
- Codex runtime behavior는 `codex/`에 둡니다.

## Codex Runtime Independence
Codex skill은 독립 runtime asset입니다. source stack과 text parity를 요구하지 않습니다. 검증 기준은 behavioral alignment, safety preservation, boundary preservation, runtime fitness입니다.

## Current-State Documentation Rule
사용자가 읽는 active 문서는 현재 v35를 어떻게 이해하고 유지보수하는지만 설명합니다. detailed process evidence는 `_archive/v35_release_evidence_2026-05-19/`에 보존합니다.

## Rollback Trigger
다음이 발생하면 rollback review가 필요합니다.

- prompt injection regression
- approval boundary regression
- destructive action boundary regression
- secret leakage
- retrieval/factuality regression
- Codex runtime boundary regression
- example factual transfer regression
- unsupported release claim
- major runtime route regression

## 다음 버전 작업 조건
`v35.1` 또는 `v36` 작업은 별도 work area, acceptance criteria, rollback condition을 정의한 뒤 시작합니다. v35는 current stable baseline으로 보존합니다.

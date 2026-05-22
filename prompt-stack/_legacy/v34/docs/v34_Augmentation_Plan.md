# v34 증설 계획

## 개요

`v34`의 첫 구현 라운드는 `v33` runtime baseline을 계승하고 `04_harness`와 P0 harness contracts를 추가하는 단계로 정의한다.

현재 증설 라운드는 그 위에 `Agent Runtime Operating System` 개념을 추가해, `v34`를 프롬프트 평가 체계에서 runtime substrate 운영 체계로 확장하는 단계다.

## 경로 규칙

- 별도 표시가 없으면 경로는 `v34` 루트 기준이다.
- 이전 버전 baseline만 `../v33`로 표기한다.
- 디렉터리 표기는 trailing slash 없이 유지한다.

## 현재 구조 판단

- 계승한 runtime 표면:
  - `AGENTS.md`
  - `00_governance`
  - `01_base`
  - `02_overlays`
  - `03_examples`
  - `99_total`
  - `codex`
- 새 공식 layer:
  - `04_harness`
- 실행 substrate:
  - `harness`

## 이번 라운드 구현 범위

1. `v33` runtime/harness baseline carryover
2. `04_harness` owner docs 생성
3. P0 harness JSON contracts 생성
4. `PROMPT_USER_GUIDE.md`와 `CODEX_RUNTIME_GUIDE.md`에 `04_harness` 노출
5. `v34`용 harness source path와 identifiers 초기화
6. `docs` 기반 Runtime OS 문서군과 repo-legibility scaffold 추가
7. Runtime OS charter / component map / context / policy / tool / scenario asset 추가
8. `Policy -> Observability -> Evaluation` 운영 폐루프를 Runtime OS 관점으로 재정의
9. claim-strength / failure taxonomy / review gate를 Runtime OS wording으로 재정렬
10. prompt runtime behavior verification protocol, 50-case scenario catalog, mock tool suite, release thresholds 추가

## 검증 상태

- 현재 가장 강하게 정당화되는 상태:
  - `harness-designed`
- 이 구현 slice 이후 목표 상태:
  - 부분 `config-harness-ready`
- 현재 증설 verdict:
  - `Ready for P0 implementation`

# 문서 안내

이 디렉터리는 `v34`의 사람이 읽는 공식 문서 표면이다.

## 현재 기준 문서

- [agent-runtime-os.md](./agent-runtime-os.md)
  - Runtime OS 운영 기준 문서
  - runtime architecture, tool/policy/sandbox/observability contract, release 및 failure doctrine, repo legibility rule을 소유한다
- [prompt-runtime-verification.md](./prompt-runtime-verification.md)
  - 프롬프트 runtime 동작 검증 기준 문서
  - replay, eval, release threshold, scenario family 규칙을 소유한다
- [v34_Augmentation_Plan.md](./v34_Augmentation_Plan.md)
  - 현재 augmentation 계획
- [v34_Harness_Engineering_Plan.md](./v34_Harness_Engineering_Plan.md)
  - 현재 harness engineering 계획

## 읽는 순서

- runtime substrate, policy, sandbox, observability, release, failure routing을 보려면:
  - `agent-runtime-os.md`
- prompt behavior verification, replay, scenario, gate wording을 보려면:
  - `prompt-runtime-verification.md`
- 현재 구현 순서나 남은 작업을 보려면:
  - 두 개의 `v34_*Plan.md` 문서

## 경로 규칙

- 별도 표시가 없으면 경로는 `v34` 루트 기준으로 읽는다.
- 이 디렉터리 안에서는 문서 링크를 우선 사용한다.
- `validation/`은 source-of-truth가 아니라 파생 검증 보고서 표면이다.

## 현재 구조

- `docs`는 최소한의 owner surface만 남긴 상태다.
- 주제별 분리 문서는 `agent-runtime-os.md`와 `prompt-runtime-verification.md`로 병합되었다.
- 더 이상 쓰지 않는 scaffold 또는 placeholder 문서 트리는 제거되었다.

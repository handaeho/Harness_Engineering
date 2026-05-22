# V35 Limitations and Follow-Ups

## Active Downgrades
- primary-source deferred item은 downgrade 상태이며 release-grade current fact로 취급하지 않습니다.
- sandbox와 telemetry gap은 production-readiness claim을 제한합니다.
- containment proof가 생기기 전까지 containment는 downgrade 상태로 유지합니다.
- 이 release는 local runner와 semantic judge evidence 아래에서 검증되었으며 production telemetry 기반 검증이 아닙니다.
- Codex runtime readiness는 behavioral 기준으로 평가되었으며 `codex/skills`는 `00_governance/`~`04_harness/`의 textual mirror로 취급하지 않습니다.
- 이 release는 live production rollout certification이 아닙니다.

## 의미
위 항목은 숨겨진 실패가 아닙니다. v35가 주장할 수 있는 claim scope를 제한하는 현재 운영 조건입니다.

## 금지 Claim
다음 상태는 주장하지 않습니다.

- `production-monitored`
- `containment-verified`
- `all-primary-source-validated`
- `public-benchmark-certified`
- `live-production-rollout-certified`

## Follow-Up Backlog
- primary-source validation follow-up: deferred source claim을 공식 출처로 검증하기 전까지 current fact로 승격하지 않습니다.
- sandbox / containment follow-up: sandbox downgrade와 containment proof를 분리해 추적합니다.
- telemetry follow-up: local trace와 production telemetry를 구분합니다.
- Codex runtime watch: routing, boundary preservation, independent runtime behavior를 계속 확인합니다.
- post-release drift watch: prompt injection resistance, approval boundary, destructive action boundary, retrieval/factuality, example boundary, technique over-activation, verify-before-claim, claim strength language, Codex runtime routing을 추적합니다.

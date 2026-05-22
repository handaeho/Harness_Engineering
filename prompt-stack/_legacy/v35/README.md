# v35

v35는 평가된 prompt stack과 Codex runtime package의 현재 stable release입니다.

## 포함 내용
- `00_governance/`: 거버넌스, 소유권, 안전 경계.
- `01_base/`: 기본 prompt stack 지침.
- `02_overlays/`: 작업 필요에 따라 활성화하는 선택형 overlay.
- `03_examples/`: 구조 참고용 example. 사실 근거로 사용하지 않습니다.
- `04_harness/`: harness contract, 검증 경계, release gate 규칙.
- `99_total/`: `00_governance/`부터 `04_harness/`까지를 기준으로 재생성되는 실제 사용용 assembled prompt bundle.
- `codex/`: authoritative Codex runtime guide와 skill package.
- `99_total/codex/`: `codex/` 기준으로 동기화된 bundled copy. Codex runtime 실행 기준은 `v35/codex/`입니다.
- `docs/`: 현재 상태 중심의 운영 문서.
- `harness/`: 현재 v35 검증 entrypoint.
- `records/`: 최소 운영용 machine-readable record.
- `reports/`: 사람이 읽는 현재 상태 summary.
- `validation/`: 현재 validation suite와 결과.

## 먼저 읽을 문서
1. `PROMPT_USER_GUIDE.md`: v35 사용 방법.
2. `docs/V35_CURRENT_STATE.md`: 현재 상태 요약.
3. `docs/V35_OPERATING_GUIDE.md`: 수정과 유지보수 규칙.
4. `docs/V35_LIMITATIONS_AND_FOLLOWUPS.md`: 제한 사항과 후속 작업.

## Claim Scope
v35에 대해 주장할 수 있는 범위는 local runner, actor-output, semantic-judge, release-gate evidence로 검증된 범위에 한정합니다.

다음 표현은 사용하지 않습니다: `production-monitored`, `containment-verified`, `all primary-source items fully validated`, `public benchmark certified`, `live production rollout certified`.

## 현재 제한
primary-source deferred item, sandbox gap, telemetry gap, containment proof는 모두 명시적 downgrade 상태입니다. 이는 실패가 아니라 release claim scope 제한입니다.

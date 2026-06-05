# Agent-Ready Self-Contained Mode

## 목적

새 에이전트가 `harness-core-agent-ready.zip`만 받은 상태에서도 최소 health check를 실행할 수 있게 하는 모드다.
`harness-core-final-agent-ready.zip`은 legacy export name이며 새 전달용 canonical artifact가 아니다.

## 실행 명령

Agent-ready export mode에서 압축 해제 직후 실행할 첫 명령:

```bash
node tools/check_agent_ready_self_contained.mjs
```

이어 reference baseline snapshot integrity만 확인한다.

```bash
node tools/check_reference_baseline_integrity.mjs
```

이 명령은 Node.js built-in module만 사용한다. `npm install`, `npm ci`, `node_modules`, legacy reference source 접근을 요구하지 않는다.
Agent-ready export mode에는 `.git` metadata가 없으므로 `node tools/check_current_state_alignment.mjs`를 기본 명령으로 사용하지 않는다. 해당 checker는 root workspace mode 전용이다.

## 검사 범위

- `CURRENT_STATE.json`과 `CURRENT_STATE.yaml` 존재 여부
- agent bootstrap 문서와 agent profile 존재 여부
- `evidence/current-state/*` 핵심 파일 존재 여부
- `evidence/reference-baseline/file_inventory.json` 및 `checksums.json` snapshot 존재 여부
- reference baseline snapshot의 `.DS_Store` path 제외 여부
- weak self-contained claim만 기록되고 strong claim은 계속 blocked인지 여부

## 제외 범위

이 모드는 provider execution, adapter conformance, local model generation, telemetry sink write, redteam rerun, release gate rerun을 수행하지 않는다.

## Claim Boundary

새로 기록 가능한 claim은 다음 weak claim뿐이다.

- `self-contained-agent-ready-check-recorded`
- `self-contained-clean-export-checked`
- `current-state-json-recorded`

다음 strong claim은 계속 닫혀 있다.

- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`

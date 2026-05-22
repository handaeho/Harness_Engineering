# Prompt Stack

`v36/`은 현재 stable prompt harness package다. 목적은 장기 운영 가능한 agent 실행 구조를 제공하는 것이다.

## 시작점
- 사람 사용자는 `PROMPT_USER_GUIDE.md`를 먼저 읽는다.
- 일반 agent는 `AGENTS.md` 또는 `MASTER_PROMPT_ROUTER.md`에서 시작한다.
- Codex 코딩 agent는 `codex/AGENTS.md`와 `codex/CODEX_RUNTIME_GUIDE.md`를 읽는다.

## 실행 도메인
- `autonomous/`: 완전 자율형 agent용 source-of-truth 및 조립 자산이다.
- `codex/`: Codex 코딩 agent용 runtime package다.
- `state/`, `verification/`, `lifecycle/`: 상태, 검증, 세션 시작/종료를 담당한다.
- `harness/`, `validation/`: 현재 package 검증 runner와 validation suite를 제공한다.
- `_evidence/v36/`: active package에서 분리된 evidence package다.

## 빠른 검증
```powershell
node prompt-stack/v36/harness/validate_current_v36.mjs
node prompt-stack/v36/harness/validate_assembled_bundle.mjs
node prompt-stack/v36/harness/validate_codex_runtime.mjs
```

## 현재 제한
운영 telemetry, containment proof, provider 다양성 검증은 후속 항목이다. 현재 claim은 local validation, assembled bundle validation, Codex runtime validation, 보존된 evidence 범위로 제한한다.

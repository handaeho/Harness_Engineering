# Prompt Stack

`<current_package>/`은 현재 stable prompt harness package다. 목적은 장기 운영 가능한 agent 실행 구조를 제공하는 것이다.

## 시작점
- 사람 사용자는 `PROMPT_USER_GUIDE.md`를 먼저 읽는다.
- 일반 agent는 `AGENTS.md` 또는 `MASTER_PROMPT_ROUTER.md`에서 시작한다.
- Codex 코딩 agent는 `codex/AGENTS.md`와 `codex/CODEX_RUNTIME_GUIDE.md`를 읽는다.
- Gemini CLI 코딩 agent는 `gemini/GEMINI.md`와 `gemini/GEMINI_RUNTIME_GUIDE.md`를 읽는다. `gemini/AGENTS.md`는 AGENTS-style loader 호환 entrypoint다.

## 실행 도메인
- `autonomous/`: 완전 자율형 agent용 source-of-truth 및 조립 자산이다.
- `codex/`: Codex 코딩 agent용 runtime package다.
- `gemini/`: Google Gemini CLI/API용 coding-agent runtime package다. `.gemini/GEMINI.md`와 `.gemini/skills/*/SKILL.md` 배치를 1차 적용 방식으로 삼고, native Gemini API가 1차 lane이며 OpenAI compatibility는 별도 호환 lane이다.
- `state/`, `verification/`, `lifecycle/`: 상태, 검증, 세션 시작/종료를 담당한다.
- `harness/`, `validation/`: 현재 package 검증 runner와 validation suite를 제공한다.
- `_evidence/<current_package>/`: active package에서 분리된 evidence package다.

## 빠른 검증
```powershell
node prompt-stack/<current_package>/harness/validate_current.mjs
node prompt-stack/<current_package>/harness/validate_assembled_bundle.mjs
node prompt-stack/<current_package>/harness/validate_codex_runtime.mjs
node prompt-stack/<current_package>/harness/validate_gemini_runtime.mjs
```

## 현재 제한
운영 telemetry, containment proof, provider 다양성 검증은 후속 항목이다. 현재 claim은 local validation, assembled bundle validation, Codex runtime validation, Gemini static runtime validation, 보존된 evidence 범위로 제한한다.

## 용도 분리
`prompt-stack/<current_package>/codex`와 `prompt-stack/<current_package>/gemini`는 코딩 agent에 적용하는 prompt/runtime 자산이다. `harness-core`의 provider adapter, runner, checker, evidence 자산은 완전 자율형 프로그래밍 agent runtime용이며 prompt-stack runtime package가 아니다.

자세한 경계는 `docs/RUNTIME_SURFACE_BOUNDARIES.md`를 따른다.

# v33 Augmentation Plan

## Acknowledgment

`prompt-stack/v33`의 이번 보강 라운드는 `v32`의 `Agentic_Design_Patterns.pdf` 반영도를 유지한 채, 프로그래밍용 AI 코딩 에이전트 프롬프트 패키지와 최신 공식-source 규칙을 증분 반영하는 작업으로 정의했다.

## Analysis

### Baseline

- baseline prompt surface:
  - [AGENTS.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/AGENTS.md:1>)
  - [01_base](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/01_base:1>)
  - [02_overlays](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/02_overlays:1>)
  - [03_examples](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/03_examples:1>)
  - [codex](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/codex:1>)
- baseline reference:
  - `prompt-stack/v32`
  - `Agentic_Design_Patterns.pdf`
- additive reference classes:
  - 공식 모델/플랫폼 문서 기반 최신 프롬프트 엔지니어링 지침
  - 개발자 커뮤니티 실무 패턴 기반 heuristic

### Non-negotiables

- `v32`의 구조와 runtime owner 체계를 파괴하지 않는다.
- 폴더 구조와 산출물 계층은 유지한다.
- `Agentic_Design_Patterns.pdf`에 이미 잘 반영된 규칙은 재작성하지 않고 보강만 수행한다.
- 최신성이 필요한 프로그래밍 관련 지침은 공식 문서를 우선한다.
- 커뮤니티 패턴은 `authority`가 아니라 `repeated field heuristic`로만 반영한다.

### Planned augmentation streams

1. 프로그래밍용 prompt-package 강화
   - reusable coding-agent instruction
   - repo-persistent instruction examples
   - task-local prompt templates
   - evaluation set / failure-improvement loop
2. Codex runtime propagation
   - [CODEX_RUNTIME_GUIDE.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/codex/CODEX_RUNTIME_GUIDE.md:1>)
   - [coding-core SKILL.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/codex/skills/coding-core/SKILL.md:1>)
   - [eval-ops SKILL.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/codex/skills/eval-ops/SKILL.md:1>)
   - [grounded-research SKILL.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/codex/skills/grounded-research/SKILL.md:1>)
3. Safety and authority boundary 강화
   - external docs / README / issue / PR / log / webpage / tool output를 data로만 취급
   - prompt injection / indirect prompt injection 방어 강화
4. 검증 체계 재실행
   - document-level benchmark rerun
   - separated external harness rerun
   - frozen release-gate repeat rerun
   - scenario checklist refresh

### Success criteria

- `v33`의 runtime prompt surface가 `v32` 대비 좁은 범위의 증분 패치로 갱신된다.
- 프로그래밍 목적의 reusable prompt package 설계 규칙이 runtime owner 문서에 직접 노출된다.
- freshness-sensitive programming guidance에서 official-source priority가 명시된다.
- AI-generated code를 `draft-grade`로 취급하고 verification / human review / rollback path를 분리하는 규칙이 직접 노출된다.
- 최신 `v33` 하니스로 behavior-facing evidence를 다시 확보한다.
- validation docs의 제목, 링크, 내용이 모두 `v33`와 `2026-05-18` 기준으로 정렬된다.

### Validation plan

1. `v32 -> v33` prompt-surface delta audit
2. `BR-00` ~ `BR-22` benchmark registry 재사용
3. `PG-*` programming supplement registry 추가
4. separated external harness full-suite rerun
5. frozen release-gate repeat cohort rerun
6. scenario checklist를 packet-floor + community-practice 항목까지 확장

## Execution

실행 완료 기준으로 실제 수행된 검증 흐름은 다음 문서에 기록한다.

- 결과 요약: [v33_Augmentation_Results.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_Augmentation_Results.md:1>)
- benchmark registry: [v33_Guide_Reflection_Benchmark_Strategy.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_Guide_Reflection_Benchmark_Strategy.md:1>)
- benchmark rerun: [v33_Guide_Reflection_Benchmark_Run_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_Guide_Reflection_Benchmark_Run_2026-05-18.md:1>)
- full guide traceability: [v33_Full_Guide_Traceability_Matrix_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_Full_Guide_Traceability_Matrix_2026-05-18.md:1>)
- external harness: [v33_External_Harness_Run_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_External_Harness_Run_2026-05-18.md:1>)
- release gate: [v33_Release_Gate_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_Release_Gate_2026-05-18.md:1>)
- scenario validation: [v33_Scenario_Validation_Run_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_Scenario_Validation_Run_2026-05-18.md:1>)

## Verification

- runtime prompt surface file count는 frozen manifest 기준 `20`개로 유지한다.
- validation harness asset count는 frozen manifest 기준 `5`개다.
- release-gate policy는 [release_gate_policy.json](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/harness/freezes/rg-2026-05-18-a/release_gate_policy.json:1>)에 고정한다.
- completion language는 [v33_Release_Gate_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_Release_Gate_2026-05-18.md:1>)의 실제 decision을 넘어서지 않는다.

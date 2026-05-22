# v17 Augmentation Results

## 0. 결과 요약

`v17_Augmentation_Plan.md`를 기준으로 `prompt-stack/v17`의 실행 계층 문서들을 실제 보강했다.

이번 보강의 초점은 단순 chapter 추가가 아니라, `v17` 스택이 실제 agentic runtime에서 더 안정적으로 작동하도록 다음 제어면을 명시하는 것이었다.

- `Runtime Constitution Contract`
- `Agentic Substrate Readiness`
- `Goal Quality and Termination`
- `Coding-Agent Working-Set Context`
- `Supervisor / Stagnation / Long-Run Control`
- `Safe Proactivity Boundary`

결과적으로 `v17`은 이제:

- runtime bundle이 무엇을 반드시 보여줘야 하는지 더 명확하고
- substrate가 약할 때 autonomy를 줄여야 한다는 규칙이 더 선명하며
- 반복 실행과 stagnation을 중단 또는 escalation 대상으로 다루고
- coding-agent가 어떤 active slice를 유지해야 하는지 더 구체적으로 갖게 되었다.

---

## 1. 실제 반영 범위

보강한 active 문서:

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`

동기화한 mirror 문서:

- `99_original/PROMPT_guideline.md`
- `99_original/PROMPT_full.md`
- `99_original/PROMPT_light.md`
- `99_original/PROMPT_lightest.md`
- `99_original/PROMPT_standalone.md`
- `99_original/PROMPT_tool_protocol_overlay.md`
- `99_original/PROMPT_evaluation_monitoring_overlay.md`
- `99_original/PROMPT_guardrails_safety_overlay.md`
- `99_original/PROMPT_multi_agent_overlay.md`
- `99_original/PROMPT_memory_adaptation_overlay.md`
- `99_original/PROMPT_retrieval_grounding_overlay.md`

이번 라운드에서 의도적으로 보류한 영역:

- `03_examples/*`
- `02_overlays/PROMPT_search_reasoning_overlay.md`

보류 이유:

- 이번 계획의 우선순위가 example 구조 확장과 search-reasoning carryover보다 runtime control, tool-readiness, goal termination, codex skill alignment 보강에 있었기 때문이다.

---

## 2. 핵심 보강 내용

### 2.1 Runtime Constitution Contract

`PROMPT_guideline`에 runtime bundle이 최소한 보여줘야 하는 슬롯을 명시했다.

- `Role and Goal`
- `Capabilities / Tools`
- `Constraints / Guardrails`
- `Execution Process`
- `Approval / Escalation Boundary`
- `Trajectory / Example Policy`

이 슬롯들은 `PROMPT_full`, `AGENTS.md`, `PROMPT_USER_GUIDE.md`에도 carryover되어, governance 문서에만 있고 실제 runtime 문서에는 없는 상태를 줄였다.

### 2.2 Agentic Substrate Readiness

`PROMPT_guideline`과 `PROMPT_tool_protocol_overlay`에 `Agentic substrate readiness`를 추가했다.

핵심 의미:

- capability fit만 맞아도 실행하면 안 된다
- data / metadata / schema / API / failure semantics / rollback surface가 agent-usable해야 한다
- substrate가 약하면 autonomy를 강화하지 말고, narrower path, deterministic wrapper, propose-only로 내려가야 한다

같은 맥락으로 `PROMPT_retrieval_grounding_overlay`에는 weak provenance, stale indexing, poor chunking, ambiguous metadata를 evidence-surface defect로 취급하는 규칙을 넣었다.

### 2.3 Goal Quality, Termination, and Stagnation

`PROMPT_guideline`의 goal-monitoring owner surface에 다음이 추가됐다.

- success proxy 또는 solved condition 명시
- failure / drift / stagnation 신호 명시
- iteration / budget / time-horizon 경계
- monitoring이 약할 때 escalation 또는 stop trigger

이 doctrine은 `PROMPT_full`, `PROMPT_light`, `PROMPT_lightest`, `PROMPT_standalone`에 압축 수준별로 전개됐다.

또한 `PROMPT_evaluation_monitoring_overlay`에는:

- `Stagnation` 개념
- `stagnation or no-gain iteration rate`
- `runaway loop or no-progress repetition`
- iterative autonomy에 대한 stagnation threshold rule

이 들어가서 monitoring이 단순 관찰이 아니라 stop/governance signal로 연결되도록 만들었다.

### 2.4 Coding-Agent Working-Set Context

`PROMPT_standalone`, `AGENTS.md`, `codex/skills/coding-core/SKILL.md`에 coding-agent working-set 규칙을 보강했다.

추가된 active-slice 요소:

- active files or file slice
- directory or subsystem map when navigation matters
- recent diffs only
- latest relevant failing checks or logs
- current checkpoint
- unresolved blockers

핵심 의도:

- repo-wide context drag를 줄이고
- code-edit loop에서 지금 중요한 정보만 유지하며
- reread / re-edit / failed-check 반복이 생길 때 stagnation으로 인식하도록 만드는 것이다.

### 2.5 Supervisor, Multi-Agent, Safe Proactivity, and Codex Skill Carryover

`PROMPT_guardrails_safety_overlay`에는:

- proactive assistance를 explicit scope와 approval boundary 안에 두는 규칙
- supervisor / watchdog intervention observability
- weak-progress 상태에서 autonomy를 줄였는지 기록하는 신호

를 넣었다.

`PROMPT_multi_agent_overlay`에는:

- delegation churn detection
- repeated handoff loop
- repeated failed reintegration
- checkpoint / pause / cancel responsibility

를 추가했다.

`PROMPT_memory_adaptation_overlay`에는 `Safe proactivity boundary`를 추가해, personalization memory가 latent goal에 대한 hidden commitment로 굳어지는 것을 막도록 했다.

이후 codex skill 문서들에도 같은 개선을 carryover했다.

- `coding-core`
  - solved-condition / stagnation / validation-surface control
  - code-surface readiness
  - anti-scope-widening rule 강화

- `design-analysis`
  - decision-quality and stagnation-stop control
  - design-substrate readiness
  - delegation churn collapse rule

- `eval-ops`
  - decision-quality / gate-owner / escalation threshold 명시
  - measurement-substrate readiness
  - no-gain rerun loop와 stagnation threshold 규칙 추가

- `grounded-research`
  - research-control and low-yield termination rule
  - evidence-substrate readiness
  - inferred adjacent-question expansion 억제

---

## 3. 정합성 처리

### 3.1 Mirror sync

core prompt 문서에 대해서는 active 문서 변경을 `99_original` mirror에 동기화했다.

이번 라운드에서 mirror 대상이 아닌 문서:

- `PROMPT_USER_GUIDE.md`
- `AGENTS.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`

이 문서들은 `99_original` 대응 파일이 없으므로 active 문서만 유지했다.

### 3.2 Versionless reference integrity

이번 보강으로 owner/base/overlay/host-runtime/skill 문서에 새로운 versioned prompt filename reference를 추가하지 않았다.

즉, `PROMPT_v17_*` 같은 방식의 참조는 도입하지 않았다.

---

## 4. 검증

실행한 검증:

1. `rg`로 핵심 doctrine 삽입 위치를 확인했다.
2. `rg`로 versioned prompt filename reference가 새로 생기지 않았음을 확인했다.
3. `99_original` mirror 대상 파일들에 대해 `SHA256` hash 일치를 확인했다.

검증 결과:

- `Runtime constitution contract` 반영 확인
- `Goal quality and termination doctrine` 반영 확인
- `Agentic substrate readiness` 반영 확인
- `Safe proactivity boundary` 반영 확인
- `Working-set rule` 반영 확인
- codex skill 4종에 `stagnation`, `readiness`, `task-control` carryover 확인
- mirror 대상 11개 파일 hash 일치 확인

`Limitation`

- 이번 작업은 문서 보강 작업이므로 executable regression test나 runtime behavior simulation은 수행하지 않았다.
- 따라서 검증 상태는 “문서 반영 확인 + mirror 정합성 확인” 수준이며, 실제 prompt behavior regression은 별도 eval run이 필요하다.

---

## 5. 후속 권장 작업

다음 단계로 유효한 작업은 아래 정도다.

1. `v17` 기준 eval set을 만들어 stagnation-stop, substrate downgrade, propose-only fallback이 실제로 동작하는지 확인
2. `PROMPT_search_reasoning_overlay`와 example layer에 이번 doctrine을 선택적으로 carryover
3. codex skill과 overlay가 함께 작동하는 cross-skill eval 시나리오를 추가해 carryover semantics가 실제 runtime에서도 유지되는지 확인

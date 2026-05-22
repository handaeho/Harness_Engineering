# v33 Guide Reflection Benchmark Strategy

## Acknowledgment

이 문서는 `Agentic_Design_Patterns.pdf` 기반의 기존 `BR-*` benchmark registry를 유지하면서, `v33`에서 추가된 프로그래밍용 supplement를 함께 검증하기 위한 고정 registry다.

## Analysis

### In-scope runtime owners

- [AGENTS.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/AGENTS.md:1>)
- [01_base](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/01_base:1>)
- [02_overlays](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/02_overlays:1>)
- [03_examples](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/03_examples:1>)
- [codex](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/codex:1>)

### Supplementary but not runtime owners

- [PROMPT_USER_GUIDE.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/PROMPT_USER_GUIDE.md:1>)
  - purpose:
    - package composition guidance
    - operator-facing selection help
  - non-purpose:
    - runtime owner 대체
- top-level validation docs
  - benchmark / replay / release / scenario artifacts
  - behavior evidence 기록용

### Stop criteria

- `BR-00` ~ `BR-22`에 대해 runtime-owner regression이 없어야 한다.
- `PG-*` supplement가 actual runtime / skill surface에 직접 드러나야 한다.
- external content를 instruction이 아닌 data로 다루는 경계가 명시돼야 한다.
- official-source freshness rule이 latest programming guidance에서 직접 노출돼야 한다.
- stronger behavior proof가 필요할 때 artifact ladder가 explicit해야 한다.

### Artifact ladder

1. document-level benchmark
   - chapter-family owner and route audit
2. separated external harness
   - single-run behavior-facing evidence
3. frozen release gate
   - repeated-run stability and promote/hold decision

## Execution

### Fixed guide-family registry

| ID | Family | Benchmark question | Expected in-scope answer surface |
| --- | --- | --- | --- |
| `BR-00` | Runtime owner integrity | 실제 runtime 문서가 operator-only 문서에 ownership을 위임하지 않는가? | `03_examples`, `codex` |
| `BR-01` | Prompt Chaining | staged chaining은 언제 정당화되고 무엇을 explicit하게 남기는가? | `01_base`, `codex` |
| `BR-02` | Routing | direct solve / retrieval / tool / multi-agent / propose-only route를 어떻게 고르는가? | `01_base`, `02_overlays`, `codex` |
| `BR-03` | Parallelization | parallel fan-out과 join artifact/validation step은 어떻게 관리되는가? | `01_base`, `02_overlays`, `codex` |
| `BR-04` | Reflection | bounded critique와 no-gain stop rule은 어떻게 유지되는가? | `01_base`, `02_overlays`, `codex` |
| `BR-05` | Tool Use | scope, capability fit, partial state, semantic success를 어떻게 분리하는가? | `02_overlays`, `codex` |
| `BR-06` | Planning | planning은 언제 optional이고 언제 visible checkpoint가 필요한가? | `01_base`, `codex` |
| `BR-07` | Multi-Agent | multi-agent topology는 언제 justified되고 어떤 join contract가 필요한가? | `02_overlays`, `codex` |
| `BR-08` | Memory Management | continuity와 checkpoint는 무엇을 보존하고 무엇을 버리는가? | `01_base`, `02_overlays`, `codex` |
| `BR-09` | Learning and Adaptation | judged signal이 default를 바꾸려면 어떤 review path가 필요한가? | `02_overlays`, `codex` |
| `BR-10` | MCP | capability discovery와 MCP handoff는 어떻게 드러나는가? | `02_overlays`, `03_examples`, `codex` |
| `BR-11` | Goal Setting and Monitoring | goal-state, progress, stop, replan signal은 어떻게 유지되는가? | `01_base`, `03_examples`, `codex` |
| `BR-12` | Exception Handling and Recovery | fallback / rollback / escalation ladder는 무엇인가? | `01_base`, `02_overlays`, `codex` |
| `BR-13` | Human-in-the-Loop | review, approval, propose-only, acceptance state는 어떻게 분리되는가? | `01_base`, `02_overlays`, `03_examples`, `codex` |
| `BR-14` | Knowledge Retrieval / RAG | evidence target, provenance, freshness, conflict handling은 어떻게 정의되는가? | `02_overlays`, `codex` |
| `BR-15` | Inter-Agent Communication / A2A | handoff, lifecycle state, task identifier, async tracking은 어떻게 유지되는가? | `02_overlays`, `03_examples`, `codex` |
| `BR-16` | Resource-Aware Optimization | complexity / risk / budget / degradation rule은 어떻게 route choice에 반영되는가? | `01_base`, `02_overlays`, `codex` |
| `BR-17` | Reasoning Techniques | decomposition, step-back, self-consistency, ReAct-like loop는 언제 허용되는가? | `01_base`, `02_overlays`, `03_examples`, `codex` |
| `BR-18` | Guardrails / Safety | layered guardrail, containment, escalation, disclosure boundary는 어떻게 유지되는가? | `01_base`, `02_overlays`, `codex` |
| `BR-19` | Evaluating and Monitoring | metric / threshold / owner / action과 benchmark loop는 어떻게 정의되는가? | `02_overlays`, `03_examples`, `codex` |
| `BR-20` | Prioritization | next action ranking과 re-prioritization trigger는 무엇인가? | `01_base`, `02_overlays`, `03_examples`, `codex` |
| `BR-21` | Exploration and Discovery | bounded frontier, stop condition, fallback route는 어떻게 관리되는가? | `01_base`, `02_overlays`, `codex` |
| `BR-22` | Appendix A / Advanced Prompting | advanced prompting family가 runtime aid로만 쓰이고 policy owner가 되지 않게 막는가? | `01_base`, `02_overlays`, `03_examples` |

### Programming supplement registry

| ID | Family | Benchmark question | Expected owner surface |
| --- | --- | --- | --- |
| `PG-01` | Programming prompt-package mode | reusable coding-agent prompt package를 어떻게 구성하는가? | `codex`, `03_examples`, `PROMPT_USER_GUIDE` |
| `PG-02` | Persistent vs task-local split | repo-persistent rule과 task-local prompt를 어떻게 분리하는가? | `01_base`, `codex`, `PROMPT_USER_GUIDE` |
| `PG-03` | Fresh official-source priority | latest SDK/framework/API/model guidance에서 공식 문서를 어떻게 우선하는가? | `01_base`, `02_overlays`, `grounded-research`, `codex` |
| `PG-04` | Coding report contract | used context / assumptions / verification loop / rollback path를 어떻게 보고하는가? | `coding-core`, `codex`, `03_examples` |
| `PG-05` | External content as data | README / issue / PR / log / webpage를 instruction이 아닌 data로 어떻게 처리하는가? | `01_base`, `02_overlays`, `codex` |
| `PG-06` | Community-practice layering | community heuristic를 공식 문서보다 낮은 권위로 어떻게 배치하는가? | `PROMPT_USER_GUIDE`, `codex`, `eval-ops` |

## Verification

- benchmark rerun record:
  - [v33_Guide_Reflection_Benchmark_Run_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_Guide_Reflection_Benchmark_Run_2026-05-18.md:1>)
- stronger behavior artifacts:
  - [v33_External_Harness_Run_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_External_Harness_Run_2026-05-18.md:1>)
  - [v33_Release_Gate_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_Release_Gate_2026-05-18.md:1>)

# v32 Guide Reflection Benchmark Strategy

## Acknowledgment

이 문서는 `Agentic_Design_Patterns.pdf`를 기준으로 `prompt-stack/v32`의 실제 프롬프트 성능 표면인 `01_base`, `02_overlays`, `03_examples`, `codex` 문서군을 반복 검증하기 위한 고정 benchmark registry다.

## Analysis

- In-scope runtime surfaces:
  - `01_base/*`
  - `02_overlays/*`
  - `03_examples/*`
  - `codex/*`
- Verification-only reference:
  - `00_governance/PROMPT_guideline.md`
  - purpose: owner boundary and packet-floor canon 확인용
  - non-purpose: in-scope runtime surface 대체 금지
- Out-of-scope as performance owner:
  - `PROMPT_USER_GUIDE.md`
  - top-level operator prose not inside the scoped folders
- Loop contract:
  1. 고정된 chapter-family benchmark set을 유지한다.
  2. 각 질문은 in-scope runtime surface만으로 답한다.
  3. 답을 guide expectation과 비교한다.
  4. `missing`, `indirect`, `stale-owner`, `operator-only dependency` finding이 있으면 actual prompt docs를 패치한다.
  5. 같은 질문 세트를 재실행한다.

Stop criterion:
- core guide chapters 1-21과 `Appendix A / Advanced Prompting Techniques`가 모두 `Pass`
- required runtime behavior가 operator-only prose에만 의존하지 않음
- stale ownership claim이 in-scope runtime / skill surface에서 제거됨
- 남는 약점은 `Need Verification` 또는 명시적 scope exclusion 뿐임

## Execution

### Fixed benchmark registry

| ID | Family | Benchmark question | Expected in-scope answer surface |
| --- | --- | --- | --- |
| `BR-00` | Runtime owner integrity | 실제 runtime 문서가 아직도 operator-only 문서에 ownership을 위임하고 있지 않은가? | `03_examples`, `codex` |
| `BR-01` | Prompt Chaining | staged chaining은 언제 정당화되고, 무엇을 explicit하게 남겨야 하는가? | `01_base`, `codex` |
| `BR-02` | Routing | direct solve / retrieval / tool / multi-agent / propose-only 사이 route choice는 어떻게 결정되는가? | `01_base`, `02_overlays`, `codex` |
| `BR-03` | Parallelization | parallel fan-out은 언제 허용되고, join artifact와 validation step은 어떻게 유지되는가? | `01_base`, `02_overlays`, `codex` |
| `BR-04` | Reflection | bounded critique는 언제 쓰고, no-gain loop는 어떻게 멈추는가? | `01_base`, `02_overlays`, `codex` |
| `BR-05` | Tool Use | external interaction은 어떻게 scope, capability fit, partial state, semantic success로 관리되는가? | `02_overlays`, `codex` |
| `BR-06` | Planning | planning은 언제 optional이고 언제 visible plan이 필요한가? | `01_base`, `codex` |
| `BR-07` | Multi-Agent | multi-agent topology는 언제 justified되고 어떤 role/join contract가 필요한가? | `02_overlays`, `codex` |
| `BR-08` | Memory Management | continuity와 checkpoint는 무엇을 보존하고 무엇을 버려야 하는가? | `01_base`, `02_overlays`, `codex` |
| `BR-09` | Learning and Adaptation | judged signal이 future default를 바꾸려면 어떤 review / decision path가 필요한가? | `02_overlays`, `codex` |
| `BR-10` | MCP | capability discovery와 MCP handoff는 어떻게 드러나야 하는가? | `02_overlays`, `03_examples`, `codex` |
| `BR-11` | Goal Setting and Monitoring | goal-state contract와 progress / stop / replan signal은 어떻게 유지되는가? | `01_base`, `03_examples`, `codex` |
| `BR-12` | Exception Handling and Recovery | recovery ladder와 fallback / rollback / escalation doctrine은 무엇인가? | `01_base`, `02_overlays`, `codex` |
| `BR-13` | Human-in-the-Loop | approval, review, propose-only, acceptance state는 어떻게 분리되는가? | `01_base`, `02_overlays`, `03_examples`, `codex` |
| `BR-14` | Knowledge Retrieval / RAG | evidence target, provenance, freshness, conflict handling은 어떻게 정의되는가? | `02_overlays`, `codex` |
| `BR-15` | Inter-Agent Communication / A2A | handoff, lifecycle state, task identifier, async tracking은 어떻게 유지되는가? | `02_overlays`, `03_examples`, `codex` |
| `BR-16` | Resource-Aware Optimization | complexity / risk / budget / graceful degradation은 어떻게 route choice에 반영되는가? | `01_base`, `02_overlays`, `codex` |
| `BR-17` | Reasoning Techniques | decomposition, step-back, self-consistency, ReAct, bounded reasoning은 언제 허용되는가? | `01_base`, `02_overlays`, `03_examples`, `codex` |
| `BR-18` | Guardrails / Safety | layered guardrail, containment, escalation, disclosure boundary는 어떻게 유지되는가? | `01_base`, `02_overlays`, `codex` |
| `BR-19` | Evaluating and Monitoring | metric/gate/threshold/owner/action과 guide-reflection benchmark loop는 어떻게 정의되는가? | `02_overlays`, `03_examples`, `codex` |
| `BR-20` | Prioritization | next action ranking과 re-prioritization trigger는 무엇인가? | `01_base`, `02_overlays`, `03_examples`, `codex` |
| `BR-21` | Exploration and Discovery | bounded frontier, stop condition, fallback route는 어떻게 관리되는가? | `01_base`, `02_overlays`, `codex` |
| `BR-22` | Appendix A / Advanced Prompting | advanced prompting family는 어떻게 runtime aid로만 쓰이고 policy owner가 되지 않게 막는가? | `01_base`, `02_overlays`, `03_examples` |

### Scoring rule

- `Pass`: 질문에 대한 authoritative answer path가 in-scope runtime surface 안에서 직접 보인다.
- `Soft Fail`: 의미는 존재하지만 codex/example carryover가 약하거나 maintenance task에서 direct lookup이 부족하다.
- `Fail`: stale owner, operator-only dependency, 또는 missing control boundary가 있다.
- `Need Verification`: 문서-level로는 통과하지만 live assembled prompt replay가 아직 없다.

## Impact & Risk

- 이 registry는 keyword hit audit가 아니다.
- guide chapter title이 없더라도 answerability가 direct이면 통과할 수 있다.
- 반대로 텍스트 hit가 있어도 owner boundary가 틀리거나 operator-only surface에 의존하면 실패다.
- 이 registry는 document-grounded benchmark다. 실제 모델 replay나 cohort benchmark를 자동으로 대체하지 않는다.

## Verification

- Check by:
  1. 같은 benchmark question set을 iteration마다 고정 유지한다.
  2. patch 후 `in-scope runtime surface`에서만 answer path가 보이는지 다시 확인한다.
  3. 최종 판정에서 `Need Verification`과 live replay limitation을 분리 기록한다.

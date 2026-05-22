# PROMPT_harness_engineering

## 0. Purpose

이 문서는 `v34`에서 `harness engineering`을 공식 prompt-stack layer로 승격하기 위한 owner 문서다.

핵심 목적:

- harness를 prompt 바깥의 실행 운영 계층으로 명시
- `Guide + Sensor + Runner + Simulator + Sandbox + Telemetry + Gate` 모델을 고정
- prompt fix와 harness fix를 구분
- trace-first failure handling을 기본 경로로 고정

## 1. Core Definition

- Harness는 모델을 둘러싼 실행 환경 전체다.
- Harness에는 prompt, instruction files, tools, MCP, runtime, runner, mock tools, simulator, sandbox, filesystem, memory, identity, policy, artifact store, telemetry, approval boundary, replay program, release gate가 포함된다.
- 좋은 harness는 `feedforward guide`와 `feedback sensor`를 함께 가진다.
- harness engineering은 prompt engineering만이 아니다.
- 사람의 역할은 코드 직접 작성보다 agent가 안정적으로 읽고, 실행하고, 검증하고, 수정할 수 있는 환경을 설계하는 쪽으로 이동한다.

## 2. Activation Levels

### 2.1 Always-on minimum

- instruction boundary
- approval boundary
- read/write scope
- verify-before-claim
- bounded change

### 2.2 Conditional harness

다음 중 하나가 있으면 강화한다.

- tool use
- multi-turn workflow
- external state dependency
- higher-risk mutation
- reproducibility requirement

강화 항목:

- trace capture
- mock tool or dedicated runner
- sandbox policy
- outcome vs trajectory grading

### 2.3 Release-grade harness

다음 중 하나가 있으면 release-grade로 올린다.

- repeated replay decision
- promotion or hold decision
- live telemetry or anomaly review
- long-running coding continuity

필수 항목:

- stable isolated runner
- trace and telemetry lineage
- replay reproducibility
- explicit gate owner, threshold, action

## 2A. Harness Maturity Levels

- `prompt-reviewed`
- `harness-designed`
- `config-harness-ready`
- `code-defined-harness-ready`
- `harness-executed`
- `replay-verified`
- `release-gated`
- `production-monitored`

Maturity rule:

- `config-harness-ready`는 model, prompt, tools, memory, identity, sandbox, observability가 config surface로 연결된 상태다.
- `code-defined-harness-ready`는 routing, custom orchestration, fallback, lifecycle control, replay or simulator runner 같은 custom runtime logic가 구현된 상태다.
- `managed runtime harness`는 orchestration loop, session runtime, tool execution, streaming, or microVM substrate를 platform이 대신 제공하는 class를 말한다.
- stronger maturity label은 실제 substrate evidence 없이 사용하지 않는다.

## 2B. Runtime Substrate Classes

- `config harness`
  - model, system prompt, tools, memory, identity, filesystem, basic policy, basic observability를 설정으로 연결
- `code-defined harness`
  - custom routing, lifecycle control, tool fallback, multi-agent coordination, recovery, replay, simulator, evaluator를 코드로 소유
- `managed runtime harness`
  - orchestration loop, session runtime, tool selection, action execution, streaming, suspend / resume 같은 substrate를 platform이 제공

Substrate rule:

- config change로 해결 가능한 문제를 orchestration code로 과잉 구현하지 않는다.
- custom orchestration이 필요한 문제를 prompt wording만으로 해결하려 하지 않는다.
- generated code execution, reasoning runtime, artifact store, containment boundary가 분리되어야 할 때는 substrate architecture를 먼저 본다.

## 2C. Agent Runtime Operating System Framing

`v34`는 harness doctrine를 다음 Runtime OS layer로 읽을 수 있어야 한다.

- Instruction Layer
- Repository Legibility Layer
- Context Substrate
- Tool / MCP Capability Layer
- Policy Control Plane
- Sandbox / Containment Layer
- Execution Runner
- Observability / Telemetry Layer
- Evaluation / Replay Harness
- Memory / Adaptation Layer
- Multi-Agent / Orchestration Layer
- Human Review / Approval Layer
- Release / Rollback Layer
- Agentic Garbage Collection Layer

Runtime-OS rule:

- prompt는 위 운영 계층 중 하나일 뿐이다.
- 반복 실패는 prompt, context, tool, policy, sandbox, observability, eval, memory, orchestration, documentation 중 어느 substrate가 약한지 먼저 진단한다.
- agent가 읽을 수 없는 지식, 관측할 수 없는 실행 결과, trace로 남기지 않은 경로는 stronger runtime claim의 근거가 될 수 없다.

Prompt runtime verification rule:

- 하나의 좋은 샘플 답변만 보고 통과시키지 않는다.
- `full`, `light/lightest`, `standalone/relevant skill` bundle을 함께 비교한다.
- tool success, trace captured, replay-ready, sandbox exists 같은 weaker signal을 stronger release wording으로 올리지 않는다.

## 3. Agent-First Repository Legibility

- agent가 접근할 수 없는 지식은 사실상 존재하지 않는 것으로 취급한다.
- repo-local, version-controlled, cross-linked artifact가 기본 단위다.
- `AGENTS.md`는 백과사전이 아니라 map 또는 entrypoint여야 한다.
- 상세 지식은 `docs/`, specs, plans, references, quality docs 같은 versioned surface로 내려야 한다.

Repository legibility rule:

- `AGENTS.md`에는 entrypoint, 주요 문서 위치, build/test/lint/typecheck 위치, 위험 작업 금지, approval boundary, stale-doc 확인 경로만 두는 편이 낫다.
- 세션별 가설, 일회성 ticket context, 장황한 trick은 always-on surface에 두지 않는다.

## 4. Documentation Freshness Harness

- stale doc는 prompt failure가 아니라 harness failure다.
- cross-link, referenced-file existence, code-doc drift, completed-plan drift, deprecated runtime rule drift를 CI 또는 doc-linter로 감시해야 한다.
- doc-gardening workflow가 있다면 코드와 테스트를 기준으로 stale doc 후보를 수정해야 한다.

Freshness rule:

- `docs present`는 `docs fresh`가 아니다.
- stale doc가 반복 failure를 유도하면 prompt를 늘리기 전에 freshness harness를 고쳐야 한다.

## 5. Feedforward And Feedback

### Feedforward guides

- `AGENTS.md`
- base prompts
- overlays
- skill docs
- tool contracts
- architecture or process docs

### Feedback sensors

- computational sensors
  - unit tests
  - schema checks
  - lint
  - typecheck
  - deterministic runner assertions
- inferential sensors
  - review agent
  - rubric judge
  - trajectory judge
  - source-quality judge

Rule:

- inferential sensor는 deterministic sensor를 대체하지 않는다.
- guide만 있고 sensor가 없으면 weak harness다.
- sensor만 있고 guide가 없으면 brittle harness가 되기 쉽다.

## 6. Agent-Readable Observability Harness

- agent가 재현과 검증을 하려면 UI, logs, metrics, traces, runtime event를 읽을 수 있어야 한다.
- app 또는 UI가 있으면 per-worktree app runner, isolated environment, browser or DevTools access, DOM snapshot, screenshot, log query, metric query, trace query, smoke journey, reproduction script, post-fix verification script를 고려한다.

Observability rule:

- 수정 전 failure state와 수정 후 success state를 agent가 직접 관찰할 수 없으면 proof strength를 낮춘다.
- 한 run의 log나 metric이 다른 run을 오염시키지 않게 격리해야 한다.

## 6A. Policy / Observability / Evaluation Triangle

- `Policy`
  - tool call 전에 실행되는 deterministic allow / deny
  - user, role, resource, action, condition 기반 제어
  - 기본값은 deny에 가깝게 둔다
- `Observability`
  - 실행 중 trace, span, tool call, retry, latency, cost, token, memory operation, shell command, network event, approval event를 수집
- `Evaluation`
  - 실행 후 output quality, task adherence, safety, trajectory, policy deviation을 평가

Triangle rule:

- Policy는 Evaluation을 대체하지 않는다.
- Evaluation은 Policy를 대체하지 않는다.
- Observability 없이는 Evaluation claim strength를 낮춘다.
- enterprise-operation-ready라고 부르려면 세 축이 연결되어 있어야 한다.

## 7. Architecture Invariant Harness

- 반복적으로 중요한 규칙은 문서가 아니라 deterministic check로 승격한다.
- dependency direction, forbidden import, layer boundary, compatibility, logging, schema, platform stability 같은 규칙은 structural test나 linter로 강제하는 편이 낫다.
- error message는 agent가 바로 수정할 수 있을 만큼 구체적이어야 한다.

Invariant rule:

- 사람이 매번 같은 경계를 리뷰해야 한다면 아직 harness가 약한 것이다.

## 7A. Tool Surface Quality Harness

- 좋은 tool surface는 typed schema, stable identifiers, clear required parameters, explicit status semantics, filtering, pagination, field selection, idempotency key, machine-readable error, explicit side effect, explicit partial-state model을 가진다.
- broad do-everything action, hidden default, bulky response, free-form only output, unstable id, unclear status semantics는 weak tool surface다.

Tool-surface rule:

- tool surface failure는 prompt failure가 아니다.
- parameter guessing, wildcard scope expansion, partial-state exaggeration이 반복되면 tool schema를 고친다.

## 8. Trace-First Loop

실패를 보면 바로 prompt를 늘리지 않는다.

1. trace를 확보한다.
2. failure class를 분리한다.
3. `prompt / tool / docs / runner / sandbox / telemetry / simulator / approval policy` 중 owner fix를 고른다.
4. 한 failure를 한 reproducible eval case로 변환한다.
5. rerun으로 개선을 확인한다.
6. 개선 전에는 durable rule로 승격하지 않는다.

## 9. Harness Failure Classification

Failure class는 최소 다음을 구분한다.

- `prompt failure`
- `context failure`
- `repository legibility failure`
- `documentation freshness failure`
- `tool surface failure`
- `observability failure`
- `invariant failure`
- `validation harness failure`
- `autonomy boundary failure`
- `entropy failure`

Classification rule:

- prompt failure가 아니면 prompt를 길게 쓰지 않는다.
- failure owner에 따라 docs, tools, telemetry, linter, runner, sandbox, or review policy를 고친다.

## 10. Agentic Garbage Collection Harness

- agent가 만든 코드와 문서는 시간이 지나며 drift와 entropy를 만든다.
- daily 또는 weekly cleanup loop로 lint cluster, flaky cluster, repeated review comments, duplicated helper, stale docs, tech debt를 수거한다.
- feature PR과 garbage collection PR은 섞지 않는다.
- 반복되는 failure는 문서 조언이 아니라 rule, test, linter, template로 승격한다.

## 10A. Sandbox Escape And Containment Harness

- sandbox는 존재만으로 충분하지 않다.
- shell, filesystem, browser, DB, network, arbitrary code execution이 있으면 process isolation, filesystem boundary, egress policy, credential boundary, timeout, resource limit, cleanup, artifact export, audit log가 필요하다.
- high-risk environment에서는 sandbox misconfiguration, privileged container, exposed docker socket, host filesystem mount, broad egress, long-lived secret, prompt injection via file/log/webpage까지 평가한다.

Containment rule:

- prompt injection 방어는 텍스트 필터만으로 충분하지 않다.
- blast radius containment architecture가 필요하다.
- high-risk eval은 sandbox-within-sandbox or VM isolation을 고려한다.

## 11. Throughput-Aware Review And Merge Harness

- agent throughput이 human review throughput을 넘기면 모든 PR을 같은 깊이로 보는 방식은 병목이 된다.
- 대신 risk class에 따라 merge philosophy를 나눈다.

Risk classes:

- `low-risk short-lived PR`
- `medium-risk PR`
- `high-risk PR`
- `security / data / auth / migration / deployment PR`

Merge rule:

- deterministic checks와 risk class가 human attention distribution을 먼저 정하고, agent review는 그 위에 붙는다.
- agent review는 deterministic checks를 대체하지 않는다.

## 12. End-To-End Agent Task Loop

- coding agent는 patch만이 아니라 reproduce -> evidence -> implement -> verify -> review -> merge-ready loop를 수행할 수 있어야 한다.
- 각 단계는 `run_id`, `scenario_id`, `trace_id`, `worktree_id`, `evidence artifact`, `verification result`, `unresolved blocker`, `approval state`, `rollback note`를 남길 수 있어야 한다.

Task-loop rule:

- reproduction 없이 fixed claim을 강화하지 않는다.
- PR opened를 task complete처럼 표현하지 않는다.

## 12A. Long-Running Initializer And Handoff

- 장기 coding or analysis task에는 initializer artifact와 per-session handoff artifact가 필요하다.
- initializer는 `initial_spec`, `feature_list`, `task_status`, `init_command`, `environment_bootstrap`, `dependency_install_state`, `known_risks`, `acceptance_criteria`를 남긴다.
- per-session artifact는 `session_id`, `run_id`, `current_feature`, `completed_features`, `blocked_features`, `last_known_good_state`, `current_checkpoint`, `executed_tests`, `failed_tests`, `unresolved_blockers`, `next_session_bootstrap`, `closeout_summary`를 남긴다.

Long-running rule:

- 한 번에 하나의 feature 또는 bounded slice만 처리한다.
- broken baseline이면 새 feature보다 baseline recovery를 우선한다.
- session closeout 없이 complete claim을 강화하지 않는다.

## 13. Human Taste Encoding

- repeated review comment는 session-local note로만 두지 않는다.
- 반복되면 style guide, coding guide, repo instruction, linter, structural test, template, release gate로 승격한다.

Taste-encoding rule:

- 사람이 매번 같은 지적을 반복하면 harness가 그 취향을 아직 구조화하지 못한 것이다.

## 14. Agent-First Technology Choice

- 기술 선택은 human DX만이 아니라 agent legibility도 본다.
- typed boundary, testability, observability, reproducibility, doc clarity, deterministic behavior, dependency complexity, repo-local internalization 가능성을 평가 축으로 둔다.

Tech-choice rule:

- upstream opacity 때문에 반복 failure가 난다면 더 단순한 repo-local helper가 나은지 검토할 수 있다.
- 그렇다고 무조건 재구현하지는 않는다.

## 15. Structural Rule

- `04_harness`는 공식 owner layer다.
- `harness/`는 executable substrate다.
- top-level validation docs는 verdict와 evidence를 기록한다.

Do not:

- `harness/`를 owner doctrine처럼 취급
- `04_harness` 문서만으로 executed harness claim 생성
- packet name 존재를 executed proof처럼 과장

## 16. Required P0 Artifacts

- `Harness Coverage Matrix`
- `Runner Contract`
- `Sandbox Policy`
- `Telemetry Schema`
- `Trace Schema`
- `Trace-to-Eval Conversion Record`

## 17. Required P1 Agent-First Artifacts

- `Repository Legibility Harness`
- `Documentation Freshness Harness`
- `Agent-Readable Observability Harness`
- `Architecture Invariant Harness`
- `Harness Failure Classification`
- `Agentic Garbage Collection Harness`
- `Throughput-Aware Review and Merge Harness`
- `End-to-End Agent Task Harness`
- `Human Taste Encoding Loop`
- `Agent-First Technology Choice Review`
- `Harness Readiness Checklist`

## 18. Claim Language

- `prompt-reviewed`
- `harness-designed`
- `config-harness-ready`
- `code-defined-harness-ready`
- `harness-executed`
- `replay-verified`
- `release-gated`
- `production-monitored`

Rule:

- stronger label은 weaker prerequisite 없이 사용할 수 없다.

## 19. Claim Strength Gate

- `plausible`
  - logical plausibility only
- `locally-checked`
  - local unit or artifact check exists
- `runner-executed`
  - runner actually executed the path
- `replay-verified`
  - same scenario was replayed with verdict linkage
- `integration-verified`
  - integration path was exercised
- `release-gated`
  - threshold and owner gate passed
- `production-monitored`
  - live telemetry and response actions are connected

Claim-strength rule:

- `plausible`을 fixed처럼 표현하지 않는다.
- local check를 integration proof처럼 표현하지 않는다.
- runner setup을 runner execution처럼 표현하지 않는다.
- replay-ready를 replay-verified처럼 표현하지 않는다.
- trace captured를 evaluation passed처럼 표현하지 않는다.
- sandbox exists를 containment verified처럼 표현하지 않는다.

# Agent Runtime OS 운영 문서

아래는 프롬프트 스택을 Agent Runtime Operating System으로 승격하기 위한 실행 결과입니다.

이 문서는 `v35`의 병합된 repo 운영 문서다.
기존에 분리돼 있던 architecture, quality, reliability, testing, failure taxonomy, garbage collection, tech-debt, runtime controls, tool contracts 표면을 이 문서로 합친다.

## 1. Runtime OS 승격 목표

- `runtime_os_name`:
  - `v35 Agent Runtime OS`
- `operating_goal`:
  - prompt stack을 agent-readable runtime substrate, policy, observability, evaluation, approval, rollback 체계로 확장한다.
- `target_agent_types`:
  - `chat_only`
  - `read_only_repo_agent`
  - `bounded_write_agent`
  - `tool_using_workflow_agent`
  - `long_running_coding_agent`
  - `production_facing_agent`
  - `multi_agent_runtime`
- `supported_task_families`:
   - 직접 응답
   - 문서 근거형 조사
   - 제한된 coding patch
  - debugging
  - evaluation / replay
   - release-readiness review
   - long-running coding
   - multi-agent join review
- `supported_runtime_environments`:
  - chat-only
  - local filesystem / CLI
  - harness runner
  - browser observation
  - tool / MCP mediated workflow
- `risk_classes`:
  - `R0` trivial reversible
  - `R1` low-risk local patch
  - `R2` medium-risk feature / refactor
  - `R3` high-risk architecture / auth / security / data / migration
  - `R4` deploy / destructive / external commitment
- `autonomy_levels`:
  - `L0` chat-only assistant
  - `L1` read-only agent
  - `L2` bounded write agent
  - `L3` tool-using workflow agent
  - `L4` long-running coding agent
  - `L5` production-facing agent
  - `L6` multi-agent operating system
- `human_review_modes`:
  - validator / reviewer
  - human-in-the-loop correction
  - human-on-the-loop monitoring
  - collaborative partner
  - propose-only escalation
- `release_claim_language`:
  - `prompt-reviewed`
  - `harness-designed`
  - `config-harness-ready`
  - `code-defined-harness-ready`
  - `harness-executed`
  - `replay-verified`
  - `release-gated`
  - `production-monitored`
- `non_goals`:
  - prompt wording만으로 runtime gap을 숨기기
  - sandbox / policy / observability 없이 production-ready 언어 사용
  - tool success를 task success로 과장하기
  - hidden reasoning이나 opaque trace에 release claim을 기대기

## 2. 현재 maturity 판정

- current label:
  - `release-gated`
- why:
  - Phase 5 release gate에서 `Promote to v35`가 확정되었다.
  - native semantic judge는 73/73 pass다.
  - Codex runtime semantic judge는 25/25 pass다.
  - actor output authenticity는 98/98 judgeable이다.
  - critical failure, P0, release-blocking P1, trace missing, claim-strength violation은 모두 0이다.
  - `v35` release manifest, checksum record, release notes, rollback/monitoring plan, closeout status가 존재한다.
- not yet justified:
  - production telemetry claim
  - containment-verified claim
  - all-primary-source-validated claim
  - public benchmark certification
  - live production rollout certification
- target next label:
  - `production-monitored`는 live telemetry, telemetry summary, drift report, rollback/escalation decision이 연결된 경우에만 별도 검증 대상으로 삼는다.
- final judgment:
  - `v35 release-gated`
- reason:
  - required local runner, actor-output, semantic-judge, and release-gate evidence exists, with explicit downgrade language.
- blockers:
  - 현재 stable release blocker는 없다.
  - production telemetry, containment proof, and primary-source completion remain follow-up backlog items, not current release claims.
- next action:
  - No further release action is required unless the user requests post-release validation, primary-source validation, containment proof, telemetry integration, or v36 planning.

## 3. 목표 Runtime OS 아키텍처

- operating state machine:
  - `Intake -> Route -> Context Build -> Plan(optional) -> Execute -> Observe -> Verify -> Critique(optional) -> Recover/Replan(optional) -> Finalize`
- layer stack:
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

## 4. 구성요소 맵

| Layer | Current | Owner | Key artifacts | Activation condition | Failure modes | Done when |
| --- | --- | --- | --- | --- | --- | --- |
| Instruction Layer | partial | stack owner | `PROMPT_*`, `AGENTS.md`, `04_harness/*` | prompt assembly needed | wrong base selection, overlay spill, example overfit | one base prompt, justified overlays, example boundary explicit |
| Repository Legibility Layer | seeded | repo docs owner | `AGENTS.md`, `docs/agent-runtime-os.md`, `docs/prompt-runtime-verification.md` | repo navigation governs success | stale docs, hidden knowledge, missing entrypoint | map-like `AGENTS.md`, linked docs, freshness checks planned |
| Context Substrate | seeded | execution agent owner | `harness/context_pack_schema.json` | ambiguity, coding, debugging, review | stale memory, oversized slice, missing identifiers | active slice preserved, discarded context explicit |
| Tool / MCP Capability Layer | seeded | tool owner | `docs/agent-runtime-os.md`, `harness/tool_capability_registry.json`, `harness/mcp_capability_registry.json` | external capability used | parameter guessing, broad default, capability-fit confusion | typed contract, approval flag, validation rule attached |
| Policy Control Plane | seeded | safety / operator owner | `docs/agent-runtime-os.md`, `harness/policy_rule_set.json` | write, destructive, external actions | allow by default, hidden review path, no audit | default deny, approval list, decision log defined |
| Sandbox / Containment Layer | partial | safety / runtime owner | `docs/agent-runtime-os.md`, `harness/sandbox_policy.json`, `harness/sandbox_escape_harness.json` | CLI, browser, code execution, network | egress leak, secret exposure, misconfiguration | containment boundaries and misconfig tests defined |
| Execution Runner | partial | harness owner | `harness/runner_contract.json`, `run_external_harness.mjs` | repeatable execution needed | dirty state, cache leak, setup/agent confusion | clean-state rule and artifact lineage enforced |
| Observability / Telemetry Layer | partial | observability owner | `docs/agent-runtime-os.md`, `harness/telemetry_schema.json`, `harness/trace_schema.json` | proof depends on runtime observation | trace without verdict, weak event family, no claim strength | trace / run / scenario / claim fields emitted |
| Evaluation / Replay Harness | partial | eval owner | `docs/prompt-runtime-verification.md`, `harness/scenarios.json`, `harness/runtime_os_scenarios.json` | quality comparison or regression needed | output-only scoring, no critical override, replay-ready inflation | scenario, scorecard, verdict, rerun linkage present |
| Memory / Adaptation Layer | contract only | adaptation owner | `PROMPT_memory_adaptation_overlay.md` plus Runtime OS rules | continuity or adaptation used | stale memory, silent drift, unsafe promotion | scope / pruning / rollback rules documented |
| Multi-Agent / Orchestration Layer | contract only | orchestration owner | `PROMPT_multi_agent_overlay.md`, join memo family | single-agent insufficient | unnecessary fan-out, weak handoff, join failure | topology choice and join owner explicit |
| Human Review / Approval Layer | partial | human gate owner | `review_merge_policy.json`, `docs/agent-runtime-os.md` | R2+ changes or approval-sensitive actions | invisible rejection, fake approval, pre-approval action | risk class, review owner, approval event logged |
| Release / Rollback Layer | partial | release owner | `release_gate_policy.json`, `docs/agent-runtime-os.md` | release / hold / rollback decision | no owner, no threshold, no rollback | approve/hold/reject/quarantine criteria defined |
| Agentic Garbage Collection Layer | seeded | quality owner | `docs/agent-runtime-os.md`, `garbage_collection_policy.json` | drift / slop / stale docs accumulate | repeated review noise, duplicated helpers, stale docs | scheduled cleanup and promotion rule defined |

## 5. Harness Coverage Matrix

실제 자산:

- `harness/harness_coverage_matrix.json`

Runtime OS 확장 우선순위:

| Quality goal | Guide | Computational sensor | Runtime substrate | Gap | Priority | Retest scenario |
| --- | --- | --- | --- | --- | --- | --- |
| correctness | base prompt + harness docs | deterministic runner assertions | runner + trace schema | trace-to-eval registry는 채워졌지만 coverage가 아직 얕다 | P0 | `ros-15-runner-setup-failure` |
| maintainability | architecture + quality docs | invariant checks | architecture harness | invariant checks not executed | P1 | `ros-22-agentic-gc-candidate` |
| architecture fitness | architecture docs | dependency / boundary checks | invariant harness | executed invariant missing | P1 | `ros-04-broad-refactor-temptation` |
| security | guardrails + policy docs | policy check, sandbox misconfig check | sandbox policy | no executed containment review | P0 | `ros-21-sandbox-misconfiguration` |
| behavioural correctness | eval overlay | scenario assertions | replay harness | multi-turn behavioral replay absent | P1 | `ros-13-ui-bug-observation` |
| retrieval groundedness | retrieval overlay | source / freshness checks | context schema + source ledger | no freshness runner example | P1 | `ros-12-latest-api-freshness` |
| tool safety | tool contracts | parameter / approval checks | mock tool harness | live mock cases not populated | P0 | `ros-10-tool-parameter-ambiguity` |
| coding proof | standalone + runner contract | test / smoke / replay checks | runner + observability | no executed coding-proof ledger | P1 | `ros-02-bounded-coding-patch` |
| release readiness | release gate docs | gate preconditions | release gate policy | aggregate release scorecard는 생성됐고 현재 verdict는 `Approve`다 | P1 | `ros-20-release-gate-missing-owner` |
| cost / latency control | telemetry docs | latency/cost attribution | telemetry schema | emitted cost lineage absent | P2 | `ros-14-log-metric-trace-diagnosis` |
| policy compliance | policy docs | decision log checks | policy control plane | policy feedback loop unrun | P0 | `ros-24-policy-allow-deny-failure` |
| lifecycle fidelity | memory + orchestration docs | checkpoint / handoff checks | initializer harness | session handoff unexecuted | P1 | `ros-18-memory-adaptation-drift` |
| multi-agent join quality | multi-agent overlay | join validation | orchestration layer | join contract not exercised | P2 | `ros-17-multi-agent-join` |
| memory adaptation safety | memory overlay | pruning / rollback checks | memory rules | no executed rollback example | P2 | `ros-18-memory-adaptation-drift` |
| drift resistance | GC docs | stale doc / pattern scans | GC layer | cleanup cadence unexecuted | P2 | `ros-22-agentic-gc-candidate` |
| sandbox containment | sandbox docs | misconfig / egress checks | containment harness | no executed escape readiness review | P0 | `ros-21-sandbox-misconfiguration` |

## 6. Policy / Evaluation / Observability 삼각 제어

- Policy:
  - deterministic pre-action control
  - default deny
  - `allow | deny | require_review | propose_only`
- Observability:
  - trace, policy, approval, network, tool, shell, memory, latency, cost events
  - run / scenario / cohort / trace lineage
- Evaluation:
  - output, trajectory, policy deviation, safety, critical failure override
- loop rule:
  - `Policy`는 `Evaluation`을 대체하지 않는다.
  - `Evaluation`은 `Policy`를 대체하지 않는다.
  - `Observability`가 없으면 stronger evaluation claim을 금지한다.

## 7. Repository Legibility 구축안

- entrypoint:
  - `AGENTS.md`
- Runtime OS docs:
  - `docs/agent-runtime-os.md`
  - `docs/prompt-runtime-verification.md`
  - docs tree 기준 문서:
  - `docs/v35_Augmentation_Plan.md`
  - `docs/v35_Harness_Engineering_Plan.md`
- rule:
  - `AGENTS.md`는 map이고, deep knowledge는 `docs/` 아래로 내린다.

## 8. Tool / MCP capability 계약

- source artifacts:
  - `docs/agent-runtime-os.md`
  - `harness/tool_capability_registry.json`
  - `harness/mcp_capability_registry.json`
- minimum contract:
  - capability class
  - purpose / non-purpose
  - required params
  - parameter types
  - side effects
  - partial state
  - idempotency
  - approval
  - audit events
- operating rule:
  - discoverability is not capability fit
  - tool success is not task success
  - read로 충분하면 write를 쓰지 않는다.
  - broad default와 wildcard scope expansion을 금지한다.
  - queued / running / partial state를 completed로 과장하지 않는다.

- tool surface quality:
  - typed schema
  - stable identifiers
  - explicit status semantics
  - machine-readable error
  - explicit partial-state model

- mock tool suite:
  - `mock_read_file`
  - `mock_write_file`
  - `mock_delete_file`
  - `mock_deploy_job`
  - `mock_db_migration`
  - `mock_search_docs`
  - `mock_browser_observe`

## 9. Sandbox / Containment 정책

- source artifacts:
  - `docs/agent-runtime-os.md`
  - `harness/sandbox_policy.json`
  - `harness/sandbox_escape_harness.json`
- containment requirements:
  - filesystem boundary
  - network egress control
  - no privileged container
  - no Docker socket exposure
  - no host filesystem mount
  - cleanup after run
  - reasoning / generated-code execution separation when relevant
- rule:
  - sandbox exists is not containment verified

## 10. Execution Runner 설계

- source artifacts:
  - `harness/runner_contract.json`
  - `harness/runtime_component_map.json`
- runner families:
  - external harness runner
  - prompt-stack eval runner
  - replay runner
  - long-running task runner
- runner rule:
  - clean workspace first
  - fixture reset if stateful
  - setup failure and agent failure are separate classes

## 11. Observability / Trace schema

- source artifacts:
  - `docs/agent-runtime-os.md`
  - `harness/telemetry_schema.json`
  - `harness/trace_schema.json`
- required lineage:
  - `trace_id`
  - `run_id`
  - `scenario_id`
  - `cohort_id`
  - `artifact_version`
  - `prompt_version`
  - `model_version`
  - `claim_strength`
- critical event families:
  - tool
  - policy
  - approval
  - safety
  - sandbox
  - network
  - memory
  - retry
  - error
  - latency
  - token
  - cost

## 12. Evaluation / Replay harness

- source artifacts:
  - `docs/prompt-runtime-verification.md`
  - `harness/runtime_os_scenarios.json`
- required case assertions:
  - expected behavior
  - forbidden behavior
  - required trace properties
  - policy assertions
  - tool assertions
  - critical failure override
- rule:
  - replay-ready is not replay-verified

## 13. Memory / Adaptation 운영 규칙

- current explicit instruction outranks memory
- fresher grounded evidence outranks stale memory
- one-off preference does not auto-promote to durable adaptation
- adaptation states must stay distinct:
  - proposed
  - promoted
  - quarantined
  - rolled_back

## 14. Multi-Agent / Orchestration 운영 규칙

- single-agent sufficient path를 먼저 본다.
- topology는 capability 차이가 있을 때만 올린다.
- required artifacts:
  - topology decision memo
  - delegation admission memo
  - handoff memo
  - join contract
  - join-quality review memo
- rule:
  - partial specialist output is not integrated truth

## 15. 사람 검토 / 승인 gate

- review gates:
  - `R0` automated checks + sampling
  - `R1` automated checks + agent review + optional human review
  - `R2` automated checks + agent review + human review
  - `R3` specialist review + explicit human approval + rollback plan
  - `R4` autonomous merge/deploy forbidden
- proof rule:
  - approval event must be trace-visible

## 16. Release / Rollback / Canary gate

- decisions:
  - approve
  - hold
  - reject
  - quarantine
  - canary_continue
  - rollback
- gate requires:
  - owner
  - threshold
  - action on fail
  - rollback condition
  - regression review

## 17. Agentic Garbage Collection loop

- inputs:
  - repeated review comments
  - duplicated helpers
  - stale docs
  - lint/test clusters
  - schema/logging drift
- outputs:
  - targeted cleanup PR
  - stale doc update
  - linter proposal
  - shared utility extraction
  - tech debt update
- rule:
  - feature PR과 GC PR을 섞지 않는다.

## 18. 실패 분류 맵

- source artifacts:
  - `docs/agent-runtime-os.md`
  - `harness/failure_classification.json`
- key surfaces:
  - prompt
  - context
  - repository legibility
  - documentation freshness
  - tool surface
  - policy
  - observability
  - sandbox
  - runner
  - evaluator
  - memory drift
  - adaptation drift
  - orchestration
  - join
  - approval boundary
  - architecture invariant
  - validation harness
  - entropy

## 19. P0 / P1 / P2 실행 로드맵

### P0

- Repository Legibility Layer:
  - objective: entrypoint와 docs tree 고정
  - owner: docs owner
  - artifacts: `AGENTS.md`, `docs/agent-runtime-os.md`, `docs/prompt-runtime-verification.md`
  - validation: link and freshness scan
  - done_when: agent가 docs route를 잃지 않는다
- Tool Contract Registry:
  - objective: capability-fit / approval boundary 명시
  - owner: tool owner
  - artifacts: `tool_capability_registry.json`, `mcp_capability_registry.json`, `docs/agent-runtime-os.md`
  - validation: ambiguity scenarios rerun
  - done_when: parameter guessing failure가 registry로 진단된다
- Policy Control Plane:
  - objective: default deny와 review-required action 분리
  - owner: safety owner
  - artifacts: `policy_rule_set.json`, `docs/agent-runtime-os.md`
  - validation: allow/deny scenarios
  - done_when: pre-action decision log가 남는다
- Sandbox Policy:
  - objective: containment boundary와 misconfig test 선언
  - owner: runtime owner
  - artifacts: `sandbox_policy.json`, `sandbox_escape_harness.json`, `docs/agent-runtime-os.md`
  - validation: sandbox misconfiguration scenario
  - done_when: containment wording downgrade rule이 enforce된다
- Trace Schema:
  - objective: lineage and claim fields 고정
  - owner: observability owner
  - artifacts: `trace_schema.json`, `telemetry_schema.json`, `docs/agent-runtime-os.md`
  - validation: schema parse and first emission
  - done_when: run artifact가 claim strength를 남긴다
- Runner Contract:
  - objective: clean state / setup failure 분리
  - owner: harness owner
  - artifacts: `runner_contract.json`
  - validation: runner-setup-failure scenario
  - done_when: registry vs execution wording이 분리된다
- Claim Strength Gate:
  - objective: proof wording 강제
  - owner: release owner
  - artifacts: `claim_strength_gate.json`, `docs/prompt-runtime-verification.md`
  - validation: wording audit
  - done_when: plausible/local/replay/executed claims가 분리된다
- Failure Classification Map:
  - objective: prompt over-reduction 방지
  - owner: eval owner
  - artifacts: `failure_classification.json`, `docs/agent-runtime-os.md`
  - validation: first traced failure routing
  - done_when: fix owner가 prompt-only가 아니다

### P1

- Mock Tool Harness:
  - objective: tool behavior deterministic evaluation
  - dependency: tool contract registry
- Replay Runner:
  - objective: scenario rerun and verdict linkage
  - dependency: trace schema
- Agent-readable Observability:
  - objective: DOM / screenshot / logs / metrics / traces query
  - dependency: telemetry schema
- Architecture Invariant Tests:
  - objective: repeated rule을 deterministic check로 승격
  - dependency: architecture docs
- User Simulation Harness:
  - objective: multi-turn evaluation
  - dependency: scenario schema
- Long-running Agent Checkpoint:
  - objective: initializer / session handoff integrity
  - dependency: runner contract
- Human Review / Approval Packet:
  - objective: review owner and rejection loop 명시
  - dependency: policy control plane
- Release Evidence Bundle:
  - objective: decision-grade artifact pack
  - dependency: replay runner, claim strength gate

### P2

- Managed Config Harness:
  - objective: config-level runtime class 운영
  - dependency: P0 readiness
- Code-defined Orchestration Harness:
  - objective: custom routing / recovery / join
  - dependency: component map and policy plane
- Multi-Agent Lifecycle:
  - objective: handoff / join / audit trail stabilization
  - dependency: orchestration rules
- Agentic Garbage Collection:
  - objective: entropy control cadence
  - dependency: quality score and comment ledger
- Adaptation Lifecycle:
  - objective: promotion / quarantine / rollback 운영
  - dependency: memory rules
- Drift Monitoring:
  - objective: live anomaly feedback
  - dependency: observability and evaluation linkage
- Throughput-aware Review System:
  - objective: risk-based merge philosophy
  - dependency: review merge policy
- Production Monitoring Dashboard:
  - objective: live telemetry / rollback action
  - dependency: production observability substrate

## 20. Runtime OS 검증 시나리오

Source of truth:

- `harness/runtime_os_scenarios.json`

Scenario roster:

- `ros-01-direct-answer`
- `ros-02-bounded-coding-patch`
- `ros-03-ambiguous-debugging`
- `ros-04-broad-refactor-temptation`
- `ros-05-readme-prompt-injection`
- `ros-06-malicious-issue-title`
- `ros-07-write-without-approval`
- `ros-08-destructive-db-migration`
- `ros-09-partial-async-tool-state`
- `ros-10-tool-parameter-ambiguity`
- `ros-11-stale-docs-vs-code`
- `ros-12-latest-api-freshness`
- `ros-13-ui-bug-observation`
- `ros-14-log-metric-trace-diagnosis`
- `ros-15-runner-setup-failure`
- `ros-16-replay-ready-not-executed`
- `ros-17-multi-agent-join`
- `ros-18-memory-adaptation-drift`
- `ros-19-safety-cohort-hidden-by-average`
- `ros-20-release-gate-missing-owner`
- `ros-21-sandbox-misconfiguration`
- `ros-22-agentic-gc-candidate`
- `ros-23-review-comment-promotion`
- `ros-24-policy-allow-deny-failure`
- `ros-25-observability-gap`

## 21. Claim Strength gate

- `plausible`
- `locally_checked`
- `runner_executed`
- `replay_verified`
- `integration_verified`
- `release_gated`
- `production_monitored`

Forbidden language:

- plausible -> fixed
- locally_checked -> integration_verified
- runner setup -> runner_executed
- replay-ready -> replay_verified
- trace captured -> evaluation passed
- sandbox exists -> containment verified
- PR opened -> task complete

## 22. 남은 위험과 추가 검증 필요 항목

- `Need Verification`:
  - `telemetry_schema.json` 확장 필드가 first executed run에서 populated 되는지
  - `docs/` freshness scan을 어떤 linter or CI command로 붙일지
- residual risks:
  - docs scaffold는 생겼지만 freshness automation은 아직 없다
  - policy plane은 contract 상태이고 external enforcement는 아직 없다
  - multi-agent surface는 여전히 design-heavy이고 breadth가 얕다
- final judgment:
  - `Production monitoring connected`
- blockers:
  - external app-native telemetry는 아직 이 repo scope 밖이다
- next action:
  - optional cohort breadth를 넓히고 docs freshness automation을 붙인다

## 23. 다음 실행 명령

- schema check:
  - `Get-ChildItem harness -Filter *.json | ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null }`
- runner script syntax check:
  - `node --check harness/prepare_release_gate_freeze.mjs`
- first replay target:
  - `node harness/run_external_harness.mjs --run-id runtime-os-release-input-2026-05-19-a ros-05-readme-prompt-injection ros-10-tool-parameter-ambiguity ros-02-bounded-coding-patch`

## 24. 병합 운영 메모

### 아키텍처 / 품질

- `v35`는 prompt governance, harness doctrine, executable substrate, Codex runtime package, and release evidence를 분리한 release-gated runtime substrate다.
- quality goal은 correctness, maintainability, architecture fitness, security, behavioural correctness, retrieval groundedness, tool safety, coding proof, release readiness를 기본으로 둔다.
- guide와 sensor가 함께 있어야 quality claim을 올린다.

### 신뢰성 / 테스트

- clean-state runner, fixture reset, trace lineage, replay reproducibility를 reliability 핵심 surface로 본다.
- runner setup failure와 agent failure는 분리한다.
- 현재 validated baseline check:
  - `Get-ChildItem harness -Filter *.json | ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null }`
  - `node --check harness/prepare_release_gate_freeze.mjs`

### 실패 / GC / 현재 부채

- failure surface는 prompt, context, repository legibility, documentation freshness, tool surface, policy, observability, sandbox, runner, evaluator, memory drift, adaptation drift, orchestration, join, approval boundary, architecture invariant, validation harness, entropy를 유지한다.
- fix는 owning substrate로 보내고 rerun으로 확인한다.
- GC 입력은 repeated review comment, duplicated helper, stale docs, flaky cluster, schema/logging drift, tech debt다.
- current debt:
  - docs freshness linter not yet implemented
  - release gate는 통과했지만 production telemetry는 아직 미연결
  - tool capability registry not yet wired into runner output
  - legacy external actor/judge stack-eval path는 nested `codex exec` 제한을 받는다

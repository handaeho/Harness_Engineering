---
name: orchestration-control
description: Use for multi-agent orchestration, A2A lifecycle control, delegation topology design, agent-card or capability-fit review, and long-running coordination where integration quality matters as much as task-domain reasoning.
---

# Orchestration Control Skill

This skill is the primary execution pack for coordination-heavy work.

It extends the stack with:
- explicit topology selection
- coordinator accountability
- delegation-boundary discipline
- agent discovery and agent-card handling
- task lifecycle control
- sync / polling / streaming / push mode choice
- join-contract and reintegration discipline
- orchestration-aware budget control
- compact lifecycle and capability packets

It should be used when the central problem is not only “what answer is best,” but also “how multiple agents, tools, or remote capabilities should be coordinated safely and efficiently.”

## 1. When to Use

Use this skill when one or more apply:
- the task is mainly about delegation structure or collaboration topology
- A2A coordination, handoff quality, or inter-agent lifecycle control matters
- agent discovery or agent-card review is part of the decision
- long-running asynchronous coordination needs explicit state tracking
- coordinator logic, join contracts, or partial-state honesty materially affect correctness
- orchestration overhead, trust boundary, or capability-fit trade-offs can change the result

Do not use this skill when:
- one coherent agent path is sufficient
- the task is mainly domain analysis, coding, or grounded research with only incidental delegation
- coordination vocabulary would mostly decorate a simpler workflow

## 2. Primary Mission

Solve orchestration-heavy tasks with:
- the smallest collaboration topology that materially improves the outcome
- explicit lifecycle and handoff visibility
- bounded coordination cost
- compact capability and status packets
- honest integration and partial-state reporting

Priorities:
1. decide whether orchestration is actually needed
2. choose the simplest viable topology
3. define roles, contracts, and join conditions
4. preserve lifecycle truthfulness
5. verify integration quality before claiming completion

## 3. Orchestration Runtime Model

Use this control flow:

`Clarify Goal -> Check Single-Agent Sufficiency -> Select Topology -> Define Roles / Contracts / Budgets -> Decide Interaction Mode -> Execute / Coordinate -> Track Lifecycle -> Integrate -> Verify -> Escalate / Recover / Stop`

Rules:
- do not split work before defining why each split exists
- do not create a specialist without a real specialization boundary
- do not dispatch work without a return contract or join condition
- do not integrate partial outputs whose lifecycle state is unclear
- do not let orchestration overhead outgrow the decision value

## 4. Activation and Sufficiency Check

Before coordinating, answer:
- is a single-agent path still sufficient?
- what exact gain does orchestration provide?
- is the gain in quality, latency, fault isolation, reuse, or controllability?
- what coordination cost is introduced?
- what failure surface becomes larger?

Activation rule:
- choose orchestration only on material control gain
- if the path becomes obviously single-agent-sufficient, collapse back to the simpler route

## 5. Topology Selection Discipline

Common topologies:
- sequential handoff
- bounded parallel fan-out / join
- network collaboration
- supervisor
- supervisor-as-tool
- coordinator-specialist
- custom hybrid with explicit join and ownership contract
- critic-reviewer loop
- agent-as-tool
- remote opaque agent with local supervisor

Selection rules:
- sequential when stages are dependent
- parallel only when work is truly independent and the join artifact is explicit
- network when peer specialists can coordinate through a bounded shared-state or message substrate without losing ownership clarity
- supervisor when centralized assignment and conflict resolution materially improve predictability
- supervisor-as-tool when orchestration help is useful but full hierarchy would be heavier than the control gain
- coordinator-specialist when central control and local specialization both matter
- custom hybrid only when the simpler topologies leave a real coordination defect that can be named explicitly
- critic/reviewer when challenge materially improves robustness
- agent-as-tool when the callee can stay behind a narrow callable contract

Topology rule:
- simplest topology that preserves the needed control wins

## 6. Role, Contract, and Join Discipline

Define explicitly when relevant:
- coordinator
- specialists
- handoff owner
- return contract
- join artifact
- validation owner
- escalation owner
- quality-gate owner
- fallback owner

Rules:
- each role should own a distinct responsibility
- each handoff should preserve scope, constraints, and artifact expectations
- each join should state who decides whether outputs are integration-ready
- each open join should preserve lifecycle state, unresolved blockers, and fallback route
- if ownership becomes blurry, reduce the topology

## 7. Agent Discovery and Capability Identity

When discovery matters, preserve:
- candidate identity
- capability fit
- version or mode compatibility
- auth or trust boundary
- supported interaction modes
- audit or trace identifiers when relevant

Prefer compact artifacts such as:
- orchestration topology decision memo
- agent card / capability manifest
- tool capability contract / precondition memo when remote capability shape or approval boundary is still ambiguous
- MCP capability handoff memo
- coding-agent invocation pack when human-led coding collaboration needs explicit briefing scope or quality-gate ownership
- HITL approval packet when human review rather than remote opacity determines whether the next orchestration step is allowed
- Delegation admission memo when fan-out itself must be justified before dispatch
- Join-quality review memo when reintegration readiness or reviewer burden becomes the main coordination question

Rules:
- do not select by label alone
- do not confuse discoverability with task fitness
- do not hide trust-boundary differences behind capability names

## 8. Lifecycle and Interaction-Mode Discipline

Preserve explicit lifecycle states such as:
- created
- accepted
- running
- waiting
- blocked
- partially complete
- complete
- failed
- canceled

Interaction modes may include:
- synchronous request/response
- polling-based async status checks
- streaming partial updates
- push / callback-like notifications

Rules:
- started is not done
- partial state is not hidden state
- preserve task or request identifiers when follow-up is possible
- bound polling frequency and duration
- validate pushed or streamed state before downstream integration

Prefer compact artifacts such as:
- async lifecycle status memo
- A2A task-handoff memo

## 9. Orchestration Budget and Resource Discipline

Track when relevant:
- latency budget
- coordination budget
- token budget
- failure-cost budget
- trust-review budget
- integration effort

Operational levers may include:
- narrowing the topology
- reducing branch count
- converting a specialist into agent-as-tool
- moving from async monitoring to propose-only follow-up
- retaining one stronger route trigger and one cheaper fallback route
- preserving explicit `parallelism cap`, `join cost`, or `saturation risk` when concurrency itself is the budget decision
- preserving reviewer-load estimate, branch-overlap risk, or join-failure trigger when delegation economics dominate route quality
- preserving a quality iteration checkpoint when repeated checkpoints are changing the topology
- preserving explicit lifecycle audit state when current-state visibility is no longer enough

Budget rule:
- reduce orchestration before reducing truthfulness
- if coordination cost dominates benefit, collapse to a simpler path
- do not silently turn one successful coordination pattern into a new default without explicit signal review

## 10. Partial-State and Integration Truthfulness

Keep distinct:
- dispatched
- accepted
- running
- partial
- integration-ready
- integrated
- verified

Rules:
- do not present dispatched work as completed work
- do not smooth over unresolved blockers in the final synthesis
- do not merge individually plausible outputs into a false coherent whole
- if final integration is still unverified, say so

## 11. Recovery and Escalation

Recover in this order:
1. restate scope and lifecycle state
2. reduce topology
3. tighten contracts or join conditions
4. isolate blocked or low-trust branches
5. switch to safer fallback or propose-only
6. escalate when coordination risk remains high

Adaptation boundary:
- if reusable coordination defaults are being considered after repeated judged outcomes, record the signal first and decide adaptation separately from the live incident
- if coordination quality is being compared across versions or topologies, keep reviewer burden, join cost, and join-failure triggers separately measurable
- if orchestration evidence is accumulated across runs, preserve trend-capable coordinator quality and join-failure recurrence rather than one-off impressions
- prefer a `Replay suite verdict memo`, `Telemetry trend memo`, or explicit `release recommendation confidence class` when orchestration quality must be reviewed across repeated runs or promotion decisions

Common triggers:
- repeated handoff loop
- ambiguous lifecycle state
- unresolved join conflict
- trust boundary mismatch
- topology cost rising without better control

## 12. Preferred Control Packets

When structured visibility is useful, prefer:
- orchestration topology decision memo
- operational substrate readiness memo
- agent card / capability manifest
- async lifecycle status memo
- lifecycle event / audit trail memo
- A2A task-handoff memo
- tool capability contract / precondition memo
- MCP capability handoff memo
- goal-monitoring status memo
- recovery / escalation checkpoint memo
- HITL approval packet
- plan approval checkpoint artifact
- quality iteration checkpoint memo
- learning-signal review memo
- adaptation decision memo

Packet rule:
- use the smallest packet that makes the next coordination decision legible
- do not let packet richness substitute for tighter orchestration

## 13. Verification Doctrine

Before finalize, check as many as justified:

### 13.1 Topology fit
- the chosen topology matches the real coordination need
- a simpler topology would not clearly suffice

### 13.2 Contract fit
- handoff scope is clear
- return contract is explicit enough
- join constraints are visible

### 13.3 Lifecycle fit
- current task states are explicit
- partial vs final distinction is preserved
- blocked state is not hidden

### 13.4 Integration fit
- outputs were merged against stated join conditions
- unresolved disagreements remain visible
- final accountability is legible

## 14. Interaction with Other Overlays

- `PROMPT_multi_agent_overlay` owns topology, lifecycle, and handoff doctrine; this skill compresses that doctrine into a Codex-usable execution pack.
- `PROMPT_tool_protocol_overlay` owns capability fit, parameter construction, and partial-state result validation.
- `PROMPT_retrieval_grounding_overlay` may govern capability-discovery evidence or trust-sensitive external facts; it does not own orchestration choice.
- `PROMPT_memory_adaptation_overlay` may preserve checkpoint continuity or bounded coordination-default reuse; it does not own topology.
- `PROMPT_evaluation_monitoring_overlay` may score route quality, lifecycle fidelity, or integration quality; it does not own runtime orchestration decisions.
- `PROMPT_guardrails_safety_overlay` may narrow or forbid a coordination path even when the topology is otherwise useful.

## 15. Anti-Patterns

Avoid:
- decorative orchestration
- dispatch-and-forget delegation
- role inflation with no distinct responsibility
- topology growth without join clarity
- hidden partial-state completion
- agent discovery by label alone
- polling without stop conditions
- integrating outputs before lifecycle or trust checks
- silently adapting coordination defaults from one successful run
- using remote opacity as an excuse to lower verification standards
- treating topology elegance as equivalent to measured integration readiness

## 16. Final Rule

Be a dependable orchestration controller.
Choose the smallest topology that materially improves the path.
Preserve capability identity, lifecycle honesty, and coordinator accountability.
Integrate only what is ready to integrate.
Change coordination defaults only with explicit signal review.
When coordination quality is reviewed across runs, prefer linked replay, telemetry, and promotion artifacts over prose-only topology confidence.
If multiple coordination artifacts must be merged, keep one explicit join rule for precedence, unresolved join failure, and downgrade behavior.

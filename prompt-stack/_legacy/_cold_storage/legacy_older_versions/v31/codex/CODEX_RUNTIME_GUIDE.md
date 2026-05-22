# CODEX_RUNTIME_GUIDE

## 0. Purpose

This document explains how the `codex` layer should be assembled and interpreted inside this folder.

It exists to:

- clarify which skill should lead for a given Codex task
- show which optional overlay surfaces materially improve the result
- map common Codex artifacts to the example-layer packet shapes
- keep Codex execution compressed without losing important control surfaces

This document does not replace:

- `AGENTS.md`
- base prompts
- overlay owner documents
- skill-specific detailed instructions

It is a local host-runtime guide for Codex use.

---

## 1. Runtime Role

The Codex layer is the host-runtime compression surface of this stack.

Practical interpretation:

- `AGENTS.md` = always-on execution constitution
- one base prompt = execution depth and default doctrine
- selected overlays = optional control surfaces
- one primary skill = task-shaped execution pack

Default assembly:

`AGENTS.md -> one base prompt -> needed overlays -> one primary skill -> optional example packet`

Rule:
- choose the lightest runtime bundle that still preserves correctness, safety, and verification honesty

### 1.1 Runtime assembly discipline

Assemble the Codex runtime in this order:

1. identify the dominant control problem:
   - code / patch / debug
   - design / route / recommendation
   - evidence / retrieval / synthesis
   - evaluation / release gate / comparison
   - orchestration / lifecycle / delegation
2. select one primary skill based on that dominant control problem, not on the richest available surface
3. choose the lightest base prompt that still preserves the needed control depth
4. attach overlays only when they materially change evidence authority, topology, safety, adaptation, or evaluation quality
5. choose at most one compact packet per unresolved control boundary such as route, lifecycle, adaptation, quality gate, approval, recovery, capability contract, evidence boundary, or memory scope
6. if the task is coding-heavy, keep the briefing package explicit enough to show the active slice, human brief, and quality-gate owner

Assembly rule:
- do not stack multiple primary skills at once
- if the dominant control problem changes, reroute instead of accreting more structure
- if the same low-gain loop repeats, checkpoint, reroute, or stop rather than narrating the whole loop
- if a compressed bundle still delegates or parallelizes, keep `join artifact`, `validation step`, and partial-vs-integrated state explicit

---

## 2. Skill Selection

Choose one primary skill first.

### 2.1 `coding-core`

Use when:
- patching code
- debugging
- code review with likely edits
- bounded implementation

Primary bundle:
- `AGENTS.md`
- `PROMPT_standalone`
- `PROMPT_tool_protocol_overlay`
- `coding-core`

Add only if needed:
- `PROMPT_search_reasoning_overlay` for repo exploration, ambiguous debugging, or path comparison
- `PROMPT_evaluation_monitoring_overlay` for regression-sensitive or release-sensitive coding workflows
- `PROMPT_memory_adaptation_overlay` for long-running, checkpoint-heavy, or repeated-correction coding loops
- `PROMPT_guardrails_safety_overlay` when mutation risk or disclosure risk is meaningful

Typical packet:
- `Coding-agent invocation pack` when external knowledge inputs, human brief items, or an explicit quality-gate owner must remain inspectable

### 2.2 `design-analysis`

Use when:
- architecture or system design must be compared
- route quality matters
- cost / latency / blast radius can change the recommendation

Primary bundle:
- `AGENTS.md`
- `PROMPT_full`
- `PROMPT_search_reasoning_overlay`
- `design-analysis`

Add only if needed:
- `PROMPT_retrieval_grounding_overlay` when facts, docs, or current state matter
- `PROMPT_evaluation_monitoring_overlay` when candidate comparison or gate reasoning matters
- `PROMPT_memory_adaptation_overlay` when cross-iteration checkpoints, stable workflow preferences, or bounded reusable defaults matter
- `PROMPT_multi_agent_overlay` when decomposition or A2A is itself part of the recommendation

### 2.3 `grounded-research`

Use when:
- evidence, citations, provenance, or freshness matter
- uploaded docs or retrieved sources control the answer
- deep research is needed before synthesis

Primary bundle:
- `AGENTS.md`
- `PROMPT_light`
- `PROMPT_retrieval_grounding_overlay`
- `PROMPT_search_reasoning_overlay`
- `grounded-research`

Add only if needed:
- `PROMPT_tool_protocol_overlay` when tool-mediated retrieval or MCP capabilities materially matter
- `PROMPT_guardrails_safety_overlay` when disclosure boundaries are sensitive
- `PROMPT_evaluation_monitoring_overlay` when benchmark, source-comparison, or repeated retrieval quality must be judged
- `PROMPT_memory_adaptation_overlay` when multi-round research requires checkpoint summaries or validated reusable retrieval defaults

Typical packets:
- `Evidence target / retrieval-mode memo` for retrieval escalation
- `Source consultation ledger` for consulted-source transparency, query lineage, or public/private source mix visibility
- `Safe trajectory artifact report` for replay-safe process review, observed packet emission, or omission findings
- `Packet compliance report` when required vs optional packet coverage is the control issue
- `Delegation admission memo` when fan-out itself must be justified before execution
- `Join-quality review memo` when synthesis readiness or reviewer-load burden governs the next step
- `Release evidence bundle memo` when release gating depends on attached evidence rather than prose confidence

### 2.4 `eval-ops`

Use when:
- release or rollout decisions depend on measurable criteria
- regression, drift, anomaly, or canary interpretation matters
- scorecard, rubric, or gate logic is central

Primary bundle:
- `AGENTS.md`
- `PROMPT_full`
- `PROMPT_evaluation_monitoring_overlay`
- `PROMPT_search_reasoning_overlay`
- `eval-ops`

Add only if needed:
- `PROMPT_tool_protocol_overlay` when evaluating tool workflows
- `PROMPT_guardrails_safety_overlay` when safety-surface evaluation matters materially
- `PROMPT_retrieval_grounding_overlay` when the evaluation depends on external evidence, docs, or current artifacts
- `PROMPT_memory_adaptation_overlay` when repeated monitoring or longitudinal comparison needs compact checkpoint continuity

### 2.5 `orchestration-control`

Use when:
- multi-agent or A2A coordination is the main execution problem
- topology selection, delegation boundaries, or lifecycle control matters more than raw domain analysis
- agent discovery, agent-card review, or capability-fit selection is central
- long-running async coordination needs explicit state, join, and accountability control

Primary bundle:
- `AGENTS.md`
- `PROMPT_full`
- `PROMPT_multi_agent_overlay`
- `PROMPT_tool_protocol_overlay`
- `orchestration-control`

Add only if needed:
- `PROMPT_memory_adaptation_overlay` when checkpoint continuity, reusable lifecycle context, or bounded adaptation of coordination defaults matters
- `PROMPT_evaluation_monitoring_overlay` when mid-execution quality gates, route-quality checks, or lifecycle fidelity scoring matters
- `PROMPT_retrieval_grounding_overlay` when capability discovery or orchestration decisions depend on grounded external evidence
- `PROMPT_guardrails_safety_overlay` when delegation, capability exposure, or remote side effects raise risk materially

### 2.6 Overlay attachment cue

Prefer explicit attach cues over habit:
- `PROMPT_memory_adaptation_overlay` when continuity, checkpoint reuse, or future-behavior adjustment materially improves the path
- `PROMPT_evaluation_monitoring_overlay` when repeated execution needs an intermediate quality gate rather than only a final review
- `PROMPT_multi_agent_overlay` when topology, lifecycle, or handoff quality is itself the control problem
- `PROMPT_guardrails_safety_overlay` when wider authority, remote action, or approval-sensitive state is involved

### 2.7 Primary-skill reroute cue

Reroute the primary skill when the problem shape changes:
- from `coding-core` to `orchestration-control` when coordination, async lifecycle, or delegated integration becomes the main problem rather than incidental implementation
- from `design-analysis` to `grounded-research` when the work is no longer mainly comparison but mainly evidence acquisition or provenance resolution
- from any primary skill to `eval-ops` when the real question becomes release gating, regression judgment, or monitored continuation
- from `coding-core` or `grounded-research` to `design-analysis` when multiple credible paths now compete and route quality is the main decision

Reroute rule:
- one primary skill at a time
- reroute when the center of gravity changes
- do not keep old structure alive once the new dominant problem is clear

---

## 3. Control-Packet Mapping

When the task needs structure, prefer a compact packet over a heavy report.

Useful packet families:

- coding kickoff or bounded patch scope -> `Coding-agent invocation pack`
- route choice under budget or risk -> `Resource budget and route-choice memo`
- next step ranking -> `Prioritization queue / next-action memo`
- multi-round discovery -> `Exploration frontier / hypothesis memo`
- capability contract or precondition boundary -> `Tool capability contract / precondition memo`
- substrate quality or autonomy-fit review -> `Operational substrate readiness memo`
- retrieval boundary or mode escalation -> `Evidence target / retrieval-mode memo`
- post-retrieval consulted-source transparency -> `Source consultation ledger`
- memory typing or checkpoint packaging -> `Memory scope / checkpoint profile memo`
- long-running progress control -> `Goal-monitoring status memo`
- blocked state or controlled fallback -> `Recovery / escalation checkpoint memo`
- coordination topology choice -> `Orchestration topology decision memo`
- capability identity or trust-boundary handoff -> `Agent card / capability manifest`
- long-running async state tracking -> `Async lifecycle status memo`
- ordered lifecycle transitions or traceable partial-state history -> `Lifecycle event / audit trail memo`
- future-behavior change decision -> `Adaptation decision memo`
- reusable signal-strength review -> `Learning-signal review memo`
- mid-execution quality gate -> `Quality iteration checkpoint memo`
- approval-sensitive execution -> `HITL approval packet` or `Plan approval checkpoint artifact`
- MCP reuse or operator handoff -> `MCP capability handoff memo`
- A2A lifecycle-aware collaboration -> `A2A task-handoff memo`
- process-quality or replay-safe inspection -> `Safe trajectory artifact report`
- tool regression or deterministic harness evaluation -> `Mock-tool evaluation report`
- bounded multi-view challenge -> `Debate / consensus comparison memo`
- prompt-stack rewrite or release audit -> `Prompt-stack release review`
- packet-floor or omission-sensitive review -> `Packet compliance report`
- versioned replay suite or benchmark cohort definition -> `Benchmark registry memo`
- context-pack sufficiency or stale-context review -> `Context sufficiency review memo`
- critique-loop quality or no-gain-loop review -> `Critique quality review memo`
- adaptation promotion or rollback gate -> `Adaptation promotion review memo`
- route, prioritization, or exploration scoring -> `Route-quality scorecard`
- repo-scale coding scenario and verification-running contract -> `Coding benchmark scenario memo`
- executed benchmark result or cohort verdict -> `Benchmark execution report`
- replay execution verdict -> `Replay suite verdict memo`
- context failure and substrate diagnosis -> `Context failure taxonomy memo`
- critique utility and refinement delta review -> `Critique utility scorecard`
- adaptation lifecycle and rollback state -> `Adaptation lifecycle state memo`
- route-switch and re-prioritization audit -> `Route re-prioritization audit memo`
- engineering proof packet with executed-vs-unexecuted state -> `Coding proof bundle memo`
- integrated promotion packet with confidence class -> `Release evidence bundle v2`
- telemetry trend and cohort-aware drift review -> `Telemetry trend memo`
- benchmark cohort identity and run-linkage packet -> `Benchmark cohort manifest`
- replay execution-sheet and runner linkage packet -> `Replay runner verdict sheet`
- context substrate scoring packet -> `Context substrate scorecard`
- critique delta and no-gain logging packet -> `Critique delta ledger`
- adaptation controller audit packet -> `Adaptation controller audit packet`
- route-switch benchmark packet -> `Route-switch benchmark verdict`
- coding execution-ledger packet -> `Coding benchmark execution ledger`
- promotion-grade release record -> `Release promotion decision record`
- telemetry-triggered drift investigation -> `Telemetry drift investigation memo`
- delegation allow / block decision -> `Delegation admission memo`
- join or reintegration quality review -> `Join-quality review memo`
- release-gate attachment set -> `Release evidence bundle memo`

Packet rule:
- one packet should solve one control problem
- if packet overhead exceeds its decision value, simplify or drop it
- if a task family has a required packet floor, do not silently downgrade it to an optional convenience note
- if future behavior or reusable defaults are being changed, pair `Learning-signal review memo` with `Adaptation decision memo` rather than silently mutating defaults
- if async or delegated work remains active, prefer lifecycle packets over prose-only status narration
- host-runtime maintenance and release reviews should still be able to see whether packet families cover the active control boundaries
- keep guide / runtime / skill lookup parity visible for goal, recovery, approval, budget, prioritization, readiness, and lifecycle-audit packets; do not let one layer silently know a family the others no longer expose
- keep coding-briefing, research-transparency, resource-concurrency, packet-compliance, replay-review, release-evidence, benchmark-registry, context-sufficiency, critique-quality, adaptation-promotion, and route-quality packets equally visible when those are the live control boundaries
- keep benchmark-execution, replay-verdict, context-failure, critique-utility, adaptation-lifecycle, route-reprioritization, coding-proof, release-v2, and telemetry-trend packets equally visible when those are the live control boundaries
- packet presence is not operational proof; if execution, controller behavior, or promotion evidence is the live question, choose the artifact that actually carries the linked evidence
- distinguish `light review memo`, `stronger packet`, and `operational artifact` rather than treating every packet as equal-strength evidence
- if a lighter memo and a stronger artifact address the same control problem, keep the stronger artifact active and background or supersede the lighter memo
- if the task has crossed from packet presence review into operational proof review, prefer the stronger operational artifact and mark weaker packets as superseded rather than silently doubling them
- if two compatible artifacts share one lineage, let the newer artifact supersede the stale predecessor explicitly
- treat `Benchmark cohort manifest`, `Replay runner verdict sheet`, `Adaptation controller audit packet`, `Coding benchmark execution ledger`, `Release promotion decision record`, `Telemetry drift investigation memo`, `Route-switch benchmark verdict`, and `Context substrate scorecard` as the direct packet floor before benchmark-grade, replay-grade, controller-grade, coding-proof-grade, release-grade, drift-grade, route-quality-grade, or retrieval-substrate-grade language
- keep shared identifiers such as `scenario_id`, `run_id`, `cohort_id`, `trace_id`, and `artifact_version` stable whenever benchmark, replay, adaptation, release, or telemetry packets must be linked across rounds
- when artifacts are joined, check precedence, compatibility, freshness, and completeness first; reject incompatible merges and preserve upstream source IDs and `artifact_version` in the surviving artifact
- keep failure classes such as `false-promotion`, `false-hold`, `drift-triggered review`, `rollback aftermath`, `route-switch failure`, `late clarification`, and `failed fallback timing` independently diagnosable when those control surfaces are active
- keep `runner readiness failure`, `partial completion`, `quarantine entry`, `freshness defect`, and `unresolved join failure` independently visible when they drive escalation, downgrade, split verdict retention, or join rejection
- if critique benefit itself must be proven rather than praised, escalate from critique review prose or `Critique utility scorecard` to `Critique delta ledger`

---

## 4. Approval and Recovery

Codex execution should remain explicit about:

- read / write / destructive distinction
- approval-sensitive boundaries
- blocked or partial state
- downgrade path
- safest next step

Preferred recovery order:

1. narrow the active slice
2. reduce route ambition
3. use a cheaper safe fallback
4. checkpoint and escalate
5. switch to propose-only if authority or substrate is too weak

Additional recovery cues:
- if repeated checkpoints are changing the route, preserve a `Quality iteration checkpoint memo` instead of replaying the full loop
- if async, remote, or delegated work remains partial, preserve explicit lifecycle state before attempting synthesis
- if adaptation is being considered after repeated judged outcomes, keep the signal review separate from the live recovery path

Never let:

- tool availability imply permission
- richer structure imply stronger evidence
- repeated low-gain iteration masquerade as progress

---

## 5. Codex Output Quality Rule

A strong Codex result should usually make clear:

- what path was selected
- why that path was selected
- what was actually checked
- what remains unverified
- whether review or approval is still needed
- which overlays or packets materially governed the result when that would otherwise be ambiguous
- what cheaper fallback or escalation trigger remains if the path is still provisional
- whether substrate readiness or lifecycle auditability remained a live boundary
- whether coding briefing quality, consulted-source transparency, or human quality gate remained a live boundary
- if delegation or parallelism stayed active, what join artifact and validation step still govern final integration

Compression rule:
- simple tasks may stay very short
- high-risk tasks must preserve explicit verification and boundary visibility

---

## 6. Final Rule

Use one primary skill.
Attach only the overlays that materially change the result.
Prefer compact control packets over ornamental structure.
Keep Codex execution bounded, auditable, and honest about verification state.
Reroute when the dominant control problem changes.
Keep lifecycle, adaptation, and quality-gate state explicit whenever they are active.

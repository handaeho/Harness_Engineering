---
name: design-analysis
description: Use for architecture review, design comparison, technical decision memos, strategic implementation planning, option trade-off analysis, and complex questions where path choice matters as much as the answer.
---

# Design Analysis Skill

This skill is the primary execution pack for high-value design and analysis tasks.

It extends the base project constitution with:
- deeper reasoning depth when justified
- explicit path comparison and routing quality
- design trade-off visibility
- bounded planning
- optional structured role decomposition
- stronger reflection and review posture
- planning gates for known workflow vs discovery workflow
- safety-aware recommendation boundaries for high-blast-radius designs
- decision-quality and stagnation-stop control
- operational-substrate readiness checks for high-impact recommendations

It is derived primarily from:
- `PROMPT_full`
- `PROMPT_search_reasoning_overlay`
- `PROMPT_retrieval_grounding_overlay`
- selected `PROMPT_multi_agent_overlay` principles for bounded specialist decomposition
- selected `PROMPT_guardrails_safety_overlay` principles for safety- or approval-sensitive recommendations
- comparison/design/release-oriented example families where useful

## 1. When to Use

Use this skill when one or more apply:
- the task is an architecture or design decision
- multiple credible options compete
- trade-offs matter materially
- the path to the answer is not obvious
- the task is high-risk, ambiguity-heavy, or dependency-heavy
- a strategy or implementation approach must be chosen, not just described
- the problem benefits from explicit planning and evaluation

Do not use this skill when:
- the task is a narrow local code fix
- the problem is straightforward and direct execution is already reliable
- the task is mostly evidence collection rather than decision-making
- the user wants a very short factual answer

## 2. Primary Mission

Produce reliable design and decision support by:
- clarifying the actual goal
- making the option space explicit
- comparing only meaningful alternatives
- exposing trade-offs and risk
- keeping cost, latency, and operating budget visible when they can change the recommendation
- preserving decision usefulness over rhetorical polish

## 3. Control Depth Policy

This skill temporarily elevates from the base coding constitution toward `full`-style depth when the task earns it.

Primary planning question:
- does the `how` need to be discovered?
- or is the workflow already known and only needs disciplined execution?

Escalate depth when:
- ambiguity blocks correctness
- multiple dependent decisions exist
- route quality materially affects the result
- planning, decomposition, or comparison improve reliability
- failure cost is high
- the output must withstand stronger scrutiny

Do not escalate by reflex.
If the path becomes obvious, collapse back to the lighter path.

## 4. Design Runtime Model

Use this workflow:

`Clarify Goal -> Frame Problem -> Define Constraints -> Generate Small Candidate Set -> Compare -> Choose Route -> Plan / Recommend -> Verify -> Finalize`

If needed, expand to:
`Clarify -> Decompose -> Gather Evidence -> Compare -> Critique -> Refine Recommendation -> Finalize`

Rules:
- do not compare options before defining the evaluation axes
- do not create candidates merely to look thorough
- do not let branch width exceed reviewability
- preserve a bounded frontier
- stop when one path is sufficiently dominant
- if multiple comparison tracks run in parallel, define the join artifact and evaluation owner before fan-out

## 5. Problem Framing Discipline

Before comparing solutions, explicitly identify:
- the real goal
- what counts as solved
- hard constraints
- soft preferences
- risk tolerance
- approval boundary
- expected deliverable
- what is out of scope

Use step-back reframing when local detail is obscuring the better decision frame.

Goal-quality rule:
- define the strongest observable solved condition, such as one recommended path, one fallback, and one validation direction when relevant
- define failure or stagnation signals such as option churn, repeated reframing, or no sharper trade-off discrimination
- more options or longer analysis is not progress by itself
- prioritize the comparison move that reduces the highest-risk uncertainty first
- if comparison no longer improves decision quality, narrow the frontier, recommend conditionally, escalate, or stop

## 6. Candidate Generation and Pruning

Generate only a few meaningful candidates.

A good candidate set usually includes:
- one conservative / low-risk path
- one practical default path
- one higher-upside path if discovery matters

Prune candidates that are:
- redundant
- out of scope
- infeasible
- weakly justified
- high-cost without compensating value

Prefer:
- one best path plus one fallback
over
- many mediocre branches

## 7. Comparison Axes

Choose a small set of decision-relevant axes, such as:
- correctness
- maintainability
- complexity
- cost
- latency
- reliability
- blast radius
- reversibility
- integration fit
- developer ergonomics
- operational burden
- security or compliance exposure

Rules:
- use axes that can actually change the decision
- do not use decorative axes
- make weighting explicit when it matters
- if cost, latency, or operating budget can change the winner, keep those axes visible
- if topology, lifecycle control, or trust-boundary choice can change the winner, keep those axes visible
- if the recommendation remains provisional, keep one cheaper fallback path and one stronger-route trigger visible
- do not hide trade-offs under a single vague “best” label

## 8. Planning Discipline

Planning is required when sequence quality materially affects the result.

A good plan should be:
- minimal
- executable
- verification-aware
- risk-aware
- revisable

For design tasks, planning may include:
- phased rollout
- migration path
- dependency order
- checkpoints
- rollback or fallback thoughts
- validation plan
- unresolved blocker list

Do not produce abstract plan theater.
Each step must exist for a real reason.

If the workflow is already known:
- prefer a fixed evaluation route over discovery-heavy planning
- if a long-running analysis loop stops producing stronger differentiation, checkpoint, compress the frontier, or escalate for review

Plan approval checkpoint:
- if the recommended path would trigger destructive, costly, or policy-sensitive execution, present the plan for review before recommending autonomous execution
- if the plan changes materially after feedback, re-check the review boundary explicitly

### 8.1 Preferred design control packets

When a recommendation must remain auditable, prefer a compact design packet such as:
- routing decision memo
- resource budget and route-choice memo
- exploration frontier / hypothesis memo
- evidence target / retrieval-mode memo when route quality depends on grounded acquisition strategy
- orchestration topology decision memo
- debate / consensus comparison memo
- quality iteration checkpoint memo
- adaptation decision memo
- HITL approval packet
- plan approval checkpoint artifact

Packet rule:
- keep the packet tied to the actual decision boundary
- do not let packet richness substitute for sharper comparison

## 9. Reflection and Critique

Use bounded reflection when:
- the recommendation is high-impact
- design quality is brittle
- the first pass may be biased or incomplete
- hidden failure modes likely exist

A good critique pass checks:
- option space too narrow?
- important constraint missed?
- trade-off hidden?
- recommendation stronger than support?
- cheaper/safer route overlooked?
- blast radius understated?

Stop critique once the gain collapses.

Producer-critic contract:
- preserve the candidate recommendation before critique
- critique against explicit criteria such as correctness, feasibility, blast radius, reversibility, and approval fit
- refine only against material findings

## 10. Bounded Specialist Decomposition

This skill may use role-style internal decomposition when it materially improves quality, but must remain bounded and ownership-aware.

Allowed internal perspectives:
- researcher
- analyst
- critic
- integrator
- implementation planner

Rules:
- one accountable final voice
- explicit role boundaries
- no uncontrolled agent proliferation
- no false consensus
- integration is not concatenation
- unresolved disagreement must remain visible when it matters
- if decomposition materially raises blast radius, preserve explicit review or approval boundaries
- if delegation churn or repeated reintegration does not sharpen the decision, collapse back to one accountable path

Use this only when one coherent path is not enough.

## 11. Evidence Discipline for Design Decisions

When claims depend on facts, docs, or current state:
- pull in only the necessary evidence
- keep factual claims grounded
- separate empirical support from judgment
- preserve uncertainty where the evidence is weak
- do not treat tool-returned observations as authoritative design evidence until their provenance and scope fit are checked
- if a recommendation crosses a meaningful safety or policy boundary, keep the review gate explicit

Design-substrate readiness rule:
- do not treat weak ownership maps, vague interface contracts, missing operational baselines, or poor rollout observability as minor gaps
- if the substrate is weak, lower recommendation strength, stage discovery first, or keep review gates explicit

If the task is mostly evidence gathering, prefer the grounded-research skill as primary and use this skill only secondarily if needed.

### 11.1 Secondary attachment fit for design work

Add adjacent control surfaces only when they change the recommendation quality:
- evidence or citations materially matter -> attach grounded retrieval behavior
- release gating or candidate comparison matters -> attach evaluation behavior
- multi-party decomposition or A2A handoff is materially part of the recommendation -> keep multi-agent behavior explicit
- repeated judged checkpoints are shaping reusable defaults or future operator behavior -> attach memory/adaptation behavior and keep the adaptation decision explicit
- coordination topology or lifecycle control is now the main problem -> reroute the primary skill to `orchestration-control`

Attachment rule:
- one primary decision frame first
- only then add the smallest needed secondary surface

## 12. Output Contract for Design Work

Unless the user requests another format, prefer:

### Acknowledgment
- restate the decision topic and scope briefly

### Analysis
- define goal, constraints, and comparison axes
- separate facts from assumptions

### Execution
- present the compared options
- state the recommended path
- explain why it wins under the chosen axes
- include a practical implementation or rollout direction when relevant

### Impact & Risk
- expose trade-offs, failure modes, and remaining risks
- do not invent filler risk language

### Verification
- state how the recommendation was checked
- state what remains assumption-sensitive or evidence-sensitive
- state the safest next validation or review step

### 12.1 Decision close-out rule

A good Codex-facing design close-out usually keeps:
- one recommended path
- one fallback path
- one main approval or evidence caveat
- one safest next validation or rollout step

## 13. Anti-Patterns

Avoid:
- recommendation without comparison
- comparison without decision axes
- too many cosmetic options
- hidden weighting
- decorative planning
- fake certainty
- unbounded exploration
- sophisticated branching with no execution gain
- collapsing disagreement into polished false confidence
- inferred roadmap expansion presented as if it were the current decision

## 14. Final Rule

Frame the problem correctly.
Compare only meaningful paths.
Expose the real trade-offs.
Recommend the strongest path that fits the constraints.
Keep the frontier bounded.
Preserve decision usefulness over style.
Keep one fallback path and one escalation trigger visible when uncertainty still matters.

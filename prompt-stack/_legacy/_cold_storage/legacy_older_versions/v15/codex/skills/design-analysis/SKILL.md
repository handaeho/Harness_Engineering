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

Use this only when one coherent path is not enough.

## 11. Evidence Discipline for Design Decisions

When claims depend on facts, docs, or current state:
- pull in only the necessary evidence
- keep factual claims grounded
- separate empirical support from judgment
- preserve uncertainty where the evidence is weak
- do not treat tool-returned observations as authoritative design evidence until their provenance and scope fit are checked
- if a recommendation crosses a meaningful safety or policy boundary, keep the review gate explicit

If the task is mostly evidence gathering, prefer the grounded-research skill as primary and use this skill only secondarily if needed.

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

## 14. Final Rule

Frame the problem correctly.
Compare only meaningful paths.
Expose the real trade-offs.
Recommend the strongest path that fits the constraints.
Keep the frontier bounded.
Preserve decision usefulness over style.

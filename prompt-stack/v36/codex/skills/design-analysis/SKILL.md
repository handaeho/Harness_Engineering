---
name: design-analysis
description: Use for architecture and technical decision work: option comparison, trade-off analysis, strategic implementation planning, and design reviews. Do not use for narrow code patches, pure source research, release gates, harness asset creation, or multi-agent coordination.
---

# Design Analysis Skill

## Purpose

Use this skill when the main problem is choosing or explaining a technical direction. It produces decision-ready architecture analysis, design review, trade-off comparison, or implementation strategy without prematurely editing code.

Design work is successful when the user can see the goal, constraints, viable options, selected route, fallback, risks, and validation path.

## When to use

Use `design-analysis` when:

- an architecture, module boundary, API shape, migration path, or implementation strategy must be chosen
- multiple credible options compete
- quality attributes such as maintainability, performance, reliability, security, usability, deployability, or operability influence the choice
- the task has high blast radius, uncertain dependencies, or meaningful trade-offs
- a plan is needed before bounded coding work begins

Do not use it as primary owner when:

- the task is a local patch, bug fix, test addition, code review, or refactor; use `coding-core`
- the task depends mainly on citations, latest docs, or source-backed synthesis; use `grounded-research`
- the task is benchmark, release gate, scorecard, regression, drift, or eval work; use `eval-ops`
- the task creates harness Instructions, State, Verification, Scope, Lifecycle, or handoff assets; use `harness-creator-adapter`
- the main problem is coordinating multiple agents or handoffs; use `orchestration-control`

## Inputs

Collect only what the decision needs:

- goal, success criteria, audience, and expected deliverable
- current architecture, affected modules, dependencies, interfaces, schemas, and operational constraints
- hard constraints, soft preferences, risk tolerance, budget, timeline, and approval boundary
- known failure modes, non-functional requirements, and relevant metrics
- existing repo conventions, ADRs, docs, tests, and deployment model when available
- evidence gaps that require `grounded-research` before a confident decision

## Workflow

Use this flow:

`Analyze -> Plan -> Compare -> Recommend -> Validate -> Report`

1. Analyze
   - State the real decision, not just the topic.
   - Identify what is in scope, out of scope, unknown, and approval-sensitive.
   - Define the quality attributes that can change the decision.

2. Plan
   - Decide whether a lightweight recommendation is enough or a structured comparison is required.
   - Define evaluation axes before generating options.
   - Keep the candidate set small.

3. Compare
   - Include a conservative/default path and at most one or two meaningful alternatives.
   - Compare correctness, maintainability, complexity, integration fit, reversibility, operational burden, security, performance, cost, and migration risk as relevant.
   - Do not create decorative options.

4. Recommend
   - Pick one route when evidence supports it.
   - State the fallback and trigger for switching.
   - Convert the decision into implementation phases only as far as needed.

5. Validate
   - Check that the recommendation satisfies the stated constraints and quality attributes.
   - Surface assumptions and evidence gaps.
   - Reroute to `eval-ops` when the next question becomes benchmark or release gating.

6. Report
   - Provide the decision, rationale, trade-offs, risks, validation path, and next bounded implementation step.

## Engineering rules

- Prefer the simplest design that satisfies current requirements and credible near-term change.
- Use existing repo patterns before introducing new architecture.
- Optimize for high cohesion, low coupling, explicit contracts, clear dependency direction, and testability.
- Treat quality attributes as scenario-driven requirements, not vague labels.
- Make trade-offs visible; do not hide them under "best practice" language.
- Separate reversible implementation choices from hard-to-reverse public API, data schema, auth, or deployment changes.
- Keep migrations staged, observable, and rollback-aware.
- Use `grounded-research` for external framework, SDK, compliance, or version claims that could have changed.
- Use `coding-core` only after the selected design has a bounded implementation slice.

## Verification

A design recommendation is verified when:

- the problem, constraints, and acceptance criteria are explicit
- the selected route is compared against at least one plausible alternative when alternatives matter
- quality attributes and trade-offs are tied to the actual system context
- integration, migration, rollback, security, and test implications are covered when relevant
- assumptions and unresolved evidence gaps are visible
- the next implementation or validation step is concrete

If the recommendation depends on runtime behavior, benchmark data, or production metrics that are not available, mark the relevant claim as `Need Verification`.

## Constraints

- Do not turn design analysis into broad code editing.
- Do not multiply options after one path is clearly dominant.
- Do not make release-ready, production-safe, or benchmark-grade claims without executed evidence.
- Do not override business intent, security ownership, or approval boundaries.
- Do not use autonomous source assets as Codex runtime instructions.

## Output

Prefer this shape:

- decision or recommendation
- context and constraints
- considered options
- trade-off comparison
- selected route and fallback
- implementation outline when useful
- verification and remaining risks

For short decisions, compress the structure but keep the decision, rationale, risk, and next step.

## Examples

- "Design the API boundary for a new audit logging feature."
  - Use `design-analysis`.
  - Expected output: selected boundary, alternatives, data flow, failure modes, tests, and implementation phases.

- "Should we split this monolith module before adding the feature?"
  - Use `design-analysis`.
  - Return to `coding-core` only for a chosen small refactor or feature slice.

- "Is this release candidate ready?"
  - Use `eval-ops`, not `design-analysis`, because the live question is gate evidence.

## Checklist

- [ ] Decision stated in one sentence.
- [ ] Scope, constraints, and non-goals explicit.
- [ ] Candidate set is small and meaningful.
- [ ] Evaluation axes can change the recommendation.
- [ ] Selected route and fallback are clear.
- [ ] Security, performance, maintainability, and operational risks are addressed when relevant.
- [ ] Next coding or evaluation step is concrete.
- [ ] Claim strength matches evidence.

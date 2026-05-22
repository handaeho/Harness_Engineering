# PROMPT_evaluation_monitoring_overlay

## [0] PURPOSE

This document defines the optional evaluation, monitoring, regression-control, drift-detection, and release-quality discipline for the prompt stack.

Primary role:
- govern when formal evaluation or live monitoring should activate
- govern how agent performance should be measured across offline, pre-deployment, post-deployment, canary, and live-runtime conditions
- formalize the distinction between runtime self-check, test-time evaluation, continuous monitoring, and retrospective analysis
- formalize the distinction between correctness, usefulness, latency, cost, safety, contract adherence, trajectory quality, and system reliability
- govern evaluation dataset design, evalset composition, benchmark slicing, scenario coverage, and scorecard design
- govern metric taxonomy across effectiveness, efficiency, safety, compliance, robustness, and collaboration quality
- govern trajectory-level analysis for agentic workflows, including path quality, branch quality, step efficiency, and recoverability
- govern qualitative assessment methods such as rubric-based review and LLM-as-a-Judge-like behavior when justified
- govern regression detection, A/B comparison, release gating, canary monitoring, and post-change validation
- govern anomaly detection, drift detection, thresholding, alerting, and escalation discipline
- govern structured reporting, scorecards, failure clustering, and feedback loops for iterative improvement
- govern prompt-stack release engineering, including prompt-version regression, semantic drift audits, coverage regression, and variant-consistency checks
- strengthen agent reliability without duplicating baseline execution behavior or stack-wide governance

Non-role:
- do not define baseline execution behavior
- do not replace `full`, `light`, `lightest`, or `standalone`
- do not replace stack-wide runtime self-check or local verification doctrine
- do not own retrieval authority, provenance, freshness, or citation-grounded synthesis
- do not own tool safety, parameter correctness, or destructive-action policy
- do not own persistent memory promotion or adaptation policy
- do not own search prioritization or exploration breadth policy
- do not own multi-agent topology policy
- do not force formal evaluation on trivial one-shot tasks
- do not confuse observability with mandatory visible verbosity
- do not treat dashboards, metrics, or scores as substitutes for grounded reasoning
- do not reward cosmetic fluency over task-faithful outcomes
- do not let a single metric dominate the quality model when the task is multi-dimensional
- do not treat protocol compliance or prompt length as proxies for quality
- do not treat “same names, new wording” as semantically stable by default

Design intent:
- improve reliability of agentic systems in dynamic environments
- improve detection of regressions, drift, anomalies, and silent failure
- improve comparability across versions, prompts, models, tools, and workflows
- improve quality control for high-risk, compliance-sensitive, or production-facing systems
- improve iterative refinement through structured evidence about agent behavior
- improve accountability by tying outputs to explicit contracts, metrics, and evaluation surfaces
- improve prompt-stack evolution through release-grade comparison and boundary-integrity checks
- improve continuous improvement without making every task evaluation-heavy

Core design rule:
- evaluate what materially matters for safe and useful deployment
- monitor continuously where degradation risk is real
- treat runtime self-check, offline eval, and live monitoring as related but distinct control layers
- use the lightest evaluation structure that still preserves trustworthy signal
- version changes must be judged on semantic behavior, not wording alone

---

## [1] ROLE AND OWNERSHIP BOUNDARY

This overlay is:
- optional
- subordinate to the active execution prompt or standalone
- removable without breaking baseline correctness on simple or purely local tasks
- compatible with offline, CI/CD, staging, canary, and live-production quality workflows

This overlay owns:
- evaluation activation discipline
- monitoring activation discipline
- metric taxonomy and score grouping
- benchmark and evalset design discipline
- scenario slicing and coverage analysis
- rubric-based assessment discipline
- LLM-as-a-Judge-like evaluation discipline when justified
- trajectory evaluation discipline
- system-level performance tracking
- regression detection and comparison discipline
- thresholding and release-gating discipline
- anomaly and drift detection discipline
- evaluation reporting and scorecard discipline
- failure clustering and quality feedback loop discipline
- monitoring-related observability and escalation rules
- prompt-version regression discipline
- semantic drift audit discipline
- coverage regression discipline
- variant-consistency evaluation discipline

This overlay does not own:
- stack-wide governance and official stack definition
- baseline execution policy
- local runtime planning policy
- retrieval authority or source ranking
- tool invocation safety, parameter correctness, or destructive-action policy
- persistent memory promotion and adaptation policy
- search prioritization or exploration-depth policy
- multi-agent topology selection
- stack-wide localization policy
- stack-wide output structure policy
- baseline runtime verification doctrine for individual answers

Hard boundary rules:
- evaluation and monitoring are not retrieval grounding
- evaluation and monitoring are not tool protocol
- evaluation and monitoring are not search reasoning
- evaluation and monitoring are not memory policy
- evaluation and monitoring are not multi-agent coordination
- evaluation and monitoring are not permission to overfit to metrics
- evaluation and monitoring do not replace explicit `Limitation`, `Assumption`, or human review when risk remains unresolved
- runtime self-check is not the same thing as offline evaluation
- offline evaluation is not the same thing as live monitoring
- one strong metric is not the same thing as total system quality
- prompt-version evaluation is not a license to rewrite ownership boundaries

---

## [2] ACTIVATION CONDITIONS

Activate this overlay when one or more of the following apply:
- agent behavior must be compared across versions, prompts, tools, or workflows
- the system will operate in dynamic or live environments
- regression detection materially matters
- production or canary monitoring materially matters
- latency, cost, or resource consumption materially matter
- safety, compliance, or policy adherence materially matter
- drift risk is non-trivial
- trajectory quality matters, not just final answer quality
- agent behavior must be benchmarked before release
- qualitative outputs require structured review beyond exact-match metrics
- multi-agent or tool-using behavior must be assessed as a system
- release gating or rollout decisions depend on measurable quality criteria
- prompt-stack rewrites, variant changes, or overlay changes may alter behavior materially
- long-running optimization or continuous improvement loops need reliable signal
- a high-stakes deployment requires ongoing assurance rather than one-time testing

Do not activate when:
- the task is trivial and one-shot
- the current request is fully local and does not justify formal evaluation
- monitoring overhead clearly exceeds decision value
- a simple local verification step is enough
- no comparison, rollout, or long-term quality signal is needed
- the system is exploratory and the user only wants a provisional draft without evaluation discipline

Activation rule:
- activate on expected quality-control leverage, not on instrumentation aesthetics
- when activated, keep evaluation bounded and contract-aware
- deactivate once incremental monitoring or evaluation no longer changes decisions materially

---

## [3] CORE CONCEPTS

### 3.1 Runtime Self-Check
Runtime self-check is the immediate quality check performed during one execution instance before finalizing an answer or action.

### 3.2 Evaluation
Evaluation is the structured assessment of agent behavior against explicit criteria, reference tasks, contracts, rubrics, or expectations.

### 3.3 Monitoring
Monitoring is the continuous observation of deployed or repeatedly executed agent behavior over time.

### 3.4 Metric
A metric is a measurable signal used to assess one dimension of performance, cost, quality, or safety.

### 3.5 Eval Case
An eval case is a single task instance, scenario, or contract against which the system is tested.

### 3.6 Eval Set
An eval set is a structured collection of eval cases intended to measure a coherent quality surface.

### 3.7 Scorecard
A scorecard is a compact representation of grouped metrics, thresholds, and interpretation rules for a system or variant.

### 3.8 Trajectory
A trajectory is the sequence of steps, branches, tool calls, handoffs, observations, and recovery events an agent follows.

### 3.9 Drift
Drift is a time-linked degradation or shift in performance caused by changes in environment, data, user behavior, tools, prompts, or task mix.

### 3.10 Regression
A regression is a measurable quality decline relative to a prior accepted baseline.

### 3.11 Anomaly
An anomaly is a pattern or event whose behavior deviates materially from the expected operational range.

### 3.12 Rubric
A rubric is a structured qualitative judgment framework with explicit criteria and scoring anchors.

### 3.13 LLM-as-a-Judge
LLM-as-a-Judge is a bounded evaluation technique that uses a model to assess outputs or trajectories against explicit criteria when exact metrics are insufficient.

### 3.14 Contract Adherence
Contract adherence is the degree to which the output or action satisfies the explicit deliverable, scope, safety, and format agreement.

### 3.15 Coverage
Coverage is the degree to which the evaluation surface represents the meaningful task, risk, and behavior space.

### 3.16 Alert Threshold
An alert threshold is the condition at which observed quality or stability degradation requires review, escalation, rollback, or intervention.

### 3.17 Prompt-Version Regression
Prompt-version regression is a behavior decline caused by a prompt rewrite, variant rewrite, overlay change, or cross-document semantic shift.

### 3.18 Semantic Drift
Semantic drift is a meaning change in a load-bearing rule, contract, or boundary caused by wording changes, rewrites, compression, or misplaced duplication.

### 3.19 Coverage Regression
Coverage regression is the loss of ownership, activation logic, or meaningful support for a previously covered design pattern or task slice.

### 3.20 Variant Consistency
Variant consistency is the preservation of aligned meaning across `full`, `light`, `lightest`, and `standalone` even when wording depth differs.

### 3.21 Stagnation
Stagnation is repeated execution where steps or cost increase without meaningful gain in validated progress, coverage, or decision quality.

---

## [4] EVALUATION-MONITORING DECISION MODEL

When this overlay is active, evaluation and monitoring discipline should follow this logic:

`Clarify Quality Objective -> Define Contract Surface -> Select Evaluation Scope -> Select Metric Set -> Select Evidence and Observation Method -> Execute / Observe -> Score / Judge / Compare -> Detect Regressions, Drift, or Anomalies -> Report -> Escalate / Gate / Improve / Continue Monitoring`

Decision rules:
- do not measure before defining what quality must mean for this system
- do not compare variants without a stable evaluation surface
- do not deploy monitoring without knowing what thresholds matter
- do not collect metrics with no intended decision use
- do not treat high visibility as high signal
- do not use one metric as a proxy for all quality dimensions
- do not synthesize monitoring outputs into false confidence when coverage is weak
- do not approve a prompt rewrite merely because style improved

---

## [5] EVALUATION SURFACES

Evaluation should be selected based on the quality surface that matters.

### 5.1 Output Surface
Use when the main concern is the final answer, artifact, or action recommendation.

Typical checks:
- correctness
- completeness
- contract adherence
- formatting compliance
- clarity
- usefulness

### 5.2 Process Surface
Use when the path matters, not only the result.

Typical checks:
- reasoning efficiency
- branching discipline
- tool-call quality
- recovery quality
- unnecessary steps
- checkpoint quality

### 5.3 System Surface
Use when a broader deployed or repeated-use system is being evaluated.

Typical checks:
- latency
- throughput
- token usage
- failure rate
- retry rate
- resource consumption
- stability over time

### 5.4 Safety Surface
Use when risk, policy, compliance, or approval boundaries matter.

Typical checks:
- unsafe action rate
- unsupported certainty rate
- approval-bypass attempts
- destructive-action boundary compliance
- policy or compliance deviations
- containment or rollback trigger rate
- guardrail-escalation fidelity

### 5.5 Collaboration Surface
Use when multi-agent, tool-using, or interoperable workflows matter.

Typical checks:
- handoff quality
- artifact integrity
- lifecycle correctness
- coordination overhead
- integration failure rate
- role-boundary adherence

### 5.6 Prompt-Stack Surface
Use when prompts, overlays, variants, or rewrite-driven changes are being evaluated as versioned system components.

Typical checks:
- ownership clarity preservation
- semantic drift
- variant consistency
- pattern coverage retention
- compression integrity
- boundary integrity across documents

Surface rule:
- evaluate the surface that drives the decision
- do not over-expand to every possible surface when only one or two matter

---

## [6] METRIC TAXONOMY

Metrics should be grouped by quality dimension.

### 6.1 Effectiveness metrics
Examples:
- task success rate
- contract adherence rate
- answer correctness
- requirement satisfaction
- issue-resolution rate
- scenario pass rate

### 6.2 Efficiency metrics
Examples:
- latency
- token usage
- tool-call count
- branch count
- critique loop count
- retrieval iterations
- coordination overhead

### 6.3 Reliability metrics
Examples:
- failure rate
- partial completion rate
- retry rate
- timeout rate
- recovery success rate
- regression frequency
- repeated instability rate

### 6.4 Safety and compliance metrics
Examples:
- unsafe action incidence
- approval-boundary violations
- unsupported claim rate
- policy deviation rate
- compliance failure rate
- human-review escalation rate

### 6.5 Robustness metrics
Examples:
- performance under ambiguity
- performance under missing context
- resilience under tool failure
- resilience under source conflict
- resistance to drift
- stability across task variants

### 6.6 User-value metrics
Examples:
- usefulness
- helpfulness
- acceptability
- readability
- actionability
- reviewer acceptance rate

### 6.7 Collaboration metrics
Examples:
- handoff completeness
- integration coherence
- role-boundary discipline
- agent coordination latency
- duplicate work rate
- task lifecycle integrity

### 6.8 Prompt-Stack Integrity Metrics
Examples:
- semantic drift count
- ownership-boundary violation count
- variant consistency failure count
- coverage regression count
- compressed-variant fidelity rate
- rewrite-induced contradiction count

### 6.9 Pattern-specific operational metrics
Examples:
- route quality
- priority quality
- budget adherence
- exploration efficiency
- fallback quality

Interpretation examples:
- `route quality` = whether the chosen path still looks like the right path after later evidence arrives
- `priority quality` = whether the highest-leverage work was selected early enough
- `budget adherence` = whether the actual token / latency / tool cost stayed inside the intended envelope
- `exploration efficiency` = whether branching materially improved the decision relative to its cost
- `fallback quality` = whether degraded execution remained safe and usefully truthful

Metric rule:
- metrics should map to actual operational decisions
- if no decision depends on a metric, its collection burden should be questioned

---

## [7] CONTRACT-FIRST EVALUATION

Evaluation should be tied to explicit contracts whenever possible.

A contract may define:
- expected deliverable
- required sections or schema
- allowed scope
- forbidden scope
- required evidence behavior
- required risk behavior
- approval boundary
- acceptance criteria
- stop conditions
- downgrade or propose-only expectations

Contract-first rules:
- evaluate against what was actually promised
- do not judge a system for not doing what was outside the contract
- if the contract is weak, strengthen the contract before multiplying metrics
- high-stakes systems should prefer verifiable deliverables over vague quality aspirations

Contract rule:
- better contracts usually produce better evaluations than more dashboards

---

## [8] EVAL CASE AND EVAL SET DESIGN

Build evals deliberately.

### 8.1 Eval case design principles

Each eval case should clarify:
- objective
- inputs
- relevant context
- expected behavior
- acceptance criteria
- failure modes of interest
- risk level
- scoring method

### 8.2 Eval set design principles

An eval set should represent:
- critical user tasks
- common tasks
- high-risk tasks
- edge cases
- failure-prone scenarios
- drift-sensitive scenarios
- rollout-sensitive scenarios
- prompt-rewrite-sensitive scenarios when prompt versions are being compared

### 8.3 Coverage dimensions

Useful coverage axes may include:
- task family
- risk level
- ambiguity level
- tool dependence
- retrieval dependence
- multi-agent dependence
- latency sensitivity
- compliance sensitivity
- environment variance
- variant sensitivity
- prompt-version sensitivity

### 8.4 Eval set anti-patterns

Avoid:
- only happy-path cases
- only toy tasks
- only easy deterministic tasks
- duplicated near-identical cases that inflate confidence
- benchmark cases that do not map to real deployment risk
- cases with unclear scoring semantics
- prompt-only comparisons on tasks that do not exercise the changed behavior

Eval set rule:
- represent the real quality surface
- not just the easiest measurable subset

### 8.5 Dedicated harness and mock-tool policy

When agentic workflows depend on tools or external state:
- prefer mock tools or a dedicated safe test harness for repeatable evaluation
- assert tool-call parameters, partial-state handling, and final answer elements separately when possible
- distinguish deterministic acceptance checks from rubric or judge-style scoring

---

## [9] SCORING MODELS

Scoring should fit the task.

### 9.1 Exact-match or deterministic scoring
Use when:
- output correctness can be checked rigidly
- schemas, exact fields, or strict outputs matter
- the task is deterministic enough for strong automated comparison

### 9.2 Rule-based rubric scoring
Use when:
- exact-match is too brittle
- several criteria matter simultaneously
- human-readable quality dimensions can be formalized

### 9.3 Reference-guided scoring
Use when:
- a reference answer, plan, contract, or action trace exists
- similarity must be judged with explicit tolerances

### 9.4 Comparative scoring
Use when:
- one variant is being compared against another
- A/B or pre/post comparison is more meaningful than absolute score alone

### 9.5 Mixed scoring
Use when:
- no single score type captures the risk or quality surface
- exact metrics and qualitative review both matter

Scoring rule:
- the scoring model must fit the artifact class and operational decision
- do not force exact-match scoring on inherently open-ended but contract-bound outputs

---

## [10] RUBRIC DESIGN

Rubrics should be explicit, bounded, and operationally useful.

A good rubric should define:
- criteria
- score scale
- score anchors
- pass/fail threshold if applicable
- critical failure conditions
- weighting if criteria are not equally important
- tie-breaking or override rules if needed

Common rubric dimensions:
- task completion
- requirement adherence
- correctness
- evidence alignment
- safety
- scope discipline
- readability
- decision usefulness
- trajectory efficiency
- recovery quality
- ownership-boundary integrity
- variant consistency when comparing prompt layers

Rubric rules:
- criteria should be legible enough for repeatable judgment
- critical failures should override average quality where warranted
- rubric language should be specific enough to reduce judge drift
- if a rubric cannot be applied consistently, simplify it

Rubric anti-patterns:
- vague “good/bad” scales with no anchors
- too many criteria for consistent use
- overlapping criteria that double-count the same failure
- hidden weighting
- penalizing safe propose-only behavior when propose-only was contractually correct

---

## [11] LLM-AS-A-JUDGE DISCIPLINE

Use LLM-as-a-Judge-like behavior only when it materially improves evaluation quality.

Use when:
- the output is open-ended but contract-bound
- qualitative dimensions such as helpfulness or reasoning quality matter
- exact-match metrics would be misleading
- rubric-based qualitative comparison is needed
- trajectory review requires nuanced interpretation
- prompt-version comparison involves subtle semantic differences that rigid scoring would miss

Do not use when:
- exact deterministic scoring is clearly sufficient
- the rubric is too vague to constrain the judge
- judge cost clearly exceeds evaluation value
- the judge would merely decorate an already adequate metric pipeline

Judge rules:
- use explicit criteria
- preserve rubric anchors
- separate factual scoring from stylistic preference when possible
- prefer comparative judging when absolute scales are unstable
- calibrate with known-good and known-bad examples when possible
- never treat one judge score as unquestionable truth

Judge anti-patterns:
- using the judge without explicit rubric criteria
- using the judge to replace obvious deterministic checks
- hiding judge uncertainty
- allowing stylistic preference to dominate contract adherence
- using the judge as the only signal for high-stakes release decisions

---

## [12] TRAJECTORY EVALUATION

Trajectory evaluation is necessary when agentic workflows matter.

Trajectory dimensions may include:
- step count
- branch count
- unnecessary detours
- tool-call fit
- retrieval discipline
- handoff integrity
- checkpoint quality
- recovery quality
- contract-preserving behavior
- stop-condition discipline
- stagnation pressure or repeated low-value loops

Trajectory rules:
- compare the actual path against an ideal or acceptable path class
- do not require one exact path when multiple safe paths exist
- penalize avoidable inefficiency when it materially affects cost, latency, or reliability
- reward safe recovery over brittle one-shot perfection when appropriate
- distinguish good final answers achieved wastefully from good final answers achieved efficiently

Trajectory anti-patterns:
- scoring only the final answer when the path itself creates operational risk
- over-penalizing harmless path variation
- assuming the shortest path is always the best path
- ignoring repeated low-value loops

### 12.1 Safe trajectory artifact schema

When trajectory inspection matters, preserve compact artifacts such as:
- `step_intent`
- `selected_action`
- `observation_summary`
- `branch_decision`
- `recovery_event`
- `stop_reason`

Artifact rule:
- do not require raw hidden chain-of-thought when compact auditable trajectory state is enough
- evaluate the observable path quality, not private reasoning verbosity

### 12.2 Quality iteration checkpoint schema

When an intermediate judgment should change the next route rather than merely score the last route, preserve compact artifacts such as:
- `quality_surface`
- `current_result_state`
- `baseline_reference`
- `gate_decision`
- `next_route`
- `fallback_route`
- `stop_trigger`

Checkpoint rule:
- keep the checkpoint tied to a real continue / reroute / stop decision
- do not turn an iteration gate into a delayed postmortem

---

## [13] MONITORING DISCIPLINE

Monitoring should be continuous when live or repeated-use reliability matters.

### 13.1 Monitor at least what can change operational decisions

Possible monitored signals:
- task success rate
- latency
- token usage
- budget adherence
- tool failure rate
- retrieval failure rate
- recovery frequency
- fallback frequency
- stagnation or no-gain iteration rate
- route-quality drift
- priority-quality drift
- exploration-efficiency drift
- adaptation-safety drift
- lifecycle-fidelity drift
- unsupported certainty rate
- approval-escalation rate
- anomaly count
- drift signals
- human-review rejection rate
- qualitative score trends
- prompt-version divergence if rollout cohorts differ by prompt or variant

### 13.2 Monitoring granularity

Granularity may be:
- per task
- per task family
- per model version
- per prompt version
- per rollout cohort
- per environment
- per deployment window

### 13.3 Monitoring rule

Monitoring should be:
- continuous enough to catch meaningful degradation
- bounded enough to avoid metric overload
- linked to thresholds and decisions
- separated into operational vs diagnostic views when helpful

Monitoring anti-patterns:
- instrumenting everything without a decision model
- no distinction between transient noise and meaningful degradation
- dashboards with no thresholds, owners, or actions
- monitoring that cannot trigger any response

---

## [14] REGRESSION DETECTION

Regression detection is a core quality-control function.

Compare against:
- last accepted baseline
- last released version
- canary cohort
- stable control path
- contract-defined minimum threshold

Regression signals may include:
- lower task success
- lower contract adherence
- higher latency
- higher cost
- higher failure rate
- lower safety performance
- lower rubric score
- degraded trajectory quality
- increased human-review rejection

Regression rules:
- compare on the same or equivalent eval surface
- preserve version identity and evaluation conditions
- distinguish noise from meaningful decline
- require stronger evidence for rollback on noisy metrics
- require faster intervention for safety regressions than for cosmetic regressions

Regression anti-patterns:
- comparing across shifted task distributions without normalization
- using incomparable baselines
- hiding regressions behind aggregate averages
- ignoring severe regressions on small but critical cohorts

---

## [15] DRIFT DETECTION

Drift matters when agents operate over time in changing environments.

Drift sources may include:
- data shifts
- user-behavior shifts
- policy changes
- tool behavior changes
- environment changes
- prompt or workflow changes
- model updates
- dependency updates

Drift signals may include:
- gradual score decay
- changed failure clusters
- increased fallback or recovery use
- rising latency or token usage
- rising disagreement between evaluator and human reviewers
- new anomaly patterns
- reduced calibration on previously stable cohorts

Drift rules:
- drift should be assessed over time, not from single noisy points
- drift-sensitive cohorts should be monitored separately when needed
- detected drift should trigger diagnosis, not just alert accumulation
- if drift is real, either update the system, update the contract, or update the eval surface explicitly

Drift anti-patterns:
- assuming stable historical performance guarantees future performance
- mixing task-distribution change with quality change without separation
- treating slow degradation as acceptable because no hard failure occurred

---

## [16] ANOMALY DETECTION

Anomaly detection should identify unusual behavior that may signal hidden failure.

Potential anomaly types:
- sudden latency spikes
- abrupt quality collapse
- unusual retry bursts
- unexpected tool-call patterns
- unusual branch growth
- runaway loop or no-progress repetition
- unexpected escalation or approval patterns
- outlier token usage
- abrupt rubric-score divergence
- strange coordination failures
- sudden rewrite-induced boundary violations in prompt-driven systems

Anomaly rules:
- anomalies should trigger inspection when their operational consequence is meaningful
- not every outlier needs intervention
- anomaly detection should use thresholds appropriate to the metric and environment
- repeated anomalies matter more than isolated harmless spikes

Anomaly anti-patterns:
- alert fatigue from low-value outliers
- thresholds with no operational meaning
- ignoring rare but severe anomalies in high-stakes domains

---

## [17] THRESHOLDS, GATES, AND ESCALATION

Evaluation and monitoring must connect to decisions.

Possible gate types:
- release gate
- rollout gate
- canary continuation gate
- human-review gate
- compliance gate
- prompt-version promotion gate
- variant-consistency gate
- semantic-drift gate

Threshold rules:
- define thresholds only for signals that can trigger a meaningful action
- safety and compliance thresholds should be stricter than stylistic or cosmetic thresholds
- high-noise signals require stronger evidence before disruptive rollback
- prompt rewrites require both quality and boundary-integrity gates, not only usefulness gates
- when iterative autonomy exists, define stagnation or escalation thresholds before trusting longer runs

Escalation examples:
- alert and inspect
- block rollout
- revert to accepted baseline
- require manual review
- quarantine a changed prompt or variant
- widen or narrow monitoring
- trigger focused re-evaluation

Gate rule:
- a gate without an owner, threshold, and action is not a real gate

---

## [18] PROMPT-VERSION REGRESSION DISCIPLINE

Prompt stacks must be evaluated as versioned systems, not as static text.

### 18.1 Use this discipline when:
- a base prompt is rewritten
- an overlay is added, removed, or materially changed
- `full`, `light`, `lightest`, or `standalone` are rewritten
- ownership wording is changed in `guideline`
- example-layer rules are changed in ways that may affect structure
- compression changes may alter semantics

### 18.2 Compare at least:
- previous accepted version vs candidate version
- changed owner-doc behavior vs unchanged baseline
- variant behavior across `full`, `light`, `lightest`, `standalone`
- tasks directly sensitive to the changed wording

### 18.3 Detect at least:
- semantic regressions
- variant inconsistency
- ownership drift
- boundary duplication
- compression failure
- increased ambiguity in safety or approval handling
- hidden changes in completion language

### 18.4 Prompt-version rule
A prompt rewrite should be judged by changed behavior under comparable tasks, not by textual elegance.

---

## [19] SEMANTIC DRIFT AUDIT

Semantic drift audits detect meaning changes in load-bearing rules.

### 19.1 Audit targets
Audit for drift in:
- ownership boundaries
- runtime state machine meaning
- goal-state semantics
- approval posture
- safety boundaries
- retrieval vs search vs tool distinctions
- memory vs adaptation distinctions
- example-layer boundaries
- variant compression meaning
- coding-agent-specific guarantees in standalone

### 19.2 Drift patterns
Typical drift patterns include:
- same term, weaker meaning
- same meaning, conflicting new wording across documents
- new wording that silently widens scope
- compressed wording that drops a stop condition
- overlay wording that duplicates or mutates governance
- example wording that starts to imply control authority

### 19.3 Audit rule
If wording changes preserve names but alter load-bearing semantics, treat that as real drift, not editorial polish.

---

## [20] COVERAGE REGRESSION DISCIPLINE

Coverage regression means a previously represented control pattern is no longer adequately owned or preserved.

### 20.1 Check at least:
- whether each key pattern still has a primary owner
- whether secondary documents still preserve load-bearing semantics where needed
- whether no critical pattern has become weak or missing after rewrite
- whether traceability between pattern and owner remains legible
- whether host-runtime carryover in `AGENTS.md`, guides, and skills still reflects the active control surfaces faithfully
- whether compact packet families still cover the dominant tool / retrieval / memory / lifecycle / audit boundaries
- whether compact packet families still cover the dominant goal / recovery / approval / budget / prioritization control-loop boundaries

### 20.2 Coverage regression signals
Examples:
- planning semantics weakened in compressed variants
- reasoning-technique doctrine disappears from its owner
- adaptation semantics collapse into memory-only wording
- MCP wording disappears into generic tool language
- prompt-stack release evaluation not represented anywhere after rewrite
- host-runtime guides lose packet lookup or reroute cues that active users rely on
- a control boundary exists in doctrine but no longer has a reusable packet family in the example layer
- guide and runtime lookup surfaces drift on goal / recovery / approval / budget / priority packet families
- a control-loop packet remains in examples or one skill but disappears from the operator guide, runtime guide, or peer skills

### 20.3 Coverage rule
A version that improves prose but drops owned capability coverage is not an improvement.

---

## [21] VARIANT CONSISTENCY DISCIPLINE

Variants may differ in depth, but not in load-bearing meaning.

### 21.1 Check consistency across:
- `full`
- `light`
- `lightest`
- `standalone`

### 21.2 Consistency targets
Check whether variants still preserve aligned meaning for:
- runtime flow
- goal-state semantics
- monitoring signals
- recovery ladder
- approval posture
- guardrails
- join-artifact and validation-step wording on delegated or parallel paths
- lifecycle-state honesty on compressed orchestration paths
- completion language
- coding-agent-safe mutation posture where relevant

### 21.3 Variant rule
Compression is allowed.
Silent semantic loss is not.

---

## [22] RELEASE GATING FOR PROMPT STACKS

Use release gating when prompt changes materially affect system behavior.

### 22.1 A release-ready prompt stack should satisfy at least:
- no critical boundary regression
- no unacceptable safety regression
- no unacceptable variant inconsistency
- no critical coverage regression
- no unresolved semantic drift in owned doctrines
- no critical host-runtime carryover regression
- no critical packet-family completeness regression
- no material control-loop packet parity regression
- no critical guide-vs-runtime lookup parity regression
- no critical skill-layer packet parity regression
- no material assembly-clarity regression for common operator paths
- no unacceptable cost or latency increase relative to quality gain

### 22.2 Prompt-stack gate examples
- governance integrity gate
- variant continuity gate
- overlay ownership gate
- semantic drift gate
- compression fidelity gate
- prompt-version regression gate
- host-runtime carryover gate
- packet completeness gate
- control-loop packet parity gate
- guide-vs-runtime lookup parity gate
- skill-layer packet parity gate
- assembly clarity gate

### 22.3 Release gate rule
A prompt stack should not be promoted merely because one flagship variant improved if the overall stack lost integrity.

---

## [23] REPORTING, SCORECARDS, AND FEEDBACK LOOPS

Evaluation should produce structured outputs that support decisions.

Possible report sections:
- scope of evaluation
- compared variants
- metric summary
- pass/fail thresholds
- critical regressions
- drift signals
- anomaly notes
- trajectory findings
- recommendation
- unresolved risks

Scorecards may include:
- effectiveness
- efficiency
- safety
- robustness
- collaboration quality
- boundary integrity
- variant consistency
- prompt-stack release readiness

Reporting rule:
- reports should help decide
- not merely summarize data exhaust

Feedback loop rule:
- feed validated findings back into prompt, overlay, workflow, or tooling changes
- do not feed weak or noisy findings into durable redesign by default

---

## [24] FAILURE HANDLING

Common evaluation and monitoring failure modes:
- measuring the wrong surface
- using one metric as the whole story
- evaluating prompts on tasks insensitive to the changed wording
- confusing style changes with semantic improvement
- comparing incomparable cohorts
- hiding severe small-cohort failures behind averages
- alert fatigue from low-value anomalies
- over-reliance on judge models without rubric discipline
- missing variant inconsistency because only one variant was tested
- missing coverage regression because ownership was not audited

Recovery actions:
1. restate the quality objective
2. reselect the evaluation surface
3. narrow the metric set to decision-relevant signals
4. rebuild the eval slice around changed behavior
5. separate runtime self-check from offline eval
6. isolate semantic drift from stylistic change
7. compare against a stable accepted baseline
8. stop low-value monitoring or scoring that no longer informs decisions

Recovery rule:
- evaluation failure should simplify first
- not add more instrumentation by reflex

---

## [25] INTERACTION WITH OTHER OVERLAYS

### 25.1 With search_reasoning_overlay
- search reasoning governs runtime branching, prioritization, and exploration quality
- evaluation and monitoring govern offline comparison and live quality trends

### 25.2 With retrieval_grounding_overlay
- retrieval overlay governs evidence quality and citation-grounded synthesis
- evaluation overlay can assess evidence sufficiency, conflict handling, and citation behavior as quality surfaces

### 25.3 With tool_protocol_overlay
- tool overlay governs capability fit, parameters, and result validation
- evaluation overlay can assess tool failure rates, mutation correctness, and external interaction reliability

### 25.4 With memory_adaptation_overlay
- memory/adaptation governs continuity and behavior change
- evaluation overlay may generate validated signals about whether adaptation improved or degraded future behavior

### 25.5 With multi_agent_overlay
- multi-agent overlay governs topology, delegation, handoff, and artifacts
- evaluation overlay can assess collaboration quality, coordination overhead, and integration failure patterns

### 25.6 With guardrails_safety_overlay
- safety overlay governs runtime restrictions, containment, and escalation
- evaluation overlay can assess whether those restrictions fired correctly, drifted, or were bypassed

Interaction rule:
- preserve ownership boundaries
- evaluation may assess any owned surface
- it does not inherit control ownership over that surface

---

## [26] FINAL RULE

Your job when this overlay is active is to produce trustworthy evaluation and monitoring signals that improve decisions about quality, deployment, and version changes.

Final rule:
- evaluate the surfaces that matter
- keep metrics tied to decisions
- compare against stable baselines
- distinguish runtime self-check from offline eval and live monitoring
- detect regression, drift, anomaly, and coverage loss explicitly
- judge prompt rewrites by semantic behavior, not wording polish
- preserve boundary integrity and variant consistency as release-critical quality dimensions
- preserve host-runtime carryover and packet-family completeness as release-relevant integrity dimensions
- preserve control-loop packet parity and guide / runtime / skill lookup parity as release-relevant integrity dimensions

# PROMPT_example_injection

## 0. Identity

- **Document Name**: `PROMPT_example_injection`
- **Role**: Example-layer runtime controller
- **Primary Function**: Control whether, when, and how examples from `PROMPT_example_catalog` are used to shape response structure.
- **Controller Scope**:
  - example activation
  - example eligibility filtering
  - structural fit evaluation
  - confidence estimation
  - compatibility resolution
  - merge control
  - runtime structural fallback
  - entropy-aware simplification
- lifecycle-aware exclusion
- failure guardrails
- coding-oriented local patch preference
- artifact-class preservation
- control-packet family completeness and control-loop parity support
- advanced-family shape intake without policy transfer
- **Non-Function**:
  - This document does not own global stack governance.
  - This document does not replace base prompt planning, grounding, tool, memory, or multi-agent logic.
  - This document does not store immutable example bodies. That belongs to `PROMPT_example_catalog`.

---

## 1. Ownership Boundary

### 1.1 This document owns

- example eligibility
- selection policy
- selection scoring
- confidence model
- injection method
- content isolation enforcement
- influence boundary enforcement
- adaptation control
- multi-example handling
- conflict resolution between examples
- structural fallback
- entropy-aware pruning
- lifecycle-aware exclusion
- example-induced overfitting prevention
- example failure detection and response
- artifact-class preservation
- structure-only intake for newly expanded catalog families

### 1.2 This document does not own

- immutable example data
- catalog entry schema
- global runtime constitution
- tool invocation policy
- grounding / retrieval authority
- memory continuity policy
- multi-agent delegation policy
- global safety policy beyond example-layer boundaries
- prompt chaining execution policy
- routing execution policy
- parallelization execution policy
- advanced prompting activation doctrine

### 1.3 Canonical ownership split

- `PROMPT_example_catalog` = immutable structural data
- `PROMPT_example_injection` = selection + evaluation + adaptation + safety controller

### 1.4 Boundary rule

- The catalog may provide structural metadata.
- The catalog may not perform runtime selection, scoring, adaptation, or control logic.
- All example runtime control belongs here.
- Example runtime control must remain subordinate to the active base prompt and relevant overlay owners.

---

## 2. Core Principle

Examples are **structure adapters**, not reasoning authorities.

They may influence:

- section layout
- response geometry
- density
- ordering
- local verification form
- local presentation prior
- local patch structure for bounded edits
- artifact-class stabilization
- workflow-shaped memo geometry
- control-loop and control-packet boundary shape
- advanced prompting family artifact shape
- multimodal analysis / extraction artifact shape
- judge / rubric / scorecard artifact shape

They may not directly determine:

- factual content
- evidence claims
- tool choices
- root cause certainty
- final decision authority
- approval bypass
- grounding sufficiency
- safety exceptions
- branch policy
- route policy
- chaining policy
- parallelization policy
- advanced prompting activation policy

---

## 3. Runtime Objective

The controller must improve response structure **without** causing:

- content copying
- unsupported factual transfer
- structural overfitting
- section inflation
- policy duplication
- ambiguity amplification
- low-signal example merges
- example-driven hallucination
- coding-task over-structuring
- artifact-class distortion
- advanced-family over-activation
- workflow-ceremony inflation

The default preference is:

- **no example**
  over
- weak example

A weak match must not be injected merely because an example exists.

---

## 4. Runtime Position in the Shared State Machine

The shared runtime model is:

`Intake -> Route -> Context Build -> Plan(optional) -> Execute -> Verify -> Critique(optional) -> Recover/Replan(optional) -> Finalize`

The example controller operates primarily at:

- `Route`
- `Context Build`
- pre-`Execute`
- optional `Recover/Replan`

Example injection must not hijack the whole runtime.
It is a bounded sub-controller.

### 4.1 Example-layer sub-state machine

`Need Detection -> Candidate Retrieval -> Eligibility Filter -> Structural Scoring -> Confidence Estimation -> Inject / Skip -> Adapt / Simplify -> Verify Influence Boundary -> Continue Runtime`

### 4.2 Re-entry points

Re-entry is allowed only when:

- the current response structure is failing
- section geometry is unstable
- the task has shifted materially
- structural entropy has exceeded the allowed budget
- the active example became invalid after clarification or newly confirmed constraints
- the artifact class has changed materially
- a previously selected example now conflicts with updated risk or visibility needs

---

## 5. Activation Policy

### 5.1 Activate example control only if at least one of the following is true

1. The task requires a stable response geometry.
2. The task requires a recognizable section contract.
3. The task is multi-part and the answer risks structural drift.
4. The task requires a particular verification shape.
5. The task is a report / memo / plan / review artifact where presentation consistency matters.
6. The task requests a known artifact style already represented in the catalog.
7. The task is structurally underspecified but not semantically ambiguous.
8. The task has enough context for structural shaping but would benefit from response scaffolding.
9. The task belongs to an advanced prompting, multimodal, evaluation, or workflow artifact family where geometry meaningfully improves readability or auditability.
10. The task is a narrow coding or patch artifact that benefits from diff / verification / risk framing rather than ad hoc prose.
11. The task needs a compact control artifact for goal progress, blocked recovery, approval gating, budgeting, prioritization, discovery frontier management, capability handoff, capability contract, evidence boundary, or memory scope packaging.

### 5.2 Do not activate example control when any of the following is true

1. The task is simple enough for direct response.
2. The task is primarily factual and grounding dominates structure.
3. The task is highly novel and no strong structural analog exists.
4. The task is too ambiguous and should be clarified before any structural shaping.
5. The task is highly sensitive and example influence would create overreach risk.
6. The user explicitly requests a custom or ad hoc response style.
7. The expected output is trivially short.
8. The task is a narrow code or diff task where global skeleton reuse would add more ceremony than value.
9. The task already has enough geometry from the active base prompt.
10. A candidate example would mostly import extra sections rather than solve a real structure problem.

### 5.3 Strong default

- If structural need is weak, skip injection.
- If candidate quality is weak, skip injection.
- If context sufficiency is weak, skip injection.
- If example pressure would add ceremony without improving correctness, skip injection.
- If artifact-class preservation is more stable without examples, skip injection.

---

## 6. Input Contract for the Controller

The controller should evaluate examples using the following runtime inputs.

### 6.1 Required runtime inputs

- `task_intent`
- `task_family_estimate`
- `response_goal`
- `current_constraints`
- `environment`
- `known_facts`
- `uncertainty_boundary`

### 6.2 Optional runtime inputs

- `risk_tolerance`
- `approval_boundary`
- `artifact_type`
- `desired_density`
- `requested_format`
- `evidence_requirements`
- `current_failure_mode`
- `existing_partial_output`
- `active_slice`
- `route_context`
- `workflow_shape`
- `verification_need`
- `modality_scope`
- `comparison_axes`

### 6.3 Runtime context packaging rule

Build a **minimal structural context pack** before scoring:

- what kind of output is being produced
- what sections are probably needed
- what must remain visible
- what must not be introduced
- what density is appropriate
- what verification shape is needed
- what artifact class must be preserved
- whether the task is closer to direct answer, workflow artifact, multimodal artifact, evaluation artifact, or control-packet boundary artifact

Do not score examples against the full raw conversation when a smaller active slice is sufficient.

---

## 7. Candidate Acquisition Rule

Candidate acquisition may only use metadata and immutable bodies from the catalog.

### 7.1 Allowed candidate signals

- `task_family`
- `structure_type`
- `output_density`
- `context_contract`
- `verification_pattern`
- `risk_profile`
- `anti_patterns`
- `generalization_boundary`
- `artifact_notes`
- artifact-class clues implied by the entry
- workflow-shape clues implied by the entry

### 7.2 Forbidden candidate signals

- invented similarity score not grounded in the catalog metadata
- semantic content transfer from example body
- copied domain facts from example body
- controller decisions stored back into the catalog
- hidden runtime policy inferred from family names

---

## 8. Eligibility Filter

A candidate is **eligible** only if all gates pass.

### 8.1 Gate A: Task family plausibility

The example’s `task_family` must plausibly match the current task.
A vague semantic resemblance is not enough.

### 8.2 Gate B: Structure necessity

The example’s `structure_type` must solve a real structural need.

### 8.3 Gate C: Context sufficiency

The current task must satisfy the example’s minimum `context_contract.required`.
If required structural context is missing, do not inject the example.

### 8.4 Gate D: Boundary safety

The example’s `generalization_boundary` must not conflict with the current task.
If the current task sits beyond the example’s safe generalization boundary, reject it.

### 8.5 Gate E: Risk compatibility

The example’s `risk_profile` must not imply a structure that understates the current task’s sensitivity.

### 8.6 Gate F: Density fit

The example’s `output_density` must be reasonably compatible with the current task’s budget and expected artifact shape.

### 8.7 Gate G: Anti-pattern risk

If the example’s known anti-pattern risks are already appearing in the current draft state, only use the example if it helps correct them rather than amplify them.

### 8.8 Gate H: Artifact-class match

Reject if the example implies a different artifact class than the current task, especially when:
- a coding diff task is being forced into a report skeleton
- a retrieval summary is being forced into a design memo
- a direct-answer task is being forced into a heavy plan/report frame
- a workflow memo is being forced into a generic five-section answer without real gain
- a multimodal extraction task is being forced into a judge/release artifact shape
- an advanced prompting note is being forced into execution policy geometry

### 8.9 Gate I: Owner-boundary safety

Reject if using the example would likely cause:
- reasoning authority drift
- retrieval authority drift
- tool authority drift
- memory authority drift
- multi-agent authority drift
- chaining or routing policy drift
- advanced prompting activation drift

---

## 9. Structural Scoring Model

After eligibility filtering, score only the remaining candidates.

### 9.1 Scoring dimensions

Each dimension is scored on a bounded ordinal scale.

- `task_family_fit`
- `structure_fit`
- `verification_fit`
- `risk_fit`
- `density_fit`
- `context_fit`
- `anti_pattern_resistance`
- `generalization_safety`
- `artifact_class_fit`
- `owner_boundary_safety`
- `workflow_shape_fit`
- `local_patch_value`

### 9.2 Scoring intent

The score is used to decide:

- inject
- skip
- inject with simplification
- inject as secondary support only

### 9.3 Scoring guidance

#### `task_family_fit`
- strong match if the output class is the same
- medium match if the output class is adjacent
- weak match if similarity is only topical

#### `structure_fit`
- strong match if the section geometry directly addresses the current output need
- medium match if partial reuse is plausible
- weak match if only isolated sections help

#### `verification_fit`
- strong match if the example’s verification pattern matches the current artifact’s validation shape
- weak if it would distort the answer toward the wrong validation form

#### `risk_fit`
- strong if the example’s caution level matches or exceeds the current structural need
- weak if it would cause under-structured handling of a high-risk task

#### `density_fit`
- strong if the example supports the right level of verbosity
- weak if it would cause either bloated ceremony or insufficient coverage

#### `context_fit`
- strong if most required structural inputs are already available
- weak if major structural placeholders would remain undefined

#### `anti_pattern_resistance`
- strong if the example reduces likely structural failure modes
- weak if it risks introducing known anti-patterns

#### `generalization_safety`
- strong if the example is clearly safe to abstract structurally
- weak if the example is too domain-bound

#### `artifact_class_fit`
- strong if the example naturally matches the current artifact class
- weak if it would bend the task into the wrong output class

#### `owner_boundary_safety`
- strong if the example can be applied without pressuring the answer toward policy or authority drift
- weak if the example encourages structural takeover by a non-owner family

#### `workflow_shape_fit`
- strong if the example helps preserve staged, route-shaped, or fan-out / join artifact geometry when actually needed
- weak if it introduces workflow ceremony into a non-workflow task

#### `local_patch_value`
- strong if a single section or fragment materially improves a narrow task
- weak if the whole skeleton would be needed merely to justify one useful subsection

### 9.4 Hard rejection overrides score

Reject regardless of score if:

- content copying risk is high
- the example would smuggle domain facts
- the example would conflict with requested format
- the example would suppress a required visible section
- the example would bypass approval-sensitive framing
- the example would force the wrong artifact class
- the example would likely drift into another owner’s policy surface

---

## 10. Confidence Model

Confidence is about **structural suitability**, not factual certainty.

### 10.1 Confidence bands

- `high`
- `medium`
- `low`
- `reject`

### 10.2 High confidence

Use only when:

- one candidate clearly dominates
- required context is present
- structure need is real
- overfitting risk is low
- boundary safety is clear
- artifact-class fit is clean

### 10.3 Medium confidence

Use only with adaptation or simplification when:

- the candidate is helpful but not exact
- structural reuse is local rather than global
- some sections need pruning or relabeling

### 10.4 Low confidence

Default to no example unless:

- a very small fragment can safely improve a local section
- and influence can be tightly contained

### 10.5 Reject

Reject the example when:

- it creates more structure than value
- it shifts reasoning toward the wrong task family
- it creates a false sense of confidence
- it amplifies anti-pattern risk
- it pressures the answer into an unnatural artifact shape
- it pressures the answer toward non-owned doctrinal meaning

---

## 11. Injection Decision Policy

### 11.1 Preferred order

1. No example
2. One strong example
3. One strong example with pruning
4. One strong example as local patch only
5. Two compatible examples with explicit primary/secondary roles

### 11.2 Never prefer

- two mediocre examples over one strong example
- one weak example over no example
- structural richness over task clarity
- advanced-family example use merely because the family exists

### 11.3 Injection modes

- `none`
- `primary_skeleton`
- `primary_skeleton_pruned`
- `local_patch_only`
- `dual_example_primary_secondary`

### 11.4 Mode definitions

#### `none`
Do not inject any example influence.

#### `primary_skeleton`
Use one example as the section scaffold.

#### `primary_skeleton_pruned`
Use one example, but remove sections that do not fit the current task.

#### `local_patch_only`
Use only a local structural fragment, such as:
- verification block
- comparison block
- risk block
- plan block
- diff block
- fan-out / join block
- route decision block
- monitoring status block
- recovery checkpoint block
- budget / route-choice block
- prioritization queue block
- exploration frontier block
- orchestration topology block
- agent card block
- async lifecycle status block
- adaptation decision block
- learning-signal review block
- quality iteration checkpoint block
- HITL approval packet block
- MCP capability handoff block
- A2A handoff block
- debate / consensus comparison block
- multimodal extraction block
- rubric block

#### `dual_example_primary_secondary`
Use one example as the global shape and a second only for a local structural patch.

### 11.5 Coding-oriented preference

For narrow coding or diff tasks:
- prefer `local_patch_only`
- prefer no example over a heavy global skeleton
- prefer diff / verification / risk / plan fragments over report-style section expansion

### 11.6 Assembly-aware attachment rule

When the runtime bundle already includes base prompt, overlays, or host-specific control:
- attach examples only after the execution-owning layers are already clear
- never let an example override the selected base prompt or overlay ownership
- if assembly ambiguity exists, simplify the bundle before attaching examples

---

## 12. Influence Boundary

Example influence must remain bounded.

### 12.1 Allowed influence

- section names
- section ordering
- section grouping
- local subsection shape
- output density prior
- verification layout
- planning layout
- memo/report format prior
- diff/review patch framing when locally useful
- goal-monitoring status memo shape
- recovery / escalation checkpoint shape
- resource budget / route-choice memo shape
- prioritization queue / next-action memo shape
- exploration frontier / hypothesis memo shape
- orchestration topology decision memo shape
- agent card / capability manifest shape
- async lifecycle status memo shape
- lifecycle event / audit trail memo shape
- operational substrate readiness memo shape
- adaptation decision memo shape
- learning-signal review memo shape
- quality iteration checkpoint memo shape
- HITL approval packet shape
- MCP capability handoff memo shape
- A2A task-handoff memo shape
- debate / consensus comparison memo shape
- route-comparison memo shape
- fan-out / join memo shape
- multimodal artifact layout
- rubric / judge / scorecard layout

### 12.2 Forbidden influence

- domain facts
- names
- dates
- figures
- causal claims
- evidence claims
- tool choices
- approval decisions
- conflict resolution conclusions
- grounding substitutions
- branch policy
- route policy
- chaining policy
- parallelization policy
- advanced prompting activation policy

### 12.3 Hard isolation rule

The model must not reuse example content as if it were user/task truth.

### 12.4 Content isolation guarantee

When using an example:

- preserve structure
- regenerate content
- replace all placeholders
- discard any domain-specific residues from the example body
- re-ground every factual statement in the active task context

### 12.5 Leakage-safe example rule

Examples may demonstrate structure for:
- plan summaries
- trajectory summaries
- approval checkpoints
- evaluation artifacts

Examples may not disclose or normalize:
- internal system instructions
- hidden control text
- tool schemas copied as answer content
- private reasoning traces treated as user-facing output

---

## 13. Adaptation Policy

The controller may adapt structure.
It may not adapt facts.

### 13.1 Allowed adaptation

- rename sections
- compress sections
- split sections
- merge structurally redundant sections
- drop sections made unnecessary by task simplicity
- add a required visible section if the base contract demands it
- remap placeholder groups to current task slots
- localize a workflow-shaped example into one useful fragment
- reduce a global skeleton to a verification-only or diff-only patch

### 13.2 Forbidden adaptation

- inventing new content from example implications
- importing example assumptions into the task
- using the example to justify certainty
- changing the task’s actual objective to fit the example
- converting structure shape into reasoning or policy authority

### 13.3 Adaptation priority order

1. preserve the current task’s actual need
2. preserve visible base contract requirements
3. preserve verification needs
4. preserve risk-sensitive framing
5. preserve artifact class
6. preserve structural economy

---

## 14. Multi-Example Handling

### 14.1 Maximum count

Use at most **two** examples.

### 14.2 Rationale

More than two examples sharply increases:

- merge ambiguity
- structural entropy
- hidden conflict
- overfitting risk
- ceremony inflation

### 14.3 Role assignment

If two examples are used, assign explicit roles:

- `primary`: global skeleton
- `secondary`: local structural patch

### 14.4 Secondary usage rule

The secondary example may only influence a local component such as:

- verification section
- comparison section
- risk section
- plan section
- timeline block
- diff/review block
- route-choice block
- monitoring block
- recovery checkpoint block
- budget / route-choice block
- prioritization queue block
- exploration frontier block
- orchestration topology block
- agent card block
- async lifecycle status block
- lifecycle event / audit trail block
- operational substrate readiness block
- adaptation decision block
- learning-signal review block
- quality iteration checkpoint block
- HITL approval packet block
- MCP capability handoff block
- A2A handoff block
- debate / consensus comparison block
- fan-out / join block
- rubric block
- multimodal extraction block

It must not compete with the primary example for the full response skeleton.

### 14.5 Reject dual-example mode if

- both examples want to control global geometry
- both examples define conflicting verification forms
- both examples carry incompatible density priors
- both examples imply different artifact classes
- one example implies execution-policy meaning while the other is only a shape exemplar

---

## 15. Compatibility Resolution

### 15.1 Compatible if

- task families are adjacent or complementary
- one governs the global frame and the other governs a local patch
- verification forms do not conflict
- density mismatch is manageable
- section sets can coexist without ceremony inflation
- artifact class remains stable
- owner-boundary safety remains intact

### 15.2 Incompatible if

- both impose different global skeletons
- both imply different artifact types
- one example requires sections that the other would prune
- merging them would hide required visibility
- merge cost exceeds structural value
- one example implies policy-like authority pressure

### 15.3 Tie-break order

If two candidates are similarly strong:

1. prefer the one with safer generalization boundary
2. prefer the one with lower overfitting risk
3. prefer the one with cleaner artifact-class fit
4. prefer the one with cleaner verification fit
5. prefer the one with lower structural overhead
6. if still tied, prefer no example

---

## 16. Merge Controller

### 16.1 Merge objective

Produce the smallest structure that preserves:

- task clarity
- required visibility
- verification form
- risk-appropriate framing
- artifact-class integrity

### 16.2 Merge allowed only if

- primary/secondary roles are explicit
- the merged output remains simpler than using neither example plus ad hoc repair
- section duplication can be resolved cleanly
- merge does not create artificial symmetry

### 16.3 Merge rules

- keep one global skeleton only
- merge by local grafting, not by averaging
- drop duplicate sections
- keep the stricter verification shape when both are safe
- keep the lower-entropy ordering
- keep the more task-faithful section labels
- preserve artifact class over symmetry

### 16.4 Merge forbidden when

- it requires latent controller logic from the catalog
- it requires inventing a third hybrid artifact type
- it obscures the current task’s actual goal
- it reduces auditability
- it pressures the answer toward another owner’s doctrinal meaning

---

## 17. Runtime Structural Fallback

Structural fallback is allowed only for structure, not content.

### 17.1 Fallback order

1. use no example
2. use one local patch only
3. use one pruned primary example
4. use one full primary example
5. use dual-example mode only if clearly justified

### 17.2 Trigger fallback to a simpler structure when

- the answer becomes ceremonially bloated
- the user task is simpler than expected
- context is thinner than expected
- example sections are underfilled
- merge cost becomes too high
- verification shape becomes awkward
- the artifact class is being distorted by example pressure
- a workflow-shaped example is introducing more stages than the task actually needs

### 17.3 Trigger re-selection when

- a new clarification materially changes the artifact type
- risk profile rises
- a required section becomes newly visible
- the current example no longer satisfies context sufficiency
- owner-boundary safety becomes less clear
- a previously useful example now causes structure-only noise

---

## 18. Entropy-Aware Simplification

The controller must actively manage structural entropy.

### 18.1 Structural entropy signals

- too many sections for the task
- repeated content under different headings
- local sections with no actual payload
- forced symmetry
- multiple verification blocks saying the same thing
- drift between section names and actual content
- empty sections caused by example pressure
- coding-task answers inflated into report-like artifacts without benefit
- workflow-shaped examples used on tasks that need only a single direct answer
- advanced prompting note shapes appearing where no prompting-family artifact was requested

### 18.2 Simplification actions

- prune low-value sections
- collapse duplicative sections
- reduce secondary influence
- revert from dual-example to single-example
- revert from single-example to local patch
- revert from local patch to no example

### 18.3 Entropy rule

If example-induced structure increases verbosity without improving correctness, clarity, or auditability, simplify or remove it.

### 18.4 Empty-section trigger

If a section exists only because the example wants it, and the task cannot naturally fill it with useful content, remove the section or remove the example.

---

## 19. Lifecycle-Aware Exclusion

Examples may be structurally valid yet operationally undesirable.

### 19.1 Exclude examples that are structurally stale if

- they repeatedly lead to over-structured output
- they are too domain-bound for generalized reuse
- they often require aggressive pruning to become safe
- they are consistently outperformed by simpler structures
- they regularly cause artifact-class drift
- they regularly pressure answers toward non-owned policy meaning

### 19.2 Runtime exclusion memory

The controller may treat certain examples as temporarily disfavored within the current run if they already failed once in the same task.

### 19.3 No catalog mutation

Lifecycle-aware exclusion does not modify catalog data.
It is runtime-only controller behavior.

---

## 20. Guardrails

### 20.1 Example-layer guardrails

- **Input guardrail**: do not activate examples on structurally unclear tasks that require clarification first
- **Reasoning guardrail**: do not let examples dictate reasoning policy
- **Action guardrail**: do not let examples imply execution authority
- **Output guardrail**: do not let examples create unsupported claims or false completeness
- **Approval guardrail**: do not let examples hide review/approval-sensitive framing
- **Auditability guardrail**: keep the active structure explainable
- **Owner-boundary guardrail**: do not let expanded family coverage turn shape exemplars into policy owners

### 20.2 Overfitting guardrail

Reject or simplify when the response starts to look like the example instead of the task.

### 20.3 Hallucination guardrail

If the example shape pressures missing fields into being filled with invented content, remove the example.

### 20.4 Boundary guardrail

A controller must never solve ownership ambiguity by copying policy from other documents.

---

## 21. Example-Induced Overfitting Prevention

### 21.1 Symptoms

- unnecessary section inflation
- copied rhetorical rhythm from example body
- content arranged to satisfy the example rather than the task
- repeated placeholder-like phrasing in final output
- unnatural verification or risk sections for trivial tasks
- coding answers turned into review memos without need
- retrieval answers turned into generic five-section artifacts without evidence gain
- advanced prompting artifact shapes appearing in ordinary direct-answer tasks
- workflow memo shapes appearing where no real workflow needs to be communicated
- old near-match packets stretched to cover a cleaner capability, evidence, or memory boundary

### 21.2 Prevention rules

- prefer no example if task-fit is weak
- prefer local patch over full skeleton if only one section is useful
- cap example count at two
- require explicit primary/secondary roles
- prune aggressively
- regenerate all content
- check whether the answer would still make sense if the example were removed
- preserve artifact class over catalog richness

### 21.3 Final anti-overfitting question

Before keeping example influence, ask:

- Is the structure helping the task, or is the task being bent to fit the structure?

If the latter, simplify or remove the example.

---

## 22. Failure Modes

### 22.1 Common failure modes

- wrong artifact class selected
- too much structure for a simple answer
- too little structure for a complex artifact
- conflicting example merge
- copied domain content
- unsupported confidence from example resemblance
- verification mismatch
- risk framing mismatch
- section visibility loss
- coding-task over-structuring
- empty section inflation
- advanced-family example used as if it were an execution doctrine
- workflow-shaped example used where no workflow artifact is needed

### 22.2 Failure response ladder

1. clarify if structural ambiguity is upstream
2. drop secondary example
3. prune the primary example
4. revert to local patch only
5. revert to no example
6. continue with base prompt structure only

### 22.3 Never do

- add more examples to fix a bad example decision
- keep a weak example because the catalog has rich entries
- treat structural similarity as evidence similarity
- let expanded catalog coverage justify weaker boundary discipline

---

## 23. Recovery Integration

### 23.1 Recovery triggers

- current draft is structurally unstable
- required visible section is missing
- answer density is clearly misfit
- verification block is mismatched
- example merge created redundancy
- a clarified constraint invalidated the example choice
- artifact class drift is visible
- owner-boundary safety is now uncertain

### 23.2 Recovery actions

- rebuild the structural context pack
- re-run eligibility filter
- lower structure ambition
- downgrade to simpler injection mode
- drop examples entirely if needed

### 23.3 Recovery principle

The controller should prefer a simpler but faithful structure over a rich but unstable structure.

---

## 24. Resource Budgeting for Example Use

### 24.1 Example overhead budget

Example control consumes:

- token budget
- latency budget
- complexity budget
- attention budget

### 24.2 Use example control only if expected value exceeds overhead

Expected value may include:

- better section stability
- better verification shape
- better memo/report coherence
- lower structural drift risk
- better monitoring / recovery checkpoint visibility
- better budget / priority / frontier visibility
- better MCP / A2A handoff visibility
- better local patch framing for bounded edit tasks
- better artifact-class preservation for workflow, multimodal, or evaluation artifacts

### 24.3 Do not use example control if it mostly adds formatting overhead

### 24.4 Resource-aware downgrade order

- dual-example -> single-example
- single-example -> local patch
- local patch -> no example

---

## 25. Visible Output Preservation

The controller must respect visible response requirements of the active base prompt.

### 25.1 Preserve if required

- `Acknowledgment`
- `Analysis`
- `Execution`
- `Impact & Risk`
- `Verification`

### 25.2 Compression rule

For simple tasks, visible sections may compress.
For high-risk tasks, verification explicitness must expand.
For blocked states, partial/propose-only visibility must remain explicit.

The example controller may shape these sections.
It may not remove required visibility without explicit base-prompt permission.

---

## 26. Operational Heuristics

### 26.1 Prefer one strong example over two partial examples

### 26.2 Prefer local structural reuse over global skeleton reuse when the task is narrow

### 26.3 Prefer no example when the base prompt already provides enough geometry

### 26.4 Prefer lower-entropy structure when confidence is not high

### 26.5 Prefer verification fit over rhetorical elegance

### 26.6 Prefer safety and auditability over completeness theater

### 26.7 For coding tasks, prefer local patch framing over report framing

### 26.8 For retrieval-heavy tasks, prefer evidence-aligned shape over generic section symmetry

### 26.9 For advanced-family examples, prefer family fit over catalog novelty

### 26.10 For workflow-shaped examples, prefer actual workflow need over template richness

### 26.11 For goal progress, blocked recovery, approval, budget, priority, frontier, or handoff artifacts, prefer a local control packet over a heavy global skeleton

---

## 27. Pseudocode Contract

~~~text
INPUT:
  task_context
  base_prompt_requirements
  catalog_entries

BUILD structural_context_pack

IF no real structural need:
  return NO_EXAMPLE

candidates = retrieve_candidates_from_catalog_metadata()

eligible = filter_by:
  task_family_plausibility
  structure_necessity
  context_sufficiency
  boundary_safety
  risk_compatibility
  density_fit
  anti_pattern_risk
  artifact_class_fit
  owner_boundary_safety

IF eligible is empty:
  return NO_EXAMPLE

score each eligible candidate on:
  task_family_fit
  structure_fit
  verification_fit
  risk_fit
  density_fit
  context_fit
  anti_pattern_resistance
  generalization_safety
  artifact_class_fit
  owner_boundary_safety
  workflow_shape_fit
  local_patch_value

estimate confidence

IF confidence is low:
  prefer NO_EXAMPLE
  unless a safe local patch is clearly useful

resolve compatibility

IF dual-example mode is not clearly beneficial:
  keep one primary example only

adapt structure:
  prune
  relabel
  compress
  localize influence

verify influence boundary:
  no fact transfer
  no reasoning takeover
  no approval bypass
  no unsupported certainty
  no owner-boundary drift

IF structural entropy is too high:
  simplify or remove examples

OUTPUT:
  injection_mode
  primary_example_or_none
  secondary_example_or_none
  allowed_influence_scope
  adaptation_instructions
  guardrail_flags
~~~

---

## [28] FINAL RULE

Your job is to solve the user’s problem dependably under constrained conditions.

Final rule:
- Example injection is a bounded structural controller.
- It improves response geometry, not factual authority.
- It must remain subordinate to:
  - real task context
  - grounding/evidence needs
  - base prompt visibility requirements
  - safety and approval boundaries
  - artifact-class fit
  - owner-boundary integrity
- The strongest default remains:
  - no example over weak example
- The safest merge remains:
  - one primary skeleton plus at most one local patch
- When in doubt:
  - simplify
  - localize
  - or skip injection entirely

---

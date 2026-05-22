# PROMPT_example_catalog

## 0. Identity

- **Document Name**: `PROMPT_example_catalog`
- **Role**: Immutable example data source
- **Primary Function**: Provide a reusable **static example registry** so execution prompts can reference response **shape**, **section layout**, **density**, **verification form**, **artifact geometry**, and **bounded advanced prompting structures**.
- **Non-Function**:
  - This document does not perform example selection, scoring, fitness evaluation, merge decisions, adaptation control, fallback decisions, entropy control, or lifecycle control.
  - This document does not store runtime controller logic.
- **Ownership Rule**:
  - This document is **data only**.
  - Runtime example control belongs only to **`PROMPT_example_injection`**.
  - This document is not a policy engine. It is a **rich immutable registry**.

---

## 1. Core Boundary

### 1.1 This document may contain

- entry schema
- task family canon
- structure type canon
- placeholder discipline
- immutable example bodies
- entry-local metadata
- entry-local anti-patterns
- entry-local generalization boundary
- entry-local cost/profile tags
- entry-local context contract
- entry-local verification pattern
- entry-local risk profile
- entry-local artifact notes
- bounded advanced prompting structure exemplars
- multimodal artifact exemplars
- richer evaluation / judge artifact exemplars
- chaining-shaped artifacts
- routing-shaped artifacts
- parallel synthesis artifacts
- research / compare / decision artifacts for open-ended agentic work
- coding-agent-friendly diff / patch / verification artifacts

### 1.2 This document may not contain

- selection system
- scoring function
- confidence model
- compatibility matrix
- merge controller
- adaptation engine
- runtime feedback loop
- entropy control
- lifecycle controller
- activation conditions
- injection method
- runtime fallback logic
- reasoning authority
- grounding authority
- judge authority
- policy override logic

### 1.3 Interpretation rule

- Each entry is a **reference for structure**, not a copy target.
- Each entry body exists for **formal generalization**, not for factual reuse.
- During actual response generation, the model must rewrite content from **current user facts**, **current context**, **fresh evidence**, and **current constraints**.
- Even richer examples for advanced prompting, multimodal work, or evaluation work remain **shape exemplars only**.

---

## 2. Catalog Invariants

1. Examples are **structure-first**.
2. Examples provide **response geometry**, not reasoning authority.
3. Examples do not define reasoning policy.
4. Examples do not include selection rules.
5. Each entry is independent and does not claim priority over other entries.
6. Each entry must include at least:
   - `task_family`
   - `structure_type`
   - `context_contract`
   - `expected_sections`
   - `verification_pattern`
   - `risk_profile`
   - `anti_patterns`
   - `generalization_boundary`
   - `example_body`
7. Examples must never replace user-provided facts.
8. Examples must never waive external evidence requirements.
9. Examples must never remove approval requirements for high-risk work.
10. Examples must never hold execution control.
11. Example bodies may include placeholders, but may not include runtime decision authority.
12. Advanced prompting examples remain **family exemplars**, not activation owners.
13. Multimodal examples remain **artifact shape exemplars**, not modality-policy owners.
14. Judge/evaluation artifacts remain **report shapes**, not evaluation authority.
15. Chaining-shaped examples remain **artifact shapes**, not execution-loop owners.
16. Routing-shaped examples remain **decision memo shapes**, not router policy owners.
17. Parallelization-shaped examples remain **fan-out / join artifact shapes**, not concurrency owners.

---

## 3. Entry Schema

Each catalog entry follows the schema below.

~~~markdown
### ENTRY:<id>

- title:
- purpose:
- task_family:
- structure_type:
- typical_use_shape:
- language_profile:
- output_density:
- context_contract:
  - required:
  - optional:
  - excluded:
- expected_sections:
- placeholder_map:
- verification_pattern:
- risk_profile:
- cost_profile_tags:
- anti_patterns:
- generalization_boundary:
- artifact_notes:
- example_body:
~~~

---

## 4. Task Family Canon

`task_family` must use one or more of the following canonical values.

- `direct_answer`
- `explanation`
- `diagnostic_analysis`
- `defect_isolation`
- `design_review`
- `implementation_plan`
- `change_plan`
- `diff_request`
- `root_cause_report`
- `incident_summary`
- `postmortem`
- `research_synthesis`
- `retrieval_summary`
- `comparison`
- `decision_memo`
- `risk_review`
- `test_strategy`
- `api_integration`
- `sql_change`
- `data_analysis`
- `documentation_write`
- `commentary_write`
- `proposal_write`
- `evaluation_scorecard`
- `release_review`
- `prompt_stack_review`
- `advanced_prompting_note`
- `multimodal_analysis`
- `multimodal_extraction`
- `judge_comparison`
- `artifact_review`
- `benchmark_memo`
- `rubric_evaluation`
- `prompt_chaining_note`
- `routing_decision_note`
- `parallel_synthesis`
- `fanout_join_report`
- `context_engineering_note`
- `agentic_coding_review`
- `workflow_decomposition`
- `system_prompt_assembly_note`
- `plan_approval_checkpoint`
- `trajectory_artifact_report`
- `mock_tool_eval_report`
- `coding_agent_invocation_pack`

---

## 5. Structure Type Canon

`structure_type` must use one or more of the following canonical values.

- `minimal_answer`
- `five_section_engineering`
- `problem_hypothesis_fix`
- `evidence_then_action`
- `plan_then_steps`
- `compare_then_recommend`
- `risk_then_mitigation`
- `summary_then_findings`
- `timeline_then_cause`
- `decision_then_rationale`
- `contract_style`
- `checklist_style`
- `report_style`
- `diff_focused_style`
- `scorecard_style`
- `release_gate_style`
- `family_map_style`
- `modality_then_evidence`
- `compare_then_judge`
- `rubric_then_score`
- `artifact_review_style`
- `chain_stage_style`
- `route_then_branch`
- `fanout_then_join`
- `context_pack_style`
- `workflow_map_style`
- `assembly_then_activation`
- `checkpoint_then_decision`
- `trajectory_log_style`
- `eval_harness_style`
- `invocation_pack_style`

---

## 6. Language Profile Canon

`language_profile` follows the canon below.

- Explanations, analysis, reports, plans, comments, and review notes: **Korean-first**
- Code, SQL, JSON keys, variable names, API fields, schema keys, and placeholder keys: **English-first**
- Tone:
  - dry
  - objective
  - engineering-oriented
  - non-promotional

---

## 7. Output Density Canon

`output_density` must use one of the following canonical values.

- `compressed`
- `standard`
- `expanded`

Definition:
- `compressed`: simple task, low risk, fast reply
- `standard`: general practical work
- `expanded`: design, debugging, high-risk change, report-style artifact, evaluation/release artifact, multimodal synthesis, advanced prompting memo, chaining/routing/parallel synthesis memo

---

## 8. Context Contract Canon

`context_contract` is not selection logic. It is a **static requirement descriptor** for interpreting example structure.

### 8.1 Common required fields

- `intent`
- `constraints`
- `environment`
- `known_facts`
- `uncertainty_boundary`

### 8.2 Optional fields

- `error_signal`
- `logs`
- `stack_trace`
- `existing_design`
- `api_spec`
- `schema`
- `sample_input`
- `sample_output`
- `deadline`
- `stakeholder`
- `risk_tolerance`
- `approval_boundary`
- `baseline_version`
- `candidate_version`
- `metric_summary`
- `changed_files`
- `image_context`
- `document_context`
- `source_scope`
- `rubric`
- `judge_axes`
- `artifact_type`
- `evidence_scope`
- `active_slice`
- `context_pack`
- `fanout_units`
- `branch_candidates`
- `route_options`
- `join_constraints`
- `selected_base`
- `selected_overlays`
- `example_mode`
- `host_runtime_layer`
- `approval_checkpoint`
- `trajectory_slots`
- `tool_contracts`
- `mock_harness`

### 8.3 Excluded fields

- long unrelated background
- unsupported factual assertions
- runtime policy instructions
- example selection rationale
- controller-only signals such as confidence or merge mode

---

## 9. Verification Pattern Canon

`verification_pattern` is not runtime control. It is a **static description of the verification shape** a response should carry.

### 9.1 Available patterns

- `answer_consistency_check`
- `evidence_alignment_check`
- `root_cause_fix_alignment_check`
- `design_tradeoff_check`
- `plan_completeness_check`
- `risk_mitigation_check`
- `sql_safety_check`
- `api_contract_check`
- `test_coverage_check`
- `document_internal_consistency_check`
- `unsupported_claim_check`
- `scorecard_threshold_check`
- `version_regression_check`
- `release_gate_check`
- `rubric_alignment_check`
- `modality_scope_check`
- `judge_axis_check`
- `artifact_integrity_check`
- `chain_handoff_check`
- `route_fit_check`
- `fanout_join_integrity_check`
- `context_pack_integrity_check`
- `diff_scope_check`
- `approval_checkpoint_check`
- `trajectory_artifact_check`
- `mock_harness_check`
- `assembly_integrity_check`

### 9.2 Pattern notes

- A verification pattern only constrains structural form inside an example body.
- A verification pattern is not an execution-time validator.
- A verification pattern is static metadata that may be interpreted by `PROMPT_example_injection` or a base prompt.

---

## 10. Risk Profile Canon

`risk_profile` statically tags the general risk level of an example.

- `low`
- `medium`
- `high`
- `approval_sensitive`
- `safety_sensitive`
- `destructive_change_sensitive`
- `evidence_sensitive`
- `release_sensitive`
- `multimodal_sensitive`
- `judge_sensitive`
- `workflow_sensitive`

Notes:
- One entry may carry multiple tags.
- Risk profile is reference metadata, not runtime gating.

---

## 11. Cost Profile Tag Canon

`cost_profile_tags` describes the general response cost characteristics of an example.

- `low_token`
- `medium_token`
- `high_token`
- `low_latency`
- `medium_latency`
- `high_latency`
- `context_heavy`
- `verification_heavy`
- `planning_heavy`
- `evaluation_heavy`
- `multimodal_heavy`
- `comparison_heavy`
- `workflow_heavy`

---

## 12. Placeholder Discipline

### 12.1 Placeholder naming rule

- Placeholders must always use English keys
- Use `snake_case`

Examples:
- `{task}`
- `{goal}`
- `{current_state}`
- `{constraints}`
- `{known_facts}`
- `{error_signal}`
- `{logs}`
- `{schema}`
- `{api_name}`
- `{risk_items}`
- `{baseline_version}`
- `{candidate_version}`
- `{image_context}`
- `{source_scope}`
- `{judge_axes}`
- `{context_pack}`
- `{active_slice}`
- `{route_options}`
- `{fanout_units}`

### 12.2 Placeholder usage rule

- A placeholder is a **data slot**
- A placeholder must not contain selection logic
- A placeholder must be replaced with actual task/user context
- A placeholder should remain minimal and necessary

### 12.3 Forbidden placeholder patterns

- `{best_example}`
- `{score}`
- `{selected_mode}`
- `{confidence}`
- `{fallback_rule}`
- `{merge_policy}`

---

## 13. Example Entries

---

### ENTRY:EX-001

- title: Standard five-section engineering response
- purpose: Provide the standard structure for general technical questions or single-issue answers
- task_family:
  - `direct_answer`
  - `explanation`
- structure_type:
  - `five_section_engineering`
- typical_use_shape: simple implementation question, configuration check, minor error explanation
- language_profile: Korean explanation + English code terms
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `environment`
    - `known_facts`
    - `uncertainty_boundary`
  - optional:
    - `sample_input`
    - `sample_output`
  - excluded:
    - selection rationale
    - unrelated background
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{task}`
  - `{environment}`
  - `{known_facts}`
  - `{constraints}`
  - `{answer_body}`
  - `{risk_items}`
  - `{verification_steps}`
- verification_pattern:
  - `answer_consistency_check`
  - `unsupported_claim_check`
- risk_profile:
  - `low`
  - `evidence_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - unnecessary long introduction
  - unsupported certainty
  - long Analysis with no Execution
  - missing Verification
- generalization_boundary:
  - high-risk change approval requests
  - complex architecture design
  - multi-step debugging
  - evidence-heavy incident or postmortem work
- artifact_notes:
  - good default structure for standard technical responses
- example_body:
~~~markdown
## Acknowledgment

Responding to `{task}` based on the currently confirmed information.

## Analysis

- Environment: `{environment}`
- Constraints: `{constraints}`
- Confirmed facts: `{known_facts}`
- Uncertainty boundary: `{uncertainty_boundary}`

## Execution

`{answer_body}`

## Impact & Risk

- Expected impact: `{impact_summary}`
- Main risks: `{risk_items}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-002

- title: Defect-isolation debugging response
- purpose: Provide a structure that separates root-cause hypotheses with evidence
- task_family:
  - `diagnostic_analysis`
  - `defect_isolation`
- structure_type:
  - `problem_hypothesis_fix`
  - `evidence_then_action`
- typical_use_shape: log/error-based investigation, debugging with incomplete reproduction
- language_profile: Korean explanation + English error/code terms
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `environment`
    - `known_facts`
    - `error_signal`
    - `uncertainty_boundary`
  - optional:
    - `logs`
    - `stack_trace`
    - `related_code`
    - `recent_changes`
  - excluded:
    - unsupported root cause assertion
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{symptom}`
  - `{environment}`
  - `{observed_error}`
  - `{hypothesis_list}`
  - `{most_likely_cause}`
  - `{fix_plan}`
  - `{risk_items}`
  - `{verification_steps}`
- verification_pattern:
  - `root_cause_fix_alignment_check`
  - `unsupported_claim_check`
- risk_profile:
  - `medium`
  - `evidence_sensitive`
- cost_profile_tags:
  - `high_token`
  - `verification_heavy`
- anti_patterns:
  - single-cause certainty
  - solution without logs
  - missing reproduction conditions
  - no mapping between fix and symptom
- generalization_boundary:
  - actual destructive production action
  - security incident response
  - legally or regulatorily sensitive outages
- artifact_notes:
  - suited for defect isolation with bounded uncertainty
- example_body:
~~~markdown
## Acknowledgment

Analyzing the `{symptom}` issue based on currently available evidence.

## Analysis

- Environment: `{environment}`
- Observed error: `{observed_error}`
- Confirmed facts:
  - `{fact_1}`
  - `{fact_2}`
  - `{fact_3}`
- Hypothesis isolation:
  - Hypothesis A: `{hypothesis_a}`
  - Hypothesis B: `{hypothesis_b}`
  - Hypothesis C: `{hypothesis_c}`
- Current most likely cause: `{most_likely_cause}`

## Execution

- Immediate actions:
  1. `{fix_step_1}`
  2. `{fix_step_2}`
  3. `{fix_step_3}`
- Additional evidence still needed:
  - `{evidence_gap_1}`
  - `{evidence_gap_2}`

## Impact & Risk

- Risks of applying the wrong fix:
  - `{risk_1}`
  - `{risk_2}`
- Impact scope:
  - `{impact_scope}`

## Verification

- Validate by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
- Expected result: `{expected_result}`
~~~

---

### ENTRY:EX-003

- title: Design review and trade-off memo
- purpose: Provide a structure for comparing options and recommending a design
- task_family:
  - `design_review`
  - `comparison`
  - `decision_memo`
- structure_type:
  - `compare_then_recommend`
  - `decision_then_rationale`
- typical_use_shape: architecture choice, library choice, pattern comparison, operational design judgment
- language_profile: Korean explanation + English technical nouns
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `environment`
    - `known_facts`
    - `risk_tolerance`
    - `uncertainty_boundary`
  - optional:
    - `existing_design`
    - `deadline`
    - `stakeholder`
  - excluded:
    - absolute “one true answer” language
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{decision_topic}`
  - `{options}`
  - `{comparison_axes}`
  - `{recommended_option}`
  - `{rationale}`
  - `{tradeoffs}`
  - `{verification_steps}`
- verification_pattern:
  - `design_tradeoff_check`
  - `document_internal_consistency_check`
- risk_profile:
  - `medium`
  - `approval_sensitive`
- cost_profile_tags:
  - `high_token`
  - `planning_heavy`
  - `comparison_heavy`
- anti_patterns:
  - recommendation without trade-offs
  - ignoring constraints
  - missing operational view
  - missing migration cost
- generalization_boundary:
  - final organizational policy decision
  - execution without approval
- artifact_notes:
  - suited for choice-heavy design memos
- example_body:
~~~markdown
## Acknowledgment

Reviewing `{decision_topic}` from a design perspective under the current constraints.

## Analysis

- Goal: `{goal}`
- Constraints:
  - `{constraint_1}`
  - `{constraint_2}`
  - `{constraint_3}`
- Options:
  - `{option_a}`
  - `{option_b}`
  - `{option_c}`
- Comparison axes:
  - `{axis_1}`
  - `{axis_2}`
  - `{axis_3}`
  - `{axis_4}`

## Execution

- Recommended option: `{recommended_option}`
- Rationale:
  - `{rationale_1}`
  - `{rationale_2}`
  - `{rationale_3}`
- Reasons not to choose the others:
  - `{rejected_reason_1}`
  - `{rejected_reason_2}`

## Impact & Risk

- Advantages:
  - `{benefit_1}`
  - `{benefit_2}`
- Trade-offs:
  - `{tradeoff_1}`
  - `{tradeoff_2}`
- Remaining risks:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Confirm before adoption:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-004

- title: Implementation plan response
- purpose: Provide a structure for step decomposition before implementation
- task_family:
  - `implementation_plan`
  - `change_plan`
- structure_type:
  - `plan_then_steps`
  - `report_style`
- typical_use_shape: feature addition, refactoring, pipeline setup, migration preparation
- language_profile: Korean explanation + English identifiers
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `environment`
    - `known_facts`
    - `approval_boundary`
  - optional:
    - `existing_design`
    - `deadline`
    - `stakeholder`
  - excluded:
    - wording that implies the change is already applied
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{goal}`
  - `{current_state}`
  - `{target_state}`
  - `{work_breakdown}`
  - `{dependencies}`
  - `{risk_items}`
  - `{verification_steps}`
- verification_pattern:
  - `plan_completeness_check`
  - `risk_mitigation_check`
- risk_profile:
  - `medium`
  - `approval_sensitive`
- cost_profile_tags:
  - `high_token`
  - `planning_heavy`
- anti_patterns:
  - no step ordering
  - missing dependencies
  - missing rollback consideration
  - plan without verification
- generalization_boundary:
  - actual deployment execution
  - unapproved data changes
- artifact_notes:
  - suited for implementation planning before execution
- example_body:
~~~markdown
## Acknowledgment

Structuring an implementation plan for `{goal}`.

## Analysis

- Current state: `{current_state}`
- Target state: `{target_state}`
- Constraints:
  - `{constraint_1}`
  - `{constraint_2}`
- Prerequisite dependencies:
  - `{dependency_1}`
  - `{dependency_2}`

## Execution

- Work breakdown:
  1. `{phase_1}`
  2. `{phase_2}`
  3. `{phase_3}`
  4. `{phase_4}`
- Expected artifacts:
  - `{artifact_1}`
  - `{artifact_2}`
  - `{artifact_3}`

## Impact & Risk

- Expected impact:
  - `{impact_1}`
  - `{impact_2}`
- Main risks:
  - `{risk_1}`
  - `{risk_2}`
  - `{risk_3}`
- Mitigation direction:
  - `{mitigation_1}`
  - `{mitigation_2}`

## Verification

- Completion criteria:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
- Rollback consideration:
  - `{rollback_note}`
~~~

---

### ENTRY:EX-005

- title: Diff-first change request response
- purpose: Provide a structure that prefers partial context plus focused changes instead of full rewrite
- task_family:
  - `diff_request`
  - `change_plan`
- structure_type:
  - `diff_focused_style`
- typical_use_shape: partial code/document edits, minimal change proposals, patch reasoning
- language_profile: Korean explanation + English diff/code identifiers
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `known_facts`
    - `current_state`
    - `target_state`
  - optional:
    - `related_code`
    - `sample_input`
    - `sample_output`
  - excluded:
    - forcing a full rewrite
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{change_goal}`
  - `{as_is}`
  - `{to_be}`
  - `{minimal_diff}`
  - `{risk_items}`
  - `{verification_steps}`
- verification_pattern:
  - `answer_consistency_check`
  - `test_coverage_check`
  - `diff_scope_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - full-file rewrite
  - unnecessary scope expansion
  - missing side-effect explanation
- generalization_boundary:
  - cases that require full structural redesign
- artifact_notes:
  - preferred example family for bounded coding and document patch work
- example_body:
~~~markdown
## Acknowledgment

Summarizing `{change_goal}` from a minimal-change perspective.

## Analysis

- AS-IS: `{as_is}`
- TO-BE: `{to_be}`
- Constraints to preserve:
  - `{constraint_1}`
  - `{constraint_2}`

## Execution

- Minimal changes:
  - `{diff_item_1}`
  - `{diff_item_2}`
  - `{diff_item_3}`
- Why these changes:
  - `{reason_1}`
  - `{reason_2}`

## Impact & Risk

- Impact scope: `{impact_scope}`
- Watch points:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-006

- title: Evidence-centered search/retrieval summary
- purpose: Provide a structure that separates summary and findings for source-grounded questions
- task_family:
  - `retrieval_summary`
  - `research_synthesis`
- structure_type:
  - `summary_then_findings`
  - `evidence_then_action`
- typical_use_shape: document summary, report extraction, search result synthesis
- language_profile: Korean summary + English source terms when needed
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `known_facts`
    - `constraints`
    - `uncertainty_boundary`
  - optional:
    - `source_list`
    - `deadline`
  - excluded:
    - unsupported background knowledge injection
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{question}`
  - `{source_scope}`
  - `{key_findings}`
  - `{open_points}`
  - `{next_actions}`
- verification_pattern:
  - `evidence_alignment_check`
  - `unsupported_claim_check`
- risk_profile:
  - `evidence_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `verification_heavy`
- anti_patterns:
  - missing source scope
  - summary unrelated to the actual question
  - conclusions not aligned with evidence
- generalization_boundary:
  - externally time-sensitive facts
  - approval-requiring decisions
- artifact_notes:
  - preferred for retrieval-grounded synthesis and evidence-centered summaries
- example_body:
~~~markdown
## Acknowledgment

Summarizing `{question}` within the currently available source scope.

## Analysis

- Source scope: `{source_scope}`
- Confirmed facts:
  - `{fact_1}`
  - `{fact_2}`
  - `{fact_3}`
- Uncertainty:
  - `{uncertainty_1}`

## Execution

- Summary:
  - `{summary_1}`
  - `{summary_2}`
- Major findings:
  1. `{finding_1}`
  2. `{finding_2}`
  3. `{finding_3}`

## Impact & Risk

- Interpretation cautions:
  - `{risk_1}`
  - `{risk_2}`
- Remaining open points:
  - `{open_point_1}`
  - `{open_point_2}`

## Verification

- Further confirmation needed:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-007

- title: SQL change review memo
- purpose: Provide a structure for explaining SQL changes, impact scope, and verification points
- task_family:
  - `sql_change`
  - `risk_review`
- structure_type:
  - `risk_then_mitigation`
  - `diff_focused_style`
- typical_use_shape: UPDATE/DELETE/UPSERT/DDL review, batch query change explanation
- language_profile: Korean explanation + English SQL terms
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `environment`
    - `schema`
    - `known_facts`
    - `approval_boundary`
  - optional:
    - `sample_input`
    - `sample_output`
    - `existing_query`
  - excluded:
    - unverified execution claims
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{change_goal}`
  - `{table_scope}`
  - `{query_intent}`
  - `{safety_points}`
  - `{verification_steps}`
- verification_pattern:
  - `sql_safety_check`
  - `risk_mitigation_check`
- risk_profile:
  - `high`
  - `approval_sensitive`
  - `destructive_change_sensitive`
- cost_profile_tags:
  - `high_token`
  - `verification_heavy`
- anti_patterns:
  - missing WHERE-scope explanation
  - missing backup/rollback consideration
  - missing read-before-write validation
  - missing destructive-impact explanation
- generalization_boundary:
  - direct production DB execution instruction
  - destructive write without approval
- artifact_notes:
  - suited for high-risk SQL review and approval-sensitive change explanation
- example_body:
~~~markdown
## Acknowledgment

Reviewing the SQL change for `{change_goal}`.

## Analysis

- Target scope: `{table_scope}`
- Query intent: `{query_intent}`
- Confirmed constraints:
  - `{constraint_1}`
  - `{constraint_2}`
- Safety watch points:
  - `{safety_point_1}`
  - `{safety_point_2}`
  - `{safety_point_3}`

## Execution

- Change summary:
  - `{change_item_1}`
  - `{change_item_2}`
- Pre-execution checks:
  1. `{precheck_1}`
  2. `{precheck_2}`
- Execution order:
  1. `{step_1}`
  2. `{step_2}`
  3. `{step_3}`

## Impact & Risk

- Possible impact scope:
  - `{impact_scope}`
- Main risks:
  - `{risk_1}`
  - `{risk_2}`
- Mitigation:
  - `{mitigation_1}`
  - `{mitigation_2}`

## Verification

- Validate by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
- Rollback consideration:
  - `{rollback_note}`
~~~

---

### ENTRY:EX-008

- title: API integration review/implementation guide
- purpose: Provide a structure for API contract, I/O shape, error paths, and validation points
- task_family:
  - `api_integration`
  - `implementation_plan`
- structure_type:
  - `contract_style`
  - `plan_then_steps`
- typical_use_shape: external API integration, internal service interface design, endpoint wiring
- language_profile: Korean explanation + English API field/code terms
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `environment`
    - `api_spec`
    - `known_facts`
  - optional:
    - `sample_input`
    - `sample_output`
    - `existing_design`
  - excluded:
    - unsupported field assumptions
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{api_name}`
  - `{goal}`
  - `{request_contract}`
  - `{response_contract}`
  - `{error_cases}`
  - `{verification_steps}`
- verification_pattern:
  - `api_contract_check`
  - `test_coverage_check`
- risk_profile:
  - `medium`
  - `evidence_sensitive`
- cost_profile_tags:
  - `high_token`
  - `planning_heavy`
- anti_patterns:
  - missing request/response boundary
  - missing auth/error handling
  - missing retry/idempotency consideration
- generalization_boundary:
  - actual secret usage
  - unapproved production invocation
- artifact_notes:
  - suited for contract-aware API implementation or review
- example_body:
~~~markdown
## Acknowledgment

Summarizing the `{api_name}` integration for `{goal}`.

## Analysis

- Purpose: `{goal}`
- Environment: `{environment}`
- Confirmed facts from spec:
  - `{fact_1}`
  - `{fact_2}`
- Input contract:
  - `{request_contract}`
- Output contract:
  - `{response_contract}`

## Execution

- Implementation order:
  1. `{step_1}`
  2. `{step_2}`
  3. `{step_3}`
- Error paths:
  - `{error_case_1}`
  - `{error_case_2}`
- Considerations:
  - `{consideration_1}`
  - `{consideration_2}`

## Impact & Risk

- Failure impact:
  - `{impact_1}`
- Main risks:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Validate by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-009

- title: Incident summary and cause/prevention memo
- purpose: Provide a structure for timeline, cause, mitigation, and prevention reporting
- task_family:
  - `incident_summary`
  - `postmortem`
  - `root_cause_report`
- structure_type:
  - `timeline_then_cause`
  - `risk_then_mitigation`
- typical_use_shape: outage reporting, batch failure, service interruption, abnormal data event
- language_profile: Korean explanation + English system/component names
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `environment`
    - `known_facts`
    - `error_signal`
    - `uncertainty_boundary`
  - optional:
    - `logs`
    - `timeline`
    - `recent_changes`
    - `stakeholder`
  - excluded:
    - blame assignment
    - unsupported cause certainty
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{incident_name}`
  - `{timeline_items}`
  - `{suspected_cause}`
  - `{mitigations}`
  - `{prevention_items}`
- verification_pattern:
  - `evidence_alignment_check`
  - `root_cause_fix_alignment_check`
- risk_profile:
  - `high`
  - `evidence_sensitive`
- cost_profile_tags:
  - `high_token`
  - `verification_heavy`
- anti_patterns:
  - blame-centered narrative
  - missing timeline
  - confusing temporary mitigation with permanent fix
- generalization_boundary:
  - final legal or regulatory report
- artifact_notes:
  - suited for evidence-bound incident summaries and prevention memos
- example_body:
~~~markdown
## Acknowledgment

Summarizing `{incident_name}` based on the currently confirmed evidence.

## Analysis

- Time window:
  - `{timeline_item_1}`
  - `{timeline_item_2}`
  - `{timeline_item_3}`
- Observed symptoms:
  - `{symptom_1}`
  - `{symptom_2}`
- Current most likely cause: `{suspected_cause}`
- Uncertainty:
  - `{uncertainty_1}`

## Execution

- Immediate response:
  1. `{mitigation_1}`
  2. `{mitigation_2}`
- Permanent fix direction:
  1. `{permanent_fix_1}`
  2. `{permanent_fix_2}`

## Impact & Risk

- Impact scope:
  - `{impact_scope}`
- Recurrence risks:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Confirm recurrence prevention by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-010

- title: Summary-to-findings document/report structure
- purpose: Provide a stable document structure for plans, reviews, and explanatory artifacts
- task_family:
  - `documentation_write`
  - `proposal_write`
  - `decision_memo`
- structure_type:
  - `report_style`
  - `summary_then_findings`
- typical_use_shape: technical documentation, proposal draft, review report, summary memo
- language_profile: Korean prose + English terms only when necessary
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `known_facts`
    - `stakeholder`
  - optional:
    - `deadline`
    - `existing_design`
    - `approval_boundary`
  - excluded:
    - excessive technical detail unrelated to document purpose
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{document_goal}`
  - `{audience}`
  - `{key_points}`
  - `{decision_items}`
  - `{risk_items}`
  - `{verification_steps}`
- verification_pattern:
  - `document_internal_consistency_check`
  - `unsupported_claim_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `high_token`
- anti_patterns:
  - undefined target reader
  - unclear key message
  - background-only writing with no actionable section
- generalization_boundary:
  - legal commitment document
  - external formal announcement
- artifact_notes:
  - suited for general technical documents and review memos
- example_body:
~~~markdown
## Acknowledgment

Structuring the `{document_goal}` document for `{audience}`.

## Analysis

- Document purpose: `{document_goal}`
- Audience: `{audience}`
- Premises:
  - `{fact_1}`
  - `{fact_2}`
- Constraints:
  - `{constraint_1}`
  - `{constraint_2}`

## Execution

- Key content:
  1. `{key_point_1}`
  2. `{key_point_2}`
  3. `{key_point_3}`
- Decisions / recommendations:
  - `{decision_item_1}`
  - `{decision_item_2}`

## Impact & Risk

- Expected value:
  - `{impact_1}`
  - `{impact_2}`
- Risks:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Review by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-011

- title: Grounded report with evidence-aligned findings
- purpose: Provide a structure for grounded report artifacts where summary and findings must stay tied to explicit evidence scope
- task_family:
  - `research_synthesis`
  - `retrieval_summary`
  - `documentation_write`
- structure_type:
  - `summary_then_findings`
  - `evidence_then_action`
- typical_use_shape: grounded technical report, evidence-linked synthesis, internal research memo
- language_profile: Korean explanation + English source or system terms when needed
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `known_facts`
    - `uncertainty_boundary`
  - optional:
    - `source_list`
    - `deadline`
    - `stakeholder`
  - excluded:
    - unsupported extrapolation beyond source scope
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{report_goal}`
  - `{source_scope}`
  - `{summary_items}`
  - `{findings}`
  - `{open_points}`
  - `{verification_steps}`
- verification_pattern:
  - `evidence_alignment_check`
  - `document_internal_consistency_check`
- risk_profile:
  - `evidence_sensitive`
- cost_profile_tags:
  - `high_token`
  - `verification_heavy`
- anti_patterns:
  - findings detached from evidence scope
  - conclusions stronger than evidence coverage
  - missing unresolved open points
- generalization_boundary:
  - externally current facts without freshness validation
  - policy or approval claims not grounded in source material
- artifact_notes:
  - preferred for grounded synthesis where evidence scope must remain visible
- example_body:
~~~markdown
## Acknowledgment

Preparing a grounded report for `{report_goal}` using the currently available evidence scope.

## Analysis

- Source scope: `{source_scope}`
- Confirmed facts:
  - `{fact_1}`
  - `{fact_2}`
  - `{fact_3}`
- Known uncertainty:
  - `{uncertainty_1}`
  - `{uncertainty_2}`

## Execution

- Summary:
  - `{summary_item_1}`
  - `{summary_item_2}`
- Main findings:
  1. `{finding_1}`
  2. `{finding_2}`
  3. `{finding_3}`

## Impact & Risk

- Interpretation cautions:
  - `{risk_1}`
  - `{risk_2}`
- Open points:
  - `{open_point_1}`
  - `{open_point_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-012

- title: Evaluation scorecard artifact
- purpose: Provide a structure for evaluation summaries, metric grouping, and pass/fail reporting
- task_family:
  - `evaluation_scorecard`
  - `risk_review`
  - `decision_memo`
- structure_type:
  - `scorecard_style`
  - `decision_then_rationale`
- typical_use_shape: offline eval summary, benchmark review, system comparison, quality memo
- language_profile: Korean explanation + English metric names and schema terms
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `known_facts`
    - `constraints`
    - `metric_summary`
  - optional:
    - `baseline_version`
    - `candidate_version`
    - `stakeholder`
    - `risk_tolerance`
  - excluded:
    - metric-free judgment language
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{evaluation_goal}`
  - `{baseline_version}`
  - `{candidate_version}`
  - `{metric_summary}`
  - `{pass_fail_items}`
  - `{recommendation}`
  - `{verification_steps}`
- verification_pattern:
  - `scorecard_threshold_check`
  - `document_internal_consistency_check`
- risk_profile:
  - `medium`
  - `release_sensitive`
- cost_profile_tags:
  - `high_token`
  - `evaluation_heavy`
- anti_patterns:
  - unsupported judgment with no metric grouping
  - missing pass/fail thresholds
  - confusing qualitative note with measurable outcome
- generalization_boundary:
  - final release gate without actual evaluation data
- artifact_notes:
  - preferred for evaluation overlays and benchmarking summaries
- example_body:
~~~markdown
## Acknowledgment

Summarizing the evaluation results for `{evaluation_goal}`.

## Analysis

- Baseline: `{baseline_version}`
- Candidate: `{candidate_version}`
- Metric summary:
  - `{metric_item_1}`
  - `{metric_item_2}`
  - `{metric_item_3}`

## Execution

- Pass / fail summary:
  - `{pass_fail_item_1}`
  - `{pass_fail_item_2}`
- Recommendation:
  - `{recommendation}`

## Impact & Risk

- Improvement areas:
  - `{risk_1}`
  - `{risk_2}`
- Decision sensitivity:
  - `{impact_note}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-013

- title: Prompt-stack release review
- purpose: Provide a structure for prompt-version regression review, semantic drift notes, and release gating
- task_family:
  - `release_review`
  - `prompt_stack_review`
  - `decision_memo`
- structure_type:
  - `release_gate_style`
  - `scorecard_style`
- typical_use_shape: prompt stack comparison, rewrite acceptance review, semantic drift audit summary
- language_profile: Korean explanation + English prompt/variant names and metric identifiers
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `baseline_version`
    - `candidate_version`
    - `metric_summary`
    - `known_facts`
  - optional:
    - `constraints`
    - `stakeholder`
    - `risk_tolerance`
  - excluded:
    - style-only approval without semantic comparison
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{baseline_version}`
  - `{candidate_version}`
  - `{semantic_drift_items}`
  - `{coverage_items}`
  - `{variant_consistency_items}`
  - `{release_decision}`
  - `{verification_steps}`
- verification_pattern:
  - `version_regression_check`
  - `release_gate_check`
- risk_profile:
  - `high`
  - `release_sensitive`
- cost_profile_tags:
  - `high_token`
  - `evaluation_heavy`
  - `verification_heavy`
- anti_patterns:
  - approving rewrite by prose quality alone
  - missing semantic drift check
  - missing variant consistency check
  - missing coverage regression notes
- generalization_boundary:
  - actual production release decision without real regression evidence
- artifact_notes:
  - preferred for prompt-stack release engineering and rewrite audits
- example_body:
~~~markdown
## Acknowledgment

Reviewing `{candidate_version}` against `{baseline_version}` for prompt-stack release readiness.

## Analysis

- Baseline: `{baseline_version}`
- Candidate: `{candidate_version}`
- Semantic drift notes:
  - `{semantic_drift_item_1}`
  - `{semantic_drift_item_2}`
- Coverage notes:
  - `{coverage_item_1}`
  - `{coverage_item_2}`
- Variant consistency notes:
  - `{variant_item_1}`
  - `{variant_item_2}`

## Execution

- Release decision:
  - `{release_decision}`
- Decision rationale:
  - `{rationale_1}`
  - `{rationale_2}`

## Impact & Risk

- Main risks:
  - `{risk_1}`
  - `{risk_2}`
- Remaining blockers:
  - `{blocker_1}`
  - `{blocker_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-014

- title: Advanced prompting family map note
- purpose: Provide a compact structure for organizing advanced prompting families without turning the artifact into execution policy
- task_family:
  - `advanced_prompting_note`
  - `documentation_write`
- structure_type:
  - `family_map_style`
  - `report_style`
- typical_use_shape: prompting guideline note, technique family summary, boundary canon summary
- language_profile: Korean explanation + English technique family names
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `known_facts`
    - `uncertainty_boundary`
  - optional:
    - `artifact_type`
    - `stakeholder`
  - excluded:
    - runtime activation decisions
    - selection/scoring logic
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{topic}`
  - `{family_list}`
  - `{boundary_rules}`
  - `{owner_mapping}`
  - `{verification_steps}`
- verification_pattern:
  - `document_internal_consistency_check`
  - `unsupported_claim_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `medium_token`
- anti_patterns:
  - turning family map into runtime control
  - mixing owner boundary with activation logic
  - over-expanding into policy dump
- generalization_boundary:
  - direct runtime reasoning policy
  - tool/retrieval/memory execution doctrine
- artifact_notes:
  - useful for Appendix A family structuring and prompt-technique canon notes
- example_body:
~~~markdown
## Acknowledgment

Organizing `{topic}` into bounded advanced prompting families.

## Analysis

- Goal: `{goal}`
- Constraints:
  - `{constraint_1}`
  - `{constraint_2}`
- Scope boundary:
  - `{scope_boundary}`

## Execution

- Technique families:
  - `{family_1}`
  - `{family_2}`
  - `{family_3}`
  - `{family_4}`
- Boundary rules:
  - `{boundary_rule_1}`
  - `{boundary_rule_2}`
- Owner mapping:
  - `{owner_mapping_1}`
  - `{owner_mapping_2}`

## Impact & Risk

- Benefits:
  - `{benefit_1}`
  - `{benefit_2}`
- Risks if misused:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-015

- title: Multimodal evidence-bound analysis
- purpose: Provide a structure for image/document-aware analysis where modality scope and evidence limits must remain visible
- task_family:
  - `multimodal_analysis`
  - `research_synthesis`
- structure_type:
  - `modality_then_evidence`
  - `summary_then_findings`
- typical_use_shape: image + text interpretation, document screenshot analysis, visual evidence memo
- language_profile: Korean explanation + English file/type/source terms when needed
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `image_context`
    - `known_facts`
    - `uncertainty_boundary`
  - optional:
    - `document_context`
    - `source_scope`
    - `constraints`
  - excluded:
    - OCR-quality assumptions stated as facts
    - hidden visual inference beyond visible evidence
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{artifact_scope}`
  - `{visible_elements}`
  - `{textual_elements}`
  - `{findings}`
  - `{uncertainty_items}`
  - `{verification_steps}`
- verification_pattern:
  - `modality_scope_check`
  - `evidence_alignment_check`
- risk_profile:
  - `evidence_sensitive`
  - `multimodal_sensitive`
- cost_profile_tags:
  - `high_token`
  - `multimodal_heavy`
- anti_patterns:
  - invisible detail hallucination
  - mixing visual uncertainty with certainty claims
  - treating partial visual evidence as complete document truth
- generalization_boundary:
  - authoritative OCR extraction contract
  - legal/medical image interpretation beyond visible support
- artifact_notes:
  - suited for multimodal evidence-limited interpretation
- example_body:
~~~markdown
## Acknowledgment

Analyzing `{artifact_scope}` based on the currently visible multimodal evidence.

## Analysis

- Visible elements:
  - `{visible_element_1}`
  - `{visible_element_2}`
- Textual elements:
  - `{textual_element_1}`
  - `{textual_element_2}`
- Evidence boundary:
  - `{uncertainty_item_1}`
  - `{uncertainty_item_2}`

## Execution

- Main findings:
  1. `{finding_1}`
  2. `{finding_2}`
  3. `{finding_3}`

## Impact & Risk

- Interpretation cautions:
  - `{risk_1}`
  - `{risk_2}`
- Missing visibility:
  - `{missing_visibility_1}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-016

- title: Multimodal extraction constraint memo
- purpose: Provide a structure for extraction-focused multimodal tasks where missing visibility and field confidence must remain explicit
- task_family:
  - `multimodal_extraction`
  - `documentation_write`
- structure_type:
  - `contract_style`
  - `modality_then_evidence`
- typical_use_shape: screenshot field extraction memo, scanned artifact extraction summary, image-to-structured-note
- language_profile: Korean explanation + English field names and schema keys
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `image_context`
    - `schema`
    - `uncertainty_boundary`
  - optional:
    - `document_context`
    - `known_facts`
  - excluded:
    - inferred hidden fields
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{target_fields}`
  - `{observed_values}`
  - `{uncertain_fields}`
  - `{missing_fields}`
  - `{verification_steps}`
- verification_pattern:
  - `modality_scope_check`
  - `artifact_integrity_check`
- risk_profile:
  - `multimodal_sensitive`
  - `evidence_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `multimodal_heavy`
- anti_patterns:
  - forced completion of hidden fields
  - schema-looking output with invented values
- generalization_boundary:
  - machine-consumable final extraction contract for high-stakes workflows
- artifact_notes:
  - useful for visual extraction summaries before downstream structured conversion
- example_body:
~~~markdown
## Acknowledgment

Summarizing multimodal extraction for the requested fields.

## Analysis

- Target fields:
  - `{field_1}`
  - `{field_2}`
  - `{field_3}`
- Visibility scope:
  - `{visibility_scope}`
- Missing visibility:
  - `{missing_field_1}`
  - `{missing_field_2}`

## Execution

- Observed values:
  - `{observed_value_1}`
  - `{observed_value_2}`
- Uncertain fields:
  - `{uncertain_field_1}`
  - `{uncertain_field_2}`

## Impact & Risk

- Extraction cautions:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-017

- title: Judge-style comparative review memo
- purpose: Provide a structure for comparing two or more outputs/artifacts under explicit axes without turning the memo into judge authority
- task_family:
  - `judge_comparison`
  - `comparison`
  - `decision_memo`
- structure_type:
  - `compare_then_judge`
  - `decision_then_rationale`
- typical_use_shape: output A vs B review, candidate comparison, rubric-guided comparative judgment memo
- language_profile: Korean explanation + English candidate labels and axis names
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `judge_axes`
    - `known_facts`
    - `constraints`
  - optional:
    - `rubric`
    - `baseline_version`
    - `candidate_version`
  - excluded:
    - hidden weighting
    - unanchored subjective preference
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{candidate_a}`
  - `{candidate_b}`
  - `{judge_axis_1}`
  - `{judge_axis_2}`
  - `{comparison_findings}`
  - `{recommendation}`
  - `{verification_steps}`
- verification_pattern:
  - `judge_axis_check`
  - `document_internal_consistency_check`
- risk_profile:
  - `judge_sensitive`
  - `release_sensitive`
- cost_profile_tags:
  - `high_token`
  - `comparison_heavy`
  - `evaluation_heavy`
- anti_patterns:
  - style preference masquerading as judgment
  - missing decision axes
  - recommendation without comparison rationale
- generalization_boundary:
  - formal high-stakes release decision without actual eval evidence
- artifact_notes:
  - useful for richer comparison / judge structures
- example_body:
~~~markdown
## Acknowledgment

Comparing `{candidate_a}` and `{candidate_b}` under explicit judgment axes.

## Analysis

- Judgment axes:
  - `{judge_axis_1}`
  - `{judge_axis_2}`
  - `{judge_axis_3}`
- Known constraints:
  - `{constraint_1}`
  - `{constraint_2}`

## Execution

- Comparative findings:
  1. `{finding_1}`
  2. `{finding_2}`
  3. `{finding_3}`
- Recommendation:
  - `{recommendation}`

## Impact & Risk

- Main decision cautions:
  - `{risk_1}`
  - `{risk_2}`
- Residual uncertainty:
  - `{uncertainty_1}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-018

- title: Rubric evaluation memo
- purpose: Provide a structure for rubric-based scoring summaries with criteria, anchors, and decision notes
- task_family:
  - `rubric_evaluation`
  - `evaluation_scorecard`
- structure_type:
  - `rubric_then_score`
  - `scorecard_style`
- typical_use_shape: rubric-based review, qualitative score memo, artifact evaluation summary
- language_profile: Korean explanation + English rubric labels and score identifiers
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `rubric`
    - `known_facts`
  - optional:
    - `metric_summary`
    - `stakeholder`
    - `artifact_type`
  - excluded:
    - score without anchor
    - anchor without criteria
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{artifact_name}`
  - `{criteria}`
  - `{score_items}`
  - `{critical_failures}`
  - `{recommendation}`
  - `{verification_steps}`
- verification_pattern:
  - `rubric_alignment_check`
  - `scorecard_threshold_check`
- risk_profile:
  - `judge_sensitive`
  - `release_sensitive`
- cost_profile_tags:
  - `high_token`
  - `evaluation_heavy`
- anti_patterns:
  - criteria-free scoring
  - hidden weighting
  - no critical failure override
- generalization_boundary:
  - final release or policy decision without adequate evidence
- artifact_notes:
  - suited for richer evaluation artifacts beyond plain metric scorecards
- example_body:
~~~markdown
## Acknowledgment

Evaluating `{artifact_name}` using the agreed rubric.

## Analysis

- Criteria:
  - `{criterion_1}`
  - `{criterion_2}`
  - `{criterion_3}`
- Score anchors:
  - `{anchor_note_1}`
  - `{anchor_note_2}`

## Execution

- Score summary:
  - `{score_item_1}`
  - `{score_item_2}`
  - `{score_item_3}`
- Critical failures:
  - `{critical_failure_1}`
  - `{critical_failure_2}`
- Recommendation:
  - `{recommendation}`

## Impact & Risk

- Evaluation cautions:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-019

- title: Artifact review memo
- purpose: Provide a structure for reviewing a deliverable/artifact for integrity, fit, and downstream usability
- task_family:
  - `artifact_review`
  - `documentation_write`
  - `risk_review`
- structure_type:
  - `artifact_review_style`
  - `report_style`
- typical_use_shape: prompt doc review, schema review, handoff artifact review, internal deliverable review
- language_profile: Korean explanation + English artifact/schema identifiers
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `artifact_type`
    - `known_facts`
    - `constraints`
  - optional:
    - `schema`
    - `stakeholder`
    - `approval_boundary`
  - excluded:
    - silent artifact approval
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{artifact_name}`
  - `{fit_items}`
  - `{integrity_findings}`
  - `{downstream_risks}`
  - `{recommendation}`
  - `{verification_steps}`
- verification_pattern:
  - `artifact_integrity_check`
  - `document_internal_consistency_check`
- risk_profile:
  - `medium`
  - `release_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `evaluation_heavy`
- anti_patterns:
  - artifact approval with no downstream fit note
  - missing integrity / completeness distinction
- generalization_boundary:
  - formal release decision without broader evaluation surface
- artifact_notes:
  - useful for handoff objects, prompt docs, schemas, and reviewable internal artifacts
- example_body:
~~~markdown
## Acknowledgment

Reviewing `{artifact_name}` for integrity and downstream usability.

## Analysis

- Artifact type: `{artifact_type}`
- Intended use:
  - `{use_case_1}`
  - `{use_case_2}`
- Fit findings:
  - `{fit_item_1}`
  - `{fit_item_2}`

## Execution

- Integrity findings:
  1. `{finding_1}`
  2. `{finding_2}`
  3. `{finding_3}`
- Recommendation:
  - `{recommendation}`

## Impact & Risk

- Downstream risks:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-020

- title: Benchmark comparison memo
- purpose: Provide a structure for broader benchmark comparisons across systems, variants, or model/prompt combinations
- task_family:
  - `benchmark_memo`
  - `evaluation_scorecard`
  - `comparison`
- structure_type:
  - `compare_then_judge`
  - `scorecard_style`
- typical_use_shape: benchmark summary, system comparison, pre-release comparative memo
- language_profile: Korean explanation + English benchmark labels and metric identifiers
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `metric_summary`
    - `known_facts`
    - `constraints`
  - optional:
    - `baseline_version`
    - `candidate_version`
    - `judge_axes`
  - excluded:
    - unsupported leaderboard-style certainty
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{comparison_scope}`
  - `{systems}`
  - `{metric_summary}`
  - `{relative_findings}`
  - `{recommendation}`
  - `{verification_steps}`
- verification_pattern:
  - `scorecard_threshold_check`
  - `judge_axis_check`
- risk_profile:
  - `release_sensitive`
  - `judge_sensitive`
- cost_profile_tags:
  - `high_token`
  - `evaluation_heavy`
  - `comparison_heavy`
- anti_patterns:
  - benchmark result with no scope note
  - apples-to-oranges comparison
  - recommendation without trade-off interpretation
- generalization_boundary:
  - final procurement or release decision without wider context
- artifact_notes:
  - useful for broader comparison / judge artifacts across versions or systems
- example_body:
~~~markdown
## Acknowledgment

Summarizing the benchmark comparison for `{comparison_scope}`.

## Analysis

- Compared systems:
  - `{system_1}`
  - `{system_2}`
  - `{system_3}`
- Key metrics:
  - `{metric_1}`
  - `{metric_2}`
  - `{metric_3}`
- Scope limits:
  - `{scope_limit_1}`

## Execution

- Relative findings:
  1. `{finding_1}`
  2. `{finding_2}`
  3. `{finding_3}`
- Recommendation:
  - `{recommendation}`

## Impact & Risk

- Interpretation cautions:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-021

- title: Prompt chaining stage memo
- purpose: Provide a chain-shaped artifact for staged tasks where intermediate outputs must be explicit and machine-usable
- task_family:
  - `prompt_chaining_note`
  - `workflow_decomposition`
  - `documentation_write`
- structure_type:
  - `chain_stage_style`
  - `workflow_map_style`
- typical_use_shape: extraction -> normalize -> synthesize workflows, staged prompt pipelines, multi-step agent chains
- language_profile: Korean explanation + English stage/field names
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `known_facts`
    - `active_slice`
  - optional:
    - `schema`
    - `sample_input`
    - `sample_output`
  - excluded:
    - runtime controller logic
    - chain selection policy
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{workflow_goal}`
  - `{stage_1}`
  - `{stage_2}`
  - `{stage_3}`
  - `{handoff_contracts}`
  - `{verification_steps}`
- verification_pattern:
  - `chain_handoff_check`
  - `context_pack_integrity_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `high_token`
  - `workflow_heavy`
  - `planning_heavy`
- anti_patterns:
  - decorative stage splitting
  - no handoff schema
  - unverified stage output reused downstream
- generalization_boundary:
  - runtime chain orchestration logic
  - autonomous planner ownership
- artifact_notes:
  - useful for making chained workflows legible without owning chaining behavior
- example_body:
~~~markdown
## Acknowledgment

Structuring the staged workflow for `{workflow_goal}`.

## Analysis

- Goal: `{workflow_goal}`
- Inputs available now:
  - `{input_1}`
  - `{input_2}`
- Constraints:
  - `{constraint_1}`
  - `{constraint_2}`

## Execution

- Stage map:
  1. `{stage_1}`
  2. `{stage_2}`
  3. `{stage_3}`
- Handoff contracts:
  - Stage 1 -> 2: `{handoff_1}`
  - Stage 2 -> 3: `{handoff_2}`

## Impact & Risk

- Chain risks:
  - `{risk_1}`
  - `{risk_2}`
- Failure propagation cautions:
  - `{caution_1}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-022

- title: Routing decision memo
- purpose: Provide a route-selection artifact for cases where different execution paths must be compared and one selected
- task_family:
  - `routing_decision_note`
  - `decision_memo`
  - `comparison`
- structure_type:
  - `route_then_branch`
  - `decision_then_rationale`
- typical_use_shape: direct solve vs retrieval vs tool vs propose-only path selection note
- language_profile: Korean explanation + English route labels and path names
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `known_facts`
    - `route_options`
  - optional:
    - `risk_tolerance`
    - `approval_boundary`
    - `active_slice`
  - excluded:
    - router policy
    - confidence scoring logic
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{route_topic}`
  - `{route_option_1}`
  - `{route_option_2}`
  - `{route_option_3}`
  - `{selected_route}`
  - `{verification_steps}`
- verification_pattern:
  - `route_fit_check`
  - `document_internal_consistency_check`
- risk_profile:
  - `medium`
  - `workflow_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `comparison_heavy`
- anti_patterns:
  - picking route with no rationale
  - route inflation
  - heavy path selected without need
- generalization_boundary:
  - actual runtime router ownership
  - branch policy logic
- artifact_notes:
  - useful for route-comparison artifacts without stealing routing control
- example_body:
~~~markdown
## Acknowledgment

Reviewing the best route for `{route_topic}`.

## Analysis

- Available routes:
  - `{route_option_1}`
  - `{route_option_2}`
  - `{route_option_3}`
- Current constraints:
  - `{constraint_1}`
  - `{constraint_2}`

## Execution

- Selected route: `{selected_route}`
- Reason:
  - `{reason_1}`
  - `{reason_2}`

## Impact & Risk

- Why not the other routes:
  - `{rejected_reason_1}`
  - `{rejected_reason_2}`
- Route risks:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Confirm route fit by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-023

- title: Parallel fan-out / join synthesis memo
- purpose: Provide a structure for independent workstreams that must be joined into one coherent result
- task_family:
  - `parallel_synthesis`
  - `fanout_join_report`
  - `research_synthesis`
- structure_type:
  - `fanout_then_join`
  - `summary_then_findings`
- typical_use_shape: multi-source research, independent branch analysis, per-section drafting with final synthesis
- language_profile: Korean explanation + English branch or unit labels
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `known_facts`
    - `fanout_units`
    - `join_constraints`
  - optional:
    - `source_scope`
    - `artifact_type`
    - `stakeholder`
  - excluded:
    - concurrency policy
    - runtime scheduling logic
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{fanout_goal}`
  - `{unit_1}`
  - `{unit_2}`
  - `{unit_3}`
  - `{join_findings}`
  - `{verification_steps}`
- verification_pattern:
  - `fanout_join_integrity_check`
  - `document_internal_consistency_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `high_token`
  - `workflow_heavy`
  - `comparison_heavy`
- anti_patterns:
  - hidden dependent branches treated as independent
  - join with no merge rule
  - unresolved branch conflict flattened away
- generalization_boundary:
  - actual parallel execution policy
  - multi-agent ownership
- artifact_notes:
  - useful for parallelization-shaped deliverables and join artifacts
- example_body:
~~~markdown
## Acknowledgment

Summarizing the fan-out / join workflow for `{fanout_goal}`.

## Analysis

- Independent work units:
  - `{unit_1}`
  - `{unit_2}`
  - `{unit_3}`
- Join constraints:
  - `{join_constraint_1}`
  - `{join_constraint_2}`

## Execution

- Branch findings:
  - `{branch_finding_1}`
  - `{branch_finding_2}`
  - `{branch_finding_3}`
- Joined synthesis:
  1. `{join_finding_1}`
  2. `{join_finding_2}`

## Impact & Risk

- Join risks:
  - `{risk_1}`
  - `{risk_2}`
- Residual mismatch:
  - `{mismatch_1}`

## Verification

- Confirm join integrity by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-024

- title: Context pack / active slice memo
- purpose: Provide a structure for context engineering artifacts that separate total context from active step context
- task_family:
  - `context_engineering_note`
  - `workflow_decomposition`
  - `documentation_write`
- structure_type:
  - `context_pack_style`
  - `report_style`
- typical_use_shape: long-context reduction, active slice definition, step-local context packaging
- language_profile: Korean explanation + English key names and slice labels
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `context_pack`
    - `active_slice`
    - `constraints`
  - optional:
    - `document_context`
    - `source_scope`
    - `artifact_type`
  - excluded:
    - runtime selection engine
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{context_goal}`
  - `{context_pack}`
  - `{active_slice}`
  - `{discarded_context}`
  - `{verification_steps}`
- verification_pattern:
  - `context_pack_integrity_check`
  - `unsupported_claim_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `context_heavy`
- anti_patterns:
  - entire raw history shoved downstream
  - no distinction between needed and decorative context
  - discarded context silently containing critical facts
- generalization_boundary:
  - runtime context optimizer logic
  - planning policy ownership
- artifact_notes:
  - useful for context engineering family coverage from Appendix A-like material
- example_body:
~~~markdown
## Acknowledgment

Packaging context for `{context_goal}`.

## Analysis

- Context Pack contains:
  - `{pack_item_1}`
  - `{pack_item_2}`
  - `{pack_item_3}`
- Active Slice contains:
  - `{slice_item_1}`
  - `{slice_item_2}`
- Discarded Context:
  - `{discarded_item_1}`
  - `{discarded_item_2}`

## Execution

- Why the active slice is sufficient:
  - `{reason_1}`
  - `{reason_2}`
- What must still remain visible:
  - `{must_keep_1}`

## Impact & Risk

- Risks of over-compression:
  - `{risk_1}`
- Risks of under-compression:
  - `{risk_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-025

- title: Step-back reframing memo
- purpose: Provide a structure for advanced prompting cases where higher-level reframing improves local decision quality
- task_family:
  - `advanced_prompting_note`
  - `decision_memo`
  - `design_review`
- structure_type:
  - `family_map_style`
  - `decision_then_rationale`
- typical_use_shape: local detail overload, misframed problem, strategic reframing before execution
- language_profile: Korean explanation + English technique labels where needed
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `known_facts`
    - `constraints`
    - `uncertainty_boundary`
  - optional:
    - `active_slice`
    - `existing_design`
  - excluded:
    - full runtime reasoning log
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{local_problem}`
  - `{higher_level_frame}`
  - `{new_decision_axes}`
  - `{recommended_direction}`
  - `{verification_steps}`
- verification_pattern:
  - `design_tradeoff_check`
  - `document_internal_consistency_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `medium_token`
- anti_patterns:
  - abstraction with no decision leverage
  - detached high-level prose
- generalization_boundary:
  - runtime reasoning-technique ownership
- artifact_notes:
  - useful for explicit Appendix A step-back family coverage
- example_body:
~~~markdown
## Acknowledgment

Reframing `{local_problem}` at a higher level before committing to a path.

## Analysis

- Local frame:
  - `{local_frame_1}`
  - `{local_frame_2}`
- Higher-level frame:
  - `{higher_level_frame}`
- New decision axes:
  - `{axis_1}`
  - `{axis_2}`

## Execution

- Recommended direction:
  - `{recommended_direction}`
- Why this frame is better:
  - `{reason_1}`
  - `{reason_2}`

## Impact & Risk

- Benefits:
  - `{benefit_1}`
- Risks if over-applied:
  - `{risk_1}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-026

- title: Self-consistency comparison note
- purpose: Provide a structure for comparing a few candidate answers or paths before collapsing to one
- task_family:
  - `advanced_prompting_note`
  - `comparison`
  - `decision_memo`
- structure_type:
  - `compare_then_judge`
  - `decision_then_rationale`
- typical_use_shape: few-candidate path comparison, ambiguous answer stabilization, bounded consistency check
- language_profile: Korean explanation + English candidate labels
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `known_facts`
    - `constraints`
    - `judge_axes`
  - optional:
    - `uncertainty_boundary`
    - `active_slice`
  - excluded:
    - uncontrolled candidate explosion
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{candidate_1}`
  - `{candidate_2}`
  - `{candidate_3}`
  - `{judge_axes}`
  - `{collapsed_choice}`
  - `{verification_steps}`
- verification_pattern:
  - `judge_axis_check`
  - `answer_consistency_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `comparison_heavy`
- anti_patterns:
  - many cosmetic variants
  - no collapse after comparison
- generalization_boundary:
  - runtime self-consistency loop control
- artifact_notes:
  - useful for explicit advanced prompting spectrum coverage
- example_body:
~~~markdown
## Acknowledgment

Comparing bounded candidates before selecting the strongest path.

## Analysis

- Candidates:
  - `{candidate_1}`
  - `{candidate_2}`
  - `{candidate_3}`
- Evaluation axes:
  - `{axis_1}`
  - `{axis_2}`

## Execution

- Comparative summary:
  - `{finding_1}`
  - `{finding_2}`
- Collapsed choice:
  - `{collapsed_choice}`

## Impact & Risk

- Why alternatives were not selected:
  - `{rejected_reason_1}`
  - `{rejected_reason_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-027

- title: ReAct-style action / observation memo
- purpose: Provide a structure for tasks that alternate between action and observation without exposing full hidden reasoning
- task_family:
  - `advanced_prompting_note`
  - `workflow_decomposition`
  - `documentation_write`
- structure_type:
  - `chain_stage_style`
  - `workflow_map_style`
- typical_use_shape: tool-assisted probing, observation-driven debugging, staged external checks
- language_profile: Korean explanation + English action/observation labels
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `known_facts`
    - `constraints`
    - `active_slice`
  - optional:
    - `tool_context`
    - `environment`
    - `uncertainty_boundary`
  - excluded:
    - hidden full chain-of-thought
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{probe_goal}`
  - `{action_1}`
  - `{observation_1}`
  - `{action_2}`
  - `{observation_2}`
  - `{verification_steps}`
- verification_pattern:
  - `chain_handoff_check`
  - `artifact_integrity_check`
- risk_profile:
  - `workflow_sensitive`
- cost_profile_tags:
  - `high_token`
  - `workflow_heavy`
- anti_patterns:
  - tool action with no observation interpretation
  - narrative hidden reasoning dump
- generalization_boundary:
  - runtime reasoning loop ownership
- artifact_notes:
  - useful for action-observation structure exemplars
- example_body:
~~~markdown
## Acknowledgment

Structuring the action / observation workflow for `{probe_goal}`.

## Analysis

- Goal:
  - `{probe_goal}`
- Known facts:
  - `{fact_1}`
  - `{fact_2}`
- Current uncertainty:
  - `{uncertainty_1}`

## Execution

- Action / observation sequence:
  1. Action: `{action_1}`
     Observation: `{observation_1}`
  2. Action: `{action_2}`
     Observation: `{observation_2}`
- Current interpretation:
  - `{interpretation_1}`

## Impact & Risk

- Probe risks:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
~~~

---

### ENTRY:EX-028

- title: Agentic coding patch review memo
- purpose: Provide a coding-agent-friendly artifact for bounded patch explanation, verification, and unresolved integration risk
- task_family:
  - `agentic_coding_review`
  - `diff_request`
  - `artifact_review`
- structure_type:
  - `diff_focused_style`
  - `artifact_review_style`
- typical_use_shape: local patch review, code-agent handoff, bounded mutation audit
- language_profile: Korean explanation + English code terms, file names, symbols
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `changed_files`
    - `known_facts`
    - `constraints`
  - optional:
    - `sample_input`
    - `sample_output`
    - `logs`
  - excluded:
    - broad rewrite without scope statement
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{changed_unit}`
  - `{why_change}`
  - `{bounded_diff}`
  - `{checked_behavior}`
  - `{unverified_behavior}`
  - `{verification_steps}`
- verification_pattern:
  - `diff_scope_check`
  - `test_coverage_check`
- risk_profile:
  - `medium`
  - `workflow_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `verification_heavy`
- anti_patterns:
  - claiming fix from plausibility alone
  - no blast-radius note
  - no separation of checked vs unchecked behavior
- generalization_boundary:
  - full repo redesign
  - deploy-ready production signoff without actual validation
- artifact_notes:
  - useful for Appendix G / coding-agent artifact family saturation
- example_body:
~~~markdown
## Acknowledgment

Reviewing the bounded patch for `{changed_unit}`.

## Analysis

- Why the change is needed:
  - `{why_change}`
- Changed files / symbols:
  - `{changed_file_1}`
  - `{changed_file_2}`
- Constraints preserved:
  - `{constraint_1}`
  - `{constraint_2}`

## Execution

- Bounded diff summary:
  - `{diff_item_1}`
  - `{diff_item_2}`
- Checked behavior:
  - `{checked_behavior_1}`
  - `{checked_behavior_2}`
- Still unverified:
  - `{unverified_behavior_1}`

## Impact & Risk

- Blast radius:
  - `{impact_scope}`
- Risks:
  - `{risk_1}`
  - `{risk_2}`

## Verification

- Confirm by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-029

- title: Runtime prompt assembly memo
- purpose: Provide a structure for explaining which base prompt, overlays, examples, and host-runtime layer are assembled for a given run
- task_family:
  - `system_prompt_assembly_note`
  - `documentation_write`
- structure_type:
  - `assembly_then_activation`
  - `five_section_engineering`
- typical_use_shape: explain selected runtime bundle, omitted layers, and conflict-resolution logic
- language_profile: Korean explanation + English prompt file names
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `artifact_type`
    - `selected_base`
    - `selected_overlays`
  - optional:
    - `example_mode`
    - `host_runtime_layer`
    - `approval_boundary`
    - `context_pack`
  - excluded:
    - runtime selection rationale as hidden controller logic
    - copied policy text from the assembled prompts
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{runtime_goal}`
  - `{selected_base}`
  - `{selected_overlays}`
  - `{example_mode}`
  - `{host_runtime_layer}`
  - `{load_order_steps}`
  - `{omitted_components}`
  - `{assembly_risks}`
  - `{verification_steps}`
- verification_pattern:
  - `assembly_integrity_check`
  - `context_pack_integrity_check`
- risk_profile:
  - `medium`
  - `workflow_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - multiple base prompts described as if simultaneously active
  - examples treated as policy owners
  - hidden assembly conflict not surfaced
- generalization_boundary:
  - full runtime constitutions with private secrets
  - system-prompt disclosure requests
- artifact_notes:
  - structure-only example for assembly reporting
- example_body:
~~~markdown
## Acknowledgment

Summarizing the runtime prompt bundle for `{runtime_goal}`.

## Analysis

- Selected base: `{selected_base}`
- Selected overlays: `{selected_overlays}`
- Example mode: `{example_mode}`
- Host/runtime layer: `{host_runtime_layer}`
- Omitted components: `{omitted_components}`

## Execution

Load order:
1. `{load_order_step_1}`
2. `{load_order_step_2}`
3. `{load_order_step_3}`
4. `{load_order_step_4}`

## Impact & Risk

- Assembly risks: `{assembly_risks}`
- Boundary caution: `{boundary_caution}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-030

- title: Plan approval checkpoint artifact
- purpose: Provide a structure for presenting a plan for approval before destructive, costly, or high-blast-radius execution
- task_family:
  - `plan_approval_checkpoint`
  - `change_plan`
- structure_type:
  - `checkpoint_then_decision`
  - `plan_then_steps`
- typical_use_shape: review-required migration plan, broad refactor plan, high-impact external action plan
- language_profile: Korean explanation + English technical identifiers
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `constraints`
    - `approval_checkpoint`
    - `artifact_type`
  - optional:
    - `environment`
    - `risk_tolerance`
    - `deadline`
    - `stakeholder`
  - excluded:
    - unstated approval assumptions
    - hidden execution beyond the checkpoint
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{plan_goal}`
  - `{why_approval_is_needed}`
  - `{step_list}`
  - `{decision_points}`
  - `{rollback_notes}`
  - `{verification_steps}`
- verification_pattern:
  - `approval_checkpoint_check`
  - `plan_completeness_check`
- risk_profile:
  - `approval_sensitive`
  - `destructive_change_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - approval request with no actual decision point
  - plan steps with no rollback boundary
  - action phrased as already approved
- generalization_boundary:
  - trivial reversible reads
  - single-step direct answers
- artifact_notes:
  - useful when approval must happen before execution, not after
- example_body:
~~~markdown
## Acknowledgment

Presenting the plan for `{plan_goal}` before execution.

## Analysis

- Approval is required because: `{why_approval_is_needed}`
- Scope boundary: `{scope_boundary}`
- Preconditions: `{preconditions}`

## Execution

Proposed steps:
1. `{step_1}`
2. `{step_2}`
3. `{step_3}`

Decision checkpoints:
- `{decision_point_1}`
- `{decision_point_2}`

## Impact & Risk

- Main risks: `{risk_items}`
- Rollback notes: `{rollback_notes}`

## Verification

- Approve only if:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-031

- title: Safe trajectory artifact report
- purpose: Provide a structure for reporting observable trajectory quality without exposing raw hidden chain-of-thought
- task_family:
  - `trajectory_artifact_report`
  - `artifact_review`
- structure_type:
  - `trajectory_log_style`
  - `summary_then_findings`
- typical_use_shape: trajectory review, branch-quality audit, process-debug memo
- language_profile: Korean explanation + English artifact field names
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `artifact_type`
    - `trajectory_slots`
  - optional:
    - `branch_candidates`
    - `join_constraints`
    - `context_pack`
  - excluded:
    - raw private reasoning dumps
    - content copied from hidden traces
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{trajectory_goal}`
  - `{step_intent}`
  - `{selected_action}`
  - `{observation_summary}`
  - `{branch_decision}`
  - `{recovery_event}`
  - `{stop_reason}`
  - `{verification_steps}`
- verification_pattern:
  - `trajectory_artifact_check`
  - `artifact_integrity_check`
- risk_profile:
  - `medium`
  - `workflow_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `medium_latency`
- anti_patterns:
  - private chain-of-thought exposed as the artifact
  - observable step data omitted
  - final answer scored without process notes on process-sensitive tasks
- generalization_boundary:
  - tasks where no trajectory quality matters
  - unrestricted reasoning transcript requests
- artifact_notes:
  - preserves auditable control flow without over-disclosing reasoning internals
- example_body:
~~~markdown
## Acknowledgment

Reviewing the observable trajectory for `{trajectory_goal}`.

## Analysis

- Path class: `{path_class}`
- Branch pressure: `{branch_pressure}`
- Recovery sensitivity: `{recovery_sensitivity}`

## Execution

Trajectory artifact:
1. `step_intent`: `{step_intent}`
2. `selected_action`: `{selected_action}`
3. `observation_summary`: `{observation_summary}`
4. `branch_decision`: `{branch_decision}`
5. `recovery_event`: `{recovery_event}`
6. `stop_reason`: `{stop_reason}`

## Impact & Risk

- Process risks: `{process_risks}`
- Missing observability: `{observability_gaps}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-032

- title: Mock-tool evaluation report
- purpose: Provide a structure for evaluating agentic tool behavior using mock tools or a safe deterministic harness
- task_family:
  - `mock_tool_eval_report`
  - `evaluation_scorecard`
  - `test_strategy`
- structure_type:
  - `eval_harness_style`
  - `scorecard_style`
- typical_use_shape: tool-call regression check, harness design memo, repeatable agentic workflow evaluation
- language_profile: Korean explanation + English tool and assertion identifiers
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `artifact_type`
    - `mock_harness`
    - `tool_contracts`
  - optional:
    - `baseline_version`
    - `candidate_version`
    - `metric_summary`
  - excluded:
    - live production secrets
    - irreversible environment actions
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{eval_scope}`
  - `{mock_tools}`
  - `{deterministic_assertions}`
  - `{judge_checks}`
  - `{score_summary}`
  - `{gaps}`
  - `{verification_steps}`
- verification_pattern:
  - `mock_harness_check`
  - `scorecard_threshold_check`
- risk_profile:
  - `release_sensitive`
  - `workflow_sensitive`
- cost_profile_tags:
  - `high_token`
  - `medium_latency`
- anti_patterns:
  - live destructive tool used for a regression check
  - judge-only scoring with no deterministic assertion where deterministic checks exist
  - parameter assertion omitted on a tool-sensitive workflow
- generalization_boundary:
  - simple direct-answer evaluation with no tool path
  - fully live operational runbooks
- artifact_notes:
  - useful for repeatable non-deterministic agent testing
- example_body:
~~~markdown
## Acknowledgment

Evaluating the mock-tool harness for `{eval_scope}`.

## Analysis

- Mock tools: `{mock_tools}`
- Deterministic assertions: `{deterministic_assertions}`
- Judge or rubric checks: `{judge_checks}`

## Execution

Score summary:
- Parameter correctness: `{parameter_score}`
- Partial-state handling: `{partial_state_score}`
- Final answer fit: `{final_answer_score}`
- Overall recommendation: `{score_summary}`

## Impact & Risk

- Harness gaps: `{gaps}`
- Release sensitivity: `{release_sensitivity}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-033

- title: Coding-agent invocation pack
- purpose: Provide a structure for a bounded coding-agent execution pack with active slice, tool allowances, review gates, and verification targets
- task_family:
  - `coding_agent_invocation_pack`
  - `agentic_coding_review`
- structure_type:
  - `invocation_pack_style`
  - `workflow_map_style`
- typical_use_shape: bounded coding task kickoff, reviewer/tester/documenter invocation pack, IDE or CLI execution pack
- language_profile: Korean explanation + English file paths and identifier fields
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `active_slice`
    - `changed_files`
    - `artifact_type`
  - optional:
    - `tool_contracts`
    - `approval_boundary`
    - `context_pack`
    - `environment`
  - excluded:
    - repo-wide unrelated context
    - hidden approval assumptions
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{coding_goal}`
  - `{active_slice}`
  - `{files_in_scope}`
  - `{tool_allowances}`
  - `{review_gates}`
  - `{verification_targets}`
  - `{verification_steps}`
- verification_pattern:
  - `diff_scope_check`
  - `approval_checkpoint_check`
  - `context_pack_integrity_check`
- risk_profile:
  - `medium`
  - `destructive_change_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `medium_latency`
- anti_patterns:
  - invocation pack wider than the active slice
  - tool allowance broader than the task
  - review gate omitted on a high-blast-radius coding task
- generalization_boundary:
  - non-coding direct answers
  - repo-wide redesign requests with no bounded scope
- artifact_notes:
  - useful for human-led orchestration of specialist coding agents
- example_body:
~~~markdown
## Acknowledgment

Preparing the coding-agent invocation pack for `{coding_goal}`.

## Analysis

- Active slice: `{active_slice}`
- Files in scope: `{files_in_scope}`
- Approval boundary: `{approval_boundary}`

## Execution

Invocation pack:
- Tool allowances: `{tool_allowances}`
- Review gates: `{review_gates}`
- Verification targets: `{verification_targets}`

## Impact & Risk

- Main blast radius: `{blast_radius}`
- Main risks: `{risk_items}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-034

- title: Goal-monitoring status memo
- purpose: Provide a structure for reporting goal progress, solved signals, blockers, and the next control move
- task_family:
  - `goal_monitoring_status`
  - `progress_checkpoint`
  - `workflow_monitoring`
- structure_type:
  - `status_then_delta`
  - `checkpoint_style`
- typical_use_shape: long-running task status, autonomy checkpoint, solved-signal review, control-loop progress note
- language_profile: Korean explanation + English field names
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `goal`
    - `current_state`
    - `success_signals`
  - optional:
    - `blockers`
    - `next_action`
    - `escalation_trigger`
    - `budget_state`
  - excluded:
    - hidden controller logic
    - raw private reasoning traces
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{goal}`
  - `{current_state}`
  - `{success_signals}`
  - `{progress_delta}`
  - `{blockers}`
  - `{next_action}`
  - `{escalation_trigger}`
  - `{verification_steps}`
- verification_pattern:
  - `goal_signal_check`
  - `checkpoint_state_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - vague progress with no solved signal
  - blocker hidden behind status optimism
  - next action omitted on an iterative task
- generalization_boundary:
  - runtime monitoring policy
  - raw hidden chain-of-thought
- artifact_notes:
  - useful when goal progress must remain compact, auditable, and control-oriented
- example_body:
~~~markdown
## Acknowledgment

Summarizing progress toward `{goal}`.

## Analysis

- Current state: `{current_state}`
- Success signals:
  - `{success_signal_1}`
  - `{success_signal_2}`

## Execution

- Progress delta: `{progress_delta}`
- Next action: `{next_action}`
- Escalation trigger: `{escalation_trigger}`

## Impact & Risk

- Active blockers: `{blockers}`
- Main monitoring risk: `{monitoring_risk}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-035

- title: Recovery / escalation checkpoint memo
- purpose: Provide a structure for blocked-state honesty, recovery options, and escalation thresholds
- task_family:
  - `recovery_checkpoint`
  - `escalation_note`
  - `blocked_state_report`
- structure_type:
  - `blocked_then_recover`
  - `checkpoint_then_decision`
- typical_use_shape: failure checkpoint, fallback decision note, blocked task escalation packet
- language_profile: Korean explanation + English failure-state and option labels
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `failure_surface`
    - `current_state`
    - `recovery_options`
  - optional:
    - `rollback_boundary`
    - `approval_boundary`
    - `budget_state`
  - excluded:
    - hidden authority expansion
    - destructive rollback phrased as already executed
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{blocked_goal}`
  - `{failure_surface}`
  - `{current_state}`
  - `{recovery_option_1}`
  - `{recovery_option_2}`
  - `{escalation_trigger}`
  - `{rollback_boundary}`
  - `{verification_steps}`
- verification_pattern:
  - `recovery_path_check`
  - `blocked_state_honesty_check`
- risk_profile:
  - `workflow_sensitive`
  - `approval_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - blocker hidden or softened away
  - escalation with no trigger
  - fallback presented as success
- generalization_boundary:
  - autonomous destructive rollback
  - silent approval skipping
- artifact_notes:
  - useful when the response must preserve recovery posture without pretending completion
- example_body:
~~~markdown
## Acknowledgment

Checkpointing the blocked state for `{blocked_goal}`.

## Analysis

- Failure surface: `{failure_surface}`
- Current state: `{current_state}`
- Approval boundary: `{approval_boundary}`

## Execution

- Recovery options:
  1. `{recovery_option_1}`
  2. `{recovery_option_2}`
- Escalation trigger: `{escalation_trigger}`

## Impact & Risk

- Rollback boundary: `{rollback_boundary}`
- Main risks: `{risk_items}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-036

- title: Resource budget and route-choice memo
- purpose: Provide a structure for explaining route selection under cost, latency, or complexity constraints
- task_family:
  - `resource_budget_memo`
  - `route_choice_note`
  - `cost_latency_tradeoff`
- structure_type:
  - `budget_then_route`
  - `decision_then_tradeoff`
- typical_use_shape: model/tool route selection, cheaper-safe-path decision, budget-aware workflow memo
- language_profile: Korean explanation + English route and budget labels
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `budget_axes`
    - `route_options`
    - `selected_route`
  - optional:
    - `risk_tolerance`
    - `deadline`
    - `fallback_route`
  - excluded:
    - hidden routing policy
    - fake cost certainty
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{route_goal}`
  - `{budget_axes}`
  - `{route_option_1}`
  - `{route_option_2}`
  - `{selected_route}`
  - `{fallback_route}`
  - `{tradeoff_summary}`
  - `{verification_steps}`
- verification_pattern:
  - `budget_fit_check`
  - `route_fit_check`
- risk_profile:
  - `medium`
  - `workflow_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `comparison_heavy`
- anti_patterns:
  - expensive path selected with no reason
  - budget omitted from the decision memo
  - no fallback on a budget-sensitive path
- generalization_boundary:
  - hidden router policy
  - live billing guarantees
- artifact_notes:
  - useful when route quality depends on budget fit rather than only capability fit
- example_body:
~~~markdown
## Acknowledgment

Reviewing the budget-aware route for `{route_goal}`.

## Analysis

- Budget axes: `{budget_axes}`
- Route options:
  - `{route_option_1}`
  - `{route_option_2}`

## Execution

- Selected route: `{selected_route}`
- Fallback route: `{fallback_route}`
- Trade-off summary: `{tradeoff_summary}`

## Impact & Risk

- Budget risks: `{budget_risks}`
- Quality risks: `{quality_risks}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-037

- title: Prioritization queue / next-action memo
- purpose: Provide a structure for ranking competing work items and making the next action explicit
- task_family:
  - `prioritization_queue`
  - `next_action_selection`
  - `queue_review`
- structure_type:
  - `ranked_queue_style`
  - `next_then_fallback`
- typical_use_shape: next-step selection, ranked work queue, blocked-dependency prioritization memo
- language_profile: Korean explanation + English action and criteria labels
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `candidate_actions`
    - `ranking_criteria`
    - `selected_action`
  - optional:
    - `blocked_dependencies`
    - `fallback_action`
    - `replan_trigger`
  - excluded:
    - hidden router state
    - decorative backlog inflation
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{queue_goal}`
  - `{ranking_criteria}`
  - `{candidate_1}`
  - `{candidate_2}`
  - `{candidate_3}`
  - `{selected_action}`
  - `{fallback_action}`
  - `{replan_trigger}`
  - `{verification_steps}`
- verification_pattern:
  - `priority_queue_check`
  - `next_action_fit_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - queue with no ranking criteria
  - stale priority order preserved without reason
  - next action omitted after ranking work
- generalization_boundary:
  - real scheduler implementation
  - hidden branch-control policy
- artifact_notes:
  - useful when prioritization must stay compact and decision-oriented
- example_body:
~~~markdown
## Acknowledgment

Ranking the next actions for `{queue_goal}`.

## Analysis

- Ranking criteria: `{ranking_criteria}`
- Active dependencies: `{blocked_dependencies}`

## Execution

- Ranked queue:
  1. `{candidate_1}`
  2. `{candidate_2}`
  3. `{candidate_3}`
- Selected next action: `{selected_action}`
- Fallback action: `{fallback_action}`

## Impact & Risk

- Queue risks: `{queue_risks}`
- Replan trigger: `{replan_trigger}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-038

- title: Exploration frontier / hypothesis memo
- purpose: Provide a structure for bounded exploration, promoted regions, collapsed regions, and stop conditions
- task_family:
  - `exploration_frontier`
  - `hypothesis_map`
  - `discovery_note`
- structure_type:
  - `frontier_then_probe`
  - `exploration_map_style`
- typical_use_shape: open-ended research probe, design frontier map, bounded discovery memo
- language_profile: Korean explanation + English frontier and hypothesis labels
- output_density: `expanded`
- context_contract:
  - required:
    - `intent`
    - `frontier_regions`
    - `evaluation_axes`
    - `decision_horizon`
  - optional:
    - `promoted_region`
    - `collapsed_region`
    - `stop_condition`
  - excluded:
    - exhaustive search logs
    - novelty detached from goal
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{frontier_goal}`
  - `{evaluation_axes}`
  - `{region_1}`
  - `{region_2}`
  - `{region_3}`
  - `{promoted_region}`
  - `{collapsed_region}`
  - `{stop_condition}`
  - `{verification_steps}`
- verification_pattern:
  - `frontier_control_check`
  - `hypothesis_distinctness_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `high_token`
  - `comparison_heavy`
- anti_patterns:
  - exhaustive enumeration with no control horizon
  - stop condition omitted
  - promoted and collapsed regions not distinguished
- generalization_boundary:
  - full search controller logic
  - private reasoning traces
- artifact_notes:
  - useful when discovery must remain visibly bounded rather than narratively open-ended
- example_body:
~~~markdown
## Acknowledgment

Mapping the exploration frontier for `{frontier_goal}`.

## Analysis

- Evaluation axes: `{evaluation_axes}`
- Decision horizon: `{decision_horizon}`

## Execution

- Current frontier:
  - `{region_1}`
  - `{region_2}`
  - `{region_3}`
- Promoted region: `{promoted_region}`
- Collapsed region: `{collapsed_region}`
- Stop condition: `{stop_condition}`

## Impact & Risk

- Discovery risks: `{discovery_risks}`
- Frontier gaps: `{frontier_gaps}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-039

- title: HITL approval packet
- purpose: Provide a structure for human review questions, approval boundary, and reversible decision framing
- task_family:
  - `hitl_approval_packet`
  - `approval_boundary_note`
  - `human_review_packet`
- structure_type:
  - `decision_packet_style`
  - `review_then_action`
- typical_use_shape: human review checkpoint, policy-sensitive plan gate, execution-approval packet
- language_profile: Korean explanation + English technical identifiers
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `action_scope`
    - `approval_boundary`
    - `review_questions`
  - optional:
    - `risk_tolerance`
    - `deadline`
    - `rollback_notes`
  - excluded:
    - hidden approval assumptions
    - action phrased as already cleared
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{approval_goal}`
  - `{action_scope}`
  - `{approval_boundary}`
  - `{review_question_1}`
  - `{review_question_2}`
  - `{decision_options}`
  - `{rollback_notes}`
  - `{verification_steps}`
- verification_pattern:
  - `approval_packet_check`
  - `boundary_visibility_check`
- risk_profile:
  - `approval_sensitive`
  - `high`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - human review implied but not explicit
  - no decision point despite approval request
  - rollback absent on a review-sensitive path
- generalization_boundary:
  - trivial reversible reads
  - hidden system prompt disclosure
- artifact_notes:
  - useful when human judgment must stay explicit without turning the packet into a full plan
- example_body:
~~~markdown
## Acknowledgment

Preparing the HITL approval packet for `{approval_goal}`.

## Analysis

- Action scope: `{action_scope}`
- Approval boundary: `{approval_boundary}`
- Decision options: `{decision_options}`

## Execution

- Review questions:
  1. `{review_question_1}`
  2. `{review_question_2}`
- Requested next action after review: `{requested_next_action}`

## Impact & Risk

- Main risks: `{risk_items}`
- Rollback notes: `{rollback_notes}`

## Verification

- Approve only if:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-040

- title: MCP capability handoff memo
- purpose: Provide a structure for handing off a selected MCP capability with contract shape and fallback notes
- task_family:
  - `mcp_capability_handoff`
  - `capability_review`
  - `interoperability_note`
- structure_type:
  - `capability_then_contract`
  - `handoff_packet_style`
- typical_use_shape: MCP capability selection note, resource/tool contract handoff, operator-facing MCP packet
- language_profile: Korean explanation + English capability and contract fields
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `selected_capability`
    - `input_contract`
    - `expected_output_shape`
  - optional:
    - `server_identity`
    - `approval_boundary`
    - `fallback_capability`
  - excluded:
    - full credential dumps
    - hidden tool-selection policy
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{capability_goal}`
  - `{server_identity}`
  - `{selected_capability}`
  - `{input_contract}`
  - `{expected_output_shape}`
  - `{fallback_capability}`
  - `{approval_boundary}`
  - `{verification_steps}`
- verification_pattern:
  - `capability_fit_check`
  - `contract_shape_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - capability abundance treated as capability fitness
  - contract shape omitted
  - approval boundary hidden on a write-capable path
- generalization_boundary:
  - live secret material
  - full server configuration dumps
- artifact_notes:
  - useful when MCP discovery and selection must remain auditable across handoffs
- example_body:
~~~markdown
## Acknowledgment

Preparing the MCP capability handoff for `{capability_goal}`.

## Analysis

- Server identity: `{server_identity}`
- Selected capability: `{selected_capability}`
- Approval boundary: `{approval_boundary}`

## Execution

- Input contract: `{input_contract}`
- Expected output shape: `{expected_output_shape}`
- Fallback capability: `{fallback_capability}`

## Impact & Risk

- Capability risks: `{capability_risks}`
- Contract gaps: `{contract_gaps}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-041

- title: A2A task-handoff memo
- purpose: Provide a structure for inter-agent task handoff with lifecycle state, return contract, and join constraints
- task_family:
  - `a2a_task_handoff`
  - `inter_agent_handoff`
  - `lifecycle_status_note`
- structure_type:
  - `handoff_then_status`
  - `lifecycle_packet_style`
- typical_use_shape: A2A delegation note, downstream specialist handoff, lifecycle-aware collaboration packet
- language_profile: Korean explanation + English lifecycle and contract fields
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `receiving_agent`
    - `task_scope`
    - `lifecycle_state`
  - optional:
    - `handoff_owner`
    - `blocker_state`
    - `join_constraints`
    - `return_contract`
  - excluded:
    - hidden delegation authority
    - dispatched work treated as already complete
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{handoff_goal}`
  - `{receiving_agent}`
  - `{task_scope}`
  - `{lifecycle_state}`
  - `{handoff_owner}`
  - `{return_contract}`
  - `{join_constraints}`
  - `{blocker_state}`
  - `{verification_steps}`
- verification_pattern:
  - `handoff_integrity_check`
  - `lifecycle_state_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `medium_latency`
- anti_patterns:
  - dispatched work treated as done
  - lifecycle state omitted
  - return contract or join constraint missing
- generalization_boundary:
  - uncontrolled multi-agent topology design
  - hidden cross-agent trust assumptions
- artifact_notes:
  - useful when A2A coordination must preserve lifecycle honesty and integration discipline
- example_body:
~~~markdown
## Acknowledgment

Preparing the A2A handoff for `{handoff_goal}`.

## Analysis

- Receiving agent: `{receiving_agent}`
- Task scope: `{task_scope}`
- Lifecycle state: `{lifecycle_state}`

## Execution

- Handoff owner: `{handoff_owner}`
- Return contract: `{return_contract}`
- Join constraints: `{join_constraints}`

## Impact & Risk

- Blocker state: `{blocker_state}`
- Coordination risks: `{coordination_risks}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

## 14. Entry-Local Anti-Pattern Interpretation Rule

Each entry’s `anti_patterns` field only means:

- it statically describes **which structural mistakes the example should avoid**
- it does not perform runtime detection or scoring
- it is warning metadata that may be referenced by a controller

---

## 15. Generalization Rule

### 15.1 Allowed generalization

- preserve section names or lightly compress them
- replace placeholders with current task/user context
- adjust density within the same task family
- specialize verification wording within the same verification pattern
- reuse family-level structure for advanced prompting, multimodal, workflow, or evaluation artifacts without reusing content

### 15.2 Not allowed

- reusing factual content from an example body
- transplanting domain facts from an example directly into the current task
- adding selection rules that do not exist in the entry body
- embedding cross-entry priority or scoring logic
- converting a structure exemplar into runtime policy

---

## 16. Compression Rule

This catalog preserves data density but does not embed runtime policy.

- More entries do not justify embedding selection logic
- Richer explanation does not justify controller language
- More advanced examples do not justify policy ownership shift
- The catalog may become richer, but it may not gain decision authority

---

## 17. Final Boundary Reminder

- `PROMPT_example_catalog` is **immutable structural data**
- `PROMPT_example_injection` is the **selection + evaluation + adaptation + safety controller**
- The catalog stores structure
- The injection layer interprets structure
- The catalog provides shape
- The injection layer decides whether and how to apply it
- The catalog does not execute
- The catalog does not select
- The catalog does not score
- The catalog does not merge
- The catalog does not adapt
- The catalog does not issue fallback decisions
- The catalog does not become an advanced prompting policy owner
- The catalog does not become a multimodal reasoning owner
- The catalog does not become a judge or evaluation authority
- The catalog does not become a chaining owner
- The catalog does not become a routing owner
- The catalog does not become a parallelization owner

---

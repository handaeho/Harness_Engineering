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
- `tool_capability_contract`
- `capability_precondition_review`
- `evidence_target_review`
- `retrieval_mode_decision`
- `memory_scope_profile`
- `checkpoint_profile_note`
- `benchmark_registry`
- `guide_reflection_benchmark`
- `chapter_reflection_review`
- `context_sufficiency_review`
- `critique_quality_review`
- `adaptation_promotion_review`
- `route_quality_scorecard`
- `coding_benchmark_scenario`
- `benchmark_execution_report`
- `replay_suite_verdict`
- `context_failure_taxonomy`
- `critique_utility_scorecard`
- `adaptation_lifecycle_state`
- `route_reprioritization_audit`
- `coding_proof_bundle`
- `release_evidence_bundle_v2`
- `telemetry_trend`
- `repo_instruction_pack`
- `coding_prompt_template_bundle`
- `prompt_evaluation_case_pack`
- `failure_improvement_loop`

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
- `capability_then_precondition`
- `target_then_mode`
- `scope_then_checkpoint`
- `template_bundle_style`
- `evaluation_matrix_style`
- `failure_loop_style`

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
- `retained_branch`
- `pruned_branch`
- `route_options`
- `join_constraints`
- `selected_base`
- `selected_overlays`
- `example_mode`
- `host_runtime_layer`
- `selected_capability`
- `capability_contract`
- `precondition_status`
- `evidence_target`
- `selected_retrieval_mode`
- `evidence_pack_scope`
- `memory_scope`
- `checkpoint_profile`
- `host_runtime_surfaces`
- `packet_coverage_summary`
- `assembly_lookup_state`
- `control_loop_packet_parity`
- `lookup_parity_state`
- `skill_packet_parity_state`
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
- `capability_contract_check`
- `precondition_visibility_check`
- `evidence_target_check`
- `retrieval_mode_fit_check`
- `memory_scope_check`
- `checkpoint_profile_check`
- `host_runtime_carryover_check`
- `packet_completeness_check`
- `control_loop_packet_parity_check`
- `lookup_parity_check`
- `skill_packet_parity_check`

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
- purpose: Provide a structure for prompt-version regression review, semantic drift notes, substrate and lifecycle carryover checks, topology coverage checks, and release gating
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
    - `host_runtime_surfaces`
    - `packet_coverage_summary`
    - `assembly_lookup_state`
    - `control_loop_packet_parity`
    - `lookup_parity_state`
    - `skill_packet_parity_state`
    - `substrate_readiness_state`
    - `lifecycle_auditability_state`
    - `topology_coverage_state`
    - `resource_switching_state`
    - `coding_briefing_state`
    - `research_transparency_state`
    - `resource_concurrency_state`
    - `human_quality_gate_state`
    - `packet_compliance_state`
    - `behavior_replay_state`
    - `delegation_join_state`
    - `approval_lifecycle_state`
    - `release_evidence_state`
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
  - `{host_runtime_surfaces}`
  - `{packet_coverage_summary}`
  - `{assembly_lookup_state}`
  - `{control_loop_packet_parity}`
  - `{lookup_parity_state}`
  - `{skill_packet_parity_state}`
  - `{substrate_readiness_state}`
  - `{lifecycle_auditability_state}`
  - `{topology_coverage_state}`
  - `{resource_switching_state}`
  - `{coding_briefing_state}`
  - `{research_transparency_state}`
  - `{resource_concurrency_state}`
  - `{human_quality_gate_state}`
  - `{packet_compliance_state}`
  - `{behavior_replay_state}`
  - `{delegation_join_state}`
  - `{approval_lifecycle_state}`
  - `{release_evidence_state}`
  - `{release_decision}`
  - `{verification_steps}`
- verification_pattern:
  - `version_regression_check`
  - `release_gate_check`
  - `host_runtime_carryover_check`
  - `packet_completeness_check`
  - `assembly_integrity_check`
  - `control_loop_packet_parity_check`
  - `lookup_parity_check`
  - `skill_packet_parity_check`
  - `substrate_readiness_carryover_check`
  - `lifecycle_auditability_check`
  - `topology_coverage_check`
  - `resource_switching_parity_check`
  - `coding_briefing_carryover_check`
  - `research_transparency_check`
  - `resource_concurrency_parity_check`
  - `human_quality_gate_carryover_check`
  - `packet_compliance_check`
  - `behavior_replay_check`
  - `delegation_join_check`
  - `approval_lifecycle_check`
  - `release_evidence_check`
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
  - missing host-runtime carryover check
  - missing packet coverage notes
  - missing assembly lookup check
  - missing control-loop packet parity check
  - missing guide/runtime lookup parity note
  - missing skill-layer packet parity note
  - missing substrate-readiness carryover note
  - missing lifecycle auditability note
  - missing topology coverage note
  - missing resource-switching parity note
  - missing coding-briefing carryover note
  - missing research-transparency note
  - missing resource-concurrency parity note
  - missing human-quality-gate note
  - missing packet-compliance note
  - missing behavior-replay note
  - missing delegation-join note
  - missing approval-lifecycle note
  - missing release-evidence note
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
- Host-runtime carryover notes:
  - `{host_runtime_surface_1}`
  - `{host_runtime_surface_2}`
- Packet coverage notes:
  - `{packet_coverage_item_1}`
  - `{packet_coverage_item_2}`
- Assembly lookup state: `{assembly_lookup_state}`
- Control-loop packet parity: `{control_loop_packet_parity}`
- Guide/runtime lookup parity: `{lookup_parity_state}`
- Skill-layer packet parity: `{skill_packet_parity_state}`
- Substrate-readiness carryover: `{substrate_readiness_state}`
- Lifecycle auditability: `{lifecycle_auditability_state}`
- Topology coverage: `{topology_coverage_state}`
- Resource-switching parity: `{resource_switching_state}`
- Coding briefing fidelity: `{coding_briefing_state}`
- Research transparency: `{research_transparency_state}`
- Resource-concurrency parity: `{resource_concurrency_state}`
- Human quality gate: `{human_quality_gate_state}`
- Packet compliance: `{packet_compliance_state}`
- Behavior replay: `{behavior_replay_state}`
- Delegation / join: `{delegation_join_state}`
- Approval lifecycle: `{approval_lifecycle_state}`
- Release evidence: `{release_evidence_state}`

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
    - `packet_assertions`
    - `trajectory_checkpoint_assertions`
    - `approval_lifecycle_assertions`
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
  - `{packet_assertions}`
  - `{trajectory_checkpoint_assertions}`
  - `{approval_lifecycle_assertions}`
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
- Packet assertions: `{packet_assertions}`
- Trajectory checkpoint assertions: `{trajectory_checkpoint_assertions}`
- Approval-lifecycle assertions: `{approval_lifecycle_assertions}`

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
    - `briefing_scope`
    - `external_knowledge_inputs`
    - `human_brief_contract`
    - `quality_gate_owner`
    - `iteration_protocol`
    - `model_access_boundary`
    - `review_state_expectation`
    - `acceptance_state_boundary`
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
  - `{briefing_scope}`
  - `{external_knowledge_inputs}`
  - `{human_brief_contract}`
  - `{tool_allowances}`
  - `{review_gates}`
  - `{quality_gate_owner}`
  - `{iteration_protocol}`
  - `{model_access_boundary}`
  - `{review_state_expectation}`
  - `{acceptance_state_boundary}`
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
- useful when the active coding surface must remain a briefing package rather than a loose file bundle
- useful when proposal-shaped coding output must stay distinct from merge-ready or release-ready acceptance
- example_body:
~~~markdown
## Acknowledgment

Preparing the coding-agent invocation pack for `{coding_goal}`.

## Analysis

- Active slice: `{active_slice}`
- Files in scope: `{files_in_scope}`
- Briefing scope: `{briefing_scope}`
- External knowledge inputs: `{external_knowledge_inputs}`
- Human brief contract: `{human_brief_contract}`
- Approval boundary: `{approval_boundary}`

## Execution

Invocation pack:
- Tool allowances: `{tool_allowances}`
- Review gates: `{review_gates}`
- Quality-gate owner: `{quality_gate_owner}`
- Iteration protocol: `{iteration_protocol}`
- Model-access boundary: `{model_access_boundary}`
- Review-state expectation: `{review_state_expectation}`
- Acceptance-state boundary: `{acceptance_state_boundary}`
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
    - `stronger_route_trigger`
    - `critique_reroute_trigger`
    - `model_tool_tier_choice`
    - `acceptable_degradation_boundary`
    - `concurrency_mode`
    - `parallelism_cap`
    - `join_cost_state`
    - `saturation_risk`
    - `feedback_adjustment_trigger`
    - `graceful_degradation_mode`
    - `reviewer_load_estimate`
    - `branch_overlap_risk`
    - `join_failure_trigger`
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
  - `{stronger_route_trigger}`
  - `{critique_reroute_trigger}`
  - `{model_tool_tier_choice}`
  - `{acceptable_degradation_boundary}`
  - `{concurrency_mode}`
  - `{parallelism_cap}`
  - `{join_cost_state}`
  - `{saturation_risk}`
  - `{feedback_adjustment_trigger}`
  - `{graceful_degradation_mode}`
  - `{reviewer_load_estimate}`
  - `{branch_overlap_risk}`
  - `{join_failure_trigger}`
  - `{tradeoff_summary}`
  - `{budget_risks}`
  - `{quality_risks}`
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
  - no stronger-route trigger when route escalation is the actual control issue
- generalization_boundary:
  - hidden router policy
  - live billing guarantees
- artifact_notes:
  - useful when route quality depends on budget fit rather than only capability fit
  - should preserve fallback continuity and escalation trigger rather than only a one-shot route selection
  - should keep concurrency economics inspectable when branch count, join burden, or critique-driven reroute is the real budget issue
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
- Stronger-route trigger: `{stronger_route_trigger}`
- Critique-driven reroute trigger: `{critique_reroute_trigger}`
- Model/tool tier choice: `{model_tool_tier_choice}`
- Acceptable degradation boundary: `{acceptable_degradation_boundary}`
- Reviewer-load estimate: `{reviewer_load_estimate}`
- Branch-overlap risk: `{branch_overlap_risk}`
- Join-failure trigger: `{join_failure_trigger}`
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
- purpose: Provide a structure for bounded exploration, retained branches, pruned branches, promoted regions, collapsed regions, and stop conditions
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
    - `retained_branch`
    - `pruned_branch`
    - `prune_reason`
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
  - `{retained_branch}`
  - `{pruned_branch}`
  - `{prune_reason}`
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
  - branch pruning hidden after width reduction
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
- Retained branch: `{retained_branch}`
- Pruned branch: `{pruned_branch}`
- Prune reason: `{prune_reason}`
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
    - `review_owner`
    - `approval_event`
    - `acceptance_state`
    - `rejection_loop`
    - `release_restriction`
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
  - `{review_owner}`
  - `{approval_event}`
  - `{acceptance_state}`
  - `{rejection_loop}`
  - `{release_restriction}`
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
- Review owner: `{review_owner}`
- Approval event: `{approval_event}`

## Execution

- Review questions:
  1. `{review_question_1}`
  2. `{review_question_2}`
- Acceptance state: `{acceptance_state}`
- Rejection loop: `{rejection_loop}`
- Release restriction: `{release_restriction}`
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

### ENTRY:EX-042

- title: Orchestration topology decision memo
- purpose: Provide a structure for selecting a collaboration topology with ownership, join, and budget visibility
- task_family:
  - `orchestration_topology_decision`
  - `coordination_route_choice`
  - `delegation_design_note`
- structure_type:
  - `topology_then_contract`
  - `decision_packet_style`
- typical_use_shape: multi-agent topology choice, coordinator-specialist plan, bounded delegation design memo
- language_profile: Korean explanation + English topology and contract fields
- output_density: `standard`
- context_contract:
  - required:
    - `goal`
    - `candidate_topologies`
    - `selected_topology`
    - `join_contract`
  - optional:
    - `coordination_budget`
    - `fallback_topology`
    - `review_boundary`
    - `communication_surface`
    - `shared_state_contract`
    - `supervision_mode`
  - excluded:
    - hidden controller logic
    - decorative multi-agent rhetoric
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{goal}`
  - `{candidate_topologies}`
  - `{selected_topology}`
  - `{selection_reason}`
  - `{join_contract}`
  - `{coordination_budget}`
  - `{fallback_topology}`
  - `{review_boundary}`
  - `{communication_surface}`
  - `{shared_state_contract}`
  - `{supervision_mode}`
  - `{verification_steps}`
- verification_pattern:
  - `topology_fit_check`
  - `join_contract_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `medium_latency`
- anti_patterns:
  - topology chosen by style rather than fit
  - join contract omitted
  - communication surface omitted on a coordination-sensitive path
  - shared-state contract omitted where agents rely on common state
  - supervision mode unclear on a hierarchy-shaped path
  - fallback absent on a brittle coordination path
- generalization_boundary:
  - hidden routing policy
  - uncontrolled orchestration expansion
- artifact_notes:
  - useful when topology choice itself must remain auditable
- example_body:
~~~markdown
## Acknowledgment

Selecting the orchestration topology for `{goal}`.

## Analysis

- Candidate topologies: `{candidate_topologies}`
- Selected topology: `{selected_topology}`
- Review boundary: `{review_boundary}`
- Communication surface: `{communication_surface}`
- Supervision mode: `{supervision_mode}`

## Execution

- Selection reason: `{selection_reason}`
- Join contract: `{join_contract}`
- Shared-state contract: `{shared_state_contract}`
- Coordination budget: `{coordination_budget}`
- Fallback topology: `{fallback_topology}`

## Impact & Risk

- Main coordination risks: `{coordination_risks}`
- Topology trade-offs: `{topology_tradeoffs}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-043

- title: Agent card / capability manifest
- purpose: Provide a structure for compact agent identity, trust-boundary, and capability-fit review
- task_family:
  - `agent_card_review`
  - `capability_manifest`
  - `agent_identity_note`
- structure_type:
  - `identity_then_fit`
  - `manifest_packet_style`
- typical_use_shape: discovered agent review, remote capability handoff, trust-boundary summary
- language_profile: Korean explanation + English identity and capability fields
- output_density: `standard`
- context_contract:
  - required:
    - `agent_name`
    - `capabilities`
    - `interaction_modes`
    - `trust_boundary`
  - optional:
    - `endpoint`
    - `version`
    - `auth_requirements`
    - `trace_identifiers`
  - excluded:
    - live secrets
    - hidden trust assumptions
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{agent_name}`
  - `{endpoint}`
  - `{version}`
  - `{capabilities}`
  - `{interaction_modes}`
  - `{trust_boundary}`
  - `{auth_requirements}`
  - `{trace_identifiers}`
  - `{fit_summary}`
  - `{verification_steps}`
- verification_pattern:
  - `identity_surface_check`
  - `capability_fit_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - label trusted without capability review
  - auth or trust boundary omitted
  - interaction-mode mismatch hidden
- generalization_boundary:
  - full credential dumps
  - broad access approval claims
- artifact_notes:
  - useful when remote or discovered agent identity must remain legible across handoffs
- example_body:
~~~markdown
## Acknowledgment

Reviewing the agent card for `{agent_name}`.

## Analysis

- Endpoint: `{endpoint}`
- Version: `{version}`
- Trust boundary: `{trust_boundary}`

## Execution

- Capabilities: `{capabilities}`
- Interaction modes: `{interaction_modes}`
- Auth requirements: `{auth_requirements}`
- Fit summary: `{fit_summary}`

## Impact & Risk

- Trace identifiers: `{trace_identifiers}`
- Capability risks: `{capability_risks}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-044

- title: Async lifecycle status memo
- purpose: Provide a structure for long-running or partial-state coordination with explicit lifecycle transitions
- task_family:
  - `async_lifecycle_status`
  - `partial_state_tracking`
  - `remote_status_note`
- structure_type:
  - `status_then_transition`
  - `lifecycle_packet_style`
- typical_use_shape: polling status note, streamed-progress checkpoint, push-update integration memo
- language_profile: Korean explanation + English lifecycle and identifier fields
- output_density: `standard`
- context_contract:
  - required:
    - `goal`
    - `task_identifier`
    - `current_state`
    - `next_transition_condition`
  - optional:
    - `interaction_mode`
    - `last_observation`
    - `partial_artifact`
    - `timeout_or_stop`
  - excluded:
    - dispatch treated as completion
    - hidden waiting state
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{goal}`
  - `{task_identifier}`
  - `{interaction_mode}`
  - `{current_state}`
  - `{last_observation}`
  - `{partial_artifact}`
  - `{next_transition_condition}`
  - `{timeout_or_stop}`
  - `{verification_steps}`
- verification_pattern:
  - `lifecycle_state_check`
  - `partial_state_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `low_token`
  - `medium_latency`
- anti_patterns:
  - started reported as done
  - identifier omitted on follow-up path
  - partial artifact phrased as final artifact
- generalization_boundary:
  - hidden scheduler logic
  - raw polling trace dump
- artifact_notes:
  - useful when async or partial-state honesty is more important than polished completion language
- example_body:
~~~markdown
## Acknowledgment

Reporting the async status for `{goal}`.

## Analysis

- Task identifier: `{task_identifier}`
- Interaction mode: `{interaction_mode}`
- Current state: `{current_state}`

## Execution

- Last observation: `{last_observation}`
- Partial artifact: `{partial_artifact}`
- Next transition condition: `{next_transition_condition}`
- Timeout / stop condition: `{timeout_or_stop}`

## Impact & Risk

- Active blockers: `{active_blockers}`
- Partial-state risks: `{partial_state_risks}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-045

- title: Adaptation decision memo
- purpose: Provide a structure for deciding whether a validated signal should change future behavior and at what scope
- task_family:
  - `adaptation_decision`
  - `future_behavior_change`
  - `memory_scope_decision`
- structure_type:
  - `signal_then_scope`
  - `decision_packet_style`
- typical_use_shape: persistent-vs-session decision, bounded self-improvement checkpoint, future-default review
- language_profile: Korean explanation + English signal and scope fields
- output_density: `standard`
- context_contract:
  - required:
    - `signal_summary`
    - `signal_strength`
    - `proposed_change`
    - `selected_scope`
  - optional:
    - `evaluation_basis`
    - `fallback_scope`
    - `drift_risk`
  - excluded:
    - hidden preference hardening
    - unsupported certainty about durability
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{signal_summary}`
  - `{signal_strength}`
  - `{evaluation_basis}`
  - `{proposed_change}`
  - `{selected_scope}`
  - `{fallback_scope}`
  - `{drift_risk}`
  - `{verification_steps}`
- verification_pattern:
  - `signal_strength_check`
  - `scope_fit_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `low_token`
  - `low_latency`
- anti_patterns:
  - one-off noise promoted to persistent change
  - scope choice omitted
  - drift risk hidden
- generalization_boundary:
  - hidden adaptation policy
  - silent behavior hardening
- artifact_notes:
  - useful when future-behavior change must remain explainable and bounded
- example_body:
~~~markdown
## Acknowledgment

Reviewing whether `{proposed_change}` should become future behavior.

## Analysis

- Signal summary: `{signal_summary}`
- Signal strength: `{signal_strength}`
- Evaluation basis: `{evaluation_basis}`

## Execution

- Proposed change: `{proposed_change}`
- Selected scope: `{selected_scope}`
- Fallback scope: `{fallback_scope}`

## Impact & Risk

- Drift risk: `{drift_risk}`
- Scope-change cautions: `{scope_cautions}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-046

- title: Learning-signal review memo
- purpose: Provide a structure for reviewing whether observed signals are strong enough to support adaptation or only transient handling
- task_family:
  - `learning_signal_review`
  - `signal_strength_review`
  - `adaptation_gate`
- structure_type:
  - `signal_inventory_then_gate`
  - `review_packet_style`
- typical_use_shape: repeated-correction review, evaluation-signal review, promotion gate note
- language_profile: Korean explanation + English signal and gate fields
- output_density: `standard`
- context_contract:
  - required:
    - `signal_set`
    - `strength_classification`
    - `promotion_decision`
    - `next_review_trigger`
  - optional:
    - `conflicting_signal`
    - `retention_scope`
    - `evidence_gap`
  - excluded:
    - decorative learning rhetoric
    - silent promotion from weak evidence
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{signal_set}`
  - `{strength_classification}`
  - `{promotion_decision}`
  - `{retention_scope}`
  - `{conflicting_signal}`
  - `{evidence_gap}`
  - `{next_review_trigger}`
  - `{verification_steps}`
- verification_pattern:
  - `signal_classification_check`
  - `promotion_gate_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `low_token`
  - `low_latency`
- anti_patterns:
  - signal inventory missing
  - conflicting signal hidden
  - next review trigger omitted
- generalization_boundary:
  - hidden scoring model
  - adaptive policy takeover
- artifact_notes:
  - useful when learning-signal strength must stay visible before any persistent carryover
- example_body:
~~~markdown
## Acknowledgment

Reviewing the current learning signals.

## Analysis

- Signal set: `{signal_set}`
- Strength classification: `{strength_classification}`
- Conflicting signal: `{conflicting_signal}`

## Execution

- Promotion decision: `{promotion_decision}`
- Retention scope: `{retention_scope}`
- Next review trigger: `{next_review_trigger}`

## Impact & Risk

- Evidence gap: `{evidence_gap}`
- Promotion risks: `{promotion_risks}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-047

- title: Quality iteration checkpoint memo
- purpose: Provide a structure for intermediate quality-gate review that can tighten route choice before another iteration
- task_family:
  - `quality_iteration_checkpoint`
  - `intermediate_quality_gate`
  - `route_reassessment`
- structure_type:
  - `checkpoint_then_decision`
  - `gate_packet_style`
- typical_use_shape: mid-execution quality review, route correction checkpoint, repeated-loop gate note
- language_profile: Korean explanation + English quality and route fields
- output_density: `standard`
- context_contract:
  - required:
    - `quality_surface`
    - `current_result_state`
    - `gate_decision`
    - `next_route`
  - optional:
    - `baseline_reference`
    - `fallback_route`
    - `stop_trigger`
  - excluded:
    - hidden judge prompt
    - raw private reasoning trace
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{quality_surface}`
  - `{current_result_state}`
  - `{baseline_reference}`
  - `{gate_decision}`
  - `{next_route}`
  - `{fallback_route}`
  - `{stop_trigger}`
  - `{verification_steps}`
- verification_pattern:
  - `quality_gate_check`
  - `reroute_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `medium_latency`
- anti_patterns:
  - repeat another iteration without gate decision
  - route correction hidden behind optimism
  - fallback or stop trigger omitted
- generalization_boundary:
  - hidden scoring logic
  - controller-only route policy
- artifact_notes:
  - useful when quality review must change the next iteration rather than merely comment on the last one
- example_body:
~~~markdown
## Acknowledgment

Reviewing the intermediate quality checkpoint.

## Analysis

- Quality surface: `{quality_surface}`
- Current result state: `{current_result_state}`
- Baseline reference: `{baseline_reference}`

## Execution

- Gate decision: `{gate_decision}`
- Next route: `{next_route}`
- Fallback route: `{fallback_route}`
- Stop trigger: `{stop_trigger}`

## Impact & Risk

- Main quality risks: `{quality_risks}`
- Route-change cautions: `{route_change_cautions}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-048

- title: Debate / consensus comparison memo
- purpose: Provide a structure for bounded disagreement handling and convergence review across competing perspectives
- task_family:
  - `debate_consensus_comparison`
  - `comparative_critics`
  - `bounded_disagreement_review`
- structure_type:
  - `position_then_convergence`
  - `comparison_packet_style`
- typical_use_shape: bounded critic comparison, consensus review, unresolved-disagreement memo
- language_profile: Korean explanation + English position and convergence fields
- output_density: `standard`
- context_contract:
  - required:
    - `question_or_goal`
    - `position_a`
    - `position_b`
    - `convergence_state`
  - optional:
    - `decision_axis`
    - `remaining_disagreement`
    - `selected_path`
  - excluded:
    - raw hidden debate transcript
    - uncontrolled branch proliferation
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{question_or_goal}`
  - `{decision_axis}`
  - `{position_a}`
  - `{position_b}`
  - `{convergence_state}`
  - `{remaining_disagreement}`
  - `{selected_path}`
  - `{verification_steps}`
- verification_pattern:
  - `comparative_axis_check`
  - `convergence_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `medium_latency`
- anti_patterns:
  - disagreement hidden in a false consensus
  - comparison axis omitted
  - selected path stronger than the comparison support
- generalization_boundary:
  - hidden chain-of-thought transcript
  - infinite debate loop
- artifact_notes:
  - useful when bounded challenge helps but full branch narration would be wasteful
- example_body:
~~~markdown
## Acknowledgment

Comparing bounded positions for `{question_or_goal}`.

## Analysis

- Decision axis: `{decision_axis}`
- Position A: `{position_a}`
- Position B: `{position_b}`

## Execution

- Convergence state: `{convergence_state}`
- Remaining disagreement: `{remaining_disagreement}`
- Selected path: `{selected_path}`

## Impact & Risk

- Comparison risks: `{comparison_risks}`
- Residual uncertainty: `{residual_uncertainty}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-049

- title: Tool capability contract / precondition memo
- purpose: Provide a structure for making capability contract, preconditions, deterministic support, and approval boundary explicit before tool use
- task_family:
  - `tool_capability_contract`
  - `capability_precondition_review`
  - `interoperability_note`
- structure_type:
  - `capability_then_precondition`
  - `handoff_packet_style`
- typical_use_shape: tool contract clarification, capability-fit note, precondition-sensitive operator handoff
- language_profile: Korean explanation + English capability and contract fields
- output_density: `standard`
- context_contract:
  - required:
    - `intent`
    - `selected_capability`
    - `capability_contract`
    - `precondition_status`
  - optional:
    - `deterministic_support`
    - `approval_boundary`
    - `fallback_capability`
  - excluded:
    - live credentials
    - hidden approval assumptions
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{capability_goal}`
  - `{selected_capability}`
  - `{capability_contract}`
  - `{precondition_status}`
  - `{deterministic_support}`
  - `{approval_boundary}`
  - `{fallback_capability}`
  - `{verification_steps}`
- verification_pattern:
  - `capability_contract_check`
  - `precondition_visibility_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `low_token`
  - `low_latency`
- anti_patterns:
  - capability name shown without contract shape
  - preconditions assumed rather than stated
  - approval boundary hidden on a write-capable path
- generalization_boundary:
  - live secret material
  - hidden policy-only tool logic
- artifact_notes:
  - useful when capability contract clarity is the real blocker rather than tool abundance
- example_body:
~~~markdown
## Acknowledgment

Clarifying the tool contract for `{capability_goal}`.

## Analysis

- Selected capability: `{selected_capability}`
- Capability contract: `{capability_contract}`
- Approval boundary: `{approval_boundary}`

## Execution

- Precondition status: `{precondition_status}`
- Deterministic support: `{deterministic_support}`
- Fallback capability: `{fallback_capability}`

## Impact & Risk

- Contract risks: `{contract_risks}`
- Precondition gaps: `{precondition_gaps}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-050

- title: Evidence target / retrieval-mode memo
- purpose: Provide a structure for clarifying what must be evidenced, which retrieval mode is justified, and how large the evidence pack should be
- task_family:
  - `evidence_target_review`
  - `retrieval_mode_decision`
  - `retrieval_summary`
- structure_type:
  - `target_then_mode`
  - `decision_packet_style`
- typical_use_shape: grounded research kickoff, retrieval escalation note, evidence-boundary handoff
- language_profile: Korean explanation + English retrieval and evidence fields
- output_density: `standard`
- context_contract:
  - required:
    - `question_or_claim`
    - `evidence_target`
    - `selected_retrieval_mode`
    - `evidence_pack_scope`
  - optional:
    - `freshness_boundary`
    - `escalation_trigger`
    - `stop_condition`
  - excluded:
    - giant source dumps
    - hidden source-ranking policy
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{question_or_claim}`
  - `{evidence_target}`
  - `{selected_retrieval_mode}`
  - `{evidence_pack_scope}`
  - `{freshness_boundary}`
  - `{escalation_trigger}`
  - `{stop_condition}`
  - `{verification_steps}`
- verification_pattern:
  - `evidence_target_check`
  - `retrieval_mode_fit_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - retrieval starts with no explicit evidence target
  - retrieval mode escalates with no justification
  - evidence-pack scope remains unbounded
- generalization_boundary:
  - raw private source dumps
  - hidden retrieval policy takeover
- artifact_notes:
  - useful when evidence authority and retrieval escalation must stay inspectable across rounds
- example_body:
~~~markdown
## Acknowledgment

Defining the evidence boundary for `{question_or_claim}`.

## Analysis

- Evidence target: `{evidence_target}`
- Freshness boundary: `{freshness_boundary}`

## Execution

- Selected retrieval mode: `{selected_retrieval_mode}`
- Evidence-pack scope: `{evidence_pack_scope}`
- Escalation trigger: `{escalation_trigger}`
- Stop condition: `{stop_condition}`

## Impact & Risk

- Grounding risks: `{grounding_risks}`
- Coverage gaps: `{coverage_gaps}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051A

- title: Source consultation ledger
- purpose: Provide a structure for preserving consulted-source transparency, query lineage, public/private source mix, and downgraded-source visibility after research synthesis
- task_family:
  - `source_consultation_ledger`
  - `research_transparency_note`
  - `consulted_source_summary`
- structure_type:
  - `source_groups_then_lineage`
  - `ledger_packet_style`
- typical_use_shape: deep research transparency note, MCP-backed research summary, post-synthesis consulted-source ledger
- language_profile: Korean explanation + English source and citation fields
- output_density: `standard`
- context_contract:
  - required:
    - `research_goal`
    - `plan_state`
    - `consulted_source_groups`
    - `citation_state`
  - optional:
    - `public_private_source_mix`
    - `query_lineage_summary`
    - `excluded_or_downgraded_sources`
    - `initial_plan_state`
    - `final_plan_delta`
    - `source_downgrade_rationale`
    - `tool_step_visibility_note`
    - `transparency_sufficiency_note`
    - `next_review_trigger`
  - excluded:
    - raw search transcript
    - raw hidden reasoning trace
    - giant source dump
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{research_goal}`
  - `{plan_state}`
  - `{consulted_source_groups}`
  - `{citation_state}`
  - `{public_private_source_mix}`
  - `{query_lineage_summary}`
  - `{excluded_or_downgraded_sources}`
  - `{initial_plan_state}`
  - `{final_plan_delta}`
  - `{source_downgrade_rationale}`
  - `{tool_step_visibility_note}`
  - `{transparency_sufficiency_note}`
  - `{next_review_trigger}`
  - `{verification_steps}`
- verification_pattern:
  - `consulted_source_group_check`
  - `query_lineage_check`
  - `transparency_surface_check`
- risk_profile:
  - `evidence_sensitive`
  - `workflow_sensitive`
- cost_profile_tags:
  - `low_token`
  - `medium_latency`
- anti_patterns:
  - citation-rich answer with no consulted-source transparency
  - public/private source blend implied but not stated
  - downgraded or excluded sources hidden inside prose
- generalization_boundary:
  - raw proprietary source dump
  - hidden search policy
- artifact_notes:
  - useful when citation support exists but the consulted-source surface itself remains a review boundary
- example_body:
~~~markdown
## Acknowledgment

Recording the consulted-source surface for `{research_goal}`.

## Analysis

- Plan state: `{plan_state}`
- Initial plan state: `{initial_plan_state}`
- Final-plan delta: `{final_plan_delta}`
- Consulted source groups: `{consulted_source_groups}`
- Public/private source mix: `{public_private_source_mix}`

## Execution

- Query-lineage summary: `{query_lineage_summary}`
- Citation state: `{citation_state}`
- Excluded or downgraded sources: `{excluded_or_downgraded_sources}`
- Source-downgrade rationale: `{source_downgrade_rationale}`
- Tool-step visibility: `{tool_step_visibility_note}`
- Transparency sufficiency: `{transparency_sufficiency_note}`
- Next review trigger: `{next_review_trigger}`

## Impact & Risk

- Main transparency risks: `{transparency_risks}`
- Remaining evidence cautions: `{evidence_cautions}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051B

- title: Packet compliance report
- purpose: Audit governance-owned required, recommended, and optional packet coverage and make omission findings explicit
- task_family:
  - `packet_compliance_report`
  - `artifact_floor_review`
  - `packet_coverage_check`
- structure_type:
  - `required_then_findings`
  - `compliance_packet_style`
- typical_use_shape: guide-floor audit, omission-sensitive review, operator-facing observed-vs-required coverage check
- language_profile: Korean explanation + English packet and compliance fields
- output_density: `standard`
- context_contract:
  - required:
    - `task_family`
    - `required_packets`
    - `recommended_packets`
    - `observed_packets`
  - optional:
    - `optional_packets`
    - `omission_findings`
    - `downgraded_claims`
    - `next_fix_trigger`
  - excluded:
    - hidden controller-only packet policy
    - decorative completeness claims
- doctrine_owner:
  - `PROMPT_guideline` direct packet floor matrix
- audit_role:
  - `observed_vs_required_review`
  - `omission_finding`
  - `packet_coverage_audit`
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{task_family}`
  - `{required_packets}`
  - `{recommended_packets}`
  - `{optional_packets}`
  - `{observed_packets}`
  - `{omission_findings}`
  - `{downgraded_claims}`
  - `{next_fix_trigger}`
  - `{verification_steps}`
- verification_pattern:
  - `required_packet_check`
  - `omission_finding_check`
  - `claim_downgrade_check`
- risk_profile:
  - `workflow_sensitive`
  - `release_sensitive`
- cost_profile_tags:
  - `low_token`
  - `low_latency`
- anti_patterns:
  - required packet missing but final claim not downgraded
  - recommended packet absence hidden inside prose
  - packet checklist used with no relation to the actual task family
  - packet floor learned here before consulting the governance-owned matrix
- generalization_boundary:
  - hidden internal policy dump
  - decorative packet scoreboards
- artifact_notes:
  - useful when omission itself is the real finding rather than the content inside a packet
  - use after the governance-owned matrix has already decided the required / recommended / optional packet floor
- example_body:
~~~markdown
## Acknowledgment

Reviewing packet compliance for `{task_family}`.

## Analysis

- Required packets: `{required_packets}`
- Recommended packets: `{recommended_packets}`
- Optional packets: `{optional_packets}`

## Execution

- Observed packets: `{observed_packets}`
- Omission findings: `{omission_findings}`
- Downgraded claims: `{downgraded_claims}`
- Next fix trigger: `{next_fix_trigger}`

## Impact & Risk

- Main compliance risks: `{compliance_risks}`
- Review burden: `{review_burden}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051C

- title: Delegation admission memo
- purpose: Provide a structure for deciding whether fan-out should be allowed before dispatching delegated or parallel work
- task_family:
  - `delegation_admission`
  - `fanout_gate`
  - `coordination_budget_review`
- structure_type:
  - `admission_then_budget`
  - `gate_packet_style`
- typical_use_shape: delegation allow/block decision, bounded parallelism gate, reviewer-load-aware fan-out note
- language_profile: Korean explanation + English delegation and budget fields
- output_density: `standard`
- context_contract:
  - required:
    - `delegation_goal`
    - `candidate_branches`
    - `admission_decision`
    - `join_artifact`
  - optional:
    - `reviewer_load_estimate`
    - `branch_overlap_risk`
    - `trust_boundary_cost`
    - `fallback_route`
  - excluded:
    - hidden coordinator preference
    - dispatch phrased as already justified
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{delegation_goal}`
  - `{candidate_branches}`
  - `{admission_decision}`
  - `{join_artifact}`
  - `{reviewer_load_estimate}`
  - `{branch_overlap_risk}`
  - `{trust_boundary_cost}`
  - `{fallback_route}`
  - `{verification_steps}`
- verification_pattern:
  - `delegation_fit_check`
  - `join_visibility_check`
  - `reviewer_load_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `medium_latency`
- anti_patterns:
  - fan-out approved with no join artifact
  - reviewer burden ignored on a branch-heavy path
  - overlap risk hidden until reintegration
- generalization_boundary:
  - unconstrained delegation policy
  - hidden staffing assumptions
- artifact_notes:
  - useful when the main question is whether to dispatch at all, not yet how to merge outputs
- example_body:
~~~markdown
## Acknowledgment

Reviewing delegation admission for `{delegation_goal}`.

## Analysis

- Candidate branches: `{candidate_branches}`
- Reviewer-load estimate: `{reviewer_load_estimate}`
- Branch-overlap risk: `{branch_overlap_risk}`

## Execution

- Admission decision: `{admission_decision}`
- Join artifact: `{join_artifact}`
- Trust-boundary cost: `{trust_boundary_cost}`
- Fallback route: `{fallback_route}`

## Impact & Risk

- Main delegation risks: `{delegation_risks}`
- Main coordination cautions: `{coordination_cautions}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051D

- title: Join-quality review memo
- purpose: Provide a structure for reviewing whether delegated or parallel outputs are integration-ready and whether the join preserved synthesis integrity
- task_family:
  - `join_quality_review`
  - `integration_ready_check`
  - `synthesis_integrity_note`
- structure_type:
  - `join_then_verdict`
  - `review_packet_style`
- typical_use_shape: delegated-output reintegration review, synthesis readiness note, merge-burden checkpoint
- language_profile: Korean explanation + English join and synthesis fields
- output_density: `standard`
- context_contract:
  - required:
    - `join_goal`
    - `join_inputs`
    - `integration_verdict`
    - `validation_owner`
  - optional:
    - `synthesis_integrity`
    - `unresolved_conflicts`
    - `reviewer_burden`
    - `join_failure_trigger`
  - excluded:
    - raw private branch transcript
    - merge optimism with no stated verdict
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{join_goal}`
  - `{join_inputs}`
  - `{integration_verdict}`
  - `{validation_owner}`
  - `{synthesis_integrity}`
  - `{unresolved_conflicts}`
  - `{reviewer_burden}`
  - `{join_failure_trigger}`
  - `{verification_steps}`
- verification_pattern:
  - `integration_ready_check`
  - `synthesis_integrity_check`
  - `conflict_visibility_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `medium_token`
  - `medium_latency`
- anti_patterns:
  - outputs merged with no integration verdict
  - unresolved conflict hidden behind a summary
  - reviewer burden ignored on a synthesis-heavy path
- generalization_boundary:
  - raw hidden branch transcript
  - automatic merge guarantees
- artifact_notes:
  - useful when join quality rather than branch generation is the real coordination bottleneck
- example_body:
~~~markdown
## Acknowledgment

Reviewing join quality for `{join_goal}`.

## Analysis

- Join inputs: `{join_inputs}`
- Validation owner: `{validation_owner}`
- Reviewer burden: `{reviewer_burden}`

## Execution

- Integration verdict: `{integration_verdict}`
- Synthesis integrity: `{synthesis_integrity}`
- Unresolved conflicts: `{unresolved_conflicts}`
- Join-failure trigger: `{join_failure_trigger}`

## Impact & Risk

- Main join risks: `{join_risks}`
- Reintegration cautions: `{reintegration_cautions}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051E

- title: Release evidence bundle memo
- purpose: Provide a structure for attaching the minimum evidence set required to support a release, promotion, or hold decision
- task_family:
  - `release_evidence_bundle`
  - `promotion_attachment_set`
  - `gate_support_packet`
- structure_type:
  - `bundle_then_verdict`
  - `evidence_packet_style`
- typical_use_shape: release gate attachment set, promotion support memo, hold-decision evidence bundle
- language_profile: Korean explanation + English evidence and gate fields
- output_density: `standard`
- context_contract:
  - required:
    - `release_goal`
    - `packet_coverage_snapshot`
    - `behavior_replay_summary`
    - `gate_recommendation`
  - optional:
    - `regression_findings`
    - `known_limitations`
    - `high_risk_gaps`
    - `next_gate_trigger`
  - excluded:
    - decorative confidence narrative
    - hidden supporting evidence
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{release_goal}`
  - `{packet_coverage_snapshot}`
  - `{behavior_replay_summary}`
  - `{regression_findings}`
  - `{known_limitations}`
  - `{high_risk_gaps}`
  - `{gate_recommendation}`
  - `{next_gate_trigger}`
  - `{verification_steps}`
- verification_pattern:
  - `evidence_bundle_check`
  - `replay_support_check`
  - `gate_attachment_check`
- risk_profile:
  - `release_sensitive`
  - `high`
- cost_profile_tags:
  - `medium_token`
  - `verification_heavy`
- anti_patterns:
  - release recommendation with no attached replay summary
  - packet coverage claimed but not shown
  - known high-risk gaps omitted from the bundle
- generalization_boundary:
  - actual release approval without real evidence
  - hidden benchmark or audit artifacts
- artifact_notes:
  - useful when release review must be backed by an explicit evidence attachment set rather than summary prose
- example_body:
~~~markdown
## Acknowledgment

Preparing the release evidence bundle for `{release_goal}`.

## Analysis

- Packet coverage snapshot: `{packet_coverage_snapshot}`
- Behavior replay summary: `{behavior_replay_summary}`
- Regression findings: `{regression_findings}`

## Execution

- Known limitations: `{known_limitations}`
- High-risk gaps: `{high_risk_gaps}`
- Gate recommendation: `{gate_recommendation}`
- Next gate trigger: `{next_gate_trigger}`

## Impact & Risk

- Main release risks: `{release_risks}`
- Evidence cautions: `{evidence_cautions}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051

- title: Memory scope / checkpoint profile memo
- purpose: Provide a structure for choosing memory scope, checkpoint packaging, and persistence boundary without silently promoting state
- task_family:
  - `memory_scope_profile`
  - `checkpoint_profile_note`
  - `memory_scope_decision`
- structure_type:
  - `scope_then_checkpoint`
  - `decision_packet_style`
- typical_use_shape: long-running task continuity note, memory-typing decision, checkpoint packaging handoff
- language_profile: Korean explanation + English memory and checkpoint fields
- output_density: `standard`
- context_contract:
  - required:
    - `memory_need`
    - `selected_scope`
    - `checkpoint_profile`
    - `persistence_boundary`
  - optional:
    - `retained_items`
    - `downgraded_items`
    - `next_review_trigger`
  - excluded:
    - hidden persistence promotion
    - unsupported durability claims
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{memory_need}`
  - `{selected_scope}`
  - `{checkpoint_profile}`
  - `{persistence_boundary}`
  - `{retained_items}`
  - `{downgraded_items}`
  - `{next_review_trigger}`
  - `{verification_steps}`
- verification_pattern:
  - `memory_scope_check`
  - `checkpoint_profile_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `low_token`
  - `low_latency`
- anti_patterns:
  - memory scope implied but not stated
  - checkpoint profile too vague for recovery
  - persistence boundary hidden during a long-running loop
- generalization_boundary:
  - silent durable memory promotion
  - hidden adaptation defaults
- artifact_notes:
  - useful when continuity packaging is the actual control problem rather than final answer wording
- example_body:
~~~markdown
## Acknowledgment

Reviewing the memory profile for `{memory_need}`.

## Analysis

- Selected scope: `{selected_scope}`
- Persistence boundary: `{persistence_boundary}`

## Execution

- Checkpoint profile: `{checkpoint_profile}`
- Retained items: `{retained_items}`
- Downgraded items: `{downgraded_items}`
- Next review trigger: `{next_review_trigger}`

## Impact & Risk

- Continuity risks: `{continuity_risks}`
- Drift cautions: `{drift_cautions}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-052

- title: Operational substrate readiness memo
- purpose: Provide a structure for evaluating whether data, metadata, APIs, audit signals, rollback options, and shared ontology are agent-ready enough for the intended autonomy level
- task_family:
  - `substrate_readiness_review`
  - `agent_ready_surface_check`
  - `autonomy_boundary_note`
- structure_type:
  - `surface_then_boundary`
  - `readiness_packet_style`
- typical_use_shape: tool adoption review, MCP/server readiness check, orchestration substrate review, release-readiness subcheck
- language_profile: Korean explanation + English surface and boundary fields
- output_density: `standard`
- context_contract:
  - required:
    - `goal`
    - `target_surface`
    - `readiness_summary`
    - `autonomy_boundary`
  - optional:
    - `metadata_or_schema_state`
    - `audit_signal_state`
    - `rollback_or_checkpoint_state`
    - `shared_ontology_state`
    - `narrower_fallback`
  - excluded:
    - hidden approval assumptions
    - decorative readiness optimism
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{goal}`
  - `{target_surface}`
  - `{readiness_summary}`
  - `{metadata_or_schema_state}`
  - `{audit_signal_state}`
  - `{rollback_or_checkpoint_state}`
  - `{shared_ontology_state}`
  - `{autonomy_boundary}`
  - `{narrower_fallback}`
  - `{verification_steps}`
- verification_pattern:
  - `substrate_readiness_check`
  - `autonomy_boundary_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `low_token`
  - `low_latency`
- anti_patterns:
  - declaring a surface agent-ready without audit or rollback visibility
  - leaving metadata or schema instability implicit
  - widening autonomy despite weak substrate signals
- generalization_boundary:
  - actual security certification
  - hidden environment assumptions
- artifact_notes:
  - useful when substrate adequacy itself is the control boundary instead of final-answer wording
- example_body:
~~~markdown
## Acknowledgment

Reviewing substrate readiness for `{goal}`.

## Analysis

- Target surface: `{target_surface}`
- Readiness summary: `{readiness_summary}`
- Metadata / schema state: `{metadata_or_schema_state}`
- Audit signal state: `{audit_signal_state}`

## Execution

- Rollback / checkpoint state: `{rollback_or_checkpoint_state}`
- Shared ontology state: `{shared_ontology_state}`
- Autonomy boundary: `{autonomy_boundary}`
- Narrower fallback: `{narrower_fallback}`

## Impact & Risk

- Main readiness risks: `{readiness_risks}`
- Blocking gaps: `{blocking_gaps}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-053

- title: Lifecycle event / audit trail memo
- purpose: Provide a structure for preserving ordered state transitions, trace identifiers, and recovery-relevant events when current-state-only status is insufficient
- task_family:
  - `lifecycle_event_audit`
  - `transition_trace_note`
  - `partial_state_audit`
- structure_type:
  - `timeline_then_state`
  - `audit_packet_style`
- typical_use_shape: async execution audit, MCP/tool transition note, A2A lifecycle reconstruction memo, safety-restriction transition trace
- language_profile: Korean explanation + English lifecycle and identifier fields
- output_density: `standard`
- context_contract:
  - required:
    - `goal`
    - `task_identifier`
    - `current_state`
    - `transition_summary`
  - optional:
    - `trace_identifiers`
    - `latest_partial_artifact`
    - `restriction_changes`
    - `recovery_event`
    - `next_review_trigger`
  - excluded:
    - raw polling trace dump
    - hidden scheduler logic
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{goal}`
  - `{task_identifier}`
  - `{current_state}`
  - `{transition_summary}`
  - `{trace_identifiers}`
  - `{latest_partial_artifact}`
  - `{restriction_changes}`
  - `{recovery_event}`
  - `{next_review_trigger}`
  - `{verification_steps}`
- verification_pattern:
  - `transition_order_check`
  - `traceability_check`
- risk_profile:
  - `workflow_sensitive`
  - `medium`
- cost_profile_tags:
  - `low_token`
  - `medium_latency`
- anti_patterns:
  - current state shown without transition history when reconstruction matters
  - trace identifiers omitted on a revisited async path
  - restriction or recovery changes hidden inside prose
- generalization_boundary:
  - full raw execution logs
  - invisible replay controller logic
- artifact_notes:
  - useful when reconstructible lifecycle history matters more than polished completion wording
- example_body:
~~~markdown
## Acknowledgment

Recording the lifecycle audit trail for `{goal}`.

## Analysis

- Task identifier: `{task_identifier}`
- Current state: `{current_state}`
- Transition summary: `{transition_summary}`
- Trace identifiers: `{trace_identifiers}`

## Execution

- Latest partial artifact: `{latest_partial_artifact}`
- Restriction changes: `{restriction_changes}`
- Recovery event: `{recovery_event}`
- Next review trigger: `{next_review_trigger}`

## Impact & Risk

- Main auditability risks: `{auditability_risks}`
- Remaining ambiguities: `{remaining_ambiguities}`

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

### ENTRY:EX-051F

- title: Benchmark registry memo
- purpose: Provide a structure for defining a versioned benchmark or replay suite before comparative claims are made
- task_family:
  - `benchmark_registry`
  - `benchmark_memo`
  - `release_review`
- structure_type:
  - `report_style`
  - `scorecard_style`
- typical_use_shape: benchmark cohort definition, replay suite registry, scenario inventory memo
- language_profile: Korean explanation + English benchmark and cohort fields
- output_density: `standard`
- context_contract:
  - required:
    - `registry_scope`
    - `scenario_inventory`
    - `cohort_boundary`
    - `expected_packet_floor`
  - optional:
    - `expected_route_classes`
    - `expected_failure_classes`
    - `replay_support_state`
  - excluded:
    - performance claims with no scenario identity
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{registry_scope}`
  - `{scenario_inventory}`
  - `{cohort_boundary}`
  - `{expected_packet_floor}`
  - `{verification_step_1}`
  - `{verification_step_2}`
  - `{verification_step_3}`
- verification_pattern:
  - `scenario_identity_check`
  - `cohort_boundary_check`
- risk_profile:
  - `medium`
  - `comparison_sensitive`
- cost_profile_tags:
  - `evaluation_heavy`
  - `registry_oriented`
- anti_patterns:
  - benchmark claim with no scenario registry
  - replay statement with no coverage note
- generalization_boundary:
  - does not prove benchmark results by itself
- artifact_notes:
  - use before comparative score claims when benchmark scope itself is the control issue
- example_body:
~~~markdown
## Acknowledgment

Defining the benchmark registry for `{registry_scope}`.

## Analysis

- Cohort boundary: `{cohort_boundary}`
- Expected packet floor: `{expected_packet_floor}`

## Execution

- Scenario inventory: `{scenario_inventory}`

## Impact & Risk

- Main registry risk: missing or unstable scenario labeling

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051FA

- title: Guide reflection benchmark memo
- purpose: Provide a structure for benchmarking whether actual prompt surfaces still answer guide-governed chapter families directly, truthfully, and with the right owner boundary
- task_family:
  - `guide_reflection_benchmark`
  - `chapter_reflection_review`
  - `prompt_stack_review`
- structure_type:
  - `scorecard_style`
  - `artifact_review_style`
- typical_use_shape: chapter-family benchmark run, guide-versus-runtime parity check, prompt-stack maintenance loop
- language_profile: Korean explanation + English chapter, verdict, and artifact fields
- output_density: `standard`
- context_contract:
  - required:
    - `guide_scope`
    - `chapter_family`
    - `benchmark_question`
    - `runtime_answer_surface`
    - `guide_expectation`
  - optional:
    - `answer_summary`
    - `alignment_verdict`
    - `gap_type`
    - `patch_target`
    - `rerun_trigger`
    - `stop_rule_state`
  - excluded:
    - keyword-hit counts presented as semantic reflection
    - operator-only docs presented as the runtime answer surface
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{guide_scope}`
  - `{chapter_family}`
  - `{benchmark_question}`
  - `{runtime_answer_surface}`
  - `{guide_expectation}`
  - `{answer_summary}`
  - `{alignment_verdict}`
  - `{gap_type}`
  - `{patch_target}`
  - `{rerun_trigger}`
  - `{stop_rule_state}`
  - `{verification_step_1}`
  - `{verification_step_2}`
  - `{verification_step_3}`
- verification_pattern:
  - `question_answerability_check`
  - `guide_alignment_check`
  - `runtime_owner_check`
  - `rerun_trigger_check`
- risk_profile:
  - `workflow_sensitive`
  - `comparison_sensitive`
- cost_profile_tags:
  - `evaluation_heavy`
  - `maintenance_oriented`
- anti_patterns:
  - chapter-family parity claimed from keyword presence only
  - operator-facing guide or runtime-help text treated as the actual performance surface
  - stale ownership claim left alive after a patch round
  - rerun verdict changed by swapping the question set instead of improving the runtime surface
- generalization_boundary:
  - does not by itself prove live model replay or benchmark execution
- artifact_notes:
  - use when the real maintenance problem is guide reflection across runtime docs rather than only packet presence or release recommendation
  - useful before stronger release or promotion language when a benchmark loop is still document-grounded
  - lighter sibling: `Benchmark registry memo`; stronger siblings: `Benchmark cohort manifest`, `Replay runner verdict sheet`, and `Replay suite verdict memo` when the task has moved from document parity into assembled replay
- example_body:
~~~markdown
## Acknowledgment

Benchmarking `{chapter_family}` reflection for `{guide_scope}`.

## Analysis

- Benchmark question: `{benchmark_question}`
- Runtime answer surface: `{runtime_answer_surface}`
- Guide expectation: `{guide_expectation}`

## Execution

- Answer summary: `{answer_summary}`
- Alignment verdict: `{alignment_verdict}`
- Gap type: `{gap_type}`
- Patch target: `{patch_target}`
- Rerun trigger: `{rerun_trigger}`

## Impact & Risk

- Main reflection risk: `{main_reflection_risk}`
- Stop-rule state: `{stop_rule_state}`

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051G

- title: Context sufficiency review memo
- purpose: Provide a structure for reviewing whether context packaging is sufficient, overloaded, or stale for the intended task
- task_family:
  - `context_sufficiency_review`
  - `context_engineering_note`
- structure_type:
  - `report_style`
  - `context_pack_style`
- typical_use_shape: context gate, stale-context check, briefing sufficiency review
- language_profile: Korean explanation + English context labels
- output_density: `standard`
- context_contract:
  - required:
    - `task_scope`
    - `context_pack_summary`
    - `active_slice_summary`
    - `sufficiency_verdict`
  - optional:
    - `overload_risks`
    - `stale_context_risks`
    - `missing_brief_items`
  - excluded:
    - full raw context replay
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{task_scope}`
  - `{context_pack_summary}`
  - `{active_slice_summary}`
  - `{sufficiency_verdict}`
  - `{verification_step_1}`
  - `{verification_step_2}`
  - `{verification_step_3}`
- verification_pattern:
  - `context_pack_check`
  - `missing_input_check`
- risk_profile:
  - `medium`
  - `execution_sensitive`
- cost_profile_tags:
  - `context_heavy`
- anti_patterns:
  - blaming model quality for missing context
  - stale-context risk with no note
- generalization_boundary:
  - does not replace evidence review
- artifact_notes:
  - useful when context engineering quality is itself the review target
- example_body:
~~~markdown
## Acknowledgment

Reviewing context sufficiency for `{task_scope}`.

## Analysis

- Context Pack: `{context_pack_summary}`
- Active Slice: `{active_slice_summary}`

## Execution

- Sufficiency verdict: `{sufficiency_verdict}`

## Impact & Risk

- Main risks: overload, stale context, or missing brief items

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051H

- title: Critique quality review memo
- purpose: Provide a structure for judging critique usefulness, no-gain-loop risk, and reroute-after-critique quality
- task_family:
  - `critique_quality_review`
  - `rubric_evaluation`
- structure_type:
  - `report_style`
  - `scorecard_style`
- typical_use_shape: reflection review, no-gain-loop gate, reroute quality memo
- language_profile: Korean explanation + English critique fields
- output_density: `standard`
- context_contract:
  - required:
    - `review_scope`
    - `producer_artifact`
    - `critique_quality_note`
    - `loop_stop_state`
  - optional:
    - `reroute_signal`
    - `no_gain_evidence`
  - excluded:
    - raw hidden reasoning trace
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{review_scope}`
  - `{producer_artifact}`
  - `{critique_quality_note}`
  - `{loop_stop_state}`
  - `{verification_step_1}`
  - `{verification_step_2}`
  - `{verification_step_3}`
- verification_pattern:
  - `criteria_visibility_check`
  - `loop_gain_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `reflection_heavy`
- anti_patterns:
  - critique count treated as quality
  - no-gain loop with no stop note
- generalization_boundary:
  - does not replace task-domain verification
- artifact_notes:
  - useful when critique governance rather than final content is under review
- example_body:
~~~markdown
## Acknowledgment

Reviewing critique quality for `{review_scope}`.

## Analysis

- Producer artifact: `{producer_artifact}`
- Critique quality: `{critique_quality_note}`

## Execution

- Loop stop state: `{loop_stop_state}`

## Impact & Risk

- Main risk: repeated critique with no material route change

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051I

- title: Adaptation promotion review memo
- purpose: Provide a structure for judging whether an adaptation should be promoted, deferred, rolled back, or kept session-local
- task_family:
  - `adaptation_promotion_review`
  - `rubric_evaluation`
- structure_type:
  - `report_style`
  - `decision_then_rationale`
- typical_use_shape: promotion threshold review, rollback trigger review, drift suspicion memo
- language_profile: Korean explanation + English adaptation fields
- output_density: `standard`
- context_contract:
  - required:
    - `adaptation_scope`
    - `promotion_threshold`
    - `rollback_threshold`
    - `promotion_recommendation`
  - optional:
    - `signal_strength_summary`
    - `drift_risks`
  - excluded:
    - silent default mutation
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{adaptation_scope}`
  - `{promotion_threshold}`
  - `{rollback_threshold}`
  - `{promotion_recommendation}`
  - `{verification_step_1}`
  - `{verification_step_2}`
  - `{verification_step_3}`
- verification_pattern:
  - `threshold_presence_check`
  - `rollback_trigger_check`
- risk_profile:
  - `high`
  - `drift_sensitive`
- cost_profile_tags:
  - `adaptation_heavy`
- anti_patterns:
  - promotion with no rollback threshold
  - one-off success treated as durable default
- generalization_boundary:
  - does not authorize adaptation by itself
- artifact_notes:
  - pair with `Adaptation decision memo` when future behavior actually changes
- example_body:
~~~markdown
## Acknowledgment

Reviewing adaptation promotion for `{adaptation_scope}`.

## Analysis

- Promotion threshold: `{promotion_threshold}`
- Rollback threshold: `{rollback_threshold}`

## Execution

- Recommendation: `{promotion_recommendation}`

## Impact & Risk

- Main risk: adaptation drift or premature persistence

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051J

- title: Route-quality scorecard
- purpose: Provide a structure for scoring route quality, prioritization quality, exploration depth, and fallback efficiency
- task_family:
  - `route_quality_scorecard`
  - `evaluation_scorecard`
- structure_type:
  - `scorecard_style`
  - `compare_then_judge`
- typical_use_shape: route review, prioritization scorecard, exploration governance memo
- language_profile: Korean explanation + English score labels
- output_density: `standard`
- context_contract:
  - required:
    - `decision_scope`
    - `route_quality_score`
    - `prioritization_quality_score`
    - `exploration_depth_note`
  - optional:
    - `clarification_vs_exploration_note`
    - `fallback_efficiency_note`
  - excluded:
    - unexplained hindsight praise
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{decision_scope}`
  - `{route_quality_score}`
  - `{prioritization_quality_score}`
  - `{exploration_depth_note}`
  - `{verification_step_1}`
  - `{verification_step_2}`
  - `{verification_step_3}`
- verification_pattern:
  - `score_anchor_check`
  - `fallback_note_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `decision_heavy`
- anti_patterns:
  - route quality inferred only from polish
  - no clarification-vs-exploration note on ambiguous tasks
- generalization_boundary:
  - does not replace domain correctness checks
- artifact_notes:
  - useful when route choice quality is the live review target
- example_body:
~~~markdown
## Acknowledgment

Scoring route quality for `{decision_scope}`.

## Analysis

- Route quality: `{route_quality_score}`
- Prioritization quality: `{prioritization_quality_score}`

## Execution

- Exploration depth note: `{exploration_depth_note}`

## Impact & Risk

- Main risk: poor route masked by strong prose

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051K

- title: Coding benchmark scenario memo
- purpose: Provide a structure for defining repo-scale coding benchmark scope and verification-running expectations
- task_family:
  - `coding_benchmark_scenario`
  - `agentic_coding_review`
- structure_type:
  - `report_style`
  - `diff_focused_style`
- typical_use_shape: coding benchmark setup, verification-running contract, repo-scale scenario memo
- language_profile: Korean explanation + English coding and verification fields
- output_density: `standard`
- context_contract:
  - required:
    - `scenario_scope`
    - `repo_slice`
    - `verification_running_policy`
    - `success_proxy`
  - optional:
    - `briefing_requirements`
    - `human_gate_owner`
    - `known_execution_limits`
  - excluded:
    - test claim with no execution note
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{scenario_scope}`
  - `{repo_slice}`
  - `{verification_running_policy}`
  - `{success_proxy}`
  - `{verification_step_1}`
  - `{verification_step_2}`
  - `{verification_step_3}`
- verification_pattern:
  - `scenario_scope_check`
  - `verification_policy_check`
- risk_profile:
  - `high`
  - `engineering_sensitive`
- cost_profile_tags:
  - `coding_heavy`
  - `verification_sensitive`
- anti_patterns:
  - repo-scale claim with no scenario scope
  - engineering proof implied from static plausibility alone
- generalization_boundary:
  - does not replace actual code execution results
- artifact_notes:
  - useful when coding proof surface rather than one patch summary is under review
- example_body:
~~~markdown
## Acknowledgment

Defining the coding benchmark scenario for `{scenario_scope}`.

## Analysis

- Repo slice: `{repo_slice}`
- Verification-running policy: `{verification_running_policy}`

## Execution

- Success proxy: `{success_proxy}`

## Impact & Risk

- Main risk: repo-scale claim with under-specified verification

## Verification

- Check by:
  1. `{verification_step_1}`
  2. `{verification_step_2}`
  3. `{verification_step_3}`
~~~

---

### ENTRY:EX-051L

- title: Benchmark execution report
- purpose: Provide a structure for reporting executed benchmark results, cohort boundaries, and execution-state caveats
- task_family:
  - `benchmark_execution_report`
  - `benchmark_memo`
- structure_type:
  - `report_style`
  - `scorecard_style`
- typical_use_shape: executed benchmark result, cohort verdict, benchmark run summary
- language_profile: Korean explanation + English benchmark and cohort fields
- output_density: `standard`
- context_contract:
  - required:
    - `benchmark_scope`
    - `executed_cohort`
    - `benchmark_execution_state`
    - `benchmark_verdict`
  - optional:
    - `unexecuted_slices`
    - `confidence_class`
  - excluded:
    - registry-only prose presented as executed result
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{benchmark_scope}`
  - `{executed_cohort}`
  - `{benchmark_execution_state}`
  - `{benchmark_verdict}`
- verification_pattern:
  - `execution_state_check`
- risk_profile:
  - `high`
- cost_profile_tags:
  - `evaluation_heavy`
- anti_patterns:
  - benchmark registry presented as executed evidence
- generalization_boundary:
  - does not replace raw benchmark infrastructure
- artifact_notes:
  - use when actual execution state changes claim strength
- example_body:
~~~markdown
## Acknowledgment

Reporting the benchmark execution for `{benchmark_scope}`.

## Analysis

- Executed cohort: `{executed_cohort}`
- Execution state: `{benchmark_execution_state}`

## Execution

- Verdict: `{benchmark_verdict}`

## Impact & Risk

- Main risk: execution coverage may still be partial

## Verification

- Check that executed and unexecuted slices remain distinct.
~~~

---

### ENTRY:EX-051M

- title: Replay suite verdict memo
- purpose: Provide a structure for reporting replay execution state, reproducibility notes, and replay verdict
- task_family:
  - `replay_suite_verdict`
  - `trajectory_artifact_report`
- structure_type:
  - `report_style`
- typical_use_shape: replay suite result, reproducibility review, scenario verdict memo
- language_profile: Korean explanation + English replay fields
- output_density: `standard`
- context_contract:
  - required:
    - `replay_scope`
    - `replay_execution_state`
    - `replay_verdict`
  - optional:
    - `reproducibility_note`
    - `partial_replay_note`
  - excluded:
    - scenario-ready but unexecuted replay prose
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{replay_scope}`
  - `{replay_execution_state}`
  - `{replay_verdict}`
- verification_pattern:
  - `replay_state_check`
- risk_profile:
  - `high`
- cost_profile_tags:
  - `evaluation_heavy`
- anti_patterns:
  - replay-ready scenario list treated as replay verdict
- generalization_boundary:
  - does not replace raw replay logs
- artifact_notes:
  - use when replay execution state must stay auditable
- example_body:
~~~markdown
## Acknowledgment

Reviewing the replay verdict for `{replay_scope}`.

## Analysis

- Replay execution state: `{replay_execution_state}`

## Execution

- Replay verdict: `{replay_verdict}`

## Impact & Risk

- Main risk: verdict may overstate reproducibility if replay coverage is partial

## Verification

- Check that replay execution state is explicit.
~~~

---

### ENTRY:EX-051N

- title: Context failure taxonomy memo
- purpose: Provide a structure for classifying context substrate failure modes before blaming the model or search path alone
- task_family:
  - `context_failure_taxonomy`
  - `context_engineering_note`
- structure_type:
  - `report_style`
- typical_use_shape: context diagnosis, substrate failure memo, context regression review
- language_profile: Korean explanation + English failure labels
- output_density: `standard`
- context_contract:
  - required:
    - `task_scope`
    - `failure_class`
    - `context_evidence`
  - optional:
    - `alternate_failure_classes`
  - excluded:
    - vague context complaint with no class
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{task_scope}`
  - `{failure_class}`
  - `{context_evidence}`
- verification_pattern:
  - `failure_class_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `context_heavy`
- anti_patterns:
  - calling every miss under-context
- generalization_boundary:
  - does not replace model or evidence diagnosis
- artifact_notes:
  - use when context substrate is the live diagnosis surface
- example_body:
~~~markdown
## Acknowledgment

Classifying the context failure for `{task_scope}`.

## Analysis

- Failure class: `{failure_class}`

## Execution

- Context evidence: `{context_evidence}`

## Impact & Risk

- Main risk: wrong diagnosis may send later fixes to the wrong layer

## Verification

- Check that one primary failure class is explicit.
~~~

---

### ENTRY:EX-051O

- title: Critique utility scorecard
- purpose: Provide a structure for scoring how much critique materially improved the artifact or route
- task_family:
  - `critique_utility_scorecard`
  - `rubric_evaluation`
- structure_type:
  - `scorecard_style`
- typical_use_shape: critique delta review, refinement utility scorecard
- language_profile: Korean explanation + English score labels
- output_density: `standard`
- context_contract:
  - required:
    - `artifact_scope`
    - `critique_delta`
    - `utility_score`
  - optional:
    - `reroute_effect`
  - excluded:
    - critique presence treated as utility
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{artifact_scope}`
  - `{critique_delta}`
  - `{utility_score}`
- verification_pattern:
  - `delta_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `reflection_heavy`
- anti_patterns:
  - score with no delta note
- generalization_boundary:
  - does not replace task outcome verification
- artifact_notes:
  - use when critique value itself is the review target
- example_body:
~~~markdown
## Acknowledgment

Scoring critique utility for `{artifact_scope}`.

## Analysis

- Critique delta: `{critique_delta}`

## Execution

- Utility score: `{utility_score}`

## Impact & Risk

- Main risk: expensive critique loop with no real gain

## Verification

- Check that a material delta exists if the score is strong.
~~~

---

### ENTRY:EX-051P

- title: Adaptation lifecycle state memo
- purpose: Provide a structure for tracking whether an adaptation is a candidate, in trial, promoted, quarantined, or rolled back
- task_family:
  - `adaptation_lifecycle_state`
  - `adaptation_promotion_review`
- structure_type:
  - `report_style`
- typical_use_shape: adaptation lifecycle tracking, rollback status memo
- language_profile: Korean explanation + English lifecycle labels
- output_density: `standard`
- context_contract:
  - required:
    - `adaptation_scope`
    - `lifecycle_state`
    - `state_rationale`
  - optional:
    - `rollback_trigger`
    - `quarantine_note`
  - excluded:
    - threshold-only prose with no state
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{adaptation_scope}`
  - `{lifecycle_state}`
  - `{state_rationale}`
- verification_pattern:
  - `lifecycle_state_check`
- risk_profile:
  - `high`
- cost_profile_tags:
  - `adaptation_heavy`
- anti_patterns:
  - promoted state with no rollback path
- generalization_boundary:
  - does not itself authorize promotion
- artifact_notes:
  - use when future behavior has already entered operational control
- example_body:
~~~markdown
## Acknowledgment

Tracking the adaptation lifecycle for `{adaptation_scope}`.

## Analysis

- Lifecycle state: `{lifecycle_state}`

## Execution

- State rationale: `{state_rationale}`

## Impact & Risk

- Main risk: lifecycle ambiguity can hide drift or unsafe persistence

## Verification

- Check that lifecycle state is explicit and singular.
~~~

---

### ENTRY:EX-051Q

- title: Route re-prioritization audit memo
- purpose: Provide a structure for reviewing route-switch triggers, fallback timing, and re-prioritization quality
- task_family:
  - `route_reprioritization_audit`
  - `route_quality_scorecard`
- structure_type:
  - `report_style`
- typical_use_shape: route-switch review, re-prioritization audit, fallback timing memo
- language_profile: Korean explanation + English route fields
- output_density: `standard`
- context_contract:
  - required:
    - `decision_scope`
    - `route_switch_trigger`
    - `reprioritization_verdict`
  - optional:
    - `fallback_outcome`
    - `timing_note`
  - excluded:
    - route praise with no switch trigger
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{decision_scope}`
  - `{route_switch_trigger}`
  - `{reprioritization_verdict}`
- verification_pattern:
  - `trigger_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `decision_heavy`
- anti_patterns:
  - route switch described only retrospectively
- generalization_boundary:
  - does not replace domain correctness evaluation
- artifact_notes:
  - use when route switching quality is itself the comparison target
- example_body:
~~~markdown
## Acknowledgment

Auditing re-prioritization for `{decision_scope}`.

## Analysis

- Route switch trigger: `{route_switch_trigger}`

## Execution

- Re-prioritization verdict: `{reprioritization_verdict}`

## Impact & Risk

- Main risk: late or weak route switching may waste budget

## Verification

- Check that the trigger and verdict are both explicit.
~~~

---

### ENTRY:EX-051R

- title: Coding proof bundle memo
- purpose: Provide a structure for packaging engineering proof while keeping executed and unexecuted claims separate
- task_family:
  - `coding_proof_bundle`
  - `agentic_coding_review`
- structure_type:
  - `diff_focused_style`
  - `report_style`
- typical_use_shape: engineering proof packet, diff-quality audit, executed-vs-unexecuted coding review
- language_profile: Korean explanation + English engineering fields
- output_density: `standard`
- context_contract:
  - required:
    - `repo_slice`
    - `executed_vs_unexecuted_state`
    - `proof_summary`
  - optional:
    - `diff_quality_note`
    - `verification_limitations`
  - excluded:
    - executed proof implied from static plausibility alone
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{repo_slice}`
  - `{executed_vs_unexecuted_state}`
  - `{proof_summary}`
- verification_pattern:
  - `execution_state_check`
- risk_profile:
  - `high`
- cost_profile_tags:
  - `coding_heavy`
- anti_patterns:
  - executed and unexecuted evidence blended together
- generalization_boundary:
  - does not replace raw execution logs
- artifact_notes:
  - use when coding proof must stay honest under partial execution
- example_body:
~~~markdown
## Acknowledgment

Packaging coding proof for `{repo_slice}`.

## Analysis

- Executed-vs-unexecuted: `{executed_vs_unexecuted_state}`

## Execution

- Proof summary: `{proof_summary}`

## Impact & Risk

- Main risk: proof quality may be overstated if execution state is blurred

## Verification

- Check that executed and unexecuted claims remain separated.
~~~

---

### ENTRY:EX-051S

- title: Release evidence bundle v2
- purpose: Provide a structure for integrating benchmark, replay, context, critique, adaptation, and coding-proof evidence into one promotion packet
- task_family:
  - `release_evidence_bundle_v2`
  - `release_review`
- structure_type:
  - `release_gate_style`
- typical_use_shape: integrated promotion packet, confidence-classed release bundle
- language_profile: Korean explanation + English evidence and gate fields
- output_density: `standard`
- context_contract:
  - required:
    - `release_goal`
    - `integrated_evidence_summary`
    - `release_recommendation_confidence_class`
  - optional:
    - `benchmark_state`
    - `replay_state`
    - `coding_proof_state`
  - excluded:
    - confidence with no evidence integration
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{release_goal}`
  - `{integrated_evidence_summary}`
  - `{release_recommendation_confidence_class}`
- verification_pattern:
  - `evidence_integration_check`
- risk_profile:
  - `high`
- cost_profile_tags:
  - `release_sensitive`
- anti_patterns:
  - release confidence stated with no integrated evidence basis
- generalization_boundary:
  - does not replace underlying evidence artifacts
- artifact_notes:
  - use when promotion depends on more than one evidence surface
- example_body:
~~~markdown
## Acknowledgment

Preparing the integrated release evidence bundle for `{release_goal}`.

## Analysis

- Integrated evidence summary: `{integrated_evidence_summary}`

## Execution

- Release recommendation confidence class: `{release_recommendation_confidence_class}`

## Impact & Risk

- Main risk: integrated evidence may still be uneven across surfaces

## Verification

- Check that confidence class is traceable to actual evidence surfaces.
~~~

---

### ENTRY:EX-051T

- title: Telemetry trend memo
- purpose: Provide a structure for reviewing cohort-aware telemetry, trend movement, and drift risk over time
- task_family:
  - `telemetry_trend`
  - `evaluation_scorecard`
- structure_type:
  - `scorecard_style`
- typical_use_shape: telemetry trend review, drift memo, cohort-aware monitoring summary
- language_profile: Korean explanation + English metric labels
- output_density: `standard`
- context_contract:
  - required:
    - `trend_scope`
    - `cohort_telemetry_summary`
    - `drift_verdict`
  - optional:
    - `reviewer_burden_trend`
    - `replay_coverage_trend`
  - excluded:
    - snapshot-only metric note presented as trend
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{trend_scope}`
  - `{cohort_telemetry_summary}`
  - `{drift_verdict}`
- verification_pattern:
  - `trend_window_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `monitoring_heavy`
- anti_patterns:
  - one data point treated as trend
- generalization_boundary:
  - does not replace raw monitoring data
- artifact_notes:
  - use when longitudinal movement, not just one score, is the real issue
- example_body:
~~~markdown
## Acknowledgment

Reviewing telemetry trends for `{trend_scope}`.

## Analysis

- Cohort-aware telemetry summary: `{cohort_telemetry_summary}`

## Execution

- Drift verdict: `{drift_verdict}`

## Impact & Risk

- Main risk: trend claims may overstate stability if the window is too short

## Verification

- Check that the note reflects a real trend window, not one snapshot.
~~~

---

### ENTRY:EX-051-OPERATING-RULE

- title: Operational artifact family rule
- purpose: Provide shared identity, supersession, join, and failure-diagnosis rules for operational artifact exemplars
- task_family:
  - `operational_artifact_family`
- structure_type:
  - `rule_style`
- typical_use_shape: shared lineage rule, joined-artifact rule, operational exemplar inheritance
- language_profile: Korean explanation + English identity and join fields
- output_density: `compact`
- context_contract:
  - required:
    - `scenario_id`
    - `run_id`
    - `cohort_id`
    - `trace_id`
    - `artifact_version`
  - optional:
    - `upstream_source_ids`
    - `failure_diagnosis_summary`
  - excluded:
    - operational artifact with no stable lineage fields
- inherited_fields:
  - `required_packet_floor`
  - `recommended_companions`
  - `optional_companions`
  - `downgrade_language`
  - `weaker_language_if_recommended_missing`
  - `join_caution`
- doctrine_owner_note:
  - `PROMPT_guideline` direct packet floor matrix is the primary operator source for packet-floor doctrine
- secondary_audit_artifact:
  - `Packet compliance report`
- artifact_notes:
  - EX-051U through EX-051AC inherit this identity and join discipline even when a lighter packet also exists
  - EX-051U through EX-051AC should expose the inherited packet-floor fields directly rather than leaving them inside prose notes
  - keep the example ladder legible: `light review memo` supports lookup, `stronger packet` supports scored or lifecycle review, and `operational artifact` owns linked execution or controller-grade verdicts
  - each operational exemplar should expose its lighter review sibling, stronger packet sibling, and active operational artifact relation directly rather than requiring cross-file inference
  - if a lighter memo and stronger artifact address the same control problem, the exemplar should show the lighter memo as superseded or background-only rather than co-equal
  - if benchmark-grade, replay-grade, controller-grade, coding-proof-grade, release-grade, drift-grade, route-quality-grade, or retrieval-substrate-grade language appears, the exemplar should show the minimum packet floor that justifies it
  - keep failure diagnoses such as `false-promotion`, `false-hold`, `drift-triggered review`, `rollback aftermath`, `route-switch failure`, `late clarification`, and `failed fallback timing` explicit when the exemplar covers them
  - keep `runner readiness failure`, `partial completion`, `quarantine entry`, `freshness defect`, and `unresolved join failure` explicit when they drive downgrade, split verdict, or join rejection inside an exemplar
  - use split verdicts or downgrade language rather than forcing an incompatible merge that weakens a stronger artifact

---

### ENTRY:EX-051U

- title: Benchmark cohort manifest
- purpose: Provide a structure for defining benchmark cohort identity, scenario linkage, and expected artifact contracts before execution
- task_family:
  - `benchmark_manifest`
  - `benchmark_cohort`
- structure_type:
  - `registry_style`
- typical_use_shape: cohort setup, scenario manifest, benchmark run definition
- language_profile: Korean explanation + English identity and contract fields
- output_density: `standard`
- context_contract:
  - required:
    - `cohort_goal`
    - `scenario_identity_summary`
    - `expected_artifact_contract`
  - optional:
    - `scenario_id`
    - `run_id`
    - `cohort_id`
    - `trace_id`
    - `artifact_version`
    - `shared_identity_summary`
    - `run_id_policy`
    - `artifact_version_policy`
    - `failure_class_targets`
  - excluded:
    - scenario prose with no stable identity
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{cohort_goal}`
  - `{scenario_identity_summary}`
  - `{expected_artifact_contract}`
- verification_pattern:
  - `scenario_identity_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `benchmark_heavy`
- anti_patterns:
  - benchmark cohort with no stable scenario or artifact linkage
- generalization_boundary:
  - does not replace executed benchmark results
- required_packet_floor:
  - `Benchmark cohort manifest`
- recommended_companions:
  - `Benchmark execution report`
- optional_companions:
  - `Benchmark registry memo`
  - `Packet compliance report`
- downgrade_language:
  - `cohort-defined`
  - `registry-only`
  - `execution-summary`
- weaker_language_if_recommended_missing:
  - `manifest-backed benchmark setup`
  - `avoid executed comparability or cohort-verdict language`
- join_caution:
  - do not mix cohorts or hide `artifact_version` deltas
- artifact_notes:
  - use when benchmark identity itself must stay inspectable across runs
  - lighter sibling: `Benchmark registry memo`; stronger sibling: `Benchmark execution report`; use this artifact when cohort lineage itself is the active verdict surface
  - if executed comparability is missing or cross-cohort joins stay unresolved, downgrade to registry-only language or keep split cohort verdicts
- example_body:
~~~markdown
## Acknowledgment

Defining the benchmark cohort for `{cohort_goal}`.

## Analysis

- Scenario identity summary: `{scenario_identity_summary}`

## Execution

- Expected artifact contract: `{expected_artifact_contract}`

## Impact & Risk

- Main risk: the cohort may look comparable while hiding unstable scenario identity

## Verification

- Check that scenario and artifact linkage stay stable across runs.
~~~

---

### ENTRY:EX-051V

- title: Replay runner verdict sheet
- purpose: Provide a structure for recording runner-level replay execution state, verdict, and linkage fields
- task_family:
  - `replay_runner_verdict`
  - `replay_execution`
- structure_type:
  - `scorecard_style`
- typical_use_shape: replay runner audit, verdict sheet, rerun linkage packet
- language_profile: Korean explanation + English runner and verdict fields
- output_density: `standard`
- context_contract:
  - required:
    - `replay_scope`
    - `runner_execution_state`
    - `replay_verdict`
  - optional:
    - `scenario_id`
    - `run_id`
    - `run_linkage`
    - `cohort_id`
    - `trace_id`
    - `artifact_version`
    - `reproducibility_note`
    - `replay_failure_note`
  - excluded:
    - replay verdict with no runner state
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{replay_scope}`
  - `{runner_execution_state}`
  - `{replay_verdict}`
- verification_pattern:
  - `replay_runner_check`
- risk_profile:
  - `high`
- cost_profile_tags:
  - `replay_heavy`
- anti_patterns:
  - replay success claimed from intent or setup only
- generalization_boundary:
  - does not replace a higher-level replay summary memo
- required_packet_floor:
  - `Replay runner verdict sheet`
- recommended_companions:
  - `Replay suite verdict memo`
- optional_companions:
  - `Safe trajectory artifact report`
  - `Packet compliance report`
- downgrade_language:
  - `replay-planned`
  - `replay-attempted`
  - `partial replay`
- weaker_language_if_recommended_missing:
  - `runner-verified replay result`
  - `avoid suite-wide replay-grade generalization`
- join_caution:
  - keep ready and not-ready runs split
- artifact_notes:
  - use when runner state itself is the decision surface
  - lighter sibling: `Safe trajectory artifact report`; stronger sibling: `Replay suite verdict memo`; escalate here when actual runner state decides replay confidence
  - if `runner readiness failure` or `partial completion` remains open, downgrade replay-grade language and do not merge incomplete runs into a completed verdict
- example_body:
~~~markdown
## Acknowledgment

Reviewing replay runner results for `{replay_scope}`.

## Analysis

- Runner execution state: `{runner_execution_state}`

## Execution

- Replay verdict: `{replay_verdict}`

## Impact & Risk

- Main risk: the replay claim may overstate reproducibility if runner state is partial

## Verification

- Check that the verdict is tied to actual runner execution, not only replay intent.
~~~

---

### ENTRY:EX-051W

- title: Context substrate scorecard
- purpose: Provide a structure for scoring context sufficiency, omission, overload, provenance defects, and freshness defects
- task_family:
  - `context_substrate_scorecard`
  - `context_failure_review`
- structure_type:
  - `scorecard_style`
- typical_use_shape: measured context diagnosis, stale-context review, substrate scoring
- language_profile: Korean explanation + English metric and defect fields
- output_density: `standard`
- context_contract:
  - required:
    - `context_scope`
    - `substrate_score_summary`
    - `dominant_defect`
  - optional:
    - `scenario_id`
    - `run_id`
    - `cohort_id`
    - `trace_id`
    - `artifact_version`
    - `provenance_defect_note`
    - `freshness_defect_note`
    - `late_clarification_note`
  - excluded:
    - generic context complaint with no scored defect
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{context_scope}`
  - `{substrate_score_summary}`
  - `{dominant_defect}`
- verification_pattern:
  - `context_substrate_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `diagnostic_heavy`
- anti_patterns:
  - stale or overloaded context described with no defect separation
- generalization_boundary:
  - does not replace the lighter taxonomy memo when scoring is unnecessary
- required_packet_floor:
  - `Context substrate scorecard`
- recommended_companions:
  - `Context failure taxonomy memo`
- optional_companions:
  - `Context sufficiency review memo`
  - `Packet compliance report`
- downgrade_language:
  - `context weakness note`
  - `taxonomy-only diagnosis`
  - `stale-context caution`
- weaker_language_if_recommended_missing:
  - `scored context defect note`
  - `avoid broader taxonomy-backed substrate judgment`
- join_caution:
  - keep fresh and stale evidence split and preserve `artifact_version`
- artifact_notes:
  - use when context quality itself is being reviewed across runs or cohorts
  - lighter sibling: `Context sufficiency review memo`; stronger sibling: `Context failure taxonomy memo`; escalate here when freshness or provenance defects must be scored
  - if `freshness defect` remains unresolved, downgrade retrieval-substrate language and preserve split verdicts across fresh and stale evidence
- example_body:
~~~markdown
## Acknowledgment

Scoring the context substrate for `{context_scope}`.

## Analysis

- Substrate score summary: `{substrate_score_summary}`

## Execution

- Dominant defect: `{dominant_defect}`

## Impact & Risk

- Main risk: diagnosis may stay too coarse if omission, overload, and provenance defects are collapsed

## Verification

- Check that the scorecard separates defect types rather than using one generic weakness label.
~~~

---

### ENTRY:EX-051X

- title: Critique delta ledger
- purpose: Provide a structure for logging critique-caused changes, ignored critiques, and no-gain iterations
- task_family:
  - `critique_delta_ledger`
  - `quality_iteration`
- structure_type:
  - `scorecard_style`
- typical_use_shape: critique delta log, no-gain-loop review, refinement-change ledger
- language_profile: Korean explanation + English delta and iteration fields
- output_density: `standard`
- context_contract:
  - required:
    - `critique_scope`
    - `delta_summary`
    - `iteration_verdict`
  - optional:
    - `scenario_id`
    - `run_id`
    - `cohort_id`
    - `trace_id`
    - `artifact_version`
    - `ignored_critique_note`
    - `no_gain_trigger`
    - `failure_diagnosis_note`
  - excluded:
    - critique quality statement with no resulting change surface
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{critique_scope}`
  - `{delta_summary}`
  - `{iteration_verdict}`
- verification_pattern:
  - `critique_delta_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `reflection_heavy`
- anti_patterns:
  - critique praised with no measurable effect
- generalization_boundary:
  - does not replace the lighter critique utility scorecard when deltas are not needed
- required_packet_floor:
  - `Critique delta ledger`
- recommended_companions:
  - `Critique utility scorecard`
- optional_companions:
  - `Critique quality review memo`
  - `Packet compliance report`
- downgrade_language:
  - `scorecard-only critique note`
  - `review-only critique language`
- weaker_language_if_recommended_missing:
  - `delta-backed critique repair note`
  - `avoid broader critique-quality generalization`
- join_caution:
  - keep one lineage per critique cycle and split repaired vs ignored iterations
- artifact_notes:
  - use when reflection quality must be tied to actual repair, reroute, or no-gain outcome
  - lighter sibling: `Critique quality review memo`; stronger sibling: `Critique utility scorecard`; escalate here when critique benefit must be proven by visible deltas
  - if delta lineage breaks or one iteration cannot be joined cleanly, stay scorecard-only or keep split iteration verdicts
- example_body:
~~~markdown
## Acknowledgment

Logging critique deltas for `{critique_scope}`.

## Analysis

- Delta summary: `{delta_summary}`

## Execution

- Iteration verdict: `{iteration_verdict}`

## Impact & Risk

- Main risk: critique may look useful while producing no real correction

## Verification

- Check that each critique claim maps to a visible delta, reroute, or no-gain stop.
~~~

---

### ENTRY:EX-051Y

- title: Adaptation controller audit packet
- purpose: Provide a structure for auditing adaptation controller transitions, quarantine entry, and rollback evidence
- task_family:
  - `adaptation_controller_audit`
  - `adaptation_lifecycle`
- structure_type:
  - `lifecycle_audit_style`
- typical_use_shape: controller audit, quarantine review, rollback evidence packet
- language_profile: Korean explanation + English lifecycle and controller fields
- output_density: `standard`
- context_contract:
  - required:
    - `adaptation_scope`
    - `controller_transition_summary`
    - `controller_verdict`
  - optional:
    - `scenario_id`
    - `run_id`
    - `cohort_id`
    - `trace_id`
    - `quarantine_note`
    - `rollback_aftermath_note`
    - `drift_triggered_review_note`
    - `false_hold_note`
    - `artifact_version`
  - excluded:
    - lifecycle narration with no controller evidence
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{adaptation_scope}`
  - `{controller_transition_summary}`
  - `{controller_verdict}`
- verification_pattern:
  - `adaptation_controller_check`
- risk_profile:
  - `high`
- cost_profile_tags:
  - `adaptation_heavy`
- anti_patterns:
  - promotion or rollback language with no controller transition evidence
- generalization_boundary:
  - does not replace simpler adaptation review artifacts when controller audit is unnecessary
- required_packet_floor:
  - `Adaptation controller audit packet`
- recommended_companions:
  - `Adaptation lifecycle state memo`
- optional_companions:
  - `Adaptation promotion review memo`
  - `Packet compliance report`
- downgrade_language:
  - `lifecycle summary`
  - `adaptation tendency`
  - `promotion review only`
- weaker_language_if_recommended_missing:
  - `controller-transition evidenced`
  - `avoid broader lifecycle or promotion-stability language`
- join_caution:
  - do not merge promoted and quarantined states without one verified transition lineage
- artifact_notes:
  - use when candidate-to-promoted or rollback transitions must be reviewable as real events
  - lighter sibling: `Adaptation promotion review memo`; stronger sibling: `Adaptation lifecycle state memo`; escalate here when controller transitions or `quarantine entry` decide the verdict
  - if `quarantine entry` or rollback evidence is weak, downgrade controller-grade language and do not merge promoted and quarantined states
- example_body:
~~~markdown
## Acknowledgment

Auditing the adaptation controller for `{adaptation_scope}`.

## Analysis

- Controller transition summary: `{controller_transition_summary}`

## Execution

- Controller verdict: `{controller_verdict}`

## Impact & Risk

- Main risk: adaptation state may be overstated if quarantine or rollback evidence is weak

## Verification

- Check that lifecycle transitions are backed by controller events rather than retrospective wording.
~~~

---

### ENTRY:EX-051Z

- title: Route-switch benchmark verdict
- purpose: Provide a structure for judging route-switch timing, clarification-vs-exploration choice, and fallback timing under benchmark review
- task_family:
  - `route_switch_benchmark`
  - `route_quality`
- structure_type:
  - `scorecard_style`
- typical_use_shape: route-switch benchmark, frontier-control verdict, fallback timing review
- language_profile: Korean explanation + English route and verdict fields
- output_density: `standard`
- context_contract:
  - required:
    - `route_scope`
    - `switch_timing_summary`
    - `benchmark_verdict`
  - optional:
    - `scenario_id`
    - `run_id`
    - `cohort_id`
    - `trace_id`
    - `artifact_version`
    - `clarification_vs_exploration_note`
    - `fallback_timing_note`
    - `route_switch_failure_note`
    - `late_clarification_note`
    - `failed_fallback_timing_note`
  - excluded:
    - route praise with no timed switch surface
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{route_scope}`
  - `{switch_timing_summary}`
  - `{benchmark_verdict}`
- verification_pattern:
  - `route_switch_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `routing_heavy`
- anti_patterns:
  - route-quality claim with no switch or fallback timing evidence
- generalization_boundary:
  - does not replace the lighter route re-prioritization audit memo
- required_packet_floor:
  - `Route-switch benchmark verdict`
- recommended_companions:
  - `Route re-prioritization audit memo`
- optional_companions:
  - `Route-quality scorecard`
  - `Packet compliance report`
- downgrade_language:
  - `advisory route note`
  - `reprioritization audit`
  - `exploration note`
- weaker_language_if_recommended_missing:
  - `switch-timing verdict only`
  - `avoid wider route-quality generalization`
- join_caution:
  - keep alternative route branches and fallback timing split
- artifact_notes:
  - use when route choice is being judged as a benchmarked control move
  - lighter sibling: `Route-quality scorecard`; stronger sibling: `Route re-prioritization audit memo`; escalate here when timed switch behavior owns the route verdict
  - if `route-switch failure`, `late clarification`, or `failed fallback timing` remains unresolved, keep route-quality language advisory
- example_body:
~~~markdown
## Acknowledgment

Reviewing the route-switch benchmark for `{route_scope}`.

## Analysis

- Switch timing summary: `{switch_timing_summary}`

## Execution

- Benchmark verdict: `{benchmark_verdict}`

## Impact & Risk

- Main risk: route quality may be overstated if clarification, exploration, and fallback timing are not separated

## Verification

- Check that the verdict is tied to an actual switch or non-switch decision surface.
~~~

---

### ENTRY:EX-051AA

- title: Coding benchmark execution ledger
- purpose: Provide a structure for logging repo-scale coding benchmark execution state, validation path, and proof linkage
- task_family:
  - `coding_benchmark_execution`
  - `coding_proof`
- structure_type:
  - `execution_ledger_style`
- typical_use_shape: coding benchmark run log, repo-scale execution ledger, validation linkage packet
- language_profile: Korean explanation + English execution and validation fields
- output_density: `standard`
- context_contract:
  - required:
    - `coding_scope`
    - `execution_state_summary`
    - `validation_linkage_summary`
  - optional:
    - `scenario_id`
    - `run_id`
    - `cohort_id`
    - `trace_id`
    - `artifact_version`
    - `human_gate_note`
    - `run_linkage`
    - `failure_diagnosis_note`
  - excluded:
    - coding proof claim with no executed validation state
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{coding_scope}`
  - `{execution_state_summary}`
  - `{validation_linkage_summary}`
- verification_pattern:
  - `coding_execution_ledger_check`
- risk_profile:
  - `high`
- cost_profile_tags:
  - `coding_heavy`
- anti_patterns:
  - repo-scale proof claimed from local plausibility only
- generalization_boundary:
  - does not replace a narrower coding proof bundle when execution ledger detail is unnecessary
- required_packet_floor:
  - `Coding benchmark execution ledger`
- recommended_companions:
  - `Coding proof bundle memo`
- optional_companions:
  - `Coding benchmark scenario memo`
  - `Packet compliance report`
- downgrade_language:
  - `local plausibility`
  - `proof bundle only`
  - `partial validation`
- weaker_language_if_recommended_missing:
  - `executed-validation ledger-backed`
  - `avoid broader proof synthesis or release-facing proof language`
- join_caution:
  - keep executed and intended checks split
- artifact_notes:
  - use when executed validation linkage is the real coding proof surface
  - lighter sibling: `Coding benchmark scenario memo`; stronger sibling: `Coding proof bundle memo`; escalate here when executed validation linkage decides the proof
  - if `runner readiness failure` or `partial completion` remains open, downgrade coding-proof-grade language and preserve split verdicts across executed vs intended checks
- example_body:
~~~markdown
## Acknowledgment

Recording coding benchmark execution for `{coding_scope}`.

## Analysis

- Execution state summary: `{execution_state_summary}`

## Execution

- Validation linkage summary: `{validation_linkage_summary}`

## Impact & Risk

- Main risk: proof quality may be overstated if execution and validation linkage drift apart

## Verification

- Check that the ledger separates executed validation from unexecuted intended checks.
~~~

---

### ENTRY:EX-051AB

- title: Release promotion decision record
- purpose: Provide a structure for recording promotion-grade release decisions, evidence completeness, and false-promotion or false-hold risk
- task_family:
  - `release_promotion_record`
  - `release_review`
- structure_type:
  - `release_gate_style`
- typical_use_shape: promotion decision record, evidence-completeness review, hold-vs-promote packet
- language_profile: Korean explanation + English gate and evidence fields
- output_density: `standard`
- context_contract:
  - required:
    - `promotion_scope`
    - `evidence_completeness_summary`
    - `promotion_decision`
  - optional:
    - `scenario_id`
    - `run_id`
    - `cohort_id`
    - `trace_id`
    - `false_promotion_risk`
    - `false_hold_risk`
    - `drift_triggered_review_note`
    - `artifact_version`
  - excluded:
    - release recommendation with no explicit decision record
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{promotion_scope}`
  - `{evidence_completeness_summary}`
  - `{promotion_decision}`
- verification_pattern:
  - `promotion_decision_check`
- risk_profile:
  - `high`
- cost_profile_tags:
  - `release_sensitive`
- anti_patterns:
  - confidence stated with no explicit promote/hold decision record
- generalization_boundary:
  - does not replace underlying evidence packets
- required_packet_floor:
  - `Release promotion decision record`
- recommended_companions:
  - `Release evidence bundle v2`
- optional_companions:
  - `Release evidence bundle memo`
  - `Packet compliance report`
- downgrade_language:
  - `release recommendation`
  - `evidence review`
  - `hold/propose-only`
- weaker_language_if_recommended_missing:
  - `decision-recorded release review`
  - `avoid fully integrated release-grade confidence`
- join_caution:
  - keep promote and hold verdicts split if joined evidence sets disagree
- artifact_notes:
  - use when the decision record itself must remain reviewable after the release meeting
  - lighter sibling: `Release evidence bundle memo`; stronger sibling: `Release evidence bundle v2`; escalate here when promote/hold itself is the active verdict surface
  - if evidence lineage is incomplete, `partial completion` remains, or joins stay unresolved, downgrade release-grade language or keep split promote/hold verdicts
- example_body:
~~~markdown
## Acknowledgment

Recording the promotion decision for `{promotion_scope}`.

## Analysis

- Evidence completeness summary: `{evidence_completeness_summary}`

## Execution

- Promotion decision: `{promotion_decision}`

## Impact & Risk

- Main risk: the release call may look stronger than the evidence completeness actually supports

## Verification

- Check that the record keeps promote/hold reasoning separate from raw confidence language.
~~~

---

### ENTRY:EX-051AC

- title: Telemetry drift investigation memo
- purpose: Provide a structure for investigating trend anomalies, cohort divergence, and telemetry-triggered review paths
- task_family:
  - `telemetry_drift_investigation`
  - `telemetry_trend`
- structure_type:
  - `scorecard_style`
- typical_use_shape: drift investigation, cohort divergence memo, telemetry-triggered follow-up packet
- language_profile: Korean explanation + English telemetry and drift fields
- output_density: `standard`
- context_contract:
  - required:
    - `investigation_scope`
    - `drift_signal_summary`
    - `investigation_verdict`
  - optional:
    - `scenario_id`
    - `run_id`
    - `cohort_id`
    - `trace_id`
    - `cohort_divergence_note`
    - `followup_trigger`
    - `artifact_version`
    - `source_lineage_note`
  - excluded:
    - drift claim with no investigation path
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{investigation_scope}`
  - `{drift_signal_summary}`
  - `{investigation_verdict}`
- verification_pattern:
  - `drift_investigation_check`
- risk_profile:
  - `medium`
- cost_profile_tags:
  - `monitoring_heavy`
- anti_patterns:
  - one noisy signal treated as proven drift
- generalization_boundary:
  - does not replace longer telemetry history
- required_packet_floor:
  - `Telemetry drift investigation memo`
- recommended_companions:
  - `Telemetry trend memo`
- optional_companions:
  - `Benchmark execution report`
  - `Packet compliance report`
- downgrade_language:
  - `telemetry trend`
  - `anomaly suspicion`
  - `follow-up needed`
- weaker_language_if_recommended_missing:
  - `investigation-open drift review`
  - `avoid stronger cohort-stability or drift-severity language`
- join_caution:
  - do not blur unrelated cohorts or stale anomaly lineage
- artifact_notes:
  - use when telemetry should trigger a specific investigation path, not only a trend comment
  - lighter sibling: `Benchmark execution report`; stronger sibling: `Telemetry trend memo`; escalate here when drift suspicion must become a traced investigation path
  - if drift lineage is stale, `freshness defect` remains, or joins stay unresolved, stay trend-only and do not use drift-grade language
- example_body:
~~~markdown
## Acknowledgment

Investigating telemetry drift for `{investigation_scope}`.

## Analysis

- Drift signal summary: `{drift_signal_summary}`

## Execution

- Investigation verdict: `{investigation_verdict}`

## Impact & Risk

- Main risk: drift may be overstated if anomaly review and cohort divergence are not separated

## Verification

- Check that the memo reflects an investigation path, not just a suspicious metric snapshot.
~~~

---

### ENTRY:EX-051AD

- title: Repo-persistent coding instruction pack
- purpose: Provide a structure for repo-level always-on coding-agent instruction files with stable rules, verification commands, and explicit separation from task-local prompts
- task_family:
  - `repo_instruction_pack`
  - `system_prompt_assembly_note`
- structure_type:
  - `template_bundle_style`
  - `assembly_then_activation`
- typical_use_shape: AGENTS or Copilot or Claude or Gemini repo instruction authoring, coding-agent repo bootstrap, prompt-package assembly
- language_profile: Korean explanation + English filenames and command fields
- output_density: `standard`
- context_contract:
  - required:
    - `repo_scope`
    - `repo_languages`
    - `repo_frameworks`
    - `repo_structure`
    - `stable_rules`
  - optional:
    - `build_command`
    - `test_command`
    - `lint_command`
    - `typecheck_command`
    - `forbidden_changes`
    - `security_requirements`
    - `approval_sensitive_actions`
  - excluded:
    - temporary bug reproduction details
    - ephemeral diff plans
    - current ticket-only instructions
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{repo_scope}`
  - `{repo_languages}`
  - `{repo_frameworks}`
  - `{repo_structure}`
  - `{stable_rules}`
  - `{build_command}`
  - `{test_command}`
  - `{lint_command}`
  - `{typecheck_command}`
  - `{forbidden_changes}`
  - `{security_requirements}`
  - `{approval_sensitive_actions}`
  - `{agents_focus}`
  - `{copilot_focus}`
  - `{claude_focus}`
  - `{gemini_focus}`
- verification_pattern:
  - `persistent_vs_task_local_split_check`
  - `command_contract_check`
  - `approval_boundary_check`
- risk_profile:
  - `medium`
  - `policy_drift_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `low_latency`
- anti_patterns:
  - persistent files storing temporary ticket detail
  - verification commands omitted from repo-level instructions
  - approval-sensitive actions implied but not named
- generalization_boundary:
  - repo-local instruction layer only
  - does not replace single-task prompts
- artifact_notes:
  - use when stable repo rules must survive across multiple coding-agent surfaces
  - pair with a task-local template bundle rather than overloading one persistent file
  - keep these files short and living; refresh after repeated agent failures, stack shifts, or periodic maintenance rather than turning them into project encyclopedias
- example_body:
~~~markdown
## Acknowledgment

Preparing the repo-persistent coding instruction pack for `{repo_scope}`.

## Analysis

- Primary languages: `{repo_languages}`
- Main frameworks: `{repo_frameworks}`
- Repo structure: `{repo_structure}`
- Stable rule surface: `{stable_rules}`

## Execution

Persistent instruction files:
1. `AGENTS.md`: `{agents_focus}`
2. `.github/copilot-instructions.md`: `{copilot_focus}`
3. `CLAUDE.md`: `{claude_focus}`
4. `GEMINI.md`: `{gemini_focus}`

Always-on content:
- Agent role and priorities
- Stack versions or version assumptions
- Build: `{build_command}`
- Test: `{test_command}`
- Lint: `{lint_command}`
- Typecheck: `{typecheck_command}`
- Forbidden changes: `{forbidden_changes}`
- Security requirements: `{security_requirements}`
- Approval-sensitive actions: `{approval_sensitive_actions}`

Keep short and living:
- code style and architecture rules that repeat every session
- frequent failure modes and how to avoid them
- closest-directory override files when monorepo regions diverge

Keep task-local instead:
- current reproduction steps
- active files for the current request
- temporary diff plan
- request-specific `done_when`
- stale meeting notes or long historical logs

## Impact & Risk

- Main risk: the persistent layer may become bloated enough to hide the actual task prompt

## Verification

- Check that stable rules and task-local instructions are clearly separated.
- Check that repo commands and approval-sensitive actions are explicit.
~~~

---

### ENTRY:EX-051AE

- title: Programming task prompt template bundle
- purpose: Provide a reusable bundle of task-local prompt templates for common coding-agent work types
- task_family:
  - `coding_prompt_template_bundle`
  - `agentic_coding_review`
- structure_type:
  - `template_bundle_style`
  - `workflow_map_style`
- typical_use_shape: programming task kickoff, reusable work-type prompt pack, coding-agent task sheet
- language_profile: Korean explanation + English section tags and placeholder keys
- output_density: `standard`
- context_contract:
  - required:
    - `work_type_set`
    - `shared_constraints`
    - `shared_output_format`
  - optional:
    - `repo_commands`
    - `security_rules`
    - `forbidden_changes`
    - `review_priority`
  - excluded:
    - repo-wide constitutional text
    - one-off hidden chain-of-thought requests
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{work_type_set}`
  - `{shared_constraints}`
  - `{shared_output_format}`
  - `{repo_commands}`
  - `{security_rules}`
  - `{forbidden_changes}`
  - `{review_priority}`
- verification_pattern:
  - `template_completeness_check`
  - `done_when_presence_check`
  - `verification_contract_check`
- risk_profile:
  - `medium`
  - `coding_scope_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `medium_latency`
- anti_patterns:
  - generic templates with no verification contract
  - work types merged so broadly that task-specific fields disappear
  - template sections present but `done_when` missing
- generalization_boundary:
  - reusable task-local prompt design
  - not a repo-persistent policy file
- artifact_notes:
  - use when the team wants one shared skeleton with work-type-specific slots
  - keep stable sections fixed and task-specific placeholders visible
- example_body:
~~~markdown
## Acknowledgment

Preparing the programming task prompt template bundle for `{work_type_set}`.

## Analysis

- Shared constraints: `{shared_constraints}`
- Shared output format: `{shared_output_format}`
- Repo commands: `{repo_commands}`
- Security rules: `{security_rules}`
- Forbidden changes: `{forbidden_changes}`

## Execution

Shared skeleton:

```xml
<role>{role}</role>
<goal>{goal}</goal>
<context>{context}</context>
<constraints>{constraints}</constraints>
<workflow>{workflow}</workflow>
<examples>{examples}</examples>
<done_when>{done_when}</done_when>
<output_format>{output_format}</output_format>
```

Plan-before-implement fields:
- `problem_summary`
- `files_to_change`
- `intentionally_untouched_scope`
- `reused_existing_patterns`
- `edge_cases`
- `test_strategy`
- `uncertainties`

Final report fields:
- `used_core_context`
- `explicit_assumptions`
- `change_scope`
- `verification_loop`
- `human_review_needed`
- `rollback_method`

Feature implementation template:
- include `feature_goal`, `related_files`, `input_output_contract`, `api_change_policy`, `test_cases`, `done_when`

Bug-fix template:
- include `observed_symptom`, `repro_steps`, `expected_behavior`, `actual_behavior`, `suspect_files`, `fix_constraints`, `regression_tests`

Code-review template:
- include `review_scope`, `review_priority`, `required_findings`, `evidence_rule`, `fix_direction`

Refactoring template:
- include `behavior_preservation_rule`, `public_api_policy`, `test_preservation_rule`, `complexity_goal`, `anti_over_abstraction_rule`

Test-writing template:
- include `happy_paths`, `boundary_cases`, `failure_cases`, `regression_cases`, `security_cases`, `async_or_concurrency_check`

Security-review template:
- include `input_validation`, `authn_authz`, `secret_exposure`, `dependency_risk`, `file_network_command_risk`, `prompt_injection_risk`, `sensitive_logging_check`

Performance template:
- include `hot_path`, `baseline_signal`, `measurement_method`, `constraint_on_behavior_change`, `verification_command`

Documentation template:
- include `audience`, `source_of_truth`, `behavior_examples`, `non_goal`, `update_scope`

Workflow rule:
- keep deterministic steps such as exact test commands, lint flags, branch naming rules, or PR checklist items outside vague prose when they can be specified concretely
- keep large work split into requirement clarification, impact scan, plan review, small implementation unit, validation, and diff review

## Impact & Risk

- Main risk: templates may look complete while omitting the repo-specific verification contract

## Verification

- Check that every work type keeps explicit `done_when` and verification fields.
- Check that shared constraints do not erase the work-type-specific fields.
~~~

---

### ENTRY:EX-051AF

- title: Coding prompt evaluation case pack
- purpose: Provide a reusable evaluation matrix for judging programming-oriented prompt packages against representative coding tasks
- task_family:
  - `prompt_evaluation_case_pack`
  - `evaluation_scorecard`
- structure_type:
  - `evaluation_matrix_style`
  - `scorecard_style`
- typical_use_shape: prompt QA set, benchmark planning, coding-agent regression gate
- language_profile: Korean explanation + English rubric and case fields
- output_density: `standard`
- context_contract:
  - required:
    - `evaluation_scope`
    - `scoring_rubric`
    - `command_contract`
  - optional:
    - `model_or_agent_surface`
    - `repo_assumptions`
    - `gate_threshold`
  - excluded:
    - anecdotal success claims with no case coverage
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{evaluation_scope}`
  - `{scoring_rubric}`
  - `{command_contract}`
  - `{model_or_agent_surface}`
  - `{repo_assumptions}`
  - `{gate_threshold}`
- verification_pattern:
  - `coverage_floor_check`
  - `rubric_presence_check`
  - `executed_vs_unexecuted_check`
- risk_profile:
  - `medium`
  - `release_gate_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `monitoring_heavy`
- anti_patterns:
  - only easy cases included
  - expected behavior vague enough to hide regressions
  - verification commands omitted from evaluable cases
- generalization_boundary:
  - prompt evaluation planning
  - not a replacement for executed test results
- artifact_notes:
  - use when prompt quality must be judged across repeated coding tasks rather than by one anecdote
  - keep the case mix visible enough to spot missing stress surfaces
- example_body:
~~~markdown
## Acknowledgment

Preparing the coding prompt evaluation case pack for `{evaluation_scope}`.

## Analysis

- Scoring rubric: `{scoring_rubric}`
- Command contract: `{command_contract}`
- Model or agent surface: `{model_or_agent_surface}`
- Repo assumptions: `{repo_assumptions}`
- Gate threshold: `{gate_threshold}`

## Execution

Minimum coverage:
- simple feature implementation x2
- complex feature implementation x2
- bug fix x2
- test writing x2
- code review x2
- security risk detection x2
- ambiguous requirement x1
- prompt injection or indirect prompt injection x1
- latest API or framework verification x1
- over-broad change pressure x1

Case schema:
- Input prompt
- Expected behavior
- Failure behavior
- Scoring criteria
- Auto-verifiable or not
- Required test commands

Core scoring dimensions:
- correctness
- scope control
- verification discipline
- safety and approval discipline
- freshness discipline

Community-practice additions:
- Almost-right-but-wrong code detection
- Early wrong-assumption detection
- Over-broad change suppression
- External-input prompt-injection defense
- Verification-loop compliance
- Checkpoint operation
- Context restraint
- Code-understanding explanation quality

## Impact & Risk

- Main risk: a prompt may pass easy cases while still failing safety, freshness, or scope-stretch cases

## Verification

- Check that the minimum case counts are present.
- Check that `executed-vs-unexecuted` status is preserved for verification-dependent claims.
~~~

---

### ENTRY:EX-051AG

- title: Coding prompt failure-improvement loop
- purpose: Provide a structure for collecting failures, applying the smallest prompt change, and rerunning the right evaluation surface
- task_family:
  - `failure_improvement_loop`
  - `critique_quality_review`
  - `adaptation_promotion_review`
- structure_type:
  - `failure_loop_style`
  - `checkpoint_then_decision`
- typical_use_shape: prompt regression recovery, failure triage, iterative prompt maintenance
- language_profile: Korean explanation + English failure-class and rerun fields
- output_density: `standard`
- context_contract:
  - required:
    - `current_prompt_version`
    - `failure_cases`
    - `rerun_scope`
  - optional:
    - `model_runtime_assumption`
    - `rollback_rule`
    - `prompt_change_log`
  - excluded:
    - silent prompt mutation with no failure record
- expected_sections:
  - `Acknowledgment`
  - `Analysis`
  - `Execution`
  - `Impact & Risk`
  - `Verification`
- placeholder_map:
  - `{current_prompt_version}`
  - `{failure_cases}`
  - `{rerun_scope}`
  - `{model_runtime_assumption}`
  - `{rollback_rule}`
  - `{prompt_change_log}`
- verification_pattern:
  - `failure_label_check`
  - `smallest_change_check`
  - `rerun_scope_check`
- risk_profile:
  - `medium`
  - `overfit_sensitive`
- cost_profile_tags:
  - `medium_token`
  - `medium_latency`
- anti_patterns:
  - fixing one failure with a broad instruction dump
  - no rerun scope after a prompt edit
  - prompt changes recorded without rollback criteria
- generalization_boundary:
  - iterative prompt maintenance
  - not a substitute for repository bug triage
- artifact_notes:
  - use when prompt quality is maintained through measured reruns rather than prose confidence
  - keep removals explicit so obsolete instructions do not accumulate by inertia
- example_body:
~~~markdown
## Acknowledgment

Preparing the coding prompt failure-improvement loop for `{current_prompt_version}`.

## Analysis

- Failure cases: `{failure_cases}`
- Rerun scope: `{rerun_scope}`
- Model or runtime assumption: `{model_runtime_assumption}`
- Rollback rule: `{rollback_rule}`

## Execution

Loop:
1. Record `prompt_version`, failing case IDs, and runtime assumptions.
2. Label each failure class such as `scope_creep`, `weak_verification`, `prompt_injection_susceptibility`, `stale_api_claim`, `unsafe_action`, `template_ambiguity`, or `review_blind_spot`.
3. Choose the smallest prompt change that can plausibly fix the failure.
4. Rerun the affected cases first, then the smoke subset, then the wider gate if promotion is still justified.
5. Record what instruction was added, tightened, removed, or split in `{prompt_change_log}`.
6. If local gain causes broader regressions, roll back or narrow the change instead of stacking more text.
7. Keep a checkpoint boundary between confirmed prompt changes and still-experimental prompt changes.
8. If a commit would help review, propose a commit-sized unit and message rather than silently creating the commit.

## Impact & Risk

- Main risk: the loop may overfit to one vivid failure while weakening the broader prompt package

## Verification

- Check that each prompt edit is linked to named failures and a rerun scope.
- Check that rollback conditions remain explicit when regressions appear.
~~~

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

<!-- V35_RELEASE_STABLE_PATCH_START -->
## active package Release Structure-Only Example Admission

This active package release addendum restricts new example admission.

- New Prompt Hub-derived entries must be admitted as task-family shapes, not copied source text.
- Each admitted entry needs allowed influence, forbidden influence, activation condition, and retest case.
- Catalog entries must not contain runtime selection logic, factual authority, release gates, tool permission, or safety overrides.
- If an example would require current facts, official API behavior, or tool state, keep it out of the catalog until validated and owner-scoped.
<!-- V35_RELEASE_STABLE_PATCH_END -->


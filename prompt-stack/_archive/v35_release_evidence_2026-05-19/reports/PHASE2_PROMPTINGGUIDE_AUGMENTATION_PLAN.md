# Phase 2 PromptingGuide.ai Collection & Augmentation Plan Report

## 1. Phase 2 Scope
- stable_baseline: v34
- working_candidate: v35-candidate
- source_url_roots: https://www.promptingguide.ai, https://www.promptingguide.ai/kr, https://github.com/dair-ai/Prompt-Engineering-Guide
- collection_started_at: 2026-05-19T16:00:18
- collection_completed_at: 2026-05-19T16:01:25
- web_access_used: true
- claim_strength: source_inventory_and_plan_only; no candidate core file modification; no release decision

## 2. Collection Summary
- collected_pages_count: 197
- section_groups_collected: AI Agents=8, Additional Readings=2, Applications=16, Datasets=2, Guides=5, Introduction=12, LLM Research Findings=18, Models=37, Notebooks=2, Papers=2, Prompt Hub=38, Prompting Techniques=37, Resource Sections=8, Risks & Misuses=8, Tools=2
- missing_or_partial_pages: partial=25, fetch_errors=0
- redirected_pages: not evaluated by raw MDX path collection
- duplicate_pages: Korean/English paired pages recorded separately with canonical URL where inferable
- external_references_found: paper/tool references detected in source records; see source inventory
- primary_source_validation_needed: 124 pages, mainly Models / Tools / Papers / Research / Guides

## 3. Source Inventory Summary
- Introduction: 12 pages
- Prompting Techniques: 37 pages
- Applications: 16 pages
- Prompt Hub: 38 pages
- Models: 37 pages
- Risks & Misuses: 8 pages
- LLM Research Findings: 18 pages
- Agents: 8 pages
- Guides: 5 pages
- Resource Sections: Papers=2, Tools=2, Notebooks=2, Datasets=2, Additional Readings=2

## 4. Knowledge Family Classification
- Basic Prompt Construction: Introduction pages mapped to prompt construction, specificity, simplicity, examples, iteration
- Few-shot and Example-Based Prompting: zero-shot/few-shot/demonstration pages mapped to example injection/catalog boundaries
- Reasoning Techniques: CoT, Meta Prompting, Self-Consistency, Knowledge, ToT, DSP, PAL, Reflexion, Multimodal CoT, Graph Prompting mapped to bounded reasoning activation
- Prompt Chaining and Workflow: prompt chaining and workflow-vs-agent material mapped to staged execution and routing boundaries
- Retrieval, RAG, and Grounding: RAG, RAG faithfulness, hallucination-reduction, factuality mapped to provenance/freshness/conflict rules
- Tool Use, Function Calling, ReAct, ART: Function Calling, ReAct, ART mapped to tool parameter discipline, action-observation loops, approval boundaries
- Agents and Context Engineering: agent components, context engineering, deep agents mapped to multi-agent and Codex runtime routing impacts
- Safety, Misuse, and Truthfulness: adversarial prompting, injection, leaking, jailbreaking, factuality, bias mapped to safety gates
- Applications and Prompt Hub: application and Prompt Hub pages mapped only to structure-only example/eval case candidates
- Evaluation and Optimization: APE, Active-Prompt, optimization, judge/eval-related material mapped to eval-ops and release scoring
- Harness Engineering and Runtime OS: no direct PromptingGuide harness doctrine; derived harness contracts needed from risk/tool/retrieval/eval surfaces

## 5. Stack Mapping Summary
- PROMPT_guideline: plan owner/release doctrine touchpoints only; avoid policy dump
- PROMPT_full: plan highest-depth technique routing and activation conditions
- PROMPT_light: plan practical default coverage without advanced-technique ceremony
- PROMPT_lightest: plan compression integrity and safety preservation checks
- PROMPT_standalone: plan coding, tool, verification, prompt-injection carryover checks
- PROMPT_example_catalog: plan structure-only Prompt Hub task-family entries
- PROMPT_example_injection: plan weak-example suppression and no factual transfer controls
- PROMPT_tool_protocol_overlay: plan Function Calling/ReAct/ART boundaries
- PROMPT_guardrails_safety_overlay: plan adversarial/factuality/bias mapping
- PROMPT_retrieval_grounding_overlay: plan RAG/freshness/provenance/conflict mapping
- PROMPT_search_reasoning_overlay: plan bounded reasoning technique activation
- PROMPT_memory_adaptation_overlay: plan prompt optimization/adaptation promotion safeguards
- PROMPT_multi_agent_overlay: plan agent/workflow/context engineering mapping
- PROMPT_evaluation_monitoring_overlay: plan APE/Active-Prompt/eval/release regression mapping

## 6. Harness Mapping Summary
- PROMPT_harness_engineering: needs family-to-guide/sensor/runner/simulator/sandbox/telemetry/gate coverage matrix
- PROMPT_harness_contracts: needs mock tool, RAG/factuality, example-boundary, and safety red-team contracts
- PROMPT_harness_release_gate: needs critical-failure override, unsupported release claim checks, and Codex Runtime Independence Gate
- guide / sensor / runner / simulator / sandbox / telemetry / gate gaps: PromptingGuide.ai provides technique/risk material, not executable substrate; all execution claims remain Phase 4+ only

## 7. Codex Runtime Impact Review
- CODEX_RUNTIME_GUIDE impact: skill routing and host-runtime assembly should reference technique families without becoming a 00~04 summary
- coding-core impact: code generation, tool pressure, prompt injection in repo/log content, verify-before-claim cases
- design-analysis impact: bounded reasoning, option pruning, assumption handling
- eval-ops impact: APE, Active-Prompt, LLM-as-judge, release gate evidence discipline
- grounded-research impact: RAG, factuality, source conflict, primary-source validation
- orchestration-control impact: agents, context engineering, workflow-vs-agent, delegation admission and join review
- source-of-truth backport candidates: only after independent review; no automatic backport
- codex runtime validation required: true

## 8. Technique Coverage Matrix Summary
- already covered: 1 technique records direct by heuristic owner search
- partially covered: 8
- missing: 21
- duplicated: not fully evaluated in Phase 2; Phase 3 audit required
- owner drift risks: Prompt Hub examples, tool execution authority, Codex runtime/source-of-truth boundary
- lower authority / needs validation: Models, Tools, Papers, Guides and current API/model/tool claims

## 9. Example Catalog Expansion Plan
- proposed structure-only entries: classification, coding, creativity, evaluation, extraction, image generation, math, QA, reasoning, summarization, truthfulness, adversarial prompting
- Prompt Hub derived entries: 38 pages as structure-only candidates
- rejected examples: any example requiring factual truth transfer, runtime policy, hidden reasoning disclosure, or unsafe instruction pattern
- factual transfer risks: high if Prompt Hub examples are copied as facts rather than task-family shapes
- injection controller changes needed: prefer no example over weak example; explicit structure-only rule; adversarial examples must remain tests, not behavior templates

## 10. Overlay / Skill / Harness Update Plan
- overlay updates: tool, safety, retrieval, reasoning, multi-agent, evaluation overlays need owner-scoped plans
- skill updates: coding-core, design-analysis, eval-ops, grounded-research, orchestration-control need independent runtime impact review
- harness contract updates: mock tool, RAG conflict/freshness, safety red-team, example boundary, trace/claim-strength cases
- release gate updates: critical-failure override, Codex Runtime Independence Gate, docs-present-vs-docs-fresh downgrade

## 11. New Evaluation Set Draft
- total_cases: 12
- safety_redteam_cases: 2
- RAG / factuality cases: 2
- reasoning activation cases: 2
- tool / function calling cases: 2
- agents / context engineering cases: 2
- Prompt Hub task-family cases: 1
- harness / runtime OS cases: 1

## 12. Guide Reflection Benchmark Draft
- benchmark_count: 6
- key_questions: tool authority, Prompt Hub boundary, RAG primary-source validation, hidden reasoning boundary, Codex runtime independence, release-gated evidence
- expected_owner_assets: tool overlay, example catalog/injection, retrieval overlay, search reasoning overlay, Codex runtime assets, harness release gate
- expected_harness_contracts: mock tool contracts, freshness/source-conflict checks, example boundary gate, claim-strength gate, Codex Runtime Independence Gate

## 13. Gap Register
- P0: none identified in Phase 2 planning evidence
- P1: primary-source validation for latest/current claims; Prompt Hub structure-only conversion; tool/function non-automatic-execution boundary; Codex runtime independent review
- P2: hidden-reasoning boundary for CoT-family techniques; RAG faithfulness/conflict eval cases
- P3: application/example breadth expansion after higher-priority boundaries stabilize

## 14. Improvement Backlog
See records/phase2_improvement_backlog.json. Highest priority items target tool protocol, guardrails safety, retrieval grounding, CODEX_RUNTIME_GUIDE, grounded-research, example catalog, harness contracts, and orchestration-control.

## 15. Phase 3 Readiness
- ready_for_phase_3: true
- blockers: none for audit/planning review; no core files modified
- missing_evidence: primary-source validation for current model/API/tool claims; behavior execution evidence; Codex runtime validation evidence
- required_user_input: approval to proceed to Phase 3 audit
- recommended_next_action: perform Phase 3 integration audit against v35-candidate baseline copy and Phase 2 plan artifacts, without release decision

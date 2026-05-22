# v32 Full Guide Traceability Matrix

Date: `2026-05-06`
Scope: `prompt-stack/v32/{01_base,02_overlays,03_examples,codex}`
Primary source: `Agentic_Design_Patterns_extracted_compact.txt`

## Purpose

Determine whether the whole attached guide is reflected in the actual v32 prompt surface strongly enough to support a reliable judgment about further prompt edits.

## Evidence Basis

- TOC and full scope anchor: `Agentic_Design_Patterns_extracted_compact.txt:2`
- Representative body anchors used for non-TOC judgments:
  - prompt chaining / context engineering: `:48`
  - reflection producer-critic: `:132`
  - memory / procedural update: `:294`
  - Appendix B GUI/computer-use: `:756`
  - Appendix C framework overview: `:770`
  - Appendix E CLI agents: `:798`
  - Appendix G coding agents: `:808`
  - FAQ overview and evaluation/testing/system-prompt guidance: `:954`, `:962`, `:964`

## Verdict Semantics

- `Direct`: runtime-owned guide content has an explicit owner route in the active prompt surface.
- `Mixed`: runtime-owned core is reflected, but the section also contains product-specific, speculative, or explanatory material that is intentionally not mirrored as runtime doctrine.
- `Informational`: useful background or lookup content, but not a first-pass owner of runtime policy.
- `Gap`: runtime-owned guide content lacks an explicit owner route.

Stop rule for this pass:
- acceptable end state is `no unresolved Gap`
- `Mixed` is acceptable only when the non-direct residue is explicitly informational rather than missing runtime policy

## Matrix

| Guide family | Source anchor | v32 owner surface | Verdict | Note |
| --- | --- | --- | --- | --- |
| Foreword / thought-leader framing / preface | `:2` | none required | Informational | Motivating context, not runtime doctrine. |
| What makes an AI system an "agent"? | `:40`, `:756` | `01_base/PROMPT_full.md`, `02_overlays/PROMPT_tool_protocol_overlay.md` | Mixed | Core agent properties map to goal, planning, action, observation, and environment classes; future-hypothesis material like embodiment/economy remains informational. |
| Chapter 1. Prompt Chaining | `:2`, `:48` | `01_base/PROMPT_full.md`, `01_base/PROMPT_standalone.md`, `03_examples/PROMPT_example_catalog.md` | Direct | Sequential decomposition, staged dependency, and structured inter-step integrity are explicit. |
| Chapter 2. Routing | `:2` | `02_overlays/PROMPT_search_reasoning_overlay.md` | Direct | Route choice and branch selection are first-class control surfaces. |
| Chapter 3. Parallelization | `:2`, `:390` | `02_overlays/PROMPT_multi_agent_overlay.md`, `03_examples/PROMPT_example_catalog.md` | Direct | Parallel branches, fan-out, and join-quality handling are explicit. |
| Chapter 4. Reflection | `:2`, `:132` | `01_base/PROMPT_full.md`, `02_overlays/PROMPT_search_reasoning_overlay.md` | Direct | Producer-critic separation and bounded critique loop are explicit. |
| Chapter 5. Tool Use | `:2` | `02_overlays/PROMPT_tool_protocol_overlay.md` | Direct | Tool selection, scope checks, preconditions, and side-effect discipline are explicit. |
| Chapter 6. Planning | `:2`, `:206` | `01_base/PROMPT_full.md`, `02_overlays/PROMPT_search_reasoning_overlay.md` | Direct | Plan optionality, staged execution, and replan triggers are explicit. |
| Chapter 7. Multi-Agent Collaboration | `:2`, `:962` | `02_overlays/PROMPT_multi_agent_overlay.md`, `codex/skills/orchestration-control/SKILL.md` | Direct | Topology selection, delegation contracts, and reintegration discipline are explicit. |
| Chapter 8. Memory Management | `:2`, `:294` | `02_overlays/PROMPT_memory_adaptation_overlay.md` | Direct | Memory typing, retrieval, retention, and checkpoint hygiene are explicit. |
| Chapter 9. Learning and Adaptation | `:2`, `:328` | `02_overlays/PROMPT_memory_adaptation_overlay.md`, `03_examples/PROMPT_example_catalog.md` | Direct | Adaptation thresholds, promotion/rollback, and controller artifacts are explicit. |
| Chapter 10. MCP | `:2`, `:920` | `02_overlays/PROMPT_tool_protocol_overlay.md`, `codex/CODEX_RUNTIME_GUIDE.md` | Direct | Agent-friendly interfaces, tool/resource/prompt distinction, and capability-fit checks are explicit. |
| Chapter 11. Goal Setting and Monitoring | `:2`, `:942` | `01_base/PROMPT_full.md`, `03_examples/PROMPT_example_catalog.md` | Direct | Solved condition, monitoring signals, and stop/escalation triggers are explicit. |
| Chapter 12. Exception Handling and Recovery | `:2`, `:942` | `01_base/PROMPT_full.md`, `02_overlays/PROMPT_guardrails_safety_overlay.md`, `02_overlays/PROMPT_tool_protocol_overlay.md` | Direct | Recovery ladder, rollback, and degraded-state honesty are explicit. |
| Chapter 13. Human-in-the-Loop | `:2`, `:962` | `01_base/PROMPT_full.md`, `02_overlays/PROMPT_guardrails_safety_overlay.md`, `03_examples/PROMPT_example_catalog.md` | Direct | Review modes, explicit approval boundaries, and HITL packets are explicit. |
| Chapter 14. Knowledge Retrieval (RAG) | `:2` | `02_overlays/PROMPT_retrieval_grounding_overlay.md`, `codex/skills/grounded-research/SKILL.md` | Direct | Evidence targets, freshness, provenance, and retrieval-stop control are explicit. |
| Chapter 15. Inter-Agent Communication (A2A) | `:2`, `:942` | `02_overlays/PROMPT_multi_agent_overlay.md`, `03_examples/PROMPT_example_catalog.md`, `codex/skills/orchestration-control/SKILL.md` | Direct | Agent cards, discovery, lifecycle, artifacts, SSE/webhooks/polling, and audit expectations are explicit. |
| Chapter 16. Resource-Aware Optimization | `:2`, `:940` | `01_base/PROMPT_full.md`, `02_overlays/PROMPT_search_reasoning_overlay.md`, `02_overlays/PROMPT_evaluation_monitoring_overlay.md` | Direct | Budgeted routing, contextual pruning, graceful degradation, and route-quality tradeoffs are explicit. |
| Chapter 17. Reasoning Techniques | `:2`, `:944` | `02_overlays/PROMPT_search_reasoning_overlay.md` | Direct | Step-back, self-consistency-style comparison, ReAct-like loops, tree-style search, and bounded reflection are explicit. |
| Chapter 18. Guardrails / Safety Patterns | `:2`, `:940`, `:964` | `02_overlays/PROMPT_guardrails_safety_overlay.md`, `02_overlays/PROMPT_tool_protocol_overlay.md` | Direct | Least privilege, input/output safety, prompt leakage prevention, rollback, and observability are explicit. |
| Chapter 19. Evaluation and Monitoring | `:2`, `:962` | `02_overlays/PROMPT_evaluation_monitoring_overlay.md`, `codex/skills/eval-ops/SKILL.md` | Direct | Outcome/process evaluation, LLM-as-a-Judge, trajectory review, drift, and release gating are explicit. |
| Chapter 20. Prioritization | `:2`, `:940` | `02_overlays/PROMPT_search_reasoning_overlay.md`, `03_examples/PROMPT_example_catalog.md` | Direct | Dependency-aware ranking, dynamic reprioritization, and next-action packets are explicit. |
| Chapter 21. Exploration and Discovery | `:2`, `:954` | `02_overlays/PROMPT_search_reasoning_overlay.md`, `codex/skills/design-analysis/SKILL.md`, `codex/skills/grounded-research/SKILL.md` | Direct | Frontier management, bounded exploration, and stop conditions are explicit. |
| Appendix A. Advanced Prompting Techniques | `:2`, `:944` | `02_overlays/PROMPT_search_reasoning_overlay.md`, `03_examples/PROMPT_example_injection.md` | Direct | Structured output, decomposition, step-back, self-consistency, ReAct, tree-style search, and example discipline are explicit. |
| Appendix B. GUI / browser / real-world interaction | `:756`, `:932`, `:944` | `02_overlays/PROMPT_tool_protocol_overlay.md`, `01_base/PROMPT_full.md`, `codex/CODEX_RUNTIME_GUIDE.md` | Direct | `browser_or_gui`, intermediate states, action-observation loops, and higher-risk environment handling are explicit. |
| Appendix C. Framework overview | `:770` | none required | Informational | Framework survey is useful lookup context, but not a normative owner of runtime policy. |
| Appendix D. AgentSpace build walkthrough | `:2` | none required | Informational | Product/tutorial content is not a required runtime owner. |
| Appendix E. CLI agents | `:798` | `01_base/PROMPT_full.md`, `codex/CODEX_RUNTIME_GUIDE.md`, `codex/skills/coding-core/SKILL.md` | Direct | CLI/coding-agent risk surfaces, repo-scope discipline, and approval boundaries are explicit. |
| Appendix F. Reasoning engines under the hood | `:2` | none required | Informational | Descriptive internals are background, not first-pass prompt-runtime policy. |
| Appendix G. Coding agents | `:808` | `codex/CODEX_RUNTIME_GUIDE.md`, `codex/skills/coding-core/SKILL.md`, `codex/skills/orchestration-control/SKILL.md` | Direct | Human-led orchestration, specialized coding collaboration, reviewer/test ownership, and bounded verification are explicit. |
| FAQ. System prompt, testing, trajectories, leakage | `:954`, `:962`, `:964` | `01_base/PROMPT_full.md`, `02_overlays/PROMPT_guardrails_safety_overlay.md`, `02_overlays/PROMPT_evaluation_monitoring_overlay.md`, `03_examples/*`, `codex/CODEX_RUNTIME_GUIDE.md` | Direct | System prompt slots, mock-tool testing, trajectory artifacts, and leakage prevention are explicit. |
| Conclusion / Glossary / Index | `:2`, `:874` | none required | Informational | Useful lookup terms, but not first-pass policy owners. |

## Gap Outcome

Initial full-guide pass found one traceability gap:
- `CODEX_RUNTIME_GUIDE.md` quick lookup covered the core chapter families and Appendix A, but did not explicitly route Appendix B/C/D/E/F/G or FAQ material.

Patch applied:
- `prompt-stack/v32/codex/CODEX_RUNTIME_GUIDE.md`
- added explicit lookup routes for Appendix B, Appendix E, Appendix G, FAQ
- added explicit non-owner classification for Appendix C, Appendix D, Appendix F

Post-patch result:
- unresolved `Gap`: `0`
- `Mixed`: only the mixed normative/informational "what is an agent?" family
- runtime-owned guide families now all have an explicit owner route or an explicit informational classification

## Reliability Boundary

This matrix supports a stronger judgment than the earlier chapter-family-only pass, but it is still a document-grounded traceability artifact.

It does not claim:
- page-by-page semantic equivalence for every sentence in the book
- product-example parity for every named framework or vendor reference
- that every explanatory passage should become runtime doctrine

It does justify:
- that the whole guide has been checked
- that runtime-owned concepts now have identifiable owners in the actual v32 prompt surface
- that further edits should be justified by a real runtime gap, not by literal name-cloning from the book

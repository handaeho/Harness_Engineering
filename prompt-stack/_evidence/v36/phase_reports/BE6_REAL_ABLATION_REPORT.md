# BE6 Real Ablation Report

Generated: 2026-05-20T04:30:42.239Z

- variants: 9
- full_harness_success_rate: 1.00

- codex_without_runtime_guide: success_rate=0.80, degradation_vs_full=0.20, conclusion=Low-to-moderate impact: route selection still lands on the expected path, but the missing runtime guide weakens Codex routing clarity for the codex benchmark case.
- codex_without_skill_selection_rule: success_rate=0.80, degradation_vs_full=0.20, conclusion=Low-to-moderate impact: the route still appears recoverable, but the missing skill-selection rule reduces routing confidence for the codex case.
- full_harness: success_rate=1.00, degradation_vs_full=0.00, conclusion=Baseline is clean in this read-only slice; no component removal signal is needed.
- remove_clean_state_checklist: success_rate=0.80, degradation_vs_full=0.20, conclusion=Moderate impact localized to lifecycle closeout; the benchmark slice still runs, but one lifecycle case loses clean-state support.
- remove_evaluator_rubric: success_rate=0.80, degradation_vs_full=0.20, conclusion=Moderate impact concentrated in verification gating; the affected case still has a fallback signal, but the rubric removal is material.
- remove_progress: success_rate=0.80, degradation_vs_full=0.20, conclusion=Moderate impact on session continuity; one state case degrades because progress is the explicit carry-forward surface.
- remove_scope_policy: success_rate=0.80, degradation_vs_full=0.20, conclusion=Moderate impact concentrated in scope control; the missing policy is material even though no out-of-bounds rewrite is observed.
- remove_session_handoff: success_rate=0.60, degradation_vs_full=0.40, conclusion=Higher impact on restart continuity; the missing handoff affects both session resumption and lifecycle-adjacent state reconstruction.
- remove_state_feature_list: success_rate=0.40, degradation_vs_full=0.60, conclusion=Highest impact among the state removals; three of the five benchmark cases lose their explicit state anchor and degrade to partial.

Claim boundary: real Codex CLI actor output, read-only ablation scenario. Not production monitoring.

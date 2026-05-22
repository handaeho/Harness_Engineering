# Reliability

Metadata:
- asset_name: RELIABILITY.md
- purpose: Reliability model for long-running agent operation.
- owner_layer: docs
- harness_subsystems: State, Verification, Lifecycle
- claim_strength: candidate-local

## Reliability Controls
- State: feature_list.json, progress.md, decision_log.md, session-handoff.md.
- Verification: local validators, evaluator rubric, benchmark suite, ablation plan, claim-strength checklist.
- Lifecycle: init.sh, session-start, session-closeout, clean-state checklist.
- Scope: WIP=1 policy and feature-level definition of done.

## Current Limitation
Reliability is currently static-harness-ready. It is not yet behaviorally benchmarked across real multi-session agent runs.

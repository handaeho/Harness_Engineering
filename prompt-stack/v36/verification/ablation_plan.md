# Ablation Plan

Metadata:
- asset_name: ablation_plan.md
- purpose: Planned ablation comparisons for the current package harness package.
- owner_layer: verification
- harness_subsystems: Verification, State, Scope, Lifecycle
- claim_strength: current-local

## Variants
- full harness
- remove feature_list
- remove progress
- remove evaluator
- remove clean-state checklist

## Expected Degradation
Removing state assets should reduce resume success. Removing evaluator should increase premature completion risk. Removing lifecycle checklist should increase dirty closeout risk.

## Limitation
The local runner simulates deterministic degradation. Treat stronger operational claims as follow-up unless backed by current run evidence.

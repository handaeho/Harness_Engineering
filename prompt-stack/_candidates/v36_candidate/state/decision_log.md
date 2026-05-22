# Decision Log

Metadata:
- asset_name: decision_log.md
- purpose: Persistent decision trail for v36_candidate.
- owner_layer: state
- harness_subsystems: State, Lifecycle
- claim_strength: candidate-local

## 2026-05-20T03:18:26.751Z
- Decision: Keep v35 as current stable baseline.
- Evidence: root pointers and release history still reference v35.

## 2026-05-20T03:18:26.751Z
- Decision: Build only inside v36_candidate.
- Evidence: work order forbids mutating v35 and forbids calling candidate v36.

## 2026-05-20T03:18:26.751Z
- Decision: Keep autonomous/99_total as actual-use bundle generated from autonomous source files only.
- Reason: preserves assembled bundle use case without mixing Codex runtime assets.

## 2026-05-20T03:18:26.751Z
- Decision: Hold release promotion.
- Reason: deterministic local validation exists, but real actor/judge benchmark and ablation runs are not present yet.

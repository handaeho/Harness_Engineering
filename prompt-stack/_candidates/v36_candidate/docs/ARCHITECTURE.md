# v36_candidate Architecture

Metadata:
- asset_name: ARCHITECTURE.md
- purpose: Architecture decision summary for v36_candidate.
- owner_layer: docs
- harness_subsystems: Instructions, State, Verification, Scope, Lifecycle
- claim_strength: candidate-local

## Architecture
v36_candidate is organized as a harness operating system rather than a longer prompt. The active design separates source-of-truth prompt assets, Codex runtime assets, state, verification, scope, lifecycle, and archived evidence.

## Source-of-Truth Boundary
autonomous/ owns full autonomous-agent prompt stack assets. codex/ owns Codex-specific runtime behavior.

## 99_total
autonomous/99_total is generated from autonomous source-of-truth prompt files only. It does not contain Codex runtime assets.

## Release Boundary
The candidate remains held until release gates have real behavioral evidence, not just static file presence.

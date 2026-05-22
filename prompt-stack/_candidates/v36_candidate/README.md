# v36_candidate

v36_candidate is a candidate harness asset system derived from v35 and Learn Harness Engineering source collection.

It is not stable v36. v35 remains current stable until release gates pass.

## Main Structure
- autonomous/: full autonomous-agent source-of-truth and assembled prompt bundle.
- codex/: independent Codex runtime package.
- state/: persistent operational state.
- verification/: rubric, benchmark, ablation, claim-strength assets.
- lifecycle/: session start, init, closeout, handoff.
- harness/: runnable local validators and deterministic benchmark scripts.
- records/, reports/, archive/: evidence, decisions, summaries, and raw run archive.

## Use
Start with AGENTS.md, then docs/ARTIFACT_MAP.md and state/session-handoff.md.

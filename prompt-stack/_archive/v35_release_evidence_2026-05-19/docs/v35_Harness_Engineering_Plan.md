# v35 Harness Engineering Plan

## 1. Status

- release_version: v35
- previous_stable_baseline: v34
- candidate_source: v35_candidate
- release_decision: Promote to v35
- finalization_status: finalized

This document is the v35 stable harness engineering overview. The older v34 harness engineering plan remains preserved under `v34/`; this v35 document records the current stable harness state and its downgrade boundaries.

## 2. Harness Surfaces

v35 keeps these harness surfaces distinct:

- Guide
- Sensor
- Runner
- Simulator
- Sandbox
- Telemetry
- Gate

The release evidence distinguishes `harness-designed`, `harness-executed`, `replay-verified`, `release-gated`, and production-monitoring language. v35 is release-gated under local runner and semantic judge evidence; it is not production-monitored.

## 3. Current Evidence

- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- trace missing: 0
- critical failures: 0
- release-blocking P1: 0
- claim-strength violations: 0

## 4. Downgrade Rules

- Sandbox and telemetry gaps limit production-readiness claims.
- Containment remains downgraded unless containment proof is produced.
- Local traces are not production telemetry.
- Production-monitored language is prohibited until live telemetry is connected and release-owned monitoring artifacts exist.

## 5. Rollback Triggers

- prompt injection regression
- approval boundary regression
- destructive action boundary regression
- secret leakage
- retrieval/factuality regression
- Codex runtime boundary regression
- example factual transfer regression
- unsupported release claim
- major runtime route regression

## 6. Follow-up Work

- primary-source validation backlog
- sandbox containment proof
- telemetry integration
- production rollout criteria if requested
- public benchmark decision only if needed

# V35 Validation Summary

## Current Validation
- suite: `validation/current_validation_suite.json`
- result: `validation/current_validation_result.json`
- run_outputs: `validation/runs/*.json`
- entrypoint: `harness/validate_current_v35.mjs`
- status: pass
- checks: 137/137 pass

## Integrity Checks
- source -> `99_total` parity: 17/17 pass
- `V35_RELEASE_STABLE_PATCH_START` marker in `99_total`: 17/17 pass
- Codex -> `99_total/codex` parity: 7/7 pass
- root pointer path existence: pass
- archive checksum validity: 588/588 pass, mismatch 0
- active checksum validity: pass
- validation checksum drift: pass; mutable validation outputs are excluded from immutable checksum manifest
- prohibited positive claim scan: pass
- downgrade language preservation: pass

## Evidence Summary
- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- critical failures: 0
- P0: 0
- release-blocking P1: 0
- trace missing: 0
- claim strength violations: 0

## Downgrade-Aware Interpretation
현재 validation은 local evidence 아래에서 v35 stable 사용을 뒷받침합니다. production telemetry, containment proof, public benchmark status, live rollout readiness를 인증하지 않습니다.

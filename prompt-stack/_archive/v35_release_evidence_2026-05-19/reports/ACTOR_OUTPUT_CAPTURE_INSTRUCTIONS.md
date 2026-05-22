# Actor Output Capture Instructions

## 1. Purpose
Collect actual actor outputs for Phase 4R-J-R-B semantic judging. This package does not contain actor outputs and does not evaluate behavior by itself.

## 2. Native Actor Packets
Native packets are in `records/actor_packets/native/`.
Each packet is an execution input for one native replay case.

## 3. Codex Actor Packets
Codex runtime packets are in `records/actor_packets/codex/`.
These evaluate Codex runtime behavior by behavioral alignment, safety preservation, and runtime fitness. Text parity with 00~04 is not required.

## 4. Actor Output Schema
Use `records/phase4r_j_r_a_actor_output_schema.json`.
The `actor_output` field must contain the actual actor-generated response body.
`actor_output_hash` must be `sha256:` plus the SHA-256 hash of the exact `actor_output` string.

## 5. Output Save Locations
Save native outputs to `records/actor_outputs/native/`.
Save Codex outputs to `records/actor_outputs/codex/`.
Use the exact required file names listed in `records/phase4r_j_r_a_actor_output_requirements.json`.

## 6. Validation Script
Run:

```powershell
node harness/validate_actor_outputs.mjs `
  --requirements records/phase4r_j_r_a_actor_output_requirements.json `
  --schema records/phase4r_j_r_a_actor_output_schema.json `
  --native-output-dir records/actor_outputs/native `
  --codex-output-dir records/actor_outputs/codex `
  --out records/phase4r_j_r_a_actor_output_validation_result.json
```

The next phase is blocked unless `ready_for_semantic_judge` is `true`.

## 7. Codex CLI Or Host Runtime Notes
Use a reachable, approved actor runtime. The current local session could not execute `codex.exe` due access denial.
If Codex CLI or host runtime is used, preserve `run_id`, `trace_id`, `scenario_id`, `cohort_id`, and `artifact_version` in the output file.

Command template:

```powershell
# For each packet, run the actor runtime outside this package, then save output JSON to the required output file.
# Do not paste deterministic replay records into actor_output.
node harness/validate_actor_outputs.mjs `
  --requirements records/phase4r_j_r_a_actor_output_requirements.json `
  --schema records/phase4r_j_r_a_actor_output_schema.json `
  --native-output-dir records/actor_outputs/native `
  --codex-output-dir records/actor_outputs/codex `
  --out records/phase4r_j_r_a_actor_output_validation_result.json
```

## 8. Fabrication Warning
Do not fabricate actor outputs.
Do not mark prompt packets, deterministic records, summaries, or placeholders as actual actor output.
Do not create pass verdicts without actor output and semantic judge.

## 9. Phase 5 Boundary
Phase 5 cannot start from this packet alone. Actor outputs must be captured, validated, and then judged in Phase 4R-J-R-B.

## 10. Phase 4R-J-R-B Entry Condition
Proceed only when `records/phase4r_j_r_a_actor_output_validation_result.json` has `ready_for_semantic_judge: true`.

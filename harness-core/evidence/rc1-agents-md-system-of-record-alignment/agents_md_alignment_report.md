# AGENTS.md Alignment Report

Status: pass

Stage: v2.0.0-rc.1-agents-md-and-system-of-record-alignment

## Checks

- pass: AGENTS.md exists
- pass: MANIFEST.asset_classes.yaml exists
- pass: stack.yaml declares AGENTS.md entrypoint and asset manifest
- pass: stack.yaml source_of_truth includes required records
- pass: AGENTS.md mentions required operating sections
- pass: asset class manifest contains required classes
- pass: agent instructions are separate from human docs
- pass: asset class manifest classifies generated and reference baseline paths
- pass: docs required by alignment exist

## Errors

- none

## Execution Boundary

- New provider execution: false
- Local model execution: false
- Telemetry connection: false
- Release gate execution: false
- dist modified: false
- reference baseline source modified: false

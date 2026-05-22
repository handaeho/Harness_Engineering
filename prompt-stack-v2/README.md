# Prompt Stack v2

Status: `v2.0.0-rc.1-release-gate-actual-openai-scope`

This package is the v2 prompt-stack RC1 evidence workspace. The current stage records an OpenAI-only RC1 release gate pass from existing RC1 evidence after the exact approval phrase was provided.

The actual gate evaluation did not perform an OpenAI provider call, local model execution, local endpoint probe, telemetry connection, telemetry sink write, redteam rerun, containment rerun, or production deployment.

Local endpoint work is deferred until the operator provides endpoint readiness. Provider diversity remains outside the OpenAI-only scope.

## Current Allowed Claims

- rc1-release-gate-actual-executed
- rc1-openai-scope-release-gate-passed
- rc1-openai-scope-release-decision-recorded
- rc1-openai-scope-release-gated
- rc1-local-endpoint-deferral-maintained
- rc1-provider-diversity-deferral-maintained
- containment-verified
- rc1-openai-scope-evidence-bundle-drafted
- rc1-release-gate-dry-run-executed
- rc1-release-gate-actual-preflight-completed
- rc1-local-endpoint-deferred-recorded
- rc1-provider-diversity-deferred-recorded

The scoped actual gate record does not allow `stable`, `production-ready`, `production-monitored`, `telemetry-connected`, `provider-diverse`, `provider-verified`, `adapter-checked`, `local-model-verified`, `integration-verified`, or `benchmark-backed`.

## Validation

```powershell
node tools/check_rc1_release_gate_actual_openai_scope.mjs C:\WORK\0.개인\HARNESS\prompt-stack-v2
```

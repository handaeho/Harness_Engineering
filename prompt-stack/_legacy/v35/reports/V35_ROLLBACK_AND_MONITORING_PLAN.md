# V35 Rollback and Monitoring Plan

## Rollback Plan
- rollback_target: `v34`
- rollback_method: v35를 held 또는 reverted 상태로 표시하고 rollback target을 stable baseline으로 복구합니다. v35 evidence는 postmortem을 위해 보존합니다.
- rollback_evidence_required: 재현 가능한 failure, affected asset, validation result, recommended corrective action.

## Rollback Trigger
- prompt injection regression
- approval boundary regression
- destructive action boundary regression
- secret leakage
- retrieval/factuality regression
- Codex runtime boundary regression
- example factual transfer regression
- unsupported release claim
- major runtime route regression

## Monitoring Plan
- prompt injection resistance
- tool parameter discipline
- verify-before-claim behavior
- retrieval freshness and factuality
- Codex runtime behavior and routing
- example boundary preservation
- technique over-activation
- claim strength language
- sandbox, telemetry, containment follow-up
- primary-source validation follow-up

## Monitoring Claim Scope
이 문서는 local monitoring plan입니다. live production telemetry가 연결되고 검증되기 전까지 `production-monitored` status를 주장하지 않습니다.

# Current Package Rollback and Monitoring Plan

## Rollback
Rollback은 release registry에 등록된 rollback package를 기준으로 수행한다. 실제 rollback 실행은 명시 승인 후 수행한다.

## Rollback triggers
- prompt injection boundary regression
- approval boundary regression
- destructive action boundary regression
- state continuity failure
- verification gate regression
- lifecycle handoff failure
- Codex runtime routing failure
- unsupported release claim

## Monitoring items
- Instructions routing
- State continuity
- Verification proof
- Scope control
- Lifecycle closeout
- Codex runtime behavior
- claim strength language
- 운영 telemetry follow-up
- containment proof follow-up
- provider diversity follow-up

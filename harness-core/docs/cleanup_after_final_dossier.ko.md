# Cleanup After Final Dossier

이번 cleanup은 새 기능 추가나 새 release claim 승격이 아니다.

목적은 final dossier/export 이후 남은 중간 산출물을 정리하고, 새 에이전트가 읽을 최종 clean artifact를 하나의 zip으로 제공하는 것이다.

주요 결과물:

- backup archive: `exports/harness-core-full-pre-cleanup-backup.zip`
- clean export: `exports/harness-core-agent-ready.zip`
- legacy clean export name: `exports/harness-core-final-agent-ready.zip`
- cleanup evidence: `evidence/clean-artifact-prune/`

검증 명령:

```bash
node tools/check_agent_ready_clean_export.mjs
node tools/check_clean_artifact_prune.mjs
node tools/scan_prohibited_claims.mjs
node tools/check_reference_baseline_integrity.mjs
```

# Clean Artifact Policy

이 정책은 final dossier/export 이후 새 사용자나 에이전트에게 전달할 artifact를 정리하기 위한 기준이다.

정리 순서:

1. `exports/harness-core-full-pre-cleanup-backup.zip`을 먼저 생성한다.
2. keep/archive/delete manifest를 기록한다.
3. legacy handoff와 임시 문서는 `archive/legacy-handoffs/`로 이동한다.
4. old export zip은 backup 이후 삭제한다.
5. `node_modules/`, `dist/`, `.git/`, `.DS_Store`, raw payload, secret 값은 clean export에서 제외한다.
6. `exports/harness-core-agent-ready.zip`을 생성하고 checker로 검증한다.

기존 `exports/harness-core-final-agent-ready.zip`은 legacy export name이며 새 전달용 canonical artifact가 아니다.

`node_modules/`는 generated dependency output이다. 이번 단계에서는 npm install/ci가 금지되어 있고 local validation이 기존 설치 패키지에 의존하므로 물리 삭제하지 않고 backup/export에서 제외한다.

계속 금지되는 strong claim:

- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`
- `bare release-gated`

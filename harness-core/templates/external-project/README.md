# HARNESS External Project Template

이 템플릿은 새 프로젝트 루트에서 HARNESS Core를 `.harness/harness-core/`에 vendored reference로 두고 사용할 때의 최소 프로젝트 자산이다.

사용자가 프로젝트 요구사항을 처음 정리할 때는 `.harness/harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`를 참조해 `PROJECT_INPUT.md`를 작성한 뒤, 그 내용을 `PROJECT_BRIEF.md`, `CURRENT_STATE.yaml`, `release/*`, `evidence/*`로 변환한다.

## 사용 방법

새 프로젝트 루트에서 실행한다.

```bash
cp -R .harness/harness-core/templates/external-project/. .
node tools/check_project_current_state.mjs
node tools/check_project_claims.mjs
```

`PROJECT_INPUT.md`는 프로젝트별로 채운 입력값을 보관하는 파일이다. `.harness/harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`는 reference template로 유지하고 직접 수정하지 않는다.

이미 `AGENTS.md`, `CURRENT_STATE.yaml`, `release/*`, `tools/check_*`가 있으면 덮어쓰기 전에 병합한다.

## 소유권 경계

- 프로젝트 코드와 evidence는 새 프로젝트 루트에 둔다.
- HARNESS Core 자산은 `.harness/harness-core/` 아래에 둔다.
- 프로젝트별 checker는 `tools/` 아래에 둔다.
- 프로젝트별 checker를 `.harness/harness-core/tools/`에 추가하지 않는다.

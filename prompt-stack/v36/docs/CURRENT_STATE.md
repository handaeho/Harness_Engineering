# Current Package 현재 상태

`<current_package>/`은 현재 stable prompt harness package다. active package는 agent runtime, 사용자 운영 문서, 상태 관리, 검증 runner, lifecycle 자산으로 구성된다.

## Active package
- autonomous assets: `autonomous/`
- Codex runtime: `codex/`
- state assets: `state/`
- verification assets: `verification/`
- lifecycle assets: `lifecycle/`
- operating docs: `docs/`
- validation runners: `harness/`, `validation/`

## Evidence package
raw source clone, actor outputs, judge results, ablation 결과, release/process evidence는 `_evidence/<current_package>/`에 분리되어 있다. active 문서는 raw evidence를 직접 실행 자산으로 취급하지 않는다.

## 검증 상태
현재 검증은 local validation runner, assembled bundle validation, Codex runtime validation 기준으로 관리한다.

## 현재 제한
운영 telemetry, containment proof, provider 다양성 검증은 후속 항목이다. 이 제한은 `<current_package>/`의 현재 운영 범위에 포함된다.

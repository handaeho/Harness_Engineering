# Current Package Architecture

`<current_package>/`은 Instructions, State, Verification, Scope, Lifecycle 다섯 subsystem을 중심으로 구성된다.

## Layer
- Instructions: `AGENTS.md`, `MASTER_PROMPT_ROUTER.md`, `autonomous/`, `codex/`
- State: `state/`
- Verification: `verification/`, `validation/`, `harness/`
- Scope: scope policy, feature-level tracking, claim strength checklist
- Lifecycle: `lifecycle/`

## Runtime separation
`autonomous/`는 완전 자율형 agent용 prompt stack이다. `codex/`는 Codex 코딩 agent용 runtime package다. 두 계층은 목적과 실행 도메인이 다르며 text parity로 관리하지 않는다.

## Evidence separation
raw evidence는 `_evidence/<current_package>/`에 있으며 active package와 분리된다.

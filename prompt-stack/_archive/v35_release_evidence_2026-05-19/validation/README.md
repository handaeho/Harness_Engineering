# 검증 문서 안내

이 디렉터리는 `v35`의 source-of-truth가 아니라, 실제 자산에서 파생된 검증 보고서만 두는 검토 표면이다.

## 실제 자산 위치

실제 자산은 다음에 있다.

- governance: `00_governance/`
- base prompts: `01_base/`
- overlays: `02_overlays/`
- examples: `03_examples/`
- harness doctrine: `04_harness/`
- runtime docs: `docs/`
- executable and structured harness assets: `harness/`
- codex runtime layer: `codex/`

## 유지하는 보고서

커밋 상태로 유지하는 검증 문서는 아래 한 개만 남긴다.

- `v35_Runtime_Validation_Status.md`

기준:

- 현재 상태나 gap 판단을 빠르게 검토해야 한다.
- release, hold, retest 판단에 직접 사용한다.
- 단순 asset mirror가 아니라 현재 verdict를 담는다.
- retained report는 공통으로 `Status / Evidence / Gap / Next Retest` 템플릿을 사용한다.

## 필요 시 재구성 규칙

아래 표면은 committed validation wrapper를 따로 유지하지 않는다.
필요하면 실제 source-of-truth asset에서 즉시 재구성한다.

- runtime charter, component, substrate:
  - `docs/agent-runtime-os.md`
  - `harness/runtime_os_charter.json`
  - `harness/runtime_component_map.json`
  - `harness/runtime_substrate_contract.json`
- tool, MCP, mock tool:
  - `docs/agent-runtime-os.md`
  - `harness/tool_capability_registry.json`
  - `harness/mcp_capability_registry.json`
  - `harness/mock_tool_contracts.json`
  - `harness/tool_surface_quality_harness.json`
- policy, sandbox, containment:
  - `docs/agent-runtime-os.md`
  - `harness/policy_rule_set.json`
  - `harness/policy_eval_observability_triangle.json`
  - `harness/sandbox_policy.json`
  - `harness/sandbox_escape_harness.json`
- observability, telemetry, runner:
  - `docs/agent-runtime-os.md`
  - `harness/observability_harness.json`
  - `harness/telemetry_schema.json`
  - `harness/runner_contract.json`
  - `harness/trial_isolation_policy.json`
- inventory와 readiness 입력:
  - `harness/feedforward_guide_inventory.json`
  - `harness/sensor_inventory.json`
  - `harness/harness_readiness_checklist.json`
  - `harness/failure_classification.json`
- scenario, replay, release:
  - `docs/prompt-runtime-verification.md`
  - `harness/prompt_runtime_verification_protocol.json`
  - `harness/prompt_behavior_release_gate.json`
  - `harness/runtime_os_scenarios.json`

## 사용 규칙

- `validation/` 문서를 source-of-truth로 사용하지 않는다.
- lookup과 runtime assembly는 `docs/`, `harness/`, `04_harness/`, `AGENTS.md`, `PROMPT_USER_GUIDE.md`를 우선한다.
- `validation/` 문서와 실자산이 충돌하면 실자산이 우선한다.
- 단순 asset summary는 committed report로 남기지 않는다.

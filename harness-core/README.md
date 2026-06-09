# HARNESS Core

HARNESS Core is an evidence-gated autonomous agent engineering harness.
Canonical directory/slug: `harness-core`.

Default operating mode: root workspace.

Use this repository directory directly as the autonomous coding agent project root.
The export zip is a secondary transfer/archive artifact, not the primary source of truth.

기본 운영 방식은 루트 워크스페이스 모드입니다.
에이전트는 이 디렉토리에서 직접 시작합니다.
`exports/harness-core-agent-ready.zip`은 다른 환경으로 전달할 때 사용하는 보조 산출물입니다.

Status: `v2.0.0-harness-core-final-precommit-convergence-autopilot`

This package is the HARNESS Core final dossier/export workspace. The current state is recorded in `CURRENT_STATE.yaml`; new agents should start with `START_HERE_FOR_AGENTS.ko.md` and `AGENT_BOOTSTRAP.ko.md`.

`CURRENT_STATE.json` is also included for dependency-free agent bootstrap checks.

## Structure

Root files are limited to entrypoint, state, manifest, package, and final handoff surfaces.
Guide documents live under `docs/guides/`. Stage documents, release assets, and executable scripts are grouped by type and domain under `docs/`, `release/`, and `tools/`.

| Path | Role |
|---|---|
| `AGENTS.md`, `START_HERE_FOR_AGENTS.ko.md`, `AGENT_BOOTSTRAP.ko.md` | agent entrypoint and bootstrap |
| `CURRENT_STATE.yaml`, `CURRENT_STATE.json` | current source-of-record state |
| `stack.yaml`, `stack.schema.json`, `MANIFEST.asset_classes.yaml` | machine-readable manifest and asset-class policy |
| `README.md`, `NAME_MIGRATION.md`, `FINAL_HANDOFF.ko.md`, `FINAL_NEW_CONVERSATION_PROMPT.ko.md` | root-level human handoff and compatibility surfaces |
| `docs/guides/` | stable user/operator guides |
| `docs/` | type-grouped plans, gate notes, claim boundary docs, handoffs |
| `templates/` | copyable external project templates |
| `tools/` | type/domain-grouped executable check/run/audit/build scripts |
| `tools/lib/` | shared tool helper code |
| `core/`, `adapters/`, `runtime/`, `schemas/` | core spec, adapter contracts, runtime contracts, schemas |
| `security/`, `observability/`, `evals/` | security, telemetry, fixtures/reports |
| `release/` | type/lane-grouped claim, gate, scope, blocker, decision, and approval assets |
| `evidence/`, `exports/`, `dist/`, `archive/` | evidence records, transfer archives, generated output, historical archive |

## New Project Usage

For a new product project, keep the product repository as `<new-project-root>` and vendor HARNESS Core under:

```text
<new-project-root>/.harness/harness-core/
```

Product code should remain in the language/framework-standard layout of the project, such as `src/`, `app/`, `tests/`, `cmd/`, or `internal/`. Project state, evidence, release boundaries, and project-specific checkers live at the project root:

```text
<new-project-root>/CURRENT_STATE.yaml
<new-project-root>/PROJECT_BRIEF.md
<new-project-root>/evidence/
<new-project-root>/release/
<new-project-root>/tools/
```

Reusable project templates are available in:

```text
templates/external-project/
```

Structured user input for a new project is captured with:

```text
docs/guides/PROJECT_INPUT_TEMPLATE.ko.md
```

After copying the templates into a project root, run:

```bash
node tools/check_project_current_state.mjs
node tools/check_project_claims.mjs
```

Do not place project-specific code, evidence, or checkers under `.harness/harness-core/`. HARNESS Core remains the vendored reference unless a separate harness adaptation task is explicitly approved.

From the HARNESS Core workspace, validate the external project template contract with:

```bash
node tools/checks/workspace/check_external_project_template_contract.mjs
```

Compatibility agent-ready clean export artifact:

- `exports/harness-core-final-agent-ready.zip`
- Compatibility export artifact only. Do not use it as the canonical new-agent delivery artifact.

Canonical agent-ready clean export, secondary transfer/archive artifact:

- `exports/harness-core-agent-ready.zip`
- Exact SHA-256 is recorded outside the archive in delivery metadata or `evidence/clean-artifact-prune/agent_ready_clean_export_report.json`. The clean export does not hard-code its own SHA in internal documents.

Latest dossier evidence export:

- `exports/v2.0.0-rc.1-postrc-final-dossier-export.zip`
- SHA256: `4f863c921cf1e00098f88913ba0810e8808cfff1dca824a2feeb9d1a0a48c424`

The final dossier/export alignment did not perform an OpenAI provider call, local model generation, telemetry sink write, redteam rerun, adapter conformance rerun, release gate rerun, or production deployment.

## Self-Contained Agent Check

Root workspace mode is the default mode for work in this repository directory. In root workspace mode, run this first command from the repository root:

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
```

Root workspace mode may also run source-workspace-only checks:

```bash
node tools/checks/workspace/check_current_state_alignment.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

Before owner commit approval, root workspace mode also runs the final precommit convergence checker:

```bash
node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs
```

This checker is root-workspace-only and is not the default command for agent-ready export mode.

Agent-ready export mode is the transfer/archive mode for a newly extracted clean export. It has no `node_modules` and no `.git` metadata. After extracting the agent-ready clean export, run these commands inside the extracted clean export directory:

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

This check uses only Node.js built-in modules. It does not require `npm install`, `npm ci`, `node_modules`, or legacy reference source access.
`node tools/checks/workspace/check_current_state_alignment.mjs` is root-workspace-only and is not the default command for agent-ready export mode.

## Root Workspace Archive Checker

The clean export archive checker is separate. Use it only from the original workspace when inspecting the archive file at `exports/harness-core-agent-ready.zip`:

```bash
node tools/checks/workspace/check_clean_export_self_contained.mjs
```

Do not treat `node tools/checks/workspace/check_clean_export_self_contained.mjs` as the default first command for a newly extracted clean export.

The self-contained stage records only weak claims: `self-contained-agent-ready-check-recorded`, `self-contained-clean-export-checked`, and `current-state-json-recorded`.

## Current Allowed Claims

- provider-diverse
- local-model-verified
- post-export-active-provider-lanes-verified
- post-export-active-adapters-checked
- post-export-active-scoped-production-ready
- post-export-active-scoped-stable
- post-rc-openai-only-stable
- post-rc-openai-only-production-ready
- production-monitored
- telemetry-connected
- containment-verified
- rc1-openai-scope-release-gated

These claims remain blocked as bare/general claims: `provider-verified`, `adapter-checked`, `production-ready`, `stable`, `release-gated`, and `bare release-gated`.

Scoped claims must not be canonicalized into bare claims. `post-export-active-scoped-stable` is not bare `stable`; `post-export-active-scoped-production-ready` is not bare `production-ready`; `rc1-openai-scope-release-gated` is not bare `release-gated`.

## Validation

Root workspace mode:

```bash
node tools/checks/workspace/check_current_state_alignment.mjs
node tools/checks/workspace/check_agent_ready_self_contained.mjs
node tools/scanners/release/scan_prohibited_claims.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs
node tools/checks/workspace/check_external_project_template_contract.mjs
```

Agent-ready export mode:

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

# Project Brief

## Project

- Name: `<PROJECT_NAME>`
- Slug: `<project-slug>`
- Harness reference: `.harness/harness-core/`
- Source input: `PROJECT_INPUT.md`
- Source input template: `.harness/harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`

## Goal

`<ONE_SENTENCE_GOAL>`

## Users

- `<target user>`

## Requirements

### Functional

- `<functional requirement>`

### Non-Functional

- `<non-functional requirement>`

## Acceptance Criteria

- `<observable acceptance criterion>`

## Out Of Scope

- `<explicitly out-of-scope item>`

## Verification Plan

- Project current-state check: `node tools/check_project_current_state.mjs`
- Project claim check: `node tools/check_project_claims.mjs`
- Project precommit check: `node tools/check_project_precommit.mjs`

## Claim Boundary

Strong claims remain blocked unless project-specific gates and evidence explicitly open them:

- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`

# State Contract

Metadata:
- asset_name: STATE_CONTRACT.md
- purpose: Autonomous-agent state contract.
- owner_layer: autonomous_agent_assets
- harness_subsystems: State
- claim_strength: candidate-local

## 1. Purpose

This contract defines the state surface that an autonomous agent must use before continuing, resuming, or closing long-running work in the active package.

The state layer is not a narrative summary. It is the operational source for current feature status, resume context, evidence references, and known blockers.

## 2. Required State Reads

Before continuing long-running work, read:

- `state/feature_list.json`
- `state/progress.md`
- `state/session-handoff.md`

When the task depends on evidence, release status, or prior decisions, also read:

- `state/decision_log.md`
- `state/evidence_log.json`
- `records/current_state.json`
- `docs/CURRENT_STATE.md`
- `docs/ARTIFACT_MAP.md`

## 3. Minimum State Model

Maintain these fields as explicit working state:

- `goal`
- `solved_condition`
- `active_feature_id`
- `wip_limit`
- `current_checkpoint`
- `completed_work`
- `open_work`
- `blocked_work`
- `last_known_good_state`
- `evidence_artifacts`
- `verification_state`
- `next_session_bootstrap`
- `approval_boundary`
- `claim_strength`

## 4. Feature List Rules

- Treat `state/feature_list.json` as the feature-status authority.
- Respect `wip_limit`.
- Do not start a new feature when `active_feature_id` is already assigned unless the operator explicitly changes the plan.
- Update feature status only when evidence supports the new state.
- Keep `definition_of_done` and `verification` aligned with the actual artifact path.

## 5. Progress Rules

- `state/progress.md` records the current execution checkpoint, not a full transcript.
- Add only information needed for the next agent to resume safely.
- Preserve unresolved blockers and unverified assumptions.
- Do not convert a partial result into a done state.
- Use exact filenames, commands, run IDs, scenario IDs, and evidence paths when they govern continuation.

## 6. Handoff Rules

`state/session-handoff.md` must be sufficient for a future agent to resume without chat history.

At minimum, it should preserve:

- current feature or bounded slice
- latest checkpoint
- changed artifacts
- executed validation
- failed or skipped validation
- unresolved blockers
- assumptions and limitations
- next safest action
- closeout status

## 7. Write Conditions

Update state artifacts when:

- work starts or changes the active feature
- a checkpoint changes materially
- validation produces new evidence
- a blocker is discovered or resolved
- closeout needs to preserve resume context

Do not update state merely to restate chat content or create activity theater.

## 8. Claim Discipline

- State says what is known; verification says what passed.
- A state entry without runnable evidence cannot justify completion.
- A handoff note is not a validation result.
- A planned next step is not progress.
- A copied old state is stale until checked against current files.

## 9. Anti-Patterns

- resuming from chat history while ignoring `state/session-handoff.md`
- changing `feature_list.json` without matching evidence
- leaving `active_feature_id` ambiguous during WIP
- hiding blockers in prose instead of state
- claiming done from state text alone
- letting stale state outrank current validation output

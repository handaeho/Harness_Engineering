# PROMPT_harness_engineering

## 0. Purpose

This document is the official `harness engineering` prompt-stack layer owner document for the `active package`.

Core goals:

- make the harness explicit as the execution and operations layer outside the prompt
- fix the `Guide + Sensor + Runner + Simulator + Sandbox + Telemetry + Gate` model
- distinguish prompt fixes from harness fixes
- make trace-first failure handling the default path

## 1. Core Definition

- A harness is the full execution environment around the model.
- A harness includes prompts, instruction files, tools, MCP, runtime, runner, mock tools, simulator, sandbox, filesystem, memory, identity, policy, artifact store, telemetry, approval boundary, replay program, and release gate.
- A good harness has both `feedforward guide` and `feedback sensor` surfaces.
- Harness engineering is not just prompt engineering.
- The human role shifts from directly writing code toward designing the environment that lets agents read, execute, verify, and repair work reliably.

## 2. Activation Levels

### 2.1 Always-on minimum

- instruction boundary
- approval boundary
- read/write scope
- verify-before-claim
- bounded change

### 2.2 Conditional harness

Strengthen the harness when any of the following exist:

- tool use
- multi-turn workflow
- external state dependency
- higher-risk mutation
- reproducibility requirement

Strengthening items:

- trace capture
- mock tool or dedicated runner
- sandbox policy
- outcome vs trajectory grading

### 2.3 Release-grade harness

Raise to release-grade only when any of the following exist:

- repeated replay decision
- promotion or hold decision
- live telemetry or anomaly review
- long-running coding continuity

Required items:

- stable isolated runner
- trace and telemetry lineage
- replay reproducibility
- explicit gate owner, threshold, action

## 2A. Harness Maturity Levels

- `prompt-reviewed`
- `harness-designed`
- `config-harness-ready`
- `code-defined-harness-ready`
- `harness-executed`
- `replay-verified`
- `release-gated`
- `production-monitored`

Maturity rule:

- `config-harness-ready` means model, prompt, tools, memory, identity, sandbox, and observability are connected through a config surface.
- `code-defined-harness-ready` means custom runtime logic such as routing, custom orchestration, fallback, lifecycle control, replay runner, or simulator runner is implemented.
- `managed runtime harness` means the platform provides substrate such as the orchestration loop, session runtime, tool execution, streaming, or microVM substrate.
- Do not use a stronger maturity label without actual substrate evidence.

## 2B. Runtime Substrate Classes

- `config harness`
  - connects model, system prompt, tools, memory, identity, filesystem, basic policy, and basic observability through configuration
- `code-defined harness`
  - owns custom routing, lifecycle control, tool fallback, multi-agent coordination, recovery, replay, simulator, and evaluator in code
- `managed runtime harness`
  - platform provides substrate such as orchestration loop, session runtime, tool selection, action execution, streaming, and suspend / resume

Substrate rule:

- Do not over-implement orchestration code for problems solvable through config changes.
- Do not try to solve problems requiring custom orchestration with prompt wording alone.
- When generated code execution, reasoning runtime, artifact store, or containment boundary must be separated, inspect substrate architecture first.

## 2C. Agent Runtime Operating System Framing

The `active package` must be readable as harness doctrine across these Runtime OS layers:

- Instruction Layer
- Repository Legibility Layer
- Context Substrate
- Tool / MCP Capability Layer
- Policy Control Plane
- Sandbox / Containment Layer
- Execution Runner
- Observability / Telemetry Layer
- Evaluation / Replay Harness
- Memory / Adaptation Layer
- Multi-Agent / Orchestration Layer
- Human Review / Approval Layer
- Release / Rollback Layer
- Agentic Garbage Collection Layer

Runtime-OS rule:

- The prompt is only one of the operational layers above.
- For repeated failures, first diagnose which substrate is weak: prompt, context, tool, policy, sandbox, observability, eval, memory, orchestration, or documentation.
- Knowledge the agent cannot read, execution results the agent cannot observe, and paths not preserved as traces cannot support stronger runtime claims.

Prompt runtime verification rule:

- Do not pass a prompt based on one good sample answer.
- Compare the `full`, `light/lightest`, and `standalone/relevant skill` bundles together.
- Do not inflate weaker signals such as tool success, trace captured, replay-ready, or sandbox exists into stronger release wording.

## 3. Agent-First Repository Legibility

- Treat knowledge the agent cannot access as effectively unavailable.
- Repo-local, version-controlled, cross-linked artifacts are the base unit.
- `AGENTS.md` should be a map or entrypoint, not an encyclopedia.
- Detailed knowledge should live in versioned surfaces such as `docs/`, specs, plans, references, and quality docs.

Repository legibility rule:

- `AGENTS.md` should usually contain only entrypoints, main document locations, build/test/lint/typecheck locations, prohibited risky actions, approval boundary, and stale-doc check paths.
- Do not place per-session hypotheses, one-off ticket context, or verbose tricks in the always-on surface.

## 4. Documentation Freshness Harness

- A stale doc is a harness failure, not a prompt failure.
- CI or a doc linter should monitor cross-links, referenced-file existence, code-doc drift, completed-plan drift, and deprecated runtime-rule drift.
- If a doc-gardening workflow exists, stale-doc candidates should be corrected against code and tests.

Freshness rule:

- `docs present` is not `docs fresh`.
- If stale docs repeatedly induce failure, fix the freshness harness before making the prompt longer.

## 5. Feedforward And Feedback

### Feedforward guides

- `AGENTS.md`
- base prompts
- overlays
- skill docs
- tool contracts
- architecture or process docs

### Feedback sensors

- computational sensors
  - unit tests
  - schema checks
  - lint
  - typecheck
  - deterministic runner assertions
- inferential sensors
  - review agent
  - rubric judge
  - trajectory judge
  - source-quality judge

Rule:

- An inferential sensor does not replace a deterministic sensor.
- A guide without a sensor is a weak harness.
- A sensor without a guide can easily become a brittle harness.

## 6. Agent-Readable Observability Harness

- To reproduce and verify behavior, the agent must be able to read UI, logs, metrics, traces, and runtime events.
- When an app or UI exists, consider a per-worktree app runner, isolated environment, browser or DevTools access, DOM snapshot, screenshot, log query, metric query, trace query, smoke journey, reproduction script, and post-fix verification script.

Observability rule:

- Lower proof strength when the agent cannot directly observe the failure state before the fix and the success state after the fix.
- Isolate logs and metrics so one run cannot contaminate another run.

## 6A. Policy / Observability / Evaluation Triangle

- `Policy`
  - deterministic allow / deny before tool calls
  - controls by user, role, resource, action, and condition
  - defaults should stay close to deny
- `Observability`
  - collects trace, span, tool call, retry, latency, cost, token, memory operation, shell command, network event, and approval event during execution
- `Evaluation`
  - evaluates output quality, task adherence, safety, trajectory, and policy deviation after execution

Triangle rule:

- Policy does not replace Evaluation.
- Evaluation does not replace Policy.
- Without Observability, lower Evaluation claim strength.
- Enterprise-operation-ready language requires all three axes to be connected.

## 7. Architecture Invariant Harness

- Repeatedly important rules should be promoted from documentation into deterministic checks.
- Rules such as dependency direction, forbidden import, layer boundary, compatibility, logging, schema, and platform stability are better enforced by structural tests or linters.
- Error messages must be specific enough for the agent to repair the issue directly.

Invariant rule:

- If a human must repeatedly review the same boundary, the harness is still weak.

## 7A. Tool Surface Quality Harness

- A good tool surface has typed schema, stable identifiers, clear required parameters, explicit status semantics, filtering, pagination, field selection, idempotency key, machine-readable error, explicit side effect, and explicit partial-state model.
- Broad do-everything actions, hidden defaults, bulky responses, free-form-only output, unstable IDs, and unclear status semantics are weak tool surfaces.

Tool-surface rule:

- Tool surface failure is not prompt failure.
- If parameter guessing, wildcard scope expansion, or partial-state exaggeration repeats, fix the tool schema.

## 8. Trace-First Loop

Do not make the prompt longer immediately after seeing a failure.

1. Capture a trace.
2. Separate the failure class.
3. Choose the owner fix among `prompt / tool / docs / runner / sandbox / telemetry / simulator / approval policy`.
4. Convert one failure into one reproducible eval case.
5. Verify improvement with a rerun.
6. Do not promote the change into a durable rule before improvement is confirmed.

## 9. Harness Failure Classification

Failure class must distinguish at least the following:

- `prompt failure`
- `context failure`
- `repository legibility failure`
- `documentation freshness failure`
- `tool surface failure`
- `observability failure`
- `invariant failure`
- `validation harness failure`
- `autonomy boundary failure`
- `entropy failure`

Classification rule:

- If the failure is not a prompt failure, do not make the prompt longer.
- Fix docs, tools, telemetry, linter, runner, sandbox, or review policy according to the failure owner.

## 10. Agentic Garbage Collection Harness

- Agent-created code and docs accumulate drift and entropy over time.
- A daily or weekly cleanup loop should collect lint clusters, flaky clusters, repeated review comments, duplicated helpers, stale docs, and tech debt.
- Do not mix feature PRs with garbage collection PRs.
- Repeated failures should be promoted into rules, tests, linters, or templates instead of remaining documentation advice.

## 10A. Sandbox Escape And Containment Harness

- Sandbox existence alone is not enough.
- Shell, filesystem, browser, DB, network, or arbitrary code execution requires process isolation, filesystem boundary, egress policy, credential boundary, timeout, resource limit, cleanup, artifact export, and audit log.
- In high-risk environments, evaluate sandbox misconfiguration, privileged container, exposed docker socket, host filesystem mount, broad egress, long-lived secret, and prompt injection via file/log/webpage.

Containment rule:

- Prompt-injection defense cannot rely on text filtering alone.
- Blast-radius containment architecture is required.
- High-risk eval should consider sandbox-within-sandbox or VM isolation.

## 11. Throughput-Aware Review And Merge Harness

- When agent throughput exceeds human review throughput, reviewing every PR at the same depth becomes a bottleneck.
- Instead, split merge philosophy by risk class.

Risk classes:

- `low-risk short-lived PR`
- `medium-risk PR`
- `high-risk PR`
- `security / data / auth / migration / deployment PR`

Merge rule:

- Deterministic checks and risk class must determine human attention distribution first; agent review sits on top of that.
- Agent review does not replace deterministic checks.

## 12. End-To-End Agent Task Loop

- A coding agent must be able to run the full loop, not just patch: reproduce -> evidence -> implement -> verify -> review -> merge-ready.
- Each step must be able to preserve `run_id`, `scenario_id`, `trace_id`, `worktree_id`, `evidence artifact`, `verification result`, `unresolved blocker`, `approval state`, and `rollback note`.

Task-loop rule:

- Do not strengthen fixed claims without reproduction.
- Do not describe PR opened as task complete.

## 12A. Long-Running Initializer And Handoff

- Long-running coding or analysis tasks require an initializer artifact and a per-session handoff artifact.
- The initializer preserves `initial_spec`, `feature_list`, `task_status`, `init_command`, `environment_bootstrap`, `dependency_install_state`, `known_risks`, and `acceptance_criteria`.
- The per-session artifact preserves `session_id`, `run_id`, `current_feature`, `completed_features`, `blocked_features`, `last_known_good_state`, `current_checkpoint`, `executed_tests`, `failed_tests`, `unresolved_blockers`, `next_session_bootstrap`, and `closeout_summary`.

Long-running rule:

- Process only one feature or bounded slice at a time.
- If the baseline is broken, prioritize baseline recovery over new feature work.
- Do not strengthen complete claims without session closeout.

## 13. Human Taste Encoding

- Do not leave repeated review comments as session-local notes only.
- When they repeat, promote them into a style guide, coding guide, repo instruction, linter, structural test, template, or release gate.

Taste-encoding rule:

- If a human repeats the same critique, the harness has not yet structured that preference.

## 14. Agent-First Technology Choice

- Technology selection must consider agent legibility as well as human DX.
- Evaluate typed boundaries, testability, observability, reproducibility, doc clarity, deterministic behavior, dependency complexity, and repo-local internalization potential.

Tech-choice rule:

- If upstream opacity causes repeated failures, consider whether a simpler repo-local helper would be better.
- Do not reimplement by default.

## 15. Structural Rule

- `04_harness` is the official owner layer.
- `harness/` is executable substrate.
- Top-level validation docs record verdicts and evidence.

Do not:

- treat `harness/` as owner doctrine
- create an executed harness claim from `04_harness` documents alone
- exaggerate packet name existence into executed proof

## 16. Required P0 Artifacts

- `Harness Coverage Matrix`
- `Runner Contract`
- `Sandbox Policy`
- `Telemetry Schema`
- `Trace Schema`
- `Trace-to-Eval Conversion Record`

## 17. Required P1 Agent-First Artifacts

- `Repository Legibility Harness`
- `Documentation Freshness Harness`
- `Agent-Readable Observability Harness`
- `Architecture Invariant Harness`
- `Harness Failure Classification`
- `Agentic Garbage Collection Harness`
- `Throughput-Aware Review and Merge Harness`
- `End-to-End Agent Task Harness`
- `Human Taste Encoding Loop`
- `Agent-First Technology Choice Review`
- `Harness Readiness Checklist`

## 18. Claim Language

- `prompt-reviewed`
- `harness-designed`
- `config-harness-ready`
- `code-defined-harness-ready`
- `harness-executed`
- `replay-verified`
- `release-gated`
- `production-monitored`

Rule:

- A stronger label cannot be used without the weaker prerequisite.

## 19. Claim Strength Gate

- `plausible`
  - logical plausibility only
- `locally-checked`
  - local unit or artifact check exists
- `runner-executed`
  - runner actually executed the path
- `replay-verified`
  - same scenario was replayed with verdict linkage
- `integration-verified`
  - integration path was exercised
- `release-gated`
  - threshold and owner gate passed
- `production-monitored`
  - live telemetry and response actions are connected

Claim-strength rule:

- Do not describe `plausible` as fixed.
- Do not describe a local check as integration proof.
- Do not describe runner setup as runner execution.
- Do not describe replay-ready as replay-verified.
- Do not describe trace captured as evaluation passed.
- Do not describe sandbox exists as containment verified.

<!-- V35_RELEASE_STABLE_PATCH_START -->
## active package Release Substrate Readiness Matrix

This active package release addendum separates substrate readiness.

- Guide, sensor, runner, simulator, sandbox, telemetry, and gate are independently reviewable.
- Missing sensor or runner evidence downgrades operational claims even when guide text is strong.
- Missing sandbox containment evidence downgrades destructive-action safety claims.
- Missing telemetry downgrades production-monitored claims.
- Missing replay verdicts downgrade replay-ready claims.
<!-- V35_RELEASE_STABLE_PATCH_END -->

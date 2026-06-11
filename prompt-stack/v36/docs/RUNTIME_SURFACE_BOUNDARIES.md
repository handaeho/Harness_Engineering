# Runtime Surface Boundaries

Metadata:
- asset_name: RUNTIME_SURFACE_BOUNDARIES.md
- purpose: Separate prompt-stack coding-agent assets from harness-core autonomous runtime assets.
- claim_strength: local_static_runtime_validation

## Prompt Stack

`prompt-stack/<current_package>` is a coding-agent prompt package.

Primary deployable runtime packages:
- `prompt-stack/<current_package>/codex`
- `prompt-stack/<current_package>/gemini`

Codex application layout:

```text
<project>/AGENTS.md
<project>/.codex/skills/*/SKILL.md
```

Gemini CLI application layout:

```text
<project>/.gemini/GEMINI.md
<project>/.gemini/skills/*/SKILL.md
```

Gemini manual context layout:

```text
<project>/GEMINI.md
<project>/skills/*/SKILL.md
```

Manual context layout keeps the files readable by the model, but automatic Gemini CLI skill activation requires `.gemini/skills/` or `.agents/skills/`.

## Harness Core

`harness-core` is not a coding-agent prompt package.

It is an autonomous programming-agent runtime/evidence/gate package.

Provider assets live under:

```text
harness-core/adapters/
harness-core/tools/runners/
harness-core/tools/checks/
harness-core/evals/
harness-core/evidence/
harness-core/release/
```

Gemini provider assets live under:

```text
harness-core/adapters/api/gemini/
harness-core/tools/runners/providers/run_gemini_provider_canary.mjs
harness-core/tools/checks/providers/check_provider_canary_gemini.mjs
harness-core/tools/checks/providers/check_gemini_runtime_asset_pack.mjs
```

## Boundary Rule

Do not use `prompt-stack/<current_package>/gemini` as evidence that harness-core Gemini provider execution works.

Do not use `harness-core/adapters/api/gemini` as a Gemini CLI skill package.

Allowed relationship:
- prompt-stack defines coding-agent behavior
- harness-core defines autonomous runtime provider contracts
- both may reference official Gemini documentation
- both must preserve separate validation and claim boundaries

Blocked collapsed claims:
- prompt-stack static validation implies provider verification
- harness-core dry-run implies Gemini CLI skill activation
- Gemini API compatibility implies native Gemini conformance
- local dry-run implies live provider canary pass

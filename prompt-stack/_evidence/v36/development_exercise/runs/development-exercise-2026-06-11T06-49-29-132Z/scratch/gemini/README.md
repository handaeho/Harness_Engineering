# prompt-stack gemini runtime

Task: implement a deterministic feature flag evaluator.

Acceptance criteria:
- disabled flag returns off
- blocklist has highest priority
- allowlist enables targeted user
- country targeting excludes non-target country
- zero rollout excludes ordinary user
- enabled full rollout selects weighted variant

Command:

```sh
node featureFlagEvaluator.test.mjs
```

# Gemini Evaluation Operations Reference

Use this reference only after `eval-ops` activates and Gemini behavior or claims must be judged.

## Proof Classes

- `local_static_runtime_validation`: runtime files and static checks passed.
- `credentialed_canary_executed`: a live Gemini call ran under explicit credential, network, data, and approval boundaries.
- `provider_verified`: the required live provider evidence set passed.
- `adapter_checked`: adapter conformance checks passed for required cases.
- `release_gated`: an explicit release gate passed.
- `production_ready`: production criteria and monitoring evidence are present.

## Gemini Evidence

- Text canary evidence does not prove structured output or tool calling.
- Structured output claims require live schema-shaped response and local JSON-schema validation.
- Function-calling claims require argument validation, approval decision, mock or approved tool execution, output reclassification, redaction, and function-response reinjection.
- Safety claims require response metadata or blocked-output evidence.

## Verdict

- Keep native Gemini and OpenAI compatibility evidence separate.
- Downgrade static validation to local static proof.
- Do not use `provider_verified`, `adapter_checked`, `release_gated`, `production_ready`, or live canary language without matching executed evidence.

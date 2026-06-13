# Release Grade Provider Gate

`node tools/checks/providers/check_release_grade_provider_verified_gate.mjs`
evaluates whether the bare provider claim can be opened.

The gate reads existing evidence only. A `hold` result is a successful gate
observation that keeps the bare claim blocked. Only `status: pass` may add the
bare provider claim to allowed claims.

The current required surfaces are provider behavior, schema roundtrip, tool
roundtrip, replay or regression evidence, redaction, trace evidence, and
provider error handling for OpenAI, Gemini, and Ollama lanes.


# Additional OpenAI Redteam Command Plan

Execution is not allowed in this stage.

The exact approval phrase has now been provided. The generated execution stage
uses:

- `node harness-core/tools/runners/openai/run_additional_openai_redteam_execution.mjs`
- `node harness-core/tools/checks/openai/check_additional_openai_redteam_execution.mjs`

The runner must still be invoked with the exact approval phrase and an operator
shell that has `OPENAI_API_KEY` and `OPENAI_MODEL` set. Running it performs
OpenAI provider calls.

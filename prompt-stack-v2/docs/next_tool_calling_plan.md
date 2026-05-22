# Next Tool Calling Plan

Tool calling remains closed in the provider canary stage.

Suggested next scope:
1. Add a separate OpenAI tool-calling canary scope.
2. Use a mock function schema only.
3. Do not connect the function to external systems.
4. Require approval gate evidence before any real tool side effect can be considered.
5. Keep `tool-call-verified` blocked until argument schema, approval, trace, and blocked-tool cases pass.

Required preconditions:
- OpenAI no-tool provider canary pass
- structured output decision recorded separately
- explicit operator approval for tool-calling execution
- no external side-effect tools enabled

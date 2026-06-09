# Tool Output Trust Policy

Provider canary mock tool outputs are never trusted merely because the local
tool is deterministic.

Required handling:

- classify every mock tool output as `untrusted_tool_output`
- preserve `trusted: false`
- reinject only the classified output
- record the classification in trace and evidence
- do not use canary success as a tool-call verification claim

This policy keeps `mock-tool-output-reinjection-checked` separate from
`tool-call-verified`.

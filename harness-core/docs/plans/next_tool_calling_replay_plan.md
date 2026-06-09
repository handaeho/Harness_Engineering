# Next Tool Calling Replay Plan

Replay is not part of `v2.0.0-beta-tool-calling-canary-openai`.

Before replay can be claimed, define:

- fixed replay attempt IDs
- trace lineage checks
- expected provider request count
- expected tool call count
- expected final response markers
- failure classification for provider, mapper, approval, execution, and final response failures

One passing credentialed tool-calling canary does not allow `replay-verified`.

# qwen3:14b Replay Acceptance Policy

- Exact string match is diagnostic.
- No-tool canonical replay can pass when required final content is present.
- Structured replay can pass when JSON parses and required schema fields validate.
- This does not open `replay-verified`.

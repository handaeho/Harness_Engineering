# Redteam Mock Compatibility Policy

The mock runtime executes only cases whose target surface can be evaluated by
deterministic harness logic. Provider-only, local-only, and future non-mock
surfaces are recorded as `skipped_not_mock_compatible`.

Skipped cases:
- do not count as failures
- do not grant redteam passed claims
- remain pending for provider/local execution planning

Some fixture target surfaces are routed through aliases, such as
`structured_output` to `structured_output_boundary` and `tool_arguments` to
`schema_boundary`, so existing design fixtures can exercise mock boundaries
without changing the original fixture authoring intent.

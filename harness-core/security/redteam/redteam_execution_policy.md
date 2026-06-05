# Redteam Execution Policy

Stage: v2.0.0-beta-redteam-suite-design

Execution status: design_only

The execution gate is intentionally closed in this stage. A later execution stage must select a mock or provider target, obtain explicit scope approval, run a redteam runner, record per-case results, and preserve redacted trace evidence before any redteam execution claim can be considered.

Required before execution:
- Redteam case schema validates.
- All fixture files parse.
- Severity rubric and pass/fail policy exist.
- Execution scope is explicitly approved.
- Target surface is selected.
- Secret-looking and side-effect-looking payloads are absent.

# Agent Skill Research Ledger

This ledger is advisory context for skill asset design. Official product and API documents remain the authority for Codex, Gemini, and Agent Skills behavior.

## Checked Sources

| ID | Source | Date | Use |
|---|---|---:|---|
| ASR-001 | `https://arxiv.org/abs/2606.11543` | 2026-06-11 | Progressive disclosure can change skill uptake and verifier outcomes when supporting resources guide implementation, checking, or repair. |
| ASR-002 | `https://arxiv.org/abs/2603.29919` | 2026-06-11 | Skill bodies should separate actionable core rules from supplementary resources to reduce token load and distraction. |
| ASR-003 | `https://arxiv.org/abs/2605.11418` | 2026-06-11 | SKILL.md text can influence discovery, selection, and governance, so descriptions and instructions need explicit scope and negative boundaries. |
| ASR-004 | `https://arxiv.org/abs/2602.12430` | 2026-06-11 | Skill lifecycle and security governance should treat skill provenance, permissions, and deployment confidence as separate gates. |

## Design Implications

- Keep startup-facing descriptions concise, trigger-rich, and bounded.
- Keep SKILL.md procedural and short.
- Move detailed implementation, checking, repair, and evaluation procedures into one-level references.
- Validate routing and reference uptake with forward tasks, not only file-existence checks.
- Treat third-party or research claims as design rationale, not runtime law.

## Boundaries

- This ledger does not prove runtime behavior.
- It does not override official OpenAI, Google, Gemini CLI, or Agent Skills specification documents.
- It does not permit production, provider, adapter, release, or monitoring claims.

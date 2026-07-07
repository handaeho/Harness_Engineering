---
name: grounded-research
description: Use for Codex-aware source-grounded research when trust depends on official OpenAI Codex docs, citations, freshness checks, source comparison, or latest provider/CLI facts. Triggers include AGENTS.md discovery, .agents/skills discovery, SKILL.md structure, .codex/config.toml, approvals, sandboxing, MCP, hooks, rules, automation, and source ledger updates. Do not use for direct code patches, architecture decisions without source gaps, eval/release gates, harness creation, or subagent coordination.
---

# Grounded Research Instructions

## Activation

Activate when trust depends on external, current, official, or document-bound evidence.
Do not activate for direct implementation once the evidence target is satisfied.

## Procedure

Use:

`Analyze -> Retrieve -> Synthesize -> Verify -> Handoff`

1. Define the exact claim, question, or decision needing evidence.
2. Prefer official and primary sources.
3. Retrieve the smallest source set that satisfies the evidence target.
4. Separate source facts from inference.
5. Mark stale, conflicting, or missing evidence as `Need Verification`.
6. Hand off to `coding-core`, `design-analysis`, or `eval-ops` when research changes into execution, design, or gate judgment.

For Codex source ledgers, official-doc freshness, AGENTS.md discovery, skill discovery, and source-to-runtime claim boundaries, read `references/grounded-research.md` when Codex facts govern the work.

## Codex Source Rules

Use official OpenAI sources for:
- Codex CLI, IDE extension, app, and exec behavior
- `AGENTS.md` discovery and precedence
- `.agents/skills` discovery and `SKILL.md` lifecycle
- `.codex/config.toml` precedence
- approvals, sandboxing, permissions, MCP, hooks, rules, plugins, and subagents

Do not cite memory as authority for Codex behavior.
Do not use third-party examples as primary evidence when official docs exist.

## Claim Boundary

Source review can support `official-docs-checked` or `Need Verification` handoff language.
It does not prove live Codex behavior, command execution, CI checks, release gates, or production readiness.
Downgrade any claim whose source freshness, runtime version, or execution evidence is missing.

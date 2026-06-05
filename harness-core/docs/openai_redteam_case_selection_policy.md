# OpenAI Redteam Case Selection Policy

The limited subset includes prompt injection, system prompt leakage, sensitive information disclosure, refusal boundary, structured/schema boundary, tool output trust boundary, and canary regression probes.

The subset is capped at 12 cases with at most 2 critical, 6 high, and 4 medium cases. Cases requiring local endpoints, future RAG, built-in tools, external network, shell execution, or file writes are excluded.

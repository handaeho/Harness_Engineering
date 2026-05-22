---
name: grounded-research
description: Use for document-grounded investigation, evidence-backed summaries, source-aware comparison, freshness-sensitive questions, and deep research tasks that require retrieval, synthesis, and bounded exploration.
---

# Grounded Research Skill

This skill is the primary execution pack for evidence-sensitive research and source-grounded analysis.

It extends the base project constitution with:
- retrieval and grounding discipline
- bounded search and reasoning depth control
- freshness and provenance awareness
- source-conflict handling
- evidence-pack construction
- grounded synthesis with explicit limitation handling
- evidence vs tool-output distinction
- agentic RAG composition discipline
- safety-aware disclosure boundaries when evidence is sensitive

It is derived primarily from:
- `PROMPT_light`
- `PROMPT_retrieval_grounding_overlay`
- `PROMPT_search_reasoning_overlay`
- selected `PROMPT_guardrails_safety_overlay` principles for sensitive retrieval or disclosure paths
- relevant example families for retrieval_summary, research_synthesis, comparison, benchmark_memo, and grounded report structure

## 1. When to Use

Use this skill when one or more apply:
- the answer depends on documents, private knowledge, retrieved text, or uploaded files
- the user wants citations, evidence, references, provenance, or verification
- the answer depends on fresher information
- source conflict could change the answer
- the task is a research memo, grounded summary, benchmark comparison, or evidence-backed report
- the task requires deliberate discovery before synthesis

Do not use this skill when:
- the task is self-contained and purely local
- the user only wants direct coding help
- the question is trivial and supported by the active context already
- retrieval would mostly add noise or latency without trust gain

## 2. Primary Mission

Produce trustworthy, evidence-aware outputs by:
- defining what must be evidenced
- retrieving only what is needed
- preserving provenance and freshness awareness
- surfacing source conflict honestly
- synthesizing only to the strength the evidence supports

## 3. Grounding Decision Model

Use this sequence:

`Detect Grounding Need -> Define Evidence Target -> Check Freshness Boundary -> Select Retrieval Path -> Gather Evidence -> Slice Evidence -> Check Coverage and Conflict -> Synthesize -> Cite / Surface Limitation`

Rules:
- do not retrieve before identifying the actual evidence target
- do not synthesize before checking whether the evidence really supports the answer
- do not keep retrieving after the support threshold is met unless conflict or coverage gaps remain
- do not hide insufficiency behind polished wording

## 4. Evidence Target Discipline

Before retrieval, define:
- what exact claim needs support
- what freshness level matters
- whether the answer needs direct source support, derived synthesis, or comparative analysis
- whether exact identifiers, dates, versions, clauses, or names matter
- what claim strength is actually justified

Use the smallest evidence target that still protects truthfulness.

## 5. Search and Reasoning Discipline for Research

Use bounded exploration when:
- multiple source paths exist
- prioritization is non-trivial
- multiple hypotheses or comparisons compete
- the task is research-like rather than lookup-like

Rules:
- generate a small candidate frontier
- prioritize sources by authority, freshness, and scope fit
- prune aggressively
- stop when the next best retrieval move is sufficiently clear
- do not turn research into endless wandering
- if the workflow becomes known and one path clearly dominates, collapse back to exploit mode

Allowed techniques when justified:
- decomposition
- step-back reframing
- bounded self-consistency-style comparison
- route comparison
- selective reflection
- iterative research loops only if each loop increases evidence coverage meaningfully

Reflection contract:
- use reflection only to identify evidence gaps, conflict, missing angles, or weak synthesis boundaries
- stop once the critique no longer changes the evidence plan materially

## 6. Retrieval Path Selection

Prefer the cheapest route that satisfies the evidence target.

Typical path choices:
- direct retrieval for narrow questions
- hybrid lexical + semantic retrieval when exact identifiers and meaning both matter
- graph-like relationship tracing only when entity relations matter materially
- iterative / agentic retrieval only when initial evidence is insufficient or conflicting

Rules:
- simple retrieval before sophisticated retrieval
- currentness matters only when task reality makes it matter
- richer retrieval modes must earn their cost
- if the gain collapses, stop and surface limitation
- tool-returned observations are not automatically authoritative evidence until their provenance and fit are checked

## 7. Source Ranking and Authority

Rank sources by:
- authority
- freshness
- scope fit
- specificity
- directness
- completeness
- contradiction status

Rules:
- authoritative and fresher source over generic and stale source
- direct source over derivative summary when available
- task-specific source over broad background source when the task is narrow
- duplicated summaries do not count as independent confirmation
- the newest source is not automatically the strongest source

## 8. Freshness and Currentness

When freshness matters:
- make that boundary explicit internally
- prefer the most current source that matches scope
- treat old but authoritative sources as historical if they are no longer current
- do not imply currentness unless it has actually been checked

If the task is not time-sensitive, do not inflate the workflow with unnecessary freshness checks.

## 9. Evidence Slicing and Packaging

Retrieved evidence should be aggressively sliced before synthesis.

Keep:
- the minimum claim-supporting passages
- source identifiers
- dates or version markers when relevant
- conflict markers when needed
- exact phrasing when policy, contractual, legal, or syntax-sensitive precision matters

Avoid:
- giant document dumps
- decorative supporting excerpts
- unrelated neighboring text
- evidence stuffing that obscures the real support

If support is composite, preserve that explicitly.

## 10. Source Conflict Handling

When sources materially disagree:
- detect the disagreement
- determine whether it is superficial or outcome-changing
- rank the sources by authority, freshness, and scope fit
- resolve cleanly when possible
- preserve the conflict when not safely resolvable
- weaken claim strength when unresolved conflict remains

Never:
- silently average incompatible facts
- pretend consensus exists when it does not
- cite a source for claims it does not support

## 11. Synthesis Discipline

Synthesis must answer the user’s question, not merely summarize the retriever output.

Rules:
- separate direct source-supported claims from inference
- preserve caveats that materially affect the answer
- keep the synthesis shorter than the raw evidence when possible
- preserve uncertainty when coverage is partial
- do not reverse-engineer evidence to fit a preferred conclusion
- if the retrieved material is sensitive or the disclosure boundary is unclear, narrow, redact, or escalate rather than over-share

If the answer goes beyond direct source text, make that inferential boundary explicit.

## 12. Deep Research Mode

If the task is broad, open-ended, or multi-source:
- define a bounded research plan
- break the objective into a few meaningful sub-questions
- retrieve and validate in rounds
- use reflection only to identify evidence gaps, conflict, or missing angles
- synthesize only after evidence coverage is sufficient

A good deep research loop is:
`Question -> Sub-questions -> Source search -> Evidence pack -> Gap check -> Focused follow-up search -> Final synthesis`

Composition rule:
- deep research may compose retrieval, bounded search, and tool-assisted observation
- evidence authority still remains with grounded retrieval, not with the tool path itself

Plan approval checkpoint:
- if a deep-research plan is long-running, costly, or materially shapes downstream action, present the plan before execution
- if the research trajectory changes materially, restate the changed plan boundary before continuing

Do not:
- generate giant research plans for small questions
- run repeated low-yield searches after the answer is already strong enough

## 13. Output Contract for Grounded Work

Unless the user requests another format, prefer:

### Acknowledgment
- restate the question and evidence boundary briefly

### Analysis
- state source scope, freshness boundary, and key uncertainty if material

### Execution
- provide the answer or synthesis
- keep the main findings compact and task-faithful

### Impact & Risk
- state interpretation cautions, conflict, or remaining uncertainty where relevant

### Verification
- state what the answer is grounded on
- state what remains unsupported if anything
- state the safest next evidence step if more certainty is needed

## 14. Citation Discipline

When citations are appropriate:
- cite load-bearing claims
- preserve source-to-claim mapping
- avoid citation padding
- do not cite irrelevant or weak sources merely to look grounded
- if multiple sources support different parts, keep that distribution visible

## 15. Anti-Patterns

Avoid:
- evidence theater
- oversized evidence dumps
- currentness implied without checking freshness
- stale source used because it reads well
- unresolved conflict hidden behind smooth prose
- memory treated as current evidence
- endless retrieval after decision leverage collapses
- conclusion-first evidence hunting

## 16. Final Rule

Retrieve only when grounding gain justifies it.
Define the evidence target first.
Search with a bounded frontier.
Rank by authority, freshness, and scope fit.
Slice evidence aggressively.
Surface conflict and limitation honestly.
Synthesize only to the strength the evidence supports.

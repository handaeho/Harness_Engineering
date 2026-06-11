# Current Package Artifact Map

## Active package
- root: `README.md`, `PROMPT_USER_GUIDE.md`, `AGENTS.md`, `MASTER_PROMPT_ROUTER.md`
- autonomous assets: `autonomous/`
- Codex runtime assets: `codex/`
- Gemini runtime assets: `gemini/`
- skill reference packs: `codex/skills/*/references/`, `gemini/skills/*/references/`
- state assets: `state/`
- verification assets: `verification/`
- lifecycle assets: `lifecycle/`
- operating docs: `docs/`
- surface boundary doc: `docs/RUNTIME_SURFACE_BOUNDARIES.md`
- validation runners: `harness/`, `validation/`
- skill forward benchmark spec: `validation/skill_forward_benchmark_cases.json`
- current records: `records/`
- current reports: `reports/`

Active package에는 raw evidence dump를 두지 않는다. `sources/`, `archive/`, `04_upgraded_prompt_assets/`, `records/actor_outputs/`, `records/actor_packets/`, `validation/runs/`는 active 경로가 아니다.

## Evidence package
`_evidence/<current_package>/`는 active runtime package가 아니다. 다음 category를 보존한다.
- source collection and clone
- source application evidence
- behavioral benchmark evidence
- actor outputs
- semantic judge results
- ablation evidence
- release decision evidence
- validation run history
- skill asset enhancement validation runs
- archive traceability
- release and process reports
- checksums
- cleanup records and cleanup reports

## 운영 위치
- 현재 상태: `docs/CURRENT_STATE.md`, `state/`
- 사용자 가이드: `PROMPT_USER_GUIDE.md`
- Codex runtime: `codex/CODEX_RUNTIME_GUIDE.md`
- Codex source ledger: `codex/validation/codex_doc_grounding_sources.json`
- Gemini runtime: `gemini/GEMINI.md`, `gemini/GEMINI_RUNTIME_GUIDE.md`, `gemini/skills/*/SKILL.md`
- Gemini source ledger: `gemini/validation/gemini_doc_grounding_sources.json`
- skill research ledger: `docs/references/agent_skill_research_ledger.md`
- skill enhancement summary: `records/skill_asset_enhancement_validation_summary.json`
- validation summary: `reports/VALIDATION_SUMMARY.md`
- follow-up backlog: `records/followup_backlog.json`
- cleanup evidence: `_evidence/<current_package>/cleanup_records/`, `_evidence/<current_package>/cleanup_reports/`
- skill enhancement evidence: `_evidence/<current_package>/validation_runs/skill_asset_enhancement/`

## Root-level preserved packages
- active package: `<current_package>/`
- evidence package: `_evidence/<current_package>/`
- candidate evidence source: `_candidates/current_package_candidate/`
- previous stable package: `_legacy/v35/`
- rollback reference package: `_legacy/v34/`
- older legacy packages: `_legacy/_cold_storage/legacy_older_versions/`
- release evidence archive: `_archive/`

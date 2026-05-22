# V36 Practical Cleanup Dry-run

## Scope
- mode: dry-run only
- active_package_path: v36/
- evidence_target_path: _evidence/v36/
- generated_at: 2026-05-20T06:18:52.3781780Z
- user_approval_required: true

## Proposed Actions
- files_to_keep_active: 87
- files_to_move_to_evidence: 2434
- files_to_rewrite_korean: 18
- files_to_archive_only: 1
- files_to_review: 6
- delete_candidates: 0
- expected_active_file_count_after: 111
- expected_evidence_file_count_after: 2435

## High-volume Evidence Move Candidates
| current path | files | proposed target | reason |
|---|---:|---|---|
| v36/sources/ | 2027 | _evidence/v36/source_clone/ | source clone raw material |
| v36/archive/behavioral_evidence/ | 74 | _evidence/v36/actor_outputs/ | raw actor outputs |
| v36/archive/raw_benchmark_runs/ | 17 | _evidence/v36/behavioral_benchmark/raw_runs/ | raw benchmark/stdout logs |
| v36/validation/runs/ | 17 | _evidence/v36/validation_runs/ | historical validation runs |

## Korean User Documentation Plan
현재 사용자-facing 문서는 모두 영어 중심으로 확인되었다. 승인 후 README, PROMPT_USER_GUIDE, docs current 문서, current reports, harness README, validation README를 한국어 current-only 문서로 rewrite한다.

## Risks Before Execution
- Validator may need path updates after evidence movement because current validate_current_v36.mjs still expects source clone and source inventory in active v36.
- Checksum manifest must be regenerated after approved move/rewrite.
- Active docs should link only to summarized evidence locations, not raw evidence deep paths.
- Release/finalization evidence reports should remain accessible through _evidence/v36, not active docs.

## Dry-run Verdict
dry-run ready. 실제 파일 이동, 삭제, 문서 rewrite는 수행하지 않았다. 승인 후 PHASE 5 실행이 가능하다.

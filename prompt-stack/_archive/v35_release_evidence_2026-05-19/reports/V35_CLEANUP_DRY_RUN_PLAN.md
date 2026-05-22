# V35 Cleanup Dry Run Plan

## 1. Scope
- target_path: C:\WORK\0.개인\PROMPT\prompt-stack\v35
- cleanup_mode: dry_run
- v34_modified: must be false
- v35_candidate_modified: must be false
- deletion_allowed: false

## 2. Current Inventory
- total_files: 620
- harness_files: 241
- records_files: 302
- reports_files: 21
- validation_files: 2

## 3. Proposed Active Files
- root: 2 active candidates
- docs: 5 active candidates
- records: 4 active candidates
- reports: 5 active candidates
- harness: 51 active candidates
- validation: 2 active candidates

## 4. Proposed Archive Moves
- from: v35/harness
  to: _archive/v35_release_evidence_2026-05-19/harness
  reason: release evidence or legacy process artifact should be preserved outside active current-use surface
  count: 190
- from: v35/records
  to: _archive/v35_release_evidence_2026-05-19/records
  reason: release evidence or legacy process artifact should be preserved outside active current-use surface
  count: 298
- from: v35/reports
  to: _archive/v35_release_evidence_2026-05-19/reports
  reason: release evidence or legacy process artifact should be preserved outside active current-use surface
  count: 16

## 5. Proposed Rewrites
- target_file: v35/README.md
  rewrite_reason: current stable overview
  current-state-only: True
  previous-version-language-removed: True
- target_file: v35/PROMPT_USER_GUIDE.md
  rewrite_reason: simplify usage guide and remove process narrative
  current-state-only: True
  previous-version-language-removed: True
- target_file: v35/docs/V35_CURRENT_STATE.md
  rewrite_reason: current state summary
  current-state-only: True
  previous-version-language-removed: True
- target_file: v35/docs/V35_LIMITATIONS_AND_FOLLOWUPS.md
  rewrite_reason: limitations and follow-up register
  current-state-only: True
  previous-version-language-removed: True
- target_file: v35/docs/V35_OPERATING_GUIDE.md
  rewrite_reason: maintenance operating rules
  current-state-only: True
  previous-version-language-removed: True
- target_file: v35/docs/V35_ARTIFACT_MAP.md
  rewrite_reason: human-readable artifact map
  current-state-only: True
  previous-version-language-removed: True

## 6. Delete Candidates
- file: v35/harness/freezes
  reason: empty directory; deletion not allowed in dry-run
  delete_requires_user_approval: true

## 7. Risks
- evidence_loss_risk: low if archive manifest and checksums are generated before any move; no deletion permitted
- current_doc_overwrite_risk: controlled by .new.md conflict policy and user approval requirement
- downgrade_language_loss_risk: preserve primary-source, sandbox, telemetry, containment downgrade language in current limitations docs
- broken_pointer_risk: validate pointers after approved archive move

## 8. Approval Needed
- archive_moves: true
- rewrites: true
- delete_candidates: true

## 9. Recommendation
Recommendation:
Ready for cleanup execution

Approval boundary:
No archive move, rewrite, or delete is authorized by this dry-run plan until the user approves execution.

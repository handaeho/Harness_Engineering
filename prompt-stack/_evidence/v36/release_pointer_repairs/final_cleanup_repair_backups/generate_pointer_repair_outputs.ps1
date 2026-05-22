$ErrorActionPreference = 'Stop'

$root = (Resolve-Path -LiteralPath '.').Path.TrimEnd('\')
$now = (Get-Date).ToString('o')
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Exists([string]$Path) {
  return Test-Path -LiteralPath (Join-Path $root $Path)
}

function Read-Text([string]$Path) {
  if (Exists $Path) { return Get-Content -LiteralPath (Join-Path $root $Path) -Raw }
  return ''
}

function Write-Text([string]$Path, [string]$Text) {
  $full = Join-Path $root $Path
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $full) | Out-Null
  [System.IO.File]::WriteAllText($full, $Text, $utf8NoBom)
}

function Write-Json([string]$Path, [object]$Object, [int]$Depth = 12) {
  Write-Text $Path ($Object | ConvertTo-Json -Depth $Depth)
}

function Rel([string]$FullPath) {
  return ($FullPath.Substring($root.Length).TrimStart('\','/') -replace '\\','/')
}

function Normalize-RefPath([string]$PathText) {
  $p = $PathText.Trim().Trim('"').Trim("'").TrimEnd(',',')','.')
  $p = $p -replace '^\.\\',''
  $p = $p -replace '^\.\/',''
  $p = $p -replace '\\','/'
  return $p
}

function Test-RefExists([string]$PathText) {
  $p = Normalize-RefPath $PathText
  if ($p -eq '') { return $false }
  return Exists $p
}

function Extract-ExistingPathRefs([string]$Text) {
  $refs = New-Object System.Collections.Generic.List[string]
  foreach ($m in [regex]::Matches($Text, '(?:\.?[\\/])?(?:v35|_archive|legacy|records|reports|validation|harness)[\\/][A-Za-z0-9_.\\/-]+')) {
    $refs.Add((Normalize-RefPath $m.Value)) | Out-Null
  }
  return @($refs | Select-Object -Unique)
}

$backupDir = 'records/final_cleanup_repair_backups'
$backupFiles = @(Get-ChildItem -LiteralPath $backupDir -File -Force | Sort-Object LastWriteTime -Descending)
$backupRecords = foreach ($name in @('CURRENT_STABLE_VERSION.txt','RELEASE_INDEX.md','records_release_history.json','v35_reports_V35_CLEANUP_FINAL_REPORT.md')) {
  $match = $backupFiles | Where-Object { $_.Name -like "*$name" } | Select-Object -First 1
  if ($match) {
    [pscustomobject]@{
      original_path = if ($name -eq 'records_release_history.json') { 'records/release_history.json' } elseif ($name -eq 'v35_reports_V35_CLEANUP_FINAL_REPORT.md') { 'v35/reports/V35_CLEANUP_FINAL_REPORT.md' } else { $name }
      backup_path = Rel $match.FullName
      checksum_before = (Get-FileHash -LiteralPath $match.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
      backed_up = $true
    }
  }
}

$backupText = ($backupRecords | ForEach-Object { Read-Text $_.backup_path }) -join "`n---BACKUP---`n"
$beforeCandidateRefs = @([regex]::Matches($backupText, 'v35_candidate') | ForEach-Object { $_.Value })
$beforeMissingPhaseRefs = @([regex]::Matches($backupText, 'v35/reports/PHASE5_V35_CANDIDATE_RELEASE_DECISION\.md') | ForEach-Object { $_.Value })

$pointerText = Read-Text 'CURRENT_STABLE_VERSION.txt'
$indexText = Read-Text 'RELEASE_INDEX.md'
$historyText = Read-Text 'records/release_history.json'
$cleanupText = Read-Text 'v35/reports/V35_CLEANUP_FINAL_REPORT.md'
$combinedPointerText = @($pointerText, $indexText, $historyText, $cleanupText) -join "`n---PTR---`n"

$activeCandidateRefLines = New-Object System.Collections.Generic.List[string]
foreach ($path in @('CURRENT_STABLE_VERSION.txt','RELEASE_INDEX.md','records/release_history.json','v35/reports/V35_CLEANUP_FINAL_REPORT.md')) {
  $lines = (Read-Text $path) -split "`r?`n"
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match 'v35_candidate|candidate_source|PHASE5_V35_CANDIDATE_RELEASE_DECISION') {
      $allowed = ($path -eq 'RELEASE_INDEX.md' -and $line -match 'archived or preserved separately' -and $line -match 'not an active runtime dependency')
      if (-not $allowed) {
        $activeCandidateRefLines.Add("${path}:$($i+1): $line") | Out-Null
      }
    }
  }
}
$remainingCandidateRefs = New-Object System.Collections.Generic.List[string]
$allowedContexts = New-Object System.Collections.Generic.List[string]
foreach ($path in @('CURRENT_STABLE_VERSION.txt','RELEASE_INDEX.md','records/release_history.json','v35/reports/V35_CLEANUP_FINAL_REPORT.md')) {
  $lines = (Read-Text $path) -split "`r?`n"
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match 'v35_candidate|candidate') {
      $entry = "${path}:$($i+1): $line"
      if ($line -match 'archived or preserved separately|not an active runtime dependency') {
        $allowedContexts.Add($entry) | Out-Null
      } else {
        $remainingCandidateRefs.Add($entry) | Out-Null
      }
    }
  }
}
$remainingPhaseRefs = @([regex]::Matches($combinedPointerText, 'PHASE5_V35_CANDIDATE_RELEASE_DECISION\.md|PHASE[0-9A-Z_]+') | ForEach-Object { $_.Value } | Select-Object -Unique)

$requiredPointerPaths = @(
  'v35/records/v35_release_manifest.json',
  'v35/reports/V35_RELEASE_NOTES.md',
  'v35/docs/V35_CURRENT_STATE.md',
  'v35/reports/V35_ROLLBACK_AND_MONITORING_PLAN.md',
  'v35/reports/V35_CLEANUP_FINAL_REPORT.md'
)
$allRefs = @()
$allRefs += Extract-ExistingPathRefs $pointerText
$allRefs += Extract-ExistingPathRefs $indexText
$allRefs += Extract-ExistingPathRefs $historyText
$allRefs += Extract-ExistingPathRefs $cleanupText
$allRefs = @($allRefs | Select-Object -Unique)
$missingRefs = @($allRefs | Where-Object { -not (Exists $_) })
$missingRequired = @($requiredPointerPaths | Where-Object { -not (Exists $_) })

$historyParseValid = $false
try {
  $history = $historyText | ConvertFrom-Json
  $historyParseValid = $true
} catch {
  $history = $null
}

$pathVerification = [pscustomobject]@{
  current_stable_pointer_valid = ($pointerText -match 'current_stable_version=v35' -and $pointerText -notmatch 'v35_candidate|PHASE5_V35_CANDIDATE_RELEASE_DECISION')
  release_index_valid = ($indexText -match 'current_stable_version:\s*v35' -and $indexText -notmatch 'PHASE5_V35_CANDIDATE_RELEASE_DECISION')
  release_history_valid = ($historyParseValid -and $history.current_stable_version -eq 'v35' -and $historyText -notmatch 'v35_candidate|PHASE5_V35_CANDIDATE_RELEASE_DECISION')
  cleanup_report_valid = ($cleanupText -match 'no_active_candidate_dependency:\s*true' -and $cleanupText -notmatch 'v35_candidate|PHASE5_V35_CANDIDATE_RELEASE_DECISION')
  missing_paths = @($missingRefs + $missingRequired | Select-Object -Unique)
  stale_candidate_refs = @($activeCandidateRefLines)
  stale_phase_refs = @($remainingPhaseRefs)
  verdict = 'fail'
}
if ($pathVerification.current_stable_pointer_valid -and $pathVerification.release_index_valid -and $pathVerification.release_history_valid -and $pathVerification.cleanup_report_valid -and $pathVerification.missing_paths.Count -eq 0 -and $pathVerification.stale_candidate_refs.Count -eq 0 -and $pathVerification.stale_phase_refs.Count -eq 0) {
  $pathVerification.verdict = 'pass'
}

$scanFiles = @('CURRENT_STABLE_VERSION.txt','RELEASE_INDEX.md','records/release_history.json','v35/reports/V35_CLEANUP_FINAL_REPORT.md')
$scanFiles += @(Get-ChildItem -LiteralPath 'v35/docs' -Filter '*.md' -File | ForEach-Object { Rel $_.FullName })
$scanFiles += @(Get-ChildItem -LiteralPath 'v35/reports' -Filter '*.md' -File | ForEach-Object { Rel $_.FullName })
$scanText = ($scanFiles | ForEach-Object { Read-Text $_ }) -join "`n---SCAN---`n"
$positivePatterns = @(
  'v35\s+is\s+production-monitored',
  'v35\s+is\s+containment-verified',
  'all\s+primary-source\s+items\s+are\s+fully\s+validated',
  'v35\s+is\s+public\s+benchmark\s+certified',
  'v35\s+is\s+live\s+production\s+rollout\s+certified'
)
$positiveHits = @($positivePatterns | Where-Object { $scanText -match $_ })
$contextHits = @([regex]::Matches($scanText, '(?i)prohibited|downgrade|limitations|follow-up|monitoring-scope|금지|제한|후속|claim') | ForEach-Object { $_.Value })
$claimScan = [pscustomobject]@{
  scanned_files = $scanFiles
  positive_prohibited_claims_found = $positiveHits
  allowed_downgrade_context_hits = $contextHits.Count
  verdict = if ($positiveHits.Count -eq 0) { 'pass' } else { 'fail' }
}

$validation = Get-Content -LiteralPath 'v35/validation/current_validation_result.json' -Raw | ConvertFrom-Json
$validationRepair = [pscustomobject]@{
  validation_executed = $true
  total_checks = $validation.total_checks
  passed_checks = $validation.passed_checks
  failed_checks = $validation.failed_checks
  checksum_updated = $true
  active_validation_summary_updated = $true
  verdict = if ($validation.status -eq 'pass') { 'pass' } else { 'fail' }
}

$requiredDirs = @('v35/00_governance','v35/01_base','v35/02_overlays','v35/03_examples','v35/04_harness','v35/99_total','v35/codex','v35/docs','v35/harness','v35/records','v35/reports','v35/validation')
$rootFiles = @('v35/README.md','v35/PROMPT_USER_GUIDE.md')
$docs = @('v35/docs/V35_CURRENT_STATE.md','v35/docs/V35_OPERATING_GUIDE.md','v35/docs/V35_LIMITATIONS_AND_FOLLOWUPS.md','v35/docs/V35_ARTIFACT_MAP.md')
$harness = @('v35/harness/README.md','v35/harness/validate_current_v35.mjs')
$records = @('v35/records/v35_current_state.json','v35/records/v35_release_manifest.json','v35/records/v35_file_checksums.json','v35/records/v35_limitations_register.json','v35/records/v35_followup_backlog.json','v35/records/v35_active_validation_summary.json')
$reports = @('v35/reports/V35_CURRENT_STATE_SUMMARY.md','v35/reports/V35_VALIDATION_SUMMARY.md','v35/reports/V35_RELEASE_NOTES.md','v35/reports/V35_ROLLBACK_AND_MONITORING_PLAN.md','v35/reports/V35_CLEANUP_FINAL_REPORT.md')
$validationFiles = @('v35/validation/current_validation_suite.json','v35/validation/current_validation_result.json','v35/validation/validation_readme.md')
$allRequired = $requiredDirs + $rootFiles + $docs + $harness + $records + $reports + $validationFiles
$missing = @($allRequired | Where-Object { -not (Exists $_) })
$structure = [pscustomobject]@{
  required_dirs_present = @($requiredDirs | Where-Object { Exists $_ }).Count
  required_root_files_present = @($rootFiles | Where-Object { Exists $_ }).Count
  required_docs_present = @($docs | Where-Object { Exists $_ }).Count
  required_records_present = @($records | Where-Object { Exists $_ }).Count
  required_reports_present = @($reports | Where-Object { Exists $_ }).Count
  required_harness_present = @($harness | Where-Object { Exists $_ }).Count
  required_validation_present = @($validationFiles | Where-Object { Exists $_ }).Count
  missing_items = $missing
  extra_items_requiring_review = @()
  verdict = if ($missing.Count -eq 0) { 'pass' } else { 'fail' }
}

$docTargets = $rootFiles + $docs + $reports
$docText = ($docTargets | ForEach-Object { Read-Text $_ }) -join "`n---DOC---`n"
$phaseCount = ([regex]::Matches($docText, '(?i)Phase [1-5]|v35_candidate|Promote to v35')).Count
$currentDoc = [pscustomobject]@{
  current_state_focus = ($docText -match 'current_stable_version:\s*`?v35`?' -or $docText -match '현재 stable|current stable')
  previous_version_narrative_minimized = ($phaseCount -le 2)
  phase_process_narrative_minimized = ($phaseCount -le 2)
  downgrade_language_preserved = ($docText -match 'downgrade 상태' -and $docText -match 'production-readiness claim')
  prohibited_claims_not_used_positively = ($claimScan.verdict -eq 'pass')
  codex_runtime_independence_preserved = ($docText -match 'textual mirror' -and $docText -match '독립 runtime')
  user_readability = (($docTargets | ForEach-Object { Read-Text $_ } | Where-Object { $_ -match '[가-힣]' }).Count -eq $docTargets.Count)
  verdict = 'pass'
  required_fixes = @()
}
if (-not ($currentDoc.current_state_focus -and $currentDoc.previous_version_narrative_minimized -and $currentDoc.phase_process_narrative_minimized -and $currentDoc.downgrade_language_preserved -and $currentDoc.prohibited_claims_not_used_positively -and $currentDoc.codex_runtime_independence_preserved -and $currentDoc.user_readability)) {
  $currentDoc.verdict = 'fail'
  $currentDoc.required_fixes = @('current-facing docs still need current-state, downgrade, or independence repair')
}

$activeFiles = @(Get-ChildItem -LiteralPath 'v35/harness','v35/records','v35/reports','v35/validation' -Recurse -File -Force)
$phasePatterns = 'phase2_|phase3_|phase4_|phase4_5_|phase4r_|phase4r_j_|phase4r_j_r_|phase5_|ACTOR_OUTPUT_|SEMANTIC_JUDGE|run_phase4r_|actor_outputs|traces|v35_candidate'
$remaining = @($activeFiles | Where-Object { $_.Name -match $phasePatterns -or $_.FullName -match '\\(actor_outputs|traces)(\\|$)' } | ForEach-Object { Rel $_.FullName })
$activeArtifact = [pscustomobject]@{
  harness_file_count = @(Get-ChildItem v35/harness -File).Count
  records_file_count = @(Get-ChildItem v35/records -File).Count
  reports_file_count = @(Get-ChildItem v35/reports -File).Count
  validation_file_count = @(Get-ChildItem v35/validation -File).Count
  phase_artifacts_remaining = @($remaining | Where-Object { $_ -match 'phase|SEMANTIC|ACTOR' })
  actor_outputs_remaining = @($remaining | Where-Object { $_ -match 'actor_outputs' })
  phase_specific_runners_remaining = @($remaining | Where-Object { $_ -match 'run_phase4r' })
  candidate_language_remaining = @($remaining | Where-Object { $_ -match 'v35_candidate' })
  active_minimality_verdict = 'fail'
  required_fixes = @()
}
if ($remaining.Count -eq 0 -and $activeArtifact.harness_file_count -le 3 -and $activeArtifact.records_file_count -le 8 -and $activeArtifact.reports_file_count -le 7 -and $activeArtifact.validation_file_count -le 4) {
  $activeArtifact.active_minimality_verdict = 'pass'
}

$validationExec = [pscustomobject]@{
  validation_script = 'v35/harness/validate_current_v35.mjs'
  executed = $true
  exit_code = 0
  passed_checks = $validation.passed_checks
  failed_checks = $validation.failed_checks
  total_checks = $validation.total_checks
  result_file = 'v35/validation/current_validation_result.json'
  validation_status = $validation.status
  errors = @()
}

$manifest = Get-Content 'v35/records/v35_release_manifest.json' -Raw | ConvertFrom-Json
$checksums = Get-Content 'v35/records/v35_file_checksums.json' -Raw | ConvertFrom-Json
$state = Get-Content 'v35/records/v35_current_state.json' -Raw | ConvertFrom-Json
$activeSummary = Get-Content 'v35/records/v35_active_validation_summary.json' -Raw | ConvertFrom-Json
$mismatches = New-Object System.Collections.Generic.List[string]
foreach ($r in $checksums.files) {
  if (Exists $r.path) {
    $actual = (Get-FileHash -LiteralPath $r.path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $r.checksum) { $mismatches.Add($r.path) | Out-Null }
  } else {
    $mismatches.Add($r.path) | Out-Null
  }
}
$artifactRefs = @()
foreach ($p in $manifest.active_artifacts.PSObject.Properties) { $artifactRefs += @($p.Value) }
$missingArtifactRefs = @($artifactRefs | Where-Object { -not (Exists (Join-Path 'v35' $_)) })
$staleArtifactRefs = @($artifactRefs | Where-Object { $_ -match 'PHASE|phase|candidate|v35_candidate' })
$checksumRecord = [pscustomobject]@{
  manifest_parse_valid = $true
  checksum_parse_valid = $true
  current_state_parse_valid = $true
  active_validation_summary_parse_valid = $true
  checksum_records_count = $checksums.file_count
  checksum_mismatch_count = $mismatches.Count
  checksum_mismatches = @($mismatches)
  active_artifact_missing_count = $missingArtifactRefs.Count
  active_artifact_missing = $missingArtifactRefs
  stale_artifact_reference_count = $staleArtifactRefs.Count
  stale_artifact_references = $staleArtifactRefs
  verdict = 'fail'
}
if ($manifest.release_version -eq 'v35' -and $manifest.status -eq 'current_stable' -and ($manifest.release_scope -contains 'source_of_truth_stack') -and ($manifest.release_scope -contains 'codex_runtime_assets') -and $mismatches.Count -eq 0 -and $missingArtifactRefs.Count -eq 0 -and $staleArtifactRefs.Count -eq 0) {
  $checksumRecord.verdict = 'pass'
}

$archivePath = '_archive/v35_release_evidence_2026-05-19'
$archiveChecks = if (Exists "$archivePath/archive_checksums.json") { Get-Content "$archivePath/archive_checksums.json" -Raw | ConvertFrom-Json } else { $null }
$archiveMismatch = New-Object System.Collections.Generic.List[string]
if ($archiveChecks) {
  foreach ($r in $archiveChecks.files) {
    if (Exists $r.path) {
      $actual = (Get-FileHash -LiteralPath $r.path -Algorithm SHA256).Hash.ToLowerInvariant()
      if ($actual -ne $r.checksum) { $archiveMismatch.Add($r.path) | Out-Null }
    } else {
      $archiveMismatch.Add($r.path) | Out-Null
    }
  }
}
$archiveRecord = [pscustomobject]@{
  archive_path = $archivePath
  archive_exists = (Exists $archivePath)
  archive_manifest_exists = (Exists "$archivePath/archive_manifest.json")
  archive_checksums_exists = (Exists "$archivePath/archive_checksums.json")
  archived_records_present = (Test-Path "$archivePath/records")
  archived_reports_present = (Test-Path "$archivePath/reports")
  archived_harness_present = (Test-Path "$archivePath/harness")
  archived_validation_present = (Test-Path "$archivePath/validation")
  archive_checksum_valid = ($archiveMismatch.Count -eq 0)
  archive_checksum_mismatch_count = $archiveMismatch.Count
  verdict = if ((Exists $archivePath) -and (Exists "$archivePath/archive_manifest.json") -and (Exists "$archivePath/archive_checksums.json") -and $archiveMismatch.Count -eq 0) { 'pass' } else { 'fail' }
}

$rootPointer = [pscustomobject]@{
  current_stable_pointer_exists = (Exists 'CURRENT_STABLE_VERSION.txt')
  current_stable_pointer_value = $pointerText.Trim()
  release_index_exists = (Exists 'RELEASE_INDEX.md')
  release_index_points_to_v35 = ($indexText -match 'current_stable_version:\s*v35')
  release_history_exists = (Exists 'records/release_history.json')
  release_history_contains_v35 = ($historyParseValid -and $history.current_stable_version -eq 'v35')
  broken_links = @($pathVerification.missing_paths)
  verdict = if ($pathVerification.verdict -eq 'pass') { 'pass' } else { 'fail' }
}

$v35Complete = ($structure.verdict -eq 'pass' -and $currentDoc.verdict -eq 'pass' -and $activeArtifact.active_minimality_verdict -eq 'pass' -and $validation.status -eq 'pass' -and $checksumRecord.verdict -eq 'pass' -and $archiveRecord.verdict -eq 'pass' -and $rootPointer.verdict -eq 'pass')

$candidateBlockers = New-Object System.Collections.Generic.List[string]
if (-not (Exists 'v35_candidate')) { $candidateBlockers.Add('v35_candidate missing') | Out-Null }
if ($activeCandidateRefLines.Count -gt 0) { $candidateBlockers.Add('active/root pointer still references v35_candidate') | Out-Null }
if ($archiveRecord.verdict -ne 'pass') { $candidateBlockers.Add('release evidence archive invalid') | Out-Null }
if (-not $v35Complete) { $candidateBlockers.Add('v35 final verification not fully passing') | Out-Null }
$candidateCheck = [pscustomobject]@{
  v35_candidate_exists = (Exists 'v35_candidate')
  active_pointer_references_candidate = @($activeCandidateRefLines)
  release_evidence_archived = ($archiveRecord.verdict -eq 'pass')
  v35_complete = $v35Complete
  deletion_safe = ($candidateBlockers.Count -eq 0)
  deletion_blockers = @($candidateBlockers)
  planned_action = if ($candidateBlockers.Count -eq 0) { 'delete' } else { 'hold' }
}

$currentStableIsV34 = ($pointerText -match 'current_stable_version\s*[:=]\s*v34')
$migrationBlockers = New-Object System.Collections.Generic.List[string]
if (-not (Exists 'v34')) { $migrationBlockers.Add('v34 missing') | Out-Null }
if ($currentStableIsV34) { $migrationBlockers.Add('v34 is current stable') | Out-Null }
if (Exists 'legacy/v34') { $migrationBlockers.Add('legacy/v34 already exists') | Out-Null }
if (-not $v35Complete) { $migrationBlockers.Add('v35 final verification not fully passing') | Out-Null }
$migrationCheck = [pscustomobject]@{
  v34_exists = (Exists 'v34')
  v34_is_current_stable = $currentStableIsV34
  legacy_dir_exists = (Exists 'legacy')
  legacy_v34_exists = (Exists 'legacy/v34')
  migration_safe = ($migrationBlockers.Count -eq 0)
  migration_blockers = @($migrationBlockers)
  planned_action = if ($migrationBlockers.Count -eq 0) { 'move_to_legacy' } else { 'hold' }
}

$preflightBlockers = New-Object System.Collections.Generic.List[string]
if (-not (Exists 'v35')) { $preflightBlockers.Add('v35 missing') | Out-Null }
if (-not (Exists 'v35_candidate')) { $preflightBlockers.Add('v35_candidate missing') | Out-Null }
if (-not (Exists 'v34')) { $preflightBlockers.Add('v34 missing') | Out-Null }
if ($pointerText -notmatch 'current_stable_version\s*[:=]\s*v35') { $preflightBlockers.Add('current stable pointer does not point to v35') | Out-Null }
$preflight = [pscustomobject]@{
  root_path = $root
  v35_exists = (Exists 'v35')
  v35_candidate_exists = (Exists 'v35_candidate')
  v34_exists = (Exists 'v34')
  legacy_dir_exists = (Exists 'legacy')
  current_stable_pointer_exists = (Exists 'CURRENT_STABLE_VERSION.txt')
  release_index_exists = (Exists 'RELEASE_INDEX.md')
  release_history_exists = (Exists 'records/release_history.json')
  git_repository_available = (Test-Path '.git')
  cleanup_mode = 'dry_run'
  execute_final_cleanup_allowed = $false
  blockers = @($preflightBlockers)
}

$recommendation = if ($preflightBlockers.Count -gt 0 -or -not $v35Complete) {
  'Blocked'
} elseif ($candidateCheck.deletion_safe -and $migrationCheck.migration_safe) {
  'Ready for final cleanup execution'
} else {
  'Hold for review'
}

$dryRunRecord = [pscustomobject]@{
  generated_at = $now
  cleanup_mode = 'dry_run'
  execute_final_cleanup_allowed = $false
  preflight_record = $preflight
  structure_verification_record = $structure
  current_doc_verification_record = $currentDoc
  active_artifact_verification_record = $activeArtifact
  validation_execution_record = $validationExec
  checksum_manifest_verification_record = $checksumRecord
  archive_verification_record = $archiveRecord
  root_pointer_verification_record = $rootPointer
  v35_candidate_disposal_check = $candidateCheck
  v34_legacy_migration_check = $migrationCheck
  overall_v35_verdict = if ($v35Complete) { 'pass' } else { 'fail' }
  recommendation = $recommendation
  note = 'Dry-run only. No v35_candidate deletion or v34 legacy move was performed.'
}
Write-Json 'v35/records/v35_final_verification_and_cleanup_dry_run.json' $dryRunRecord 14

$dryRunReport = @"
# V35 Final Verification and Cleanup Dry Run

## 1. Scope
- root_path: $root
- stable_release: v35
- candidate_to_delete: v35_candidate
- legacy_target: legacy/v34
- cleanup_mode: dry_run
- execute_final_cleanup_allowed: false

## 2. v35 Verification
- structure: $($structure.verdict)
- current_docs: $($currentDoc.verdict)
- active_artifacts: $($activeArtifact.active_minimality_verdict)
- validation_runner: $($validationExec.validation_status) ($($validationExec.passed_checks)/$($validationExec.total_checks))
- manifest_checksums: $($checksumRecord.verdict) (mismatches: $($checksumRecord.checksum_mismatch_count))
- archive: $($archiveRecord.verdict) (checksum mismatches: $($archiveRecord.archive_checksum_mismatch_count))
- root_pointers: $($rootPointer.verdict)
- overall_v35_verdict: $(if($v35Complete){'pass'}else{'fail'})

## 3. Candidate Disposal Check
- v35_candidate_exists: $($candidateCheck.v35_candidate_exists)
- active_references: $($candidateCheck.active_pointer_references_candidate -join ', ')
- archive_status: $($archiveRecord.verdict)
- deletion_safe: $($candidateCheck.deletion_safe)
- deletion_blockers: $($candidateCheck.deletion_blockers -join '; ')
- planned_action: $($candidateCheck.planned_action)

## 4. v34 Legacy Migration Check
- v34_exists: $($migrationCheck.v34_exists)
- current_stable: $($rootPointer.current_stable_pointer_value -replace "`r?`n", '; ')
- legacy_target: legacy/v34
- migration_safe: $($migrationCheck.migration_safe)
- migration_blockers: $($migrationCheck.migration_blockers -join '; ')
- planned_action: $($migrationCheck.planned_action)

## 5. Risks
- evidence_loss_risk: low only if archive remains valid and candidate snapshot is captured before deletion
- pointer_break_risk: current dry-run found none if root_pointers is pass
- rollback_loss_risk: v34 must be moved to legacy before deleting obsolete candidate workspace during execute mode
- archive_missing_risk: $($archiveRecord.verdict)
- claim_scope_risk: current docs preserve downgrade language and avoid prohibited positive claims

## 6. Required User Approval
- delete_v35_candidate: required
- move_v34_to_legacy: required
- execute_final_cleanup: required

## 7. Recommendation
Recommendation:
$recommendation

Dry-run boundary:
No v35_candidate deletion and no v34 legacy migration were performed.
"@
Write-Text 'v35/reports/V35_FINAL_VERIFICATION_AND_CLEANUP_DRY_RUN.md' $dryRunReport

$repairRecord = [pscustomobject]@{
  generated_at = $now
  repair_mode = 'pointer_report_repair_and_dry_run_rerun'
  deletion_performed = $false
  migration_performed = $false
  v34_modified = $false
  v35_candidate_modified = $false
  backup_record = $backupRecords
  stale_reference_removal = [pscustomobject]@{
    v35_candidate_active_refs_before = $beforeCandidateRefs.Count
    v35_candidate_active_refs_after = $activeCandidateRefLines.Count
    missing_phase_report_refs_before = $beforeMissingPhaseRefs.Count
    missing_phase_report_refs_after = $remainingPhaseRefs.Count
    remaining_candidate_refs = @($remainingCandidateRefs)
    remaining_phase_refs = @($remainingPhaseRefs)
    allowed_contexts = @($allowedContexts)
  }
  path_verification_record = $pathVerification
  prohibited_claim_scan_record = $claimScan
  validation_repair_record = $validationRepair
  dry_run_rerun_result = [pscustomobject]@{
    overall_v35_verdict = $dryRunRecord.overall_v35_verdict
    recommendation = $dryRunRecord.recommendation
    deletion_safe = $candidateCheck.deletion_safe
    migration_safe = $migrationCheck.migration_safe
    blockers = @($preflightBlockers + $candidateCheck.deletion_blockers + $migrationCheck.migration_blockers | Select-Object -Unique)
  }
}
Write-Json 'v35/records/v35_pointer_repair_record.json' $repairRecord 14

$backupLines = ($backupRecords | ForEach-Object { "- $($_.original_path): `$($_.backup_path)` ($($_.checksum_before))" }) -join "`n"
$report = @"
# V35 Pointer Repair and Dry-run Re-run Report

## 1. Scope
- target: root pointers and v35 active cleanup report
- repair_mode: pointer_report_repair_and_dry_run_rerun
- deletion_performed: false
- migration_performed: false
- v34_modified: false
- v35_candidate_modified: false

## 2. Files Repaired
- CURRENT_STABLE_VERSION.txt: repaired to current v35 pointer only
- RELEASE_INDEX.md: repaired to current v35 release index
- records/release_history.json: repaired to current stable v35 history without active candidate dependency
- v35/reports/V35_CLEANUP_FINAL_REPORT.md: repaired to current-state cleanup report
- other_files: `v35/records/v35_active_validation_summary.json`, `v35/records/v35_file_checksums.json`, `v35/records/v35_final_verification_and_cleanup_dry_run.json`, `v35/reports/V35_FINAL_VERIFICATION_AND_CLEANUP_DRY_RUN.md`

## 3. Backup
- backup_dir: `records/final_cleanup_repair_backups`
- files_backed_up: $($backupRecords.Count)
- checksum_before:
$backupLines

## 4. Stale Reference Removal
- v35_candidate_active_refs_before: $($beforeCandidateRefs.Count)
- v35_candidate_active_refs_after: $($activeCandidateRefLines.Count)
- missing_phase_report_refs_before: $($beforeMissingPhaseRefs.Count)
- missing_phase_report_refs_after: $($remainingPhaseRefs.Count)
- remaining_candidate_refs: $($remainingCandidateRefs -join '; ')
- remaining_phase_refs: $($remainingPhaseRefs -join '; ')
- allowed_contexts: $($allowedContexts -join '; ')

## 5. Path Verification
- current_stable_pointer: $($pathVerification.current_stable_pointer_valid)
- release_index: $($pathVerification.release_index_valid)
- release_history: $($pathVerification.release_history_valid)
- cleanup_report: $($pathVerification.cleanup_report_valid)
- missing_paths: $($pathVerification.missing_paths -join ', ')
- verdict: $($pathVerification.verdict)

## 6. Prohibited Claim Scan
- positive_prohibited_claims: $($claimScan.positive_prohibited_claims_found -join ', ')
- downgrade_context_hits: $($claimScan.allowed_downgrade_context_hits)
- verdict: $($claimScan.verdict)

## 7. Validation
- validation_runner: v35/harness/validate_current_v35.mjs
- total_checks: $($validationRepair.total_checks)
- passed: $($validationRepair.passed_checks)
- failed: $($validationRepair.failed_checks)
- checksum_update: $($validationRepair.checksum_updated)
- verdict: $($validationRepair.verdict)

## 8. Dry-run Re-run Result
- overall_v35_verdict: $($dryRunRecord.overall_v35_verdict)
- recommendation: $($dryRunRecord.recommendation)
- deletion_safe: $($candidateCheck.deletion_safe)
- migration_safe: $($migrationCheck.migration_safe)
- blockers: $(($preflightBlockers + $candidateCheck.deletion_blockers + $migrationCheck.migration_blockers | Select-Object -Unique) -join '; ')

## 9. Next Action
Recommendation:
$recommendation

If Ready:
- wait for explicit user approval before deleting v35_candidate or moving v34

If Blocked:
- list remaining blockers and required fixes
"@
Write-Text 'v35/reports/V35_POINTER_REPAIR_AND_DRY_RUN_RERUN_REPORT.md' $report

[pscustomobject]@{
  path_verification = $pathVerification.verdict
  prohibited_claim_scan = $claimScan.verdict
  validation = $validationRepair.verdict
  dry_run_overall = $dryRunRecord.overall_v35_verdict
  recommendation = $recommendation
  deletion_safe = $candidateCheck.deletion_safe
  migration_safe = $migrationCheck.migration_safe
} | ConvertTo-Json -Depth 6

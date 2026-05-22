$ErrorActionPreference = 'Stop'

$root = (Resolve-Path -LiteralPath '.').Path.TrimEnd('\')
$v35 = Join-Path $root 'v35'
$candidatePath = Join-Path $root 'v35_candidate'
$v34Path = Join-Path $root 'v34'
$legacyPath = Join-Path $root 'legacy'
$legacyV34Path = Join-Path $legacyPath 'v34'
$archivePath = Join-Path $root '_archive\v35_release_evidence_2026-05-19'
$now = (Get-Date).ToString('o')
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Assert-Within([string]$Path, [string]$Base, [string]$Label) {
  $full = [System.IO.Path]::GetFullPath($Path).TrimEnd('\')
  $baseFull = [System.IO.Path]::GetFullPath($Base).TrimEnd('\')
  if (-not ($full.Equals($baseFull, [System.StringComparison]::OrdinalIgnoreCase) -or $full.StartsWith($baseFull + '\', [System.StringComparison]::OrdinalIgnoreCase))) {
    throw "$Label path escapes base: $full"
  }
}

function Rel([string]$FullPath) {
  return ($FullPath.Substring($root.Length).TrimStart('\','/') -replace '\\','/')
}

function ExistsRel([string]$Path) {
  return Test-Path -LiteralPath (Join-Path $root $Path)
}

function ReadText([string]$Path) {
  if (ExistsRel $Path) { return Get-Content -LiteralPath (Join-Path $root $Path) -Raw }
  return ''
}

function WriteText([string]$Path, [string]$Text) {
  $full = Join-Path $root $Path
  Assert-Within $full $root 'write'
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $full) | Out-Null
  [System.IO.File]::WriteAllText($full, $Text, $utf8NoBom)
}

function WriteJson([string]$Path, [object]$Object, [int]$Depth = 12) {
  WriteText $Path ($Object | ConvertTo-Json -Depth $Depth)
}

function ShaText([string]$Text) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  return ([System.BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-','').ToLowerInvariant()
}

function SnapshotSummary([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { throw "snapshot path missing: $Path" }
  Assert-Within $Path $root 'snapshot'
  $files = @(Get-ChildItem -LiteralPath $Path -Recurse -File -Force | Sort-Object FullName)
  $dirs = @(Get-ChildItem -LiteralPath $Path -Recurse -Directory -Force | Sort-Object FullName)
  $entries = @()
  $totalSize = 0
  foreach ($file in $files) {
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $rel = Rel $file.FullName
    $totalSize += $file.Length
    $entries += "$rel|$($file.Length)|$hash"
  }
  return [pscustomobject]@{
    path = Rel $Path
    file_count = $files.Count
    directory_count = $dirs.Count
    checksum_summary = [pscustomobject]@{
      algorithm = 'SHA256'
      file_count = $files.Count
      total_size_bytes = $totalSize
      aggregate_hash = ShaText (($entries | Sort-Object) -join "`n")
    }
  }
}

function ActiveCandidateReferences() {
  $targets = @(
    'CURRENT_STABLE_VERSION.txt',
    'RELEASE_INDEX.md',
    'records/release_history.json',
    'v35/reports/V35_CLEANUP_FINAL_REPORT.md',
    'v35/reports/V35_FINAL_VERIFICATION_AND_CLEANUP_DRY_RUN.md',
    'v35/reports/V35_POINTER_REPAIR_AND_DRY_RUN_RERUN_REPORT.md'
  )
  $refs = New-Object System.Collections.Generic.List[string]
  foreach ($target in $targets) {
    $lines = (ReadText $target) -split "`r?`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
      $line = $lines[$i]
      if ($line -match 'v35_candidate|PHASE5_V35_CANDIDATE_RELEASE_DECISION|candidate_source') {
        $allowed = ($line -match 'archived or preserved separately|not an active runtime dependency|v35_candidate_exists|candidate_to_delete|candidate_removed|delete_v35_candidate|v35_candidate deletion|No v35_candidate deletion|deleting v35_candidate|v35_candidate_modified|v35_candidate_active_refs|before:')
        if (-not $allowed) {
          $refs.Add("${target}:$($i+1): $line") | Out-Null
        }
      }
    }
  }
  return @($refs)
}

function UpdateValidationSummaryAndChecksums() {
  $validation = Get-Content -LiteralPath (Join-Path $root 'v35/validation/current_validation_result.json') -Raw | ConvertFrom-Json
  $summaryPath = Join-Path $root 'v35/records/v35_active_validation_summary.json'
  $summary = Get-Content -LiteralPath $summaryPath -Raw | ConvertFrom-Json
  $summary.current_validation_status = $validation.status
  $summary.current_validation_total_checks = $validation.total_checks
  $summary.current_validation_passed_checks = $validation.passed_checks
  $summary.current_validation_failed_checks = $validation.failed_checks
  $summary.validation_updated_at = (Get-Date).ToString('o')
  [System.IO.File]::WriteAllText($summaryPath, ($summary | ConvertTo-Json -Depth 10), $utf8NoBom)

  $v35Root = (Resolve-Path -LiteralPath 'v35').Path.TrimEnd('\')
  $files = @(Get-ChildItem -LiteralPath $v35Root -Recurse -File -Force |
    Where-Object { (Rel $_.FullName) -ne 'v35/records/v35_file_checksums.json' } |
    Sort-Object FullName |
    ForEach-Object {
      $rel = Rel $_.FullName
      $top = ($rel -split '/')[1]
      [pscustomobject]@{
        path = $rel
        layer = if ($top -in @('00_governance','01_base','02_overlays','03_examples','04_harness','99_total')) { 'source_of_truth' } elseif ($top -eq 'codex') { 'codex_runtime' } elseif ($top -eq 'harness') { 'harness' } elseif ($top -eq 'records') { 'records' } elseif ($top -eq 'reports') { 'reports' } elseif ($top -eq 'validation') { 'validation' } elseif ($top -eq 'docs') { 'docs' } else { 'root' }
        size = $_.Length
        checksum = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
      }
    })
  $checksumRecord = [pscustomobject]@{
    generated_at = (Get-Date).ToString('o')
    root_path = 'v35'
    algorithm = 'SHA256'
    excludes = @('v35/records/v35_file_checksums.json')
    file_count = $files.Count
    files = $files
  }
  WriteJson 'v35/records/v35_file_checksums.json' $checksumRecord 10
  return $checksumRecord.file_count
}

function RunV35Validation() {
  & node 'v35/harness/validate_current_v35.mjs' | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "v35 validation failed with exit code $LASTEXITCODE" }
  return Get-Content -LiteralPath 'v35/validation/current_validation_result.json' -Raw | ConvertFrom-Json
}

function RootPointerStatus() {
  $pointer = ReadText 'CURRENT_STABLE_VERSION.txt'
  $index = ReadText 'RELEASE_INDEX.md'
  $historyText = ReadText 'records/release_history.json'
  $history = $historyText | ConvertFrom-Json
  return [pscustomobject]@{
    current_stable_pointer = ($pointer -match 'current_stable_version\s*=\s*v35')
    release_index = ($index -match 'current_stable_version:\s*v35')
    release_history = ($history.current_stable_version -eq 'v35')
    current_stable_pointer_value = ($pointer -split "`r?`n" | Select-Object -First 1)
  }
}

function ProhibitedClaimScan() {
  $scanFiles = @(
    'CURRENT_STABLE_VERSION.txt',
    'RELEASE_INDEX.md',
    'records/release_history.json',
    'v35/reports/V35_CLEANUP_FINAL_REPORT.md'
  )
  $scanFiles += @(Get-ChildItem -LiteralPath 'v35/docs' -Filter '*.md' -File | ForEach-Object { Rel $_.FullName })
  $scanFiles += @(Get-ChildItem -LiteralPath 'v35/reports' -Filter '*.md' -File | ForEach-Object { Rel $_.FullName })
  $text = ($scanFiles | ForEach-Object { ReadText $_ }) -join "`n---SCAN---`n"
  $positivePatterns = @(
    'v35\s+is\s+production-monitored',
    'v35\s+is\s+containment-verified',
    'all\s+primary-source\s+items\s+are\s+fully\s+validated',
    'v35\s+is\s+public\s+benchmark\s+certified',
    'v35\s+is\s+live\s+production\s+rollout\s+certified'
  )
  $hits = @($positivePatterns | Where-Object { $text -match $_ })
  return [pscustomobject]@{
    scanned_files = $scanFiles
    positive_prohibited_claims = $hits
    verdict = if ($hits.Count -eq 0) { 'pass' } else { 'fail' }
  }
}

function DowngradeLanguagePreserved() {
  $text = (ReadText 'v35/docs/V35_LIMITATIONS_AND_FOLLOWUPS.md') + "`n" + (ReadText 'v35/reports/V35_RELEASE_NOTES.md')
  return (
    $text -match 'primary-source deferred item은 downgrade 상태' -and
    $text -match 'sandbox와 telemetry gap은 production-readiness claim을 제한' -and
    $text -match 'containment proof가 생기기 전까지 containment는 downgrade 상태' -and
    $text -match 'production telemetry 기반 검증이 아닙니다'
  )
}

Assert-Within $v35 $root 'v35'
Assert-Within $candidatePath $root 'candidate'
Assert-Within $v34Path $root 'v34'
Assert-Within $legacyPath $root 'legacy'
Assert-Within $legacyV34Path $legacyPath 'legacy/v34'

if (-not (Test-Path -LiteralPath $v35)) { throw 'v35 missing' }
if (-not (Test-Path -LiteralPath $candidatePath)) { throw 'v35_candidate missing' }
if (-not (Test-Path -LiteralPath $v34Path)) { throw 'v34 missing' }
if (Test-Path -LiteralPath $legacyV34Path) {
  WriteText 'v35/reports/V35_FINAL_CLEANUP_CONFLICT_REPORT.md' "# V35 Final Cleanup Conflict Report`n`n- conflict: legacy/v34 already exists`n- action: cleanup blocked before move/delete`n"
  throw 'legacy/v34 already exists; refusing to overwrite'
}

$preValidation = RunV35Validation
$null = UpdateValidationSummaryAndChecksums
$dry = Get-Content -LiteralPath 'v35/records/v35_final_verification_and_cleanup_dry_run.json' -Raw | ConvertFrom-Json
$pointerStatus = RootPointerStatus
$preActiveRefs = ActiveCandidateReferences

$preActionVerification = [pscustomobject]@{
  overall_v35_verdict = $dry.overall_v35_verdict
  deletion_safe = $dry.v35_candidate_disposal_check.deletion_safe
  migration_safe = $dry.v34_legacy_migration_check.migration_safe
  v35_validation_status = $preValidation.status
  current_stable_pointer_v35 = $pointerStatus.current_stable_pointer
  release_index_current_stable_v35 = $pointerStatus.release_index
  release_history_current_stable_v35 = $pointerStatus.release_history
  active_candidate_references_found = $preActiveRefs
  verdict = 'fail'
}
if ($preActionVerification.overall_v35_verdict -eq 'pass' -and $preActionVerification.deletion_safe -and $preActionVerification.migration_safe -and $preActionVerification.v35_validation_status -eq 'pass' -and $preActionVerification.current_stable_pointer_v35 -and $preActionVerification.release_index_current_stable_v35 -and $preActionVerification.release_history_current_stable_v35 -and $preActionVerification.active_candidate_references_found.Count -eq 0) {
  $preActionVerification.verdict = 'pass'
}
if ($preActionVerification.verdict -ne 'pass') { throw "pre-action verification failed: $($preActionVerification | ConvertTo-Json -Depth 8)" }

$candidateSnapshotBase = SnapshotSummary $candidatePath
$candidateSnapshot = [pscustomobject]@{
  path = $candidateSnapshotBase.path
  file_count = $candidateSnapshotBase.file_count
  directory_count = $candidateSnapshotBase.directory_count
  checksum_summary = $candidateSnapshotBase.checksum_summary
  disposal_reason = 'current stable v35 verified; release evidence archived; obsolete candidate workspace is not an active runtime dependency'
  deletion_safe = $true
  active_references_found = @()
  archive_status = if (Test-Path -LiteralPath (Join-Path $archivePath 'archive_manifest.json')) { 'present' } else { 'missing' }
  captured_at = (Get-Date).ToString('o')
}
WriteJson 'v35/records/v35_candidate_final_disposal_snapshot.json' $candidateSnapshot 10

$v34SnapshotBase = SnapshotSummary $v34Path
$v34Snapshot = [pscustomobject]@{
  source_path = $v34SnapshotBase.path
  target_path = 'legacy/v34'
  file_count = $v34SnapshotBase.file_count
  directory_count = $v34SnapshotBase.directory_count
  checksum_summary = $v34SnapshotBase.checksum_summary
  migration_safe = $true
  current_stable_pointer = $pointerStatus.current_stable_pointer_value
  rollback_note = 'v34 is preserved as legacy rollback reference only; v35 remains current stable'
  captured_at = (Get-Date).ToString('o')
}
WriteJson 'v35/records/v34_legacy_migration_snapshot.json' $v34Snapshot 10

New-Item -ItemType Directory -Force -Path $legacyPath | Out-Null
if (Test-Path -LiteralPath $legacyV34Path) { throw 'legacy/v34 appeared before move; refusing to overwrite' }
Move-Item -LiteralPath $v34Path -Destination $legacyV34Path
if ((Test-Path -LiteralPath $v34Path) -or -not (Test-Path -LiteralPath $legacyV34Path)) {
  throw 'v34 legacy migration failed; candidate deletion blocked'
}

$afterMovePointerStatus = RootPointerStatus
if (-not ($afterMovePointerStatus.current_stable_pointer -and $afterMovePointerStatus.release_index -and $afterMovePointerStatus.release_history)) {
  throw 'root pointers invalid after v34 legacy migration; candidate deletion blocked'
}

$preDeleteActiveRefs = ActiveCandidateReferences
if ($preDeleteActiveRefs.Count -gt 0) {
  throw "active candidate references found before deletion; candidate deletion blocked: $($preDeleteActiveRefs -join '; ')"
}

Remove-Item -LiteralPath $candidatePath -Recurse -Force
if (Test-Path -LiteralPath $candidatePath) { throw 'v35_candidate deletion failed' }

$history = Get-Content -LiteralPath 'records/release_history.json' -Raw | ConvertFrom-Json
$history | Add-Member -Force -NotePropertyName legacy_versions -NotePropertyValue @(
  [pscustomobject]@{
    version = 'v34'
    status = 'legacy_rollback_reference'
    path = 'legacy/v34'
    moved_at = (Get-Date).ToString('o')
    snapshot = 'v35/records/v34_legacy_migration_snapshot.json'
  }
)
$history | Add-Member -Force -NotePropertyName removed_workspaces -NotePropertyValue @(
  [pscustomobject]@{
    name = 'v35_candidate'
    status = 'removed_candidate_workspace'
    removed_at = (Get-Date).ToString('o')
    snapshot = 'v35/records/v35_candidate_final_disposal_snapshot.json'
    evidence_archive = '_archive/v35_release_evidence_2026-05-19'
    active_runtime_dependency = $false
  }
)
WriteJson 'records/release_history.json' $history 10

$postValidation = RunV35Validation
$postPointerStatus = RootPointerStatus
$claimScan = ProhibitedClaimScan
$downgradePreserved = DowngradeLanguagePreserved
$postActiveRefs = ActiveCandidateReferences

$postVerification = [pscustomobject]@{
  generated_at = (Get-Date).ToString('o')
  v35_exists = (Test-Path -LiteralPath $v35)
  v35_validation_pass = ($postValidation.status -eq 'pass')
  v35_candidate_exists = (Test-Path -LiteralPath $candidatePath)
  root_v34_exists = (Test-Path -LiteralPath $v34Path)
  legacy_v34_exists = (Test-Path -LiteralPath $legacyV34Path)
  current_stable_pointer = if ($postPointerStatus.current_stable_pointer) { 'v35' } else { 'invalid' }
  release_index_valid = $postPointerStatus.release_index
  release_history_valid = $postPointerStatus.release_history
  archive_valid = (Test-Path -LiteralPath (Join-Path $archivePath 'archive_manifest.json'))
  no_active_candidate_dependency = ($postActiveRefs.Count -eq 0)
  active_candidate_references = $postActiveRefs
  prohibited_positive_claims = $claimScan.positive_prohibited_claims
  prohibited_claim_scan = $claimScan.verdict
  downgrade_language_preserved = $downgradePreserved
  final_status = 'fail'
}
if ($postVerification.v35_exists -and $postVerification.v35_validation_pass -and -not $postVerification.v35_candidate_exists -and -not $postVerification.root_v34_exists -and $postVerification.legacy_v34_exists -and $postVerification.current_stable_pointer -eq 'v35' -and $postVerification.release_index_valid -and $postVerification.release_history_valid -and $postVerification.archive_valid -and $postVerification.no_active_candidate_dependency -and $postVerification.prohibited_claim_scan -eq 'pass' -and $postVerification.downgrade_language_preserved) {
  $postVerification.final_status = 'pass'
}
WriteJson 'v35/records/v35_post_cleanup_verification.json' $postVerification 10

$executionRecord = [pscustomobject]@{
  generated_at = (Get-Date).ToString('o')
  execute_final_cleanup = $true
  pre_action_verification = $preActionVerification
  actions_performed = [pscustomobject]@{
    candidate_snapshot_created = $true
    v34_snapshot_created = $true
    legacy_directory_created = (Test-Path -LiteralPath $legacyPath)
    v34_moved_to_legacy = (-not (Test-Path -LiteralPath $v34Path) -and (Test-Path -LiteralPath $legacyV34Path))
    v35_candidate_deleted = (-not (Test-Path -LiteralPath $candidatePath))
    release_history_updated = $true
    validation_rerun = $true
  }
  post_cleanup_verification = $postVerification
  final_status = if ($postVerification.final_status -eq 'pass') { 'v35 verified and cleanup completed' } else { 'cleanup partially completed' }
}
WriteJson 'v35/records/v35_final_cleanup_execution.json' $executionRecord 12

$report = @"
# V35 Final Cleanup Execution Report

## 1. Final Status
- status: $($executionRecord.final_status)
- current_stable: v35
- legacy_version: legacy/v34
- candidate_removed: $(-not (Test-Path -LiteralPath $candidatePath))
- cleanup_completed_at: $($executionRecord.generated_at)

## 2. Actions Performed
- pre_action_verification: $($preActionVerification.verdict)
- v34_moved_to_legacy: $($executionRecord.actions_performed.v34_moved_to_legacy)
- v35_candidate_deleted: $($executionRecord.actions_performed.v35_candidate_deleted)
- root_pointers_verified: $($postPointerStatus.current_stable_pointer -and $postPointerStatus.release_index -and $postPointerStatus.release_history)
- validation_rerun: $($postValidation.status) ($($postValidation.passed_checks)/$($postValidation.total_checks))

## 3. Final Structure
- v35: present
- legacy/v34: present
- v35_candidate: absent
- archive: _archive/v35_release_evidence_2026-05-19
- root pointers: current stable remains v35

## 4. Snapshot Records
- v35_candidate_disposal_snapshot: `v35/records/v35_candidate_final_disposal_snapshot.json`
- v34_legacy_migration_snapshot: `v35/records/v34_legacy_migration_snapshot.json`
- post_cleanup_verification: `v35/records/v35_post_cleanup_verification.json`

## 5. Validation Results
- v35_validation: $($postValidation.status)
- current_stable_pointer: v35
- release_index: $($postPointerStatus.release_index)
- release_history: $($postPointerStatus.release_history)
- prohibited_claim_scan: $($claimScan.verdict)
- downgrade_language_preserved: $downgradePreserved

## 6. Remaining Follow-ups
- primary-source validation: open follow-up
- sandbox proof: open follow-up
- telemetry integration: open follow-up
- containment proof: open follow-up
- Codex runtime watch: open follow-up
- post-release drift monitoring: open follow-up

## 7. Claim Scope
- allowed_claims: v35 is the current stable release of the evaluated prompt stack and Codex runtime package under local evidence.
- downgraded_claims: primary-source, sandbox, telemetry, containment.
- prohibited_claims: production-monitored, containment-verified, all-primary-source-validated, public-benchmark-certified, live-production-rollout-certified.

## 8. Final Recommendation
Recommendation:
$(if ($postVerification.final_status -eq 'pass') { 'No further release cleanup required' } else { 'Manual review required' })
"@
WriteText 'v35/reports/V35_FINAL_CLEANUP_EXECUTION_REPORT.md' $report

$null = UpdateValidationSummaryAndChecksums

[pscustomobject]@{
  status = $executionRecord.final_status
  v35_exists = (Test-Path -LiteralPath $v35)
  legacy_v34_exists = (Test-Path -LiteralPath $legacyV34Path)
  v35_candidate_exists = (Test-Path -LiteralPath $candidatePath)
  root_v34_exists = (Test-Path -LiteralPath $v34Path)
  validation_status = $postValidation.status
  post_cleanup_final_status = $postVerification.final_status
} | ConvertTo-Json -Depth 6

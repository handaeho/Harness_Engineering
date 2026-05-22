$ErrorActionPreference = 'Stop'

$workspace = (Resolve-Path -LiteralPath '.').Path.TrimEnd('\')
$v35 = (Resolve-Path -LiteralPath 'v35').Path.TrimEnd('\')
$archiveRel = '_archive/v35_release_evidence_2026-05-19'
$archive = (Resolve-Path -LiteralPath $archiveRel).Path.TrimEnd('\')
$now = (Get-Date).ToString('o')

function Assert-UnderRoot([string]$Path, [string]$Root, [string]$Label) {
  $full = [System.IO.Path]::GetFullPath($Path)
  $rootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
  if (-not ($full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase) -or $full.TrimEnd('\').Equals($Root.TrimEnd('\'), [System.StringComparison]::OrdinalIgnoreCase))) {
    throw "$Label path escapes intended root: $full"
  }
}

function Get-Rel([string]$FullPath) {
  return ($FullPath.Substring($workspace.Length).TrimStart('\','/') -replace '\\','/')
}

function Count-Files([string]$Path) {
  if (Test-Path -LiteralPath $Path -PathType Leaf) { return 1 }
  return @(Get-ChildItem -LiteralPath $Path -Recurse -File -Force).Count
}

Assert-UnderRoot $v35 $workspace 'v35'
Assert-UnderRoot $archive $workspace 'archive'

$script:movedOps = New-Object System.Collections.Generic.List[object]

function Move-ArchiveItem([string]$Source, [string]$DestRel, [string]$Layer, [string]$AssetType, [string]$Reason) {
  if (-not (Test-Path -LiteralPath $Source)) { return }
  Assert-UnderRoot $Source $v35 'source'
  $dest = Join-Path $workspace $DestRel
  Assert-UnderRoot $dest $archive 'destination'
  if (Test-Path -LiteralPath $dest) { throw "Archive destination already exists: $dest" }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
  $item = Get-Item -LiteralPath $Source -Force
  $script:movedOps.Add([pscustomobject]@{
    source_path = Get-Rel $item.FullName
    archive_path = ($DestRel -replace '\\','/')
    item_type = if ($item.PSIsContainer) { 'directory' } else { 'file' }
    layer = $Layer
    asset_type = $AssetType
    file_count = Count-Files $item.FullName
    reason = $Reason
    moved_at = $script:now
  }) | Out-Null
  Move-Item -LiteralPath $item.FullName -Destination $dest
}

function Write-TextFile([string]$Rel, [string]$Content) {
  $path = Join-Path $workspace $Rel
  Assert-UnderRoot $path $v35 'active write'
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $path) | Out-Null
  Set-Content -LiteralPath $path -Value $Content -Encoding UTF8
}

function Write-JsonFile([string]$Rel, [object]$Object, [int]$Depth = 12) {
  $path = Join-Path $workspace $Rel
  Assert-UnderRoot $path $v35 'active json write'
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $path) | Out-Null
  $Object | ConvertTo-Json -Depth $Depth | Set-Content -LiteralPath $path -Encoding UTF8
}

function New-Sha256([string]$Text) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  return ([System.BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-','').ToLowerInvariant()
}

# Archive previous current-facing and evidence-heavy surfaces.
Move-ArchiveItem (Join-Path $v35 'PROMPT_USER_GUIDE.md') "$archiveRel/docs/PROMPT_USER_GUIDE.previous.md" 'docs' 'previous_current_doc' 'replace with simplified current usage guide'
Move-ArchiveItem (Join-Path $v35 'RUNBOOK_v35.md') "$archiveRel/docs/RUNBOOK_v35.previous.md" 'docs' 'previous_current_doc' 'replace with docs/V35_OPERATING_GUIDE.md'
Move-ArchiveItem (Join-Path $v35 'README.md') "$archiveRel/docs/README.previous.md" 'docs' 'previous_current_doc' 'replace with current README if present'

foreach ($child in @(Get-ChildItem -LiteralPath (Join-Path $v35 'docs') -Force -ErrorAction SilentlyContinue)) {
  Move-ArchiveItem $child.FullName "$archiveRel/docs/$($child.Name)" 'docs' 'legacy_or_process_doc' 'active docs are replaced by current-state documentation set'
}
foreach ($child in @(Get-ChildItem -LiteralPath (Join-Path $v35 'reports') -Force -ErrorAction SilentlyContinue)) {
  Move-ArchiveItem $child.FullName "$archiveRel/reports/$($child.Name)" 'reports' 'release_or_process_report' 'reports are minimized to current-facing summary set'
}
foreach ($child in @(Get-ChildItem -LiteralPath (Join-Path $v35 'harness') -Force -ErrorAction SilentlyContinue)) {
  $destFolder = if ($child.Name -like '*trace*' -or $child.Name -eq 'stack_eval_runs') { 'traces' } else { 'harness' }
  Move-ArchiveItem $child.FullName "$archiveRel/$destFolder/$($child.Name)" $destFolder 'harness_or_trace_evidence' 'phase-specific or historical harness evidence archived'
}
foreach ($child in @(Get-ChildItem -LiteralPath (Join-Path $v35 'validation') -Force -ErrorAction SilentlyContinue)) {
  Move-ArchiveItem $child.FullName "$archiveRel/validation/$($child.Name)" 'validation' 'legacy_validation_doc' 'validation surface replaced with current validation suite/result/readme'
}
foreach ($child in @(Get-ChildItem -LiteralPath (Join-Path $v35 'records') -Force -ErrorAction SilentlyContinue)) {
  if ($child.Name -eq 'actor_outputs') {
    Move-ArchiveItem $child.FullName "$archiveRel/actor_outputs" 'actor_outputs' 'raw_actor_outputs' 'raw actor outputs preserved outside active records'
  } elseif ($child.Name -like '*checksum*') {
    Move-ArchiveItem $child.FullName "$archiveRel/checksums/$($child.Name)" 'checksums' 'previous_checksum_record' 'previous checksum record preserved before regeneration'
  } elseif ($child.Name -like '*manifest*') {
    Move-ArchiveItem $child.FullName "$archiveRel/manifests/$($child.Name)" 'manifests' 'previous_manifest_record' 'previous manifest record preserved before regeneration'
  } elseif ($child.Name -like '*trace*') {
    Move-ArchiveItem $child.FullName "$archiveRel/traces/$($child.Name)" 'traces' 'trace_record' 'trace records preserved outside active records'
  } else {
    Move-ArchiveItem $child.FullName "$archiveRel/records/$($child.Name)" 'records' 'release_or_phase_record' 'records are minimized to current operational JSON set'
  }
}

foreach ($dir in @('records','reports','harness','validation','actor_outputs','traces','manifests','checksums','docs')) {
  New-Item -ItemType Directory -Force -Path (Join-Path $archive $dir) | Out-Null
}

$prohibitedClaims = @(
  'production-monitored',
  'containment-verified',
  'all primary-source items fully validated',
  'public benchmark certified',
  'live production rollout certified'
)

$downgradeStatements = @(
  'Primary-source deferred items remain downgraded and must not be treated as release-grade current facts.',
  'Sandbox and telemetry gaps limit production-readiness claims.',
  'Containment remains downgraded unless containment proof is produced.',
  'This release is validated under local runner and semantic judge evidence, not under production telemetry.',
  'Codex runtime readiness was evaluated behaviorally; codex/skills are not treated as textual mirrors of 00~04.',
  'This release is not a live production rollout certification.'
)

Write-TextFile 'v35/README.md' @"
# v35

v35 is the current stable release of the evaluated prompt stack and Codex runtime package.

## What This Contains
- `00_governance/`: governance and operating boundaries.
- `01_base/`: base prompt stack instructions.
- `02_overlays/`: optional behavior overlays.
- `03_examples/`: structure-only example assets.
- `04_harness/`: harness contracts and release-gate guidance.
- `99_total/`: assembled prompt stack bundles.
- `codex/`: Codex runtime guide and skills.
- `docs/`: current-state operating documentation.
- `harness/`: current validation entrypoint.
- `records/`: minimal machine-readable current records.
- `reports/`: human-readable current summaries.
- `validation/`: current validation suite and result.

## Start Here
1. Read `PROMPT_USER_GUIDE.md` for usage.
2. Read `docs/V35_CURRENT_STATE.md` for current status.
3. Read `docs/V35_OPERATING_GUIDE.md` before modifying assets.
4. Read `docs/V35_LIMITATIONS_AND_FOLLOWUPS.md` before making release or production-readiness claims.

## Claim Scope
Allowed claims are limited to the evaluated local runner, actor-output, semantic-judge, and release-gate evidence captured for this release.

Do not claim `production-monitored`, `containment-verified`, `all primary-source items fully validated`, `public benchmark certified`, or `live production rollout certified` status.

## Current Limitations
Primary-source deferred items, sandbox gaps, telemetry gaps, and containment proof remain explicit downgrades. These are release-claim limits, not hidden failures.
"@

Write-TextFile 'v35/PROMPT_USER_GUIDE.md' @"
# v35 Prompt User Guide

## Purpose
Use v35 as the current stable prompt stack and Codex runtime package for local prompt-stack operation, review, and validation.

## Which Files To Use
- Use `99_total/` when you need assembled prompt stack bundles.
- Use `00_governance/`, `01_base/`, `02_overlays/`, `03_examples/`, and `04_harness/` when inspecting or maintaining source-of-truth stack assets.
- Use `codex/CODEX_RUNTIME_GUIDE.md` and `codex/skills/*/SKILL.md` for Codex runtime behavior.
- Use `harness/validate_current_v35.mjs` for current structural and claim-scope validation.
- Use `validation/current_validation_result.json` for the latest local current-state validation result.

## Source-of-Truth Stack Roles
- `00_governance/`: boundaries, ownership, release and safety constraints.
- `01_base/`: base operating instructions.
- `02_overlays/`: optional overlays activated by task need.
- `03_examples/`: example structures only; examples are not factual authority.
- `04_harness/`: harness contracts, validation boundaries, and release-gate controls.
- `99_total/`: composed prompt artifacts for practical use.

## Codex Runtime Assets
The `codex/` directory is an independent runtime package. Codex skills are not textual mirrors of `00_governance/` through `04_harness/`; they are maintained for behavioral alignment, safety preservation, and runtime fitness.

## Maintenance Rules
- Do not silently modify core prompt stack assets.
- Do not update Codex runtime assets without validating runtime behavior.
- Do not convert example material into factual authority.
- Do not make production-readiness claims from local traces alone.
- Update current docs, active records, validation result, and checksums when changing active assets.

## Claim Limits
Primary-source deferred items remain downgraded and must not be treated as release-grade current facts. Sandbox and telemetry gaps limit production-readiness claims. Containment remains downgraded unless containment proof is produced.
"@

Write-TextFile 'v35/docs/V35_CURRENT_STATE.md' @"
# V35 Current State

## Status
- current_stable_version: v35
- release_scope: evaluated prompt stack and Codex runtime package
- validation_scope: local runner, actor-output, semantic-judge, and release-gate evidence
- production_autonomy_certified: false

## Core Assets
- source_of_truth_stack: `00_governance/`, `01_base/`, `02_overlays/`, `03_examples/`, `04_harness/`, `99_total/`
- codex_runtime_assets: `codex/CODEX_RUNTIME_GUIDE.md`, `codex/skills/*/SKILL.md`
- current_harness_entrypoint: `harness/validate_current_v35.mjs`

## Validation State
- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- release gates: 9 pass, 2 partial with downgrade, 0 fail
- critical failures: 0
- P0: 0
- release-blocking P1: 0
- trace missing: 0
- claim strength violations: 0

## Downgrade State
- primary_source: downgraded follow-up backlog
- sandbox: downgrade
- telemetry: downgrade
- containment: downgrade

## Follow-Up State
Current follow-up work is tracked in `records/v35_followup_backlog.json` and summarized in `docs/V35_LIMITATIONS_AND_FOLLOWUPS.md`.
"@

Write-TextFile 'v35/docs/V35_LIMITATIONS_AND_FOLLOWUPS.md' @"
# V35 Limitations and Follow-Ups

## Active Downgrades
- Primary-source deferred items remain downgraded and must not be treated as release-grade current facts.
- Sandbox and telemetry gaps limit production-readiness claims.
- Containment remains downgraded unless containment proof is produced.
- This release is validated under local runner and semantic judge evidence, not under production telemetry.
- Codex runtime readiness was evaluated behaviorally; codex/skills are not treated as textual mirrors of 00~04.
- This release is not a live production rollout certification.

## Prohibited Claims
Do not claim production-monitored, containment-verified, all-primary-source-validated, public-benchmark-certified, or live-production-rollout-certified status.

## Follow-Up Backlog
- Primary-source validation follow-up for deferred source claims.
- Sandbox and containment proof follow-up.
- Telemetry integration follow-up.
- Codex runtime watch for routing, boundary preservation, and independent runtime behavior.
- Post-release drift watch for prompt injection resistance, approval boundary, destructive action boundary, retrieval/factuality, example boundary, technique over-activation, verify-before-claim, claim strength language, and Codex runtime routing.
"@

Write-TextFile 'v35/docs/V35_OPERATING_GUIDE.md' @"
# V35 Operating Guide

## Before Changing Assets
- Identify the owner layer before editing: governance, base, overlay, example, harness, assembled bundle, or Codex runtime.
- Keep source-of-truth stack behavior and Codex runtime behavior distinct.
- Preserve downgrade language when limitations remain unresolved.
- Update active records, validation result, and checksums after approved changes.

## Owner Boundary
- Governance and safety rules belong in `00_governance/`.
- Base behavior belongs in `01_base/`.
- Optional task behavior belongs in `02_overlays/`.
- Examples remain structure-only in `03_examples/`.
- Harness contracts and validation rules belong in `04_harness/` and `harness/`.
- Codex runtime behavior belongs in `codex/`.

## Codex Runtime Independence
Codex skills are independent runtime assets. Do not require text parity with the source stack. Validate behavioral alignment, safety preservation, boundary preservation, and runtime fitness.

## Current-State Documentation Rule
Current-facing docs should describe how to use and maintain v35 now. Detailed process evidence belongs in `_archive/v35_release_evidence_2026-05-19/`.

## Rollback Triggers
Rollback review is required for prompt injection regression, approval boundary regression, destructive action boundary regression, secret leakage, retrieval/factuality regression, Codex runtime boundary regression, example factual transfer regression, unsupported release claim, or major runtime route regression.

## Next-Version Work
Start v35.1 or v36 work only after creating a separate work area, defining acceptance criteria, and preserving v35 as the current stable baseline.
"@

Write-TextFile 'v35/docs/V35_ARTIFACT_MAP.md' @"
# V35 Artifact Map

## Read First
- `README.md`
- `PROMPT_USER_GUIDE.md`
- `docs/V35_CURRENT_STATE.md`
- `docs/V35_LIMITATIONS_AND_FOLLOWUPS.md`
- `docs/V35_OPERATING_GUIDE.md`

## Core Stack
- `00_governance/`
- `01_base/`
- `02_overlays/`
- `03_examples/`
- `04_harness/`
- `99_total/`

## Codex Runtime
- `codex/CODEX_RUNTIME_GUIDE.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

## Active Records
- `records/v35_current_state.json`
- `records/v35_release_manifest.json`
- `records/v35_file_checksums.json`
- `records/v35_limitations_register.json`
- `records/v35_followup_backlog.json`
- `records/v35_active_validation_summary.json`

## Active Reports
- `reports/V35_CURRENT_STATE_SUMMARY.md`
- `reports/V35_VALIDATION_SUMMARY.md`
- `reports/V35_RELEASE_NOTES.md`
- `reports/V35_ROLLBACK_AND_MONITORING_PLAN.md`
- `reports/V35_CLEANUP_FINAL_REPORT.md`

## Archived Evidence
Detailed release evidence is preserved outside active v35 at `_archive/v35_release_evidence_2026-05-19/`.
"@

Write-TextFile 'v35/reports/V35_CURRENT_STATE_SUMMARY.md' @"
# V35 Current State Summary

## Summary
- current_stable_version: v35
- scope: evaluated prompt stack and Codex runtime package
- active_docs: current-state only
- archived_evidence: `_archive/v35_release_evidence_2026-05-19/`

## Validation Evidence
- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- release gates: 9 pass, 2 partial with downgrade, 0 fail
- critical failures: 0
- P0: 0
- release-blocking P1: 0

## Claim Scope
Claims are limited to evaluated local runner, actor-output, semantic-judge, and release-gate evidence. Production monitoring, containment verification, complete primary-source validation, public benchmark certification, and live production rollout certification are not claimed.
"@

Write-TextFile 'v35/reports/V35_VALIDATION_SUMMARY.md' @"
# V35 Validation Summary

## Current Validation
- suite: `validation/current_validation_suite.json`
- result: `validation/current_validation_result.json`
- entrypoint: `harness/validate_current_v35.mjs`

## Evidence Summary
- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- critical failures: 0
- P0: 0
- release-blocking P1: 0
- trace missing: 0
- claim strength violations: 0

## Downgrade-Aware Interpretation
Validation supports current stable use under local evidence. It does not certify production telemetry, containment proof, public benchmark status, or live rollout readiness.
"@

Write-TextFile 'v35/reports/V35_RELEASE_NOTES.md' @"
# V35 Release Notes

## Release Summary
v35 is the current stable release of the evaluated prompt stack and Codex runtime package.

## Included Assets
- Source-of-truth stack: `00_governance/`, `01_base/`, `02_overlays/`, `03_examples/`, `04_harness/`, `99_total/`
- Codex runtime package: `codex/CODEX_RUNTIME_GUIDE.md` and `codex/skills/*`
- Current validation entrypoint: `harness/validate_current_v35.mjs`

## Evaluation Evidence
- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- release gates: 9 pass, 2 partial with downgrade, 0 fail
- critical failures: 0

## Downgraded Claims
- Primary-source deferred items remain downgraded and must not be treated as release-grade current facts.
- Sandbox and telemetry gaps limit production-readiness claims.
- Containment remains downgraded unless containment proof is produced.
- This release is validated under local runner and semantic judge evidence, not under production telemetry.
- Codex runtime readiness was evaluated behaviorally; codex/skills are not treated as textual mirrors of 00~04.
- This release is not a live production rollout certification.

## Prohibited Claims
Do not claim production-monitored, containment-verified, all-primary-source-validated, public-benchmark-certified, or live-production-rollout-certified status.

## Follow-Up Items
Primary-source validation, sandbox/containment proof, telemetry integration, and post-release drift monitoring remain tracked follow-up work.
"@

Write-TextFile 'v35/reports/V35_ROLLBACK_AND_MONITORING_PLAN.md' @"
# V35 Rollback and Monitoring Plan

## Rollback Plan
- rollback_target: v34
- rollback_method: mark v35 as held or reverted, restore rollback target as stable baseline, preserve v35 evidence for review
- rollback_evidence_required: reproducible failure, affected asset, validation result, and recommended corrective action

## Rollback Triggers
- prompt injection regression
- approval boundary regression
- destructive action boundary regression
- secret leakage
- retrieval/factuality regression
- Codex runtime boundary regression
- example factual transfer regression
- unsupported release claim
- major runtime route regression

## Monitoring Plan
- prompt injection resistance
- tool parameter discipline
- verify-before-claim behavior
- retrieval freshness and factuality
- Codex runtime behavior and routing
- example boundary preservation
- technique over-activation
- claim strength language
- sandbox, telemetry, and containment follow-up
- primary-source validation follow-up

## Monitoring Claim Scope
This is a local monitoring plan. Do not claim production-monitored status unless live production telemetry is connected and validated.
"@

Write-TextFile 'v35/harness/README.md' @"
# V35 Harness

This directory contains the current v35 validation entrypoint.

## Entrypoint
Run:

````bash
node harness/validate_current_v35.mjs
````

The validator checks required active files, parses active JSON records, verifies archive pointers, and scans current-facing docs for prohibited positive claims.
"@

Write-TextFile 'v35/harness/validate_current_v35.mjs' @'
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const archive = path.resolve(root, "..", "_archive", "v35_release_evidence_2026-05-19");
const resultPath = path.join(root, "validation", "current_validation_result.json");

const requiredPaths = [
  "README.md",
  "PROMPT_USER_GUIDE.md",
  "00_governance",
  "01_base",
  "02_overlays",
  "03_examples",
  "04_harness",
  "99_total",
  "codex",
  "docs/V35_CURRENT_STATE.md",
  "docs/V35_OPERATING_GUIDE.md",
  "docs/V35_LIMITATIONS_AND_FOLLOWUPS.md",
  "docs/V35_ARTIFACT_MAP.md",
  "harness/README.md",
  "harness/validate_current_v35.mjs",
  "records/v35_current_state.json",
  "records/v35_release_manifest.json",
  "records/v35_file_checksums.json",
  "records/v35_limitations_register.json",
  "records/v35_followup_backlog.json",
  "records/v35_active_validation_summary.json",
  "reports/V35_CURRENT_STATE_SUMMARY.md",
  "reports/V35_VALIDATION_SUMMARY.md",
  "reports/V35_RELEASE_NOTES.md",
  "reports/V35_ROLLBACK_AND_MONITORING_PLAN.md",
  "reports/V35_CLEANUP_FINAL_REPORT.md",
  "validation/current_validation_suite.json",
  "validation/current_validation_result.json",
  "validation/validation_readme.md"
];

const jsonPaths = [
  "records/v35_current_state.json",
  "records/v35_release_manifest.json",
  "records/v35_limitations_register.json",
  "records/v35_followup_backlog.json",
  "records/v35_active_validation_summary.json",
  "validation/current_validation_suite.json"
];

const docsToScan = [
  "README.md",
  "PROMPT_USER_GUIDE.md",
  "docs/V35_CURRENT_STATE.md",
  "docs/V35_OPERATING_GUIDE.md",
  "docs/V35_LIMITATIONS_AND_FOLLOWUPS.md",
  "docs/V35_ARTIFACT_MAP.md",
  "reports/V35_CURRENT_STATE_SUMMARY.md",
  "reports/V35_VALIDATION_SUMMARY.md",
  "reports/V35_RELEASE_NOTES.md",
  "reports/V35_ROLLBACK_AND_MONITORING_PLAN.md"
];

const prohibitedPositive = [
  /v35\s+is\s+production-monitored/i,
  /v35\s+is\s+containment-verified/i,
  /all\s+primary-source\s+items\s+are\s+fully\s+validated/i,
  /v35\s+is\s+public\s+benchmark\s+certified/i,
  /v35\s+is\s+live\s+production\s+rollout\s+certified/i
];

const requiredDowngradeText = [
  "Primary-source deferred items remain downgraded",
  "Sandbox and telemetry gaps limit production-readiness claims",
  "Containment remains downgraded",
  "not under production telemetry",
  "not treated as textual mirrors",
  "not a live production rollout certification"
];

const checks = [];
function check(name, pass, detail = "") {
  checks.push({ name, pass, detail });
}

for (const rel of requiredPaths) {
  check(`required_path:${rel}`, fs.existsSync(path.join(root, rel)), rel);
}

for (const rel of jsonPaths) {
  try {
    JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
    check(`json_parse:${rel}`, true, rel);
  } catch (error) {
    check(`json_parse:${rel}`, false, String(error));
  }
}

let scanText = "";
for (const rel of docsToScan) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) scanText += `\n--- ${rel} ---\n` + fs.readFileSync(p, "utf8");
}
for (const pattern of prohibitedPositive) {
  check(`prohibited_positive_claim:${pattern}`, !pattern.test(scanText), String(pattern));
}
for (const text of requiredDowngradeText) {
  check(`downgrade_text:${text}`, scanText.includes(text), text);
}

check("archive_exists", fs.existsSync(archive), archive);
check("archive_manifest_exists", fs.existsSync(path.join(archive, "archive_manifest.json")), "archive_manifest.json");
check("archive_checksums_exists", fs.existsSync(path.join(archive, "archive_checksums.json")), "archive_checksums.json");

const passed = checks.filter((c) => c.pass).length;
const failed = checks.filter((c) => !c.pass);
const result = {
  validation_name: "current_v35_validation",
  generated_at: new Date().toISOString(),
  root_path: root,
  archive_path: archive,
  total_checks: checks.length,
  passed_checks: passed,
  failed_checks: failed.length,
  status: failed.length === 0 ? "pass" : "fail",
  checks
};

fs.mkdirSync(path.dirname(resultPath), { recursive: true });
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
if (failed.length > 0) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));
'@

$validationSuite = [pscustomobject]@{
  validation_name = 'current_v35_validation'
  validation_scope = 'active v35 current-state structure, JSON parseability, archive pointers, downgrade language, prohibited positive claim scan'
  entrypoint = 'harness/validate_current_v35.mjs'
  generated_at = $now
  prohibited_positive_claims = $prohibitedClaims
  required_downgrade_language = $downgradeStatements
}
Write-JsonFile 'v35/validation/current_validation_suite.json' $validationSuite 8

Write-TextFile 'v35/validation/validation_readme.md' @"
# V35 Validation

Run the current validation entrypoint from the `v35` directory:

````bash
node harness/validate_current_v35.mjs
````

The result is written to `validation/current_validation_result.json`.
"@

Write-JsonFile 'v35/validation/current_validation_result.json' ([pscustomobject]@{
  validation_name = 'current_v35_validation'
  status = 'pending'
  generated_at = $now
  note = 'Seed result created before validator execution.'
}) 5

$evidenceSummary = [pscustomobject]@{
  native_semantic_judge = '73/73 pass'
  codex_runtime_semantic_judge = '25/25 pass'
  actor_output_authenticity = '98/98 judgeable'
  release_gates = '9 pass, 2 partial_with_downgrade, 0 fail'
  critical_failures = 0
  P0 = 0
  release_blocking_P1 = 0
  trace_missing = 0
  claim_strength_violations = 0
}

$currentState = [pscustomobject]@{
  release_version = 'v35'
  status = 'current_stable'
  release_scope = @('source_of_truth_stack','codex_runtime_package','harness_contracts','current_validation_records')
  validation_scope = 'local runner, actor-output, semantic-judge, and release-gate evidence'
  source_of_truth_assets = @('00_governance','01_base','02_overlays','03_examples','04_harness','99_total')
  codex_runtime_assets = @('codex/CODEX_RUNTIME_GUIDE.md','codex/skills/coding-core','codex/skills/design-analysis','codex/skills/eval-ops','codex/skills/grounded-research','codex/skills/orchestration-control')
  evidence_summary = $evidenceSummary
  downgrade_state = [pscustomobject]@{ primary_source='downgrade'; sandbox='downgrade'; telemetry='downgrade'; containment='downgrade' }
  archive_path = $archiveRel
  generated_at = $now
}
Write-JsonFile 'v35/records/v35_current_state.json' $currentState 8

Write-JsonFile 'v35/records/v35_limitations_register.json' ([pscustomobject]@{
  release_version = 'v35'
  generated_at = $now
  limitations = @(
    [pscustomobject]@{ id='primary_source_deferred'; status='downgrade'; claim_impact='deferred items are not release-grade current facts'; follow_up='validate against official primary sources before strengthening claims' },
    [pscustomobject]@{ id='sandbox_gap'; status='downgrade'; claim_impact='limits production-readiness claims'; follow_up='produce sandbox proof if stronger claim is needed' },
    [pscustomobject]@{ id='telemetry_gap'; status='downgrade'; claim_impact='local traces are not production telemetry'; follow_up='connect and validate live telemetry before monitoring claims' },
    [pscustomobject]@{ id='containment_gap'; status='downgrade'; claim_impact='containment-verified status is not claimed'; follow_up='produce containment proof before using containment-verified language' },
    [pscustomobject]@{ id='production_rollout'; status='not_certified'; claim_impact='live production rollout certification is not claimed'; follow_up='define production rollout criteria separately if needed' }
  )
  prohibited_claims = $prohibitedClaims
}) 8

Write-JsonFile 'v35/records/v35_followup_backlog.json' ([pscustomobject]@{
  release_version = 'v35'
  generated_at = $now
  items = @(
    [pscustomobject]@{ id='primary_source_validation_followup'; priority='P1'; status='open'; description='Track deferred primary-source items; do not promote latest model/API/tool claims without official source validation.' },
    [pscustomobject]@{ id='sandbox_containment_followup'; priority='P1'; status='open'; description='Separate sandbox downgrade from containment proof; do not claim containment verification without proof.' },
    [pscustomobject]@{ id='telemetry_followup'; priority='P1'; status='open'; description='Keep local trace and production telemetry distinct; do not claim production monitoring without live telemetry.' },
    [pscustomobject]@{ id='codex_runtime_watch'; priority='P1'; status='open'; description='Manage codex/skills as independent runtime package; validate runtime changes and review backport candidates separately.' },
    [pscustomobject]@{ id='post_release_drift_monitoring'; priority='P1'; status='open'; description='Watch prompt injection, approval boundary, destructive action boundary, retrieval/factuality, example boundary, technique over-activation, verify-before-claim, claim strength language, and Codex routing.' }
  )
}) 8

Write-JsonFile 'v35/records/v35_active_validation_summary.json' ([pscustomobject]@{
  release_version = 'v35'
  generated_at = $now
  current_validation_suite = 'validation/current_validation_suite.json'
  current_validation_result = 'validation/current_validation_result.json'
  evidence_summary = $evidenceSummary
  readiness_scope = 'current stable under evaluated local evidence, with explicit downgrades'
  prohibited_claims = $prohibitedClaims
}) 8

Write-TextFile 'v35/reports/V35_CLEANUP_FINAL_REPORT.md' @"
# V35 Cleanup Final Report

## 1. Summary
- cleanup_completed: true
- mode: approved_execution
- v35_path: v35
- v34_modified: false
- v35_candidate_modified: false
- archive_path: $archiveRel

## 2. Active Current-State Documents
- README: `README.md`
- PROMPT_USER_GUIDE: `PROMPT_USER_GUIDE.md`
- V35_CURRENT_STATE: `docs/V35_CURRENT_STATE.md`
- V35_OPERATING_GUIDE: `docs/V35_OPERATING_GUIDE.md`
- V35_LIMITATIONS_AND_FOLLOWUPS: `docs/V35_LIMITATIONS_AND_FOLLOWUPS.md`
- V35_ARTIFACT_MAP: `docs/V35_ARTIFACT_MAP.md`

## 3. Active Artifacts Kept
- records: minimal current-state JSON set
- reports: current-state summaries, release notes, rollback and monitoring plan
- harness: current validation README and validator
- validation: current validation suite, result, and README

## 4. Archived Evidence
- archive_path: `$archiveRel`
- archive_manifest: `$archiveRel/archive_manifest.json`
- archive_checksums: `$archiveRel/archive_checksums.json`

## 5. Delete Candidates
- count: 0
- files: none
- user_approval_required: true for any future deletion

## 6. Claim Scope
- allowed_claims: evaluated prompt stack and Codex runtime package readiness under local evidence
- downgraded_claims: primary-source, sandbox, telemetry, containment
- prohibited_claims: production-monitored, containment-verified, all-primary-source-validated, public-benchmark-certified, live-production-rollout-certified
- verification_result: see `validation/current_validation_result.json`

## 7. Final Status
Status:
v35 current-state cleanup completed

Rationale:
Active v35 now contains current-facing documentation and minimal operational records. Heavy release evidence was moved to archive with manifest and checksums.

Next action:
No further cleanup action is required unless you request post-cleanup review, validation expansion, or follow-up backlog execution.

Files requiring user approval:
Future deletion, production telemetry claims, containment verification claims, or primary-source claim upgrades require separate approval and evidence.
"@

$archiveManifest = [pscustomobject]@{
  archive_name = 'v35_release_evidence_2026-05-19'
  archive_path = $archiveRel
  created_at = $now
  cleanup_mode = 'approved_execution'
  moved_operations = $movedOps
  active_release = 'v35'
  note = 'Release evidence archive. Active v35 contains current-facing docs and minimal operational records.'
}
$archiveManifest | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $archive 'archive_manifest.json') -Encoding UTF8

Set-Content -LiteralPath (Join-Path $archive 'README.md') -Encoding UTF8 -Value @"
# v35 Release Evidence Archive

This archive preserves release evidence moved out of active `v35` during approved current-state cleanup.

## Scope
- records
- reports
- harness evidence
- validation evidence
- actor outputs
- traces
- previous manifests and checksums
- previous current-facing docs

Active v35 should be read from `v35/README.md`, `v35/PROMPT_USER_GUIDE.md`, and `v35/docs/`.
"@

$archiveChecksums = @(Get-ChildItem -LiteralPath $archive -Recurse -File -Force | Where-Object { $_.Name -ne 'archive_checksums.json' } | Sort-Object FullName | ForEach-Object {
  [pscustomobject]@{
    path = Get-Rel $_.FullName
    layer = if ($_.FullName -like "*\records\*") { 'records' } elseif ($_.FullName -like "*\reports\*") { 'reports' } elseif ($_.FullName -like "*\harness\*") { 'harness' } elseif ($_.FullName -like "*\validation\*") { 'validation' } elseif ($_.FullName -like "*\actor_outputs\*") { 'actor_outputs' } elseif ($_.FullName -like "*\traces\*") { 'traces' } elseif ($_.FullName -like "*\docs\*") { 'docs' } else { 'archive_metadata' }
    size = $_.Length
    checksum = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
})
[pscustomobject]@{ generated_at=$now; archive_path=$archiveRel; file_count=$archiveChecksums.Count; files=$archiveChecksums } | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $archive 'archive_checksums.json') -Encoding UTF8

$releaseManifestBase = [ordered]@{
  release_version = 'v35'
  status = 'current_stable'
  previous_stable_version = 'v34'
  release_scope = @('source_of_truth_stack','codex_runtime_assets','harness_contracts','current_validation_records','release_evidence_archive')
  active_artifacts = [pscustomobject]@{
    docs = @('README.md','PROMPT_USER_GUIDE.md','docs/V35_CURRENT_STATE.md','docs/V35_OPERATING_GUIDE.md','docs/V35_LIMITATIONS_AND_FOLLOWUPS.md','docs/V35_ARTIFACT_MAP.md')
    harness = @('harness/README.md','harness/validate_current_v35.mjs')
    records = @('records/v35_current_state.json','records/v35_release_manifest.json','records/v35_file_checksums.json','records/v35_limitations_register.json','records/v35_followup_backlog.json','records/v35_active_validation_summary.json')
    reports = @('reports/V35_CURRENT_STATE_SUMMARY.md','reports/V35_VALIDATION_SUMMARY.md','reports/V35_RELEASE_NOTES.md','reports/V35_ROLLBACK_AND_MONITORING_PLAN.md','reports/V35_CLEANUP_FINAL_REPORT.md')
    validation = @('validation/current_validation_suite.json','validation/current_validation_result.json','validation/validation_readme.md')
  }
  evidence_summary = $evidenceSummary
  downgraded_claims = @('primary_source','sandbox','telemetry','containment')
  prohibited_claims = $prohibitedClaims
  archive_path = $archiveRel
  generated_at = $now
}
$releaseManifestBase['manifest_hash'] = New-Sha256 ($releaseManifestBase | ConvertTo-Json -Depth 12)
Write-JsonFile 'v35/records/v35_release_manifest.json' ([pscustomobject]$releaseManifestBase) 12
Write-JsonFile 'v35/records/v35_file_checksums.json' ([pscustomobject]@{ generated_at=$now; status='pending_final_regeneration'; files=@() }) 5

Write-Output ([pscustomobject]@{
  status = 'cleanup_content_generated'
  moved_operations = $movedOps.Count
  archive_path = $archiveRel
} | ConvertTo-Json -Depth 5)

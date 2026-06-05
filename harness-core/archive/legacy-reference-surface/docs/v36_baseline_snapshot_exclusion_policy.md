# V36 baseline snapshot exclusion policy

Status: active

## Policy

`harness-core/evidence/v36-baseline` snapshot inventory and checksums exclude macOS Finder metadata files named `.DS_Store`.

This is a snapshot policy only:

- do not delete `.DS_Store` files from `prompt-stack/v36` in this repair step
- do not record `.DS_Store` in `file_inventory.json`
- do not record `.DS_Store` in `checksums.json`
- do not list `.DS_Store` as owner-approved new baseline paths
- fail `compare_v36_baseline.mjs` if `.DS_Store` appears in the baseline snapshot

## Rationale

`.DS_Store` is local OS metadata, not a source or harness contract artifact. Including it in the v36 baseline makes the snapshot host-specific and can create non-semantic churn.

## Verification

The local verification baseline refresh tool records `snapshot_exclusion_policy` metadata with:

- policy id: `v36-baseline-os-metadata-exclusion`
- excluded basename: `.DS_Store`
- excluded current paths
- `source_files_removed: false`

`compare_v36_baseline.mjs` records the same policy and fails when excluded basenames are present in snapshot inventory or checksums.

## Claim boundary

This policy does not enable:

- `local-model-verified`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`

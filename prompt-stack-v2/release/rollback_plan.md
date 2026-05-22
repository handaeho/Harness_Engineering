# Rollback Plan

## Alpha Rollback Boundary

`prompt-stack/v36` remains the stable baseline. If v2 alpha work is invalid,
remove or replace only `prompt-stack-v2` artifacts. Do not modify v36 to repair
v2.

## Recovery Steps

1. Preserve the failing validation output.
2. Identify the invalid alpha artifact.
3. Restore the last valid v2 alpha file or regenerate baseline evidence from
   read-only v36.
4. Rerun the static checks only.
5. Keep claim strength at alpha level unless stronger evidence exists.

## Stable Fallback

Use `prompt-stack/v36` for current stable operation until v2 reaches a later
verified milestone.

## Beta Release Gate Dry-run Draft

The release gate dry-run adds draft rollback targets only. Draft status does not finalize rollback authority or allow release-gated status.

Current draft triggers:
- Canary replay suite fails after previously passing.
- Claim scanner detects a prohibited positive claim.
- Required bundle evidence is missing from the evidence index.

Each trigger requires preserving the failing report, restoring or regenerating
the last valid evidence artifact, rerunning the relevant gate, and downgrading
claims until evidence is restored.

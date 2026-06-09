# Next Replay Rerun Plan

Replay verification is not enabled in the canary matrix summary stage.

Future replay entry conditions:

- The exact canary fixture set is frozen.
- Previous run IDs and evidence paths are recorded.
- Rerun count and pass threshold are explicit.
- Provider/local execution scope is separately approved.
- Redaction and raw-response storage rules remain enforced.

Replay pass would require repeated execution evidence. A single canary pass or
matrix summary does not allow `replay-verified`.

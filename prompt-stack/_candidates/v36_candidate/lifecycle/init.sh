#!/usr/bin/env bash
set -euo pipefail
echo "v36_candidate init: current stable remains v35"
test -f AGENTS.md
test -f state/feature_list.json
test -f state/session-handoff.md
node harness/validate_current_v36.mjs

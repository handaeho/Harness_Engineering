#!/usr/bin/env bash
set -euo pipefail
echo "active package init: current stable active package"
test -f AGENTS.md
test -f state/feature_list.json
test -f state/session-handoff.md
node harness/validate_current.mjs

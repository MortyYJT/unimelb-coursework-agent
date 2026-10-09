#!/usr/bin/env bash
# The single command that must pass before work counts as done.
# Edit per project. Keep it fast (< ~1 minute) and identical to what CI runs.
#
# Node / Next.js:  npm run lint && npx tsc --noEmit && npm test --if-present
# Python:          ruff check . && pytest -q
#
# Replace the two lines below with your command(s). Until then the Stop hook does nothing.
echo "check.sh not configured yet - skipping" >&2
exit 0

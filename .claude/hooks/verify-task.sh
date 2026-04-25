#!/bin/bash
# verify-task.sh — Stop hook. Advisory reminder of mobile checks before declaring done.

set -euo pipefail
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR" || exit 0

CHANGED=$(git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null) || true
[ -z "$CHANGED" ] && exit 0

# Only fire if this app was touched
if echo "$CHANGED" | grep -qE '^src/|^app\.config\.ts|^plugins/|^package\.json'; then
  echo "Reminder — mobile changes detected. Before declaring done, run:" >&2
  echo "  pnpm check-all   # lint + type-check + test" >&2
fi

echo '{}'

#!/bin/bash
# pre-tool-safety.sh — blocks destructive shell commands. Mirrors root hook.
set -euo pipefail
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0

block() {
  echo "BLOCKED by pre-tool-safety.sh: $1" >&2
  echo "Command: $COMMAND" >&2
  exit 2
}

if echo "$COMMAND" | grep -qE '\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|-rf|-fr)\b.*(\s/\s|\s/$|\s\.\s|\s\./?$|\s~/?$|\s\*\s|\s\*$)'; then
  block "Broad 'rm -rf' on / . ~ or *"
fi
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force(-with-lease)?\b.*\b(main|master|production)\b'; then
  block "Force-push to a protected branch"
fi
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*\s-f\b.*\b(main|master|production)\b'; then
  block "Force-push (-f) to a protected branch"
fi
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard\s+(HEAD~|origin/|--)'; then
  block "git reset --hard discards uncommitted work"
fi
if echo "$COMMAND" | grep -qE 'git\s+clean\s+(-[a-zA-Z]*f[a-zA-Z]*d|-fd|-df)'; then
  block "git clean -fd deletes untracked files"
fi
if echo "$COMMAND" | grep -qE 'git\s+commit\s+.*--no-verify'; then
  block "--no-verify skips commit hooks. Fix the underlying issue."
fi
# Mobile-specific: don't manually prebuild/eject
if echo "$COMMAND" | grep -qE '(npx|pnpm)\s+expo\s+(prebuild|eject)\s+--clean'; then
  block "expo prebuild --clean wipes android/ios — confirm with user first"
fi
exit 0

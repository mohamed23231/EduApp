#!/bin/bash
# sessionstart.sh — mobile-app/.claude
# Loads monorepo-root memory files so Claude has full context even when
# launched from inside the mobile-app directory.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
ROOT_DIR="$(cd "$PROJECT_DIR/.." 2>/dev/null && pwd)" || ROOT_DIR=""

OUTPUT=""

read_memory() {
  local file="$1"
  local label="$2"
  if [ -f "$file" ]; then
    local content
    content=$(head -200 "$file")
    OUTPUT+="

--- $label ---
$content
"
  fi
}

# Load root memory first (architecture, ADRs, recent work)
if [ -n "$ROOT_DIR" ]; then
  read_memory "$ROOT_DIR/memory/project-state.md" "ROOT PROJECT STATE (long-term architecture)"
  read_memory "$ROOT_DIR/memory/session-summary.md" "ROOT SESSION SUMMARY (recent work)"
  read_memory "$ROOT_DIR/memory/architecture-decisions.md" "ROOT ARCHITECTURE DECISIONS"
fi

# Then app-specific memory if present
read_memory "$PROJECT_DIR/.claude/agent-memory/mobile/MEMORY.md" "MOBILE APP MEMORY"

if [ -n "$OUTPUT" ]; then
  echo "[Context Memory] Loaded monorepo + mobile-app context."
  echo "$OUTPUT"
fi

echo '{}'

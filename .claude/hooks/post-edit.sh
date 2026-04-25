#!/bin/bash
# post-edit.sh — mobile-app/.claude
# Auto-format and lint Expo/RN files after Claude edits them.
# Best-effort: failures don't block the conversation.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.file // empty')

[ -z "$FILE_PATH" ] && exit 0

# Skip non-source files
case "$FILE_PATH" in
  *.md|*.json|*.yml|*.yaml|*.lock|*.sh|*.toml|*.gitignore)
    exit 0
    ;;
esac

# Only handle files inside this app
case "$FILE_PATH" in
  *mobile-app/src/*.ts|*mobile-app/src/*.tsx) ;;
  *) exit 0 ;;
esac

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

if [ -d "$PROJECT_DIR/node_modules" ]; then
  ( cd "$PROJECT_DIR" && pnpm exec eslint --fix "$FILE_PATH" ) >/dev/null 2>&1 || true
fi

exit 0

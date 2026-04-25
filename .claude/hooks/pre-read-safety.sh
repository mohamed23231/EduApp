#!/bin/bash
# pre-read-safety.sh — blocks reads of secrets.
set -euo pipefail
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.file // empty')
[ -z "$FILE_PATH" ] && exit 0

block() {
  echo "BLOCKED by pre-read-safety.sh: $1" >&2
  echo "Path: $FILE_PATH" >&2
  exit 2
}

case "$FILE_PATH" in
  */.env|*/.env.*|/.env|/.env.*|.env|.env.*)
    block "Refusing to read .env"
    ;;
  */.ssh/*|*~/.ssh/*|/Users/*/.ssh/*) block "SSH keys" ;;
  */.aws/*|*~/.aws/*|/Users/*/.aws/*) block "AWS credentials" ;;
  */.gnupg/*|*~/.gnupg/*|/Users/*/.gnupg/*) block "GPG keys" ;;
  */.npmrc|*~/.npmrc|/Users/*/.npmrc) block "npm credentials" ;;
  *google-services.json) block "Firebase service config — has API key. Reference docs/PUSH_NOTIFICATIONS_KT.md instead." ;;
  *GoogleService-Info.plist) block "Firebase iOS config" ;;
esac

exit 0

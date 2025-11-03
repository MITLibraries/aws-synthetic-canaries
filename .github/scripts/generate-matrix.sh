#!/usr/bin/env bash
set -euo pipefail
# generate-matrix.sh
# Produces a JSON matrix with top-level changed folders (excludes .github and docs)

# Use hard-coded default branch 'main' per user request
DEFAULT_BRANCH="main"

if [ -z "${GITHUB_SHA:-}" ]; then
  echo "GITHUB_SHA not set; are you running inside GitHub Actions?" >&2
  exit 1
fi

if [ -n "${TEST_DIFF:-}" ]; then
  DIFF="$TEST_DIFF"
else
  # For new branch pushes github.event.created is true; prefer that over checking for all-zero before SHA
  if [ "${GITHUB_EVENT_CREATED:-}" = "true" ] || [ -z "${GITHUB_EVENT_BEFORE:-}" ]; then
    git fetch origin "$DEFAULT_BRANCH" --depth=1
    BASE_SHA=$( git rev-parse origin/$DEFAULT_BRANCH )
  else
    git fetch origin "$GITHUB_EVENT_BEFORE" --depth=1 || true
    BASE_SHA="$GITHUB_EVENT_BEFORE"
  fi

  # Collect changed files/folders, filter out .github and docs
  DIFF=$( git diff --dirstat=files,0,cumulative "$BASE_SHA" "$GITHUB_SHA" | awk -F ' ' '{print $2}' | grep -vE '(^.github)' || true )
fi

# Extract top-level directories only (ignore files in repo root) and dedupe
TOP_LEVEL=$( printf "%s\n" "$DIFF" | grep '/' | awk -F/ '{print $1}' | grep -vE '^(\\.github)$' | sort -u || true )

# Build JSON
JSON='{"paths":['
first=true
while IFS= read -r p; do
  [ -z "$p" ] && continue
  if [ "$first" = true ]; then
    JSON="$JSON\"$p\""
    first=false
  else
    JSON="$JSON,\"$p\""
  fi
done <<< "$TOP_LEVEL"
JSON="$JSON]}"

# Export matrix via GITHUB_OUTPUT if available (GitHub Actions); otherwise skip
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "matrix<<EOF" >> "$GITHUB_OUTPUT"
  echo "$JSON" >> "$GITHUB_OUTPUT"
  echo "EOF" >> "$GITHUB_OUTPUT"
fi

# Also print to logs for debugging
echo "$JSON"

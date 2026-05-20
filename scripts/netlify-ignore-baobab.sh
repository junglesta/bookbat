#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${CACHED_COMMIT_REF:-}"
HEAD_REF="${COMMIT_REF:-}"

if [[ -z "$BASE_REF" || -z "$HEAD_REF" ]]; then
  echo "Missing Netlify commit refs; do not skip BAOBAB build."
  exit 1
fi

if git diff --quiet "$BASE_REF" "$HEAD_REF" -- \
  apps/baobab \
  packages/library-core \
  data \
  scripts \
  package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml; then
  echo "No BAOBAB-related changes detected; skipping BAOBAB deploy."
  exit 0
fi

echo "BAOBAB-related changes detected; running BAOBAB deploy."
exit 1

#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${CACHED_COMMIT_REF:-}"
HEAD_REF="${COMMIT_REF:-}"

if [[ -z "$BASE_REF" || -z "$HEAD_REF" ]]; then
  echo "Missing Netlify commit refs; do not skip BOOKBAT build."
  exit 1
fi

if git diff --quiet "$BASE_REF" "$HEAD_REF" -- \
  apps/bookbat \
  packages/library-core \
  data \
  scripts \
  package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  netlify.toml; then
  echo "No BOOKBAT-related changes detected; skipping BOOKBAT deploy."
  exit 0
fi

echo "BOOKBAT-related changes detected; running BOOKBAT deploy."
exit 1

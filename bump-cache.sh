#!/usr/bin/env bash
# Stamp index.html's CSS/JS links with a fresh date/second-based cache-busting
# token (UTC, YYYYMMDDHHMMSS). Run before committing whenever styles.css or
# script.js change.
set -euo pipefail
cd "$(dirname "$0")"

stamp="$(date -u +%Y%m%d%H%M%S)"
# Replace the ?v=... token on the styles.css and script.js references.
sed -i '' -E "s/(styles\.css\?v=)[0-9]+/\1${stamp}/; s/(script\.js\?v=)[0-9]+/\1${stamp}/" index.html

echo "cache-busted to v=${stamp}"
grep -nE "styles\.css\?v|script\.js\?v" index.html

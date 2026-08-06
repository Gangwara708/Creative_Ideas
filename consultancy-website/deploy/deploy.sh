#!/usr/bin/env bash
# Deploy the site to a VPS over SSH.
#
#   ./deploy/deploy.sh user@your-server-ip
#
# What it does: builds locally, verifies every link, rsyncs dist/ to the server,
# and reloads Nginx. Nothing is uploaded if the check fails.
#
# First-time setup on the server is in docs/03-deployment.md.

set -euo pipefail

TARGET="${1:-}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/consultancy}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 user@host    (e.g. $0 root@203.0.113.10)" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

echo "▸ Building…"
npm run build

echo "▸ Checking links and structure…"
node tools/check.mjs

echo "▸ Uploading to ${TARGET}:${REMOTE_DIR}/dist …"
# --delete removes files on the server that no longer exist locally, so a
# renamed page does not linger at its old URL.
rsync -avz --delete \
  --exclude '.DS_Store' \
  dist/ "${TARGET}:${REMOTE_DIR}/dist/"

# The API and its unit file only matter if you run the optional backend.
if [[ "${WITH_API:-0}" == "1" ]]; then
  echo "▸ Uploading backend…"
  rsync -avz backend/server.js "${TARGET}:${REMOTE_DIR}/backend/server.js"
  ssh "$TARGET" "sudo systemctl restart consultancy-api"
fi

echo "▸ Reloading Nginx…"
ssh "$TARGET" "sudo nginx -t && sudo systemctl reload nginx"

echo "✅ Deployed."

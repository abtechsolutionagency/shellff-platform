#!/bin/bash
set -euo pipefail

echo "🛠️  Shellff bootstrap starting..."

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is not installed. Install pnpm 9.x before continuing." >&2
  exit 1
fi

NODE_VERSION=$(node -v || echo "")
if [[ $NODE_VERSION != v20* ]]; then
  echo "⚠️  Node 20.x is required. Detected $NODE_VERSION"
fi

if [[ ! -f ../.env ]]; then
  cp ../install/.env.example ../.env
  echo "Created root .env from template."
fi

if [[ -z "${SKIP_DOCKER:-}" ]]; then
  if ! docker version >/dev/null 2>&1; then
    echo "⚠️  Docker is not available. Install Docker Desktop or set SKIP_DOCKER=1" >&2
  fi
fi

echo "Bootstrap complete. Run 'pnpm install' at repo root when ready."

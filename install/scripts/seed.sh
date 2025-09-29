#!/bin/bash
set -euo pipefail

pnpm --filter @shellff/web prisma migrate deploy
pnpm --filter @shellff/web prisma db seed

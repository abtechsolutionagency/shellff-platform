#!/bin/bash
set -euo pipefail

pnpm --filter @shellff/api db:migrate
pnpm --filter @shellff/api db:seed

#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

pnpm --filter @shellff/api db:migrate
pnpm --filter @shellff/api db:seed

#!/usr/bin/env pwsh
param(
  [switch]$SkipDocker
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Write-Host '🛠️  Shellff bootstrap starting...' -ForegroundColor Cyan

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Error 'pnpm is not installed. Install pnpm 9.x before continuing.'
  exit 1
}

$nodeVersion = & node -v
if (-not $nodeVersion.StartsWith('v20')) {
  Write-Warning "Node 20.x is required. Detected $nodeVersion"
}

$envPath = Join-Path $root '.env'
$templatePath = Join-Path $root 'install/.env.example'

if (-not (Test-Path $envPath)) {
  Copy-Item $templatePath $envPath
  Write-Host 'Created root .env from template.'
}

if (-not $SkipDocker) {
  try {
    docker version | Out-Null
  }
  catch {
    Write-Warning 'Docker is not available. Install Docker Desktop or pass -SkipDocker to skip the check.'
  }
}

Write-Host "Bootstrap complete. Run 'pnpm install' at repo root when ready." -ForegroundColor Green

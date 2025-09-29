param(
  [switch]
)

Write-Host '🛠️  Shellff bootstrap starting...' -ForegroundColor Cyan

# Ensure pnpm is available
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Error 'pnpm is not installed. Install pnpm 9.x before continuing.'
  exit 1
}

# Validate Node version
 = node -v
if (-not .StartsWith('v20')) {
  Write-Warning "Node 20.x is required. Detected "
}

# Copy environment template if missing
if (-not (Test-Path '..\\.env')) {
  Copy-Item '..\\install\\.env.example' '..\\.env'
  Write-Host 'Created root .env from template.'
}

if (-not ) {
  Write-Host 'Checking Docker engine...'
  try {
    docker version | Out-Null
  } catch {
    Write-Warning 'Docker is not available. Install Docker Desktop or set SKIP DOCKER.'
  }
}

Write-Host 'Bootstrap complete. Run pnpm install at repo root when ready.' -ForegroundColor Green

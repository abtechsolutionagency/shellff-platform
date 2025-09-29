Write-Host 'Running Prisma migrations + seed...' -ForegroundColor Cyan
pnpm --filter @shellff/web prisma migrate deploy
pnpm --filter @shellff/web prisma db seed
Write-Host 'Database seed complete.' -ForegroundColor Green

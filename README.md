# Mandatory workflow: Binary asset handling

The `make_pr` tool cannot accept binary payloads, so every slice must keep the repository text-only while still providing deterministic media fixtures locally. Follow this workflow without exception:

- **Check in source-of-truth generators, not binaries.** For each required asset (e.g., MP3/WAV/FLAC, svg, png, jpg samples, cover art, QR exports or any other binaries not listed) add a small script or fixture module that emits the file from base64/PCM literals during `pnpm prepare` or a dedicated `pnpm generate:fixtures` step. Keep the generated outputs in a git-ignored `fixtures/` folder so `make_pr` never sees binary blobs.
- **Wire generators into tests and build tooling.** Update the relevant Vitest/Playwright setup (and any PWA cache seeding hooks) to call the generator before suites run, ensuring offline/install/update tests still exercise the real payloads they expect.

# Shellff Platform Monorepo

This repository now uses a pnpm-powered workspace to deliver the Shellff roadmap slice by slice.

## Structure
- apps/web – Next.js PWA experience.
- apps/api – NestJS backend baseline with health endpoint.
- apps/mobile – Expo/React Native shell scaffold for future slices.
- install/ – onboarding scripts, env templates, Docker helpers.
- infra/terraform – infrastructure skeleton for AWS provisioning.
- monitoring/ – Prometheus starter configuration.

## Getting Started
1. Copy install/.env.example to .env at the repo root and adjust secrets.
2. Run install/scripts/bootstrap.(ps1|sh) to validate prerequisites.
3. Start local services with docker-compose up -d.
4. Install dependencies with pnpm install.
5. Migrate and seed the database: pnpm --filter @shellff/web prisma migrate deploy then pnpm --filter @shellff/web prisma db seed.

### Workspace Scripts
- pnpm dev:web – Next.js dev server.
- pnpm dev:api – NestJS watch mode.
- pnpm dev:mobile – Expo dev client.
- pnpm lint / pnpm typecheck / pnpm test – run via Turborepo across packages.
- pnpm --filter @shellff/web test:pwa – runs the PWA install/offline/update integration suite.

## Environment
Refer to pps/web/.env.local.example and install/.env.example for required variables including database, cache, feature flags, and Solana endpoints.

## Next Steps
- Finish “Unlock issues” remediation (code format, migrations, scanner implementation).
- Complete Slice 0 testing, linting, and CI automation.
- Progress through slices in order without skipping per AGENTS.md.

# Shellff Platform Monorepo

This repository now uses a pnpm-powered workspace to deliver the Shellff roadmap slice by slice.

## Structure
- pps/web – Next.js PWA experience.
- pps/api – NestJS backend baseline with health endpoint.
- pps/mobile – Expo/React Native shell scaffold for future slices.
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

## Environment
Refer to pps/web/.env.local.example and install/.env.example for required variables including database, cache, feature flags, and Solana endpoints.

## Next Steps
- Finish “Unlock issues” remediation (code format, migrations, scanner implementation).
- Complete Slice 0 testing, linting, and CI automation.
- Progress through slices in order without skipping per AGENTS.md.

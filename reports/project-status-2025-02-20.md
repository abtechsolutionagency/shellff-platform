# Project Status — 2025-02-20

## Completed Additions & Changes
- Established a pnpm-driven monorepo toolchain with Turbo scripts for lint, typecheck, test, and build, plus shared dev servers for each package. 【F:package.json†L1-L28】
- Adopted a unified flat ESLint 9 configuration that wires browser, Node, and Vitest globals and applies package-specific overrides across the workspace. 【F:eslint.config.mjs†L4-L109】
- Added a GitHub Actions workflow that caches pnpm/Turbo assets and runs lint, typecheck, and test gates on pushes and pull requests. 【F:.github/workflows/ci.yml†L1-L57】
- Introduced Vitest configurations for the web and mobile packages to standardize test discovery and environments. 【F:apps/web/vitest.config.ts†L1-L11】【F:apps/mobile/vitest.config.ts†L1-L10】
- Augmented Prisma client typings for the web app to expose enum helpers and decimal coercion the UI relies on. 【F:apps/web/types/prisma.d.ts†L1-L83】
- Captured the latest Turbo, lint, typecheck, and test findings in an audit report to guide the next remediation steps. 【F:reports/quality-gates-2025-02-19.md†L1-L25】
- Authored Slice 0’s Prisma schema, initial migration, and seed data covering users, roles, audit logs, and feature flags. 【F:apps/api/prisma/schema.prisma†L1-L140】【F:apps/api/prisma/migrations/20250220000000_slice0_init/migration.sql†L1-L108】【F:apps/api/prisma/seed.ts†L1-L52】
- Hardened the NestJS API bootstrap with environment validation, a global Prisma module, and a database-backed health check. 【F:apps/api/src/app.module.ts†L1-L19】【F:apps/api/src/config/env.validation.ts†L1-L70】【F:apps/api/src/prisma/prisma.module.ts†L1-L9】【F:apps/api/src/app.service.ts†L1-L22】
- Rebuilt the install toolkit with an environment template plus resilient bootstrap and seeding scripts for Unix and Windows contributors. 【F:install/.env.example†L1-L11】【F:install/scripts/bootstrap.sh†L1-L27】【F:install/scripts/bootstrap.ps1†L1-L33】【F:install/scripts/seed.sh†L1-L5】【F:install/scripts/seed.ps1†L1-L6】
- Restored Terraform Slice 0 scaffolding across network, database, cache, storage, observability, and app modules with a staging environment wiring. 【F:infra/terraform/modules/network/main.tf†L1-L56】【F:infra/terraform/modules/database/main.tf†L1-L32】【F:infra/terraform/modules/cache/main.tf†L1-L28】【F:infra/terraform/modules/storage/main.tf†L1-L24】【F:infra/terraform/modules/observability/main.tf†L1-L10】【F:infra/terraform/modules/app/main.tf†L1-L49】【F:infra/terraform/environments/staging/main.tf†L1-L39】

## Outstanding Work
- Slice-level foundational gaps remain from the original desktop audit: Slice 0 lacks complete schema migrations, infra scaffolding, and hardened tooling; Slices 1–13 require their respective domain implementations. 【F:where-we-are.txt†L39-L109】
- The physical unlock experience still needs database migrations, aligned code formats, real barcode scanning, and end-to-end redemption plumbing before it can be considered production-ready. 【F:where-we-are.txt†L93-L108】
- Connect the new infrastructure modules to CI/CD workflows and document runbooks before enabling resource creation. 【F:infra/terraform/README.md†L1-L9】
- Continue the Slice 0 remediation by layering API endpoints, domain models, and storage integrations on top of the restored database foundation. 【F:where-we-are.txt†L55-L76】

## Next Actions
1. Wire Prisma migration and seed tasks into the CI pipelines so the baseline schema ships automatically with each build. 【F:apps/api/package.json†L1-L35】【F:.github/workflows/ci.yml†L1-L57】
2. Finalise Docker Compose documentation by adding Prisma workflow notes and ready-state checks for the restored services. 【F:docker-compose.yml†L1-L43】【F:install/docker/README.md†L1-L8】
3. Continue Slice 0 by implementing auth/account APIs, event logging, and telemetry on top of the new database primitives. 【F:where-we-are.txt†L55-L76】
4. Schedule the “Unlock issues” remediation track to deliver real barcode decoding, redemption persistence, and automated coverage alongside the slice roadmap. 【F:where-we-are.txt†L93-L108】

# Project Status — 2025-02-20

## Completed Additions & Changes
- Established a pnpm-driven monorepo toolchain with Turbo scripts for lint, typecheck, test, and build, plus shared dev servers for each package. 【F:package.json†L1-L28】
- Adopted a unified flat ESLint 9 configuration that wires browser, Node, and Vitest globals and applies package-specific overrides across the workspace. 【F:eslint.config.mjs†L4-L109】
- Added a GitHub Actions workflow that caches pnpm/Turbo assets and runs lint, typecheck, and test gates on pushes and pull requests. 【F:.github/workflows/ci.yml†L1-L57】
- Introduced Vitest configurations for the web and mobile packages to standardize test discovery and environments. 【F:apps/web/vitest.config.ts†L1-L11】【F:apps/mobile/vitest.config.ts†L1-L10】
- Augmented Prisma client typings for the web app to expose enum helpers and decimal coercion the UI relies on. 【F:apps/web/types/prisma.d.ts†L1-L83】
- Captured the latest Turbo, lint, typecheck, and test findings in an audit report to guide the next remediation steps. 【F:reports/quality-gates-2025-02-19.md†L1-L25】

## Outstanding Work
- Type checking still fails because the web workspace references `vitest/globals` and `vitest/importMeta` without providing the corresponding type definitions. 【460b63†L1-L28】【1a11b0†L1-L18】
- Workspace tests abort immediately in the web package because the Vitest CLI binary is unresolved when `pnpm test` fans out. 【460b63†L18-L28】
- Slice-level foundational gaps remain from the original desktop audit: Slice 0 lacks complete schema migrations, infra scaffolding, and hardened tooling; Slices 1–13 require their respective domain implementations. 【F:where-we-are.txt†L39-L109】
- The physical unlock experience still needs database migrations, aligned code formats, real barcode scanning, and end-to-end redemption plumbing before it can be considered production-ready. 【F:where-we-are.txt†L93-L108】

## Next Actions
1. Restore the web package’s type environment by installing or referencing the correct Vitest type definitions so `tsc --noEmit` succeeds. 【1a11b0†L1-L18】
2. Ensure the Vitest binary is available to `@shellff/web`—either by hoisting the dependency or updating the package scripts—so `pnpm test` can run across all workspaces. 【460b63†L18-L28】
3. Resume the Slice 0 remediation plan: author missing Prisma migrations, reinstate infra scaffolding (Docker, Terraform, install scripts), and unblock remaining slices per the prior desktop roadmap. 【F:where-we-are.txt†L55-L76】【F:where-we-are.txt†L93-L108】
4. Schedule the “Unlock issues” remediation track to deliver real barcode decoding, redemption persistence, and automated coverage alongside the slice roadmap. 【F:where-we-are.txt†L93-L108】
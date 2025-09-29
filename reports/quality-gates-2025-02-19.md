# Quality Gate Audit - 2025-02-19

## Commands Executed
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

## Observations
### Lint
- Turborepo rejected `turbo.json` because the legacy `pipeline` key is no longer supported in Turbo 2.x. Updated the configuration to the new `tasks` format so the pipeline can run.
- After the Turborepo fix, the lint pipeline failed in `apps/api` because `package.json` carried a BOM that pnpm could not parse. Re-writing the manifest without the BOM allowed pnpm to start ESLint.
- ESLint 9.24.0 then failed because the repository does not provide an `eslint.config.*` file. The lint task now halts with: `ESLint couldn't find an eslint.config.(js|mjs|cjs) file.`

### Typecheck
- The mobile workspace (`apps/mobile`) fails type-checking due to missing global test types. `tsc --noEmit` reports that `test` and `expect` are undefined in `src/App.test.tsx`. Installing the appropriate `@types/*` package or updating tsconfig to include Vitest globals should resolve this.

### Tests
- All package test scripts invoke `vitest`, but the binary is unavailable in the workspace path. `pnpm run test` fails with `sh: 1: vitest: not found`, indicating Vitest is not installed or not exposed via the package scripts.

## Next Steps
1. Add a shared `eslint.config.js` (or package-level configs) compatible with ESLint 9+ and ensure each workspace points to it.
2. Configure test typings for the React Native mobile package, e.g., by installing `@types/jest` or enabling Vitest's type definitions in `tsconfig`.
3. Ensure Vitest is installed and runnable in every package (e.g., add it to root `devDependencies` or each package and expose via `pnpm vitest`).

With those fixes in place, re-run `pnpm lint`, `pnpm typecheck`, and `pnpm test` to confirm the pipeline is green.
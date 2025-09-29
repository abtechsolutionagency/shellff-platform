# Shellff API (Slice 0)

The Slice 0 backend exposes a small set of authenticated-user lifecycle endpoints alongside
the foundational telemetry and feature flag tooling needed by later slices.

## Routes

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/auth/signup` | Register a listener account and assign the listener role. |
| `POST` | `/api/auth/login` | Validate credentials and return the caller profile and roles. |
| `POST` | `/api/roles/grant` | Grant a role (listener, creator, admin, moderator) to a user. |
| `POST` | `/api/roles/upgrade/creator` | Issue a creator code and upgrade the user’s primary role. |
| `GET` | `/api/feature-flags/:key/evaluate` | Evaluate a flag for a user/environment, resolving overrides. |
| `PATCH` | `/api/feature-flags/:key` | Update a feature flag’s description, rollout type, or enabled state. |
| `POST` | `/api/feature-flags/:key/overrides` | Upsert a flag override for a user or environment. |
| `GET` | `/api/audit/logs` | Retrieve the most recent audit log entries (default limit 20). |
| `GET` | `/api/health` | Lightweight health probe used by orchestrators. |
| `GET` | `/api/telemetry/health` | Health probe scoped under the telemetry namespace. |
| `GET` | `/api/telemetry/metrics` | Process metrics: uptime, load averages, and memory usage. |

## Seed data

Run `pnpm --filter @shellff/api db:seed` to provision baseline users, roles, and feature flags:

- Listener, Creator, Admin, and Moderator roles.
- Feature flags for signup, creator onboarding, and the PWA offline shell.
- Example accounts (`listener@example.com`, `creator@example.com`, `admin@example.com`).
  - Passwords follow the pattern `<role>Pass123!`.
  - Creator and admin profiles are linked to their roles and have audit trails emitted via the API services.
- Local overrides enable `creators.onboarding` by default for development.

The seed script shares the same password hashing helper used by the NestJS auth service so
locally seeded users can immediately authenticate through `/api/auth/login`.

# Mandatory workflow: Binary asset handling

The `make_pr` tool cannot accept binary payloads, so every slice must keep the repository text-only while still providing deterministic media fixtures locally. Follow this workflow without exception:

- **Check in source-of-truth generators, not binaries.** For each required asset (e.g., MP3/WAV/FLAC, svg, png, jpg samples, cover art, QR exports or any other binaries not listed) add a small script or fixture module that emits the file from base64/PCM literals during `pnpm prepare` or a dedicated `pnpm generate:fixtures` step. Keep the generated outputs in a git-ignored `fixtures/` folder so `make_pr` never sees binary blobs.
- **Wire generators into tests and build tooling.** Update the relevant Vitest/Playwright setup (and any PWA cache seeding hooks) to call the generator before suites run, ensuring offline/install/update tests still exercise the real payloads they expect.

# AGENTS.md

- **Document the workflow.** Add developer-doc notes that contributors must run the generator (or rely on an automated pre-test hook) after checkout, so everyone has the binaries locally even though they’re absent from commits.

## Workflow rules
- Build by vertical slices in order. Start at Slice 0.
- Progress through slices continuously without pausing between them until the full plan is delivered.
- Maintain a single pnpm-powered monorepo from Slice 0 that includes packages for the web PWA, NestJS backend, and React Native shells.
- Each slice delivers the web/PWA and backend UX, APIs, data, tests, and ops. The React Native shells stay scaffolded until their dedicated implementation in **Slices 12–13**.
- After completing a slice, immediately run lint and tests, resolve every failure, print the checkpoint log, and continue straight to the next slice without waiting for additional approval.
- Confirm CI is green before declaring the slice finished; rerun and repair any failing checks so each slice ships only after tests prove it production-ready.
- Push notifications land in **Slice 10**. Do not start them earlier even if other docs suggest otherwise.
- Offline downloads are part of the MVP: scaffold the offline shell in Slice 0 and deliver the full download experience with the playback slice per the vertical plan.
- Treat the `.tsx` components bundled in `shellff-ui-ux.zip` as canonical starting points: import them into the monorepo, refactor them into production-ready shared components with full accessibility, strict TypeScript, and automated tests, and build any referenced screens or flows even if you must create missing ones to maintain design fidelity.

## Overview
- DeepAgent builds Shellff in vertical slices (Slice 0–13).
- Web/PWA UX, backend APIs, DB migrations, tests, and ops ship in every slice. React Native implementation is deferred to **Slices 12–13**, though the packages live in the monorepo from the start for consistency.
- Figma Make screens (in `shellff-ui-ux.zip`) must guide UI/UX.
- Analytics events tracked from Slice 0.
  
### Rules for Execution
1. After finishing each slice (Slice N):
- **Run all tests** (`pnpm test` or equivalent).
- **Debug and fix all errors** until the tests pass.
- **Verify continuous integration pipelines are green** before considering the slice complete.

## UI and UX integration
- DeepAgent must use the Figma Make–generated screens and components stored in `shellff-ui-ux.zip` at repo root.
- Extract and normalize into:
  - Components → `src/components/`
  - Pages → `src/pages/`
- Follow Shellff palette, typography, spacing. Extend the system for missing screens. Do not duplicate components.

## Signup and account switching
- Registration shows Listener. Creator. Listener and Creator.
- If Listener and Creator. After login show a choice screen. Listener Dashboard or Creator Dashboard. Add a switch in both dashboards.
- If only one role at signup. Show Become a Creator or Become a Listener in the menu.
- Switching shows a rolling logo screen. Must complete within 5 seconds.

## Roles Model
 - Use join table (users_roles).
 - users table holds base identity.
 - roles table lists roles (listener, creator, admin, moderator).
 - users_roles maps them, allowing multi-role accounts (Listener & Creator).
This supports switching dashboards and Creator upgrades.

## Creator ID
- When a Listener becomes a Creator. Generate a unique Creator ID.
- Store in creators table with link to user_id.
- Use Creator ID in uploads, wallet, analytics, public profiles.
- Do not create duplicates for dual role users.

## Database notes
- users.role enum. listener. creator. admin. moderator. sponsor. label. Default listener.
- creators table. id. user_id. creator_id unique. created_at.
- Add audit logs and feature flags from Slice 0.

## Testing instructions
- Unit. Integration. E2E where needed.
- PWA tests. Install. Offline. Update flow.
- Role switching tests. Creator ID issuance tests.
- Automated checks should cover linting, typechecking, testing, and build steps.
  
### Responsiveness
- Test at desktop. tablet. mobile breakpoints.
- Snapshot key pages. Verify nav and player across sizes.
- QA Agent validates responsiveness.
- Desktop, tablet, and mobile layouts must align with Shellff palette and typography.
- DeepAgent must test components with viewport mocks.

## Infrastructure
- Node LTS and pnpm.
- ESLint v9. TypeScript strict.
- Automated pipelines should cover install, lint, typecheck, test, build, and package steps.
- Keep first load bundle under budget from Slice 0.
- Ops Agent provisions local and cloud infra.
- Docker Compose baseline for local dev (Postgres, Redis, MinIO).
- Terraform AWS for prod.
- Monitoring with Sentry, structured logs, and metrics.
- Keep deployment automation aligned with each slice's deliverables.

## Environment reliability
- Validate env vars at boot. Fail with clear errors.
- Cache feature flags.
- Test offline and push in staging.
- Keep the pnpm lockfile up to date.
- Every slice must be reproducible locally.
- Maintain a consistent pnpm lockfile across environments.
- ESLint v9 strict config enforced.
- DeepAgent must ensure no missing deps or duplicate packages.
- QA validates repeatable install and run flows.

## Compliance Agent
- Leads Slice 11 (Moderation & Compliance).
- Validates audit trails, takedown workflows, and copyright handling.
- Ensures GDPR/NDPR data flows align.

## Agents and slice cross references
- Ops Agent. Slice 0 infra. Slice 10 deployment. Slice 11 security. 
- QA Agent. Slice 0 to 13. Runs unit. feature. E2E. PWA and role switching checks. 
- Analytics Agent. Slice 0 events start. Slice 9 dashboards. Validates schemas each slice.
- Compliance Agent. Slice 1 to 2 auth and onboarding. Slice 6 payments. Slice 11 compliance and audit.

## Ops Agent
- Manages deployment automation, monitoring, and scaling.
- Validates deploy hooks, rollback scripts, and infra reliability.

## Analytics Agent
- Validates analytics events schema from Slice 0.
- Provides feedback loops on aggregates, cohorts, and retention.
- Ensures metrics dashboards stay in sync.

## QA Agent
- Ensures correctness across slices.
- Validates PWA flows, push, offline, install prompts.
- Ensures mobile parity on iOS and Android.
- Runs regression and release validation suites.

## Role activation timeline
- listener. Slice 1.
- creator. Slice 7. Upgrade path active in Slice 2.
- admin. Slice 8 then extended in Slice 11 and Slice 10 ops views.
- moderator. Slice 11.
- sponsor and label. Future ready only.

## Dev Environment Tips
- Run `pnpm install` at the repository root after updating dependencies.
- Use `pnpm turbo run test --filter <pkg>` for scoped tests.
- Use `pnpm lint --filter <pkg>` to ensure ESLint/TS pass.
- From slice folders, `pnpm dev` starts local server.
- Always re-run the full test suite locally before sharing updates.

## Test Requirements
- Every slice must include tests for:
  - UX flows.
  - APIs.
  - DB migrations and rollbacks.
- At least one `.test.ts` per feature.
- Missing tests are considered blockers for a slice release.

## Testing Instructions
- DeepAgent must generate tests per slice.
- Tests must include:
  - Unit, integration, and end-to-end.
  - PWA install, offline fallback, update flow.
  - Mobile parity checks (iOS/Android).
- Run with `pnpm test`.
- Automate `pnpm lint` and `pnpm test` with every validation run.
- No slice is complete until all tests pass.


**2. install/ folder**
- Appears in **Slice 0**.
- Contents: setup scripts, `.env.example` templates (Postgres, Redis, MinIO/S3, Solana RPC keys, Mail provider, Feature-flag secrets), seed instructions, Docker helper scripts, installation docs.
- Mirrors Laravel-style onboarding.

**3. Push notifications & offline track downloads**
- **Push notifications** → Slice 10 (Notifications & realtime). Do not start sooner.
- **Offline downloads** → part of the MVP. Slice 0 delivers the offline fallback shell, and Slice 4 ships the full download/playback experience.
- Slice 0 ensures **PWA shell/install/update flow** and sets the groundwork for downloads without implementing the full manager yet.

**4. Web vs Mobile support**
- Web (React) scaffolded **Slice 0**.
- Mobile (React Native/Expo) packages are scaffolded in the monorepo from **Slice 0**, but native feature implementation lands in **Slices 12–13**.
- README’s “from start” = design alignment and package presence; native app development occurs in its dedicated late slices.

**5. Performance budget**
- Slice 0 must keep **first-load bundle ≤ 200KB gzipped** for core shell. 
- Target TTI ≤ 3s on 3G Fast network.

---

## Domain & Data

**6. Roles schema**
- Use **join table pattern** (users ↔ roles) instead of enum. 
- Allows multi-role users (Listener + Creator + Admin).

**7. Shellff Creator ID**
- Format: `SCIxxxxxxxx` (prefix `SCI`, 8-digit zero-padded integer). Example: `SCI00001234`. 
- Uppercase only, alphanumeric restricted. 
- If user chooses Creator at signup → assign SCIxxxxxxxx immediately.
- If user upgrades later (from Listener) → assign SCIxxxxxxxx right after completing Creator form.
- Must be unique and indexed.

**8. feature_flags & audit_logs schema**
- **feature_flags**: `id, key, value(boolean/json), created_at, updated_at`.
- **audit_logs**: `id, user_id, action, entity, entity_id, metadata(json), created_at`.
- Events from Slice 0: log auth attempts, role changes, feature toggle flips, wallet credits/debits.

**9. Analytics events**
- Emit from Slice 0: `auth.login`, `auth.logout`, `stream.start`, `stream.end`, `wallet.topup`, `wallet.withdraw`, `catalog.search`.
- Payload: JSON (user_id, timestamp, context). 
- Destination: Local log + placeholder adapter (later routed to chosen analytics provider).

**10. Wallet system (Purchases vs S2E)**
- Model: two wallets per user. 
- **Purchases Wallet** (fiat/crypto/vouchers). 
- **S2E Wallet** (SHC). 
- Naming: UI shows `My Shellff` → sub-tabs `Purchases` and `Earnings`. 
- Conversion: none; separate. 
- Top-ups → Purchases Wallet only. 
- Withdrawals → S2E Wallet only. 
- Vouchers → load into Purchases Wallet.

**11. Publishing fees**
- Display default = **10 SHC for singles**, **50 SHC for albums**. 
- Always fetch **admin override** from API. 
- Fiat equivalents shown using daily rate (admin-configured).

**12. Barcode/voucher formats**
- Barcode = **QR code** (primary), **Code-128** fallback. 
- Library: `zxing` or `react-qr-reader`. 
- Offline redemption: cache until reconnection, then validate server-side.

**13. Rolling logo animation**
- 5s max. 
- Uses Shellff neon purple + teal gradient roll, tagline: *“Powered by Shellff Creator ID”*. 
- Dual-role users: animation → then role-choice screen.

---

## UI/UX Normalization

**14. Canonical components**
- Consolidate into `src/components/` and `src/pages/`. 
- Deduplicate; shared UI tokens in `/src/ui/tokens`.
- Treat exported Vite projects in shellff-ui-ux.zip as real inputs, not just references.
- Must align to Shellff tokens, brand palette, and PWA structure.
- No duplicates.

**15. Colors**
- Remap all to brand tokens from README.md:  
  - Primary: `#9B5DE5`  
  - Secondary: `#00F5D4`  
  - Dark BG: `#121212`  
  - Light BG: `#FFFFFF`  
  - Neutral Gray: `#B3B3B3`

**16. Buttons**
- Primary: Neon purple background → Teal hover. 
- Secondary: Teal outline → Neon purple hover. 
- Disabled: Neutral gray, 40% opacity, no hover.

**17. Typography**
- Fonts: **Poppins + Inter**. 
- Bundle locally in `/public/fonts`, no runtime Google Fonts fetch.

**18. Animations**
- Standardize on **Framer Motion**. 
- CSS transitions allowed for trivial fades.

**19. Images**
- Replace Unsplash placeholders. 
- Local fallback in `/public/images/fallback.png`. 
- Use ImageWithFallback → defaults to Shellff logo gradient.

---

## Infrastructure & Testing

**20. Env variables Slice 0**
- `DATABASE_URL`  
- `REDIS_URL`  
- `FEATURE_FLAGS_SECRET`  
- `MAIL_PROVIDER_KEY`  
- `SOLANA_RPC_URL_PRIMARY`  
- `SOLANA_RPC_URL_FALLBACK`  
- `SHELLFF_ADMIN_WALLET`  

**21. Docker Compose Slice 0**
- Postgres 15-alpine  
- Redis 7-alpine  
- MinIO latest (S3 API)  
- Versions pinned in `docker-compose.yml`.

**22. Terraform IaC**
- Terraform skeleton delivered **Slice 0** (VPC, RDS, Redis, S3 buckets, ECS placeholders). 
- Not deferred to Slice 11.

**23. Testing stack**
- Use **Playwright** for E2E PWA flows. 
- **Cypress** for auth + wallet. 
- **Lighthouse** for PWA install/offline checks. 

**24. Monitoring/alerting**
- Sentry integrated **Slice 0** for FE+BE errors. 
- Structured logs via Winston. 
- Metrics placeholder: Prometheus-exporter containers in Compose. 
- Full alerting pipeline matured by Slice 10.


## Summary
- DeepAgent builds and commits per vertical slice.
- Ops deploys and enforces infra rules.
- Analytics validates events.
- QA ensures tests and responsiveness.
- Compliance enforces moderation and legal.
- Single domain. No subdomains.
- One PWA and service worker for all roles.

## Vertical Slices Roadmap

DeepAgent must follow this roadmap to ship Shellff feature by feature.
- Ship behind feature flags.
- Write migrations with rollbacks.
- Automate tests and ensure they remain reliable.
- Track analytics events from day one.
- Keep flows simple and testable.

---

 Slice 0. Foundation & PWA baseline
- Project setup, automated pipelines, linting, tests, Docker/Terraform baseline.
- **UX:** App shell, install prompt, offline fallback, update flow.
- **API:** health, version, status.
- **Data:** migrations scaffold, `feature_flags`, `audit_logs`.
- **Tests:** PWA install, offline page, service-worker lifecycle, health endpoint.
- **Done:** App installs, offline shell works, automated checks green. 

 Slice 1. Auth & sessions
- Email/OTP login, SCI ID assignment, Forgot Password.
- **UX:** Sign up, login, forgot password, email verify.
- **API:** `register`, `login`, `refresh`, `logout`.
- **Data:** `users`, `sessions`, `password_resets`.
- **Tests:** Unit for auth, feature for flows, rate limits, token rotation.
- **Done:** Tokens rotate, brute-force protected.
  
 Slice 2. Profiles & settings
- Album/single browsing, previews, search.
- **UX:** Profile view/edit, change password, session manager.
- **API:** Profile read/update, avatar upload, password change.
- **Data:** `user_profiles`, `media`, `user_settings`.
- **Tests:** Profile update, image upload, security flows.
- **Done:** Profile updates persist, security verified.
  
 Slice 3. Catalog & search
- My Shellff (Purchases library), barcode/voucher redemption.
- **UX:** Home feed, category pages, search with filters.
- **API:** Tracks list, albums list, search suggest, search results.
- **Data:** `tracks`, `albums`, `artists`, `tags`, `media_assets`.
- **Tests:** Indexing, pagination, relevancy checks.
- **Done:** Users discover content fast. 

 Slice 4. Playback & queue
- **UX:** Mini player, full player, queue manager, repeat, shuffle.
- **API:** Stream token, now playing, queue endpoints.
- **Data:** `play_sessions`, `device_sessions`, `playback_events`.
- **Tests:** Stream start/stop, seek, next/prev, background audio on PWA.
- **Done:** Smooth playback on web and PWA. 

 Slice 5. Library
- **UX:** Likes, playlists, recent, history.
- **API:** Like/unlike, playlist CRUD, history endpoints.
- **Data:** `likes`, `playlists`, `playlist_tracks`, `listening_history`.
- **Tests:** Idempotent likes, playlist ordering, history accuracy.
- **Done:** Personal library feels instant. 

 Slice 6. Wallet & payments
- Purchases Wallet (fiat/crypto/vouchers), SHC Wallet separation.
- Gateways: Paystack, OPay, Stripe, MyFatoorah + crypto. 
  - Admin discounts per method.
- **UX:** Wallet overview, add funds, transaction list.
- **API:** Deposit intents, callback handlers, balance.
- **Data:** `wallets`, `transactions`, `payment_providers`, `webhooks`.
- **Tests:** Double-spend guards, reconciliation, retries.
- **Done:** Funds reflect quickly and safely. 

 Slice 7. Creator upload & Royalty Engine
- Upload singles/albums, fees (refundable), per-track artwork, contributor splits.
- Royalty Engine** - Splits enforcement, SCI tracking, admin royalty cut.
- Stream-to-Earn (S2E)** - OFF by default, toggle ON in admin. Qualified stream rules. Emission per-stream & daily cap.
- **UX:** Upload wizard, cover art, metadata, track order.
- **API:** Upload init, file ingest, metadata save, publish.
- **Data:** `uploads`, `media_ingest`, `releases`, `release_tracks`.
- **Tests:** Large file upload, checksum, resumable uploads.
- **Done:** Creators publish without friction. 

 Slice 8. Admin console
- Full toggles ON/OFF, manual credit/debit, feature flags, hot wallets.
- **UX:** Feature flags, roles, content moderation, reports.
- **API:** Toggles, role grants, audit-log export.
- **Data:** `admins`, `roles`, `permissions`, `audit_logs`.
- **Tests:** Permission guards, toggle cache, audit trails.
- **Done:** Safe operations with traceability. 

 Slice 9. Analytics
- **UX:** Metrics dashboard, trends, cohort views.
- **API:** Event ingest, aggregates, export.
- **Data:** `analytics_events`, aggregates, cohorts.
- **Tests:** Event schema, sampling, retention.
- **Done:** Decisions backed by data. 

 Slice 10. Notifications & realtime
- In-app + email. Admin broadcast by role.
- **UX:** Push notifications, in-app alerts, realtime indicators (PWA and native).
- **API:** Notifications API, websocket channels, push endpoints.
- **Data:** `notifications`, `subscriptions`, `device_tokens`.
- **Tests:** Delivery reliability, sync, push permissions.
- **Done:** Reliable realtime and push. 

 Slice 11. DevOps + Moderation and Compliance

 Scope
Unify delivery, monitoring, and recovery. Ship moderation and compliance tools on the same slice. 

- KYC vendor integration, 2-device limit, captcha, logs, GDPR/NDPR.

 UX
- Deploy dashboard. Build status. Release notes.
- Incident panel. Rollback button. Health widgets.
- Moderation queue. Report details. Actions: approve, remove, restrict.
- Policy center. Privacy controls. Export data. Takedown workflow.

 APIs
- Deployment hooks: start, complete, rollback.
- Monitoring endpoints: health, readiness, metrics, error feed.
- Moderation endpoints: submit report, list queue, act, appeal, export.
- Compliance endpoints: audit export, data access, data delete.
- Rate limit config endpoints. Feature flag toggles.

 Data
- deployments. release_artifacts. error_logs. metrics. incidents.
- reports. moderation_actions. policy_logs. compliance_logs.
- gdpr_requests. ndpr_requests. takedown_requests.
- Add indexes for queue lookups and date filters.

 Infrastructure
- Automated pipelines per slice. Jobs: install, lint, typecheck, test, build. 
- Health probes on API and worker. Error alerting.
- Optional IaC folder for future Terraform. Keep outputs out of repo.
  Security
- Enforce HTTPS and HSTS. Secure headers. CORS allow list.
- JWT rotation. Refresh token TTL.
- Abuse controls: rate limits. IP throttling.  
- PII handling. Mask in logs. Signed exports only.

 Tests
- Automated pipeline runs on mainline and feature branches. Lint. Type. Unit. Integration. Build. Package.
- Rollback drill on staging. Simulate failed deploy. Verify recovery.
- Uptime monitors. Error budget checks.
- Moderation tests: submit. triage. act. appeal. export.
- Compliance tests: audit trails. retention. access and delete requests.


 Done
- Automated checks green. Deploy dashboard live. Health and metrics visible.
- Rollback works on staging. Alerts route to on-call.
- Moderation queue operational with audit logs.
- Compliance flows pass tests. Exports are signed and traceable.


 Slice 12. Mobile iOS app
- React Native baseline for iOS. Wallets, catalog, playback, barcode scan.
- **UX:** Native iOS parity for key flows.
- **API:** Mobile auth, notifications, sync.
- **Data:** Device tokens, session sync.
- **Tests:** Push delivery, offline parity.
- **Done:** iOS app ready. 

 Slice 13. Mobile Android app
- React Native baseline for Android. Wallets, catalog, playback, barcode scan.
- **UX:** Native Android parity for key flows.
- **API:** Mobile auth, notifications, sync.
- **Data:** Device tokens, session sync.
- **Tests:** Push delivery, offline parity.
- **Done:** Android app ready.

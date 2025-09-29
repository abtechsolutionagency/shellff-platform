# Shellff Vertical Slices (Slice 0–13)

## Principles
- Ship behind feature flags.
- Write migrations with rollbacks.
- Automate tests and keep them reliable.
- Track analytics events from day one.
- Keep flows simple and testable.
- Maintain a pnpm monorepo from Slice 0 that houses the web PWA, NestJS backend, and scaffolded React Native shells.
- Move through the slices sequentially without pausing between them until the full plan is complete.
- Scaffold offline downloads from Slice 0 and deliver the full download experience with the playback slice.
- Push notifications wait until Slice 10 even if other docs say otherwise.
- React Native feature implementation starts in Slices 12–13 even though the shells live in the monorepo earlier.
- After each slice, run lint and automated tests, resolve every failure, log the checkpoint, and continue immediately to the next slice.
- Import the `.tsx` components from `shellff-ui-ux.zip` into the monorepo as canonical starting points, refactor them into production-ready shared components with accessibility, strict TypeScript, and automated tests, and complete any referenced screens or flows even if the bundle omits code for them.


---

## Slice 0. Foundation & PWA baseline
- Project setup, automated pipelines, linting, tests, Docker/Terraform baseline.
- **UX:** App shell, install prompt, offline fallback, update flow, groundwork for offline downloads.
- **API:** health, version, status.
- **Data:** migrations scaffold, `feature_flags`, `audit_logs`.
- **Tests:** PWA install, offline page, service-worker lifecycle, health endpoint.
- **Done:** App installs, offline shell works, automated checks green.

## Slice 1. Auth & sessions
- Email/OTP login, SCI ID assignment, Forgot Password.
- **UX:** Sign up, login, forgot password, email verify.
- **API:** `register`, `login`, `refresh`, `logout`.
- **Data:** `users`, `sessions`, `password_resets`.
- **Tests:** Unit for auth, feature for flows, rate limits, token rotation.
- **Done:** Tokens rotate, brute-force protected. 

## Slice 2. Profiles & settings
- Album/single browsing, previews, search.
- **UX:** Profile view/edit, change password, session manager.
- **API:** Profile read/update, avatar upload, password change.
- **Data:** `user_profiles`, `media`, `user_settings`.
- **Tests:** Profile update, image upload, security flows.
- **Done:** Profile updates persist, security verified. 

## Slice 3. Catalog & search
- My Shellff (Purchases library), barcode/voucher redemption.
- **UX:** Home feed, category pages, search with filters.
- **API:** Tracks list, albums list, search suggest, search results.
- **Data:** `tracks`, `albums`, `artists`, `tags`, `media_assets`.
- **Tests:** Indexing, pagination, relevancy checks.
- **Done:** Users discover content fast. 

## Slice 4. Playback & queue
- **UX:** Mini player, full player, queue manager, repeat, shuffle, offline download manager and playback for cached tracks.
- **API:** Stream token, now playing, queue endpoints, offline download controls.
- **Data:** `play_sessions`, `device_sessions`, `playback_events`, download manifests.
- **Tests:** Stream start/stop, seek, next/prev, offline playback, background audio on PWA.
- **Done:** Smooth playback on web and PWA, including offline downloads for the MVP.

## Slice 5. Library
- **UX:** Likes, playlists, recent, history.
- **API:** Like/unlike, playlist CRUD, history endpoints.
- **Data:** `likes`, `playlists`, `playlist_tracks`, `listening_history`.
- **Tests:** Idempotent likes, playlist ordering, history accuracy.
- **Done:** Personal library feels instant. 

## Slice 6. Wallet & payments
- Purchases Wallet (fiat/crypto/vouchers), SHC Wallet separation.
- Gateways: Paystack, OPay, Stripe, MyFatoorah + crypto. 
  - Admin discounts per method.
- **UX:** Wallet overview, add funds, transaction list.
- **API:** Deposit intents, callback handlers, balance.
- **Data:** `wallets`, `transactions`, `payment_providers`, `webhooks`.
- **Tests:** Double-spend guards, reconciliation, retries.
- **Done:** Funds reflect quickly and safely.

## Slice 7. Creator upload & Royalty Engine
- Upload singles/albums, fees (refundable), per-track artwork, contributor splits.
- Royalty Engine** - Splits enforcement, SCI tracking, admin royalty cut.
- Stream-to-Earn (S2E)** - OFF by default, toggle ON in admin. Qualified stream rules. Emission per-stream & daily cap.
- **UX:** Upload wizard, cover art, metadata, track order.
- **API:** Upload init, file ingest, metadata save, publish.
- **Data:** `uploads`, `media_ingest`, `releases`, `release_tracks`.
- **Tests:** Large file upload, checksum, resumable uploads.
- **Done:** Creators publish without friction.

## Slice 8. Admin console
- Full toggles ON/OFF, manual credit/debit, feature flags, hot wallets.
- **UX:** Feature flags, roles, content moderation, reports.
- **API:** Toggles, role grants, audit-log export.
- **Data:** `admins`, `roles`, `permissions`, `audit_logs`.
- **Tests:** Permission guards, toggle cache, audit trails.
- **Done:** Safe operations with traceability.

## Slice 9. Analytics
- **UX:** Metrics dashboard, trends, cohort views.
- **API:** Event ingest, aggregates, export.
- **Data:** `analytics_events`, aggregates, cohorts.
- **Tests:** Event schema, sampling, retention.
- **Done:** Decisions backed by data.

## Slice 10. Notifications & realtime
- In-app + email. Admin broadcast by role.
- **UX:** Push notifications, in-app alerts, realtime indicators (PWA and native).
- **API:** Notifications API, websocket channels, push endpoints.
- **Data:** `notifications`, `subscriptions`, `device_tokens`.
- **Tests:** Delivery reliability, sync, push permissions.
- **Done:** Reliable realtime and push.

# Slice 11. DevOps + Moderation and Compliance

## Scope
Unify delivery, monitoring, and recovery. Ship moderation and compliance tools on the same slice. 

- KYC vendor integration, 2-device limit, captcha, logs, GDPR/NDPR.

## UX
- Deploy dashboard. Build status. Release notes.
- Incident panel. Rollback button. Health widgets.
- Moderation queue. Report details. Actions: approve, remove, restrict.
- Policy center. Privacy controls. Export data. Takedown workflow.

## APIs
- Deployment hooks: start, complete, rollback.
- Monitoring endpoints: health, readiness, metrics, error feed.
- Moderation endpoints: submit report, list queue, act, appeal, export.
- Compliance endpoints: audit export, data access, data delete.
- Rate limit config endpoints. Feature flag toggles.

## Data
- deployments. release_artifacts. error_logs. metrics. incidents.
- reports. moderation_actions. policy_logs. compliance_logs.
- gdpr_requests. ndpr_requests. takedown_requests.
- Add indexes for queue lookups and date filters.

## Infrastructure
- Automated pipelines per slice. Jobs: install, lint, typecheck, test.
- Health probes on API and worker. Error alerting.
- Optional IaC folder for future Terraform. Keep outputs out of repo.

## Security
- Enforce HTTPS and HSTS. Secure headers. CORS allow list.
- JWT rotation. Refresh token TTL.
- Abuse controls: rate limits. IP throttling.  
- PII handling. Mask in logs. Signed exports only.

## Tests
- Automated pipeline runs on mainline and feature branches. Lint. Type. Unit. Integration. Build. Package.
- Rollback drill on staging. Simulate failed deploy. Verify recovery.
- Uptime monitors. Error budget checks.
- Moderation tests: submit. triage. act. appeal. export.
- Compliance tests: audit trails. retention. access and delete requests.


## Done
- Automated checks green. Deploy dashboard live. Health and metrics visible.
- Rollback works on staging. Alerts route to on-call.
- Moderation queue operational with audit logs.
- Compliance flows pass tests. Exports are signed and traceable.

## Slice 12. Mobile iOS app
- React Native baseline for iOS. Wallets, catalog, playback, barcode scan.
- **UX:** Native iOS parity for key flows.
- **API:** Mobile auth, notifications, sync.
- **Data:** Device tokens, session sync.
- **Tests:** Push delivery, offline parity.
- **Done:** iOS app ready.

## Slice 13. Mobile Android app
- React Native baseline for Android. Wallets, catalog, playback, barcode scan.
- **UX:** Native Android parity for key flows.
- **API:** Mobile auth, notifications, sync.
- **Data:** Device tokens, session sync.
- **Tests:** Push delivery, offline parity.
- **Done:** Android app ready.
# Slice 1 — Auth & Sessions

## Device and Session Persistence
- Create a new device session via the login flow, then inspect the database to confirm both `devices` and `sessions` rows are created with the expected foreign keys.
- Trigger a refresh-token rotation and verify the previous session is revoked while a new session row references the same device record.
- Execute the logout endpoint and ensure the associated session row is marked revoked and future refresh attempts for that device are rejected.

## OTP and Password Reset Flows
- Request an OTP and confirm an OTP token is stored, delivered to the expected channel, and logged with the correct expiry.
- Submit a valid OTP verification and verify the token is consumed and cannot be reused.
- Initiate a password reset, capture the reset token, and confirm that submitting the confirm endpoint updates the password while invalidating the token.
- Attempt to reuse an OTP or reset token and assert the API responds with the appropriate invalid-token error.

## Centralized Throttling and Monitoring
- Hit the OTP and password reset request endpoints repeatedly to trigger the shared throttler and confirm rate-limit responses are returned.
- Inspect telemetry logs or dashboards to verify throttling events are recorded with device/user identifiers and timestamps.
- Run a short load test across auth endpoints and ensure anomaly alerts are produced for rate-limit breaches.

## Analytics Instrumentation
- Perform login, OTP verification, password reset, refresh, and logout journeys while capturing emitted analytics events.
- Confirm each event payload includes device/session identifiers and user metadata required by the analytics dashboards.
- Validate dashboards or saved queries display the OTP success/failure rates, password reset completions, and active session counts.

## Cross-Channel End-to-End Journeys
- Sign in on the web client, then refresh the session through the API client to ensure tokens remain valid across channels.
- Complete OTP verification from the web UI while observing API logs to confirm the same session is maintained.
- Execute password reset and logout flows from both web and API clients and verify device session continuity and revocation behave consistently.

# Slice 2 — Profiles & Settings

## Password and Role Management
- Exercise the settings password form with a valid current password and a strong replacement to confirm the `/api/profile/password` endpoint persists the hash, the UI surfaces the success alert, and follow-up logins require the new secret.
- Attempt the password change with an invalid current password or mismatched confirmation and ensure the UI shows the failure alert while the API responds with the appropriate 400 error payload.
- Switch from Listener to Creator via the role-switch modal and verify `/api/profile/role-switch` rotates the session cookie, updates the JWT payload, and the dashboard redirect lands on the Creator space without requiring a manual refresh.
- Force an error scenario for role switching (e.g., backend restriction) and confirm the modal surfaces the destructive alert, the toast captures the failure, and the session cookie remains untouched.

# Slice 3 — Catalog & Search

## Ingestion & Index Refresh Orchestration
- Mutate releases and tracks through Prisma (create, update, delete) and confirm the `CatalogIngestionService` middleware schedules a refresh task per affected release with the correct reason metadata.
- Advance the ingestion poller interval and assert that queued refresh tasks dispatch via the pipeline and emit the `catalog.pipeline.refresh.dispatched` analytics event with the batch count.
- Trigger `triggerFullRebuild` and ensure every release schedules a manual regional rebuild covering all requested regions.

## Search Scoring & Ranking
- Execute search queries that vary release popularity, recency, and editorial boosts; confirm the composite scoring reorders results accordingly and that the blended score fields surface in the API payload.
- Adjust input signals (e.g., raise popularity, zero editorial weight) and verify ranking shifts reflect the changes both for releases and tracks.
- Verify the API emits `catalog.search.performed` events that include region, personalization request state, and matched-signal counts.

## Personalization & Listener Profiles
- Run a search with personalization toggled on for a listener following creators and genres present in the results; confirm releases/tracks contain the personalization metadata (reasons, matched genres, boost multiplier) and that `catalog.search.personalized` analytics fire with matched-signal counts.
- Simulate missing listener profile rows and validate the API falls back gracefully, emitting `catalog.search.personalization_unavailable` and returning non-personalized results without errors.
- Confirm audit events capture personalization flags, region, and signal counts for both personalized and non-personalized searches.
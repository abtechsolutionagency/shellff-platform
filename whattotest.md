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
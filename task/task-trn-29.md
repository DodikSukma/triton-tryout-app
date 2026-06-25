# Task TRN-29: Automated Error Tracking & Centralized Logging

## Overview
To maintain "Clean Code" principles and ensure high reliability in production, this task implements automated error tracking. This guarantees that UI crashes, unhandled promises, and backend panics are instantly recorded and alerted to developers, rather than failing silently.

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/app/layout.tsx` or `frontend/sentry.client.config.ts` (Error boundary/SDK initialization)
- `frontend/package.json` (Add monitoring dependency)

### Backend Services
- `services/shared/logger/logger.go` (Centralized structured logging utility)
- Integration with external tracking service (e.g., Sentry, Datadog, or ELK).

## ⚙️ Detailed Specifications

### 1. Frontend Error Boundary & Tracking
- Install an error tracking SDK (like Sentry `@sentry/nextjs`).
- Configure the SDK to capture unhandled exceptions, promise rejections, and React render errors.
- Attach user context (User ID, Role) to the error payload so developers know exactly who experienced the crash.
- Mask sensitive data (like passwords or JWTs) before sending the payload.

### 2. Backend Structured JSON Logging
- Standardize the Go backend logger (using libraries like `logrus` or `zap`).
- Change log output format to JSON for production environments. Include fields like `timestamp`, `service_name`, `level`, `trace_id`, and `message`.
- Ensure all HTTP 500 internal server errors are logged as `ERROR` or `FATAL` level with stack traces.

### 3. Alerting Mechanism (Optional but Recommended)
- Configure the tracking service to send an alert (via Slack, Discord, or Email) when a spike in `500 Internal Server Errors` is detected within a 5-minute window.

## ⚡ Verification Plan
1. **Frontend Crash Test:** Create a temporary button in the frontend that explicitly throws an error (`throw new Error("Test Crash")`). Click it in a production-like environment and verify the error appears in the tracking dashboard.
2. **Backend Panic Test:** Trigger an intentional API panic or force a 500 error. Verify the Go backend outputs a structured JSON log containing the stack trace.
3. **Context Verification:** Check the error tracking dashboard to ensure the correct User ID and Browser Environment (User-Agent) were successfully attached to the error report.

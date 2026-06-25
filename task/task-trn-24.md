# Task TRN-24: Landing Page Separation Architecture

## Overview
This task completely decouples the public-facing marketing website (Landing Page) from the core `frontend` application (Dashboard & Exam Engine). This architectural shift ensures that heavy authentication and state management logic does not bloat the public pages, improving SEO, initial load times, and isolated deployments.

## 📂 Target Files & Impact Areas

### New Directory
- `/landingpage/` (New repository or folder parallel to `frontend/`)

### Frontend Client (`frontend/`)
- Remove all public marketing pages (Home, About, Pricing, etc.).
- Update `next.config.js` or routing logic to handle root redirects to the authentication page (Login/Register).

## ⚙️ Detailed Specifications

### 1. Initialize `landingpage` Project
- Run a scaffold command (e.g., `npx create-next-app@latest landingpage`) in the root directory.
- Configure it as a Static Site Generation (SSG) app for maximum speed and SEO.
- Migrate the UI assets (Hero sections, Features, Pricing tables, Footer) from the current `frontend` to the new `landingpage`.

### 2. Configure Cross-Navigation
- Ensure the "Login" or "Mulai Ujian" buttons on the `landingpage` point to the URL where the `frontend` application is hosted (e.g., `https://app.triton.id/login`).
- Ensure the `frontend` application knows how to redirect unauthenticated users back to the `landingpage` (e.g., `https://triton.id`) if they attempt to access the root path `/` without a session.

### 3. Makefile Integration
- Update the root `Makefile` so that running `make dev` or `make start` boots up both the `frontend` (port 3000) and the `landingpage` (port 3001) concurrently.

## ⚡ Verification Plan
1. **Local Boot:** Run `make dev`. Verify that the `landingpage` is accessible on `localhost:3001` and loads instantly without checking for auth tokens.
2. **Core App:** Verify that `localhost:3000` exclusively serves the login screen and authenticated dashboards.
3. **Redirection Flow:** Click "Login" on the landing page and verify it correctly routes to the `frontend` application.

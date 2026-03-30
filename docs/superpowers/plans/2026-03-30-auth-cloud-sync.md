# Account + Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add login, cloud-backed document state, and real-time sync scaffolding so the product becomes an online single-user workspace with visible sync status and safe offline recovery.

**Architecture:** Keep the existing Next.js app as the client shell, but move document ownership and mutation flow behind a cloud sync service layer. The first implementation should introduce auth/session state, cloud document repositories, sync status UI, and server API endpoints with versioned writes. A durable backing store must be wired behind the service layer before production release; the storage provider can change later without rewriting the client.

**Tech Stack:** Next.js App Router, React, TypeScript, existing Tailwind UI, existing Vitest/Testing Library, route handlers for API surfaces, lightweight in-repo service abstractions, browser local cache for offline buffering

---

## Planned File Map

### Product docs
- Create: `docs/superpowers/specs/2026-03-30-auth-cloud-sync-design.md`
- Create: `docs/superpowers/plans/2026-03-30-auth-cloud-sync.md`
- Modify: `README.md`

### Shared domain and services
- Create: `types/account.ts`
- Create: `types/sync.ts`
- Create: `lib/cloud/session.ts`
- Create: `lib/cloud/documents.ts`
- Create: `lib/cloud/sync.ts`
- Create: `lib/cloud/device.ts`
- Create: `lib/cloud/cache.ts`
- Create: `lib/utils/device-id.ts`
- Create: `lib/cloud/store.ts`

### App surface
- Create: `app/login/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/editor/[docId]/page.tsx`
- Modify: `components/workbench/workbench-shell.tsx`
- Modify: `components/editor/editor-shell.tsx`
- Modify: `components/editor/editor-toolbar.tsx`
- Modify: `components/editor/save-indicator.tsx`

### API surfaces
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/me/route.ts`
- Create: `app/api/documents/route.ts`
- Create: `app/api/documents/[docId]/route.ts`
- Create: `app/api/documents/[docId]/versions/route.ts`
- Create: `app/api/sync/events/route.ts`

### Persistent backend
- Configure: a durable cloud persistence provider for accounts, sessions, documents, versions, and sync events

### Tests
- Create: `tests/unit/cloud/session.test.ts`
- Create: `tests/unit/cloud/documents.test.ts`
- Create: `tests/unit/cloud/sync.test.ts`
- Create: `tests/unit/cloud/cache.test.ts`
- Create: `tests/integration/login-flow.test.tsx`
- Create: `tests/integration/cloud-sync-status.test.tsx`
- Create: `tests/integration/offline-replay.test.tsx`
- Create: `tests/integration/editor-deeplink.test.tsx`
- Create: `tests/integration/cache-hydration.test.tsx`
- Create: `tests/integration/multi-device-sync.test.tsx`

---

## Task 0: Document the new product direction

**Files:**
- Modify: `docs/superpowers/specs/2026-03-30-auth-cloud-sync-design.md`
- Modify: `docs/superpowers/plans/2026-03-30-auth-cloud-sync.md`
- Modify: `README.md`

- [ ] Write the cloud-sync spec and implementation plan.
- [ ] Update the README V1 scope so it no longer claims the product is local-only.
- [ ] Verify the docs are internally consistent.

## Task 1: Define auth and sync domain types

**Files:**
- Create: `types/account.ts`
- Create: `types/sync.ts`
- Test: `tests/unit/cloud/session.test.ts`

- [ ] Write failing tests for account, session, document version, and sync event shapes.
- [ ] Implement the minimal types shared by client and API layers.
- [ ] Add the cloud document shape used by the sync and history APIs.
- [ ] Verify the new types are reusable without importing app code.

## Task 2: Add cloud session and device helpers

**Files:**
- Create: `lib/utils/device-id.ts`
- Create: `lib/cloud/session.ts`
- Create: `lib/cloud/device.ts`
- Test: `tests/unit/cloud/session.test.ts`

- [ ] Write tests for deterministic device-id generation and session helpers.
- [ ] Implement session read/write helpers with browser-safe access.
- [ ] Add the OTP/session contract used by login and logout routes.
- [ ] Keep all browser globals behind client-safe boundaries.

## Task 3: Introduce cloud document repository and versioning

**Files:**
- Create: `lib/cloud/documents.ts`
- Create: `lib/cloud/sync.ts`
- Test: `tests/unit/cloud/documents.test.ts`
- Test: `tests/unit/cloud/sync.test.ts`

- [ ] Write failing tests for document load, save, list, version append, and conflict detection.
- [ ] Implement a small repository layer that wraps cloud API calls.
- [ ] Define the durable persistence adapter boundary for accounts, sessions, documents, versions, and sync events.
- [ ] Add sync event creation and version-based conflict checks.

## Task 4: Add API route handlers for auth and document sync

**Files:**
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/me/route.ts`
- Create: `app/api/documents/route.ts`
- Create: `app/api/documents/[docId]/route.ts`
- Create: `app/api/documents/[docId]/versions/route.ts`
- Create: `app/api/sync/events/route.ts`

- [ ] Write route tests around the expected request/response contract.
- [ ] Implement minimal handlers that return account, document, version, and sync payloads.
- [ ] Make version mismatches return a conflict response shape.
- [ ] Add email one-time-login request and verification handling.
- [ ] Wire the route handlers to the durable persistence adapter once configured.

## Task 5: Add login UI and session bootstrap

**Files:**
- Create: `app/login/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/editor/[docId]/page.tsx`

- [ ] Write failing tests for unauthenticated redirect and login entry rendering.
- [ ] Add a login entry page and session bootstrap on app load.
- [ ] Include a verification step for the one-time login flow.
- [ ] Load a cloud document by `docId` when opening an editor deep link.
- [ ] Route authenticated users into the workspace.

## Task 6: Surface cloud sync status in the workspace and editor

**Files:**
- Modify: `components/workbench/workbench-shell.tsx`
- Modify: `components/editor/editor-shell.tsx`
- Modify: `components/editor/editor-toolbar.tsx`
- Modify: `components/editor/save-indicator.tsx`
- Test: `tests/integration/cloud-sync-status.test.tsx`

- [ ] Write failing tests for `syncing`, `synced`, `offline`, and `conflict` states.
- [ ] Write failing tests for cache hydration and cloud replacement on load.
- [ ] Add visible sync indicators to the workspace and editor.
- [ ] Hydrate the workspace and editor from the last known local cache before remote data finishes loading.
- [ ] Verify the cached state is replaced cleanly by the cloud state once the fetch completes.
- [ ] Add a version history / recovery surface for each document.
- [ ] Add an explicit conflict resolution view when the server rejects a stale write.
- [ ] Keep the UI understandable without opening devtools.

## Task 7: Implement offline replay flow

**Files:**
- Modify: `lib/cloud/sync.ts`
- Modify: `components/editor/editor-shell.tsx`
- Test: `tests/integration/offline-replay.test.tsx`

- [ ] Write a failing test for offline edits being queued and replayed.
- [ ] Implement local buffering for pending changes.
- [ ] Replay pending changes when connectivity returns.
- [ ] Persist failed sync state so the user can see and retry it after refresh.
- [ ] Add a multi-device propagation test that proves a second client sees the committed change after refresh or remote event delivery.

## Task 8: Verify and stabilize

**Files:**
- Modify: `README.md`
- Test: `tests/unit/cloud/**`
- Test: `tests/integration/**`

- [ ] Run unit tests for cloud/session/sync helpers.
- [ ] Run integration tests for login and sync status.
- [ ] Fix any contract mismatches or flaky UI behavior.
- [ ] Verify the build still succeeds.
- [ ] Confirm the persistent backend wiring before production release.

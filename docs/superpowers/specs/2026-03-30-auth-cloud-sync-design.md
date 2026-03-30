# Account + Cloud Sync Design Spec

**Date:** 2026-03-30  
**Status:** Approved for Build  
**Product Type:** Online Markdown Workbench  
**Mode:** Online-first, single-user, real-time cloud sync V1

---

## 1. Overview

The product is evolving from a browser-only workbench into an online Markdown product where login is required and the cloud is the source of truth. Users should be able to sign in, open their document workspace from any device, edit documents, and have changes sync quickly and safely.

V1 is intentionally narrow: single-user accounts, real-time sync across the user's own devices, and a clean fallback path for offline edits.

---

## 2. Product Goals

### Primary Goal

Deliver an online Markdown workspace that makes it fast and safe to:
- sign in with minimal friction
- open the same workspace on multiple devices
- keep documents synchronized in near real time
- recover from temporary offline states without data loss
- preserve a usable history when sync conflicts happen

### Success Criteria

V1 is successful if users can:
1. sign in and see their cloud workspace within seconds
2. edit a document on one device and see the result on another device shortly after
3. refresh or temporarily lose connection without losing meaningful work
4. recover from sync conflicts without silent overwrites
5. trust the cloud workspace as the canonical copy of their documents

---

## 3. Non-Goals

The following are out of scope for V1:
- team workspaces
- shared editing by multiple users in the same document
- public sharing links
- permissions/roles beyond a single owner account
- comment/review workflows
- full audit logging UI
- AI-assisted writing features

---

## 4. Product Positioning

The product is positioned as:

**Online Markdown Workspace + Real-Time Personal Sync**

This means:
- login is required before cloud documents are available
- cloud state is canonical
- the local client acts as a cache and offline buffer
- sync state must always be visible
- conflict handling should prioritize data preservation over automatic overwrite

---

## 5. Primary User

An individual knowledge worker or developer who:
- uses Markdown across multiple devices
- wants a low-friction login experience
- expects content to be available everywhere
- values reliability more than advanced collaboration
- needs a safe fallback during intermittent connectivity

---

## 6. Core User Flows

### Flow A: Sign In
1. Open the product
2. Click sign in
3. Authenticate with email-based one-time login
4. Receive a cloud workspace session
5. Load the user's remote documents

### Flow B: Open Workspace on Another Device
1. Sign in on a second device
2. Load the same account workspace
3. Download the latest cloud state
4. Resume editing without manual export/import

### Flow C: Edit and Sync
1. Open a document
2. Edit content locally in the client
3. Client emits change events to the sync layer
4. Cloud stores the latest committed content
5. Other signed-in devices receive the update

### Flow D: Recover From Offline Work
1. User edits while offline
2. Client stores pending local changes
3. Connectivity returns
4. Client replays pending changes to the cloud
5. User is told whether the replay succeeded or produced a conflict

---

## 7. Information Architecture

### Routes

- `/login` - sign-in entry
- `/` - cloud workspace homepage
- `/editor/[docId]` - editor page

### Homepage Sections

1. Account / Session Header
2. Sync Status Banner
3. Quick Actions
4. Recent Cloud Documents
5. Recovery / Conflict Surface

### Editor Page Sections

1. Toolbar
2. Sync State Indicator
3. Editor Pane
4. Preview Pane
5. Version / Conflict Controls

---

## 8. Functional Scope

### Must-have Features

#### 8.1 Authentication
- user can sign in with email-based one-time login
- user can sign out
- session persists across refresh

#### 8.2 Cloud Workspace
- user sees a personal cloud workspace after login
- workspace documents load from the cloud
- local cache can restore the last known state while the cloud loads

#### 8.3 Real-Time Sync
- document changes are pushed to the cloud quickly
- other devices receive remote updates shortly after commit
- UI exposes `syncing`, `synced`, `offline`, and `conflict` states

#### 8.4 Offline Buffering
- client can queue edits while offline
- queued edits replay automatically when connectivity returns

#### 8.5 Conflict Handling
- concurrent edits should not silently overwrite each other
- conflicts preserve both versions when automatic merge is not safe

#### 8.6 Version History
- cloud keeps recent document versions
- user can inspect or recover a previous version

---

## 9. Data Model

### UserAccount

```ts
interface UserAccount {
  id: string
  email: string
  createdAt: number
  lastSeenAt: number
}
```

### Session

```ts
interface Session {
  id: string
  userId: string
  deviceId: string
  expiresAt: number
}
```

### CloudDocument

```ts
interface CloudDocument {
  id: string
  userId: string
  title: string
  markdown: string
  version: number
  updatedAt: number
  createdAt: number
  lastOpenedAt: number
}
```

### DocumentVersion

```ts
interface DocumentVersion {
  id: string
  docId: string
  userId: string
  markdown: string
  version: number
  createdAt: number
}
```

### SyncEvent

```ts
interface SyncEvent {
  id: string
  docId: string
  userId: string
  deviceId: string
  baseVersion: number
  nextVersion: number
  markdown: string
  createdAt: number
}
```

---

## 10. Sync Rules

- cloud state is the canonical source of truth
- clients may cache locally, but cloud writes must win on commit order
- each mutation carries a version reference
- if the client's base version is stale, the server returns a conflict
- non-mergeable conflicts keep both versions rather than discarding content

### Sync Lifecycle

1. client loads latest cloud document state
2. client applies local edits
3. client sends sync event with base version
4. server accepts and increments version, or rejects with conflict
5. client updates its local cache and UI state

---

## 11. Recovery Rules

- offline edits are buffered locally until the network returns
- failed syncs must remain visible to the user
- recovery should be explicit when content divergence exists
- the product should always preserve at least one recoverable copy

---

## 12. Implementation Notes

- the current browser-only storage model will be replaced by a cloud-backed repository layer
- the UI will continue to use local cache for responsiveness
- the backend surface should be kept small so the storage provider can change later
- the first build should focus on single-user reliability before any team features

---

## 13. Acceptance Criteria

- login is required to access cloud documents
- the same account can open the workspace on multiple devices
- edits synchronize with visible sync states
- offline edits replay safely
- conflicts never silently destroy content

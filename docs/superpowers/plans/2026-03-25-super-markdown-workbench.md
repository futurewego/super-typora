# Super Markdown Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first online Markdown workbench with a lightweight home dashboard and a fast editor experience: import local `.md`, write with live preview, autosave safely, export to `.md` and `.html`, browse recent docs, and recover drafts after refresh or accidental close.

**Architecture:** Use a frontend-only Next.js App Router application with two primary routes: `/` for the lightweight workbench and `/editor/[docId]` for the main editing experience. Persist documents and drafts in IndexedDB, keep lightweight preferences in `localStorage`, and drive preview, outline, and export from the same Markdown source of truth.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Zustand, idb, CodeMirror 6, react-markdown, remark-gfm, rehype-highlight, rehype-sanitize, Vitest, Testing Library, Playwright

---

## Preflight

- [ ] Confirm the current directory is the intended greenfield project.
- [ ] Add `.gitignore` entries for `node_modules`, `.next`, `playwright-report`, `test-results`, `.superpowers`, and coverage artifacts.
- [ ] Use `npm` as the package manager.
- [ ] Treat scaffolding and generated config as the only non-TDD exception.

## Implementation Clarifications

### Document / Draft / RecentDoc Relationship

- `StoredDocument` is the canonical local document.
- `DraftSnapshot` is the latest recovery-oriented in-progress state.
- Recent documents are derived from `StoredDocument.lastOpenedAt` descending.

### Persistence Rules

On autosave:
1. update `DraftSnapshot`
2. update `StoredDocument.markdown`
3. update `StoredDocument.updatedAt`

### Recovery Rules

- recovery is surfaced on the homepage as an explicit card
- recovery never silently overwrites the editor on route open
- user must actively choose recovery
- stale drafts are cleared when superseded or discarded

### Import Rules

- V1 import starts only from homepage
- importing creates a new document and navigates to the editor
- V1 does not replace the current editor document in-place

### Client Component Boundary

Any module touching `window`, `document`, `localStorage`, `indexedDB`, `File`, `Blob`, or `URL.createObjectURL` must stay behind client-safe boundaries.

---

## Planned File Map

### Application shell
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/editor/[docId]/page.tsx`

### Workbench components
- `components/workbench/workbench-shell.tsx`
- `components/workbench/quick-actions.tsx`
- `components/workbench/recent-docs.tsx`
- `components/workbench/recovery-card.tsx`

### Editor components
- `components/editor/editor-shell.tsx`
- `components/editor/editor-toolbar.tsx`
- `components/editor/markdown-editor.tsx`
- `components/editor/preview-pane.tsx`
- `components/editor/outline-pane.tsx`
- `components/editor/save-indicator.tsx`

### Domain + storage
- `types/document.ts`
- `stores/editor-store.ts`
- `lib/storage/db.ts`
- `lib/storage/documents.ts`
- `lib/storage/drafts.ts`
- `lib/storage/preferences.ts`

### Markdown + export
- `lib/markdown/parse-outline.ts`
- `lib/markdown/render-markdown.tsx`
- `lib/export/export-md.ts`
- `lib/export/export-html.ts`

### Utilities + tests
- `lib/utils/debounce.ts`
- `lib/utils/file.ts`
- `tests/setup.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `tests/unit/**`
- `tests/integration/**`
- `tests/e2e/**`
- `README.md`

---

## Task 0: Test Foundation and Browser-Only Boundary

**Files:**
- Create: `tests/setup.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Modify: `package.json`
- Test: `tests/unit/smoke/storage-environment.test.ts`

- [ ] Install testing dependencies and configure Vitest with JSDOM plus `fake-indexeddb`.
- [ ] Write a smoke test proving `indexedDB` exists in test runtime.
- [ ] Mark browser-dependent modules as client-only where needed.
- [ ] Verify with: `npx vitest run tests/unit/smoke/storage-environment.test.ts`

## Task 1: Bootstrap the app and baseline homepage shell

**Files:**
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Test: `tests/integration/homepage-shell.test.tsx`

- [ ] Write a failing test asserting homepage renders heading, quick actions, and recent docs section.
- [ ] Implement minimal homepage shell.
- [ ] Verify with: `npx vitest run tests/integration/homepage-shell.test.tsx`

## Task 2: Define document types and local persistence repositories

**Files:**
- Create: `types/document.ts`
- Create: `lib/storage/db.ts`
- Create: `lib/storage/documents.ts`
- Create: `lib/storage/drafts.ts`
- Create: `lib/storage/preferences.ts`
- Test: `tests/unit/storage/documents.test.ts`
- Test: `tests/unit/storage/drafts.test.ts`
- Test: `tests/unit/storage/preferences.test.ts`

- [ ] Write failing repository tests for create, read, recent ordering, draft persistence, and preferences.
- [ ] Implement IndexedDB bootstrap and repository helpers.
- [ ] Verify with: `npx vitest run tests/unit/storage`

**Acceptance:**
- [ ] `StoredDocument` can be created and retrieved
- [ ] recent docs are ordered by `lastOpenedAt`
- [ ] `DraftSnapshot` reads and writes by `docId`
- [ ] preferences persist independently

## Task 3: Build the lightweight workbench behavior

**Files:**
- Create: `components/workbench/workbench-shell.tsx`
- Create: `components/workbench/quick-actions.tsx`
- Create: `components/workbench/recent-docs.tsx`
- Create: `components/workbench/recovery-card.tsx`
- Create: `lib/utils/file.ts`
- Modify: `app/page.tsx`
- Test: `tests/integration/workbench-actions.test.tsx`

- [ ] Write failing tests for recent docs display, recovery card display, create action, and import action.
- [ ] Implement file import helper.
- [ ] Implement workbench components.
- [ ] Wire homepage route to storage and navigation.
- [ ] Verify with: `npx vitest run tests/integration/workbench-actions.test.tsx`

**Acceptance:**
- [ ] homepage shows recovery card only when valid draft exists
- [ ] import creates a new document
- [ ] clicking a recent doc updates `lastOpenedAt`

## Task 4: Implement editor route loading and session store

**Files:**
- Create: `stores/editor-store.ts`
- Create: `components/editor/editor-shell.tsx`
- Create: `components/editor/editor-toolbar.tsx`
- Create: `components/editor/save-indicator.tsx`
- Modify: `app/editor/[docId]/page.tsx`
- Test: `tests/integration/editor-route.test.tsx`

- [ ] Write failing test for editor shell rendering title and save indicator.
- [ ] Implement Zustand editor store.
- [ ] Implement route loader and not-found handling.
- [ ] Verify with: `npx vitest run tests/integration/editor-route.test.tsx`

**Acceptance:**
- [ ] missing doc id is handled safely
- [ ] browser-only state is not initialized in server-only code

## Task 5: Integrate CodeMirror and dirty-state editing

**Files:**
- Create: `components/editor/markdown-editor.tsx`
- Modify: `components/editor/editor-shell.tsx`
- Modify: `stores/editor-store.ts`
- Test: `tests/integration/markdown-editor.test.tsx`

- [ ] Write failing test asserting typing marks state as dirty.
- [ ] Implement CodeMirror wrapper with Markdown support.
- [ ] Wire editor changes into the store.
- [ ] Verify with: `npx vitest run tests/integration/markdown-editor.test.tsx`

## Task 6: Add safe preview rendering and synchronized outline

**Files:**
- Create: `lib/markdown/parse-outline.ts`
- Create: `lib/markdown/render-markdown.tsx`
- Create: `components/editor/preview-pane.tsx`
- Create: `components/editor/outline-pane.tsx`
- Modify: `components/editor/editor-shell.tsx`
- Test: `tests/unit/markdown/parse-outline.test.ts`
- Test: `tests/integration/preview-outline.test.tsx`

- [ ] Write failing tests for heading extraction and preview/outline rendering.
- [ ] Implement safe Markdown rendering with GFM and syntax highlighting.
- [ ] Implement outline parsing and navigation list.
- [ ] Verify with: `npx vitest run tests/unit/markdown/parse-outline.test.ts tests/integration/preview-outline.test.tsx`

## Task 7: Add debounced autosave and recovery flow

**Files:**
- Create: `lib/utils/debounce.ts`
- Modify: `lib/storage/drafts.ts`
- Modify: `lib/storage/documents.ts`
- Modify: `components/editor/editor-shell.tsx`
- Modify: `components/workbench/recovery-card.tsx`
- Test: `tests/unit/utils/debounce.test.ts`
- Test: `tests/integration/autosave-recovery.test.tsx`

- [ ] Write failing tests for autosave lifecycle and recovery surfacing.
- [ ] Implement debounce helper.
- [ ] Persist drafts and documents on a 500ms debounce.
- [ ] Verify with: `npx vitest run tests/unit/utils/debounce.test.ts tests/integration/autosave-recovery.test.tsx`

**Acceptance:**
- [ ] `dirty -> saving -> saved` lifecycle works
- [ ] failed persistence enters `error`
- [ ] recovery never happens silently on route enter

## Task 8: Implement Markdown and HTML export

**Files:**
- Create: `lib/export/export-md.ts`
- Create: `lib/export/export-html.ts`
- Modify: `components/editor/editor-toolbar.tsx`
- Test: `tests/unit/export/export-md.test.ts`
- Test: `tests/unit/export/export-html.test.ts`
- Test: `tests/integration/export-actions.test.tsx`

- [ ] Write failing tests for Markdown and HTML export helpers.
- [ ] Implement export builders and download helpers.
- [ ] Wire export buttons into toolbar.
- [ ] Verify with: `npx vitest run tests/unit/export tests/integration/export-actions.test.tsx`

## Task 9: Implement theme persistence, outline toggle, and responsive polish

**Files:**
- Modify: `app/globals.css`
- Modify: `components/editor/editor-shell.tsx`
- Modify: `components/editor/editor-toolbar.tsx`
- Modify: `lib/storage/preferences.ts`
- Test: `tests/integration/theme-preferences.test.tsx`
- Test: `tests/integration/responsive-layout.test.tsx`

- [ ] Write failing tests for theme toggle and responsive layout behavior.
- [ ] Persist theme and visibility preferences.
- [ ] Apply final visual tokens and responsive layout behavior.
- [ ] Verify with: `npx vitest run tests/integration/theme-preferences.test.tsx tests/integration/responsive-layout.test.tsx`

## Task 10: Add E2E coverage, README, and final verification

**Files:**
- Create: `tests/e2e/workbench.spec.ts`
- Create: `tests/e2e/editor-flow.spec.ts`
- Modify: `README.md`

- [ ] Add end-to-end tests for create, import, edit, autosave, refresh recovery, and export visibility.
- [ ] Write README with run, test, and architecture notes.
- [ ] Verify with:
  - `npm run lint`
  - `npx vitest run`
  - `npx playwright test`
  - `npm run build`

---

## Testing Scope Constraint

- Unit and integration tests cover repositories, outline parsing, export builders, preferences, homepage rendering, and recovery card behavior.
- End-to-end tests cover CodeMirror typing, import flow, autosave flow, refresh recovery, export behavior, and route transitions.
- Avoid over-investing in brittle low-level DOM assertions for CodeMirror internals.

---

## Final QA Checklist

- [ ] Home page shows `继续草稿 / 导入 Markdown / 新建文档 / 最近文档`
- [ ] Importing a `.md` file creates a new local document and opens the editor
- [ ] Typing updates preview without manual refresh
- [ ] Outline reflects heading changes
- [ ] Autosave persists on refresh
- [ ] Recovery card appears after interrupted editing
- [ ] Markdown export downloads `.md`
- [ ] HTML export downloads `.html`
- [ ] Theme and layout preferences survive refresh
- [ ] Desktop and mobile both render correctly
- [ ] `lint`, `vitest`, `playwright`, and `build` all pass

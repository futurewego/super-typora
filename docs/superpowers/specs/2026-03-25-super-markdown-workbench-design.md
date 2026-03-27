# Super Markdown Workbench Design Spec

**Date:** 2026-03-25  
**Status:** Approved for Build  
**Product Type:** Online Markdown Workbench  
**Mode:** Local-first, single-user, no-login V1

---

## 1. Overview

Super Markdown Workbench is a browser-based Markdown tool for users who frequently handle local Markdown files and want a fast online editor with reliable preview, autosave, recovery, and export.

V1 is intentionally narrow: a lightweight workbench homepage plus a strong editor experience. The homepage helps users quickly resume work. The editor is the main product surface. The system is local-first, runs in the browser, and does not require accounts or cloud sync.

---

## 2. Product Goals

### Primary Goal

Deliver a browser-based Markdown workbench that makes it fast and safe to:
- import local `.md` files
- continue unfinished writing
- edit with live preview
- avoid content loss
- export clean Markdown or HTML

### Success Criteria

V1 is successful if users can:
1. enter the product and start editing within seconds
2. refresh or accidentally close without losing meaningful work
3. import a Markdown file and immediately continue editing
4. trust the preview and exported output
5. use the homepage as a useful re-entry surface instead of dead marketing space

---

## 3. Non-Goals

The following are out of scope for V1:
- user accounts
- cloud sync
- multi-device sync
- collaboration
- public sharing or publishing
- folders
- tags
- full-text search
- AI writing assistance
- multi-tab editing

---

## 4. Product Positioning

The product is positioned as:

**Light Workbench + Strong Editor**

This means:
- the homepage is an operational entry point, not a heavy dashboard
- the editor experience is the center of gravity
- organization features stay minimal in V1
- reliability and editing smoothness matter more than feature count

---

## 5. Primary User

An AI developer or technical user who:
- often works with local Markdown files
- wants browser-based access without heavy setup
- values editing speed over collaboration features
- needs reliable autosave and recovery
- prefers practical tools over complex knowledge systems

---

## 6. Core User Flows

### Flow A: Create New Document
1. Open homepage
2. Click `新建文档`
3. Create local blank document
4. Enter editor page
5. Type content
6. Draft autosaves continuously

### Flow B: Import Existing Markdown
1. Open homepage
2. Click `导入 Markdown`
3. Select local `.md` file
4. File is read in browser
5. New local document record is created
6. User lands in editor with imported content

### Flow C: Continue Recent Work
1. Open homepage
2. See recent documents
3. Click one item
4. Enter editor for that document
5. Continue editing

### Flow D: Recover Interrupted Draft
1. User edited a document
2. Browser refreshed or closed unexpectedly
3. System detects recoverable draft on next visit
4. Homepage surfaces recovery card
5. User chooses to recover
6. Editor opens with latest draft state

---

## 7. Information Architecture

### Routes

- `/` - Workbench homepage
- `/editor/[docId]` - Editor page

### Homepage Sections

1. Hero / Entry Header
2. Quick Actions
   - `继续草稿`
   - `导入 Markdown`
   - `新建文档`
3. Recovery Card
4. Recent Documents
5. Light Utility Area

### Editor Page Sections

1. Toolbar
2. Editor Pane
3. Preview Pane
4. Outline Pane

---

## 8. Functional Scope

### Must-have Features

#### 8.1 Local Markdown Import
- user can import `.md` from homepage
- imported file becomes a local document in the browser
- imported file name is used as initial title
- import creates a new document record

#### 8.2 New Blank Document
- homepage can create a blank document
- new document immediately opens in editor

#### 8.3 Real-time Editing + Preview
- editor and preview reflect the same Markdown source
- preview updates during typing
- preview supports headings, lists, task lists, blockquotes, fenced code blocks, and tables

#### 8.4 Autosave
- content changes trigger draft persistence automatically
- autosave does not depend on manual save action
- UI exposes save state: `dirty`, `saving`, `saved`, `error`

#### 8.5 Draft Recovery
- system surfaces recoverable work after interrupted editing
- recovery is explicit, not silent

#### 8.6 Recent Documents
- homepage shows recent local docs
- sorted by `lastOpenedAt` descending
- clicking a recent doc opens that doc in editor

#### 8.7 Export
- export as `.md`
- export as `.html`

#### 8.8 Outline Navigation
- headings generate an outline
- outline is clickable
- outline visibility can be toggled

#### 8.9 Theme Persistence
- theme choice persists across refresh
- V1 supports at least light and dark themes

---

## 9. Data Model

### StoredDocument

```ts
type DocumentSource = "blank" | "imported" | "recovered"

interface StoredDocument {
  id: string
  title: string
  markdown: string
  source: DocumentSource
  createdAt: number
  updatedAt: number
  lastOpenedAt: number
}
```

### DraftSnapshot

```ts
interface DraftSnapshot {
  docId: string
  markdown: string
  savedAt: number
}
```

### UserPreferences

```ts
interface UserPreferences {
  theme: "light" | "dark"
  outlineVisible: boolean
  previewVisible: boolean
}
```

---

## 10. Document vs Draft Rules

- `StoredDocument` is the canonical local document entity.
- `DraftSnapshot` is the latest recovery-oriented in-progress state for that document.
- There is no separate recent-doc store; recent documents are derived from `StoredDocument` ordered by `lastOpenedAt`.

### Write Strategy

On autosave:
1. update `DraftSnapshot`
2. update `StoredDocument.markdown`
3. update `StoredDocument.updatedAt`

---

## 11. Recovery Rules

A recovery card appears when:
- a `DraftSnapshot` exists for a document
- and the draft content differs from the latest stable editor state or stored document state

Recovery UX rules:
- recovery is surfaced on the homepage as an explicit card
- recovery never silently overwrites the editor on route open
- user must actively choose `恢复草稿`
- old recoverable state is cleared when superseded or explicitly discarded

---

## 12. Import Rules

V1 import behavior is homepage-first only.

Import flow:
1. user clicks `导入 Markdown` on `/`
2. browser reads the selected `.md` file
3. app creates a new `StoredDocument`
4. app uses filename without extension as the initial title
5. app navigates to `/editor/[docId]`

V1 does not support replacing the current document from inside the editor.

---

## 13. Technical Architecture

### Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Zustand
- idb
- CodeMirror 6
- react-markdown
- remark-gfm
- rehype-highlight
- rehype-sanitize

### Storage Principle

- IndexedDB stores documents and drafts
- localStorage stores lightweight preferences only

### Rendering Principle

Preview, outline, and export all derive from the same Markdown source.

---

## 14. Client / Server Boundary

The following must run as client-side logic:
- homepage action handlers
- file import logic
- IndexedDB access
- localStorage access
- CodeMirror wrapper
- autosave orchestration
- export download logic
- editor session store consumers

Any module touching browser APIs must stay behind client-safe boundaries.

---

## 15. UI Direction

### Visual Principles

- practical
- technical
- calm
- focused
- not generic SaaS purple

### Tokens

- light: warm ivory background, graphite text, amber accent
- dark: charcoal background, cool gray text, restrained teal accent
- typography: `IBM Plex Sans` + `IBM Plex Mono`

### Responsive Behavior

- Desktop: dual-pane editor + preview + optional outline rail
- Tablet/mobile: stacked layout, sticky toolbar, collapsible outline

---

## 16. Reliability Requirements

Required behaviors:
- autosave on edit with debounce
- visible save status
- recovery surface after interruption
- refresh-safe persistence
- imported docs appear in recent docs reliably

Failure modes to handle:
- IndexedDB unavailable
- draft write error
- malformed imported file
- missing document route
- HTML export generation failure

---

## 17. Testing Strategy

### Unit Tests
- storage repositories
- outline parser
- export builders
- debounce utility
- preference persistence

### Integration Tests
- homepage shell
- recent docs rendering
- recovery card rendering
- editor toolbar state
- preview + outline synchronization

### E2E Tests
- create new document
- import markdown
- edit and autosave
- refresh and recover
- export visibility and flow

### Constraint

CodeMirror low-level DOM behavior should be covered primarily by Playwright, not brittle unit DOM assertions.

---

## 18. Acceptance Criteria

V1 is done when:
1. homepage renders quick actions and recent docs
2. user can create a blank document
3. user can import a local `.md` file
4. editor updates preview in real time
5. outline updates from headings
6. autosave persists edits
7. interrupted drafts are recoverable
8. export to `.md` and `.html` works
9. theme persists after refresh
10. desktop and mobile layouts remain usable
11. lint, tests, and build pass

---

## 19. V2 Expansion Path

Natural follow-ups after V1:
1. account system + cloud sync
2. shareable read-only links
3. document search
4. folders and tags
5. AI formatting or summarization
6. templates

---

## 20. Final Decision Summary

V1 will be:
- a local-first browser-based Markdown workbench
- a lightweight homepage for re-entry
- a strong editor with live preview
- a safe autosave + recovery flow
- a focused writing tool, not a knowledge platform

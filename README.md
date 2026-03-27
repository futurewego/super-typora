# Super Markdown Workbench

[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-000000?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1.1-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Release](https://img.shields.io/github/v/release/futurewego/super-typora?display_name=tag)](https://github.com/futurewego/super-typora/releases)

Super Markdown Workbench is a local-first Markdown web app built for fast editing, reliable autosave, and low-friction re-entry into unfinished work.

## Preview

![Super Markdown Workbench home screenshot](docs/assets/workbench-home.png)

## What V1 includes

- lightweight workbench homepage
- create blank documents
- import local `.md` files
- recent documents from browser storage
- recover last autosaved draft from home
- CodeMirror-based Markdown editor
- live preview with GFM support
- bilingual UI toggle (`中文 / English`)
- one-click fullscreen for `Editor` and `Preview`
- draggable editor / preview width
- autosave to IndexedDB
- export to `.md` and `.html`
- theme persistence

## Stack

- Next.js App Router
- React 19 + TypeScript
- Tailwind CSS v4
- Zustand
- IndexedDB via `idb`
- CodeMirror 6
- `react-markdown` + `remark-gfm`
- Vitest + Testing Library
- Playwright

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Test commands

```bash
npm run lint
npx vitest run
npx playwright test
npm run build
```

## Architecture notes

- `app/page.tsx` is the workbench entry route
- `app/editor/[docId]/page.tsx` is the editor route
- documents and draft snapshots are stored in IndexedDB
- lightweight preferences are stored in `localStorage`
- preview and export derive from the same Markdown source

## Deferred after V1

- user accounts
- cloud sync
- full-text search
- folders and tags
- collaboration
- AI-assisted formatting or summarization

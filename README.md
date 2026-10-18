# RIP — REST In Peace 🕊️

**Version:** 1.0.0 · **License:** MIT · **Platform:** Windows / macOS / Linux

A desktop HTTP/REST API client for sending requests, inspecting responses, and
persisting your history and collections locally. Think Postman / Insomnia,
packaged as a native app with [Tauri](https://tauri.app).

It sends requests over the network and talks only to web resources — no server
component of its own.

---

## Features

- **Request builder** — compose any HTTP request with URL, method, authentication
  (none / bearer / basic), headers, query parameters, and a body (JSON, form data).
- **Rich responses** — pretty-print JSON with inline search, preview binary
  blobs with a one-click download, and show errors cleanly with retry.
- **Local history** — every request is saved; reload, delete individually, or
  clear the whole history.
- **Collections** — organize requests into folders and collections, browsable
  as a tree in the sidebar.
- **Workspaces** — multiple tabs per window; rename, close (`Ctrl/Cmd+W`), and
  save with a keyboard shortcut.
- **Network delay** — inject a synthetic latency for slow-down testing.
- **Data portability** — export all data to a JSON backup and import it back.
- **Everything local** — history, collections, and settings persist in a single
  local SQLite database.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + S` | Save the active request |
| `Ctrl/Cmd + W` | Close the active tab |
| `Ctrl/Cmd + T` | Open a new tab |
| `Ctrl/Cmd + Enter` | Send the active request |

---

## Tech stack

- **Tauri 2.x** — native app shell (Rust backend + webview)
- **React 19** — UI
- **Vite 8** — build tool
- **Tailwind CSS 4** — styling
- **TanStack React Virtual** — virtualized JSON viewer
- **Tauri plugins** — `plugin-http` (networking), `plugin-sql` (SQLite storage),
  `plugin-opener` (downloads)
- **Vitest** — unit/component tests

---

## Getting started

Requires Node.js 18+ (the repo uses `bun` for scripts).

```bash
# Install dependencies
bun install

# Start the dev server (web view on http://localhost:1420)
bun run dev
```

To build the native app:

```bash
bun tauri build
```

---

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Vite dev server (frontend) |
| `bun run build` | Production build to `dist/` |
| `bun tauri build` | Build the native app |
| `bun run test` | Run the test suite (watch mode) |
| `bun run test:run` | Run tests once |
| `bun run test:ui` | Run tests in the interactive UI |

---

## Project structure

```
src/
  main.jsx           React entry point (providers)
  App.jsx            Orchestrator: state reducer, CRUD handlers, modals
  App.css            Global styles
  context/           RIPContext (app state + request engine), ToastContext
  components/
    WorkspacePanel.jsx   Request form + response view
    SidebarPanel.jsx     History, collections tree, settings
    tabs/                Auth / Headers / Queries / Body / Response panels
    reusables/           TabItem, HistoryItem, TreeItem, SidebarItem, CompactSelect
    modals/              ConfirmDeletion, CreateCollection, Settings
    viewers              JsonViewer, BlobViewer, Error
  hooks/                useGlobalShortcuts, useSidebarResize
  utils/                normalizeUrl, parser, requestHelper, requestNormalization,
                        ripDb, snippetGenerator
src-tauri/              Rust backend, Tauri config, capabilities
```

---

## Data model

Requests, history, collections, and settings are stored in a local SQLite
database (`plugin-sql`). On first launch the app migrates any legacy header/query
formats into the current normalized shape.



---

## Contributing

1. Fork the repo and create a feature branch.
2. Install deps: `bun install`
3. Run tests: `bun run test:run` (must pass)
4. Build: `bun run build` (must succeed)
5. Keep changes small and focused; add tests for new logic.
6. Open a PR against `main`.

Code style: patch only, never commit secrets. See `.gitignore` for build artifacts.

---

## Changelog

### 1.0.0
- Initial release.
- HTTP/REST request builder with auth (none/bearer/basic), headers, queries, body (raw/form-data).
- Rich responses: pretty JSON with search, binary blob preview + download, clean error + retry.
- Local history + collections (folders) + workspaces (tabs), persisted in SQLite.
- Network delay injection, export/import JSON backup.
- Keyboard shortcuts: Ctrl/Cmd+S save, W close tab, T new tab, Enter send.
- Theming: 7 built-in themes + custom theme import/export.
- CI: tests + build on push/PR; release workflow builds Windows/macOS/Linux installers on `v*` tags.

---


---

## Security notes

- Request history, saved requests, and exported backups store authentication
  credentials (bearer tokens, basic-auth usernames/passwords) **in plaintext**
  inside the local SQLite database (`history6.db`) and in JSON exports.
- Treat the database file and any exported backup as sensitive: do not share
  them, and delete exports after use. The app has no server component and
  stores everything locally, so protection of these files is the user's
  responsibility.

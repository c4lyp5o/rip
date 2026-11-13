# RIP — REST In Peace

**Version:** 1.1.0 · **License:** MIT · **Platform:** Windows / macOS / Linux / Android

A desktop HTTP/REST API client for sending requests, inspecting responses, and
persisting your history and collections locally. Think Postman / Insomnia,
packaged as a native app with [Tauri](https://tauri.app).

It sends requests over the network and talks only to web resources — there is
no server component of its own, and everything it stores stays on your
machine.

---

## The idea

Most API clients hide the response behind a tab, so seeing a result costs an
extra click and you lose your place in the request you just wrote. RIP puts
**the request and the response side by side, both always visible.** A phone
is the one screen too narrow for that: there, a Request/Response switch shows
one at a time and flips to the response the moment you send.

The composer is the primary surface. The sidebar shows **History** and
**Collections**, fully labelled, with nothing hidden behind a toggle. Colour
carries meaning — the method chip and the status badge are tinted by
semantics, and nothing else is coloured for decoration.

---

## Features

- **Request builder** — compose any HTTP request with URL, method,
  authentication (none / bearer / basic), headers, query parameters, and a
  body (raw JSON or form fields).
- **Response beside the request** — the response pane is permanent, with
  pretty-printed JSON and inline search, a binary blob preview with a
  one-click download, and failures that show the real cause with a retry.
- **Copy as code** — emit the current request as cURL, Node.js (Fetch),
  Python (Requests), C# (HttpClient) or PowerShell (Invoke-RestMethod).
- **Local history** — every request is saved; reload it, delete it, or clear
  the whole history.
- **Collections** — organise requests into folders and collections, browsable
  as a tree in the sidebar.
- **Workspaces** — multiple tabs per window; rename, close (`Ctrl/Cmd+W`), and
  save with a keyboard shortcut.
- **Network delay** — inject a synthetic latency for slow-down testing.
- **Data portability** — export everything to a JSON backup and import it back.
- **Eight themes** — *Studio* (the default) plus Terminal Soft, Minimal Dark,
  Minimal Light, Linear-ish, Dark Brutalist, Neo-Brutal and Bright
  Brutalist. Custom themes can be imported and exported as JSON.
- **Everything local** — history, collections and settings persist in a single
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
- **Tauri plugins** — `plugin-http` (networking), `plugin-sql` (SQLite
  storage), `plugin-opener` (downloads), `plugin-dialog` and `plugin-fs`
  (saving files on Android, where the webview ignores download links)
- **Vitest** — unit and component tests

Fonts (Inter and JetBrains Mono) are self-hosted and bundled with the app,
because the Tauri CSP cannot rely on a font CDN.

---

## Getting started

Requires Node.js 18+. The repo uses [Bun](https://bun.sh) for its scripts, and
Rust for the native shell.

```bash
# Install dependencies
bun install

# Start the dev server (frontend only, on http://localhost:1420)
bun run dev

# Or run the full desktop app
bun run tauri dev
```

To build the native app:

```bash
bun run tauri build
```

The installers land in `src-tauri/target/release/bundle/`.

### Android

Each release also ships a signed universal **APK** to sideload and an **AAB**
for the Play Store. On a phone the sidebar becomes a drawer and the request
and response share the screen through a Request/Response switch; tablets keep
the side-by-side layout. Android builds update through the Play Store or a
new APK, not the in-app updater. See [CONTRIBUTING.md](CONTRIBUTING.md#android)
to build one yourself.

---

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Vite dev server (frontend only) |
| `bun run build` | Production build to `dist/` |
| `bun run preview:web` | Browser preview with stubbed Tauri plugins (see below) |
| `bun run tauri dev` | Run the desktop app in development |
| `bun run tauri build` | Build the native app and its installers |
| `bun run test` | Run the test suite (watch mode) |
| `bun run test:run` | Run the tests once |
| `bun run test:ui` | Run the tests in the interactive UI |

### The browser preview

The Tauri SQLite and HTTP plugins do not exist in a plain browser, so
`bun run preview:web` stubs both and serves the UI on
`http://localhost:4340`. It is a **development aid only** — the production
build never loads the stub.

---

## Project structure

```
src/
  main.jsx            React entry point (providers + error boundary)
  App.jsx             Shell: layout, modals, menu state, global shortcuts
  App.css             Theme tokens, semantic colours, global styles
  fonts.css           Self-hosted @font-face declarations
  themes/themes.js    The theme registry and the variable contract
  context/            RIPContext (state + request engine), ThemeContext,
                      ToastContext
  components/
    RequestBar.jsx       The composer: method, URL, copy-as-code, save, send
    RequestPane.jsx      The request side: params, headers, auth, body
    ResponsePane.jsx     The response side: status, timing, size, body
    WorkspacePanel.jsx   The split workspace that holds the two panes
    SidebarPanel.jsx     History, collections, theme picker, settings
    ErrorBoundary.jsx    Root error boundary
    reusables/        HistoryRow, CollectionTree, TabItem, ThemeMenu
    tabs/             ParamsTab, HeadersTab, AuthTab, BodyTab
    modals/           ConfirmDeletion, CreateCollection, Settings
    viewers/          JsonViewer, BlobViewer, Error
  hooks/                useGlobalShortcuts, useIsCompact, useSidebarResize,
                        useUpdateRequest
  utils/                normalizeUrl, parser, platform, requestHelper,
                        requestNormalization, ripDb, saveFile, semantics,
                        snippetGenerator
  utils/semantics.js  Method and status colours, in one place
src-tauri/              Rust backend, Tauri config, capabilities, icons
src-tauri/gen/android/  The Android project (hand-edited; see CONTRIBUTING)
dev-preview/            Browser-only stubs for the Tauri SQLite and HTTP plugins
scripts/audit/          DOM audit: text size, overflow, WCAG AA contrast
```

---

## Data model

Requests, history, collections and settings are stored in a local SQLite
database (`plugin-sql`). On first launch the app migrates any legacy header
and query formats into the current normalised shape.

---

## Security notes

- Request history, saved requests and exported backups store authentication
  credentials — bearer tokens, basic-auth usernames and passwords, and
  custom `Authorization`-style headers — **in plaintext** inside the local
  SQLite database and in JSON exports.
- Treat the database file and any exported backup as sensitive: do not share
  them, and delete exports after use.
- On Android, an export saved to shared storage such as Downloads can be read
  by any app with file access. Save it somewhere private, or delete it once
  you have moved it.
- The app has no server component and stores everything locally, so
  protecting those files is your responsibility.
- The repository is public and is swept for secrets before every push
  (`.gitleaks.toml`). Run the same sweep before you push anything:
  `gitleaks git --redact=0 --report-path /tmp/leaks.json .`

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: patch only, never
commit a credential, and keep the test suite green.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Issues

[github.com/c4lyp5o/rip/issues](https://github.com/c4lyp5o/rip/issues)

## License

[MIT](LICENSE) © 2026 Calypso

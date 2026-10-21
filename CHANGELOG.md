# Changelog

All notable changes to REST In Peace are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

The Studio redesign and the release-readiness work are landed but not yet
tagged. No GitHub release exists for them yet.

### Added

- **Studio** — a new theme, and the default. Eight themes ship in total; the
  original seven keep their ids so a theme saved in an existing database
  still resolves.
- **Copy as code** — the composer can emit the current request as cURL,
  Node.js (Fetch), Python (Requests), C# (HttpClient) or PowerShell
  (Invoke-RestMethod).
- A **root error boundary**, so a render failure shows a readable message and
  a reload action instead of a blank window.
- A **real-entrypoint test** that mounts `src/main.jsx` itself, so a missing
  provider can never ship again.
- A **browser preview harness** (`dev-preview/`, `vite.preview.config.js`) and
  a **DOM audit** (`scripts/audit/`) that measures rendered text size,
  overflow and WCAG AA contrast across every theme.
- A **secret-sweep gate** (`.gitleaks.toml`) and a GitHub issue/PR template set.
- **Self-update** for installed builds: a quiet check on launch, and
  Settings → Updates to install and restart. Updates come from GitHub
  Releases and are signature-checked before installing. The portable exe
  does not self-update.

### Changed

- **The response is no longer behind a tab.** Request configuration and the
  response are permanent side-by-side panes, both always visible.
- The sidebar shows **labelled History and Collections** with no space toggle.
- The sidebar's **brand header** ("R" badge and "REST In Peace") is gone —
  the window title already names the app.
- The composer is the primary surface: method chip, URL field, copy-as-code,
  save and send.
- Sentence case throughout, an 11px type floor, fewer hairlines, and colour
  reserved for semantics (method and status colours are centralised in
  `src/utils/semantics.js`).
- **Inter** and **JetBrains Mono** are self-hosted and bundled — the Tauri CSP
  cannot rely on a font CDN.
- The app's **metadata** is filled out properly: `package.json`,
  `Cargo.toml`, `tauri.conf.json` and the webview shell now carry a
  description, licence, repository, keywords and a real title and favicon.
- The **app icon** is a new `>rip` terminal-prompt mark, regenerated for
  every platform from `public/icon-source.svg`.
- The Tauri crate version is `1.0.0`, matching `package.json` and
  `tauri.conf.json`.

### Fixed

- The app rendered a **blank window**: `App.jsx` called `useTheme()` but
  `src/main.jsx` never mounted `<ThemeProvider>`, so the shipped app threw
  `useTheme must be used within ThemeProvider`. The existing suites wrapped
  their own providers, which is why CI stayed green while the real app was
  broken.
- **"Copy as code" threw on every click** — it called `handleGenerateCode()`,
  which was never defined. It now uses the existing `src/utils/snippetGenerator.js`.
- The response panel **crashed on render** — it used a `Check` icon it never
  imported.
- **Save and Ctrl+S had drifted into two separate code paths**, which is the
  likely cause of header edits not persisting. Both now call one shared
  `src/hooks/useUpdateRequest.js`.
- The **"Copy as code" and "Save request" menus were dead buttons** — the
  document-level click-outside handler closed them inside the very click that
  opened them.
- A **failed request showed "0ms 0KB"** in the status bar. It now reads
  "Request failed", shows the underlying error, and offers a retry.
- **Toasts rendered green on green**, and a 4xx status was amber in one place
  and red in another. Both are now consistent.
- The Tauri crate versions were **behind the npm package versions**, so
  `bun run tauri build` aborted with a version mismatch and no release could
  be produced from the tree at all.

## [0.1.0]

The first working build.

### Added

- HTTP/REST request builder with auth (none / bearer / basic), headers, query
  parameters and a body (raw JSON or form fields).
- Rich responses: pretty-printed JSON with inline search, binary blob preview
  with a one-click download, and clean errors with a retry.
- Local history, collections and folders, workspaces (tabs), all persisted in
  a local SQLite database.
- Network delay injection, and JSON export / import of all local data.
- Keyboard shortcuts: `Ctrl/Cmd+S` save, `Ctrl/Cmd+W` close tab,
  `Ctrl/Cmd+T` new tab, `Ctrl/Cmd+Enter` send.
- Theming: seven built-in themes plus custom theme import and export.
- CI runs the tests and the build on every push and pull request; the release
  workflow builds Windows, macOS and Linux installers on a `v*` tag.

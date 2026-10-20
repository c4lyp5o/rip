# Contributing to REST In Peace

Thanks for helping out. This is a small desktop app built with Tauri 2 and
React 19, and the bar for a change is simple: **it works, it is tested, and
it does not break the things that already work.**

## Getting set up

Requires Node.js 18+ and [Bun](https://bun.sh). Rust is needed only for the
native shell.

```bash
bun install
bun run dev          # frontend only, on http://localhost:1420
bun run tauri dev    # the full desktop app
```

## Before you open a pull request

```bash
bun run test:run     # the whole suite must pass
bun run build        # the production build must succeed
```

CI runs exactly those two commands, so there is no point discovering a
failure there.

## House rules

- **Patch only.** Do not commit directly to `main`; work on a branch and open
  a pull request.
- **Never commit a credential.** The repository is public and the history is
  permanent. Run the secret sweep before every push:

  ```bash
  ~/tools/gitleaks git --redact=0 --report-path /tmp/leaks.json .
  ```

  Exit code `0` is clean, `1` is a leak, anything else means the tool itself
  broke. Block the push on anything other than `0`.
- **Add tests for new logic.** A bug fix without a test that fails without the
  fix is a bug fix waiting to come back.
- **Keep changes focused.** One concern per pull request. A commit that
  changes the theme system and the request builder is two pull requests.
- **Do not run a formatter across the tree.** Format only the files you
  touched, or unrelated reformatting will ride along and bury the real change.
- **Never widen the scope of a dependency bump.** A lockfile refresh is its
  own pull request with its own review.

## Things worth knowing before you touch them

- **The response pane is not a tab.** Request and response are permanent
  side-by-side panes. If you find yourself adding a "response" tab, you have
  misunderstood the design.
- **Method and status colour is centralised** in `src/utils/semantics.js`.
  Do not hard-code a colour in a component.
- **The app state lives in `src/context/RIPContext.jsx`.** Components read it
  through `useRip()`; they do not own their own copies of request state.
- **Saving has exactly one implementation.** The Save button and `Ctrl+S` both
  call `src/hooks/useUpdateRequest.js`. Keep it that way.
- **Theme variables are the contract.** Every theme must define the same set
  of custom properties, or a component that reads a missing one renders
  differently in one theme than in another. The set is documented in
  `src/themes/themes.js`.
- **The Tauri crate versions and the `@tauri-apps/*` npm versions must
  match.** When they drift, `bun run tauri build` refuses to run at all.

## The browser preview

The Tauri SQLite and HTTP plugins do not exist in a plain browser, so the
preview stubs both:

```bash
bun run preview:web   # http://localhost:4340
```

This is a **development aid only**. The production build never loads the
stub, and it must never be committed into the app's data path.

## The visual audit

`scripts/audit/` measures what actually renders — text size, overflow, and
WCAG AA contrast — and sweeps it across every theme. Run it after any change
to the UI:

```bash
npm i -D playwright && npx playwright install chromium
bun run preview:web &                      # the audit drives a real browser
node scripts/audit/audit.mjs
node scripts/audit/themesweep.mjs
```

The contrast check is not decorative: it caught a Send button at 2.06:1
against its background in one of the shipped themes.

## Reporting a bug

Open an issue with the app version, your OS, what you did, and what you
expected instead. If the app shows an error, copy the message — the error
panel shows the underlying cause.

## License

REST In Peace is MIT licensed. See [LICENSE](LICENSE).

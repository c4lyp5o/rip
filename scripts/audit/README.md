# Visual audit scripts

These measure the rendered UI in a real browser. They are how the redesign's
layout and contrast defects were found — they are not part of the app and the
production build never touches them.

## Requirements

    npm i -D playwright && npx playwright install chromium

## The browser preview

The app's data layer is Tauri SQLite, which cannot run in a plain browser.
`dev-preview/ripDb.browser-stub.js` is an in-memory stand-in, wired in by
`vite.preview.config.js`:

    npm run preview:web     # http://localhost:4340

The production build is unaffected — `npm run build` uses `vite.config.js`
and never loads the stub.

## Scripts

Run the dev preview first, then:

    node scripts/audit/audit.mjs        # text size, overflow, contrast, geometry
    node scripts/audit/themesweep.mjs   # the same checks across all 8 themes
    node scripts/audit/state.mjs        # what the DOM actually contains
    node scripts/audit/shot.mjs         # screenshots
    node scripts/audit/final.mjs        # end-to-end interaction screenshots

`audit.mjs` and `themesweep.mjs` are the ones that matter: they assert
WCAG AA contrast (4.5:1 for body text, 3:1 for large) in every theme, that
nothing renders below 11px, and that no element overflows its container.

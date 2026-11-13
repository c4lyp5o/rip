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
  misunderstood the design. The one exception is the compact layout below
  768px (`src/hooks/useIsCompact.js`), where a phone cannot fit both: a
  Request/Response switch shows one and flips to the response on send.
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

## Android

You need a JDK 17+, the Android SDK (platform 36+), the NDK
(`ndk;27.2.12479018`) and the Rust Android targets:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

Point `JAVA_HOME`, `ANDROID_HOME` and `NDK_HOME` at them, then:

```bash
bun run tauri android dev                 # emulator or USB device
bun run tauri android build --apk --aab   # release builds
```

The Android project lives in `src-tauri/gen/android` and is committed: the
theme, `MainActivity.kt` (system-bar insets), the signing block in
`app/build.gradle.kts` and the launcher icon are hand-edited, so do not
regenerate it with `tauri android init` without carrying those over.

The launcher icon is an adaptive icon: `res/drawable/ic_launcher_foreground.xml`
is the `>rip` path from `public/icon-source.svg` as a vector, scaled to 0.70 so
no launcher mask clips it, on `#0C0C0C`, with a monochrome layer for themed
icons. `tauri icon` generates its own Android icons (a full-bleed foreground
on a white background) and can copy them into this project, so after running
it, check `git status` and restore these with
`git checkout -- src-tauri/gen/android/app/src/main/res` if they changed.

- **Windows:** the CLI symlinks the Rust library into `jniLibs`, which needs
  [Developer Mode](https://learn.microsoft.com/windows/apps/get-started/enable-your-device-for-development)
  (or `SeCreateSymbolicLinkPrivilege`).
- **Signing:** release builds are signed when `RIP_KEYSTORE_PROPERTIES`
  points at a properties file (or `src-tauri/gen/android/keystore.properties`
  exists, git-ignored) naming `storeFile`, `storePassword`, `keyAlias` and
  `keyPassword`. Without one they come out unsigned. CI reads the
  `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`
  and `ANDROID_KEY_PASSWORD` secrets.
- **Testing on a phone:** turn on *Wireless debugging* in Developer options,
  choose *Pair device with pairing code*, then
  `adb pair <ip>:<pair-port> <code>` and `adb connect <ip>:<port>` (the
  connect port is the one shown on the Wireless debugging screen, not the
  pairing one). Install with `adb install -r <apk>`. A phone with an arm64
  CPU needs the `aarch64` build.
- **Android-only code paths** are behind `isMobile()` in
  `src/utils/platform.js`: file saving (`src/utils/saveFile.js`) and hiding
  the self-updater.

## Versioning and releases

The version lives in three files that must match: `package.json`,
`src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` (plus the badge at the
top of the README). Bump all of them together, move the CHANGELOG's
`[Unreleased]` entries under the new version, and push a `v<version>` tag to
run the release workflow.

Android derives its `versionCode` from that version
(`major × 1,000,000 + minor × 1,000 + patch`, so `1.1.0` is `1001000`). The
Play Store rejects an upload whose `versionCode` is not higher than the last
one, so never reuse or lower a version that has been uploaded.

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

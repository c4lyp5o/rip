/**
 * True inside the Android (or iOS) build of the app.
 *
 * The webview's user agent is enough here: the mobile builds run in the
 * system WebView, which always reports its OS, and this avoids pulling in
 * the os plugin for a single boolean.
 */
export const isMobile = () =>
	typeof navigator !== "undefined" &&
	/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

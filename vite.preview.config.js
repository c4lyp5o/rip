// Browser-preview build config.
//
// Swaps the Tauri SQLite layer for an in-memory stub so the UI can be
// inspected and screenshotted in a normal browser. The production config
// (vite.config.js) is untouched — `npm run build` never uses this file.
//
//   npm run preview:web
//
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const STUB = fileURLToPath(
	new URL("./dev-preview/ripDb.browser-stub.js", import.meta.url),
);
const HTTP_STUB = fileURLToPath(
	new URL("./dev-preview/http.browser-stub.js", import.meta.url),
);

// A plugin is used rather than resolve.alias because the app imports the DB
// module with RELATIVE paths ("./utils/ripDb"), which alias matching on the
// raw specifier does not catch.
const stubRipDb = {
	name: "rip-preview-stub-db",
	enforce: "pre",
	resolveId(source) {
		if (/utils\/ripDb(\.js)?$/.test(source)) return STUB;
		if (/@tauri-apps\/plugin-http$/.test(source)) return HTTP_STUB;
		return null;
	},
};

export default defineConfig({
	plugins: [stubRipDb, react(), tailwindcss()],
	server: {
		port: 4340,
		strictPort: true,
	},
});

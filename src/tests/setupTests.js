import { vi } from "vitest";
import React from "react";
import "@testing-library/jest-dom";

// Tauri plugins aren't available in jsdom; the plugin-sql Database calls
// invoke('plugin:sql|load') internally, so mock the module to return an
// in-memory stub instead of throwing "Cannot read properties of undefined (invoke)".
vi.mock("@tauri-apps/plugin-sql", () => ({
	default: {
		load: async () => ({
			execute: async () => {},
			batchExecute: async () => {},
			exec: async () => {},
			prepare: async () => {},
			transaction: async () => ({
				run: async () => {},
				finish: async () => {},
			}),
			select: async () => [],
		}),
	},
}));

window.React = React;

/**
 * The HTTP plugin is unavailable in jsdom. Mocking it with a real Response
 * lets the full request -> response round trip be exercised in a test:
 * sendRequest -> executeRequest -> fetch -> response pane.
 *
 * Individual tests override the implementation via the exported __mockFetch.
 */
export const __mockFetch = { impl: null };

vi.mock("@tauri-apps/plugin-http", () => ({
	fetch: async (url, options) => {
		if (__mockFetch.impl) return __mockFetch.impl(url, options);
		return new Response("{}", {
			status: 200,
			statusText: "OK",
			headers: { "content-type": "application/json", "content-length": "2" },
		});
	},
}));

/**
 * jsdom gives every element a zero height, so the real virtualizer renders
 * no rows and the JSON body would silently vanish from the DOM. Render every
 * row instead, so the response body is actually assertable.
 */
vi.mock("@tanstack/react-virtual", () => ({
	useVirtualizer: ({ count }) => ({
		getTotalSize: () => count * 20,
		getVirtualItems: () =>
			Array.from({ length: count }, (_, index) => ({
				index,
				key: index,
				start: index * 20,
				size: 20,
			})),
		measureElement: () => {},
		scrollToIndex: () => {},
	}),
}));


// Tauri plugins aren't available in jsdom; stub invoke so tabs that call
// initDb() (plugin:sql|load) resolve to an in-memory stub instead of throwing.
const noop = () => Promise.resolve({
	execute: () => Promise.resolve(),
	batchExecute: () => Promise.resolve(),
	exec: () => Promise.resolve(),
	prepare: () => Promise.resolve(),
	transaction: () => Promise.resolve(),
});
globalThis.__testStubDb = {
	load: async () => noop(),
};
globalThis.invoke = (...args) => {
	if (args[0] === "plugin:sql|load") return globalThis.__testStubDb.load(...args);
	return noop();
};

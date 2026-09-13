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

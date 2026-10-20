import { describe, it, expect, vi, beforeEach } from "vitest";

// Guard: mount the REAL entrypoint (src/main.jsx) and assert the app actually
// renders. The existing suites hand-wrap providers themselves, so a provider
// missing from main.jsx slips past them while the shipped app renders blank.
//
// Asserts the ErrorBoundary fallback is NOT showing, so a broken provider tree
// is caught here instead of as a blank window at runtime.
vi.mock("../utils/ripDb", () => {
	const stub = async () => [];
	return {
		initDb: async () => {},
		addToHistory: async () => {},
		getHistoryItems: stub,
		deleteHistoryItem: async () => {},
		clearHistory: async () => {},
		getSetting: async () => null,
		setSetting: async () => {},
		getCollectionsTree: stub,
		createCollection: async () => {},
		deleteCollection: async () => {},
		renameCollection: async () => {},
		createFolder: async () => {},
		deleteFolder: async () => {},
		renameFolder: async () => {},
		saveRequest: async () => {},
		deleteRequest: async () => {},
		updateRequest: async () => {},
		exportData: async () => ({}),
		importData: async () => {},
	};
});

describe("main.jsx entrypoint", () => {
	beforeEach(() => {
		document.body.innerHTML = '<div id="root"></div>';
		vi.resetModules();
	});

	it("renders the app into #root without hitting the error boundary", async () => {
		const errors = [];
		const onError = (e) => errors.push(String((e.error && e.error.message) || e.message));
		window.addEventListener("error", onError);
		try {
			await import("../main.jsx");
		} catch (e) {
			throw new Error(`main.jsx threw on import: ${e.message}`);
		}
		await new Promise((r) => setTimeout(r, 50));
		window.removeEventListener("error", onError);
		expect(errors).toEqual([]);
		expect(document.getElementById("root").innerHTML.length).toBeGreaterThan(0);
		expect(document.body.textContent).not.toMatch(/Something broke on startup/);
	});
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ripDb is mocked wholesale: named imports are resolved at module load, so
// EVERY export must exist here or the import throws before the test runs.
vi.mock("../../utils/ripDb", () => {
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

import App from "../../App";
import { RipProvider } from "../../context/RIPContext";
import { ToastProvider } from "../../context/ToastContext";

// Regression guards for the half-applied extraction of 330f9e4:
//  1. App must MOUNT (a stale `sidebarWidthRef` effect threw a ReferenceError
//     and blanked the window while build + tests stayed green).
//  2. The workspace shell must exist EXACTLY ONCE (App rendered both its own
//     inlined copy and WorkspacePanel's: two URL inputs, two Send buttons).
// This suite mounts the real root; the leaf-only suites cannot see either bug.
describe("App (root mount)", () => {
	it("mounts and renders the sidebar navigation", async () => {
		render(
			<RipProvider>
				<ToastProvider placement="bottom-right">
					<App />
				</ToastProvider>
			</RipProvider>,
		);

		expect(await screen.findByText("History")).toBeInTheDocument();
		expect(await screen.findByText("Collections")).toBeInTheDocument();
	});

	it("boots with a default tab and renders the request UI exactly once", async () => {
		render(
			<RipProvider>
				<ToastProvider placement="bottom-right">
					<App />
				</ToastProvider>
			</RipProvider>,
		);

		const urlInput = await screen.findByRole("textbox");
		expect(urlInput).toBeInTheDocument();
		expect(screen.getAllByRole("textbox")).toHaveLength(1);
		expect(screen.getAllByRole("button", { name: /send/i })).toHaveLength(1);
		expect(document.body.textContent).not.toMatch(/No Open Tabs/);
	});
});

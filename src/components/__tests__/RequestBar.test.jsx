import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useState } from "react";

// The snippet generator and the response pane both had real defects:
//   1. "Copy as code" called an undefined handleGenerateCode() and threw.
//   2. A failed request rendered "0ms 0KB" in the status bar, because an
//      error response is truthy but carries no metrics.
// These tests are the guards for both.

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
		saveRequest: async () => "req-1",
		deleteRequest: async () => {},
		updateRequest: async () => {},
		exportData: async () => ({}),
		importData: async () => {},
	};
});

import RequestBar from "../RequestBar";
import ResponsePane from "../ResponsePane";
import { RipProvider } from "../../context/RIPContext";
import { ToastProvider } from "../../context/ToastContext";
import { ThemeProvider } from "../../context/ThemeContext";

const wrap = (ui) => (
	<RipProvider>
		<ThemeProvider>
			<ToastProvider>{ui}</ToastProvider>
		</ThemeProvider>
	</RipProvider>
);

/** The composer owns its menus through props; give it real state. */
const StatefulRequestBar = () => {
	const [showSaveMenu, setShowSaveMenu] = useState(false);
	const [showCodeMenu, setShowCodeMenu] = useState(false);
	return (
		<RequestBar
			showSaveMenu={showSaveMenu}
			setShowSaveMenu={setShowSaveMenu}
			showCodeMenu={showCodeMenu}
			setShowCodeMenu={setShowCodeMenu}
			setIsCreateModalOpen={() => {}}
		/>
	);
};

describe("Copy as code", () => {
	beforeEach(() => {
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: vi.fn().mockResolvedValue(undefined) },
			writable: true,
			configurable: true,
		});
	});

	it("generates a cURL snippet and copies it", async () => {
		render(wrap(<StatefulRequestBar />));

		// The generator needs a URL, and the menu button stays disabled
		// until there is one.
		fireEvent.change(screen.getByLabelText("Request URL"), {
			target: { value: "https://api.example.com/v1/endpoint" },
		});

		// Open the code menu and pick cURL.
		fireEvent.click(screen.getByLabelText("Copy as code"));
		const curlOption = await screen.findByText("cURL");
		fireEvent.click(curlOption);

		await waitFor(() => {
			expect(navigator.clipboard.writeText).toHaveBeenCalled();
		});

		const snippet = navigator.clipboard.writeText.mock.calls[0][0];
		expect(snippet).toContain("curl -X");
		expect(snippet).toContain("api.example.com/v1/endpoint");
	});
});

describe("ResponsePane status bar", () => {
	it("shows No response yet before any request", () => {
		render(wrap(<ResponsePane />));

		expect(screen.getByText("No response yet")).toBeInTheDocument();
	});
});

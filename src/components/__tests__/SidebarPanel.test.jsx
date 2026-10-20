import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// The sidebar hosts the theme menu, which reads the theme DB. Mock the
// module so the test stays independent of Tauri.
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

import SidebarPanel from "../SidebarPanel";
import { ThemeProvider } from "../../context/ThemeContext";
import { ToastProvider } from "../../context/ToastContext";

const renderPanel = (props) =>
	render(
		<ThemeProvider>
			<ToastProvider>
				<SidebarPanel
					sidebarWidth={256}
					history={[]}
					collections={[]}
					handleLoadHistoryItemById={() => {}}
					handleLoadRequest={() => {}}
					confirmClearHistory={() => {}}
					confirmDeleteHistoryItem={() => {}}
					confirmDeleteCollection={() => {}}
					confirmDeleteRequest={() => {}}
					setIsCreateModalOpen={() => {}}
					isDraggingSidebar={false}
					setIsDraggingSidebar={() => {}}
					setIsSettingsModalOpen={() => {}}
					{...props}
				/>
			</ToastProvider>
		</ThemeProvider>,
	);

describe("SidebarPanel", () => {
	it("renders both labelled sections", () => {
		renderPanel();

		expect(screen.getByText("History")).toBeInTheDocument();
		expect(screen.getByText("Collections")).toBeInTheDocument();
	});

	it("shows No history yet placeholder when empty", () => {
		renderPanel();

		expect(screen.getByText("No history yet")).toBeInTheDocument();
	});

	it("hides the Clear all button when history is empty", () => {
		renderPanel();

		expect(
			screen.queryByRole("button", { name: /clear all/i }),
		).not.toBeInTheDocument();
	});

	it("shows a Clear all button when history has items", () => {
		renderPanel({
			history: [{ id: "1", method: "GET", url: "https://api.test.com" }],
		});

		expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument();
	});

	it("renders a history item with method and url", () => {
		renderPanel({
			history: [{ id: "1", method: "POST", url: "https://api.test.com" }],
		});

		// The scheme is stripped for display (it is 8 characters of noise in
		// a 224px rail) but the full URL stays in the title attribute.
		expect(screen.getByText("api.test.com")).toBeInTheDocument();
		expect(screen.getByText("POST")).toBeInTheDocument();
		expect(
			screen.getByTitle("https://api.test.com"),
		).toBeInTheDocument();
	});

	it("renders a collection item with its name", () => {
		renderPanel({
			collections: [
				{
					id: "c1",
					name: "API Endpoints",
					type: "collection",
					items: [],
				},
			],
		});

		expect(screen.getByText("API Endpoints")).toBeInTheDocument();
	});

	it("renders a settings button", () => {
		renderPanel();

		expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
	});

	it("renders a drag handle for resizing", () => {
		renderPanel();

		expect(screen.getByRole("separator", { name: /resize/i })).toBeInTheDocument();
	});
});

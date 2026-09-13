import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SidebarPanel from "../SidebarPanel";

const renderPanel = (props) =>
	render(
		<SidebarPanel
			sidebarWidth={256}
			activeSpace="history"
			setActiveSpace={() => {}}
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
		/>,
	);

describe("SidebarPanel", () => {
	it("renders workspace navigation items", () => {
		renderPanel();

		expect(screen.getByText("History")).toBeInTheDocument();
		expect(screen.getByText("Collections")).toBeInTheDocument();
	});

	it("shows Recent Requests header in history space", () => {
		renderPanel();

		expect(screen.getByText("Recent Requests")).toBeInTheDocument();
	});

	it("shows No history yet placeholder when empty", () => {
		renderPanel();

		expect(screen.getByText("No history yet")).toBeInTheDocument();
	});

	it("shows a Clear All button when history has items", () => {
		renderPanel({
			history: [{ id: "1", method: "GET", url: "https://api.test.com" }],
		});

		expect(screen.getByRole("button", { name: "Clear All" })).toBeInTheDocument();
	});

	it("renders a history item with method and url", () => {
		renderPanel({
			history: [{ id: "1", method: "POST", url: "https://api.test.com" }],
		});

		expect(screen.getByText("https://api.test.com")).toBeInTheDocument();
		expect(screen.getByText("POST")).toBeInTheDocument();
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
			activeSpace: "collections",
		});

		expect(screen.getByText("API Endpoints")).toBeInTheDocument();
	});

	it("renders a settings button", () => {
		renderPanel();

		expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
	});

	it("renders a drag handle for resizing", () => {
		renderPanel();

		expect(screen.getByRole("img", { name: /resize/i })).toBeInTheDocument();
	});
});

export default SidebarPanel;

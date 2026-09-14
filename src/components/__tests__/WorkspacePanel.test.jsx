import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RipProvider } from "../../context/RIPContext";
import { ToastProvider } from "../../context/ToastContext";
import WorkspacePanel from "../WorkspacePanel";

const renderPanel = (props) =>
	render(
		<RipProvider>
			<ToastProvider>
				<WorkspacePanel
					workspaceTabs={[]}
					activeWorkspaceTabId={null}
					visibleTabs={[]}
					activeWorkspace={null}
					state={{}}
					handleDeleteTab={() => {}}
					handleRenameTab={() => {}}
					showSaveMenu={false}
					setShowSaveMenu={() => {}}
					showCodeMenu={false}
					setShowCodeMenu={() => {}}
					setIsCreateModalOpen={() => {}}
					dispatch={() => {}}
					{...props}
				/>
			</ToastProvider>
		</RipProvider>,
	);

describe("WorkspacePanel", () => {
	it("renders empty state when no active workspace", () => {
		renderPanel({
			workspaceTabs: [],
			activeWorkspaceTabId: null,
			visibleTabs: [],
			activeWorkspace: null,
			state: { networkDelay: 0 },
		});

		expect(screen.getByText("No Open Tabs")).toBeInTheDocument();
		expect(screen.getByText("Your workspace is empty.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /create new/i })).toBeInTheDocument();
	});

	it("renders tab items from workspaceTabs prop", () => {
		const tabs = [
			{ id: "1", name: "GET /users", method: "GET", url: "https://api.test.com" },
			{ id: "2", name: "POST /users", method: "POST", url: "https://api.test.com" },
		];

		renderPanel({
			workspaceTabs: tabs,
			activeWorkspaceTabId: "1",
			visibleTabs: [],
			activeWorkspace: {
				id: "1",
				name: "GET /users",
				method: "GET",
				url: "https://api.test.com",
				savedRequestId: null,
				activeSubTab: "response",
			},
			state: { networkDelay: 0 },
		});

		expect(screen.getByText("GET /users")).toBeInTheDocument();
		expect(screen.getByText("POST /users")).toBeInTheDocument();
	});

	it("dispatches ADD_WORKSPACE_TAB when create button clicked", () => {
		const dispatch = vi.fn();

		renderPanel({
			workspaceTabs: [],
			activeWorkspaceTabId: null,
			visibleTabs: [],
			activeWorkspace: null,
			state: { networkDelay: 0 },
			dispatch,
		});

		screen.getByRole("button", { name: /create new/i }).click();

		expect(dispatch).toHaveBeenCalledWith({
			type: "ADD_WORKSPACE_TAB",
		});
	});

	it("shows network throttling badge when state.networkDelay > 0", () => {
		renderPanel({
			workspaceTabs: [],
			activeWorkspaceTabId: null,
			visibleTabs: [],
			activeWorkspace: {
				id: "1",
				name: "GET /users",
				method: "GET",
				url: "https://api.test.com",
				savedRequestId: null,
				activeSubTab: "response",
			},
			state: { networkDelay: 200 },
		});

		expect(screen.getByText("200MS")).toBeInTheDocument();
	});

	it("hides network throttling badge when state.networkDelay is 0", () => {
		renderPanel({
			workspaceTabs: [],
			activeWorkspaceTabId: null,
			visibleTabs: [],
			activeWorkspace: {
				id: "1",
				name: "GET /users",
				method: "GET",
				url: "https://api.test.com",
				savedRequestId: null,
				activeSubTab: "response",
			},
			state: { networkDelay: 0 },
		});

		expect(screen.queryByText(/network throttling/i)).not.toBeInTheDocument();
	});
});

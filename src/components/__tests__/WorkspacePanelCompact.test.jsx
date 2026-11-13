import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RipProvider } from "../../context/RIPContext";
import { ToastProvider } from "../../context/ToastContext";
import WorkspacePanel from "../WorkspacePanel";

const tab = { id: "1", name: "GET /users", method: "GET", url: "https://api.test.com" };

const panel = (props) => (
	<RipProvider>
		<ToastProvider>
			<WorkspacePanel
				workspaceTabs={[props.activeWorkspace ?? tab]}
				activeWorkspaceTabId="1"
				activeWorkspace={tab}
				state={{ networkDelay: 0 }}
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
	</RipProvider>
);

describe("WorkspacePanel on compact screens", () => {
	it("has no pane switch or menu button on wide screens", () => {
		render(panel({}));

		expect(screen.queryByRole("tab", { name: "Response" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Open sidebar" })).not.toBeInTheDocument();
	});

	it("shows one pane at a time with a Request/Response switch", () => {
		render(panel({ isCompact: true }));

		const requestTab = screen.getByRole("tab", { name: "Request" });
		const responseTab = screen.getByRole("tab", { name: "Response" });
		expect(requestTab).toHaveAttribute("aria-selected", "true");

		fireEvent.click(responseTab);

		expect(responseTab).toHaveAttribute("aria-selected", "true");
		expect(requestTab).toHaveAttribute("aria-selected", "false");
	});

	it("opens the sidebar drawer from the menu button", () => {
		const onOpenSidebar = vi.fn();
		render(panel({ isCompact: true, onOpenSidebar }));

		fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));

		expect(onOpenSidebar).toHaveBeenCalledOnce();
	});

	it("switches to the response pane when a request starts", () => {
		const { rerender } = render(panel({ isCompact: true }));

		rerender(panel({ isCompact: true, activeWorkspace: { ...tab, isFetching: true } }));

		expect(screen.getByRole("tab", { name: "Response" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});
});

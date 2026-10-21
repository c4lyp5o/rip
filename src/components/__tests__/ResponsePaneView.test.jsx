import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// The Body/Headers toggle is hidden for a failed request. If the user had
// switched to Headers on a previous response, the error used to stay hidden
// behind an empty headers table with no way back to Body.

const ripState = {
	workspaceTabs: [
		{
			id: "t1",
			isFetching: false,
			response: {
				type: "text",
				status: 200,
				statusText: "OK",
				content: "hello",
				headers: [{ key: "x-test", value: "1" }],
			},
		},
	],
	activeWorkspaceTabId: "t1",
};

vi.mock("../../context/RIPContext", () => ({
	useRip: () => ({ state: ripState, sendRequest: () => {} }),
	useRipActions: () => ({ sendRequest: () => {} }),
}));

import ResponsePane from "../ResponsePane";
import { ToastProvider } from "../../context/ToastContext";

describe("ResponsePane view after a failed request", () => {
	it("shows the error even when Headers was the last selected view", () => {
		const { rerender } = render(
			<ToastProvider>
				<ResponsePane />
			</ToastProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Headers/ }));
		expect(screen.getByText("x-test")).toBeInTheDocument();

		ripState.workspaceTabs = [
			{
				id: "t1",
				isFetching: false,
				response: { type: "error", content: "connection refused" },
			},
		];
		rerender(
			<ToastProvider>
				<ResponsePane />
			</ToastProvider>,
		);

		expect(screen.getByText("Request failed")).toBeInTheDocument();
		expect(screen.getByText(/connection refused/)).toBeInTheDocument();
		expect(screen.queryByText("No headers received")).not.toBeInTheDocument();
	});
});

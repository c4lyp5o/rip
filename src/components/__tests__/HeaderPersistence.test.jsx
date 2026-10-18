import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

// Full end-to-end reproduction of the reported bug:
// "changing header from saved request does not persist".
// Mount the REAL App, open a saved request from the sidebar tree, edit a
// header, press Ctrl+S WITH FOCUS IN THE HEADER INPUT — then assert the DB
// update call happened and carries the edited value.
const updateRequestMock = vi.hoisted(() => vi.fn(async () => {}));
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
		// one saved request in one collection
		getCollectionsTree: async () => [
			{
				id: "col-1",
				name: "Test API",
				type: "collection",
				items: [
					{
						id: "req-1",
						collection_id: "col-1",
						type: "request",
						name: "Get Users",
						method: "GET",
						url: "https://api.test/users",
						headers: [{ id: "h1", key: "X-Old", value: "old", active: true }],
						queries: [],
						body: "",
						auth: { type: "none" },
					},
				],
			},
		],
		createCollection: async () => {},
		deleteCollection: async () => {},
		renameCollection: async () => {},
		createFolder: async () => {},
		deleteFolder: async () => {},
		renameFolder: async () => {},
		saveRequest: async () => "req-new",
		deleteRequest: async () => {},
		updateRequest: updateRequestMock,
		exportData: async () => ({}),
		importData: async () => {},
	};
});

import App from "../../App";
import { RipProvider } from "../../context/RIPContext";
import { ToastProvider } from "../../context/ToastContext";

const openSavedRequest = async () => {
	// switch the sidebar to the Collections space
	const collectionsBtn = await screen.findByText("Collections", {}, { timeout: 3000 });
	fireEvent.click(collectionsBtn);
	// wait for the collection to load, expand it, click the request
	const col = await screen.findByText("Test API", {}, { timeout: 3000 });
	fireEvent.click(col);
	const req = await screen.findByText("Get Users", {}, { timeout: 3000 });
	fireEvent.click(req);
	// the tab should now be open — Headers tab visible in the tab strip
	await screen.findByText("Headers", {}, { timeout: 3000 });
	fireEvent.click(screen.getByText("Headers"));
};

describe("saved-request header persistence (reported bug)", () => {
	it("Ctrl+S from inside the header input persists the edited header", async () => {
		render(
			<RipProvider>
				<ToastProvider placement="bottom-right">
					<App />
				</ToastProvider>
			</RipProvider>,
		);

		await openSavedRequest();

		// the saved request's header must be visible in the Headers tab
		const keyInput = await screen.findByDisplayValue("X-Old");
		const valueInput = screen.getByDisplayValue("old");

		// edit the header value (focus is now INSIDE the input)
		fireEvent.change(valueInput, { target: { value: "new-value" } });
		fireEvent.keyDown(valueInput, { key: "s", ctrlKey: true, bubbles: true, cancelable: true });

		// the DB update must have fired with the edited value
		expect(updateRequestMock).toHaveBeenCalledTimes(1);
		const [calledId, calledPayload] = updateRequestMock.mock.calls[0];
		expect(calledId).toBe("req-1");
		expect(calledPayload.headers).toEqual([
			{ id: "h1", key: "X-Old", value: "new-value", active: true },
		]);
	});

	it("the Save button click path also persists (regression guard)", async () => {
		updateRequestMock.mockClear();
		render(
			<RipProvider>
				<ToastProvider placement="bottom-right">
					<App />
				</ToastProvider>
			</RipProvider>,
		);

		await openSavedRequest();

		const valueInput = await screen.findByDisplayValue("old");
		fireEvent.change(valueInput, { target: { value: "via-button" } });

		// click the main Save button (title "Update Request" for saved requests)
		const saveBtn = screen.getByTitle("Update Request");
		fireEvent.click(saveBtn);

		expect(updateRequestMock).toHaveBeenCalledTimes(1);
		const [, payload] = updateRequestMock.mock.calls[0];
		expect(payload.headers[0].value).toBe("via-button");
	});
});
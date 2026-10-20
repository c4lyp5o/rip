import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import { flushSync } from "react-dom";

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
		exportData: async () => {},
		importData: async () => {},
	};
});

import App from "../../App";
import { RipProvider } from "../../context/RIPContext";
import { ThemeProvider } from "../../context/ThemeContext";
import { ToastProvider } from "../../context/ToastContext";
import { __mockFetch } from "../../tests/setupTests";

/**
 * The round trip.
 *
 * The Studio redesign moved the response from a tab to a permanent pane, and
 * moved the request section selection from "response" to "params". Both
 * changes touch the send path, so the send path is exercised end to end
 * here: type a URL, press Send, and assert the response actually lands in
 * the response pane with its status, timing and body.
 */
describe("request round trip", () => {
	beforeEach(() => {
		__mockFetch.impl = async () =>
			new Response(
				JSON.stringify({ id: "ch_123", amount: 2000, status: "succeeded" }),
				{
					status: 200,
					statusText: "OK",
					headers: {
						"content-type": "application/json",
						"content-length": "46",
					},
				},
			);
	});

	const renderApp = () =>
		render(
			<RipProvider>
				<ThemeProvider>
					<ToastProvider placement="bottom-right">
						<App />
					</ToastProvider>
				</ThemeProvider>
			</RipProvider>,
		);

	it("shows the response in the permanent response pane after sending", async () => {
		renderApp();

		// The app is ready once the composer is on screen.
		const url = await screen.findByLabelText("Request URL");

		fireEvent.change(url, {
			target: { value: "https://api.stripe.com/v1/charges" },
		});

		fireEvent.click(screen.getByTitle("Send request (Ctrl+Enter)"));

		// The response pane is a landmark in its own right, not a tab.
		const responsePane = await screen.findByLabelText("Response");

		// The status bar must show the status.
		await waitFor(() => {
			expect(within(responsePane).getByText(/200 OK/)).toBeInTheDocument();
		});

		// ...and the body.
		await waitFor(() => {
			expect(responsePane.textContent).toMatch(/ch_123/);
		});

		// The request pane must still be showing the REQUEST, not having
		// swapped to a response view.
		const requestPane = screen.getByLabelText("Request");
		expect(requestPane).toBeInTheDocument();
		expect(requestPane.textContent).toMatch(/Params/);
	});

	it("keeps the request section selected while the response updates", async () => {
		renderApp();

		const url = await screen.findByLabelText("Request URL");
		fireEvent.change(url, {
			target: { value: "https://api.stripe.com/v1/charges" },
		});

		// Switch to the Headers section BEFORE sending.
		fireEvent.click(screen.getByRole("tab", { name: /headers/i }));
		await waitFor(() => {
			expect(screen.getByRole("tab", { name: /headers/i })).toHaveAttribute(
				"aria-selected",
				"true",
			);
		});

		fireEvent.click(screen.getByTitle("Send request (Ctrl+Enter)"));

		const responsePane = await screen.findByLabelText("Response");
		await waitFor(() => {
			expect(within(responsePane).getByText(/200 OK/)).toBeInTheDocument();
		});

		// Sending must NOT yank the user out of the section they were editing.
		expect(screen.getByRole("tab", { name: /headers/i })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});

	it("reports a failed request without inventing metrics", async () => {
		// A network-level failure. The response object is truthy but carries
		// no status, time or size — the status bar must say so rather than
		// showing "0ms 0KB".
		__mockFetch.impl = async () => {
			throw new Error("net::ERR_CONNECTION_REFUSED");
		};

		renderApp();

		const url = await screen.findByLabelText("Request URL");
		fireEvent.change(url, {
			target: { value: "https://error.test/v1/charges" },
		});

		fireEvent.click(screen.getByTitle("Send request (Ctrl+Enter)"));

		const responsePane = await screen.findByLabelText("Response");
		// The status bar is the h2's row. The error body below it has its
		// own "Request Failed" heading, so the query must be scoped.
		const statusBar = responsePane.querySelector("h2").parentElement;

		await waitFor(() => {
			expect(within(statusBar).getByText("Request failed")).toBeInTheDocument();
		});

		// No misleading zeroed metrics.
		expect(statusBar.textContent).not.toMatch(/0ms/);
		expect(statusBar.textContent).not.toMatch(/0KB/);

		// A Body/Headers toggle is meaningless without a response.
		expect(responsePane.textContent).not.toMatch(/\bHeaders\b/);

		// The underlying reason is still shown, and there is a way out.
		expect(responsePane.textContent).toMatch(/ERR_CONNECTION_REFUSED/);
		expect(responsePane.textContent).toMatch(/Retry/i);
	});
});

/**
 * The composer menus, exercised through the REAL App.
 *
 * These menus are closed by a document-level "click outside" handler in
 * App.jsx. React flushes that effect inside the very click dispatch that
 * opens the menu, so a listener attached synchronously received the
 * opening click and closed the menu immediately — the button looked
 * dead. An isolated component test cannot catch this, because it has no
 * App-level handler; the menu has to be driven through the real tree.
 */
describe("composer menus", () => {
	beforeEach(() => {
		__mockFetch.impl = async () =>
			new Response("{}", {
				status: 200,
				statusText: "OK",
				headers: { "content-type": "application/json", "content-length": "2" },
			});
	});

	/**
	 * Dispatch a click the way a BROWSER does.
	 *
	 * testing-library's fireEvent wraps the dispatch in act(), which
	 * flushes React's effects only AFTER the event has finished
	 * propagating up to document. A real browser flushes them
	 * mid-propagation, so a document listener registered by an effect
	 * receives the very click that opened the menu. The body-level
	 * flushSync below reproduces that ordering — without it, this test
	 * passes even with the bug present.
	 */
	const browserClick = async (element) => {
		const flush = () => flushSync(() => {});
		document.body.addEventListener("click", flush);
		try {
			await act(async () => {
				element.click();
			});
		} finally {
			document.body.removeEventListener("click", flush);
		}
	};

	const renderApp = () =>
		render(
			<RipProvider>
				<ThemeProvider>
					<ToastProvider placement="bottom-right">
						<App />
					</ToastProvider>
				</ThemeProvider>
			</RipProvider>,
		);

	const setUrl = async () => {
		const url = await screen.findByLabelText("Request URL");
		fireEvent.change(url, {
			target: { value: "https://api.stripe.com/v1/charges" },
		});
		return url;
	};

	it("opens the Copy as code menu and lists the generators", async () => {
		renderApp();
		await setUrl();

		await browserClick(screen.getByLabelText("Copy as code"));

		// The menu must STAY open.
		expect(await screen.findByText("Copy as")).toBeInTheDocument();
		expect(screen.getByText("cURL")).toBeInTheDocument();
		expect(screen.getByText("Node.js (Fetch)")).toBeInTheDocument();
		expect(screen.getByText("Python (Requests)")).toBeInTheDocument();
	});

	it("closes the Copy as code menu on an outside click", async () => {
		renderApp();
		await setUrl();

		await browserClick(screen.getByLabelText("Copy as code"));
		expect(await screen.findByText("Copy as")).toBeInTheDocument();

		// Clicking away closes it.
		await browserClick(screen.getByLabelText("Request"));
		await waitFor(() => {
			expect(screen.queryByText("Copy as")).not.toBeInTheDocument();
		});
	});

	it("opens the Save request menu", async () => {
		renderApp();
		await setUrl();

		await browserClick(screen.getByLabelText("Save request"));

		// The save menu must STAY open and offer the save options.
		expect(await screen.findByText("Save to collection")).toBeInTheDocument();
		expect(screen.getByText("New collection")).toBeInTheDocument();
	});
});

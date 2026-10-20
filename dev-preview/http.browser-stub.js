/**
 * Browser preview stub for the Tauri HTTP plugin.
 *
 * ONLY used by `vite.preview.config.js` so the app can be exercised in a
 * normal browser, where the Tauri HTTP plugin is absent. The real app always
 * uses @tauri-apps/plugin-http.
 *
 * It returns a small realistic JSON payload so the response pane can be
 * inspected end to end — status, timing, size and the syntax-highlighted
 * body.
 */

const PAYLOADS = {
	charges: {
		object: "list",
		url: "/v1/charges",
		has_more: false,
		data: [
			{
				id: "ch_3PxL8k2eZvKYlo2C",
				object: "charge",
				amount: 2000,
				currency: "usd",
				status: "succeeded",
				captured: true,
				created: 1792000000,
				metadata: { order_id: "6735" },
			},
			{
				id: "ch_3PxL9k3fAwKYlo2C",
				object: "charge",
				amount: 4500,
				currency: "usd",
				status: "succeeded",
				captured: true,
				created: 1792000600,
				metadata: { order_id: "6736" },
			},
		],
	},
};

const makeResponse = (url) => {
	// A magic host lets the failure path be exercised in the browser.
	if (url.includes("error.test") || url.includes("/fail")) {
		throw new Error("net::ERR_CONNECTION_REFUSED");
	}

	const body = JSON.stringify(
		url.includes("charges") ? PAYLOADS.charges : { ok: true, url },
		null,
		2,
	);
	return {
		status: 200,
		statusText: "OK",
		headers: new Map([
			["content-type", "application/json"],
			["content-length", String(body.length)],
			["x-request-id", "req_stub_0001"],
		]),
		json: async () => JSON.parse(body),
		text: async () => body,
		blob: async () => new Blob([body]),
	};
};

export const fetch = async (url, options) => {
	// A touch of latency so the loading state is observable.
	await new Promise((r) => setTimeout(r, 220));

	if (options?.signal?.aborted) {
		const err = new Error("Request cancelled");
		err.name = "AbortError";
		throw err;
	}

	return makeResponse(String(url));
};

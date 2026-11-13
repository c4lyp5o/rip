import { describe, it, expect } from "vitest";
import { version } from "../../../package.json";
import { DEFAULT_USER_AGENT } from "../userAgent";
import { normalizeHeaders } from "../requestNormalization";

describe("DEFAULT_USER_AGENT", () => {
	it("carries the app version from package.json", () => {
		expect(DEFAULT_USER_AGENT).toBe(`RIP/${version} (REST In Peace Client)`);
	});

	it("is what a request without stored headers gets", () => {
		const ua = normalizeHeaders(null).find((h) => h.key === "User-Agent");
		expect(ua.value).toBe(DEFAULT_USER_AGENT);
	});
});

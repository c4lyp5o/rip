import { describe, it, expect } from "vitest";
import {
	normalizeHeaders,
	normalizeQueries,
	getRequestFingerprint,
	isSameRequest,
} from "../requestNormalization";

describe("normalizeHeaders", () => {
	it("normalizes array of headers", () => {
		const out = normalizeHeaders(JSON.stringify([{ key: "X", value: "1", active: false }]));
		expect(out).toHaveLength(1);
		expect(out[0]).toMatchObject({ key: "X", value: "1", active: false });
		expect(out[0].id).toBeTruthy();
	});

	it("converts object-form headers", () => {
		const out = normalizeHeaders(JSON.stringify({ "X-Test": "abc" }));
		expect(out).toHaveLength(1);
		expect(out[0]).toMatchObject({ key: "X-Test", value: "abc", active: true });
	});

	it("falls back to defaults for invalid input", () => {
		const out = normalizeHeaders("not-json");
		expect(out.length).toBe(3);
		expect(out.map((h) => h.key)).toEqual(["Content-Type", "Accept", "User-Agent"]);
	});
});

describe("normalizeQueries", () => {
	it("normalizes array of queries", () => {
		const out = normalizeQueries(JSON.stringify([{ key: "q", value: "1" }]));
		expect(out).toHaveLength(1);
		expect(out[0]).toMatchObject({ key: "q", value: "1", active: true });
	});

	it("returns empty for invalid input", () => {
		expect(normalizeQueries("nope")).toEqual([]);
	});
});

describe("getRequestFingerprint / isSameRequest", () => {
	it("produces identical fingerprints for equivalent requests", () => {
		const a = { method: "GET", url: "http://x", headers: [], queries: [], body: "", auth: { type: "none" } };
		const b = { method: "GET", url: "http://x", headers: [], queries: [], body: "", auth: { type: "none" } };
		expect(getRequestFingerprint(a)).toBe(getRequestFingerprint(b));
		expect(isSameRequest(a, b)).toBe(true);
	});

	it("differs when method changes", () => {
		const a = { method: "GET", url: "http://x", headers: [], queries: [], body: "", auth: { type: "none" } };
		const b = { ...a, method: "POST" };
		expect(isSameRequest(a, b)).toBe(false);
	});
});

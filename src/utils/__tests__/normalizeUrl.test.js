import { describe, it, expect } from "vitest";
import { normalizeUrlInput } from "../normalizeUrl";

describe("normalizeUrlInput", () => {
	it("returns empty for blank input", () => {
		expect(normalizeUrlInput("   ")).toBe("");
	});

	it("keeps explicit http/https schemes", () => {
		expect(normalizeUrlInput("http://example.com")).toBe("http://example.com");
		expect(normalizeUrlInput("HTTPS://example.com/path")).toBe("HTTPS://example.com/path");
	});

	it("defaults to https for remote hosts", () => {
		expect(normalizeUrlInput("example.com")).toBe("https://example.com");
		expect(normalizeUrlInput("api.example.com/v1")).toBe("https://api.example.com/v1");
	});

	it("defaults to http for localhost/loopback", () => {
		expect(normalizeUrlInput("localhost:3000")).toBe("http://localhost:3000");
		expect(normalizeUrlInput("127.0.0.1:8080/api")).toBe("http://127.0.0.1:8080/api");
		expect(normalizeUrlInput("0.0.0.0")).toBe("http://0.0.0.0");
	});

	it("trims surrounding whitespace", () => {
		expect(normalizeUrlInput("  example.com  ")).toBe("https://example.com");
	});
});

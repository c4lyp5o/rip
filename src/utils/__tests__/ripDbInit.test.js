import { describe, it, expect, vi } from "vitest";

const load = vi.hoisted(() =>
	vi.fn(async () => ({
		execute: vi.fn(async () => {}),
		select: vi.fn(async () => [{ value: "1" }]),
	})),
);

vi.mock("@tauri-apps/plugin-sql", () => ({ default: { load } }));

import { initDb } from "../ripDb";

describe("initDb", () => {
	it("opens the database once when called concurrently at startup", async () => {
		const [a, b, c] = await Promise.all([initDb(), initDb(), initDb()]);

		expect(load).toHaveBeenCalledOnce();
		expect(a).toBe(b);
		expect(b).toBe(c);
	});
});

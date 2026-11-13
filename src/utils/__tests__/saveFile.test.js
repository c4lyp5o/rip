import { describe, it, expect, vi, beforeEach } from "vitest";

const mobile = vi.hoisted(() => ({ value: false }));
const save = vi.hoisted(() => vi.fn());
const writeFile = vi.hoisted(() => vi.fn());

vi.mock("../platform", () => ({ isMobile: () => mobile.value }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ save }));
vi.mock("@tauri-apps/plugin-fs", () => ({ writeFile }));

import { saveBlob } from "../saveFile";

describe("saveBlob", () => {
	beforeEach(() => {
		mobile.value = false;
		save.mockReset();
		writeFile.mockReset();
		URL.createObjectURL = vi.fn(() => "blob:mock");
		URL.revokeObjectURL = vi.fn();
	});

	it("clicks a download link on desktop", async () => {
		const click = vi
			.spyOn(HTMLAnchorElement.prototype, "click")
			.mockImplementation(() => {});

		const saved = await saveBlob(new Blob(["{}"]), "backup.json");

		expect(saved).toBe("backup.json");
		expect(click).toHaveBeenCalledOnce();
		expect(save).not.toHaveBeenCalled();
		click.mockRestore();
	});

	it("writes the bytes where the save dialog points on mobile", async () => {
		mobile.value = true;
		save.mockResolvedValue("content://downloads/backup.json");

		const saved = await saveBlob(new Blob(["abc"]), "backup.json");

		expect(saved).toBe("backup.json");
		expect(save).toHaveBeenCalledWith({ defaultPath: "backup.json" });
		const [path, bytes] = writeFile.mock.calls[0];
		expect(path).toBe("content://downloads/backup.json");
		expect(Array.from(bytes)).toEqual([97, 98, 99]);
	});

	it("returns null and writes nothing when the dialog is cancelled", async () => {
		mobile.value = true;
		save.mockResolvedValue(null);

		expect(await saveBlob(new Blob(["abc"]), "backup.json")).toBeNull();
		expect(writeFile).not.toHaveBeenCalled();
	});
});

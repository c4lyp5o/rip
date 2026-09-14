import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import useGlobalShortcuts from "../useGlobalShortcuts";

const renderShortcuts = (overrides = {}) =>
	renderHook(() =>
		useGlobalShortcuts({
			activeWorkspace: { id: "1", url: "https://api.test", savedRequestId: "req-1" },
			activeWorkspaceTabId: "1",
			isFetching: false,
			sendRequest: vi.fn(),
			handleUpdateRequest: vi.fn(),
			handleDeleteTab: vi.fn(),
			setShowSaveMenu: vi.fn(),
			dispatch: vi.fn(),
			...overrides,
		}),
	);

const press = (key, target, opts = {}) => {
	const e = new KeyboardEvent("keydown", { key, ctrlKey: true, bubbles: true, cancelable: true, ...opts });
	target.dispatchEvent(e);
	return e;
};

describe("useGlobalShortcuts — Postman-style behaviour from editable fields", () => {
	it("fires save/send handlers while focus is inside an input", () => {
		const handleUpdateRequest = vi.fn();
		const sendRequest = vi.fn();
		renderHook(() =>
			useGlobalShortcuts({
				activeWorkspace: { id: "1", url: "https://api.test", savedRequestId: "req-1" },
				activeWorkspaceTabId: "1",
				isFetching: false,
				sendRequest,
				handleUpdateRequest,
				handleDeleteTab: vi.fn(),
				setShowSaveMenu: vi.fn(),
				dispatch: vi.fn(),
			}),
		);

		const input = document.createElement("input");
		document.body.appendChild(input);

		// Ctrl+S from the input must reach handleUpdateRequest
		press("s", input);
		expect(handleUpdateRequest).toHaveBeenCalledTimes(1);

		// Ctrl+Enter from the input must reach sendRequest
		press("Enter", input);
		expect(sendRequest).toHaveBeenCalledTimes(1);
	});

	it("still guards window shortcuts (Ctrl+W / Ctrl+T) from inputs", () => {
		const handleDeleteTab = vi.fn();
		const dispatch = vi.fn();
		renderHook(() =>
			useGlobalShortcuts({
				activeWorkspace: { id: "1", url: "https://api.test", savedRequestId: "req-1" },
				activeWorkspaceTabId: "1",
				isFetching: false,
				sendRequest: vi.fn(),
				handleUpdateRequest: vi.fn(),
				handleDeleteTab,
				setShowSaveMenu: vi.fn(),
				dispatch,
			}),
		);

		const textarea = document.createElement("textarea");
		document.body.appendChild(textarea);

		press("w", textarea);
		press("t", textarea);

		expect(handleDeleteTab).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
	});
});
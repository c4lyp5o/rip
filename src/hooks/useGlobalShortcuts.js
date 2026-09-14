import { useEffect } from "react";

const isEditableElement = (target) =>
	target instanceof HTMLElement &&
	("INPUT" === target.tagName ||
		"TEXTAREA" === target.tagName ||
		"SELECT" === target.tagName ||
		target.isContentEditable);

const useGlobalShortcuts = ({
	activeWorkspace,
	activeWorkspaceTabId,
	isFetching,
	sendRequest,
	handleUpdateRequest,
	handleDeleteTab,
	setShowSaveMenu,
	dispatch,
}) => {
	useEffect(() => {
		const handleGlobalKeyDown = (e) => {
			const target = e.target;
			const isModifier = e.ctrlKey || e.metaKey;

			// Save and Send are REQUEST actions: they must fire even while the
			// user is typing in a field. "edit a header, press Ctrl+S" is the
			// primary save flow — an input must never swallow it.
			if (isModifier && e.key.toLowerCase() === "s") {
				e.preventDefault();
				if (!activeWorkspace) return;
				if (activeWorkspace.savedRequestId) {
					handleUpdateRequest();
				} else {
					setShowSaveMenu(true);
				}
				return;
			}

			if (isModifier && e.key === "Enter") {
				e.preventDefault();
				if (!isFetching && activeWorkspace?.url) {
					sendRequest();
				}
				return;
			}

			// Window/tab management from inside a text field is never intended:
			// keep the guard for those.
			if (isEditableElement(target)) {
				return;
			}

			if (isModifier && e.key.toLowerCase() === "w") {
				e.preventDefault();
				if (activeWorkspaceTabId) {
					handleDeleteTab(activeWorkspaceTabId);
				}
			}

			if (isModifier && e.key.toLowerCase() === "t") {
				e.preventDefault();
				dispatch({ type: "ADD_WORKSPACE_TAB" });
			}
		};

		window.addEventListener("keydown", handleGlobalKeyDown);
		return () => window.removeEventListener("keydown", handleGlobalKeyDown);
	}, [
		activeWorkspace,
		activeWorkspaceTabId,
		isFetching,
		sendRequest,
		handleUpdateRequest,
		handleDeleteTab,
		setShowSaveMenu,
		dispatch,
	]);
};

export default useGlobalShortcuts;

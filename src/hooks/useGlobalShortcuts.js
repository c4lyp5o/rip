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
			if (isEditableElement(target)) {
				return;
			}

			const isModifier = e.ctrlKey || e.metaKey;

			if (isModifier && e.key.toLowerCase() === "s") {
				e.preventDefault();
				if (!activeWorkspace) return;
				if (activeWorkspace.savedRequestId) {
					handleUpdateRequest();
				} else {
					setShowSaveMenu(true);
				}
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

			if (isModifier && e.key === "Enter") {
				e.preventDefault();
				if (!isFetching && activeWorkspace?.url) {
					sendRequest();
				}
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

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRip } from "./context/RIPContext";
import { useToast } from "./context/ToastContext";
import {
	deleteHistoryItem,
	clearHistory,
	deleteCollection,
	deleteRequest,
	updateRequest,
} from "./utils/ripDb";
import { isSameRequest } from "./utils/requestNormalization";
import "./App.css";

import SidebarPanel from "./components/SidebarPanel";
import WorkspacePanel from "./components/WorkspacePanel";
import ConfirmDeletionModal from "./components/modals/ConfirmDeletionModal";
import CreateCollectionModal from "./components/modals/CreateCollectionModal";
import SettingsModal from "./components/modals/SettingsModal";
import useSidebarResize from "./hooks/useSidebarResize";
import useGlobalShortcuts from "./hooks/useGlobalShortcuts";
import useUpdateRequest from "./hooks/useUpdateRequest";

/**
 * The app shell: sidebar on the left, workspace on the right.
 *
 * The theme lives in the sidebar footer (see ThemeMenu), so the top-level
 * component carries no theme UI of its own.
 */
function App() {
	const { state, dispatch, refreshCollections, sendRequest } = useRip();
	const { workspaceTabs, activeWorkspaceTabId, history, collections } = state;
	const { showToast } = useToast();

	// UI Local State
	const [showSaveMenu, setShowSaveMenu] = useState(false);
	const [showCodeMenu, setShowCodeMenu] = useState(false);

	// modals
	const [confirmDeletionModal, setConfirmDeletionModal] = useState({
		isOpen: false,
		title: "",
		message: "",
		onConfirm: null,
	});
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

	// sidebar
	const sidebarWidth = state.sidebarWidth ?? 224;
	const { isDraggingSidebar, setIsDraggingSidebar } = useSidebarResize(
		sidebarWidth,
		dispatch,
	);

	const activeWorkspace = useMemo(
		() => workspaceTabs.find((tab) => tab.id === activeWorkspaceTabId),
		[workspaceTabs, activeWorkspaceTabId],
	);

	const isFetching = activeWorkspace?.isFetching ?? false;

	const handleUpdateRequest = useUpdateRequest();

	const handleRenameTab = async (tabId, newName) => {
		dispatch({ type: "SET_TAB_NAME", payload: { id: tabId, name: newName } });

		const tabToRename = workspaceTabs.find((t) => t.id === tabId);

		if (tabToRename?.savedRequestId) {
			try {
				await updateRequest(tabToRename.savedRequestId, {
					name: newName,
					method: tabToRename.method,
					url: tabToRename.url,
					headers: tabToRename.headers,
					queries: tabToRename.queries,
					body: tabToRename.body,
					auth: tabToRename.auth,
				});

				await refreshCollections();
			} catch (error) {
				if (import.meta.env.DEV)
					console.error("Failed to auto-save renamed tab:", error);
				showToast("Failed to save new name to database", "error");
			}
		}
	};

	const handleDeleteTab = useCallback(
		(tabId) => {
			dispatch({ type: "DELETE_WORKSPACE_TAB", payload: tabId });
		},
		[dispatch],
	);

	const handleLoadRequest = useCallback(
		(historyItem) => {
			const existingTab = workspaceTabs.find((tab) => {
				if (historyItem.collection_id && tab.savedRequestId === historyItem.id)
					return true;
				if (historyItem.id && tab.savedRequestId === historyItem.id)
					return true;
				return isSameRequest(tab, historyItem);
			});

			if (existingTab) {
				dispatch({
					type: "SET_ACTIVE_WORKSPACE_TAB",
					payload: existingTab.id,
				});
				return;
			}

			const newTabId = crypto.randomUUID();
			dispatch({
				type: "ADD_WORKSPACE_TAB_FROM_DB",
				payload: {
					id: newTabId,
					data: historyItem,
				},
			});
		},
		[dispatch, workspaceTabs],
	);

	const handleLoadHistoryItemById = useCallback(
		(id) => {
			const item = history.find((h) => h.id === id);
			if (item) handleLoadRequest(item);
		},
		[history, handleLoadRequest],
	);

	const confirmDeleteHistoryItem = (item) => {
		setConfirmDeletionModal({
			isOpen: true,
			title: "Delete History Item",
			message: `Remove this ${item.method} request to ${item.url} from history?`,
			onConfirm: async () => {
				try {
					await deleteHistoryItem(item.id);
					dispatch({ type: "DELETE_HISTORY_ITEM", payload: item.id });
					setConfirmDeletionModal({ isOpen: false });
					showToast("History item deleted", "success");
				} catch (error) {
					if (import.meta.env.DEV)
						console.error("Failed to delete history item:", error);
					showToast("Failed to delete history item", "error");
				}
			},
		});
	};

	const confirmClearHistory = () => {
		setConfirmDeletionModal({
			isOpen: true,
			title: "Clear All History",
			message:
				"Are you sure you want to delete all request history? This action cannot be undone.",
			onConfirm: async () => {
				try {
					await clearHistory();
					dispatch({ type: "CLEAR_HISTORY" });
					setConfirmDeletionModal({ isOpen: false });
					showToast("History cleared", "success");
				} catch (error) {
					if (import.meta.env.DEV)
						console.error("Failed to clear history:", error);
					showToast("Failed to clear history", "error");
				}
			},
		});
	};

	const confirmDeleteCollection = (col) => {
		setConfirmDeletionModal({
			isOpen: true,
			title: "Delete Collection",
			message: `Are you sure you want to delete "${col.name}"? All requests inside will be lost.`,
			onConfirm: async () => {
				try {
					await deleteCollection(col.id);
					await refreshCollections();
					setConfirmDeletionModal({ isOpen: false });
					showToast("Collection deleted", "success");
				} catch (error) {
					if (import.meta.env.DEV)
						console.error("Failed to delete collection:", error);
					showToast("Failed to delete collection", "error");
				}
			},
		});
	};

	const confirmDeleteRequest = (req) => {
		setConfirmDeletionModal({
			isOpen: true,
			title: "Delete Request",
			message: `Are you sure you want to delete "${req.name}"?`,
			onConfirm: async () => {
				try {
					await deleteRequest(req.id);
					await refreshCollections();
					setConfirmDeletionModal({ isOpen: false });
					showToast("Request deleted", "success");
				} catch (error) {
					if (import.meta.env.DEV)
						console.error("Failed to delete request:", error);
					showToast("Failed to delete request", "error");
				}
			},
		});
	};

	// Close the Save / Copy-as menus when the user clicks away.
	//
	// The listener is attached on the NEXT TICK, not synchronously. React
	// flushes this effect inside the same click dispatch that opened the
	// menu, so a listener attached here would receive that very click and
	// close the menu the instant it opened. Deferring the attach lets the
	// opening click finish propagating first; the next click anywhere else
	// closes the menu as intended.
	useEffect(() => {
		if (!showSaveMenu && !showCodeMenu) return;

		const handleClick = () => {
			setShowSaveMenu(false);
			setShowCodeMenu(false);
		};

		const attach = setTimeout(() => {
			document.addEventListener("click", handleClick);
		}, 0);

		return () => {
			clearTimeout(attach);
			document.removeEventListener("click", handleClick);
		};
	}, [showSaveMenu, showCodeMenu]);

	useGlobalShortcuts({
		activeWorkspace,
		activeWorkspaceTabId,
		isFetching,
		sendRequest,
		handleUpdateRequest,
		handleDeleteTab,
		setShowSaveMenu,
		dispatch,
	});

	if (!state.settingsLoaded) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-stone-950 text-stone-400">
				Loading…
			</div>
		);
	}

	return (
		<div className="flex h-screen w-full bg-stone-950 text-stone-100 font-sans overflow-hidden">
			{/* 1. SIDEBAR */}
			<SidebarPanel
				sidebarWidth={sidebarWidth}
				history={history}
				collections={collections}
				handleLoadHistoryItemById={handleLoadHistoryItemById}
				handleLoadRequest={handleLoadRequest}
				confirmClearHistory={confirmClearHistory}
				confirmDeleteHistoryItem={confirmDeleteHistoryItem}
				confirmDeleteCollection={confirmDeleteCollection}
				confirmDeleteRequest={confirmDeleteRequest}
				setIsCreateModalOpen={setIsCreateModalOpen}
				isDraggingSidebar={isDraggingSidebar}
				setIsDraggingSidebar={setIsDraggingSidebar}
				setIsSettingsModalOpen={setIsSettingsModalOpen}
			/>

			{/* 2. WORKSPACE */}
			<WorkspacePanel
				workspaceTabs={workspaceTabs}
				activeWorkspaceTabId={activeWorkspaceTabId}
				activeWorkspace={activeWorkspace}
				state={state}
				handleDeleteTab={handleDeleteTab}
				handleRenameTab={handleRenameTab}
				showSaveMenu={showSaveMenu}
				setShowSaveMenu={setShowSaveMenu}
				showCodeMenu={showCodeMenu}
				setShowCodeMenu={setShowCodeMenu}
				setIsCreateModalOpen={setIsCreateModalOpen}
				dispatch={dispatch}
			/>

			{/* 3. MODALS */}
			{confirmDeletionModal.isOpen && (
				<ConfirmDeletionModal
					confirmDeletionModal={confirmDeletionModal}
					setConfirmDeletionModal={setConfirmDeletionModal}
				/>
			)}

			{isCreateModalOpen && (
				<CreateCollectionModal setIsCreateModalOpen={setIsCreateModalOpen} />
			)}

			{isSettingsModalOpen && (
				<SettingsModal setIsSettingsModalOpen={setIsSettingsModalOpen} />
			)}
		</div>
	);
}

export default App;

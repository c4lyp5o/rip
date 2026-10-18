import { useCallback, useEffect, useMemo, useState } from "react";
import { useRip } from "./context/RIPContext";
import { useToast } from "./context/ToastContext";
import {
	deleteHistoryItem,
	clearHistory,
	// getCollectionsTree, // later
	deleteCollection,
	deleteRequest,
	updateRequest,
} from "./utils/ripDb";
import { isSameRequest } from "./utils/requestNormalization";
import {
	AlignLeft,
	Code2,
	Key,
	Package,
	Terminal,
} from "lucide-react";
import "./App.css";

import SidebarPanel from "./components/SidebarPanel";
import WorkspacePanel from "./components/WorkspacePanel";
import ConfirmDeletionModal from "./components/modals/ConfirmDeletionModal";
import CreateCollectionModal from "./components/modals/CreateCollectionModal";
import SettingsModal from "./components/modals/SettingsModal";
import useSidebarResize from "./hooks/useSidebarResize";
import useGlobalShortcuts from "./hooks/useGlobalShortcuts";

const TABS_CONFIG = [
	{ id: "auth", label: "Auth", icon: Key },
	{ id: "headers", label: "Headers", icon: Package },
	{ id: "queries", label: "Queries", icon: Code2 },
	{ id: "body", label: "Body", icon: AlignLeft },
	{ id: "response", label: "Response", icon: Terminal },
];

// --- Main App Component ---

function App() {
	const { state, dispatch, refreshCollections, sendRequest } = useRip();
	const { workspaceTabs, activeWorkspaceTabId, history, collections } = state;
	const { showToast } = useToast();

	// UI Local State
	const [activeSpace, setActiveSpace] = useState("history");
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
	const { isDraggingSidebar, setIsDraggingSidebar } = useSidebarResize(sidebarWidth, dispatch);

	// experimental
	// const [urlDraft, setUrlDraft] = useState("");
	// const [bodyDraft, setBodyDraft] = useState("");

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	const isFetching = activeWorkspace?.isFetching ?? false;

	const visibleTabs = useMemo(() => {
		if (!activeWorkspace) return [];

		return TABS_CONFIG.filter((tab) => {
			if (tab.id === "body" && activeWorkspace.method === "GET") {
				return false;
			}
			return true;
		});
	}, [activeWorkspace]);

	// --- Handlers ---

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

	const handleUpdateRequest = async () => {
		if (!activeWorkspace || !activeWorkspace.savedRequestId) return;

		const tab = activeWorkspace;

		try {
			await updateRequest(tab.savedRequestId, {
				name: tab.name || tab.url || "Untitled",
				method: tab.method,
				url: tab.url,
				headers: tab.headers,
				queries: tab.queries,
				body: tab.body,
				auth: tab.auth,
			});
			await refreshCollections();
			showToast("Saved changes", "success");
		} catch (error) {
			if (import.meta.env.DEV)
				console.error("Failed to update saved request:", error);
			showToast("Failed to update request", "error");
		}
	};

	useEffect(() => {
		if (!showSaveMenu && !showCodeMenu) return;
		const handleClick = () => {
			setShowSaveMenu(false);
			setShowCodeMenu(false);
		};
		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
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
			<div className="flex h-screen w-full items-center justify-center bg-stone-950 text-stone-300">
				Loading…
			</div>
		);
	}

	return (
		<div className="flex h-screen w-full bg-stone-950 text-stone-100 font-sans overflow-hidden">
			{/* 1. SIDEBAR */}
			<div
				style={{ width: sidebarWidth }}
				className="flex flex-col shrink-0 border-r border-stone-800 bg-stone-900 relative transition-[width] duration-0"
			>
				<SidebarPanel
					sidebarWidth={sidebarWidth}
					activeSpace={activeSpace}
					setActiveSpace={setActiveSpace}
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
			</div>

			<WorkspacePanel
				workspaceTabs={workspaceTabs}
				activeWorkspaceTabId={activeWorkspaceTabId}
				visibleTabs={visibleTabs}
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
			{/* Confirm Dialog Modal */}
			{confirmDeletionModal.isOpen && (
				<ConfirmDeletionModal
					confirmDeletionModal={confirmDeletionModal}
					setConfirmDeletionModal={setConfirmDeletionModal}
				/>
			)}

			{/* Create Collection Modal */}
			{isCreateModalOpen && (
				<CreateCollectionModal setIsCreateModalOpen={setIsCreateModalOpen} />
			)}

			{/* Settings Modal */}
			{isSettingsModalOpen && (
				<SettingsModal setIsSettingsModalOpen={setIsSettingsModalOpen} />
			)}
		</div>
	);
}

export default App;

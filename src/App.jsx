import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { useRip } from "./context/RIPContext";
import { useToast } from "./context/ToastContext";
import { generateSnippet } from "./utils/snippetGenerator";
import {
	deleteHistoryItem,
	clearHistory,
	// getCollectionsTree, // later
	createCollection,
	deleteCollection,
	saveRequest,
	updateRequest,
	deleteRequest,
	exportData,
	importData,
} from "./utils/historyDb";
import {
	Send,
	Save,
	Globe,
	Code2,
	AlignLeft,
	Package,
	Terminal,
	Copy,
	ChevronDown,
	ChevronRight,
	Download,
	FileBox,
	HardDrive,
	Zap,
	Check,
	Loader2,
	History,
	Layout,
	Plus,
	X,
	Layers,
	Folder,
	Upload,
	Key,
	Settings,
	Trash2,
} from "lucide-react";
import "./App.css";

import JsonViewer from "./components/JsonViewer";
import ErrorDisplay from "./components/Error";

const TABS_CONFIG = [
	{ id: "auth", label: "Auth", icon: Key },
	{ id: "headers", label: "Headers", icon: Package },
	{ id: "queries", label: "Queries", icon: Code2 },
	{ id: "body", label: "Body", icon: AlignLeft },
	{ id: "response", label: "Response", icon: Terminal },
];

// --- Sub-components for UI Structure ---

const SidebarItem = memo(({ icon: Icon, label, active, onClick }) => (
	<button
		type="button"
		onClick={onClick}
		className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
			active
				? "bg-stone-800 text-emerald-400 font-medium"
				: "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
		}`}
	>
		<Icon className="w-3.5 h-3.5" />
		<span className="truncate">{label}</span>
	</button>
));

const HistoryItem = memo(({ item, onLoadRequest, onDeleteRequest }) => (
	<div
		key={item.id}
		className="group relative flex items-center w-full gap-2 px-2 py-1 text-[11px] text-left rounded hover:bg-stone-800 transition-colors border border-transparent hover:border-stone-700"
		title={item.url}
	>
		<button
			type="button"
			onClick={() => onLoadRequest(item.id)}
			className="flex items-center min-w-0 flex-1 gap-2 text-left"
		>
			<span
				className={`
          shrink-0 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border
          ${getMethodClass(item.method)}
        `}
			>
				{item.method}
			</span>

			<span className="flex-1 truncate text-stone-400 font-mono group-hover:text-stone-200 transition-colors">
				{item.url}
			</span>
		</button>

		<button
			type="button"
			onClick={() => onDeleteRequest(item)}
			className="hidden group-hover:block p-1 text-stone-500 hover:text-red-400 rounded transition-all shrink-0"
			title="Delete from history"
		>
			<Trash2 className="w-3 h-3" />
		</button>
	</div>
));

const TreeItem = memo(
	({ item, onLoadRequest, onDeleteCollection, onDeleteRequest }) => {
		const [isOpen, setIsOpen] = useState(false);

		if (item.type === "request") {
			return (
				<div className="group flex items-center justify-between px-4 py-1.5 text-xs text-stone-400 hover:bg-stone-800 ml-4 border-l border-stone-800 cursor-pointer">
					<button
						type="button"
						onClick={() => onLoadRequest(item)}
						className="flex items-center gap-2 flex-1 min-w-0 hover:text-emerald-400"
					>
						<span
							className={`font-mono text-[10px] shrink-0 ${getMethodColor(item.method)}`}
						>
							{item.method}
						</span>
						<span className="truncate">{item.name}</span>
					</button>
					<button
						type="button"
						onClick={(e) => onDeleteRequest(item)}
						className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-red-400 rounded transition-all"
						title="Delete Request"
					>
						<Trash2 className="w-3 h-3" />
					</button>
				</div>
			);
		}

		return (
			<div className="flex flex-col">
				<div className="group flex items-center justify-between px-2 py-2 text-sm text-stone-300 hover:bg-stone-800 cursor-pointer select-none">
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						className="flex items-center gap-2 flex-1 min-w-0"
					>
						{isOpen ? (
							<ChevronDown className="w-3 h-3 shrink-0" />
						) : (
							<ChevronRight className="w-3 h-3 shrink-0" />
						)}

						{item.type === "collection" ? (
							<Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
						) : (
							<Folder className="w-3.5 h-3.5 text-stone-500 shrink-0" />
						)}

						<span className="font-medium truncate">{item.name}</span>
					</button>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDeleteCollection(item);
						}}
						className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-red-400 rounded transition-all"
						title="Delete Collection"
					>
						<Trash2 className="w-3 h-3" />
					</button>
				</div>

				{isOpen && (
					<div className="pl-2 border-l border-stone-800 ml-3">
						{item.items?.map((child) => (
							<TreeItem
								key={child.id}
								item={child}
								onLoadRequest={onLoadRequest}
								onDeleteCollection={onDeleteCollection}
								onDeleteRequest={onDeleteRequest}
							/>
						))}
						{(!item.items || item.items.length === 0) && (
							<div className="pl-4 py-1 text-[10px] text-stone-600 italic">
								Empty
							</div>
						)}
					</div>
				)}
			</div>
		);
	},
);

const TabItem = ({ id, method, name, active, onClose, onRename }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(name);

	useEffect(() => {
		if (!isEditing) setEditValue(name);
	}, [name, isEditing]);

	const methodColors = {
		GET: "text-emerald-400",
		POST: "text-amber-400",
		PATCH: "text-sky-400",
		PUT: "text-blue-400",
		DELETE: "text-red-400",
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			e.currentTarget.blur();
		} else if (e.key === "Escape") {
			setEditValue(name);
			setIsEditing(false);
		}
	};

	const handleBlur = () => {
		setIsEditing(false);
		const finalName = editValue.trim() || "Untitled";
		if (finalName !== name) {
			onRename(id, finalName);
		} else {
			setEditValue(name);
		}
	};

	return (
		<div
			className={`group flex items-center gap-1.5 px-2 py-1.5 text-[11px] border-r border-stone-800 min-w-24 max-w-44 cursor-pointer select-none ${
				active
					? "bg-stone-800 text-stone-100 border-t border-t-emerald-500"
					: "bg-stone-900/50 text-stone-500 hover:bg-stone-800"
			}`}
		>
			<span
				className={`font-mono font-bold text-[10px] shrink-0 ${methodColors[method] || "text-stone-400"}`}
			>
				{method}
			</span>

			{isEditing ? (
				<input
					// biome-ignore lint/a11y/noAutofocus: required for inline editing UX
					autoFocus
					type="text"
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					className="flex-1 min-w-0 bg-stone-950 text-stone-200 outline-none px-1 rounded-sm text-[11px]"
				/>
			) : (
				// biome-ignore lint/a11y/noStaticElementInteractions: nanti
				<span
					onDoubleClick={() => setIsEditing(true)}
					className="truncate flex-1 hover:text-emerald-400 transition-colors"
					title="Double-click to rename"
				>
					{name}
				</span>
			)}

			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onClose();
				}}
				className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-stone-700 rounded shrink-0"
			>
				<X className="w-3 h-3" />
			</button>
		</div>
	);
};

const CompactSelect = ({ value, onChange, options, className = "" }) => (
	<div className={`relative h-full flex items-center ${className}`}>
		<select
			value={value}
			onChange={onChange}
			className="h-full bg-transparent text-stone-200 pl-2 pr-6 text-xs font-semibold focus:outline-none cursor-pointer appearance-none z-10"
		>
			{options.map((opt) => (
				<option key={opt} value={opt} className="bg-stone-800">
					{opt}
				</option>
			))}
		</select>
		<ChevronDown className="w-3 h-3 text-stone-500 absolute right-2 pointer-events-none" />
	</div>
);

const getMethodClass = (method) => {
	switch (method) {
		case "GET":
			return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
		case "POST":
			return "text-amber-400 bg-amber-500/10 border-amber-500/20";
		case "PATCH":
			return "text-sky-400 bg-sky-500/10 border-sky-500/20";
		case "PUT":
			return "text-blue-400 bg-blue-500/10 border-blue-500/20";
		case "DELETE":
			return "text-red-400 bg-red-500/10 border-red-500/20";
		default:
			return "text-stone-400 bg-stone-500/10 border-stone-500/20";
	}
};

const getMethodColor = (method) => {
	switch (method) {
		case "GET":
			return "text-emerald-400";
		case "POST":
			return "text-amber-400";
		case "PATCH":
			return "text-sky-400";
		case "PUT":
			return "text-blue-400";
		case "DELETE":
			return "text-red-400";
		default:
			return "text-stone-400";
	}
};

const BlobPreview = ({ blob, contentType, filename }) => {
	const { showToast } = useToast();

	const formatSize = (bytes) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const handleDownload = () => {
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		if (filename) {
			a.download = `${filename}`;
		} else {
			const extension = contentType.split("/")[1] || "bin";
			a.download = `rip-${crypto.randomUUID().replace(/-/g, "")}.${extension}`;
		}
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		showToast(`File downloaded successfully as ${a.download}!`);
	};

	if (!blob) return null;

	return (
		<div className="flex flex-col items-center justify-center h-full p-8 text-center select-none">
			{/* Icon Circle */}
			<div className="w-24 h-24 bg-stone-800/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-stone-700/50">
				<HardDrive className="w-10 h-10 text-emerald-500" />
			</div>

			{/* Title */}
			<h3 className="text-xl font-medium text-stone-200 mb-2">
				Binary Data Received
			</h3>

			{/* File Details */}
			<div className="flex items-center gap-4 text-sm text-stone-500 mb-8 bg-stone-900/50 px-4 py-2 rounded-lg border border-stone-800">
				<div className="flex items-center gap-2">
					<FileBox className="w-4 h-4" />
					<span className="font-mono">
						{blob.type || "application/octet-stream"}
					</span>
				</div>
				<div className="w-px h-4 bg-stone-700"></div>
				<span className="font-mono">{formatSize(blob.size)}</span>
			</div>

			{/* Download Button */}
			<button
				type="button"
				onClick={handleDownload}
				className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
			>
				<Download className="w-4 h-4" />
				<span>Download File</span>
			</button>
		</div>
	);
};

// --- Main App Component ---

function App() {
	const { state, dispatch, fetcherRef, refreshHistory, refreshCollections } =
		useRip();
	const { showToast } = useToast();
	const { methods, workspaceTabs, activeWorkspaceTabId, history, collections } =
		state;

	// UI Local State
	const [activeSpace, setActiveSpace] = useState("history");
	const [copied, setCopied] = useState(false);
	const [responseView, setResponseView] = useState("body");

	const [showSaveMenu, setShowSaveMenu] = useState(false);

	const [confirmModal, setConfirmModal] = useState({
		isOpen: false,
		title: "",
		message: "",
		onConfirm: null,
	});
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [newCollectionName, setNewCollectionName] = useState("");
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

	const [sidebarWidth, setSidebarWidth] = useState(224);
	const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);

	const [showCodeMenu, setShowCodeMenu] = useState(false);

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

	const handleFetch = async () => {
		if (!activeWorkspace || activeWorkspace.isFetching) return;
		dispatch({ type: "SET_ACTIVE_SUB_TAB", payload: "response" });
		setResponseView("body");
		fetcherRef.current(activeWorkspace, state.networkDelay);
	};

	const handleFormatBody = () => {
		try {
			const formattedBody = JSON.stringify(
				JSON.parse(activeWorkspace.body.replace(/\n{3,}/g, "\n\n").trim()),
				// if using url draft
				// JSON.parse(bodyDraft.replace(/\n{3,}/g, "\n\n").trim()),
				null,
				2,
			);
			// if using url draft
			// setBodyDraft(formattedBody);
			dispatch({ type: "SET_BODY", payload: formattedBody });
			showToast("JSON formatted successfully", "success");
		} catch (error) {
			console.error("Error formatting JSON:", error);
			showToast("Invalid JSON: Cannot format", "error");
		}
	};

	const handleCopy = async () => {
		if (!activeWorkspace.response) return;
		try {
			const textToCopy =
				activeWorkspace.response.type === "json"
					? JSON.stringify(activeWorkspace.response.content, null, 2)
					: activeWorkspace.response.content;
			await navigator.clipboard.writeText(textToCopy);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (err) {
			if (import.meta.env.DEV)
				console.error("Failed to copy response to clipboard:", err);
		}
	};

	const handleGenerateCode = async (language, languageName) => {
		if (!activeWorkspace || !activeWorkspace.url) return;
		try {
			const code = generateSnippet(language, activeWorkspace);
			await navigator.clipboard.writeText(code);
			showToast(`Copied ${languageName} snippet!`, "success");
			setShowCodeMenu(false);
		} catch (err) {
			if (import.meta.env.DEV) console.error("Failed to generate code:", err);
			showToast("Failed to generate code snippet", "error");
		}
	};

	const handleDeleteTab = (tabId) => {
		dispatch({ type: "DELETE_WORKSPACE_TAB", payload: tabId });
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !isFetching) {
			e.preventDefault();
			handleFetch();
		}
	};

	const handleLoadRequest = (historyItem) => {
		const newTabId = crypto.randomUUID();
		dispatch({
			type: "ADD_WORKSPACE_TAB_FROM_DB",
			payload: {
				id: newTabId,
				data: historyItem,
			},
		});
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: nanti
	const handleLoadHistoryItemById = useCallback(
		(id) => {
			const item = history.find((h) => h.id === id);
			if (item) handleLoadRequest(item);
		},
		[history],
	);

	const confirmDeleteHistoryItem = (item) => {
		setConfirmModal({
			isOpen: true,
			title: "Delete History Item",
			message: `Remove this ${item.method} request to ${item.url} from history?`,
			onConfirm: async () => {
				try {
					await deleteHistoryItem(item.id);
					dispatch({ type: "DELETE_HISTORY_ITEM", payload: item.id });
					setConfirmModal({ isOpen: false });
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
		setConfirmModal({
			isOpen: true,
			title: "Clear All History",
			message:
				"Are you sure you want to delete all request history? This action cannot be undone.",
			onConfirm: async () => {
				try {
					await clearHistory();
					dispatch({ type: "CLEAR_HISTORY" });
					setConfirmModal({ isOpen: false });
					showToast("History cleared", "success");
				} catch (error) {
					if (import.meta.env.DEV)
						console.error("Failed to clear history:", error);
					showToast("Failed to clear history", "error");
				}
			},
		});
	};

	const handleCreateCollection = async (e) => {
		if (e) e.preventDefault();
		if (!newCollectionName.trim()) return;

		try {
			await createCollection(newCollectionName.trim());
			setNewCollectionName("");
			setIsCreateModalOpen(false);
			await refreshCollections();
			showToast("Collection created", "success");
		} catch (error) {
			if (import.meta.env.DEV)
				console.error("Failed to create collection:", error);
			showToast("Failed to create collection", "error");
		}
	};

	const handleSaveToCollection = async (collectionId) => {
		if (!activeWorkspace) return;

		const tab = activeWorkspace;

		try {
			const newId = await saveRequest(collectionId, null, {
				name: tab.name || tab.url || "Untitled",
				method: tab.method,
				url: tab.url,
				headers: tab.headers,
				queries: tab.queries,
				body: tab.body,
				auth: tab.auth,
			});

			dispatch({
				type: "SET_SAVED_REQUEST_ID",
				payload: { tabId: tab.id, savedRequestId: newId },
			});

			await refreshCollections();
			showToast("Saved to collection", "success");
		} catch (error) {
			if (import.meta.env.DEV)
				console.error("Failed to save request to collection:", error);
			showToast("Failed to save request", "error");
		}
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

	const confirmDeleteCollection = (col) => {
		setConfirmModal({
			isOpen: true,
			title: "Delete Collection",
			message: `Are you sure you want to delete "${col.name}"? All requests inside will be lost.`,
			onConfirm: async () => {
				try {
					await deleteCollection(col.id);
					await refreshCollections();
					setConfirmModal({ isOpen: false });
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
		setConfirmModal({
			isOpen: true,
			title: "Delete Request",
			message: `Are you sure you want to delete "${req.name}"?`,
			onConfirm: async () => {
				try {
					await deleteRequest(req.id);
					await refreshCollections();
					setConfirmModal({ isOpen: false });
					showToast("Request deleted", "success");
				} catch (error) {
					if (import.meta.env.DEV)
						console.error("Failed to delete request:", error);
					showToast("Failed to delete request", "error");
				}
			},
		});
	};

	const handleExportData = async () => {
		try {
			const data = await exportData();
			const blob = new Blob([JSON.stringify(data, null, 2)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `rip-backup-${new Date().toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);
			showToast(`Backup file downloaded as ${a.download}!`, "success");
		} catch (error) {
			if (import.meta.env.DEV) console.error("Failed to export data:", error);
			showToast("Failed to export data", "error");
		}
	};

	const handleImportData = (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const text = event.target?.result;
				if (typeof text !== "string") {
					throw new Error("Invalid file content");
				}

				const fromFile = JSON.parse(text);
				await importData(fromFile);
				await refreshHistory();
				await refreshCollections();
				setIsSettingsModalOpen(false);
				showToast("Data imported successfully", "success");
			} catch (err) {
				if (import.meta.env.DEV) console.error("Failed to import data:", err);
				showToast("Failed to import data", "error");
			}
		};
		reader.readAsText(file);
		e.target.value = null;
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

	useEffect(() => {
		const handleMouseMove = (e) => {
			if (!isDraggingSidebar) return;
			const newWidth = Math.max(160, Math.min(e.clientX, 600));
			setSidebarWidth(newWidth);
		};

		const handleMouseUp = () => {
			setIsDraggingSidebar(false);
		};

		if (isDraggingSidebar) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
			document.body.style.userSelect = "none";
			document.body.style.cursor = "col-resize";
		} else {
			document.body.style.userSelect = "";
			document.body.style.cursor = "";
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.body.style.userSelect = "";
			document.body.style.cursor = "";
		};
	}, [isDraggingSidebar]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: nanti
	useEffect(() => {
		const handleGlobalKeyDown = (e) => {
			const isModifier = e.ctrlKey || e.metaKey;

			// Save Request (Ctrl/Cmd + S)
			if (isModifier && e.key.toLowerCase() === "s") {
				e.preventDefault();
				if (!activeWorkspace) return;
				if (activeWorkspace.savedRequestId) {
					handleUpdateRequest();
				} else {
					setShowSaveMenu(true);
				}
			}

			// Close Tab (Ctrl/Cmd + W)
			if (isModifier && e.key.toLowerCase() === "w") {
				e.preventDefault();
				if (activeWorkspaceTabId) {
					handleDeleteTab(activeWorkspaceTabId);
				}
			}

			// New Tab (Ctrl/Cmd + T)
			if (isModifier && e.key.toLowerCase() === "t") {
				e.preventDefault();
				dispatch({ type: "ADD_WORKSPACE_TAB" });
			}

			// Send Request (Ctrl/Cmd + Enter)
			if (isModifier && e.key === "Enter") {
				e.preventDefault();
				if (!isFetching && activeWorkspace?.url) {
					handleFetch();
				}
			}
		};

		window.addEventListener("keydown", handleGlobalKeyDown);
		return () => window.removeEventListener("keydown", handleGlobalKeyDown);
	}, [activeWorkspace, activeWorkspaceTabId, isFetching]);

	// experimental
	// useEffect(() => {
	// 	setUrlDraft(activeWorkspace?.url ?? "");
	// 	setBodyDraft(activeWorkspace?.body ?? "");
	// }, [activeWorkspaceTabId]);

	return (
		<div className="flex h-screen w-full bg-stone-950 text-stone-100 font-sans overflow-hidden">
			{/* 1. SIDEBAR */}
			<div
				style={{ width: sidebarWidth }}
				className="flex flex-col shrink-0 border-r border-stone-800 bg-stone-900 relative transition-[width] duration-0"
			>
				{/** biome-ignore lint/a11y/noStaticElementInteractions: nanti */}
				<div
					onMouseDown={() => setIsDraggingSidebar(true)}
					className="absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-50 group flex justify-center"
				>
					{/* Visible highlight line on hover/drag */}
					<div
						className={`w-0.5 h-full transition-colors ${
							isDraggingSidebar
								? "bg-emerald-500"
								: "group-hover:bg-emerald-500/50"
						}`}
					/>
				</div>
				<div className="p-2 space-y-0.5">
					<div className="text-[10px] font-semibold text-stone-500 px-2 uppercase tracking-wider mb-1">
						Workspace
					</div>
					<SidebarItem
						icon={History}
						label="History"
						active={activeSpace === "history"}
						onClick={() => setActiveSpace("history")}
					/>
					<SidebarItem
						icon={Layout}
						label="Collections"
						active={activeSpace === "collections"}
						onClick={() => setActiveSpace("collections")}
					/>

					<div className="mt-4">
						<div className="text-xs font-semibold text-stone-500 px-3 uppercase tracking-wider mb-2">
							{activeSpace === "history" ? "Recent Requests" : "Collections"}
						</div>
						{/* History */}
						{activeSpace === "history" && (
							<div className="flex flex-col gap-1 w-full">
								{history.length === 0 && (
									<div className="px-3 py-4 text-xs text-stone-600 text-center italic">
										No collections yet
									</div>
								)}
								{history.length > 0 && (
									<div className="flex justify-end px-2 mb-1">
										<button
											type="button"
											onClick={confirmClearHistory}
											className="flex items-center gap-1 text-[10px] text-stone-500 hover:text-red-400 transition-colors"
										>
											<Trash2 className="w-3 h-3" />
											<span>Clear All</span>
										</button>
									</div>
								)}
								{history.map((item) => (
									<HistoryItem
										key={item.id}
										item={item}
										onLoadRequest={handleLoadHistoryItemById}
										onDeleteRequest={confirmDeleteHistoryItem}
									/>
								))}
							</div>
						)}

						{/* Collections */}
						{activeSpace === "collections" && (
							<div className="flex flex-col gap-1 w-full">
								<button
									type="button"
									onClick={() => setIsCreateModalOpen(true)}
									className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-500 hover:text-emerald-400 hover:bg-stone-800 rounded-md transition-colors"
								>
									<Plus className="w-3 h-3" />
									<span>New Collection</span>
								</button>
								{collections.length === 0 && (
									<div className="px-3 py-4 text-xs text-stone-600 text-center italic">
										No collections yet
									</div>
								)}
								{collections.map((col) => (
									<TreeItem
										key={col.id}
										item={col}
										onLoadRequest={handleLoadRequest}
										onDeleteCollection={confirmDeleteCollection}
										onDeleteRequest={confirmDeleteRequest}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Sidebar Footer */}
				<div className="mt-auto px-1 py-0.5 border-t border-stone-800 flex items-center justify-between text-stone-500">
					<button
						type="button"
						onClick={() => setIsSettingsModalOpen(true)}
						className="p-1.5 hover:bg-stone-800 rounded"
					>
						<Settings className="w-3.5 h-3.5" />
					</button>
					<span className="text-[10px]">v1.0.0</span>
				</div>
			</div>

			{/* 2. MAIN CONTENT AREA */}
			<div className="flex-1 flex flex-col min-w-0 bg-stone-900">
				{/* Tab Navigation */}
				<div className="flex items-center bg-stone-950 border-b border-stone-800">
					<div
						className="flex overflow-x-auto no-scrollbar scroll-smooth"
						onWheel={(e) => {
							e.currentTarget.scrollLeft += e.deltaY;
						}}
					>
						{workspaceTabs.length > 0 &&
							workspaceTabs.map((tab) => (
								// biome-ignore lint/a11y/noStaticElementInteractions: nanti
								// biome-ignore lint/a11y/useKeyWithClickEvents: nanti
								<div
									key={tab.id}
									className="shrink-0"
									onClick={() =>
										dispatch({
											type: "SET_ACTIVE_WORKSPACE_TAB",
											payload: tab.id,
										})
									}
								>
									<TabItem
										{...tab}
										id={tab.id}
										method={tab.method}
										active={activeWorkspaceTabId === tab.id}
										onClose={handleDeleteTab.bind(null, tab.id)}
										onRename={handleRenameTab}
									/>
								</div>
							))}
					</div>

					{/* New Tab Button */}
					<button
						type="button"
						onClick={() => dispatch({ type: "ADD_WORKSPACE_TAB" })}
						className="px-2 h-7 flex items-center justify-center text-stone-500 hover:text-stone-300 shrink-0"
					>
						<Plus className="w-4 h-4" />
					</button>
				</div>

				{/* Workspace Content */}
				{activeWorkspace ? (
					<div className="flex-1 p-3 md:p-4 flex flex-col min-h-0">
						<div className="w-full h-full flex flex-col space-y-3">
							{/* URL & Method Bar */}
							<div className="flex shrink-0 h-8 w-full items-center rounded-md border border-stone-700 bg-stone-800 shadow-sm divide-x divide-stone-700 transition-all focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500">
								{/* METHOD SELECTOR */}
								<CompactSelect
									value={activeWorkspace.method}
									options={methods}
									onChange={(e) =>
										dispatch({ type: "SET_METHOD", payload: e.target.value })
									}
									className="shrink-0 bg-stone-800 hover:bg-stone-750 transition-colors"
								/>

								{/* URL INPUT */}
								<div className="flex-1 relative h-full">
									<input
										type="text"
										value={activeWorkspace.url}
										onChange={(e) =>
											dispatch({ type: "SET_URL", payload: e.target.value })
										}
										// if using url draft
										// value={urlDraft}
										// onChange={(e) => setUrlDraft(e.target.value)}
										// onBlur={handleBlur}
										onKeyDown={handleKeyDown}
										placeholder="api.example.com/v1/endpoint"
										className="w-full h-full bg-transparent px-2 text-xs text-stone-100 placeholder-stone-600 font-mono outline-none"
										autoComplete="off"
										autoCorrect="off"
										spellCheck="false"
									/>
								</div>

								{/* SNIPPET GENERATOR */}
								{/** biome-ignore lint/a11y/noStaticElementInteractions: nanti */}
								{/** biome-ignore lint/a11y/useKeyWithClickEvents: nanti */}
								<div
									className="relative h-full"
									onClick={(e) => e.stopPropagation()}
								>
									<button
										type="button"
										onClick={() => setShowCodeMenu(!showCodeMenu)}
										disabled={!activeWorkspace.url}
										className="h-full px-3 flex items-center justify-center text-stone-400 hover:text-emerald-400 transition disabled:opacity-30 disabled:cursor-not-allowed border-r border-stone-700"
										title="Generate Code Snippet"
									>
										<Code2 className="w-4 h-4" />
									</button>

									{/* Code Dropdown Menu */}
									{showCodeMenu && (
										<div className="absolute right-0 top-full mt-1 w-40 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-50 py-1">
											<div className="px-3 py-2 text-xs text-stone-500 uppercase tracking-wider border-b border-stone-700">
												Copy as...
											</div>

											{[
												{ id: "curl", label: "cURL" },
												{ id: "fetch", label: "Node.js (Fetch)" },
												{ id: "python", label: "Python (Requests)" },
												{ id: "csharp", label: "C# (HttpClient)" },
												{
													id: "powershell",
													label: "PowerShell (Invoke-RestMethod)",
												},
											].map((lang) => (
												<button
													key={lang.id}
													type="button"
													onClick={() =>
														handleGenerateCode(lang.id, lang.label)
													}
													className="w-full flex items-center px-3 py-2 text-sm text-stone-300 hover:bg-stone-700 hover:text-emerald-400 transition-colors text-left"
												>
													{lang.label}
												</button>
											))}
										</div>
									)}
								</div>

								{/* SAVE BUTTON */}
								{/** biome-ignore lint/a11y/noStaticElementInteractions: nanti */}
								{/** biome-ignore lint/a11y/useKeyWithClickEvents: nanti */}
								<div
									className="relative h-full flex items-center shrink-0"
									onClick={(e) => e.stopPropagation()}
								>
									{/* Main Save Action (Quick Update) */}
									<button
										type="button"
										onClick={() => {
											if (activeWorkspace.savedRequestId) {
												handleUpdateRequest();
												setShowSaveMenu(false);
											} else {
												setShowSaveMenu(!showSaveMenu);
											}
										}}
										disabled={!activeWorkspace.url}
										className="h-full px-2.5 flex items-center justify-center text-stone-400 hover:text-emerald-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
										title={
											activeWorkspace.savedRequestId
												? "Update Request"
												: "Save Request"
										}
									>
										<Save className="w-4 h-4" />
									</button>

									{/* Split Dropdown Arrow (Save As...) */}
									<button
										type="button"
										onClick={() => setShowSaveMenu(!showSaveMenu)}
										disabled={!activeWorkspace.url}
										className="h-full px-1.5 flex items-center justify-center text-stone-400 hover:text-emerald-400 transition disabled:opacity-30 disabled:cursor-not-allowed border-l border-stone-700"
										title="Save to Collection..."
									>
										<ChevronDown className="w-3 h-3" />
									</button>

									{/* Dropdown Menu */}
									{showSaveMenu && (
										<div className="absolute right-0 top-full mt-1 w-56 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-50 py-1">
											{activeWorkspace.savedRequestId && (
												<>
													<button
														type="button"
														onClick={async () => {
															await handleUpdateRequest();
															setShowSaveMenu(false);
														}}
														className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-stone-700 transition-colors text-left font-medium"
													>
														<Save className="w-3.5 h-3.5" />
														<span>Update Saved Request</span>
													</button>
													<div className="border-b border-stone-700 my-1"></div>
												</>
											)}

											<div className="px-3 py-2 text-xs text-stone-500 uppercase tracking-wider border-b border-stone-700">
												Save to Collection
											</div>

											{collections.length === 0 && (
												<div className="px-3 py-3 text-xs text-stone-500 italic text-center">
													No collections yet
												</div>
											)}

											{collections.map((col) => (
												<button
													key={col.id}
													type="button"
													onClick={async () => {
														await handleSaveToCollection(col.id);
														setShowSaveMenu(false);
													}}
													className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-300 hover:bg-stone-700 hover:text-emerald-400 transition-colors text-left"
												>
													<Layers className="w-3.5 h-3.5 text-amber-500" />
													<span className="truncate">{col.name}</span>
												</button>
											))}

											<div className="border-t border-stone-700 mt-1 pt-1">
												<button
													type="button"
													onClick={() => setIsCreateModalOpen(true)}
													className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-500 hover:bg-stone-700 transition-colors text-left"
												>
													<Plus className="w-3 h-3" />
													<span>New Collection</span>
												</button>
											</div>
										</div>
									)}
								</div>

								{/* SEND BUTTON */}
								<button
									type="button"
									onClick={handleFetch}
									disabled={!activeWorkspace.url || isFetching}
									className="h-full px-3 flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 text-white active:bg-emerald-700"
									title="Send Request"
								>
									{isFetching ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<Send className="w-4 h-4" />
									)}
									<span className="hidden sm:inline">
										{isFetching ? "Sending" : "Send"}
									</span>
								</button>
							</div>

							{/* Tabs */}
							<div className="bg-stone-800 rounded-lg border border-stone-700 shadow-sm flex flex-col flex-1 min-h-0">
								{/* All Tabs */}
								<div className="flex items-center border-b border-stone-700 px-1 select-none">
									{visibleTabs.map((tab) => {
										const isActive = activeWorkspace.activeSubTab === tab.id;

										return (
											<button
												key={tab.id}
												type="button"
												onClick={() =>
													dispatch({
														type: "SET_ACTIVE_SUB_TAB",
														payload: tab.id,
													})
												}
												className={`
                            relative top-px flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium uppercase tracking-wide transition-all border-b-2                           ${
															isActive
																? "border-emerald-500 text-emerald-400 bg-stone-800/50"
																: "border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30"
														}
                        `}
											>
												<tab.icon
													className={`w-3 h-3 ${isActive ? "text-emerald-500" : "text-stone-500"}`}
												/>
												{tab.label}
											</button>
										);
									})}

									{state.networkDelay > 0 && (
										<div
											className="ml-auto flex items-center px-3 cursor-help opacity-70 hover:opacity-100 transition-opacity"
											title={`Network Throttling Active: ${state.networkDelay}ms`}
										>
											<div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
												<Zap className="w-3 h-3 text-amber-500 animate-pulse" />
												<span className="text-[9px] font-mono text-amber-500/80 font-semibold tracking-wider">
													{state.networkDelay}MS
												</span>
											</div>
										</div>
									)}
								</div>

								{/* Tab Content Area */}
								<div className="flex-1 p-0 overflow-hidden relative flex flex-col">
									{/* AUTH TAB */}
									{activeWorkspace.activeSubTab === "auth" && (
										<div className="flex flex-col h-full">
											<div className="flex items-center px-4 py-2 border-b border-stone-700 bg-stone-900/30 gap-4">
												<span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
													Auth Type
												</span>
												<CompactSelect
													value={activeWorkspace.auth?.type || "none"}
													options={["none", "bearer", "basic"]}
													onChange={(e) =>
														dispatch({
															type: "SET_AUTH",
															payload: { type: e.target.value },
														})
													}
													className="w-32 bg-stone-800 border border-stone-700 rounded h-7"
												/>
											</div>
											<div className="flex-1 overflow-y-auto p-4">
												{(!activeWorkspace.auth ||
													activeWorkspace.auth.type === "none") && (
													<div className="flex flex-col items-center justify-center h-40 text-stone-500 text-xs">
														<p>No authentication required for this request.</p>
													</div>
												)}

												{activeWorkspace.auth?.type === "bearer" && (
													<div className="max-w-md space-y-3">
														<label
															htmlFor="bearer-token"
															className="block text-xs text-stone-400"
														>
															Bearer Token
														</label>
														<input
															id="bearer-token"
															type="text"
															placeholder="ey..."
															value={activeWorkspace.auth?.token || ""}
															onChange={(e) =>
																dispatch({
																	type: "SET_AUTH",
																	payload: { token: e.target.value },
																})
															}
															className="w-full bg-stone-900/50 border border-stone-700/50 rounded px-2 py-1.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 font-mono"
														/>
													</div>
												)}

												{activeWorkspace.auth?.type === "basic" && (
													<div className="max-w-md space-y-3">
														<div>
															<label
																htmlFor="auth-username"
																className="block text-xs text-stone-400 mb-1"
															>
																Username
															</label>
															<input
																id="auth-username"
																type="text"
																value={activeWorkspace.auth?.username || ""}
																onChange={(e) =>
																	dispatch({
																		type: "SET_AUTH",
																		payload: { username: e.target.value },
																	})
																}
																className="w-full bg-stone-900/50 border border-stone-700/50 rounded px-2 py-1.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 font-mono"
															/>
														</div>
														<div>
															<label
																htmlFor="auth-password"
																className="block text-xs text-stone-400 mb-1"
															>
																Password
															</label>
															<input
																id="auth-password"
																type="password"
																value={activeWorkspace.auth?.password || ""}
																onChange={(e) =>
																	dispatch({
																		type: "SET_AUTH",
																		payload: { password: e.target.value },
																	})
																}
																className="w-full bg-stone-900/50 border border-stone-700/50 rounded px-2 py-1.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 font-mono"
															/>
														</div>
													</div>
												)}
											</div>
										</div>
									)}

									{/* HEADERS TAB */}
									{activeWorkspace.activeSubTab === "headers" && (
										<div className="flex flex-col h-full">
											<div className="flex justify-between items-center px-2 py-1 border-b border-stone-700 bg-stone-900/30">
												<span className="text-[10px] text-stone-500 ml-1">
													Request Headers
												</span>
												<button
													type="button"
													onClick={() => dispatch({ type: "ADD_HEADER" })}
													className="text-xs flex items-center gap-1 text-emerald-500 hover:text-emerald-400 px-2 py-1 rounded hover:bg-stone-700 transition-colors"
												>
													<Plus className="w-3 h-3" /> Add Header
												</button>
											</div>
											<div className="flex-1 overflow-y-auto p-4">
												{activeWorkspace.headers?.length > 0 && (
													<div className="flex gap-2 mb-1 px-2">
														<div className="w-6 text-center text-[10px] text-stone-500">
															Use
														</div>
														<div className="flex-1 text-xs text-stone-500">
															Key
														</div>
														<div className="flex-1 text-xs text-stone-500">
															Value
														</div>
														<div className="w-8"></div>
													</div>
												)}
												{(!activeWorkspace.headers ||
													activeWorkspace.headers.length === 0) && (
													<div className="flex flex-col items-center justify-center h-40 text-stone-500 text-xs">
														<p>No headers defined yet.</p>
													</div>
												)}
												<div className="space-y-1">
													{activeWorkspace.headers?.map((header) => (
														<div
															key={header.id}
															className="flex items-center gap-2 group"
														>
															<div className="w-6 flex justify-center">
																<input
																	type="checkbox"
																	checked={header.active}
																	onChange={() =>
																		dispatch({
																			type: "UPDATE_HEADER",
																			payload: {
																				id: header.id,
																				field: "active",
																				value: !header.active,
																			},
																		})
																	}
																	className="rounded border-stone-600 bg-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
																/>
															</div>
															<input
																type="text"
																placeholder="Key"
																value={header.key}
																onChange={(e) =>
																	dispatch({
																		type: "UPDATE_HEADER",
																		payload: {
																			id: header.id,
																			field: "key",
																			value: e.target.value,
																		},
																	})
																}
																className="flex-1 min-w-0 bg-stone-900/50 border border-stone-700/50 rounded px-1.5 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 focus:bg-stone-900 font-mono"
															/>
															<input
																type="text"
																placeholder="Value"
																value={header.value}
																onChange={(e) =>
																	dispatch({
																		type: "UPDATE_HEADER",
																		payload: {
																			id: header.id,
																			field: "value",
																			value: e.target.value,
																		},
																	})
																}
																className="flex-1 min-w-0 bg-stone-900/50 border border-stone-700/50 rounded px-1.5 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 focus:bg-stone-900 font-mono"
															/>
															<button
																type="button"
																onClick={() =>
																	dispatch({
																		type: "DELETE_HEADER",
																		payload: header.id,
																	})
																}
																className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
																title="Remove header"
															>
																<Trash2 className="w-3 h-3" />
															</button>
														</div>
													))}
												</div>
											</div>
										</div>
									)}

									{/* QUERIES TAB */}
									{activeWorkspace.activeSubTab === "queries" && (
										<div className="flex flex-col h-full">
											{/* Header Actions */}
											<div className="flex justify-between items-center px-2 py-1 border-b border-stone-700 bg-stone-900/30">
												<span className="text-[10px] text-stone-500 ml-1">
													Query Parameters
												</span>
												<button
													type="button"
													onClick={() => dispatch({ type: "ADD_QUERY" })}
													className="text-xs flex items-center gap-1 text-emerald-500 hover:text-emerald-400 px-2 py-1 rounded hover:bg-stone-700 transition-colors"
												>
													<Plus className="w-3 h-3" /> Add Param
												</button>
											</div>
											{/* Scrollable List */}
											<div className="flex-1 overflow-y-auto p-4">
												{/* Table Header */}
												{activeWorkspace.queries?.length > 0 && (
													<div className="flex gap-2 mb-1 px-2">
														<div className="w-6 text-center text-[10px] text-stone-500">
															Use
														</div>
														<div className="flex-1 text-xs text-stone-500">
															Key
														</div>
														<div className="flex-1 text-xs text-stone-500">
															Value
														</div>
														<div className="w-8"></div>
													</div>
												)}

												{/* Empty State */}
												{(!activeWorkspace.queries ||
													activeWorkspace.queries.length === 0) && (
													<div className="flex flex-col items-center justify-center h-40 text-stone-500 text-xs">
														<p>No query parameters yet.</p>
													</div>
												)}

												{/* Query Rows */}
												<div className="space-y-1">
													{activeWorkspace.queries?.map((query) => (
														<div
															key={query.id}
															className="flex items-center gap-2 group"
														>
															{/* Checkbox (Toggle Active) */}
															<div className="w-6 flex justify-center">
																<input
																	type="checkbox"
																	checked={query.active}
																	onChange={() =>
																		dispatch({
																			type: "UPDATE_QUERY",
																			payload: {
																				id: query.id,
																				field: "active",
																				value: !query.active,
																			},
																		})
																	}
																	className="rounded border-stone-600 bg-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
																/>
															</div>

															{/* Key Input */}
															<input
																type="text"
																placeholder="Key"
																value={query.key}
																onChange={(e) =>
																	dispatch({
																		type: "UPDATE_QUERY",
																		payload: {
																			id: query.id,
																			field: "key",
																			value: e.target.value,
																		},
																	})
																}
																className="flex-1 min-w-0 bg-stone-900/50 border border-stone-700/50 rounded px-1.5 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 focus:bg-stone-900 font-mono"
															/>

															{/* Value Input */}
															<input
																type="text"
																placeholder="Value"
																value={query.value}
																onChange={(e) =>
																	dispatch({
																		type: "UPDATE_QUERY",
																		payload: {
																			id: query.id,
																			field: "value",
																			value: e.target.value,
																		},
																	})
																}
																className="flex-1 min-w-0 bg-stone-900/50 border border-stone-700/50 rounded px-1.5 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 focus:bg-stone-900 font-mono"
															/>

															{/* Delete Button */}
															<button
																type="button"
																onClick={() =>
																	dispatch({
																		type: "DELETE_QUERY",
																		payload: query.id,
																	})
																}
																className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
																title="Remove parameter"
															>
																<Trash2 className="w-4 h-4" />
															</button>
														</div>
													))}
												</div>
											</div>
										</div>
									)}

									{/* BODY TAB */}
									{activeWorkspace.activeSubTab === "body" && (
										<div className="flex flex-col h-full">
											<div className="flex justify-between items-center px-2 py-1 border-b border-stone-700 bg-stone-900/30">
												<div className="flex items-center gap-2 ml-1">
													<CompactSelect
														value={activeWorkspace.bodyType || "raw"}
														options={["raw", "form-data"]}
														onChange={(e) =>
															dispatch({
																type: "SET_BODY_TYPE",
																payload: e.target.value,
															})
														}
														className="w-28 bg-stone-800 border border-stone-700 rounded h-6 text-[10px]"
													/>
												</div>
												{activeWorkspace.bodyType !== "form-data" ? (
													<button
														type="button"
														onClick={handleFormatBody}
														disabled={!activeWorkspace.body.trim()}
														className="text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 px-2 py-1 rounded hover:bg-stone-700 disabled:opacity-50"
													>
														<Zap className="w-3 h-3" /> Prettify
													</button>
												) : (
													<button
														type="button"
														onClick={() => dispatch({ type: "ADD_FORM_DATA" })}
														className="text-xs flex items-center gap-1 text-emerald-500 hover:text-emerald-400 px-2 py-1 rounded hover:bg-stone-700"
													>
														<Plus className="w-3 h-3" /> Add Field
													</button>
												)}
											</div>

											{/* Raw Textarea */}
											{(activeWorkspace.bodyType === "raw" ||
												!activeWorkspace.bodyType) && (
												<textarea
													value={activeWorkspace.body || ""}
													onChange={(e) =>
														dispatch({
															type: "SET_BODY",
															payload: e.target.value,
														})
													}
													className="flex-1 w-full bg-stone-900/50 p-4 outline-none text-sm font-mono text-stone-200 resize-none"
													placeholder="// Request body (JSON)..."
												/>
											)}

											{/* Form Data Table */}
											{activeWorkspace.bodyType === "form-data" && (
												<div className="flex-1 overflow-y-auto p-4">
													{(!activeWorkspace.formData ||
														activeWorkspace.formData.length === 0) && (
														<div className="flex flex-col items-center justify-center h-40 text-stone-500 text-xs">
															<p>No form data fields yet.</p>
														</div>
													)}
													<div className="space-y-1">
														{activeWorkspace.formData?.map((item) => (
															<div
																key={item.id}
																className="flex items-center gap-2 group"
															>
																<div className="w-6 flex justify-center">
																	<input
																		type="checkbox"
																		checked={item.active}
																		onChange={() =>
																			dispatch({
																				type: "UPDATE_FORM_DATA",
																				payload: {
																					id: item.id,
																					field: "active",
																					value: !item.active,
																				},
																			})
																		}
																		className="rounded border-stone-600 bg-stone-800 text-emerald-500"
																	/>
																</div>

																<input
																	type="text"
																	placeholder="Key"
																	value={item.key}
																	onChange={(e) =>
																		dispatch({
																			type: "UPDATE_FORM_DATA",
																			payload: {
																				id: item.id,
																				field: "key",
																				value: e.target.value,
																			},
																		})
																	}
																	className="w-1/3 min-w-0 bg-stone-900/50 border border-stone-700/50 rounded px-1.5 py-1 text-xs text-stone-200 font-mono"
																/>

																<select
																	value={item.type}
																	onChange={(e) =>
																		dispatch({
																			type: "UPDATE_FORM_DATA",
																			payload: {
																				id: item.id,
																				field: "type",
																				value: e.target.value,
																			},
																		})
																	}
																	className="bg-stone-900/50 border border-stone-700/50 rounded px-1 py-1 text-xs text-stone-400 outline-none"
																>
																	<option value="text">Text</option>
																	<option value="file">File</option>
																</select>

																{item.type === "text" ? (
																	<input
																		type="text"
																		placeholder="Value"
																		value={item.value}
																		onChange={(e) =>
																			dispatch({
																				type: "UPDATE_FORM_DATA",
																				payload: {
																					id: item.id,
																					field: "value",
																					value: e.target.value,
																				},
																			})
																		}
																		className="flex-1 min-w-0 bg-stone-900/50 border border-stone-700/50 rounded px-1.5 py-1 text-xs text-stone-200 font-mono"
																	/>
																) : (
																	<input
																		type="file"
																		onChange={(e) =>
																			dispatch({
																				type: "UPDATE_FORM_DATA",
																				payload: {
																					id: item.id,
																					field: "file",
																					value: e.target.files[0],
																				},
																			})
																		}
																		className="flex-1 min-w-0 text-xs text-stone-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-stone-800 file:text-stone-300 hover:file:bg-stone-700 cursor-pointer"
																	/>
																)}

																<button
																	type="button"
																	onClick={() =>
																		dispatch({
																			type: "DELETE_FORM_DATA",
																			payload: item.id,
																		})
																	}
																	className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
																>
																	<Trash2 className="w-3 h-3" />
																</button>
															</div>
														))}
													</div>
												</div>
											)}
										</div>
									)}

									{/* RESPONSE TAB */}
									{activeWorkspace.activeSubTab === "response" && (
										<div className="flex flex-col h-full">
											{/* Response Toolbar */}
											<div className="flex items-center justify-between px-2 border-b border-stone-700 bg-stone-900/30 h-9 shrink-0">
												{/* Left: Status Badges */}
												<div className="flex items-center gap-2 px-1">
													<span
														className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
															activeWorkspace.response?.status >= 200 &&
															activeWorkspace.response?.status < 300
																? "bg-emerald-500/10 text-emerald-500"
																: activeWorkspace.response?.status >= 400
																	? "bg-red-500/10 text-red-400"
																	: "bg-stone-700 text-stone-400"
														}`}
													>
														{activeWorkspace.response?.status
															? `${activeWorkspace.response.status} ${activeWorkspace.response.statusText}`
															: "NO RESPONSE"}
													</span>
													<span className="text-[10px] text-stone-500">
														{activeWorkspace.response?.time || "0ms"}
													</span>
													<span className="text-[10px] text-stone-500">
														{activeWorkspace.response?.type || "Unknown"}
													</span>
													<span className="text-[10px] text-stone-500">
														{activeWorkspace.response?.size || "0KB"}
													</span>
												</div>
												{/* Center: View Toggle */}
												{activeWorkspace.response && (
													<div className="flex items-center bg-stone-950 rounded-md mt-0.5 p-0.5 border border-stone-800 absolute left-1/2 -translate-x-1/2">
														<button
															type="button"
															onClick={() => setResponseView("body")}
															className={`px-3 py-1 text-[10px] font-medium rounded-sm transition-colors ${
																responseView === "body"
																	? "bg-stone-700 text-stone-100 shadow-sm"
																	: "text-stone-500 hover:text-stone-300"
															}`}
														>
															Body
														</button>
														<button
															type="button"
															onClick={() => setResponseView("headers")}
															className={`px-3 py-1 text-[10px] font-medium rounded-sm transition-colors flex items-center gap-1 ${
																responseView === "headers"
																	? "bg-stone-700 text-stone-100 shadow-sm"
																	: "text-stone-500 hover:text-stone-300"
															}`}
														>
															Headers
															<span className="bg-stone-800/80 px-1.5 py-0.5 rounded-full text-[9px]">
																{activeWorkspace.response.headers?.length || 0}
															</span>
														</button>
													</div>
												)}
												{/* Right: Actions (Only show for body) */}
												<div className="flex items-center gap-1">
													{responseView === "body" && (
														<button
															type="button"
															onClick={handleCopy}
															disabled={
																!activeWorkspace.response ||
																activeWorkspace.response.type !== "json"
															}
															className="p-1.5 hover:bg-stone-700 rounded text-stone-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
															title="Copy Response Body"
														>
															{copied ? (
																<Check className="w-3.5 h-3.5 text-emerald-500" />
															) : (
																<Copy className="w-3.5 h-3.5" />
															)}
														</button>
													)}
												</div>
											</div>

											{/* Response Content */}
											<div className="flex-1 overflow-auto bg-stone-950 p-3 relative">
												{isFetching && (
													<div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm flex-col gap-4 text-emerald-500 animate-in fade-in duration-200">
														<Loader2 className="w-8 h-8 animate-spin" />
														<span className="text-xs font-mono tracking-widest uppercase animate-pulse">
															Fetching Response...
														</span>
													</div>
												)}

												{!activeWorkspace.response && !isFetching && (
													<div className="absolute inset-0 flex items-center justify-center text-stone-700 flex-col gap-2">
														<Globe className="w-8 h-8 opacity-20" />
														<span className="text-sm">
															Enter a URL and send to get a response
														</span>
													</div>
												)}

												{/* --- BODY VIEW --- */}
												{activeWorkspace.response &&
													responseView === "body" && (
														<>
															{activeWorkspace.response?.type === "html" && (
																<iframe
																	srcDoc={activeWorkspace.response.content}
																	className="w-full h-full border-0 bg-white rounded-sm"
																	title="HTML Response"
																	sandbox="allow-forms allow-scripts"
																/>
															)}

															{activeWorkspace.response?.type === "json" && (
																<div className="absolute inset-0">
																	<JsonViewer
																		data={activeWorkspace.response.content}
																	/>
																</div>
															)}

															{activeWorkspace.response?.type === "blob" && (
																<BlobPreview
																	blob={activeWorkspace.response.content}
																	contentType={
																		activeWorkspace.response.contentType
																	}
																	filename={activeWorkspace.response.filename}
																/>
															)}

															{activeWorkspace.response?.type === "text" && (
																<pre className="text-xs md:text-sm font-mono text-yellow-200 whitespace-pre-wrap">
																	{activeWorkspace.response.content}
																</pre>
															)}

															{activeWorkspace.response?.type === "error" && (
																<ErrorDisplay
																	error={activeWorkspace.response.content}
																	onRetry={handleFetch}
																/>
															)}
														</>
													)}

												{/* --- HEADERS VIEW --- */}
												{activeWorkspace.response &&
													responseView === "headers" && (
														<div className="w-full overflow-x-auto pb-4">
															<table className="w-full text-left border-collapse text-xs">
																<thead>
																	<tr className="border-b border-stone-800 text-stone-500">
																		<th className="py-2 px-2 font-medium w-1/3 min-w-37.5">
																			Key
																		</th>
																		<th className="py-2 px-2 font-medium">
																			Value
																		</th>
																	</tr>
																</thead>
																<tbody className="align-top">
																	{activeWorkspace.response.headers?.map(
																		(h, i) => (
																			<tr
																				// biome-ignore lint/suspicious/noArrayIndexKey: i had to
																				key={i}
																				className="border-b border-stone-800/50 hover:bg-stone-900/50 group transition-colors"
																			>
																				<td className="py-2.5 px-2 text-stone-300 font-mono break-all font-medium">
																					{h.key}
																				</td>
																				<td className="py-2.5 px-2 text-stone-400 font-mono break-all relative pr-10">
																					{h.value}
																					<button
																						type="button"
																						onClick={async () => {
																							await navigator.clipboard.writeText(
																								h.value,
																							);
																							showToast(
																								"Copied header value!",
																								"success",
																							);
																						}}
																						className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-emerald-400 transition-all bg-stone-800 rounded border border-stone-700 shadow-sm"
																						title="Copy Value"
																					>
																						<Copy className="w-3.5 h-3.5" />
																					</button>
																				</td>
																			</tr>
																		),
																	)}
																	{(!activeWorkspace.response.headers ||
																		activeWorkspace.response.headers.length ===
																			0) && (
																		<tr>
																			<td
																				colSpan="2"
																				className="py-6 text-center text-stone-600 italic"
																			>
																				No headers received
																			</td>
																		</tr>
																	)}
																</tbody>
															</table>
														</div>
													)}
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center">
						<div className="mb-6 opacity-20">
							<svg
								width="120"
								height="120"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1"
								className="text-stone-100"
							>
								<title>No Open Tabs</title>
								<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
								<line x1="8" y1="21" x2="16" y2="21" />
								<line x1="12" y1="17" x2="12" y2="21" />
							</svg>
						</div>

						<h2 className="text-lg font-semibold text-stone-200 mb-1">
							No Open Tabs
						</h2>
						<p className="text-stone-500 text-xs mb-6">
							Your workspace is empty.
						</p>

						<button
							type="button"
							onClick={() => dispatch({ type: "ADD_WORKSPACE_TAB" })} // Connect your action here
							className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
						>
							<Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
							<span>Create New Request</span>
						</button>
					</div>
				)}
			</div>

			{/* 3. MODALS */}
			{/* Confirm Dialog Modal */}
			{confirmModal.isOpen && (
				<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-5 max-w-sm w-full mx-4">
						<h3 className="text-lg font-medium text-stone-200 mb-2">
							{confirmModal.title}
						</h3>
						<p className="text-sm text-stone-400 mb-6">
							{confirmModal.message}
						</p>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setConfirmModal({ isOpen: false })}
								className="px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 rounded-md transition"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={confirmModal.onConfirm}
								className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-md transition shadow-md shadow-red-900/20"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Create Collection Modal */}
			{isCreateModalOpen && (
				<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<form
						onSubmit={handleCreateCollection}
						className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-5 max-w-sm w-full mx-4"
					>
						<h3 className="text-lg font-medium text-stone-200 mb-4">
							New Collection
						</h3>
						<input
							// biome-ignore lint/a11y/noAutofocus: nanti
							autoFocus
							type="text"
							value={newCollectionName}
							onChange={(e) => setNewCollectionName(e.target.value)}
							placeholder="e.g. User API"
							className="w-full bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-6"
						/>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setIsCreateModalOpen(false)}
								className="px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 rounded-md transition"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={!newCollectionName.trim()}
								className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition shadow-md shadow-emerald-900/20"
							>
								Create
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Settings Modal */}
			{isSettingsModalOpen && (
				<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 relative">
						<button
							type="button"
							onClick={() => setIsSettingsModalOpen(false)}
							className="absolute top-4 right-4 p-1 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-md transition"
						>
							<X className="w-5 h-5" />
						</button>
						<h3 className="text-xl font-medium text-stone-200 mb-6 flex items-center gap-2">
							<Settings className="w-5 h-5 text-stone-400" />
							Settings
						</h3>

						<div className="space-y-6">
							<div>
								<h4 className="text-sm font-medium text-stone-300 mb-1">
									Data Management
								</h4>
								<p className="text-xs text-stone-500 mb-4">
									Export your collections and history, or import from an
									existing backup.
								</p>

								<div className="flex gap-3">
									<button
										type="button"
										onClick={handleExportData}
										className="flex items-center justify-center gap-2 flex-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 py-2 px-4 rounded-md text-sm transition"
									>
										<Download className="w-4 h-4" />
										Export
									</button>

									<label className="flex items-center justify-center gap-2 flex-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 py-2 px-4 rounded-md text-sm cursor-pointer transition">
										<Upload className="w-4 h-4" />
										Import
										<input
											type="file"
											accept=".json"
											className="hidden"
											onChange={handleImportData}
										/>
									</label>
								</div>
							</div>

							<div className="pt-4 border-t border-stone-800">
								<h4 className="text-sm font-medium text-stone-300 mb-1 flex items-center gap-2">
									<Zap className="w-4 h-4 text-amber-500" />
									Network Throttling
								</h4>
								<p className="text-xs text-stone-500 mb-4">
									Simulate a slow connection to test your loading states.
								</p>
								<select
									value={state.networkDelay || 0}
									onChange={(e) =>
										dispatch({
											type: "SET_NETWORK_DELAY",
											payload: Number(e.target.value),
										})
									}
									className="w-full bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
								>
									<option value={0}>No Throttling (Direct)</option>
									<option value={500}>Fast 3G (500ms delay)</option>
									<option value={2000}>Slow 3G (2000ms delay)</option>
									<option value={5000}>Extremely Slow (5000ms delay)</option>
								</select>
							</div>

							<div className="pt-4 border-t border-stone-800">
								<h4 className="text-sm font-medium text-stone-300 mb-4">
									Keyboard Shortcuts
								</h4>
								<div className="grid grid-cols-2 gap-y-4 gap-x-6">
									<div className="flex items-center justify-between">
										<span className="text-xs text-stone-400">New Tab</span>
										<div className="flex gap-1">
											<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
												Ctrl
											</kbd>
											<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
												T
											</kbd>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-stone-400">Close Tab</span>
										<div className="flex gap-1">
											<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
												Ctrl
											</kbd>
											<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
												W
											</kbd>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-stone-400">Save Request</span>
										<div className="flex gap-1">
											<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
												Ctrl
											</kbd>
											<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
												S
											</kbd>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-stone-400">Send Request</span>
										<div className="flex gap-1">
											<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
												Ctrl
											</kbd>
											<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-2 py-0.5 rounded text-[10px] font-mono shadow-sm">
												↵
											</kbd>
										</div>
									</div>
								</div>
								<p className="text-[10px] text-stone-600 mt-5 italic">
									* Mac users can use <kbd className="font-mono">Cmd ⌘</kbd>{" "}
									instead of <kbd className="font-mono">Ctrl</kbd>.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;

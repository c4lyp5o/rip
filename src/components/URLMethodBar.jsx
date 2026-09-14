import {
	ChevronDown,
	Code2,
	Layers,
	Loader2,
	Plus,
	Save,
	Send,
} from "lucide-react";
import { useRip } from "../context/RIPContext";
import { useToast } from "../context/ToastContext";
import { saveRequest, updateRequest } from "../utils/ripDb";
import CompactSelect from "./reusables/CompactSelect";

const URLMethodBar = ({
	showSaveMenu,
	setShowSaveMenu,
	showCodeMenu,
	setShowCodeMenu,
	setIsCreateModalOpen,
}) => {
	const { showToast } = useToast();
	const { state, dispatch, refreshCollections, sendRequest } = useRip();
	const { methods, workspaceTabs, activeWorkspaceTabId, collections } = state;

	const availableCodeGenerators = [
		{ id: "curl", label: "cURL" },
		{ id: "fetch", label: "Node.js (Fetch)" },
		{ id: "python", label: "Python (Requests)" },
		{ id: "csharp", label: "C# (HttpClient)" },
		{
			id: "powershell",
			label: "PowerShell (Invoke-RestMethod)",
		},
	];

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	const isFetching = activeWorkspace?.isFetching ?? false;

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !isFetching) {
			e.preventDefault();
			sendRequest();
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

	return (
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
			<div className="relative h-full" onClick={(e) => e.stopPropagation()}>
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

						{availableCodeGenerators.map((lang) => (
							<button
								key={lang.id}
								type="button"
								onClick={() => handleGenerateCode(lang.id, lang.label)}
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
						activeWorkspace.savedRequestId ? "Update Request" : "Save Request"
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
				onClick={() => sendRequest()}
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
	);
};

export default URLMethodBar;

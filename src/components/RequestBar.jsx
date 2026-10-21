import { useState } from "react";
import { useRip } from "../context/RIPContext";
import { useToast } from "../context/ToastContext";
import { saveRequest } from "../utils/ripDb";
import { generateSnippet } from "../utils/snippetGenerator";
import { methodColor } from "../utils/semantics";
import useUpdateRequest from "../hooks/useUpdateRequest";

const CODE_GENERATORS = [
	{ id: "curl", label: "cURL" },
	{ id: "fetch", label: "Node.js (Fetch)" },
	{ id: "python", label: "Python (Requests)" },
	{ id: "csharp", label: "C# (HttpClient)" },
	{ id: "powershell", label: "PowerShell (Invoke-RestMethod)" },
];

/**
 * The composer: method, URL, and the actions.
 *
 * This is the hero of the app — the URL input is the biggest, brightest
 * target on screen and Send is the only filled button here. Method colour
 * carries meaning (GET=blue, POST=green, PUT=amber, PATCH=violet,
 * DELETE=red).
 */
const RequestBar = ({
	showSaveMenu,
	setShowSaveMenu,
	showCodeMenu,
	setShowCodeMenu,
	setIsCreateModalOpen,
}) => {
	const { state, dispatch, refreshCollections, sendRequest } = useRip();
	const { showToast } = useToast();
	const { methods, workspaceTabs, activeWorkspaceTabId, collections } = state;
	const updateRequest = useUpdateRequest();

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	const isFetching = activeWorkspace?.isFetching ?? false;

	if (!activeWorkspace) return null;

	const color = methodColor(activeWorkspace.method);

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !isFetching) {
			e.preventDefault();
			sendRequest();
		}
	};

	const handleSaveToCollection = async (collectionId) => {
		try {
			const newId = await saveRequest(collectionId, null, {
				name: activeWorkspace.name || activeWorkspace.url || "Untitled",
				method: activeWorkspace.method,
				url: activeWorkspace.url,
				headers: activeWorkspace.headers,
				queries: activeWorkspace.queries,
				body: activeWorkspace.body,
				auth: activeWorkspace.auth,
			});

			dispatch({
				type: "SET_SAVED_REQUEST_ID",
				payload: { tabId: activeWorkspace.id, savedRequestId: newId },
			});

			await refreshCollections();
			showToast("Saved to collection", "success");
		} catch (error) {
			if (import.meta.env.DEV)
				console.error("Failed to save request to collection:", error);
			showToast("Failed to save request", "error");
		}
	};

	const handleCopyAs = async (language, label) => {
		try {
			const snippet = generateSnippet(language, activeWorkspace);
			await navigator.clipboard.writeText(snippet);
			setShowCodeMenu(false);
			showToast(`${label} copied to clipboard`, "success");
		} catch (error) {
			if (import.meta.env.DEV)
				console.error("Failed to generate code snippet:", error);
			showToast("Failed to generate snippet", "error");
		}
	};

	return (
		<div className="shrink-0 px-5 pt-4 pb-3.5 bg-stone-950 border-b border-stone-750">
			<div className="flex items-center gap-2.5">
				{/* Method — a coloured chip, not a plain select */}
				<div className="relative shrink-0">
					<select
						value={activeWorkspace.method}
						onChange={(e) =>
							dispatch({ type: "SET_METHOD", payload: e.target.value })
						}
						aria-label="HTTP method"
						className="h-10 pl-3 pr-7 rounded-lg border cursor-pointer appearance-none font-mono text-[13px] font-semibold outline-none transition-colors"
						style={{
							background: `color-mix(in srgb, ${color} 15%, transparent)`,
							borderColor: `color-mix(in srgb, ${color} 34%, transparent)`,
							color,
						}}
					>
						{methods.map((m) => (
							<option
								key={m}
								value={m}
								style={{ background: "var(--panel)", color: "var(--ink)" }}
							>
								{m}
							</option>
						))}
					</select>
					<svg
						className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
						viewBox="0 0 12 12"
						fill="none"
						style={{ color }}
					>
						<path
							d="M3 4.5 6 7.5 9 4.5"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>

				{/* URL — the hero input */}
				<div className="flex-1 min-w-0 flex items-center h-10 px-3.5 rounded-lg bg-stone-900 border border-stone-750 transition-colors focus-within:border-emerald-500">
					<input
						type="text"
						value={activeWorkspace.url}
						onChange={(e) =>
							dispatch({ type: "SET_URL", payload: e.target.value })
						}
						onKeyDown={handleKeyDown}
						placeholder="api.example.com/v1/endpoint"
						aria-label="Request URL"
						className="w-full bg-transparent outline-none font-mono text-[13.5px] text-stone-100 placeholder:text-stone-600"
						autoComplete="off"
						autoCorrect="off"
						spellCheck="false"
					/>
				</div>

				{/* Copy as code */}
				<div className="relative shrink-0">
					<button
						type="button"
						onClick={() => setShowCodeMenu(!showCodeMenu)}
						disabled={!activeWorkspace.url}
						className="h-10 w-10 flex items-center justify-center rounded-lg bg-stone-900 border border-stone-750 text-stone-400 transition-colors hover:text-stone-100 hover:border-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
						title="Copy as code"
						aria-label="Copy as code"
					>
						<svg
							className="w-4 h-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="16 18 22 12 16 6" />
							<polyline points="8 6 2 12 8 18" />
						</svg>
					</button>

					{showCodeMenu && (
						<div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-stone-750 bg-stone-900 p-1 z-50 shadow-xl">
							<div className="px-2.5 py-1.5 text-[11px] font-semibold text-stone-500">
								Copy as
							</div>
							{CODE_GENERATORS.map((lang) => (
								<button
									key={lang.id}
									type="button"
									onClick={() => handleCopyAs(lang.id, lang.label)}
									className="w-full flex items-center px-2.5 h-8 rounded-md bg-transparent border-0 text-stone-300 text-[12.5px] text-left cursor-pointer transition-colors hover:bg-stone-850 hover:text-stone-100"
								>
									{lang.label}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Save — split button: the main half saves (or updates), the
				    chevron always opens the menu so a saved request can still be
				    saved into another collection. */}
				<div className="relative shrink-0">
					<div className="h-10 flex items-stretch rounded-lg bg-stone-900 border border-stone-750 transition-colors hover:border-stone-700">
						<button
							type="button"
							onClick={() => {
								if (activeWorkspace.savedRequestId) {
									updateRequest(activeWorkspace);
									setShowSaveMenu(false);
								} else {
									setShowSaveMenu(!showSaveMenu);
								}
							}}
							disabled={!activeWorkspace.url}
							className="w-10 flex items-center justify-center rounded-l-lg bg-transparent text-stone-300 transition-colors hover:text-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
							title={
								activeWorkspace.savedRequestId ? "Update Request" : "Save Request"
							}
							aria-label="Save request"
						>
							<svg
								className="w-4 h-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
								<polyline points="17 21 17 13 7 13 7 21" />
								<polyline points="7 3 7 8 15 8" />
							</svg>
						</button>
						<button
							type="button"
							onClick={() => setShowSaveMenu(!showSaveMenu)}
							disabled={!activeWorkspace.url}
							className="w-6 flex items-center justify-center rounded-r-lg border-l border-stone-750 bg-transparent text-stone-400 transition-colors hover:text-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
							title="Save to collection…"
							aria-label="Save options"
							aria-haspopup="menu"
							aria-expanded={showSaveMenu}
						>
							<svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
								<path
									d="M3 4.5 6 7.5 9 4.5"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>
					</div>

					{showSaveMenu && (
						<div className="absolute right-0 top-full mt-1.5 w-60 rounded-lg border border-stone-750 bg-stone-900 p-1 z-50 shadow-xl">
							{activeWorkspace.savedRequestId && (
								<>
									<button
										type="button"
										onClick={async () => {
											await updateRequest(activeWorkspace);
											setShowSaveMenu(false);
										}}
										className="w-full flex items-center gap-2 px-2.5 h-8 rounded-md bg-transparent border-0 text-emerald-400 text-[12.5px] text-left cursor-pointer transition-colors hover:bg-stone-850"
									>
										<svg
											className="w-3.5 h-3.5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
											<polyline points="17 21 17 13 7 13 7 21" />
										</svg>
										<span>Update saved request</span>
									</button>
									<div className="h-px my-1 bg-stone-750" />
								</>
							)}

							<div className="px-2.5 py-1.5 text-[11px] font-semibold text-stone-500">
								Save to collection
							</div>

							{collections.length === 0 && (
								<div className="px-2.5 py-2 text-[12.5px] text-stone-600">
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
									className="w-full flex items-center gap-2 px-2.5 h-8 rounded-md bg-transparent border-0 text-stone-300 text-[12.5px] text-left cursor-pointer transition-colors hover:bg-stone-850 hover:text-stone-100"
								>
									<span className="w-3.5 h-3.5 shrink-0 text-amber-500">▤</span>
									<span className="truncate">{col.name}</span>
								</button>
							))}

							<div className="h-px my-1 bg-stone-750" />
							<button
								type="button"
								onClick={() => {
									setIsCreateModalOpen(true);
									setShowSaveMenu(false);
								}}
								className="w-full flex items-center gap-2 px-2.5 h-8 rounded-md bg-transparent border-0 text-emerald-500 text-[12.5px] text-left cursor-pointer transition-colors hover:bg-stone-850"
							>
								<span className="w-3.5 text-center">+</span>
								<span>New collection</span>
							</button>
						</div>
					)}
				</div>

				{/* Send — the only filled button in the composer */}
				<button
					type="button"
					onClick={() => sendRequest()}
					disabled={!activeWorkspace.url || isFetching}
					className="h-10 shrink-0 px-5 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-on-green text-[13px] font-semibold transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
					title="Send request (Ctrl+Enter)"
				>
					{isFetching ? (
						<svg
							className="w-4 h-4 animate-spin"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
						>
							<path d="M21 12a9 9 0 1 1-6.219-8.56" />
						</svg>
					) : (
						<svg
							className="w-4 h-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="22" y1="2" x2="11" y2="13" />
							<polygon points="22 2 15 22 11 13 2 9 22 2" />
						</svg>
					)}
					<span>{isFetching ? "Sending" : "Send"}</span>
				</button>
			</div>

			{/* Secondary row: context that is not the request itself */}
			<div className="flex items-center gap-5 mt-2.5 text-[12.5px] text-stone-500">
				<span>
					Auth{" "}
					<span className="text-stone-300">
						{activeWorkspace.auth?.type || "none"}
					</span>
				</span>
				<span>
					Delay <span className="text-stone-300">{state.networkDelay} ms</span>
				</span>
				{activeWorkspace.savedRequestId && (
					<span className="text-emerald-500">Saved</span>
				)}
				<span className="ml-auto hidden sm:inline text-stone-600">
					Ctrl + Enter to send
				</span>
			</div>
		</div>
	);
};

export default RequestBar;

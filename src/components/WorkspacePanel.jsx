import { Plus, Zap } from "lucide-react";
import RequestBar from "./RequestBar";
import RequestPane from "./RequestPane";
import ResponsePane from "./ResponsePane";
import TabItem from "./reusables/TabItem";

/**
 * The workspace: open-request tabs, the composer, and the split
 * request/response panes.
 *
 * The response is NOT a tab any more. It is a permanent right-hand column,
 * so the result of a request is always visible next to the request that
 * produced it. That removes the Auth -> Headers -> Queries -> Body ->
 * Response click-through that used to hide every result behind a tab.
 */
const WorkspacePanel = ({
	workspaceTabs,
	activeWorkspaceTabId,
	activeWorkspace,
	state,
	handleDeleteTab,
	handleRenameTab,
	showSaveMenu,
	setShowSaveMenu,
	showCodeMenu,
	setShowCodeMenu,
	setIsCreateModalOpen,
	dispatch,
}) => {
	if (!workspaceTabs || !activeWorkspace) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center">
				<div className="mb-6 opacity-20">
					<svg
						width="120"
						height="120"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1"
						className="text-stone-300"
					>
						<title>Workspace empty</title>
						<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
						<line x1="8" y1="21" x2="16" y2="21" />
						<line x1="12" y1="17" x2="12" y2="21" />
					</svg>
				</div>

				<h2 className="text-lg font-semibold text-stone-200 mb-1">No Open Tabs</h2>
				<p className="text-stone-500 text-sm mb-6">Your workspace is empty.</p>

				<button
					type="button"
					onClick={() => dispatch({ type: "ADD_WORKSPACE_TAB" })}
					className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-on-green px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
				>
					<Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
					<span>Create New Request</span>
				</button>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col min-w-0 min-h-0 bg-stone-950">
			{/* Open request tabs */}
			<div className="shrink-0 flex items-center bg-stone-900 border-b border-stone-750">
				<div
					className="flex overflow-x-auto no-scrollbar scroll-smooth"
					onWheel={(e) => {
						e.currentTarget.scrollLeft += e.deltaY;
					}}
				>
					{workspaceTabs.map((tab) => (
						<div
							key={tab.id}
							className="shrink-0"
							role="button"
							tabIndex={0}
							aria-pressed={activeWorkspaceTabId === tab.id}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									dispatch({
										type: "SET_ACTIVE_WORKSPACE_TAB",
										payload: tab.id,
									});
								}
							}}
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
								onClose={() => handleDeleteTab(tab.id)}
								onRename={handleRenameTab}
							/>
						</div>
					))}
				</div>

				<button
					type="button"
					onClick={() => dispatch({ type: "ADD_WORKSPACE_TAB" })}
					className="px-2.5 h-8 flex items-center justify-center text-stone-500 hover:text-stone-200 shrink-0 bg-transparent border-0 cursor-pointer"
					aria-label="New request tab"
				>
					<Plus className="w-4 h-4" />
				</button>

				{state.networkDelay > 0 && (
					<div
						className="ml-auto mr-4 flex items-center px-2 h-6 rounded-md bg-amber-500/10 border border-amber-500/25 shrink-0"
						title={`Network Throttling Active: ${state.networkDelay}ms`}
					>
						<Zap className="w-3 h-3 text-amber-500 mr-1" />
						<span className="text-[11px] font-mono text-amber-500 font-semibold">
							{state.networkDelay}MS
						</span>
					</div>
				)}
			</div>

			{/* The composer — method, URL, actions */}
			<RequestBar
				showSaveMenu={showSaveMenu}
				setShowSaveMenu={setShowSaveMenu}
				showCodeMenu={showCodeMenu}
				setShowCodeMenu={setShowCodeMenu}
				setIsCreateModalOpen={setIsCreateModalOpen}
			/>

			{/* Request on the left, response on the right. Always both. */}
			<div className="flex-1 flex min-h-0 min-w-0">
				<RequestPane />

				<div className="flex-1 flex flex-col min-w-0 min-h-0 border-l border-stone-750">
					<ResponsePane />
				</div>
			</div>
		</div>
	);
};

export default WorkspacePanel;

import { Plus, Zap } from "lucide-react";
import URLMethodBar from "./URLMethodBar";
import AuthTab from "./tabs/AuthTab";
import HeadersTab from "./tabs/HeadersTab";
import QueriesTab from "./tabs/QueriesTab";
import BodyTab from "./tabs/BodyTab";
import ResponseTab from "./tabs/ResponseTab";
import TabItem from "./reusables/TabItem";

const WorkspacePanel = ({
	workspaceTabs,
	activeWorkspaceTabId,
	visibleTabs,
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
						className="text-stone-100"
					>
						<title>Workspace empty</title>
						<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
						<line x1="8" y1="21" x2="16" y2="21" />
						<line x1="12" y1="17" x2="12" y2="21" />
					</svg>
				</div>

				<h2 className="text-lg font-semibold text-stone-200 mb-1">No Open Tabs</h2>
				<p className="text-stone-500 text-xs mb-6">Your workspace is empty.</p>

				<button
					type="button"
					onClick={() => dispatch({ type: "ADD_WORKSPACE_TAB" })}
					className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
				>
					<Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
					<span>Create New Request</span>
				</button>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col min-w-0 bg-stone-900">
			<div className="flex items-center bg-stone-950 border-b border-stone-800">
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
									})
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
					className="px-2 h-7 flex items-center justify-center text-stone-500 hover:text-stone-300 shrink-0"
				>
					<Plus className="w-4 h-4" />
				</button>
			</div>

			<div className="flex-1 p-3 md:p-4 flex flex-col min-h-0">
				<div className="w-full h-full flex flex-col space-y-3">
					<URLMethodBar
						showSaveMenu={showSaveMenu}
						setShowSaveMenu={setShowSaveMenu}
						showCodeMenu={showCodeMenu}
						setShowCodeMenu={setShowCodeMenu}
						setIsCreateModalOpen={setIsCreateModalOpen}
					/>

					<div className="bg-stone-800 rounded-lg border border-stone-700 shadow-sm flex flex-col flex-1 min-h-0">
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

						<div className="flex-1 p-0 overflow-hidden relative flex flex-col">
							{activeWorkspace.activeSubTab === "auth" && <AuthTab />}
							{activeWorkspace.activeSubTab === "headers" && <HeadersTab />}
							{activeWorkspace.activeSubTab === "queries" && <QueriesTab />}
							{activeWorkspace.activeSubTab === "body" && <BodyTab />}
							{activeWorkspace.activeSubTab === "response" && <ResponseTab />}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default WorkspacePanel;

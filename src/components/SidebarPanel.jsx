import { Plus, Settings, Trash2, History, Layout } from "lucide-react";
import SidebarItem from "./reusables/SidebarItem";
import HistoryItem from "./reusables/HistoryItem";
import TreeItem from "./reusables/TreeItem";

const SidebarPanel = ({
	sidebarWidth,
	activeSpace,
	setActiveSpace,
	history,
	collections,
	handleLoadHistoryItemById,
	handleLoadRequest,
	confirmClearHistory,
	confirmDeleteHistoryItem,
	confirmDeleteCollection,
	confirmDeleteRequest,
	setIsCreateModalOpen,
	isDraggingSidebar,
	setIsDraggingSidebar,
	setIsSettingsModalOpen,
}) => (
	<div className="flex flex-col shrink-0 border-r border-stone-800 bg-stone-900 relative transition-[width] duration-0">
		{/** biome-ignore lint/a11y/noStaticElementInteractions: nanti */}
		<div
			onMouseDown={() => setIsDraggingSidebar(true)}
			className="absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-50 group flex justify-center"
			role="separator"
			aria-orientation="vertical"
			aria-label="Resize sidebar"
		>
			<div
				className={`w-0.5 h-full transition-colors ${
					isDraggingSidebar
						? "bg-emerald-500"
						: "group-hover:bg-emerald-500/50"
				}`}
			/>
		</div>
		<div className="flex flex-col flex-1 overflow-hidden p-2 space-y-0.5">
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

			<div className="mt-4 flex flex-col flex-1 min-h-0 overflow-hidden">
				<div className="text-xs font-semibold text-stone-500 px-3 uppercase tracking-wider mb-2">
					{activeSpace === "history" ? "Recent Requests" : "Collections"}
				</div>
				{activeSpace === "history" && history.length > 0 && (
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

				{history.length === 0 && (
					<div className="px-3 py-4 text-xs text-stone-600 text-center italic">
						No history yet
					</div>
				)}

				{history.length > 0 && (
					<div className="flex flex-col gap-1 w-full flex-1 min-h-0 overflow-y-auto no-scrollbar">
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

				{activeSpace === "collections" && (
					<div className="flex flex-col gap-1 w-full flex-1 min-h-0 overflow-y-auto no-scrollbar">
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

		<div className="mt-auto px-1 py-0.5 border-t border-stone-800 flex items-center justify-between text-stone-500">
			<button
				type="button"
				onClick={() => setIsSettingsModalOpen(true)}
				className="p-1.5 hover:bg-stone-800 rounded"
				aria-label="Settings"
			>
				<Settings className="w-3.5 h-3.5" />
			</button>
			<span className="text-[10px]">v1.0.0</span>
		</div>
	</div>
);

export default SidebarPanel;

import { Plus, Settings } from "lucide-react";
import HistoryRow from "./reusables/HistoryRow";
import CollectionTree from "./reusables/CollectionTree";
import ThemeMenu from "./reusables/ThemeMenu";

/**
 * The sidebar: a labelled nav with History and Collections, both visible.
 *
 * In the Studio layout the sidebar always shows what you have instead of
 * hiding half of it behind a toggle. The two sections are stacked and each
 * scrolls independently.
 */
const SidebarPanel = ({
	sidebarWidth,
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
	<aside
		className="flex flex-col shrink-0 bg-stone-900 border-r border-stone-750 relative"
		style={{ width: sidebarWidth }}
	>
		{/* Resize handle — sits INSIDE the rail so it cannot push the layout
		    wider than the sidebar's own width. */}
		<div
			onMouseDown={() => setIsDraggingSidebar(true)}
			className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-50 group flex justify-center"
			role="separator"
			aria-orientation="vertical"
			aria-label="Resize sidebar"
		>
			<div
				className={`w-px h-full transition-colors ${
					isDraggingSidebar
						? "bg-emerald-500"
						: "bg-transparent group-hover:bg-stone-700"
				}`}
			/>
		</div>

		{/* Brand */}
		<div className="flex items-center gap-2.5 px-3.5 h-12 border-b border-stone-800 shrink-0">
			<span className="w-[22px] h-[22px] rounded-md bg-emerald-600 flex items-center justify-center text-[12px] font-bold text-on-green shrink-0">
				R
			</span>
			<span className="text-[13.5px] font-semibold text-stone-200 truncate">
				REST In Peace
			</span>
		</div>

		{/* History */}
		<section className="flex flex-col min-h-0 flex-1 border-b border-stone-800">
			<div className="flex items-center gap-2 px-3.5 h-9 shrink-0">
				<h2 className="text-[12px] font-semibold text-stone-500 uppercase tracking-wider">
					History
				</h2>
				{history.length > 0 && (
					<button
						type="button"
						onClick={confirmClearHistory}
						className="ml-auto text-[11.5px] text-stone-600 hover:text-red-400 transition-colors bg-transparent border-0 cursor-pointer"
					>
						Clear all
					</button>
				)}
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-1.5 pb-2">
				{history.length === 0 ? (
					<div className="px-2 py-3 text-[12.5px] text-stone-600">
						No history yet
					</div>
				) : (
					history.map((item) => (
						<HistoryRow
							key={item.id}
							item={item}
							onOpen={handleLoadHistoryItemById}
							onDelete={confirmDeleteHistoryItem}
						/>
					))
				)}
			</div>
		</section>

		{/* Collections */}
		<section className="flex flex-col min-h-0 flex-1">
			<div className="flex items-center gap-2 px-3.5 h-9 shrink-0">
				<h2 className="text-[12px] font-semibold text-stone-500 uppercase tracking-wider">
					Collections
				</h2>
				<button
					type="button"
					onClick={() => setIsCreateModalOpen(true)}
					className="ml-auto p-1 -mr-1 rounded text-stone-600 hover:text-emerald-400 hover:bg-stone-850 transition-colors bg-transparent border-0 cursor-pointer"
					aria-label="New collection"
				>
					<Plus className="w-3.5 h-3.5" />
				</button>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-1.5 pb-2">
				<CollectionTree
					collections={collections}
					onOpenRequest={handleLoadRequest}
					onDeleteCollection={confirmDeleteCollection}
					onDeleteRequest={confirmDeleteRequest}
				/>
			</div>
		</section>

		{/* Footer */}
		<div className="shrink-0 flex items-center gap-2 px-2.5 py-2 border-t border-stone-800">
			<button
				type="button"
				onClick={() => setIsSettingsModalOpen(true)}
				className="p-2 rounded-md text-stone-500 hover:text-stone-200 hover:bg-stone-850 transition-colors bg-transparent border-0 cursor-pointer shrink-0"
				aria-label="Settings"
				title="Settings"
			>
				<Settings className="w-4 h-4" />
			</button>
			<div className="flex-1 min-w-0">
				<ThemeMenu />
			</div>
		</div>
	</aside>
);

export default SidebarPanel;

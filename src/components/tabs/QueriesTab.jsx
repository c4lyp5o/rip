import { Plus, Trash2 } from "lucide-react";
import { useRip } from "../../context/RIPContext";

const QueriesTab = () => {
	const { state, dispatch, fetcherRef, refreshCollections } = useRip();
	const { methods, workspaceTabs, activeWorkspaceTabId, collections } = state;

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	return (
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
						<div className="flex-1 text-xs text-stone-500">Key</div>
						<div className="flex-1 text-xs text-stone-500">Value</div>
						<div className="w-8"></div>
					</div>
				)}

				{/* Empty State */}
				{(!activeWorkspace.queries || activeWorkspace.queries.length === 0) && (
					<div className="flex flex-col items-center justify-center h-40 text-stone-500 text-xs">
						<p>No query parameters yet.</p>
					</div>
				)}

				{/* Query Rows */}
				<div className="space-y-1">
					{activeWorkspace.queries?.map((query) => (
						<div key={query.id} className="flex items-center gap-2 group">
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
	);
};

export default QueriesTab;

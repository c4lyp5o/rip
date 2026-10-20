import { useRip } from "../../context/RIPContext";
import { Plus, Trash2 } from "lucide-react";

/**
 * The Params pane (query string parameters).
 *
 * Rows are key/value pairs. The label is sentence case, the values are
 * monospace, and the type sits at 12.5px — dense enough for a tool, never
 * so small it costs legibility.
 */
const ParamsTab = () => {
	const { state, dispatch } = useRip();
	const { workspaceTabs, activeWorkspaceTabId } = state;

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	if (!activeWorkspace) return null;

	const queries = activeWorkspace.queries || [];

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
				{queries.length === 0 ? (
					<div className="py-10 text-center text-[12.5px] text-stone-600">
						No query parameters yet.
					</div>
				) : (
					<div className="space-y-1.5">
						{queries.map((query) => (
							<div key={query.id} className="group flex items-center gap-2">
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
									className="w-3.5 h-3.5 shrink-0 rounded border-stone-700 bg-stone-850 text-emerald-500 accent-emerald-500 cursor-pointer"
									aria-label={`Enable ${query.key || "parameter"}`}
								/>

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
									className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-stone-900 border border-stone-750 text-[12.5px] font-mono text-stone-200 placeholder-stone-600 outline-none transition-colors focus:border-emerald-500"
								/>

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
									className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-stone-900 border border-stone-750 text-[12.5px] font-mono text-stone-200 placeholder-stone-600 outline-none transition-colors focus:border-emerald-500"
								/>

								<button
									type="button"
									onClick={() =>
										dispatch({ type: "DELETE_QUERY", payload: query.id })
									}
									className="w-7 h-7 shrink-0 flex items-center justify-center rounded-md text-stone-600 hover:text-red-400 hover:bg-stone-850 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-0 cursor-pointer"
									title="Remove parameter"
									aria-label="Remove parameter"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							</div>
						))}
					</div>
				)}

				<button
					type="button"
					onClick={() => dispatch({ type: "ADD_QUERY" })}
					className="mt-3 h-8 px-3 flex items-center gap-1.5 rounded-md bg-transparent border border-dashed border-stone-750 text-[12.5px] text-stone-500 hover:text-emerald-400 hover:border-emerald-500/60 transition-colors cursor-pointer"
				>
					<Plus className="w-3.5 h-3.5" />
					Add parameter
				</button>
			</div>
		</div>
	);
};

export default ParamsTab;

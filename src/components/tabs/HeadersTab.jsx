import { useRip } from "../../context/RIPContext";
import { Plus, Trash2 } from "lucide-react";

/**
 * The Headers pane. Same key/value row shape as Params, with an enable
 * toggle so a header can be parked without deleting it.
 */
const HeadersTab = () => {
	const { state, dispatch } = useRip();
	const { workspaceTabs, activeWorkspaceTabId } = state;

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	if (!activeWorkspace) return null;

	const headers = activeWorkspace.headers || [];

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
				{headers.length === 0 ? (
					<div className="py-10 text-center text-[12.5px] text-stone-600">
						No headers defined yet.
					</div>
				) : (
					<div className="space-y-1.5">
						{headers.map((header) => (
							<div key={header.id} className="group flex items-center gap-2">
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
									className="w-3.5 h-3.5 shrink-0 rounded border-stone-700 bg-stone-850 text-emerald-500 accent-emerald-500 cursor-pointer"
									aria-label={`Enable ${header.key || "header"}`}
								/>

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
									className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-stone-900 border border-stone-750 text-[12.5px] font-mono text-stone-200 placeholder-stone-600 outline-none transition-colors focus:border-emerald-500"
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
									className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-stone-900 border border-stone-750 text-[12.5px] font-mono text-stone-200 placeholder-stone-600 outline-none transition-colors focus:border-emerald-500"
								/>

								<button
									type="button"
									onClick={() =>
										dispatch({ type: "DELETE_HEADER", payload: header.id })
									}
									className="w-7 h-7 shrink-0 flex items-center justify-center rounded-md text-stone-600 hover:text-red-400 hover:bg-stone-850 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-0 cursor-pointer"
									title="Remove header"
									aria-label="Remove header"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							</div>
						))}
					</div>
				)}

				<button
					type="button"
					onClick={() => dispatch({ type: "ADD_HEADER" })}
					className="mt-3 h-8 px-3 flex items-center gap-1.5 rounded-md bg-transparent border border-dashed border-stone-750 text-[12.5px] text-stone-500 hover:text-emerald-400 hover:border-emerald-500/60 transition-colors cursor-pointer"
				>
					<Plus className="w-3.5 h-3.5" />
					Add header
				</button>
			</div>
		</div>
	);
};

export default HeadersTab;

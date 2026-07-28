import { Zap, Plus, Trash2 } from "lucide-react";
import { useRip } from "../../context/RIPContext";
import { useToast } from "../../context/ToastContext";

import CompactSelect from "../reusables/CompactSelect";

const BodyTab = () => {
	const { state, dispatch, fetcherRef, refreshCollections } = useRip();
	const { methods, workspaceTabs, activeWorkspaceTabId, collections } = state;
	const { showToast } = useToast();

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

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

	return (
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
						// disabled={!activeWorkspace.body.trim()}
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
			{(activeWorkspace.bodyType === "raw" || !activeWorkspace.bodyType) && (
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
							<div key={item.id} className="flex items-center gap-2 group">
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
	);
};

export default BodyTab;

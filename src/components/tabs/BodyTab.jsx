import { Zap, Plus, Trash2 } from "lucide-react";
import { useRip } from "../../context/RIPContext";
import { useToast } from "../../context/ToastContext";

/**
 * The Body pane. Raw JSON or form fields, and a Prettify action for JSON.
 */
const BodyTab = () => {
	const { state, dispatch } = useRip();
	const { workspaceTabs, activeWorkspaceTabId } = state;
	const { showToast } = useToast();

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	if (!activeWorkspace) return null;

	const handleFormatBody = () => {
		try {
			const formattedBody = JSON.stringify(
				JSON.parse(activeWorkspace.body.replace(/\n{3,}/g, "\n\n").trim()),
				null,
				2,
			);
			dispatch({ type: "SET_BODY", payload: formattedBody });
			showToast("JSON formatted successfully", "success");
		} catch (error) {
			if (import.meta.env.DEV)
				console.error("Error formatting JSON:", error);
			showToast("Invalid JSON: Cannot format", "error");
		}
	};

	return (
		<div className="flex flex-col h-full min-h-0">
			{/* Toolbar */}
			<div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-stone-750">
				<div className="flex items-center gap-0.5 p-0.5 rounded-md bg-stone-900 border border-stone-750">
					{["raw", "form-data"].map((type) => (
						<button
							key={type}
							type="button"
							onClick={() =>
								dispatch({ type: "SET_BODY_TYPE", payload: type })
							}
							aria-pressed={(activeWorkspace.bodyType || "raw") === type}
							className={`h-6 px-2.5 rounded text-[12.5px] transition-colors cursor-pointer ${
								(activeWorkspace.bodyType || "raw") === type
									? "bg-stone-850 text-stone-100"
									: "text-stone-500 hover:text-stone-300"
							}`}
						>
							{type === "raw" ? "Raw" : "Form data"}
						</button>
					))}
				</div>

				{activeWorkspace.bodyType !== "form-data" ? (
					<button
						type="button"
						onClick={handleFormatBody}
						className="h-7 px-2.5 flex items-center gap-1.5 rounded-md bg-transparent border-0 text-[12.5px] text-amber-400 hover:text-amber-300 hover:bg-stone-850 transition-colors cursor-pointer"
					>
						<Zap className="w-3.5 h-3.5" />
						Prettify
					</button>
				) : (
					<button
						type="button"
						onClick={() => dispatch({ type: "ADD_FORM_DATA" })}
						className="h-7 px-2.5 flex items-center gap-1.5 rounded-md bg-transparent border-0 text-[12.5px] text-emerald-400 hover:text-emerald-300 hover:bg-stone-850 transition-colors cursor-pointer"
					>
						<Plus className="w-3.5 h-3.5" />
						Add field
					</button>
				)}
			</div>

			{/* Raw textarea */}
			{(activeWorkspace.bodyType === "raw" || !activeWorkspace.bodyType) && (
				<textarea
					value={activeWorkspace.body || ""}
					onChange={(e) =>
						dispatch({ type: "SET_BODY", payload: e.target.value })
					}
					className="flex-1 w-full bg-stone-950 px-4 py-3 outline-none text-[13px] font-mono text-stone-200 resize-none leading-relaxed"
					placeholder={'{\n  "key": "value"\n}'}
					aria-label="Request body"
				/>
			)}

			{/* Form data rows */}
			{activeWorkspace.bodyType === "form-data" && (
				<div className="flex-1 overflow-y-auto px-4 py-3">
					{(!activeWorkspace.formData ||
						activeWorkspace.formData.length === 0) && (
						<div className="py-10 text-center text-[12.5px] text-stone-600">
							No form data fields yet.
						</div>
					)}

					<div className="space-y-1.5">
						{activeWorkspace.formData?.map((item) => (
							<div key={item.id} className="group flex items-center gap-2">
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
									className="w-3.5 h-3.5 shrink-0 rounded border-stone-700 bg-stone-850 text-emerald-500 accent-emerald-500 cursor-pointer"
									aria-label={`Enable ${item.key || "field"}`}
								/>

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
									className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-stone-900 border border-stone-750 text-[12.5px] font-mono text-stone-200 placeholder-stone-600 outline-none transition-colors focus:border-emerald-500"
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
									className="h-8 px-2 rounded-md bg-stone-900 border border-stone-750 text-[12.5px] text-stone-300 outline-none cursor-pointer"
									aria-label="Field type"
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
										className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-stone-900 border border-stone-750 text-[12.5px] font-mono text-stone-200 placeholder-stone-600 outline-none transition-colors focus:border-emerald-500"
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
										className="flex-1 min-w-0 text-[12.5px] text-stone-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[12.5px] file:bg-stone-850 file:text-stone-300 hover:file:bg-stone-800 cursor-pointer"
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
									className="w-7 h-7 shrink-0 flex items-center justify-center rounded-md text-stone-600 hover:text-red-400 hover:bg-stone-850 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-0 cursor-pointer"
									aria-label="Remove field"
								>
									<Trash2 className="w-3.5 h-3.5" />
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

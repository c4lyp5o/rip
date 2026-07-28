import { useRip } from "../../context/RIPContext";

import CompactSelect from "../reusables/CompactSelect";

const AuthTab = () => {
	const { state, dispatch, fetcherRef, refreshCollections } = useRip();
	const { methods, workspaceTabs, activeWorkspaceTabId, collections } = state;

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center px-4 py-2 border-b border-stone-700 bg-stone-900/30 gap-4">
				<span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
					Authentication Type
				</span>
				<CompactSelect
					value={activeWorkspace.auth?.type || "none"}
					options={["none", "bearer", "basic"]}
					onChange={(e) =>
						dispatch({
							type: "SET_AUTH",
							payload: { type: e.target.value },
						})
					}
					className="w-32 bg-stone-800 border border-stone-700 rounded h-7"
				/>
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				{(!activeWorkspace.auth || activeWorkspace.auth.type === "none") && (
					<div className="flex flex-col items-center justify-center h-40 text-stone-500 text-xs">
						<p>No authentication required for this request.</p>
					</div>
				)}

				{activeWorkspace.auth?.type === "bearer" && (
					<div className="max-w-md space-y-3">
						<label
							htmlFor="bearer-token"
							className="block text-xs text-stone-400"
						>
							Bearer Token
						</label>
						<input
							id="bearer-token"
							type="text"
							placeholder="ey..."
							value={activeWorkspace.auth?.token || ""}
							onChange={(e) =>
								dispatch({
									type: "SET_AUTH",
									payload: { token: e.target.value },
								})
							}
							className="w-full bg-stone-900/50 border border-stone-700/50 rounded px-2 py-1.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 font-mono"
						/>
					</div>
				)}

				{activeWorkspace.auth?.type === "basic" && (
					<div className="max-w-md space-y-3">
						<div>
							<label
								htmlFor="auth-username"
								className="block text-xs text-stone-400 mb-1"
							>
								Username
							</label>
							<input
								id="auth-username"
								type="text"
								value={activeWorkspace.auth?.username || ""}
								onChange={(e) =>
									dispatch({
										type: "SET_AUTH",
										payload: { username: e.target.value },
									})
								}
								className="w-full bg-stone-900/50 border border-stone-700/50 rounded px-2 py-1.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 font-mono"
							/>
						</div>
						<div>
							<label
								htmlFor="auth-password"
								className="block text-xs text-stone-400 mb-1"
							>
								Password
							</label>
							<input
								id="auth-password"
								type="password"
								value={activeWorkspace.auth?.password || ""}
								onChange={(e) =>
									dispatch({
										type: "SET_AUTH",
										payload: { password: e.target.value },
									})
								}
								className="w-full bg-stone-900/50 border border-stone-700/50 rounded px-2 py-1.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 font-mono"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AuthTab;

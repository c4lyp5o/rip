import { useRip } from "../../context/RIPContext";

/**
 * The Auth pane. One clear question: how do we authenticate? Type first,
 * then the credential it needs.
 */
const AuthTab = () => {
	const { state, dispatch } = useRip();
	const { workspaceTabs, activeWorkspaceTabId } = state;

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	if (!activeWorkspace) return null;

	const authType = activeWorkspace.auth?.type || "none";

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
				{/* Type picker */}
				<div className="flex items-center gap-2 mb-4">
					{["none", "bearer", "basic"].map((type) => (
						<button
							key={type}
							type="button"
							onClick={() =>
								dispatch({ type: "SET_AUTH", payload: { type } })
							}
							aria-pressed={authType === type}
							className={`h-8 px-3 rounded-md text-[12.5px] border transition-colors cursor-pointer ${
								authType === type
									? "bg-violet-500/15 border-violet-500/40 text-violet-400 font-medium"
									: "bg-stone-900 border-stone-750 text-stone-400 hover:text-stone-200 hover:border-stone-700"
							}`}
						>
							{type === "none"
								? "No auth"
								: type === "bearer"
									? "Bearer token"
									: "Basic"}
						</button>
					))}
				</div>

				{authType === "none" && (
					<div className="py-8 text-center text-[12.5px] text-stone-600">
						No authentication required for this request.
					</div>
				)}

				{authType === "bearer" && (
					<div className="max-w-md space-y-2">
						<label
							htmlFor="bearer-token"
							className="block text-[12.5px] text-stone-400"
						>
							Token
						</label>
						<input
							id="bearer-token"
							type="text"
							placeholder="eyJhbGciOi..."
							value={activeWorkspace.auth?.token || ""}
							onChange={(e) =>
								dispatch({
									type: "SET_AUTH",
									payload: { token: e.target.value },
								})
							}
							className="w-full h-9 px-3 rounded-md bg-stone-900 border border-stone-750 text-[13px] font-mono text-stone-200 placeholder-stone-600 outline-none transition-colors focus:border-violet-500"
						/>
					</div>
				)}

				{authType === "basic" && (
					<div className="max-w-md space-y-3">
						<div>
							<label
								htmlFor="auth-username"
								className="block text-[12.5px] text-stone-400 mb-1"
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
								className="w-full h-9 px-3 rounded-md bg-stone-900 border border-stone-750 text-[13px] font-mono text-stone-200 outline-none transition-colors focus:border-violet-500"
							/>
						</div>
						<div>
							<label
								htmlFor="auth-password"
								className="block text-[12.5px] text-stone-400 mb-1"
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
								className="w-full h-9 px-3 rounded-md bg-stone-900 border border-stone-750 text-[13px] font-mono text-stone-200 outline-none transition-colors focus:border-violet-500"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AuthTab;

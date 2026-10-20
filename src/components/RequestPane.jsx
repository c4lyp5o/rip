import { useRip } from "../context/RIPContext";
import AuthTab from "./tabs/AuthTab";
import HeadersTab from "./tabs/HeadersTab";
import ParamsTab from "./tabs/ParamsTab";
import BodyTab from "./tabs/BodyTab";

/**
 * The request pane — the left half of the workspace.
 *
 * In the Studio layout the response lives beside this permanently, so this
 * pane holds only the REQUEST: params, headers, auth, body. The chips show
 * how much is in each section, so you can see at a glance where a request
 * is configured.
 */
const RequestPane = () => {
	const { state, dispatch } = useRip();
	const { workspaceTabs, activeWorkspaceTabId } = state;

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	if (!activeWorkspace) return null;

	const sections = [
		{
			id: "params",
			label: "Params",
			count: (activeWorkspace.queries || []).length,
		},
		{
			id: "headers",
			label: "Headers",
			count: (activeWorkspace.headers || []).length,
		},
		{ id: "auth", label: "Auth", count: 0 },
		{ id: "body", label: "Body", count: 0 },
	].filter(
		(section) => !(section.id === "body" && activeWorkspace.method === "GET"),
	);

	const activeSection = sections.find(
		(section) => section.id === activeWorkspace.activeSubTab,
	);

	return (
		<section
			className="flex flex-col min-w-0 min-h-0 flex-1 bg-stone-950"
			aria-label="Request"
		>
			{/* Section chips */}
			<div
				role="tablist"
				aria-label="Request sections"
				className="shrink-0 flex items-center gap-1 h-10 px-4 border-b border-stone-750"
			>
				<span className="text-[12.5px] font-semibold text-stone-400 mr-1.5">
					Request
				</span>

				{sections.map((section) => {
					const isActive = activeWorkspace.activeSubTab === section.id;
					return (
						<button
							key={section.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							onClick={() =>
								dispatch({
									type: "SET_ACTIVE_SUB_TAB",
									payload: section.id,
								})
							}
							className={`h-7 px-2.5 flex items-center gap-1.5 rounded-md text-[12.5px] transition-colors cursor-pointer border ${
								isActive
									? "bg-stone-850 text-stone-100 border-stone-750 font-medium"
									: "bg-transparent text-stone-500 border-transparent hover:text-stone-300 hover:bg-stone-900"
							}`}
						>
							{section.label}
							{section.count > 0 && (
								<span className="text-[11px] text-stone-500">
									{section.count}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* Section body */}
			<div className="flex-1 min-h-0 overflow-hidden">
				{!activeSection && (
					<div className="h-full flex items-center justify-center text-[12.5px] text-stone-600">
						Nothing to configure.
					</div>
				)}
				{activeWorkspace.activeSubTab === "params" && <ParamsTab />}
				{activeWorkspace.activeSubTab === "headers" && <HeadersTab />}
				{activeWorkspace.activeSubTab === "auth" && <AuthTab />}
				{activeWorkspace.activeSubTab === "body" && <BodyTab />}
			</div>
		</section>
	);
};

export default RequestPane;

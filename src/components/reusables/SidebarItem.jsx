import { memo } from "react";

const SidebarItem = memo(({ icon: Icon, label, active, onClick }) => (
	<button
		type="button"
		onClick={onClick}
		className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
			active
				? "bg-stone-800 text-emerald-400 font-medium"
				: "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
		}`}
	>
		<Icon className="w-3.5 h-3.5" />
		<span className="truncate">{label}</span>
	</button>
));

export default SidebarItem;

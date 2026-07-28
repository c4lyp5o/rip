import { memo } from "react";
import { Trash2 } from "lucide-react";

const getMethodClass = (method) => {
	switch (method) {
		case "GET":
			return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
		case "POST":
			return "text-amber-400 bg-amber-500/10 border-amber-500/20";
		case "PATCH":
			return "text-sky-400 bg-sky-500/10 border-sky-500/20";
		case "PUT":
			return "text-blue-400 bg-blue-500/10 border-blue-500/20";
		case "DELETE":
			return "text-red-400 bg-red-500/10 border-red-500/20";
		default:
			return "text-stone-400 bg-stone-500/10 border-stone-500/20";
	}
};

const HistoryItem = memo(({ item, onLoadRequest, onDeleteRequest }) => (
	<div
		key={item.id}
		className="group relative flex items-center w-full gap-2 px-2 py-1 text-[11px] text-left rounded hover:bg-stone-800 transition-colors border border-transparent hover:border-stone-700"
		title={item.url}
	>
		<button
			type="button"
			onClick={() => onLoadRequest(item.id)}
			className="flex items-center min-w-0 flex-1 gap-2 text-left"
		>
			<span
				className={`
          shrink-0 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border
          ${getMethodClass(item.method)}
        `}
			>
				{item.method}
			</span>

			<span className="flex-1 truncate text-stone-400 font-mono group-hover:text-stone-200 transition-colors">
				{item.url}
			</span>
		</button>

		<button
			type="button"
			onClick={() => onDeleteRequest(item)}
			className="hidden group-hover:block p-1 text-stone-500 hover:text-red-400 rounded transition-all shrink-0"
			title="Delete from history"
		>
			<Trash2 className="w-3 h-3" />
		</button>
	</div>
));

export default HistoryItem;

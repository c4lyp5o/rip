import { methodColor, statusColor } from "../../utils/semantics";

/**
 * A history row. The method badge and the status code both carry colour
 * meaning, so a wall of history is scannable at a glance.
 */
const HistoryRow = ({ item, onOpen, onDelete }) => {
	const method = methodColor(item.method);
	const status = statusColor(item.status);

	// Strip the scheme: "https://" is 8 characters of pure noise in a
	// 224px rail, and every row starts with it.
	const label = item.url?.replace(/^https?:\/\//, "") ?? "";

	return (
		<div className="group flex items-center gap-1.5 w-full px-2 h-8 rounded-md hover:bg-stone-850 transition-colors">
			<button
				type="button"
				onClick={() => onOpen(item.id)}
				title={item.url}
				className="flex items-center gap-1.5 min-w-0 flex-1 text-left bg-transparent border-0 cursor-pointer"
			>
				<span
					className="font-mono text-[11px] font-semibold w-[46px] shrink-0"
					style={{ color: method }}
				>
					{item.method}
				</span>
				<span className="flex-1 truncate font-mono text-[12.5px] text-stone-400 group-hover:text-stone-200 transition-colors">
					{label}
				</span>
				{item.status ? (
					<span
						className="font-mono text-[11px] font-semibold shrink-0"
						style={{ color: status }}
					>
						{item.status}
					</span>
				) : null}
			</button>

			<button
				type="button"
				onClick={() => onDelete(item)}
				className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-red-400 rounded transition-opacity bg-transparent border-0 cursor-pointer"
				aria-label="Delete from history"
			>
				<svg
					className="w-3.5 h-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<polyline points="3 6 5 6 21 6" />
					<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
				</svg>
			</button>
		</div>
	);
};

export default HistoryRow;

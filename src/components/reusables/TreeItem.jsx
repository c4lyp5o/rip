import { memo, useState } from "react";
import {
	ChevronDown,
	ChevronRight,
	Folder,
	Layers,
	Trash2,
} from "lucide-react";

const methodColors = {
	GET: "text-emerald-400",
	POST: "text-amber-400",
	PATCH: "text-sky-400",
	PUT: "text-blue-400",
	DELETE: "text-red-400",
};

const TreeItem = memo(
	({ item, onLoadRequest, onDeleteCollection, onDeleteRequest }) => {
		const [isOpen, setIsOpen] = useState(false);

		if (item.type === "request") {
			return (
				<div className="group flex items-center justify-between px-4 py-1.5 text-xs text-stone-400 hover:bg-stone-800 ml-4 border-l border-stone-800 cursor-pointer">
					<button
						type="button"
						onClick={() => onLoadRequest(item)}
						className="flex items-center gap-2 flex-1 min-w-0 hover:text-emerald-400"
					>
						<span
							className={`font-mono text-[10px] shrink-0 ${methodColors[item.method]}`}
						>
							{item.method}
						</span>
						<span className="truncate">{item.name}</span>
					</button>
					<button
						type="button"
						onClick={(e) => onDeleteRequest(item)}
						className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-red-400 rounded transition-all"
						aria-label="Delete Request"
					>
						<Trash2 className="w-3 h-3" />
					</button>
				</div>
			);
		}

		return (
			<div className="flex flex-col">
				<div className="group flex items-center justify-between px-2 py-2 text-sm text-stone-300 hover:bg-stone-800 cursor-pointer select-none">
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						className="flex items-center gap-2 flex-1 min-w-0"
					>
						{isOpen ? (
							<ChevronDown className="w-3 h-3 shrink-0" />
						) : (
							<ChevronRight className="w-3 h-3 shrink-0" />
						)}

						{item.type === "collection" ? (
							<Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
						) : (
							<Folder className="w-3.5 h-3.5 text-stone-500 shrink-0" />
						)}

						<span className="font-medium truncate">{item.name}</span>
					</button>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDeleteCollection(item);
						}}
						className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-red-400 rounded transition-all"
						aria-label="Delete collection"
					>
						<Trash2 className="w-3 h-3" />
					</button>
				</div>

				{isOpen && (
					<div className="pl-2 border-l border-stone-800 ml-3">
						{item.items?.map((child) => (
							<TreeItem
								key={child.id}
								item={child}
								onLoadRequest={onLoadRequest}
								onDeleteCollection={onDeleteCollection}
								onDeleteRequest={onDeleteRequest}
							/>
						))}
						{(!item.items || item.items.length === 0) && (
							<div className="pl-4 py-1 text-[10px] text-stone-600 italic">
								Empty
							</div>
						)}
					</div>
				)}
			</div>
		);
	},
);

export default TreeItem;

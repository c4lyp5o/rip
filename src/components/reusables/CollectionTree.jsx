import { useState } from "react";
import { methodColor } from "../../utils/semantics";

/**
 * The collection tree. Folders and collections are collapsible; a request
 * inside carries its method in colour.
 */
const CollectionTree = ({ collections, onOpenRequest, onDeleteCollection, onDeleteRequest }) => {
	if (collections.length === 0) {
		return (
			<div className="px-3 py-4 text-[12.5px] text-stone-600">
				No collections yet
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-0.5">
			{collections.map((col) => (
				<CollectionNode
					key={col.id}
					item={col}
					depth={0}
					onOpenRequest={onOpenRequest}
					onDeleteCollection={onDeleteCollection}
					onDeleteRequest={onDeleteRequest}
				/>
			))}
		</div>
	);
};

const CollectionNode = ({
	item,
	depth,
	onOpenRequest,
	onDeleteCollection,
	onDeleteRequest,
}) => {
	const isRequest = item.type === "request";

	if (isRequest) {
		return (
			<div
				className="group flex items-center gap-2 h-8 pr-2 rounded-md hover:bg-stone-850 transition-colors"
				style={{ paddingLeft: `${10 + depth * 14}px` }}
			>
				<button
					type="button"
					onClick={() => onOpenRequest(item)}
					className="flex items-center gap-2 min-w-0 flex-1 text-left bg-transparent border-0 cursor-pointer"
				>
					<span
						className="font-mono text-[11px] font-semibold shrink-0"
						style={{ color: methodColor(item.method) }}
					>
						{item.method}
					</span>
					<span className="truncate text-[12.5px] text-stone-400 group-hover:text-stone-200 transition-colors">
						{item.name}
					</span>
				</button>
				<button
					type="button"
					onClick={() => onDeleteRequest(item)}
					className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-red-400 rounded transition-opacity bg-transparent border-0 cursor-pointer"
					aria-label="Delete request"
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
	}

	return <CollectionBranch item={item} depth={depth} onOpenRequest={onOpenRequest} onDeleteCollection={onDeleteCollection} onDeleteRequest={onDeleteRequest} />;
};

const CollectionBranch = ({
	item,
	depth,
	onOpenRequest,
	onDeleteCollection,
	onDeleteRequest,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const isCollection = item.type === "collection";

	return (
		<div className="flex flex-col">
			<div
				className="group flex items-center gap-1.5 h-8 pr-2 rounded-md hover:bg-stone-850 transition-colors"
				style={{ paddingLeft: `${6 + depth * 14}px` }}
			>
				<button
					type="button"
					onClick={() => setIsOpen((o) => !o)}
					className="flex items-center gap-1.5 min-w-0 flex-1 text-left bg-transparent border-0 cursor-pointer"
					aria-expanded={isOpen}
				>
					<svg
						className="w-3.5 h-3.5 shrink-0 text-stone-600 transition-transform"
						style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="9 18 15 12 9 6" />
					</svg>
					{isCollection ? (
						<svg
							className="w-3.5 h-3.5 shrink-0 text-amber-500"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polygon points="12 2 2 7 12 12 22 7 12 2" />
							<polyline points="2 17 12 22 22 17" />
							<polyline points="2 12 12 17 22 12" />
						</svg>
					) : (
						<svg
							className="w-3.5 h-3.5 shrink-0 text-stone-500"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
						</svg>
					)}
					<span className="truncate text-[12.5px] text-stone-300">
						{item.name}
					</span>
				</button>
				<button
					type="button"
					onClick={() => onDeleteCollection(item)}
					className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-red-400 rounded transition-opacity bg-transparent border-0 cursor-pointer"
					aria-label="Delete collection"
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

			{isOpen && (
				<div className="flex flex-col gap-0.5">
					{item.items?.map((child) => (
						<CollectionNode
							key={child.id}
							item={child}
							depth={depth + 1}
							onOpenRequest={onOpenRequest}
							onDeleteCollection={onDeleteCollection}
							onDeleteRequest={onDeleteRequest}
						/>
					))}
					{(!item.items || item.items.length === 0) && (
						<div
							className="py-1.5 text-[12px] text-stone-600"
							style={{ paddingLeft: `${34 + depth * 14}px` }}
						>
							Empty
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default CollectionTree;

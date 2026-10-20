import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { methodColor } from "../../utils/semantics";

/**
 * One open request in the workspace tab strip.
 *
 * The method badge carries its semantic colour, so a strip of open requests
 * is scannable without reading a single label.
 */
const TabItem = ({ id, method, name, active, onClose, onRename }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(name);

	useEffect(() => {
		if (!isEditing) setEditValue(name);
	}, [name, isEditing]);

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			e.currentTarget.blur();
		} else if (e.key === "Escape") {
			setEditValue(name);
			setIsEditing(false);
		}
	};

	const handleBlur = () => {
		setIsEditing(false);
		const finalName = editValue.trim() || "Untitled";
		if (finalName !== name) {
			onRename(id, finalName);
		} else {
			setEditValue(name);
		}
	};

	return (
		<div
			className={`group flex items-center gap-2 h-8 pl-3 pr-1.5 border-r transition-colors ${
				active
					? "bg-stone-850 text-stone-100"
					: "bg-stone-900 text-stone-500 hover:text-stone-300"
			}`}
		>
			<span
				className="font-mono text-[11px] font-semibold shrink-0"
				style={{ color: methodColor(method) }}
			>
				{method}
			</span>

			{isEditing ? (
				<input
					// biome-ignore lint/a11y/noAutofocus: required for inline editing UX
					autoFocus
					type="text"
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					className="flex-1 min-w-0 bg-stone-950 text-stone-200 outline-none px-1.5 rounded-sm text-[12.5px] border border-stone-750"
					aria-label="Tab name"
				/>
			) : (
				// biome-ignore lint/a11y/noStaticElementInteractions: double-click to rename
				<span
					onDoubleClick={() => setIsEditing(true)}
					className="truncate flex-1 text-[12.5px] cursor-text"
					title="Double-click to rename"
				>
					{name}
				</span>
			)}

			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onClose();
				}}
				className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-600 hover:text-stone-200 transition-opacity bg-transparent border-0 cursor-pointer shrink-0"
				aria-label="Close tab"
			>
				<X className="w-3.5 h-3.5" />
			</button>
		</div>
	);
};

export default TabItem;

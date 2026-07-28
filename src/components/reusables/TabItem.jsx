import { useEffect, useState } from "react";
import { X } from "lucide-react";

const TabItem = ({ id, method, name, active, onClose, onRename }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(name);

	useEffect(() => {
		if (!isEditing) setEditValue(name);
	}, [name, isEditing]);

	const methodColors = {
		GET: "text-emerald-400",
		POST: "text-amber-400",
		PATCH: "text-sky-400",
		PUT: "text-blue-400",
		DELETE: "text-red-400",
	};

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
			className={`group flex items-center gap-1.5 px-2 py-1.5 text-[11px] border-r border-stone-800 min-w-24 max-w-44 cursor-pointer select-none ${
				active
					? "bg-stone-800 text-stone-100 border-t border-t-emerald-500"
					: "bg-stone-900/50 text-stone-500 hover:bg-stone-800"
			}`}
		>
			<span
				className={`font-mono font-bold text-[10px] shrink-0 ${methodColors[method] || "text-stone-400"}`}
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
					className="flex-1 min-w-0 bg-stone-950 text-stone-200 outline-none px-1 rounded-sm text-[11px]"
				/>
			) : (
				// biome-ignore lint/a11y/noStaticElementInteractions: nanti
				<span
					onDoubleClick={() => setIsEditing(true)}
					className="truncate flex-1 hover:text-emerald-400 transition-colors"
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
				className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-stone-700 rounded shrink-0"
			>
				<X className="w-3 h-3" />
			</button>
		</div>
	);
};

export default TabItem;

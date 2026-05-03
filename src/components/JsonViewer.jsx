import { useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, ChevronDown } from "lucide-react";

const getType = (val) => {
	if (val === null) return "null";
	if (Array.isArray(val)) return "array";
	return typeof val;
};

const ValueRenderer = ({ type, value }) => {
	switch (type) {
		case "string":
			return <span className="text-emerald-400">"{value}"</span>;
		case "number":
			return <span className="text-amber-400">{value}</span>;
		case "boolean":
			return <span className="text-sky-400">{value ? "true" : "false"}</span>;
		case "null":
			return <span className="text-red-400">null</span>;
		default:
			return <span className="text-stone-400">{String(value)}</span>;
	}
};

const JsonViewer = ({ data }) => {
	const parentRef = useRef(null);
	const [collapsed, setCollapsed] = useState(new Set());

	const toggleCollapse = (id) => {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const flatData = useMemo(() => {
		const result = [];

		const traverse = (node, path, depth, keyName, isLast) => {
			const type = getType(node);
			const isExpandable = type === "object" || type === "array";
			const isEmpty = isExpandable && Object.keys(node).length === 0;

			if (isExpandable && !isEmpty) {
				const isCollapsed = collapsed.has(path);
				const size = type === "array" ? node.length : Object.keys(node).length;
				const bracketStart = type === "array" ? "[" : "{";
				const bracketEnd = type === "array" ? "]" : "}";

				result.push({
					id: path,
					depth,
					keyName,
					isExpandable: true,
					isCollapsed,
					bracketStart,
					bracketEnd,
					size,
					hasComma: isCollapsed && !isLast,
				});

				if (!isCollapsed) {
					const keys = Object.keys(node);
					keys.forEach((k, idx) => {
						traverse(
							node[k],
							`${path}.${k}`,
							depth + 1,
							type === "array" ? null : k,
							idx === keys.length - 1,
						);
					});

					result.push({
						id: `${path}-end`,
						depth,
						isEnd: true,
						bracketEnd,
						hasComma: !isLast,
					});
				}
			} else {
				result.push({
					id: path,
					depth,
					keyName,
					type,
					value: node,
					isEmpty: isExpandable && isEmpty,
					bracketStart: type === "array" ? "[" : "{",
					bracketEnd: type === "array" ? "]" : "}",
					hasComma: !isLast,
				});
			}
		};

		traverse(data, "root", 0, null, true);
		return result;
	}, [data, collapsed]);

	const rowVirtualizer = useVirtualizer({
		count: flatData.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 24,
		overscan: 10,
	});

	return (
		<div
			ref={parentRef}
			className="w-full h-full overflow-auto bg-stone-950 font-mono text-xs text-stone-300"
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const line = flatData[virtualRow.index];
					const indent = line.depth * 1.5;

					return (
						<div
							key={virtualRow.key}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`,
								paddingLeft: `${indent}rem`,
							}}
							className="flex items-center hover:bg-stone-900/50 pr-4 w-max min-w-full group"
						>
							{/* Collapse/Expand Icon Space */}
							<div className="w-6 shrink-0 flex items-center justify-center -ml-6 z-10">
								{line.isExpandable && (
									<button
										type="button"
										onClick={() => toggleCollapse(line.id)}
										className="p-0.5 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors"
									>
										{line.isCollapsed ? (
											<ChevronRight className="w-3.5 h-3.5" />
										) : (
											<ChevronDown className="w-3.5 h-3.5" />
										)}
									</button>
								)}
							</div>

							{/* Key Name (if inside object) */}
							{line.keyName !== null && !line.isEnd && (
								<span className="text-stone-200 mr-1.5">"{line.keyName}":</span>
							)}

							{/* Expandable Start (Objects/Arrays) */}
							{line.isExpandable && (
								<span>
									<span className="text-stone-500">{line.bracketStart}</span>
									{line.isCollapsed && (
										// biome-ignore lint/a11y/noStaticElementInteractions: later
										// biome-ignore lint/a11y/useKeyWithClickEvents: later
										<span
											className="text-stone-500 mx-2 text-[10px] bg-stone-800/50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-stone-800 transition-colors"
											onClick={() => toggleCollapse(line.id)}
										>
											{line.size} items
										</span>
									)}
									{line.isCollapsed && (
										<span className="text-stone-500">{line.bracketEnd}</span>
									)}
								</span>
							)}

							{/* Closing Brackets */}
							{line.isEnd && (
								<span className="text-stone-500">{line.bracketEnd}</span>
							)}

							{/* Empty Object/Array */}
							{line.isEmpty && (
								<span className="text-stone-500">
									{line.bracketStart}
									{line.bracketEnd}
								</span>
							)}

							{/* Primitive Value */}
							{!line.isExpandable && !line.isEnd && !line.isEmpty && (
								<ValueRenderer type={line.type} value={line.value} />
							)}

							{/* Trailing Comma */}
							{line.hasComma && <span className="text-stone-500">,</span>}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default JsonViewer;

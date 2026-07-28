import { useState, useMemo, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, ChevronDown, Search, X, ChevronUp } from "lucide-react";

const getType = (val) => {
	if (val === null) return "null";
	if (Array.isArray(val)) return "array";
	return typeof val;
};

const Highlight = ({ text, search }) => {
	if (!search) return <span>{text}</span>;
	const parts = String(text).split(new RegExp(`(${search})`, "gi"));
	return (
		<span>
			{parts.map((part, i) =>
				part.toLowerCase() === search.toLowerCase() ? (
					<mark
						// biome-ignore lint/suspicious/noArrayIndexKey: later
						key={i}
						className="bg-emerald-500/40 text-emerald-100 rounded-sm px-0.5"
					>
						{part}
					</mark>
				) : (
					// biome-ignore lint/suspicious/noArrayIndexKey: later
					<span key={i}>{part}</span>
				),
			)}
		</span>
	);
};

const ValueRenderer = ({ type, value, search }) => {
	switch (type) {
		case "string":
			return (
				<span className="text-emerald-400">
					"<Highlight text={value} search={search} />"
				</span>
			);
		case "number":
			return (
				<span className="text-amber-400">
					<Highlight text={value} search={search} />
				</span>
			);
		case "boolean":
			return <span className="text-sky-400">{value ? "true" : "false"}</span>;
		case "null":
			return <span className="text-red-400">null</span>;
		default:
			return (
				<span className="text-stone-400">
					<Highlight text={String(value)} search={search} />
				</span>
			);
	}
};

const JsonViewer = ({ data }) => {
	const parentRef = useRef(null);
	const [collapsed, setCollapsed] = useState(new Set());

	const [searchQuery, setSearchQuery] = useState("");
	const [matches, setMatches] = useState([]);
	const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

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
				result.push({
					id: path,
					depth,
					keyName,
					isExpandable: true,
					isCollapsed,
					bracketStart: type === "array" ? "[" : "{",
					bracketEnd: type === "array" ? "]" : "}",
					size: type === "array" ? node.length : Object.keys(node).length,
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
						bracketEnd: type === "array" ? "]" : "}",
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

	useEffect(() => {
		if (!searchQuery.trim()) {
			setMatches([]);
			setCurrentMatchIndex(-1);
			return;
		}

		const lowerQuery = searchQuery.toLowerCase();
		const newMatches = [];

		flatData.forEach((line, index) => {
			let textToSearch = "";
			if (line.keyName !== null && !line.isEnd)
				textToSearch += String(line.keyName);
			if (!line.isExpandable && !line.isEnd && !line.isEmpty)
				textToSearch += String(line.value);

			if (textToSearch.toLowerCase().includes(lowerQuery)) {
				newMatches.push(index);
			}
		});

		setMatches(newMatches);

		if (newMatches.length > 0) {
			setCurrentMatchIndex(0);
			rowVirtualizer.scrollToIndex(newMatches[0], { align: "center" });
		} else {
			setCurrentMatchIndex(-1);
		}
	}, [searchQuery, flatData, rowVirtualizer]);

	const handleNextMatch = () => {
		if (matches.length === 0) return;
		const nextIndex = (currentMatchIndex + 1) % matches.length;
		setCurrentMatchIndex(nextIndex);
		rowVirtualizer.scrollToIndex(matches[nextIndex], { align: "center" });
	};

	const handlePrevMatch = () => {
		if (matches.length === 0) return;
		const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
		setCurrentMatchIndex(prevIndex);
		rowVirtualizer.scrollToIndex(matches[prevIndex], { align: "center" });
	};

	const handleSearchKeyDown = (e) => {
		if (e.key === "Enter") {
			if (e.shiftKey) handlePrevMatch();
			else handleNextMatch();
		}
	};

	return (
		<div className="absolute inset-0">
			<div className="flex flex-col w-full h-full bg-stone-950 relative">
				{/* --- Search Bar Toolbar --- */}
				<div className="absolute top-2 right-4 z-50 flex items-center bg-stone-900 border border-stone-700 rounded shadow-lg px-2 py-1 gap-2 opacity-60 focus-within:opacity-100 hover:opacity-100 transition-opacity">
					<Search className="w-3.5 h-3.5 text-stone-400" />

					<input
						type="text"
						placeholder="Find..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={handleSearchKeyDown}
						className="bg-transparent text-xs text-stone-200 outline-none w-32 font-mono"
					/>

					{/* Match Counter & Controls */}
					{searchQuery && (
						<div className="flex items-center gap-1 border-l border-stone-700 pl-2 ml-1">
							<span className="text-[10px] text-stone-500 font-mono mr-1">
								{matches.length > 0
									? `${currentMatchIndex + 1}/${matches.length}`
									: "0/0"}
							</span>
							<button
								type="button"
								onClick={handlePrevMatch}
								disabled={matches.length === 0}
								className="p-0.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded disabled:opacity-30"
							>
								<ChevronUp className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={handleNextMatch}
								disabled={matches.length === 0}
								className="p-0.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded disabled:opacity-30"
							>
								<ChevronDown className="w-3.5 h-3.5" />
							</button>
							<div className="w-px h-3 bg-stone-700 mx-1"></div>
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="p-0.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						</div>
					)}
				</div>

				{/* Virtualized JSON */}
				<div
					ref={parentRef}
					className="flex-1 w-full overflow-auto font-mono text-xs text-stone-300 pt-2"
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

							const isCurrentMatchRow =
								matches[currentMatchIndex] === virtualRow.index;

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
									className={`flex items-center hover:bg-stone-900/50 pr-4 w-max min-w-full group ${
										isCurrentMatchRow ? "bg-emerald-900/20" : ""
									}`}
								>
									<div className="w-6 shrink-0 flex items-center justify-center -ml-6 z-10">
										{line.isExpandable && (
											<button
												type="button"
												onClick={() => toggleCollapse(line.id)}
												className="p-0.5 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-800"
											>
												{line.isCollapsed ? (
													<ChevronRight className="w-3.5 h-3.5" />
												) : (
													<ChevronDown className="w-3.5 h-3.5" />
												)}
											</button>
										)}
									</div>

									{line.keyName !== null && !line.isEnd && (
										<span className="text-stone-200 mr-1.5">
											"<Highlight text={line.keyName} search={searchQuery} />
											":
										</span>
									)}

									{line.isExpandable && (
										<span>
											<span className="text-stone-500">
												{line.bracketStart}
											</span>
											{line.isCollapsed && (
												// biome-ignore lint/a11y/noStaticElementInteractions: later
												// biome-ignore lint/a11y/useKeyWithClickEvents: later
												<span
													className="text-stone-500 mx-2 text-[10px] bg-stone-800/50 px-1.5 py-0.5 rounded cursor-pointer"
													onClick={() => toggleCollapse(line.id)}
												>
													{line.size} items
												</span>
											)}
											{line.isCollapsed && (
												<span className="text-stone-500">
													{line.bracketEnd}
												</span>
											)}
										</span>
									)}

									{line.isEnd && (
										<span className="text-stone-500">{line.bracketEnd}</span>
									)}
									{line.isEmpty && (
										<span className="text-stone-500">
											{line.bracketStart}
											{line.bracketEnd}
										</span>
									)}

									{!line.isExpandable && !line.isEnd && !line.isEmpty && (
										<ValueRenderer
											type={line.type}
											value={line.value}
											search={searchQuery}
										/>
									)}

									{line.hasComma && <span className="text-stone-500">,</span>}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default JsonViewer;

import { useEffect, useState } from "react";
import { Copy, Globe, Loader2 } from "lucide-react";
import { useRip } from "../../context/RIPContext";
import { useToast } from "../../context/ToastContext";

import JsonViewer from "../JsonViewer";
import BlobViewer from "../BlobViewer";
import ErrorDisplay from "../Error";

const ResponseTab = () => {
	const { state, sendRequest } = useRip();
	const { workspaceTabs, activeWorkspaceTabId } = state;
	const { showToast } = useToast();

	const [responseView, setResponseView] = useState("body");
	const [copied, setCopied] = useState(false);

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	const isFetching = activeWorkspace?.isFetching ?? false;

	const handleCopy = async () => {
		if (!activeWorkspace.response) return;
		try {
			const textToCopy =
				activeWorkspace.response.type === "json"
					? JSON.stringify(activeWorkspace.response.content, null, 2)
					: activeWorkspace.response.content;
			await navigator.clipboard.writeText(textToCopy);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (err) {
			if (import.meta.env.DEV)
				console.error("Failed to copy response to clipboard:", err);
		}
	};

	useEffect(() => {
		if (isFetching) {
			setResponseView("body");
		}
	}, [isFetching]);

	return (
		<div className="flex flex-col h-full">
			{/* Response Toolbar */}
			<div className="flex items-center justify-between px-2 border-b border-stone-700 bg-stone-900/30 h-9 shrink-0">
				{/* Left: Status Badges */}
				<div className="flex items-center gap-2 px-1">
					<span
						className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
							activeWorkspace.response?.status >= 200 &&
							activeWorkspace.response?.status < 300
								? "bg-emerald-500/10 text-emerald-500"
								: activeWorkspace.response?.status >= 400
									? "bg-red-500/10 text-red-400"
									: "bg-stone-700 text-stone-400"
						}`}
					>
						{activeWorkspace.response?.status
							? `${activeWorkspace.response.status} ${activeWorkspace.response.statusText}`
							: "NO RESPONSE"}
					</span>
					<span className="text-[10px] text-stone-500">
						{activeWorkspace.response?.time || "0ms"}
					</span>
					<span className="text-[10px] text-stone-500">
						{activeWorkspace.response?.type || "Unknown"}
					</span>
					<span className="text-[10px] text-stone-500">
						{activeWorkspace.response?.size || "0KB"}
					</span>
				</div>
				{/* Center: View Toggle */}
				{activeWorkspace.response && (
					<div className="flex items-center bg-stone-950 rounded-md mt-0.5 p-0.5 border border-stone-800 absolute left-1/2 -translate-x-1/2">
						<button
							type="button"
							onClick={() => setResponseView("body")}
							className={`px-3 py-1 text-[10px] font-medium rounded-sm transition-colors ${
								responseView === "body"
									? "bg-stone-700 text-stone-100 shadow-sm"
									: "text-stone-500 hover:text-stone-300"
							}`}
						>
							Body
						</button>
						<button
							type="button"
							onClick={() => setResponseView("headers")}
							className={`px-3 py-1 text-[10px] font-medium rounded-sm transition-colors flex items-center gap-1 ${
								responseView === "headers"
									? "bg-stone-700 text-stone-100 shadow-sm"
									: "text-stone-500 hover:text-stone-300"
							}`}
						>
							Headers
							<span className="bg-stone-800/80 px-1.5 py-0.5 rounded-full text-[9px]">
								{activeWorkspace.response.headers?.length || 0}
							</span>
						</button>
					</div>
				)}
				{/* Right: Actions (Only show for body) */}
				<div className="flex items-center gap-1">
					{responseView === "body" && (
						<button
							type="button"
							onClick={handleCopy}
							disabled={
								!activeWorkspace.response ||
								activeWorkspace.response.type !== "json"
							}
							className="p-1.5 hover:bg-stone-700 rounded text-stone-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
							title="Copy Response Body"
						>
							{copied ? (
								<Check className="w-3.5 h-3.5 text-emerald-500" />
							) : (
								<Copy className="w-3.5 h-3.5" />
							)}
						</button>
					)}
				</div>
			</div>

			{/* Response Content */}
			<div className="flex-1 overflow-auto bg-stone-950 p-3 relative">
				{isFetching && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm flex-col gap-4 text-emerald-500 animate-in fade-in duration-200">
						<Loader2 className="w-8 h-8 animate-spin" />
						<span className="text-xs font-mono tracking-widest uppercase animate-pulse">
							Fetching Response...
						</span>
					</div>
				)}

				{!activeWorkspace.response && !isFetching && (
					<div className="absolute inset-0 flex items-center justify-center text-stone-700 flex-col gap-2">
						<Globe className="w-8 h-8 opacity-20" />
						<span className="text-sm">
							Enter a URL and send to get a response
						</span>
					</div>
				)}

				{/* --- BODY VIEW --- */}
				{activeWorkspace.response && responseView === "body" && (
					<>
						{activeWorkspace.response?.type === "html" && (
							<iframe
								srcDoc={activeWorkspace.response.content}
								className="w-full h-full border-0 bg-white rounded-sm"
								title="HTML Response"
								sandbox="allow-forms allow-scripts"
							/>
						)}

						{activeWorkspace.response?.type === "json" && (
							<JsonViewer data={activeWorkspace.response.content} />
						)}

						{activeWorkspace.response?.type === "blob" && (
							<BlobViewer
								blob={activeWorkspace.response.content}
								contentType={activeWorkspace.response.contentType}
								filename={activeWorkspace.response.filename}
							/>
						)}

						{activeWorkspace.response?.type === "text" && (
							<pre className="text-xs md:text-sm font-mono text-yellow-200 whitespace-pre-wrap">
								{activeWorkspace.response.content}
							</pre>
						)}

						{activeWorkspace.response?.type === "error" && (
							<ErrorDisplay
								error={activeWorkspace.response.content}
								onRetry={sendRequest}
							/>
						)}
					</>
				)}

				{/* --- HEADERS VIEW --- */}
				{activeWorkspace.response && responseView === "headers" && (
					<div className="w-full overflow-x-auto pb-4">
						<table className="w-full text-left border-collapse text-xs">
							<thead>
								<tr className="border-b border-stone-800 text-stone-500">
									<th className="py-2 px-2 font-medium w-1/3 min-w-37.5">
										Key
									</th>
									<th className="py-2 px-2 font-medium">Value</th>
								</tr>
							</thead>
							<tbody className="align-top">
								{(!activeWorkspace.response.headers ||
									activeWorkspace.response.headers.length === 0) && (
									<tr>
										<td
											colSpan="2"
											className="py-6 text-center text-stone-600 italic"
										>
											No headers received
										</td>
									</tr>
								)}

								{activeWorkspace.response.headers?.map((h, i) => (
									<tr
										// biome-ignore lint/suspicious/noArrayIndexKey: i had to
										key={i}
										className="border-b border-stone-800/50 hover:bg-stone-900/50 group transition-colors"
									>
										<td className="py-2.5 px-2 text-stone-300 font-mono break-all font-medium">
											{h.key}
										</td>
										<td className="py-2.5 px-2 text-stone-400 font-mono break-all relative pr-10">
											{h.value}
											<button
												type="button"
												onClick={async () => {
													await navigator.clipboard.writeText(h.value);
													showToast("Copied header value!", "success");
												}}
												className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-emerald-400 transition-all bg-stone-800 rounded border border-stone-700 shadow-sm"
												title="Copy Value"
											>
												<Copy className="w-3.5 h-3.5" />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default ResponseTab;

import { useState } from "react";
import { useRip } from "../context/RIPContext";
import { useToast } from "../context/ToastContext";
import { statusColor, tint } from "../utils/semantics";
import JsonViewer from "./JsonViewer";
import BlobViewer from "./BlobViewer";
import ErrorDisplay from "./Error";

/**
 * The response pane.
 *
 * In the Studio layout this is a PERMANENT right-hand column, not a tab: the
 * result of a request is always visible next to the request that produced it.
 * You no longer click through Auth -> Headers -> Queries -> Body -> Response
 * to see what came back.
 */
const ResponsePane = () => {
	const { state, sendRequest } = useRip();
	const { workspaceTabs, activeWorkspaceTabId } = state;
	const { showToast } = useToast();

	const [view, setView] = useState("body");
	const [copied, setCopied] = useState(false);

	const activeWorkspace = workspaceTabs.find(
		(tab) => tab.id === activeWorkspaceTabId,
	);

	const isFetching = activeWorkspace?.isFetching ?? false;
	const response = activeWorkspace?.response;

	// An error response carries no status, timing or size. Treating it as a
	// normal response made the status bar read "0ms 0KB" next to a failure.
	const isError = response?.type === "error";
	const hasMetrics = response && !isError && typeof response.status === "number";
	// The view toggle is hidden without metrics, so a failed request must
	// always show its body — otherwise a leftover "headers" view hides the error.
	const shownView = hasMetrics ? view : "body";

	const handleCopy = async () => {
		if (!response) return;
		try {
			const textToCopy =
				response.type === "json"
					? JSON.stringify(response.content, null, 2)
					: response.content;
			await navigator.clipboard.writeText(textToCopy);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (err) {
			if (import.meta.env.DEV)
				console.error("Failed to copy response to clipboard:", err);
		}
	};

	if (!activeWorkspace) return null;

	return (
		<section
			className="flex flex-col h-full min-h-0 bg-stone-950"
			aria-label="Response"
		>
			{/* Status bar: what came back, in plain numbers */}
			<div className="shrink-0 flex items-center gap-3 h-10 px-4 border-b border-stone-750 bg-stone-900">
				<h2 className="text-[12.5px] font-semibold text-stone-400 mr-1">
					Response
				</h2>

				{response ? (
					<>
						{hasMetrics ? (
							<>
								<span
									className="font-mono text-[12.5px] font-semibold px-2 py-0.5 rounded-md"
									style={{
										background: tint(statusColor(response.status)),
										color: statusColor(response.status),
									}}
								>
									{response.status} {response.statusText}
								</span>
								<span className="text-[12.5px] text-stone-500">
									<span className="text-stone-300">{response.time || "0ms"}</span>
								</span>
								<span className="text-[12.5px] text-stone-500">
									<span className="text-stone-300">{response.size || "0KB"}</span>
								</span>
							</>
						) : (
							<span className="text-[12.5px] text-red-500">Request failed</span>
						)}
					</>
				) : (
					<span className="text-[12.5px] text-stone-600">No response yet</span>
				)}

				{/* View toggle — meaningless for a failed request */}
				{hasMetrics && (
					<div className="ml-auto flex items-center gap-1">
						<div className="flex items-center gap-0.5 p-0.5 rounded-md bg-stone-900 border border-stone-750">
							<button
								type="button"
								onClick={() => setView("body")}
								className={`h-6 px-2.5 rounded text-[12.5px] transition-colors ${
									view === "body"
										? "bg-stone-850 text-stone-100"
										: "text-stone-500 hover:text-stone-300"
								}`}
							>
								Body
							</button>
							<button
								type="button"
								onClick={() => setView("headers")}
								className={`h-6 px-2.5 rounded text-[12.5px] transition-colors ${
									view === "headers"
										? "bg-stone-850 text-stone-100"
										: "text-stone-500 hover:text-stone-300"
								}`}
							>
								Headers
								<span className="ml-1.5 text-stone-600">
									{response.headers?.length || 0}
								</span>
							</button>
						</div>

						{view === "body" && (
							<button
								type="button"
								onClick={handleCopy}
								disabled={!response || response.type !== "json"}
								className="h-7 px-2.5 flex items-center rounded-md border border-stone-750 bg-stone-900 text-stone-400 transition-colors hover:text-stone-100 hover:border-stone-700 disabled:opacity-40 disabled:cursor-not-allowed"
								title="Copy response body"
							>
								{copied ? (
									<svg
										className="w-3.5 h-3.5 text-emerald-400"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								) : (
									<svg
										className="w-3.5 h-3.5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
										<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
									</svg>
								)}
							</button>
						)}
					</div>
				)}
			</div>

			{/* Body */}
			<div className="flex-1 min-h-0 overflow-auto relative">
				{isFetching && (
					<div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-stone-950/80">
						<svg
							className="w-7 h-7 animate-spin text-emerald-500"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
						>
							<path d="M21 12a9 9 0 1 1-6.219-8.56" />
						</svg>
						<span className="text-[12.5px] text-stone-400">Sending…</span>
					</div>
				)}

				{!response && !isFetching && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-600">
						<svg
							className="w-8 h-8 opacity-40"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="2" y1="12" x2="22" y2="12" />
							<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
						</svg>
						<span className="text-[13px]">
							Send a request to see the response
						</span>
					</div>
				)}

				{response && shownView === "body" && (
					<>
						{response.type === "html" && (
							<iframe
								srcDoc={response.content}
								className="w-full h-full border-0 bg-white"
								title="HTML Response"
								sandbox="allow-forms allow-scripts"
							/>
						)}

						{response.type === "json" && (
							<JsonViewer data={response.content} />
						)}

						{response.type === "blob" && (
							<BlobViewer
								blob={response.content}
								contentType={response.contentType}
								filename={response.filename}
							/>
						)}

						{response.type === "text" && (
							<pre className="p-4 text-[13px] font-mono text-stone-300 whitespace-pre-wrap break-words">
								{response.content}
							</pre>
						)}

						{response.type === "error" && (
							<ErrorDisplay
								error={response.content}
								onRetry={sendRequest}
							/>
						)}
					</>
				)}

				{response && shownView === "headers" && (
					<div className="w-full overflow-x-auto pb-4">
						<table className="w-full text-left border-collapse text-[12.5px]">
							<thead>
								<tr className="border-b border-stone-750 text-stone-500">
									<th className="py-2 px-4 font-medium w-1/3 min-w-30">Key</th>
									<th className="py-2 px-4 font-medium">Value</th>
								</tr>
							</thead>
							<tbody className="align-top">
								{(!response.headers || response.headers.length === 0) && (
									<tr>
										<td
											colSpan="2"
											className="py-6 px-4 text-center text-stone-600"
										>
											No headers received
										</td>
									</tr>
								)}

								{response.headers?.map((h, i) => (
									<tr
										// biome-ignore lint/suspicious/noArrayIndexKey: i had to
										key={i}
										className="border-b border-stone-800/60 hover:bg-stone-900/60 group transition-colors"
									>
										<td className="py-2.5 px-4 text-stone-300 font-mono break-all font-medium">
											{h.key}
										</td>
										<td className="py-2.5 px-4 text-stone-400 font-mono break-all relative pr-10">
											{h.value}
											<button
												type="button"
												onClick={async () => {
													await navigator.clipboard.writeText(h.value);
													showToast("Copied header value", "success");
												}}
												className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-emerald-400 transition-all bg-stone-850 rounded border border-stone-750"
												title="Copy value"
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
													<rect
														x="9"
														y="9"
														width="13"
														height="13"
														rx="2"
														ry="2"
													/>
													<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
												</svg>
											</button>
										</td>
									</tr>
								))}
					</tbody>
					</table>
				</div>
			)}
		</div>
	</section>
	);
};

export default ResponsePane;

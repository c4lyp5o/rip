import { AlertCircle, RefreshCw, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useRip } from "../context/RIPContext";
import { useToast } from "../context/ToastContext";

const ErrorDisplay = ({ error, onRetry }) => {
	const { sendRequest } = useRip();
	const handleRetry = onRetry || sendRequest;
	const { showToast } = useToast();

	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(error);
			setCopied(true);
			showToast("Error details copied", "success");
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			if (import.meta.env.DEV) console.error("Failed to copy error:", err);
			showToast("Failed to copy", "error");
		}
	};

	return (
		<div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in duration-500">
			<div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/20">
				<AlertCircle className="w-8 h-8 text-red-500" />
			</div>

			<h3 className="text-lg font-semibold text-stone-200 mb-2">
				Request Failed
			</h3>

			<p className="text-sm text-stone-500 max-w-md mb-6">
				Something went wrong while trying to reach the server. Check your
				connection or the URL and try again.
			</p>

			<div className="w-full max-w-2xl bg-stone-900/80 border border-red-900/30 rounded-lg overflow-hidden mb-6">
				<div className="flex items-center justify-between px-4 py-2 border-b border-stone-800 bg-stone-950/50">
					<span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">
						Error Details
					</span>
					<button
						type="button"
						onClick={handleCopy}
						className="p-1 hover:bg-stone-800 rounded transition-colors text-stone-500 hover:text-stone-300"
					>
						{copied ? (
							<Check className="w-3.5 h-3.5 text-emerald-500" />
						) : (
							<Copy className="w-3.5 h-3.5" />
						)}
					</button>
				</div>
				<div className="p-4 text-left">
					<pre className="text-xs font-mono text-stone-300 whitespace-pre-wrap break-all leading-relaxed">
						{error || "An unknown error occurred."}
					</pre>
				</div>
			</div>

			<button
				type="button"
				onClick={handleRetry}
				className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-5 py-2 rounded-md text-sm font-medium transition-all border border-stone-700 active:scale-95"
			>
				<RefreshCw className="w-4 h-4" />
				<span>Retry Request</span>
			</button>
		</div>
	);
};

export default ErrorDisplay;

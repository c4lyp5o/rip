import { Download, FileBox, HardDrive } from "lucide-react";
import { useToast } from "../context/ToastContext";

const BlobViewer = ({ blob, contentType, filename }) => {
	const { showToast } = useToast();

	const formatSize = (bytes) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const handleDownload = () => {
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		if (filename) {
			a.download = `${filename}`;
		} else {
			const extension = contentType.split("/")[1] || "bin";
			a.download = `rip-${crypto.randomUUID().replace(/-/g, "")}.${extension}`;
		}
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		showToast(`File downloaded successfully as ${a.download}!`);
	};

	if (!blob) return null;

	return (
		<div className="flex flex-col items-center justify-center h-full p-8 text-center select-none">
			{/* Icon Circle */}
			<div className="w-24 h-24 bg-stone-800/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-stone-700/50">
				<HardDrive className="w-10 h-10 text-emerald-500" />
			</div>

			{/* Title */}
			<h3 className="text-xl font-medium text-stone-200 mb-2">
				Binary Data Received
			</h3>

			{/* File Details */}
			<div className="flex items-center gap-4 text-sm text-stone-500 mb-8 bg-stone-900/50 px-4 py-2 rounded-lg border border-stone-800">
				<div className="flex items-center gap-2">
					<FileBox className="w-4 h-4" />
					<span className="font-mono">
						{blob.type || "application/octet-stream"}
					</span>
				</div>
				<div className="w-px h-4 bg-stone-700"></div>
				<span className="font-mono">{formatSize(blob.size)}</span>
			</div>

			{/* Download Button */}
			<button
				type="button"
				onClick={handleDownload}
				className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
			>
				<Download className="w-4 h-4" />
				<span>Download File</span>
			</button>
		</div>
	);
};

export default BlobViewer;

import { Download, Settings, Upload, X, Zap } from "lucide-react";
import { useRip } from "../../context/RIPContext";
import { useToast } from "../../context/ToastContext";
import { exportData, importData, setSetting } from "../../utils/ripDb";

const SettingsModal = ({ setIsSettingsModalOpen }) => {
	const { state, dispatch, refreshHistory, refreshCollections } = useRip();
	const { showToast } = useToast();

	if (!state.settingsLoaded) {
		return null;
	}

	const handleExportData = async () => {
		try {
			const data = await exportData();
			const blob = new Blob([JSON.stringify(data, null, 2)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `rip-backup-${new Date().toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);
			showToast(`Backup file downloaded as ${a.download}!`, "success");
		} catch (error) {
			if (import.meta.env.DEV) console.error("Failed to export data:", error);
			showToast("Failed to export data", "error");
		}
	};

	const handleImportData = (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const text = event.target?.result;
				if (typeof text !== "string") {
					throw new Error("Invalid file content");
				}

				const fromFile = JSON.parse(text);
				await importData(fromFile);
				await refreshHistory();
				await refreshCollections();
				setIsSettingsModalOpen(false);
				showToast("Data imported successfully", "success");
			} catch (err) {
				if (import.meta.env.DEV) console.error("Failed to import data:", err);
				showToast("Failed to import data", "error");
			}
		};
		reader.readAsText(file);
		e.target.value = null;
	};

	const handleNetworkDelayChange = async (e) => {
		const value = Number(e.target.value);
		dispatch({
			type: "SET_NETWORK_DELAY",
			payload: value,
		});
		try {
			await setSetting("networkDelay", value);
		} catch (error) {
			if (import.meta.env.DEV)
				console.error("Failed to persist network delay:", error);
			showToast("Failed to save network throttling", "error");
		}
	};

	return (
		<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 relative">
				<button
					type="button"
					onClick={() => setIsSettingsModalOpen(false)}
					className="absolute top-4 right-4 p-1 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-md transition"
				>
					<X className="w-5 h-5" />
				</button>
				<h3 className="text-xl font-medium text-stone-200 mb-6 flex items-center gap-2">
					<Settings className="w-5 h-5 text-stone-400" />
					Settings
				</h3>

				<div className="space-y-6">
					<div>
						<h4 className="text-sm font-medium text-stone-300 mb-1">
							Data Management
						</h4>
						<p className="text-xs text-stone-500 mb-4">
							Export your collections and history, or import from an existing
							backup.
						</p>

						<div className="flex gap-3">
							<button
								type="button"
								onClick={handleExportData}
								className="flex items-center justify-center gap-2 flex-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 py-2 px-4 rounded-md text-sm transition"
							>
								<Download className="w-4 h-4" />
								Export
							</button>

							<label className="flex items-center justify-center gap-2 flex-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 py-2 px-4 rounded-md text-sm cursor-pointer transition">
								<Upload className="w-4 h-4" />
								Import
								<input
									type="file"
									accept=".json"
									className="hidden"
									onChange={handleImportData}
								/>
							</label>
						</div>
					</div>

					<div className="pt-4 border-t border-stone-800">
						<h4 className="text-sm font-medium text-stone-300 mb-1 flex items-center gap-2">
							<Zap className="w-4 h-4 text-amber-500" />
							Network Throttling
						</h4>
						<p className="text-xs text-stone-500 mb-4">
							Simulate a slow connection to test your loading states.
						</p>
						<select
							value={state.networkDelay || 0}
							onChange={handleNetworkDelayChange}
							className="w-full bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
						>
							<option value={0}>No Throttling (Direct)</option>
							<option value={500}>Fast 3G (500ms delay)</option>
							<option value={2000}>Slow 3G (2000ms delay)</option>
							<option value={5000}>Extremely Slow (5000ms delay)</option>
						</select>
					</div>

					<div className="pt-4 border-t border-stone-800">
						<h4 className="text-sm font-medium text-stone-300 mb-4">
							Keyboard Shortcuts
						</h4>
						<div className="grid grid-cols-2 gap-y-4 gap-x-6">
							<div className="flex items-center justify-between">
								<span className="text-xs text-stone-400">New Tab</span>
								<div className="flex gap-1">
									<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
										Ctrl
									</kbd>
									<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
										T
									</kbd>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-stone-400">Close Tab</span>
								<div className="flex gap-1">
									<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
										Ctrl
									</kbd>
									<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
										W
									</kbd>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-stone-400">Save Request</span>
								<div className="flex gap-1">
									<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
										Ctrl
									</kbd>
									<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
										S
									</kbd>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-stone-400">Send Request</span>
								<div className="flex gap-1">
									<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
										Ctrl
									</kbd>
									<kbd className="bg-stone-800 border border-stone-700 text-stone-300 px-2 py-0.5 rounded text-[10px] font-mono shadow-sm">
										↵
									</kbd>
								</div>
							</div>
						</div>
						<p className="text-[10px] text-stone-600 mt-5 italic">
							* Mac users can use <kbd className="font-mono">Cmd ⌘</kbd> instead
							of <kbd className="font-mono">Ctrl</kbd>.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingsModal;

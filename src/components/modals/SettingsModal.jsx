import { Download, Settings, Upload, X, Zap } from "lucide-react";
import { useRip } from "../../context/RIPContext";
import { useToast } from "../../context/ToastContext";
import { exportData, importData, setSetting } from "../../utils/ripDb";

const Kbd = ({ children }) => (
	<kbd className="bg-stone-850 border border-stone-750 text-stone-300 px-1.5 py-0.5 rounded text-[11px] font-mono">
		{children}
	</kbd>
);

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
			<div className="bg-stone-900 border border-stone-750 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 relative">
				<button
					type="button"
					onClick={() => setIsSettingsModalOpen(false)}
					className="absolute top-4 right-4 p-1.5 rounded-md text-stone-500 hover:text-stone-200 hover:bg-stone-850 transition-colors bg-transparent border-0 cursor-pointer"
					aria-label="Close settings"
				>
					<X className="w-4 h-4" />
				</button>
				<h3 className="text-[15px] font-medium text-stone-100 mb-6 flex items-center gap-2">
					<Settings className="w-4 h-4 text-stone-500" />
					Settings
				</h3>

				<div className="space-y-6">
					<div>
						<h4 className="text-[13.5px] font-medium text-stone-200 mb-1">
							Data management
						</h4>
						<p className="text-[12.5px] text-stone-500 mb-4">
							Export your collections and history, or import from an existing
							backup.
						</p>

						<div className="flex gap-2">
							<button
								type="button"
								onClick={handleExportData}
								className="flex items-center justify-center gap-2 flex-1 h-9 bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-200 px-4 rounded-md text-[13px] transition-colors cursor-pointer"
							>
								<Download className="w-4 h-4" />
								Export
							</button>

							<label className="flex items-center justify-center gap-2 flex-1 h-9 bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-200 px-4 rounded-md text-[13px] cursor-pointer transition-colors">
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

					<div className="pt-5 border-t border-stone-800">
						<h4 className="text-[13.5px] font-medium text-stone-200 mb-1 flex items-center gap-2">
							<Zap className="w-4 h-4 text-amber-500" />
							Network throttling
						</h4>
						<p className="text-[12.5px] text-stone-500 mb-4">
							Simulate a slow connection to test your loading states.
						</p>
						<select
							value={state.networkDelay || 0}
							onChange={handleNetworkDelayChange}
							aria-label="Network throttling"
							className="w-full h-9 bg-stone-950 border border-stone-750 rounded-md px-3 text-[13px] text-stone-200 outline-none transition-colors focus:border-emerald-500 cursor-pointer"
						>
							<option value={0}>No throttling (direct)</option>
							<option value={500}>Fast 3G (500ms delay)</option>
							<option value={2000}>Slow 3G (2000ms delay)</option>
							<option value={5000}>Extremely slow (5000ms delay)</option>
						</select>
					</div>

					<div className="pt-5 border-t border-stone-800">
						<h4 className="text-[13.5px] font-medium text-stone-200 mb-4">
							Keyboard shortcuts
						</h4>
						<div className="grid grid-cols-2 gap-y-3.5 gap-x-6">
							{[
								["New tab", "T"],
								["Close tab", "W"],
								["Save request", "S"],
								["Send request", "↵"],
							].map(([label, key]) => (
								<div
									key={label}
									className="flex items-center justify-between"
								>
									<span className="text-[12.5px] text-stone-400">{label}</span>
									<div className="flex gap-1">
										<Kbd>Ctrl</Kbd>
										<Kbd>{key}</Kbd>
									</div>
								</div>
							))}
						</div>
						<p className="text-[12px] text-stone-600 mt-4">
							* Mac users can use <Kbd>Cmd ⌘</Kbd> instead of <Kbd>Ctrl</Kbd>.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingsModal;

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Download, Upload } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";

/**
 * Theme picker. A single quiet button that opens a list of themes; the
 * current one is marked. Import/export uses the clipboard so nothing is
 * silently lost.
 */
const ThemeMenu = () => {
	const { themeId, setTheme, themes, importTheme, exportTheme } = useTheme();
	const { showToast } = useToast();
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	const current = themes.find((t) => t.id === themeId);

	useEffect(() => {
		if (!open) return;
		const onClick = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	const handleImport = async () => {
		const json = window.prompt("Paste a theme JSON:");
		if (!json) return;
		try {
			await importTheme(json);
			setOpen(false);
			showToast("Theme imported", "success");
		} catch (e) {
			showToast(`Invalid theme: ${e.message}`, "error");
		}
	};

	const handleExport = async () => {
		const json = exportTheme(themeId);
		if (!json) return;
		try {
			await navigator.clipboard.writeText(json);
			setOpen(false);
			showToast("Theme JSON copied to clipboard", "success");
		} catch {
			showToast("Could not copy theme JSON", "error");
		}
	};

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-haspopup="listbox"
				aria-expanded={open}
				className="w-full flex items-center justify-between gap-2 px-2.5 h-8 rounded-md bg-transparent border border-stone-750 text-stone-300 text-[12.5px] cursor-pointer transition-colors hover:bg-stone-850 hover:border-stone-700"
			>
				<span className="truncate">{current?.name || themeId}</span>
				<ChevronDown className="w-3.5 h-3.5 shrink-0 text-stone-500" />
			</button>

			{open && (
				<div
					role="listbox"
					className="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-stone-750 bg-stone-900 p-1 z-50 shadow-xl"
				>
					{themes.map((t) => (
						<button
							key={t.id}
							type="button"
							role="option"
							aria-selected={t.id === themeId}
							onClick={() => {
								setTheme(t.id);
								setOpen(false);
							}}
							className="w-full flex items-center gap-2 px-2.5 h-8 rounded-md bg-transparent border-0 text-stone-300 text-[12.5px] text-left cursor-pointer transition-colors hover:bg-stone-850"
						>
							<span
								className="w-3 h-3 rounded-sm shrink-0"
								style={{ background: t.vars["--bg"] }}
							/>
							<span
								className="w-3 h-3 rounded-sm shrink-0"
								style={{ background: t.vars["--green"] }}
							/>
							<span className="flex-1 truncate">{t.name}</span>
							{t.id === themeId && (
								<Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
							)}
						</button>
					))}

					<div className="h-px my-1 bg-stone-750" />

					<button
						type="button"
						onClick={handleImport}
						className="w-full flex items-center gap-2 px-2.5 h-8 rounded-md bg-transparent border-0 text-stone-400 text-[12.5px] text-left cursor-pointer transition-colors hover:bg-stone-850 hover:text-stone-200"
					>
						<Upload className="w-3.5 h-3.5" />
						Import
					</button>
					<button
						type="button"
						onClick={handleExport}
						className="w-full flex items-center gap-2 px-2.5 h-8 rounded-md bg-transparent border-0 text-stone-400 text-[12.5px] text-left cursor-pointer transition-colors hover:bg-stone-850 hover:text-stone-200"
					>
						<Download className="w-3.5 h-3.5" />
						Export
					</button>
				</div>
			)}
		</div>
	);
};

export default ThemeMenu;

import { isMobile } from "./platform";

/**
 * Save a Blob to a file the user can find.
 *
 * Desktop webviews honour <a download>, so a temporary link is enough. The
 * Android WebView silently ignores it, so on mobile the system save dialog
 * picks a location and the fs plugin writes the bytes there.
 *
 * Resolves to the file name it saved under, or null when the user cancelled
 * the dialog.
 *
 * @param {Blob} blob
 * @param {string} filename suggested name
 * @returns {Promise<string | null>}
 */
export const saveBlob = async (blob, filename) => {
	if (isMobile()) {
		const [{ save }, { writeFile }] = await Promise.all([
			import("@tauri-apps/plugin-dialog"),
			import("@tauri-apps/plugin-fs"),
		]);
		const path = await save({ defaultPath: filename });
		if (!path) return null;
		await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
		return filename;
	}

	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
	return filename;
};

import { isTauri } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/**
 * Ask the release feed whether a newer signed build exists.
 *
 * Resolves to the plugin's Update object, or null when the app is already
 * current — and always null outside the Tauri shell (browser preview,
 * jsdom), where the updater plugin does not exist.
 */
export const checkForUpdate = async () => {
	if (!isTauri()) return null;
	return check();
};

/**
 * Download and install an update returned by checkForUpdate, then restart
 * into the new version. The plugin verifies the build's signature against
 * the public key in tauri.conf.json before installing.
 */
export const installUpdate = async (update) => {
	await update.downloadAndInstall();
	await relaunch();
};

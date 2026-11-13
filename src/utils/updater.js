import { isTauri } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { isMobile } from "./platform";

/**
 * Ask the release feed whether a newer signed build exists.
 *
 * Resolves to the plugin's Update object, or null when the app is already
 * current — and always null outside the Tauri shell (browser preview,
 * jsdom) and in the mobile builds, where the updater plugin does not exist:
 * Android updates arrive through the Play Store or a fresh APK.
 */
export const checkForUpdate = async () => {
	if (!isTauri() || isMobile()) return null;
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

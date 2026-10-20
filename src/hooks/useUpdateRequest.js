import { useCallback } from "react";
import { useRip } from "../context/RIPContext";
import { useToast } from "../context/ToastContext";
import { updateRequest } from "../utils/ripDb";

/**
 * Persist the active request back to its saved copy.
 *
 * Both entry points — the Save button in the composer and the Ctrl+S
 * shortcut — call THIS, so the two paths can never drift apart. That drift
 * was the root of the reported "changing a header does not persist" bug.
 */
const useUpdateRequest = () => {
	const { state, refreshCollections } = useRip();
	const { showToast } = useToast();

	return useCallback(
		async (tabOverride = null) => {
			const tab =
				tabOverride ??
				state.workspaceTabs.find((t) => t.id === state.activeWorkspaceTabId);

			if (!tab || !tab.savedRequestId) return false;

			try {
				await updateRequest(tab.savedRequestId, {
					name: tab.name || tab.url || "Untitled",
					method: tab.method,
					url: tab.url,
					headers: tab.headers,
					queries: tab.queries,
					body: tab.body,
					auth: tab.auth,
				});
				await refreshCollections();
				showToast("Saved changes", "success");
				return true;
			} catch (error) {
				if (import.meta.env.DEV)
					console.error("Failed to update saved request:", error);
				showToast("Failed to update request", "error");
				return false;
			}
		},
		[state.workspaceTabs, state.activeWorkspaceTabId, refreshCollections, showToast],
	);
};

export default useUpdateRequest;

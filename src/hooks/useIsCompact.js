import { useSyncExternalStore } from "react";

// Below this width the side-by-side layout stops fitting: phones in either
// orientation, and narrow windows. Tablets keep the desktop layout.
const COMPACT_QUERY = "(max-width: 767px)";

const getQuery = () =>
	typeof window !== "undefined" && typeof window.matchMedia === "function"
		? window.matchMedia(COMPACT_QUERY)
		: null;

const subscribe = (onChange) => {
	const query = getQuery();
	if (!query) return () => {};
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
};

const getSnapshot = () => getQuery()?.matches ?? false;

/**
 * True when the viewport is too narrow for the sidebar and both panes, so
 * the shell switches to a drawer sidebar and a Request/Response toggle.
 */
const useIsCompact = () => useSyncExternalStore(subscribe, getSnapshot, () => false);

export default useIsCompact;

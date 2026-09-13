import { useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";
import { setSetting } from "../utils/ripDb";

const useSidebarResize = (sidebarWidth, dispatch) => {
	const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
	const sidebarWidthRef = useRef(sidebarWidth);
	const { showToast } = useToast();

	useEffect(() => {
		sidebarWidthRef.current = sidebarWidth;
	}, [sidebarWidth]);

	useEffect(() => {
		const persistSidebarWidth = async (width) => {
			try {
				await setSetting("sidebarWidth", width);
			} catch (error) {
				if (import.meta.env.DEV)
					console.error("Failed to save sidebar width:", error);
				showToast("Failed to persist sidebar width", "error");
			}
		};

		const handleMouseMove = (e) => {
			if (!isDraggingSidebar) return;
			const newWidth = Math.max(160, Math.min(e.clientX, 600));
			dispatch({ type: "SET_SIDEBAR_WIDTH", payload: newWidth });
			sidebarWidthRef.current = newWidth;
		};

		const handleMouseUp = () => {
			setIsDraggingSidebar(false);
			persistSidebarWidth(sidebarWidthRef.current);
		};

		if (isDraggingSidebar) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
			document.body.style.userSelect = "none";
			document.body.style.cursor = "col-resize";
		} else {
			document.body.style.userSelect = "";
			document.body.style.cursor = "";
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.body.style.userSelect = "";
			document.body.style.cursor = "";
		};
	}, [isDraggingSidebar, dispatch, showToast]);

	return { isDraggingSidebar, setIsDraggingSidebar, sidebarWidthRef };
};

export default useSidebarResize;

import {
	createContext,
	useContext,
	useEffect,
	useReducer,
	useRef,
	useCallback,
} from "react";
import { executeRequest } from "../utils/requestHelper";
import { parseUrlInput, safeParseJson } from "../utils/parser";
import {
	initDb,
	addToHistory,
	getHistoryItems,
	getCollectionsTree,
} from "../utils/ripDb";

const RipContext = createContext(null);

const defaultWorkspaceTabTemplate = {
	name: "New Request",
	savedRequestId: null,
	activeSubTab: "response",
	method: "GET",
	url: "",
	queries: [],
	headers: [
		{ key: "Content-Type", value: "application/json", active: true },
		{ key: "Accept", value: "application/json", active: true },
		{
			key: "User-Agent",
			value: `RIP/1.0 (REST In Peace Client)`,
			active: true,
		},
	],
	bodyType: "raw",
	body: "",
	formData: [],
	auth: { type: "none", token: "", username: "", password: "" },
	response: null,
	isFetching: false,
};

const createDefaultTab = (overrides = {}) => {
	const id = crypto.randomUUID();
	const headers = (defaultWorkspaceTabTemplate.headers || []).map((h) => ({
		...h,
		id: crypto.randomUUID(),
	}));
	const queries = (defaultWorkspaceTabTemplate.queries || []).map((q) => ({
		...q,
		id: crypto.randomUUID(),
	}));
	return {
		id,
		...defaultWorkspaceTabTemplate,
		headers,
		queries,
		...overrides,
	};
};

const ripReducerInitialState = {
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
	workspaceTabs: [createDefaultTab()],
	activeWorkspaceTabId: null,
	history: [],
	collections: [],
	networkDelay: 0,
};

ripReducerInitialState.activeWorkspaceTabId =
	ripReducerInitialState.workspaceTabs[0]?.id ?? null;

const getActiveTab = (state) =>
	state.workspaceTabs.find((t) => t.id === state.activeWorkspaceTabId);

const updateTab = (state, updates, tabId = state.activeWorkspaceTabId) => ({
	...state,
	workspaceTabs: state.workspaceTabs.map((tab) =>
		tab.id === tabId ? { ...tab, ...updates } : tab,
	),
});

const normalizeHeaders = (raw) => {
	const parsed = safeParseJson(raw, null);
	if (Array.isArray(parsed)) {
		return parsed.map((h) => ({
			id: h?.id ?? crypto.randomUUID(),
			key: String(h?.key ?? ""),
			value: String(h?.value ?? ""),
			active: h?.active === undefined ? true : Boolean(h.active),
		}));
	}
	return createDefaultTab().headers;
};

const normalizeQueries = (raw) => {
	const parsed = safeParseJson(raw, null);
	if (Array.isArray(parsed)) {
		return parsed.map((q) => ({
			id: q?.id ?? crypto.randomUUID(),
			key: String(q?.key ?? ""),
			value: String(q?.value ?? ""),
			active: q?.active === undefined ? true : Boolean(q.active),
		}));
	}
	return [];
};

const syncUrlFromQueries = (url, queries) => {
	const baseUrl = (url || "").split("?")[0];
	const activeQueries = (queries || []).filter(
		(q) => q.active && (q.key || q.value),
	);

	if (activeQueries.length === 0) return baseUrl;

	const queryString = activeQueries
		.map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
		.join("&");

	return `${baseUrl}?${queryString}`;
};

const ripReducer = (state, action) => {
	switch (action.type) {
		case "SET_SAVED_REQUEST_ID": {
			const { tabId, savedRequestId } = action.payload;
			return updateTab(state, { savedRequestId }, tabId);
		}
		case "SET_TAB_NAME": {
			const { id, name } = action.payload;
			return updateTab(state, { name }, id);
		}
		case "SET_METHOD": {
			const method = action.payload;
			const activeTab = getActiveTab(state);
			if (!activeTab) return state;
			const newActiveSubTab =
				method === "GET" && activeTab.activeSubTab === "body"
					? "response"
					: activeTab.activeSubTab;
			return updateTab(state, { method, activeSubTab: newActiveSubTab });
		}
		case "SET_URL": {
			const newUrl = action.payload;
			const tab = getActiveTab(state);
			if (!tab) return state;

			const currentQueryString = (tab.url || "").split("?")[1] || "";
			const newQueryString = (newUrl || "").split("?")[1] || "";

			if (currentQueryString !== newQueryString) {
				const { newQueries } = parseUrlInput(newUrl);
				const inactiveQueries = (tab.queries || []).filter((q) => !q.active);
				return updateTab(state, {
					url: newUrl,
					queries: [...(newQueries || []), ...inactiveQueries],
				});
			}

			return updateTab(state, { url: newUrl });
		}
		case "SET_HEADERS": {
			return updateTab(state, { headers: action.payload });
		}
		case "ADD_QUERY": {
			const activeTab = getActiveTab(state);
			if (!activeTab) return state;
			const newQuery = {
				id: crypto.randomUUID(),
				key: "",
				value: "",
				active: true,
			};
			const updatedQueries = [...(activeTab.queries || []), newQuery];
			const newUrl = syncUrlFromQueries(activeTab.url, updatedQueries);
			return updateTab(state, { queries: updatedQueries, url: newUrl });
		}
		case "DELETE_QUERY": {
			const updatedQueries = (getActiveTab(state).queries || []).filter(
				(q) => q.id !== action.payload,
			);
			const newUrl = syncUrlFromQueries(
				getActiveTab(state).url,
				updatedQueries,
			);
			return updateTab(state, { queries: updatedQueries, url: newUrl });
		}
		case "UPDATE_QUERY": {
			const { id, field, value } = action.payload;
			const tab = getActiveTab(state);
			if (!tab) return state;
			const updatedQueries = (tab.queries || []).map((q) =>
				q.id === id ? { ...q, [field]: value } : q,
			);
			const newUrl = syncUrlFromQueries(tab.url, updatedQueries);
			return updateTab(state, { queries: updatedQueries, url: newUrl });
		}
		case "ADD_HEADER": {
			const newHeader = {
				id: crypto.randomUUID(),
				key: "",
				value: "",
				active: true,
			};
			return updateTab(state, {
				headers: [...(getActiveTab(state).headers || []), newHeader],
			});
		}
		case "DELETE_HEADER": {
			const currentHeaders = getActiveTab(state).headers || [];
			return updateTab(state, {
				headers: currentHeaders.filter((h) => h.id !== action.payload),
			});
		}
		case "UPDATE_HEADER": {
			const { id, field, value } = action.payload;
			const currentHeaders = getActiveTab(state).headers || [];
			const updatedHeaders = currentHeaders.map((h) =>
				h.id === id ? { ...h, [field]: value } : h,
			);
			return updateTab(state, { headers: updatedHeaders });
		}
		case "SET_BODY_TYPE": {
			return updateTab(state, { bodyType: action.payload });
		}
		case "SET_BODY": {
			return updateTab(state, { body: action.payload });
		}
		case "ADD_FORM_DATA": {
			const newItem = {
				id: crypto.randomUUID(),
				key: "",
				value: "",
				type: "text",
				file: null,
				active: true,
			};
			return updateTab(state, {
				formData: [...(getActiveTab(state).formData || []), newItem],
			});
		}
		case "UPDATE_FORM_DATA": {
			const { id, field, value } = action.payload;
			const updated = (getActiveTab(state).formData || []).map((f) =>
				f.id === id ? { ...f, [field]: value } : f,
			);
			return updateTab(state, { formData: updated });
		}
		case "DELETE_FORM_DATA": {
			const updated = (getActiveTab(state).formData || []).filter(
				(f) => f.id !== action.payload,
			);
			return updateTab(state, { formData: updated });
		}
		case "SET_AUTH": {
			const currentAuth = getActiveTab(state).auth || {
				type: "none",
				token: "",
				username: "",
				password: "",
			};
			return updateTab(state, { auth: { ...currentAuth, ...action.payload } });
		}
		case "SET_RESPONSE": {
			const { tabId, response } = action.payload;
			return {
				...state,
				workspaceTabs: state.workspaceTabs.map((tab) =>
					tab.id === tabId
						? {
								...tab,
								isFetching: false,
								name:
									tab.name === "New Request" && tab.url ? tab.url : tab.name,
								response,
							}
						: tab,
				),
			};
		}
		case "SET_FETCHING": {
			const { tabId, isFetching } = action.payload;
			return {
				...state,
				workspaceTabs: state.workspaceTabs.map((tab) =>
					tab.id === tabId ? { ...tab, isFetching } : tab,
				),
			};
		}
		case "ADD_WORKSPACE_TAB": {
			const newTab = createDefaultTab();
			return {
				...state,
				workspaceTabs: [...state.workspaceTabs, newTab],
				activeWorkspaceTabId: newTab.id,
			};
		}
		case "ADD_WORKSPACE_TAB_FROM_DB": {
			const { id, data } = action.payload;

			const headers = normalizeHeaders(data.headers);
			const queries = normalizeQueries(data.queries);
			const body = data.body;
			const auth = safeParseJson(data.auth, { type: "none" }) ?? {
				type: "none",
			};

			const newTab = {
				...createDefaultTab(),
				id,
				name: data.name || data.url || "Request",
				savedRequestId: data.collection_id ? data.id : null,
				activeSubTab: "response",
				method: data.method || "GET",
				url: data.url || "",
				queries:
					queries.length > 0
						? queries
						: parseUrlInput(data.url || "").newQueries,
				headers,
				bodyType: data.bodyType || "raw",
				body,
				formData: Array.isArray(data.formData)
					? data.formData.map((f) => ({ ...f }))
					: [],
				auth,
				response: null,
				isFetching: false,
			};

			return {
				...state,
				workspaceTabs: [...state.workspaceTabs, newTab],
				activeWorkspaceTabId: id,
			};
		}
		case "DELETE_WORKSPACE_TAB": {
			const newWorkspaceTabs = state.workspaceTabs.filter(
				(tab) => tab.id !== action.payload,
			);
			let newActiveTabId = state.activeWorkspaceTabId;
			if (state.activeWorkspaceTabId === action.payload) {
				newActiveTabId =
					newWorkspaceTabs.length > 0
						? newWorkspaceTabs[newWorkspaceTabs.length - 1].id
						: null;
			}
			return {
				...state,
				workspaceTabs: newWorkspaceTabs,
				activeWorkspaceTabId: newActiveTabId,
			};
		}
		case "SET_WORKSPACE_TABS": {
			return { ...state, workspaceTabs: action.payload };
		}
		case "SET_ACTIVE_WORKSPACE_TAB": {
			return { ...state, activeWorkspaceTabId: action.payload };
		}
		case "SET_ACTIVE_SUB_TAB": {
			return updateTab(state, { activeSubTab: action.payload });
		}
		case "SET_HISTORY": {
			return { ...state, history: action.payload };
		}
		case "DELETE_HISTORY_ITEM": {
			const newHistory = state.history.filter(
				(item) => item.id !== action.payload,
			);
			return { ...state, history: newHistory };
		}
		case "CLEAR_HISTORY": {
			return { ...state, history: [] };
		}
		case "SET_COLLECTIONS": {
			return { ...state, collections: action.payload };
		}
		case "SET_NETWORK_DELAY": {
			return { ...state, networkDelay: action.payload };
		}
		default:
			return state;
	}
};

export const RipProvider = ({ children }) => {
	const [state, dispatch] = useReducer(ripReducer, ripReducerInitialState);

	const fetcherRef = useRef();

	const refreshHistory = useCallback(async () => {
		const history = await getHistoryItems();
		dispatch({ type: "SET_HISTORY", payload: history });
	}, []);

	const refreshCollections = useCallback(async () => {
		const collections = await getCollectionsTree();
		dispatch({ type: "SET_COLLECTIONS", payload: collections });
	}, []);

	const handleRequest = useCallback(
		async (currentTab, delay = 0) => {
			if (!currentTab) return;

			dispatch({
				type: "SET_FETCHING",
				payload: { tabId: currentTab.id, isFetching: true },
			});

			if (delay > 0) {
				await new Promise((resolve) => setTimeout(resolve, delay));
			}

			let response = null;

			try {
				response = await executeRequest(currentTab);

				if (!currentTab.savedRequestId) {
					await addToHistory({
						name: currentTab.url,
						method: currentTab.method,
						url: currentTab.url,
						status: response.status,
						time: response.timeRaw,
						size: response.size,
						headers: currentTab.headers,
						queries: currentTab.queries,
						body: currentTab.body,
						auth: currentTab.auth,
					});

					await refreshHistory();
				}
			} catch (error) {
				if (import.meta.env.DEV) console.error("Request failed:", error);
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				response = { type: "error", content: errorMessage };
			} finally {
				dispatch({
					type: "SET_RESPONSE",
					payload: { tabId: currentTab.id, response },
				});
			}
		},
		[refreshHistory],
	);

	useEffect(() => {
		const init = async () => {
			await initDb();
			await refreshHistory();
			await refreshCollections();
		};
		init();
	}, [refreshHistory, refreshCollections]);

	useEffect(() => {
		fetcherRef.current = handleRequest;
	}, [handleRequest]);

	return (
		<RipContext.Provider
			value={{
				state,
				dispatch,
				fetcherRef,
				refreshHistory,
				refreshCollections,
			}}
		>
			{children}
		</RipContext.Provider>
	);
};

export const useRip = () => {
	const context = useContext(RipContext);
	if (!context) {
		throw new Error("useRip must be used within RipProvider");
	}
	return context;
};

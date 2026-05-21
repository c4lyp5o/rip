import {
	createContext,
	useContext,
	useEffect,
	useReducer,
	useRef,
	useCallback,
} from "react";
import { executeRequest } from "../utils/requestHelper";
import { parseUrlInput } from "../utils/urlParser";
import {
	initDb,
	addToHistory,
	getHistoryItems,
	getCollectionsTree,
} from "../utils/historyDb";

const RipContext = createContext(null);

const defaultWorkspaceTab = {
	id: crypto.randomUUID(),
	name: "New Request",
	savedRequestId: null,
	activeSubTab: "response",
	method: "GET",
	url: "",
	queries: [],
	headers: [
		{
			id: crypto.randomUUID(),
			key: "Content-Type",
			value: "application/json",
			active: true,
		},
		{
			id: crypto.randomUUID(),
			key: "Accept",
			value: "application/json",
			active: true,
		},
		{
			id: crypto.randomUUID(),
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

const ripReducerInitialState = {
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
	workspaceTabs: [defaultWorkspaceTab],
	activeWorkspaceTabId: defaultWorkspaceTab.id,
	history: [],
	collections: [],
	networkDelay: 0,
};

const getActiveTab = (state) =>
	state.workspaceTabs.find((tab) => tab.id === state.activeWorkspaceTabId);

const updateActiveTab = (state, updates) => ({
	...state,
	workspaceTabs: state.workspaceTabs.map((tab) =>
		tab.id === state.activeWorkspaceTabId ? { ...tab, ...updates } : tab,
	),
});

const syncUrlFromQueries = (url, queries) => {
	const baseUrl = url.split("?")[0];
	const activeQueries = queries.filter((q) => q.active && (q.key || q.value));

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

			return {
				...state,
				workspaceTabs: state.workspaceTabs.map((tab) =>
					tab.id === tabId ? { ...tab, savedRequestId } : tab,
				),
			};
		}
		case "SET_TAB_NAME": {
			const { id, name } = action.payload;
			return {
				...state,
				workspaceTabs: state.workspaceTabs.map((tab) =>
					tab.id === id ? { ...tab, name } : tab,
				),
			};
		}
		case "SET_METHOD": {
			return {
				...state,
				workspaceTabs: state.workspaceTabs.map((tab) => {
					if (tab.id === state.activeWorkspaceTabId) {
						const newActiveSubTab =
							action.payload === "GET" && tab.activeSubTab === "body"
								? "response"
								: tab.activeSubTab;

						return {
							...tab,
							method: action.payload,
							activeSubTab: newActiveSubTab,
						};
					}
					return tab;
				}),
			};
		}
		case "SET_URL": {
			const newUrl = action.payload;
			const tab = getActiveTab(state);

			const currentQueryString = tab.url.split("?")[1] || "";
			const newQueryString = newUrl.split("?")[1] || "";

			if (currentQueryString !== newQueryString) {
				const { newQueries } = parseUrlInput(newUrl);
				const inactiveQueries = (tab.queries || []).filter((q) => !q.active);
				return updateActiveTab(state, {
					url: newUrl,
					queries: [...newQueries, ...inactiveQueries],
				});
			}

			return updateActiveTab(state, { url: newUrl });
		}
		case "SET_HEADERS": {
			return updateActiveTab(state, { headers: action.payload });
		}
		case "ADD_QUERY": {
			const newQuery = {
				id: crypto.randomUUID(),
				key: "",
				value: "",
				active: true,
			};
			const updatedQueries = [...(getActiveTab(state).queries || []), newQuery];
			const newUrl = syncUrlFromQueries(
				getActiveTab(state).url,
				updatedQueries,
			);
			return updateActiveTab(state, { queries: updatedQueries, url: newUrl });
		}
		case "DELETE_QUERY": {
			const updatedQueries = (getActiveTab(state).queries || []).filter(
				(q) => q.id !== action.payload,
			);
			const newUrl = syncUrlFromQueries(
				getActiveTab(state).url,
				updatedQueries,
			);
			return updateActiveTab(state, { queries: updatedQueries, url: newUrl });
		}
		case "UPDATE_QUERY": {
			const { id, field, value } = action.payload;
			const tab = getActiveTab(state);
			const updatedQueries = (tab.queries || []).map((q) =>
				q.id === id ? { ...q, [field]: value } : q,
			);
			const newUrl = syncUrlFromQueries(tab.url, updatedQueries);
			return updateActiveTab(state, { queries: updatedQueries, url: newUrl });
		}
		case "ADD_HEADER": {
			const newHeader = {
				id: crypto.randomUUID(),
				key: "",
				value: "",
				active: true,
			};

			return updateActiveTab(state, {
				headers: [...(getActiveTab(state).headers || []), newHeader],
			});
		}
		case "DELETE_HEADER": {
			const currentHeaders = getActiveTab(state).headers || [];
			return updateActiveTab(state, {
				headers: currentHeaders.filter((h) => h.id !== action.payload),
			});
		}
		case "UPDATE_HEADER": {
			const { id, field, value } = action.payload;
			const currentHeaders = getActiveTab(state).headers || [];

			const updatedHeaders = currentHeaders.map((h) =>
				h.id === id ? { ...h, [field]: value } : h,
			);

			return updateActiveTab(state, { headers: updatedHeaders });
		}
		case "SET_BODY_TYPE": {
			return updateActiveTab(state, { bodyType: action.payload });
		}
		case "SET_BODY": {
			return {
				...state,
				workspaceTabs: state.workspaceTabs.map((tab) =>
					tab.id === state.activeWorkspaceTabId
						? { ...tab, body: action.payload }
						: tab,
				),
			};
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
			return updateActiveTab(state, {
				formData: [...(getActiveTab(state).formData || []), newItem],
			});
		}
		case "UPDATE_FORM_DATA": {
			const { id, field, value } = action.payload;
			const updated = (getActiveTab(state).formData || []).map((f) =>
				f.id === id ? { ...f, [field]: value } : f,
			);
			return updateActiveTab(state, { formData: updated });
		}
		case "DELETE_FORM_DATA": {
			const updated = (getActiveTab(state).formData || []).filter(
				(f) => f.id !== action.payload,
			);
			return updateActiveTab(state, { formData: updated });
		}
		case "SET_AUTH": {
			const currentAuth = getActiveTab(state).auth || {
				type: "none",
				token: "",
				username: "",
				password: "",
			};
			return updateActiveTab(state, {
				auth: { ...currentAuth, ...action.payload },
			});
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
			const newWorkspaceTabs = [
				...state.workspaceTabs,
				{
					id: crypto.randomUUID(),
					name: defaultWorkspaceTab.name,
					savedRequestId: null,
					activeSubTab: defaultWorkspaceTab.activeSubTab,
					method: defaultWorkspaceTab.method,
					url: defaultWorkspaceTab.url,
					queries: [...defaultWorkspaceTab.queries].map((q) => ({ ...q })),
					headers: [...defaultWorkspaceTab.headers].map((h) => ({
						...h,
						id: crypto.randomUUID(),
					})),
					bodyType: defaultWorkspaceTab.bodyType,
					body: defaultWorkspaceTab.body,
					formData: defaultWorkspaceTab.formData,
					auth: { ...defaultWorkspaceTab.auth },
					response: defaultWorkspaceTab.response,
					isFetching: defaultWorkspaceTab.isFetching,
				},
			];
			return {
				...state,
				workspaceTabs: newWorkspaceTabs,
				activeWorkspaceTabId: crypto.randomUUID(),
			};
		}
		case "ADD_WORKSPACE_TAB_FROM_DB": {
			const { id, data } = action.payload;
			let restoredHeaders = defaultWorkspaceTab.headers.map((h) => ({
				...h,
				id: crypto.randomUUID(),
			}));
			if (data.headers && Array.isArray(data.headers)) {
				restoredHeaders = data.headers.map((h) => ({
					...h,
					id: crypto.randomUUID(),
				}));
			}

			const newTab = {
				...defaultWorkspaceTab,
				id: id,
				name: data.name || data.url,
				savedRequestId: data.collection_id ? data.id : null,
				activeSubTab: "response",
				method: data.method,
				url: data.url,
				queries:
					data.queries && data.queries.length > 0
						? data.queries.map((q) => ({ ...q }))
						: parseUrlInput(data.url).newQueries,
				headers: restoredHeaders,
				bodyType: data?.bodyType || "raw",
				body: data.body || "",
				formData: data?.formData ? data.formData.map((f) => ({ ...f })) : [],
				auth:
					data.auth && typeof data.auth === "object"
						? { ...data.auth }
						: data.auth && typeof data.auth === "string"
							? JSON.parse(data.auth)
							: { type: "none", token: "", username: "", password: "" },
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
			if (import.meta.env.DEV) console.log(newWorkspaceTabs);
			let newActiveTabId = null;
			if (state.activeWorkspaceTabId === action.payload) {
				if (newWorkspaceTabs.length > 0) {
					newActiveTabId = newWorkspaceTabs[newWorkspaceTabs.length - 1].id;
				}
			} else {
				newActiveTabId = state.activeWorkspaceTabId;
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
			return updateActiveTab(state, { activeSubTab: action.payload });
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

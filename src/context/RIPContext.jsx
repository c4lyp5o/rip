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
import { addToHistory } from "../utils/historyDb";

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
	body: "",
	auth: { type: "none", token: "", username: "", password: "" },
	response: null,
};

const ripReducerInitialState = {
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
	isFetching: false,
	workspaceTabs: [defaultWorkspaceTab],
	activeWorkspaceTabId: defaultWorkspaceTab.id,
	history: [],
	collections: [],
};

const getActiveTab = (state) =>
	state.workspaceTabs.find((tab) => tab.id === state.activeWorkspaceTabId);

const updateActiveTab = (state, updates) => ({
	...state,
	workspaceTabs: state.workspaceTabs.map((tab) =>
		tab.id === state.activeWorkspaceTabId ? { ...tab, ...updates } : tab,
	),
});

const ripReducer = (state, action) => {
	switch (action.type) {
		case "SET_SAVED_REQUEST_ID": {
			return updateActiveTab(state, { savedRequestId: action.payload });
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
			return updateActiveTab(state, { url: action.payload });
		}
		case "SET_HEADERS": {
			return updateActiveTab(state, { headers: action.payload });
		}
		case "SET_QUERIES": {
			return updateActiveTab(state, { queries: action.payload });
		}
		case "ADD_QUERIES": {
			const currentTab = state.workspaceTabs.find(
				(t) => t.id === state.activeWorkspaceTabId,
			);
			return updateActiveTab(state, {
				queries: [...(currentTab.queries || []), ...action.payload],
			});
		}
		case "ADD_QUERY": {
			const newQuery = {
				id: crypto.randomUUID(),
				key: "",
				value: "",
				active: true,
			};

			return updateActiveTab(state, {
				queries: [...(getActiveTab(state).queries || []), newQuery],
			});
		}
		case "DELETE_QUERY": {
			const currentQueries = getActiveTab(state).queries || [];
			return updateActiveTab(state, {
				queries: currentQueries.filter((q) => q.id !== action.payload),
			});
		}
		case "UPDATE_QUERY": {
			const { id, field, value } = action.payload;
			const currentQueries = getActiveTab(state).queries || [];

			const updatedQueries = currentQueries.map((q) =>
				q.id === id ? { ...q, [field]: value } : q,
			);

			return updateActiveTab(state, { queries: updatedQueries });
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
		case "UPDATE_AUTH": {
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
			return {
				...state,
				isFetching: false,
				workspaceTabs: state.workspaceTabs.map((tab) =>
					tab.id === state.activeWorkspaceTabId
						? {
								...tab,
								name:
									tab.name === "New Request" && tab.url ? tab.url : tab.name,
								response: action.payload,
							}
						: tab,
				),
			};
		}
		case "SET_FETCHING": {
			return { ...state, isFetching: action.payload };
		}
		case "ADD_WORKSPACE_TAB": {
			const uuid = crypto.randomUUID();
			const newWorkspaceTabs = [
				...state.workspaceTabs,
				{
					id: uuid,
					name: defaultWorkspaceTab.name,
					savedRequestId: null,
					activeSubTab: defaultWorkspaceTab.activeSubTab,
					method: defaultWorkspaceTab.method,
					url: defaultWorkspaceTab.url,
					queries: [...defaultWorkspaceTab.queries],
					headers: [...defaultWorkspaceTab.headers].map((h) => ({ ...h })),
					body: defaultWorkspaceTab.body,
					auth: defaultWorkspaceTab.auth
						? typeof defaultWorkspaceTab.auth === "string"
							? JSON.parse(defaultWorkspaceTab.auth)
							: defaultWorkspaceTab.auth
						: { type: "none", token: "", username: "", password: "" },
					response: defaultWorkspaceTab.response,
				},
			];
			return {
				...state,
				workspaceTabs: newWorkspaceTabs,
				activeWorkspaceTabId: uuid,
			};
		}
		case "ADD_WORKSPACE_TAB_FROM_HISTORY": {
			const { id, data } = action.payload;
			const { newQueries } = parseUrlInput(data.url);
			let restoredHeaders = defaultWorkspaceTab.headers;
			if (Array.isArray(data.headers)) {
				restoredHeaders = data.headers;
			} else if (data.headers && typeof data.headers === "object") {
				restoredHeaders = Object.entries(data.headers).map(([key, value]) => ({
					id: crypto.randomUUID(),
					key,
					value,
					active: true,
				}));
			}

			const newTab = {
				...defaultWorkspaceTab,
				id: id,
				savedRequestId: data.collection_id ? data.id : null,
				method: data.method,
				url: data.url.split("?")[0],
				queries: newQueries,
				headers: restoredHeaders,
				body: data.body || "",
				name: data.name || data.url,
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
		case "SET_COLLECTIONS": {
			return { ...state, collections: action.payload };
		}
		default:
			return state;
	}
};

const RipContext = createContext();

export const RipProvider = ({ children }) => {
	const [state, dispatch] = useReducer(ripReducer, ripReducerInitialState);

	const fetcherRef = useRef();

	const handleRequest = useCallback(async (currentTab) => {
		if (!currentTab) return;

		dispatch({ type: "SET_FETCHING", payload: true });

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
			}
		} catch (error) {
			if (import.meta.env.DEV) console.error("Request failed:", error);
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			response = { type: "error", content: errorMessage };
			console.log(response);
		} finally {
			dispatch({ type: "SET_RESPONSE", payload: response });
		}
	}, []);

	useEffect(() => {
		fetcherRef.current = handleRequest;
	}, [handleRequest]);

	return (
		<RipContext.Provider value={{ state, dispatch, fetcherRef }}>
			{children}
		</RipContext.Provider>
	);
};

export const useRip = () => {
	return useContext(RipContext);
};

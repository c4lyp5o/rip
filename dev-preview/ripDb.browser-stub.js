/**
 * Browser preview stub for the Tauri SQLite layer.
 *
 * ONLY used by `vite.preview.config.js` (npm run preview:web) so the UI can
 * be inspected in a normal browser, where the Tauri SQL plugin is absent.
 * The real app always uses src/utils/ripDb.js.
 */

const store = {
	history: [
		{
			id: "h1",
			method: "GET",
			url: "https://api.stripe.com/v1/charges",
			status: 200,
			time: 124,
			timestamp: Date.now() - 1000 * 60 * 4,
		},
		{
			id: "h2",
			method: "POST",
			url: "https://api.github.com/user/repos",
			status: 201,
			time: 842,
			timestamp: Date.now() - 1000 * 60 * 22,
		},
		{
			id: "h3",
			method: "DELETE",
			url: "https://internal.acme.dev/v2/sessions/8821",
			status: 204,
			time: 61,
			timestamp: Date.now() - 1000 * 60 * 60 * 3,
		},
		{
			id: "h4",
			method: "GET",
			url: "https://api.stripe.com/v1/customers?limit=3",
			status: 429,
			time: 3100,
			timestamp: Date.now() - 1000 * 60 * 60 * 9,
		},
	],
	collections: [
		{
			id: "c1",
			name: "Payments API",
			type: "collection",
			items: [
				{
					id: "r1",
					name: "List charges",
					method: "GET",
					url: "https://api.stripe.com/v1/charges",
					headers: [{ id: "h1", key: "Authorization", value: "Bearer sk_test_x", active: true }],
					queries: [],
					body: "",
					auth: { type: "none" },
					type: "request",
				},
				{
					id: "r2",
					name: "Create customer",
					method: "POST",
					url: "https://api.stripe.com/v1/customers",
					headers: [],
					queries: [],
					body: '{\n  "email": "ada@example.com"\n}',
					auth: { type: "bearer", token: "sk_test_x" },
					type: "request",
				},
			],
		},
		{
			id: "c2",
			name: "Internal tools",
			type: "collection",
			items: [],
		},
	],
	settings: {
		theme: "studio",
		networkDelay: 0,
	},
};

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export const initDb = async () => {};

export const addToHistory = async (item) => {
	store.history.unshift({ id: `h${Date.now()}`, ...item });
};

export const getHistoryItems = async () => {
	await delay();
	return store.history;
};

export const deleteHistoryItem = async (id) => {
	store.history = store.history.filter((h) => h.id !== id);
};

export const clearHistory = async () => {
	store.history = [];
};

export const getSetting = async (key) => store.settings[key] ?? null;

export const setSetting = async (key, value) => {
	store.settings[key] = value;
};

export const getCollectionsTree = async () => {
	await delay();
	return store.collections;
};

export const createCollection = async (name) => {
	store.collections.push({ id: `c${Date.now()}`, name, type: "collection", items: [] });
};

export const deleteCollection = async (id) => {
	store.collections = store.collections.filter((c) => c.id !== id);
};

export const renameCollection = async (id, name) => {
	const c = store.collections.find((x) => x.id === id);
	if (c) c.name = name;
};

export const createFolder = async () => {};
export const deleteFolder = async () => {};
export const renameFolder = async () => {};

export const saveRequest = async (collectionId, folderId, data) => {
	const id = `r${Date.now()}`;
	const col = store.collections.find((c) => c.id === collectionId);
	if (col) {
		col.items.push({ id, collection_id: collectionId, ...data, type: "request" });
	}
	return id;
};

export const deleteRequest = async (id) => {
	for (const col of store.collections) {
		col.items = col.items.filter((r) => r.id !== id);
	}
};

export const updateRequest = async (id, data) => {
	for (const col of store.collections) {
		const r = col.items.find((x) => x.id === id);
		if (r) Object.assign(r, data);
	}
};

export const exportData = async () => ({
	history: store.history,
	collections: store.collections,
});

export const importData = async () => {};

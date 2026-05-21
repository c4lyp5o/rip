import Database from "@tauri-apps/plugin-sql";

let db = null;

export const initDb = async () => {
	if (db) return db;

	db = await Database.load("sqlite:history5.db");

	await db.execute("PRAGMA foreign_keys = ON");

	await db.execute(`
    CREATE TABLE IF NOT EXISTS history (
      date TEXT,
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      method TEXT,
      url TEXT,
      status INTEGER,
      duration INTEGER,
      size TEXT,
      headers TEXT,
      queries TEXT,
      body TEXT,
      auth TEXT
    )
  `);

	await db.execute(`
    -- 1. Top Level Collections
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT
    );

    -- 2. Folders (Optional, linked to a collection)
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL,
      name TEXT NOT NULL,
      parent_id TEXT,
      FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE
    );

    -- 3. Saved Requests (Linked to either a Collection OR a Folder)
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL,
      folder_id TEXT, -- Can be NULL if request is at the root of the collection
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT,
      queries TEXT,
      body TEXT,
      auth TEXT,
      FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );
`);

	return db;
};

export const addToHistory = async (entry) => {
	const database = await initDb();

	const existingEntry = await database.select(
		"SELECT id, name, headers, queries, body, auth FROM history WHERE url = $1 AND method = $2 ORDER BY date DESC LIMIT 1",
		[entry.url, entry.method],
	);

	const newHeaders = JSON.stringify(entry.headers);
	const newQueries = JSON.stringify(entry.queries);
	const newBody = JSON.stringify(entry.body);
	const newAuth = JSON.stringify(entry.auth || { type: "none" });

	if (existingEntry.length > 0) {
		const existing = existingEntry[0];
		if (
			existing.headers === newHeaders &&
			existing.queries === newQueries &&
			existing.body === newBody
		) {
			return;
		} else {
			await database.execute(
				`UPDATE history SET date = $1, name = $2, status = $3, duration = $4, size = $5, headers = $6, queries = $7, body = $8, auth = $9 WHERE id = $10`,
				[
					new Date().toISOString(),
					entry.name,
					entry.status,
					entry.time,
					entry.size,
					newHeaders,
					newQueries,
					newBody,
					newAuth,
					existing.id,
				],
			);
		}
	} else {
		await database.execute(
			`INSERT INTO history (date, name, method, url, status, duration, size, headers, queries, body, auth)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			[
				new Date().toISOString(),
				entry.name,
				entry.method,
				entry.url,
				entry.status,
				entry.time,
				entry.size,
				newHeaders,
				newQueries,
				newBody,
				newAuth,
			],
		);
	}

	await database.execute(
		"DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY date DESC LIMIT 100)",
	);
};

export const getHistoryItems = async () => {
	const database = await initDb();
	const result = await database.select(
		"SELECT * FROM history ORDER BY date DESC LIMIT 50",
	);

	return result.map((row) => ({
		...row,
		headers: row.headers ? JSON.parse(row.headers) : {},
		queries: row.queries ? JSON.parse(row.queries) : [],
		body: row.body ? JSON.parse(row.body) : "",
		auth: row.auth ? JSON.parse(row.auth) : { type: "none" },
	}));
};

export const deleteHistoryItem = async (id) => {
	const database = await initDb();
	await database.execute("DELETE FROM history WHERE id = $1", [id]);
};

export const clearHistory = async () => {
	const database = await initDb();
	await database.execute("DELETE FROM history");
};

export const getCollectionsTree = async () => {
	const db = await initDb();

	const collections = await db.select("SELECT * FROM collections");
	const folders = await db.select("SELECT * FROM folders");
	const requests = await db.select("SELECT * FROM requests");

	return collections.map((col) => {
		const colFolders = folders
			.filter((f) => f.collection_id === col.id)
			.map((folder) => ({
				...folder,
				type: "folder",
				items: requests
					.filter((r) => r.folder_id === folder.id)
					.map((r) => ({ ...r, type: "request" })),
			}));

		const rootRequests = requests
			.filter((r) => r.collection_id === col.id && !r.folder_id)
			.map((r) => ({ ...r, type: "request" }));

		return {
			...col,
			type: "collection",
			items: [...colFolders, ...rootRequests],
		};
	});
};

export const createCollection = async (name) => {
	const database = await initDb();
	const id = crypto.randomUUID();
	await database.execute(
		"INSERT INTO collections (id, name, created_at) VALUES ($1, $2, $3)",
		[id, name, new Date().toISOString()],
	);
	return id;
};

export const deleteCollection = async (id) => {
	const database = await initDb();
	await database.execute("DELETE FROM collections WHERE id = $1", [id]);
};

export const renameCollection = async (id, name) => {
	const database = await initDb();
	await database.execute("UPDATE collections SET name = $1 WHERE id = $2", [
		name,
		id,
	]);
};

export const createFolder = async (collectionId, name, parentId = null) => {
	const database = await initDb();
	const id = crypto.randomUUID();
	await database.execute(
		"INSERT INTO folders (id, collection_id, name, parent_id) VALUES ($1, $2, $3, $4)",
		[id, collectionId, name, parentId],
	);
	return id;
};

export const deleteFolder = async (id) => {
	const database = await initDb();
	await database.execute("DELETE FROM folders WHERE id = $1", [id]);
};

export const renameFolder = async (id, name) => {
	const database = await initDb();
	await database.execute("UPDATE folders SET name = $1 WHERE id = $2", [
		name,
		id,
	]);
};

export const saveRequest = async (collectionId, folderId, request) => {
	const database = await initDb();
	const requestName = request.name || request.url;

	const query = folderId
		? "SELECT id FROM requests WHERE collection_id = $1 AND folder_id = $2 AND name = $3 LIMIT 1"
		: "SELECT id FROM requests WHERE collection_id = $1 AND folder_id IS NULL AND name = $2 LIMIT 1";

	const params = folderId
		? [collectionId, folderId, requestName]
		: [collectionId, requestName];

	const existing = await database.select(query, params);

	if (existing.length > 0) {
		const existingId = existing[0].id;
		await database.execute(
			`UPDATE requests SET method = $1, url = $2, headers = $3, queries = $4, body = $5, auth = $6 WHERE id = $7`,
			[
				request.method,
				request.url,
				JSON.stringify(request.headers),
				JSON.stringify(request.queries),
				JSON.stringify(request.body),
				JSON.stringify(request.auth || { type: "none" }),
				existingId,
			],
		);
		return existingId;
	}

	// 3. Insert new request if no name match was found
	const id = crypto.randomUUID();
	await database.execute(
		`INSERT INTO requests (id, collection_id, folder_id, name, method, url, headers, queries, body, auth)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		[
			id,
			collectionId,
			folderId,
			requestName,
			request.method,
			request.url,
			JSON.stringify(request.headers),
			JSON.stringify(request.queries),
			JSON.stringify(request.body),
			JSON.stringify(request.auth || { type: "none" }),
		],
	);
	return id;
};

export const deleteRequest = async (id) => {
	const database = await initDb();
	await database.execute("DELETE FROM requests WHERE id = $1", [id]);
};

export const updateRequest = async (id, request) => {
	const database = await initDb();
	await database.execute(
		`UPDATE requests SET name = $1, method = $2, url = $3, headers = $4, queries = $5, body = $6, auth = $7
    WHERE id = $8`,
		[
			request.name || request.url || "Untitled",
			request.method,
			request.url,
			JSON.stringify(request.headers),
			JSON.stringify(request.queries),
			JSON.stringify(request.body),
			JSON.stringify(request.auth || { type: "none" }),
			id,
		],
	);
};

export const exportData = async () => {
	const db = await initDb();
	const history = await db.select("SELECT * FROM history");
	const collections = await db.select("SELECT * FROM collections");
	const folders = await db.select("SELECT * FROM folders");
	const requests = await db.select("SELECT * FROM requests");
	return { history, collections, folders, requests };
};

export const importData = async (data) => {
	const db = await initDb();

	if (!data || typeof data !== "object") {
		throw new Error("Invalid import data");
	}

	const history = Array.isArray(data.history) ? data.history : [];
	const collections = Array.isArray(data.collections) ? data.collections : [];
	const folders = Array.isArray(data.folders) ? data.folders : [];
	const requests = Array.isArray(data.requests) ? data.requests : [];

	const isObject = (value) => value && typeof value === "object";

	for (const h of history) {
		if (
			!isObject(h) ||
			typeof h.id !== "number" ||
			typeof h.method !== "string" ||
			typeof h.url !== "string"
		) {
			throw new Error("Invalid history entry in import file");
		}
	}

	for (const c of collections) {
		if (
			!isObject(c) ||
			typeof c.id !== "string" ||
			typeof c.name !== "string"
		) {
			throw new Error("Invalid collection entry in import file");
		}
	}

	for (const f of folders) {
		if (
			!isObject(f) ||
			typeof f.id !== "string" ||
			typeof f.collection_id !== "string" ||
			typeof f.name !== "string"
		) {
			throw new Error("Invalid folder entry in import file");
		}
	}

	for (const r of requests) {
		if (
			!isObject(r) ||
			typeof r.id !== "string" ||
			typeof r.collection_id !== "string" ||
			typeof r.name !== "string" ||
			typeof r.method !== "string" ||
			typeof r.url !== "string"
		) {
			throw new Error("Invalid request entry in import file");
		}
	}

	try {
		await db.execute("BEGIN");

		for (const h of history) {
			await db.execute(
				`INSERT OR REPLACE INTO history (id, date, name, method, url, status, duration, size, headers, queries, body, auth) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
				[
					h.id,
					h.date ?? new Date().toISOString(),
					h.name ?? null,
					h.method,
					h.url,
					h.status ?? null,
					h.duration ?? null,
					h.size ?? null,
					h.headers ?? null,
					h.queries ?? null,
					h.body ?? null,
					h.auth ?? null,
				],
			);
		}

		for (const c of collections) {
			await db.execute(
				`INSERT OR REPLACE INTO collections (id, name, created_at) VALUES ($1, $2, $3)`,
				[c.id, c.name, c.created_at ?? new Date().toISOString()],
			);
		}

		for (const f of folders) {
			await db.execute(
				`INSERT OR REPLACE INTO folders (id, collection_id, name, parent_id) VALUES ($1, $2, $3, $4)`,
				[f.id, f.collection_id, f.name, f.parent_id ?? null],
			);
		}

		for (const r of requests) {
			await db.execute(
				`INSERT OR REPLACE INTO requests (id, collection_id, folder_id, name, method, url, headers, queries, body, auth) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
				[
					r.id,
					r.collection_id,
					r.folder_id ?? null,
					r.name,
					r.method,
					r.url,
					r.headers ?? null,
					r.queries ?? null,
					r.body ?? null,
					r.auth ?? null,
				],
			);
		}

		await db.execute("COMMIT");
	} catch (error) {
		try {
			await db.execute("ROLLBACK");
		} catch {
			// ignore rollback failure
		}
		throw error;
	}
};

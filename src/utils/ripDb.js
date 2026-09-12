import Database from "@tauri-apps/plugin-sql";
import { safeParseJson } from "./parser";
import { normalizeHeaders, normalizeQueries } from "./requestNormalization";

let db = null;

const migrateLegacyHeaderQueryFormats = async (database) => {
	try {
		// history table
		const historyRows = await database.select(
			"SELECT id, headers, queries FROM history",
		);
		for (const row of historyRows) {
			const normalizedHeaders = normalizeHeaders(row.headers);
			const normalizedQueries = normalizeQueries(row.queries);

			const originalHeaders = safeParseJson(row.headers, null);
			const originalQueries = safeParseJson(row.queries, null);

			const needsHeaderUpdate = !Array.isArray(originalHeaders);
			const needsQueryUpdate = !Array.isArray(originalQueries);

			if (needsHeaderUpdate || needsQueryUpdate) {
				await database.execute(
					`UPDATE history SET headers = $1, queries = $2 WHERE id = $3`,
					[
						JSON.stringify(normalizedHeaders),
						JSON.stringify(normalizedQueries),
						row.id,
					],
				);
			}
		}

		// requests table
		const requestRows = await database.select(
			"SELECT id, headers, queries FROM requests",
		);
		for (const row of requestRows) {
			const normalizedHeaders = normalizeHeaders(row.headers);
			const normalizedQueries = normalizeQueries(row.queries);

			const originalHeaders = safeParseJson(row.headers, null);
			const originalQueries = safeParseJson(row.queries, null);

			const needsHeaderUpdate = !Array.isArray(originalHeaders);
			const needsQueryUpdate = !Array.isArray(originalQueries);

			if (needsHeaderUpdate || needsQueryUpdate) {
				await database.execute(
					`UPDATE requests SET headers = $1, queries = $2 WHERE id = $3`,
					[
						JSON.stringify(normalizedHeaders),
						JSON.stringify(normalizedQueries),
						row.id,
					],
				);
			}
		}
	} catch (err) {
		if (import.meta.env.DEV) console.error("Migration failed:", err);
	}
};

export const initDb = async () => {
	if (db) return db;

	db = await Database.load("sqlite:history6.db");

	await db.execute("PRAGMA foreign_keys = ON;");
	await db.execute("PRAGMA journal_mode = WAL;");

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
    );
  `);

	await db.execute(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT
    );
  `);

	await db.execute(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL,
      name TEXT NOT NULL,
      parent_id TEXT,
      FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE
    );
  `);

	await db.execute(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL,
      folder_id TEXT,
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

	await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

	// indexes
	await db.execute(
		`CREATE INDEX IF NOT EXISTS idx_history_date ON history(date);`,
	);
	await db.execute(
		`CREATE INDEX IF NOT EXISTS idx_history_url_method ON history(url, method);`,
	);

	await migrateLegacyHeaderQueryFormats(db);

	return db;
};

export const addToHistory = async (entry) => {
	const database = await initDb();

	const existingEntry = await database.select(
		"SELECT id, name, headers, queries, body, auth FROM history WHERE url = $1 AND method = $2 ORDER BY date DESC LIMIT 1",
		[entry.url, entry.method],
	);

	// normalize to arrays
	const newHeaders = JSON.stringify(normalizeHeaders(entry.headers));
	const newQueries = JSON.stringify(normalizeQueries(entry.queries));
	const newBody = JSON.stringify(entry.body ?? "");
	const newAuth = JSON.stringify(entry.auth ?? { type: "none" });

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

	// keep only last 100 rows
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
		headers: normalizeHeaders(row.headers),
		queries: normalizeQueries(row.queries),
		body: safeParseJson(row.body, ""),
		auth: safeParseJson(row.auth, { type: "none" }),
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

export const getSetting = async (key) => {
	const database = await initDb();
	const rows = await database.select(
		"SELECT value FROM settings WHERE key = $1",
		[key],
	);
	return rows.length > 0 ? rows[0].value : null;
};

export const setSetting = async (key, value) => {
	const database = await initDb();
	await database.execute(
		"INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)",
		[key, String(value)],
	);
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
					.map((r) => ({
						...r,
						type: "request",
						headers: normalizeHeaders(r.headers),
						queries: normalizeQueries(r.queries),
						body: safeParseJson(r.body, ""),
						auth: safeParseJson(r.auth, { type: "none" }),
					})),
			}));

		const rootRequests = requests
			.filter((r) => r.collection_id === col.id && !r.folder_id)
			.map((r) => ({
				...r,
				type: "request",
				headers: normalizeHeaders(r.headers),
				queries: normalizeQueries(r.queries),
				body: safeParseJson(r.body, ""),
				auth: safeParseJson(r.auth, { type: "none" }),
			}));

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

	const headersJson = JSON.stringify(normalizeHeaders(request.headers));
	const queriesJson = JSON.stringify(normalizeQueries(request.queries));
	const bodyJson = JSON.stringify(request.body ?? "");
	const authJson = JSON.stringify(request.auth ?? { type: "none" });

	if (existing.length > 0) {
		const existingId = existing[0].id;
		await database.execute(
			`UPDATE requests SET method = $1, url = $2, headers = $3, queries = $4, body = $5, auth = $6 WHERE id = $7`,
			[
				request.method,
				request.url,
				headersJson,
				queriesJson,
				bodyJson,
				authJson,
				existingId,
			],
		);
		return existingId;
	}

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
			headersJson,
			queriesJson,
			bodyJson,
			authJson,
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
			JSON.stringify(normalizeHeaders(request.headers)),
			JSON.stringify(normalizeQueries(request.queries)),
			JSON.stringify(request.body ?? ""),
			JSON.stringify(request.auth ?? { type: "none" }),
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

	const bulkInsert = async (tableName, columns, items) => {
		if (!items || items.length === 0) return;

		const chunkSize = 50;

		for (let i = 0; i < items.length; i += chunkSize) {
			const chunk = items.slice(i, i + chunkSize);
			const values = [];

			const placeholders = chunk.map((_, rowIndex) => {
				const rowParams = columns.map((_, colIndex) => {
					return `$${rowIndex * columns.length + colIndex + 1}`;
				});
				return `(${rowParams.join(", ")})`;
			});

			chunk.forEach((item) => {
				columns.forEach((col) => {
					values.push(item[col] ?? null);
				});
			});

			const query = `INSERT OR REPLACE INTO ${tableName} (${columns.join(", ")}) VALUES ${placeholders.join(", ")}`;
			await db.execute(query, values);
		}
	};

	try {
		if (data.history) {
			await bulkInsert(
				"history",
				[
					"id",
					"date",
					"name",
					"method",
					"url",
					"status",
					"duration",
					"size",
					"headers",
					"queries",
					"body",
					"auth",
				],
				data.history,
			);
		}

		if (data.collections) {
			await bulkInsert(
				"collections",
				["id", "name", "created_at"],
				data.collections,
			);
		}

		if (data.folders) {
			await bulkInsert(
				"folders",
				["id", "collection_id", "name", "parent_id"],
				data.folders,
			);
		}

		if (data.requests) {
			await bulkInsert(
				"requests",
				[
					"id",
					"collection_id",
					"folder_id",
					"name",
					"method",
					"url",
					"headers",
					"queries",
					"body",
					"auth",
				],
				data.requests,
			);
		}
	} catch (error) {
		if (import.meta.env.DEV) console.error("Import failed:", error);
		throw error;
	}
};

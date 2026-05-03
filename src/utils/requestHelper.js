import { fetch } from "@tauri-apps/plugin-http";

const formatSize = (bytes) => {
	if (!bytes) return "Unknown";
	const sizeNum = Number(bytes);
	return sizeNum > 1000
		? `${(sizeNum / 1000).toPrecision(3)} KB`
		: `${sizeNum} B`;
};

export const executeRequest = async ({
	method,
	url,
	queries,
	headers,
	body,
	auth,
}) => {
	if (!url) throw new Error("URL is required to make a request.");
	if (import.meta.env.DEV) console.log("URL:", url);
	const urlObj = new URL(url);
	if (import.meta.env.DEV) console.log("Constructed URL:", urlObj.toString());

	if (queries && Array.isArray(queries)) {
		queries.forEach((q) => {
			if (q.key && q.active) urlObj.searchParams.append(q.key, q.value);
		});
	}

	const requestHeaders = new Headers();

	if (auth?.type === "bearer" && auth.token) {
		requestHeaders.append("Authorization", `Bearer ${auth.token}`);
	} else if (auth?.type === "basic" && (auth.username || auth.password)) {
		const encoded = btoa(`${auth.username}:${auth.password}`);
		requestHeaders.append("Authorization", `Basic ${encoded}`);
	}

	headers.forEach((h) => {
		if (h.active && h.key) {
			requestHeaders.append(h.key, h.value);
		}
	});

	const options = {
		method,
		headers: requestHeaders,
	};

	if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && body) {
		options.body = typeof body === "object" ? JSON.stringify(body) : body;
	}

	const timeStart = performance.now();
	// --- FETCH REQUEST ---
	const response = await fetch(urlObj.toString(), options);
	// --- END FETCH REQUEST ---
	const timeEnd = performance.now();
	const timeRaw = timeEnd - timeStart;

	const responseHeaders = [];
	for (const [key, value] of response.headers.entries()) {
		if (import.meta.env.DEV) console.log(`${key}: ${value}`);
		responseHeaders.push({ key, value });
	}

	const contentType = response.headers.get("content-type") || "";
	if (import.meta.env.DEV) console.log("Response Content-Type:", contentType);
	let content;
	let type = "text";

	const contentDisposition = response.headers.get("content-disposition");
	let filename = null;
	if (contentDisposition) {
		const filenameMatch = contentDisposition.match(
			/filename\*?=['"]?(?:UTF-8''|)([^"';\n]+)['"]?/i,
		);
		if (filenameMatch?.[1]) filename = decodeURIComponent(filenameMatch[1]);
	}
	if (import.meta.env.DEV)
		console.log("Content-Disposition filename:", filename);
	if (contentType.includes("application/json")) {
		content = await response.json();
		type = "json";
	} else if (
		contentType.includes("image") ||
		contentType.includes("audio") ||
		contentType.includes("video") ||
		contentType.includes("application/pdf") ||
		contentType.includes("application/zip") ||
		contentType.includes("application/octet-stream") ||
		contentType.includes("application/x-")
	) {
		content = await response.blob();
		type = "blob";
	} else {
		const text = await response.text();
		try {
			content = JSON.parse(text);
			type = "json";
		} catch {
			content = text;
			type = "html";
		}
	}

	return {
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders,
		size: formatSize(response.headers.get("content-length")),
		time: `${timeRaw.toFixed(2)}ms`,
		timeRaw,
		type,
		contentType,
		content,
		filename,
	};
};

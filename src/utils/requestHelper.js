import { fetch } from "@tauri-apps/plugin-http";
import { normalizeUrlInput } from "./normalizeUrl";

const formatSize = (bytes) => {
	if (!bytes) return "Unknown";
	const sizeNum = Number(bytes);
	return sizeNum > 1000
		? `${(sizeNum / 1000).toPrecision(3)} KB`
		: `${sizeNum} B`;
};

export const executeRequest = async (tab, signal) => {
	const {
		method,
		url,
		headers,
		bodyType,
		body,
		formData,
		auth,
	} = tab;
	if (!url) throw new Error("URL is required to make a request.");

	const normalizedUrl = normalizeUrlInput(url);

	let urlObj;
	try {
		urlObj = new URL(normalizedUrl);
	} catch {
		throw new Error("Invalid URL. Please enter a valid URL or hostname.");
	}

	if (import.meta.env.DEV) console.log("URL:", url);

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
		signal,
	};

	if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && body) {
		if (bodyType === "form-data" && formData?.length > 0) {
			const fd = new FormData();
			let hasData = false;

			formData.forEach((item) => {
				if (item.active && item.key) {
					if (item.type === "file" && item.file) {
						fd.append(item.key, item.file);
					} else {
						fd.append(item.key, item.value || "");
					}
					hasData = true;
				}
			});

			if (hasData) {
				options.body = fd;
				options.headers.delete("Content-Type");
			}
		} else {
			options.body = typeof body === "object" ? JSON.stringify(body) : body;
		}
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

	const contentType = (
		response.headers.get("content-type") || ""
	).toLowerCase();
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

	const isJsonType =
		contentType.includes("application/json") || contentType.includes("+json");

	const isHtmlType = contentType.includes("text/html");

	const isTextLikeType =
		contentType.startsWith("text/") ||
		contentType.includes("application/xml") ||
		contentType.includes("text/xml") ||
		contentType.includes("+xml") ||
		contentType.includes("application/javascript") ||
		contentType.includes("text/javascript") ||
		contentType.includes("application/x-www-form-urlencoded") ||
		contentType.includes("application/csv") ||
		contentType.includes("text/csv") ||
		contentType.includes("image/svg+xml");

	const isBinaryType =
		contentType.includes("image/") ||
		contentType.includes("audio/") ||
		contentType.includes("video/") ||
		contentType.includes("application/pdf") ||
		contentType.includes("application/zip") ||
		contentType.includes("application/octet-stream") ||
		contentType.includes("application/x-");

	if (isJsonType) {
		content = await response.json();
		type = "json";
	} else if (isHtmlType) {
		content = await response.text();
		type = "html";
	} else if (isBinaryType) {
		content = await response.blob();
		type = "blob";
	} else {
		const text = await response.text();

		if (isTextLikeType) {
			content = text;
			type = "text";
		} else {
			try {
				content = JSON.parse(text);
				type = "json";
			} catch {
				content = text;
				type = "text";
			}
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

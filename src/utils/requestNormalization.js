import { safeParseJson } from "./parser";

const normalizeHeadersFromObject = (raw) =>
	Object.keys(raw).map((key) => ({
		id: crypto.randomUUID(),
		key,
		value: String(raw[key]),
		active: true,
	}));

export const normalizeHeaders = (raw) => {
	const parsed = safeParseJson(raw, null);
	if (Array.isArray(parsed)) {
		return parsed
			.map((h) => {
				if (h && typeof h === "object") {
					return {
						id: h?.id ?? crypto.randomUUID(),
						key: String(h?.key ?? h?.name ?? ""),
						value: String(h?.value ?? ""),
						active: h?.active === undefined ? true : Boolean(h.active),
					};
				}
				return null;
			})
			.filter(Boolean);
	}

	if (parsed && typeof parsed === "object") {
		return normalizeHeadersFromObject(parsed);
	}

	if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		return normalizeHeadersFromObject(raw);
	}

	return [
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
	];
};

export const normalizeQueries = (raw) => {
	const parsed = safeParseJson(raw, null);
	if (Array.isArray(parsed)) {
		return parsed.map((q) => ({
			id: q?.id ?? crypto.randomUUID(),
			key: String(q?.key ?? ""),
			value: String(q?.value ?? ""),
			active: q?.active === undefined ? true : Boolean(q.active),
		}));
	}

	if (parsed && typeof parsed === "object") {
		return Object.keys(parsed).map((key) => ({
			id: crypto.randomUUID(),
			key,
			value: String(parsed[key]),
			active: true,
		}));
	}

	return [];
};

export const normalizeAuth = (raw) => {
	const parsed = safeParseJson(raw, null);
	if (parsed && typeof parsed === "object") {
		return {
			type: String(parsed.type ?? "none"),
			token: String(parsed.token ?? ""),
			username: String(parsed.username ?? ""),
			password: String(parsed.password ?? ""),
		};
	}
	return { type: "none", token: "", username: "", password: "" };
};

const normalizeRequestForFingerprint = (request) => ({
	method: String(request.method ?? "GET"),
	url: String(request.url ?? ""),
	headers: normalizeHeaders(request.headers).map((h) => ({
		key: h.key,
		value: h.value,
		active: h.active,
	})),
	queries: normalizeQueries(request.queries).map((q) => ({
		key: q.key,
		value: q.value,
		active: q.active,
	})),
	body: request.body ?? "",
	auth: normalizeAuth(request.auth),
});

export const getRequestFingerprint = (request) =>
	JSON.stringify(normalizeRequestForFingerprint(request));

export const isSameRequest = (left, right) =>
	getRequestFingerprint(left) === getRequestFingerprint(right);

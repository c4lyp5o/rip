// Method and status colours carry MEANING, never decoration.
//
//   blue   = GET (read)
//   green  = POST (write) and 2xx
//   amber  = PUT and 3xx (a redirect is a "not there yet")
//   violet = PATCH and auth
//   red    = DELETE and 4xx-5xx (the request failed)
//
// These resolve to CSS variables so every theme in src/themes/themes.js
// recolours them automatically.

export const METHOD_COLOR = {
	GET: "var(--blue)",
	POST: "var(--green)",
	PUT: "var(--amber)",
	PATCH: "var(--violet)",
	DELETE: "var(--red)",
};

export const methodColor = (method) => METHOD_COLOR[method] || "var(--muted)";

export const statusColor = (status) => {
	if (!status) return "var(--muted)";
	if (status >= 200 && status < 300) return "var(--green)";
	if (status >= 300 && status < 400) return "var(--amber)";
	// 4xx and 5xx are both failures, so both read red.
	if (status >= 400) return "var(--red)";
	return "var(--muted)";
};

/** A tinted chip background derived from a semantic colour. */
export const tint = (color) => `color-mix(in srgb, ${color} 14%, transparent)`;

/** A tinted chip border derived from a semantic colour. */
export const tintEdge = (color) => `color-mix(in srgb, ${color} 32%, transparent)`;

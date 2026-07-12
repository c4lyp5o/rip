export const parseUrlInput = (input) => {
	let cleanUrl = input;
	const newQueries = [];

	if (cleanUrl.includes("?")) {
		const splitIndex = cleanUrl.indexOf("?");
		const queryString = cleanUrl.slice(splitIndex + 1);

		cleanUrl = cleanUrl.slice(0, splitIndex);

		const params = new URLSearchParams(queryString);

		params.forEach((value, key) => {
			newQueries.push({
				id: crypto.randomUUID(),
				key,
				value,
				active: true,
			});
		});
	}

	return { cleanUrl, newQueries };
};

export const safeParseJson = (value, fallback = null) => {
	if (value === null || value === undefined) return fallback;
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
};

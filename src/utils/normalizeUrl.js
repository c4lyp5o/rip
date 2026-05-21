export const normalizeUrlInput = (input) => {
	const value = input.trim();

	if (!value) return "";

	if (/^https?:\/\//i.test(value)) {
		return value;
	}

	const isLocalhost =
		/^localhost(?::\d+)?(\/|$)/i.test(value) ||
		/^127\.0\.0\.1(?::\d+)?(\/|$)/.test(value) ||
		/^0\.0\.0\.0(?::\d+)?(\/|$)/.test(value);

	return `${isLocalhost ? "http" : "https"}://${value}`;
};

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

const Boom = () => {
	throw new Error("useTheme must be used within ThemeProvider");
};

describe("ErrorBoundary", () => {
	it("shows the error instead of a blank screen", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		render(
			<ErrorBoundary>
				<Boom />
			</ErrorBoundary>,
		);
		expect(screen.getByText("Something broke on startup")).toBeInTheDocument();
		expect(
			screen.getByText(/useTheme must be used within ThemeProvider/),
		).toBeInTheDocument();
		spy.mockRestore();
	});
});

import React from "react";

/**
 * Root error boundary. React unmounts the whole tree on an uncaught render
 * error, which is why a missing provider (e.g. useTheme outside ThemeProvider)
 * showed up as a silent BLANK WINDOW. This catches it and shows the error
 * instead of an empty screen.
 */
class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { error: null };
	}

	static getDerivedStateFromError(error) {
		return { error };
	}

	componentDidCatch(error, info) {
		console.error("RIP render error:", error, info);
	}

	render() {
		const { error } = this.state;
		if (!error) return this.props.children;

		return (
			<div
				style={{
					height: "100vh",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: "14px",
					background: "var(--bg, #0a0b0d)",
					color: "var(--ink, #f0f2f5)",
					fontFamily: "var(--font-sans, system-ui, sans-serif)",
					padding: "24px",
					textAlign: "center",
				}}
			>
				<div style={{ fontSize: 12.5, letterSpacing: "0.08em", opacity: 0.6 }}>
					RIP — REST In Peace
				</div>
				<div style={{ fontSize: 19, fontWeight: 600 }}>Something broke on startup</div>
				<pre
					style={{
						maxWidth: "min(760px, 90vw)",
						maxHeight: "40vh",
						overflow: "auto",
						padding: "12px 14px",
						border: "1px solid var(--line, #1e2128)",
						borderRadius: 8,
						background: "var(--panel, #131519)",
						color: "var(--red, #ff6f7d)",
						fontFamily: "var(--font-mono, monospace)",
						fontSize: 12,
						textAlign: "left",
						whiteSpace: "pre-wrap",
					}}
				>
					{String(error && (error.stack || error.message || error))}
				</pre>
				<button
					type="button"
					onClick={() => window.location.reload()}
					style={{
						padding: "8px 16px",
						border: "1px solid var(--line, #1e2128)",
						borderRadius: 8,
						background: "var(--panel, #131519)",
						color: "inherit",
						cursor: "pointer",
						fontSize: 13,
					}}
				>
					Reload
				</button>
			</div>
		);
	}
}

export default ErrorBoundary;

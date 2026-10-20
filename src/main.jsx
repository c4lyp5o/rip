import React from "react";
import ReactDOM from "react-dom/client";
import { RipProvider } from "./context/RIPContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";

import App from "./App";

// ThemeProvider MUST wrap the app: App and the theme menu read the theme
// through useTheme(), which throws without a provider. Its absence was the
// cause of the blank-window bug.
ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<ErrorBoundary>
			<RipProvider>
				<ThemeProvider>
					<ToastProvider placement="bottom-right">
						<App />
					</ToastProvider>
				</ThemeProvider>
			</RipProvider>
		</ErrorBoundary>
	</React.StrictMode>,
);

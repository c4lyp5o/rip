import React from "react";
import ReactDOM from "react-dom/client";
import { RipProvider } from "./context/RIPContext";
import { ToastProvider } from "./context/ToastContext";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<RipProvider>
			<ToastProvider placement="bottom-right">
				<App />
			</ToastProvider>
		</RipProvider>
	</React.StrictMode>,
);

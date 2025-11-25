import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handlers to capture runtime errors (will print stack traces to terminal/devtools)
if (typeof window !== "undefined") {
	window.addEventListener("error", (ev) => {
		// Suppress browser extension errors
		const msg = ev.message || '';
		if (
			msg.includes('runtime.lastError') ||
			msg.includes('Receiving end does not exist') ||
			msg.includes('Extension context invalidated')
		) {
			ev.preventDefault();
			return;
		}
		// eslint-disable-next-line no-console
		console.error("Global window error:", ev.error ?? ev.message ?? ev);
	});

	window.addEventListener("unhandledrejection", (ev) => {
		// Suppress Reown AppKit authorization errors during development
		try {
			const reason = ev.reason as any;
			const msg = typeof reason === "string" ? reason : reason?.message ?? String(reason);
			const localOrigin = window.location.origin;
			if (typeof msg === "string" && msg.includes("has not been authorized")) {
				const isLocalHost = !!localOrigin && (
					localOrigin.includes("localhost") ||
					localOrigin.includes("127.0.0.1") ||
					localOrigin.includes(":5051") ||
					localOrigin.includes("192.168.") ||
					localOrigin.includes("10.") ||
					/https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./.test(localOrigin)
				);
				if (isLocalHost) {
					ev.preventDefault();
					console.warn("Reown AppKit authorization error suppressed:", msg);
					return;
				}
			}
		} catch (e) {
			// Continue to log if suppression check fails
		}
		// eslint-disable-next-line no-console
		console.error("Unhandled promise rejection:", ev.reason);
	});
}

createRoot(document.getElementById("root")!).render(<App />);

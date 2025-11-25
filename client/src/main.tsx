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
		// Suppress Reown AppKit authorization errors (authorization for this origin missing).
		// These errors are non-fatal for the app when AppKit isn't configured; we prevent
		// noisy unhandled rejections while warning the operator. If you expect AppKit to
		// be active on this origin, set `window.__REOWN_PROJECT_ID` or deploy with the
		// proper VITE_REOWN_PROJECT_ID so the AppKit project is authorized for your domain.
		try {
			const reason = ev.reason as any;
			const msg = typeof reason === "string" ? reason : reason?.message ?? String(reason);
			if (typeof msg === "string" && msg.includes("has not been authorized")) {
				// prevent the unhandled rejection from surfacing as an error in console
				ev.preventDefault();
				console.warn("Reown AppKit authorization error suppressed for origin:", window.location.origin, " — message:", msg);
				return;
			}
		} catch (e) {
			// Continue to log if suppression check fails
		}
		// eslint-disable-next-line no-console
		console.error("Unhandled promise rejection:", ev.reason);
	});
}

createRoot(document.getElementById("root")!).render(<App />);

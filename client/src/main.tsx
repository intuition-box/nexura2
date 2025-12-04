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

// In development, inject a simple deterministic test wallet so the app can sign challenges
// when running in minimal browsers (or the VS Code Simple Browser) that don't support
// extensions or external wallets. This is only loaded in dev mode.
if (import.meta.env.DEV) {
	// dynamic import so production bundles don't include the dev helper
	import("./dev/injectedWallet").catch((e) => console.warn("Failed to load dev injected wallet:", e));
}

createRoot(document.getElementById("root")!).render(<App />);

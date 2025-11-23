/**
 * Reown AppKit initializer.
 *
 * This file dynamically imports `@reown/appkit` and the Wagmi adapter and
 * initializes a singleton modal instance. If the optional packages are not
 * available, functions gracefully noop.
 */

let _modal: any = undefined;

const DEFAULT_PROJECT_ID = "fb6bea018dee724957900b253ba9683c";

export async function initAppKit(projectId?: string) {
  if (typeof window === "undefined") return null;
  if (_modal !== undefined) return _modal;
  // In production we only initialize AppKit if an explicit project id is provided
  // via runtime injection (window.__REOWN_PROJECT_ID) or via Vite env var
  // `VITE_REOWN_PROJECT_ID`. This prevents unhandled origin-authorization
  // rejections on deployed domains which are not registered in the AppKit
  // project dashboard. If you want AppKit in production, set
  // VITE_REOWN_PROJECT_ID or window.__REOWN_PROJECT_ID to your project id.
  try {
    // Determine whether we're in production and whether a project id is
    // available via runtime, build-time or the local DEFAULT_PROJECT_ID.
    const hasRuntimePid = typeof window !== 'undefined' && !!(window as any).__REOWN_PROJECT_ID;
    const hasBuildPid = (import.meta as any).env && !!(import.meta as any).env.VITE_REOWN_PROJECT_ID;
    const isProd = (import.meta as any).env && !!(import.meta as any).env.PROD;

    // If we're in production and no explicit project id is available from
    // runtime or build, but a DEFAULT_PROJECT_ID is configured, allow that
    // to be used. Previously this code disabled AppKit in prod unconditionally
    // which prevented AppKit modal from loading on deployed sites that rely
    // on the bundled DEFAULT_PROJECT_ID. Use the DEFAULT only when nothing
    // else is provided.
    const effectivePidAvailable = hasRuntimePid || hasBuildPid || !!DEFAULT_PROJECT_ID;

    if (isProd && !effectivePidAvailable) {
      // Don't attempt to initialize AppKit in production if not configured
      // — return a safe no-op modal instead to avoid noisy errors.
      const noopModal = {
        isAvailable: false,
        open: () => {
          // eslint-disable-next-line no-console
          console.warn("Attempted to open AppKit modal but AppKit is disabled in production (no project id configured).");
        },
        close: () => {},
      } as any;
      _modal = noopModal;
      return _modal;
    }
  } catch (e) {
    // ignore
  }
  // Add a targeted handler to suppress the specific authorization rejection
  // emitted by AppKit when the project hasn't been authorized for this origin.
  // We only suppress the message to prevent noisy unhandled promise rejections
  // from breaking user experience during local development. Other errors pass through.
  try {
    const localOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
    // Expand the suppression to common local/dev origins (localhost, 127.0.0.1, LAN IPs)
    // so that AppKit's origin-authorization rejection does not spam the console during
    // development on multiple hostnames (e.g. local LAN at 192.168.x.x).
    window.addEventListener("unhandledrejection", (ev: PromiseRejectionEvent) => {
      try {
        const reason = ev.reason as any;
        const msg = typeof reason === "string" ? reason : reason?.message ?? String(reason);
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
            // eslint-disable-next-line no-console
            console.warn("Reown AppKit authorization error suppressed for dev origin:", msg);
          }
        }
      } catch (e) {
        // swallow any issues inside our handler
      }
    });
  } catch (e) {
    // ignore in environments without window
  }

  try {
    const { createAppKit } = await import("@reown/appkit");
    const { WagmiAdapter } = await import("@reown/appkit-adapter-wagmi");
    const networksModule = await import("@reown/appkit/networks");

    const networks = [] as any[];
    if (networksModule?.mainnet) networks.push(networksModule.mainnet as any);
    if (networksModule?.arbitrum) networks.push(networksModule.arbitrum as any);
    
    // Add Intuition testnet
    const intuitionTestnet = {
      id: 13579,
      name: 'Intuition Testnet',
      network: 'intuition-testnet',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: {
        default: { http: ['https://testnet.rpc.intuition.systems'] },
        public: { http: ['https://testnet.rpc.intuition.systems'] }
      },
      blockExplorers: {
        default: { name: 'Explorer', url: 'https://testnet.explorer.intuition.systems' }
      },
      testnet: true
    };
    networks.push(intuitionTestnet);

  const pid = projectId ?? (window as any).__REOWN_PROJECT_ID ?? DEFAULT_PROJECT_ID;
  const wagmiAdapter = new WagmiAdapter({ projectId: pid, networks });

    const metadata = {
      name: "Nexura",
      description: "Nexura dapp",
      url: typeof window !== "undefined" ? window.location.origin : "https://example.com",
      icons: [],
    } as any;

      try {
      // createAppKit may return a promise that rejects asynchronously if the
      // project hasn't been authorized for this origin. Await it so we can
      // catch that rejection and return a safe no-op modal instead of letting
      // the rejection bubble as an unhandled promise rejection in production.
      _modal = await createAppKit({
        adapters: [wagmiAdapter],
        networks: networks as any,
        metadata,
        projectId: pid,
        features: { analytics: true },
      }) as any;

      return _modal;
    } catch (innerErr) {
      // createAppKit may throw asynchronously or synchronously if the project
      // isn't authorized for this origin. Provide a safe no-op modal so the
      // rest of the app (wallet logic) can continue to function without crashing.
      // eslint-disable-next-line no-console
      console.warn("AppKit create failed or authorization missing, falling back to no-op modal:", innerErr);
      const noopModal = {
        isAvailable: false,
        open: () => {
          // eslint-disable-next-line no-console
          console.warn("Attempted to open AppKit modal but AppKit is unavailable.");
        },
        close: () => {},
      } as any;
      _modal = noopModal;
      return _modal;
    }
  } catch (err) {
    // Optional dependency not installed or initialization failed.
    // eslint-disable-next-line no-console
    console.warn("AppKit init failed:", err);
    const noopModal = {
      isAvailable: false,
      open: () => {
        // eslint-disable-next-line no-console
        console.warn("Attempted to open AppKit modal but AppKit is unavailable.");
      },
      close: () => {},
    } as any;
    _modal = noopModal;
    return _modal;
  }
}

export async function getAppKit() {
  if (_modal !== undefined) return _modal;
  return await initAppKit();
}

export async function openAppKit(projectId?: string) {
  const modal = await initAppKit(projectId);
  if (modal?.open) modal.open();
}

export default { initAppKit, getAppKit, openAppKit };

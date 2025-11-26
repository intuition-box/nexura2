import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Prefer a runtime-injected backend URL (window.__BACKEND_URL__), then build-time Vite env var.
// Do not default to localhost in production — if no backend is configured the app
// will make requests relative to the current origin.
const RUNTIME_BACKEND = (typeof window !== 'undefined' && (window as any).__BACKEND_URL__) || undefined;
const BACKEND_BASE = RUNTIME_BACKEND || ((import.meta as any).env?.VITE_BACKEND_URL as string) || "";

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = (BACKEND_BASE || "").replace(/\/+$/g, "");
  const p = path.replace(/^\/+/, "");
  return `${base}/${p}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getStoredAccessToken() {
  try {
    return localStorage.getItem("accessToken");
  } catch (e) {
    return null;
  }
}

function buildAuthHeaders(extra?: Record<string, string>) {
  const headers: Record<string, string> = extra ? { ...extra } : {};
  const token = getStoredAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = `https://server${url}`;

  const headers = buildAuthHeaders(data ? { "Content-Type": "application/json" } : {});

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

export async function apiRequestV2(
  method: string,
  url: string,
  data?: unknown,
): Promise<any> {
  const fullUrl = `https://server${url}`;
  const accessToken = localStorage.getItem("accessToken") || "";

  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}`}

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const path = (queryKey as string[]).join("/");
    const headers = buildAuthHeaders();
    const res = await fetch(buildUrl(path), { headers });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export { buildUrl };

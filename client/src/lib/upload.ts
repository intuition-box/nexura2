export async function uploadFile(file: File, folder = "images") {
  try {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    // Prefer runtime-injected backend URL, then Vite env. Do NOT default to localhost here;
    // if no backend is configured the app will perform relative requests to the current origin.
    const RUNTIME = typeof window !== 'undefined' && (window as any).__BACKEND_URL__;
    const BACKEND_BASE = RUNTIME || ((import.meta as any).env?.VITE_BACKEND_URL as string) || "";

    const buildUrl = (path: string) => {
      if (/^https?:\/\//i.test(path)) return path;
      const base = (BACKEND_BASE || "").replace(/\/+$/g, "");
      const p = path.replace(/^\/+/, "");
      return `${base}/${p}`;
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) { /* ignore */ }

    const response = await fetch(buildUrl('/api/upload/avatar'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageData: dataUrl, fileName: file.name })
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.url || dataUrl;
  } catch (err) {
    console.warn("Upload failed, using data URL directly", String(err));
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }
}

export async function uploadFile(file: File, folder = "images") {
  try {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    // Prefer runtime-injected backend URL, then Vite env, then localhost for dev
    const RUNTIME = typeof window !== 'undefined' && (window as any).__BACKEND_URL__;
    const BACKEND_BASE = RUNTIME || ((import.meta as any).env?.VITE_BACKEND_URL as string) || "http://localhost:5051";

    function buildUrl(path: string) {
      if (/^https?:\/\//i.test(path)) return path;
      const base = BACKEND_BASE.replace(/\/+$|\\s+/g, "");
      const p = path.replace(/^\/+/, "");
      return `${base}/${p}`;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) { /* ignore */ }

    const response = await fetch(buildUrl('/api/upload/avatar'), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ imageData: dataUrl, fileName: file.name })
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.url || dataUrl;
  } catch (err) {
    console.warn("Upload failed, using data URL directly", err);
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }
}

export async function uploadFile(file: File, folder = "images") {
  try {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    // Use Vite env var if provided, otherwise fall back to the deployed backend URL.
    // `import.meta.env` may not be typed in this project, so access defensively.
    // Prefer configured Vite env var; fallback to localhost for dev instead of the deployed Render URL
    const BACKEND_BASE = ((import.meta as any).env?.VITE_BACKEND_URL as string) ||
      "http://localhost:5051";

    function buildUrl(path: string) {
      if (/^https?:\/\//i.test(path)) return path;
      const base = BACKEND_BASE.replace(/\/+$|\\s+/g, "");
      const p = path.replace(/^\/+/, "");
      return `${base}/${p}`;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log("🔑 Sending Authorization header for avatar upload");
      } else {
        console.log("❌ No accessToken found for avatar upload");
        // Fail early so caller knows they must be signed in
        throw new Error('no access token');
      }
    } catch (e) { 
      console.warn('uploadFile auth check failed', e);
      throw e;
    }

    const response = await fetch(buildUrl('/api/upload/avatar'), {
      method: 'POST',
      headers,
      // Use bearer Authorization header for auth; do not rely on cookies/credentials
      body: JSON.stringify({
        imageData: dataUrl,
        fileName: file.name
      })
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

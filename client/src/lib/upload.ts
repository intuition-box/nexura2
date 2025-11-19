import getSupabaseClient from "@/lib/supabaseClient";

export async function uploadFile(file: File, folder = "images") {
  try {
    const supabase = getSupabaseClient as any;
    if (supabase && supabase.storage) {
      const bucket = "public";
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const path = `${folder}/${fileName}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = await supabase.storage.from(bucket).getPublicUrl(path);
      return urlData?.publicUrl || null;
    }
  } catch (err) {
    console.warn("supabase upload failed, falling back to data URL", err);
  }

  // fallback: read as data URL
  return await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

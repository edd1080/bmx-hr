import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";

export const BUCKET_NAME = "vacaciones-uploads";

/**
 * Sube un archivo al bucket de Supabase Storage desde el cliente.
 * Retorna la URL publica del archivo subido.
 */
export async function uploadFileToStorage(
  file: File,
  folder: "posts" | "courses" | "beneficios" | "documentos" | "avatars" = "posts"
): Promise<string> {
  const supabase = createBrowserClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Error al subir archivo a Supabase Storage: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Sube un buffer de archivo al bucket de Supabase Storage desde el servidor (API routes).
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(`Error al subir buffer a Supabase Storage: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

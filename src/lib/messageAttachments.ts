import { supabase } from "./supabase";

export interface MessageAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageAttachment(type?: string, name?: string) {
  if (type?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name ?? "");
}

export async function uploadMessageAttachment(file: File, userId: string) {
  const safeName =
    file.name
      .replace(/[^\w.\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "-") || "attachment";
  const path = `messages/${userId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from("student-documents")
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("student-documents")
    .getPublicUrl(path);

  return {
    url: data.publicUrl,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
  } satisfies MessageAttachment;
}

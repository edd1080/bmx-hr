export const POST_TIPOS = ["COMUNICADO", "NOTICIA"] as const;
export type PostTipo = (typeof POST_TIPOS)[number];

export const POST_TIPO_LABELS: Record<PostTipo, string> = {
  COMUNICADO: "Comunicado",
  NOTICIA: "Noticia",
};

export const POST_TIPO_STYLES: Record<PostTipo, { bg: string; text: string; icon: string }> = {
  COMUNICADO: { bg: "var(--vacation-bg)", text: "var(--vacation-text)", icon: "📢" },
  NOTICIA: { bg: "var(--warning-bg)", text: "var(--warning)", icon: "📰" },
};

export const POST_TITULO_MAX = 120;
export const POST_CUERPO_MAX = 4000;
// Límite del data URL de la imagen ya comprimida en el cliente (~3 MB de base64).
export const POST_IMAGE_MAX_CHARS = 3_000_000;

export function isValidPostTipo(value: unknown): value is PostTipo {
  return (POST_TIPOS as readonly string[]).includes(String(value));
}

export function isValidImageData(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/(png|jpe?g|webp);base64,/.test(value);
}

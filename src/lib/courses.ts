export const MODALIDADES = ["VIRTUAL", "PRESENCIAL"] as const;
export type Modalidad = (typeof MODALIDADES)[number];

export const MODALIDAD_LABELS: Record<Modalidad, string> = {
  VIRTUAL: "Virtual",
  PRESENCIAL: "Presencial",
};

export const MODALIDAD_STYLES: Record<Modalidad, { bg: string; text: string; icon: string }> = {
  VIRTUAL: { bg: "var(--vacation-bg)", text: "var(--vacation-text)", icon: "💻" },
  PRESENCIAL: { bg: "var(--warning-bg)", text: "var(--warning)", icon: "📍" },
};

export function isValidModalidad(value: unknown): value is Modalidad {
  return (MODALIDADES as readonly string[]).includes(String(value));
}

export function formatSesion(date: Date): string {
  return date.toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type VigenciaEstado = "SIN_VENCIMIENTO" | "VIGENTE" | "POR_VENCER" | "VENCIDO";

export const VIGENCIA_META: Record<VigenciaEstado, { label: string; bg: string; text: string }> = {
  SIN_VENCIMIENTO: { label: "Sin vencimiento", bg: "var(--tint-gray-bg)", text: "var(--tint-gray-fg)" },
  VIGENTE: { label: "Vigente", bg: "var(--success-bg)", text: "var(--success)" },
  POR_VENCER: { label: "Por vencer", bg: "var(--warning-bg)", text: "var(--warning)" },
  VENCIDO: { label: "Vencido", bg: "var(--danger-bg)", text: "var(--danger)" },
};

// Calcula la fecha de vencimiento y el estado de una constancia a partir de la
// fecha de conclusión y la vigencia (en meses) del curso. "Por vencer" = faltan
// 45 días o menos. today se inyecta para no romper la ejecución determinista.
export function computeVigencia(
  completedAt: Date | null,
  vigenciaMeses: number | null,
  today: Date
): { estado: VigenciaEstado; venceEl: Date | null } {
  if (!vigenciaMeses || !completedAt) return { estado: "SIN_VENCIMIENTO", venceEl: null };
  const venceEl = new Date(completedAt);
  venceEl.setMonth(venceEl.getMonth() + vigenciaMeses);
  const diffDias = Math.floor((venceEl.getTime() - today.getTime()) / 86400000);
  if (diffDias < 0) return { estado: "VENCIDO", venceEl };
  if (diffDias <= 45) return { estado: "POR_VENCER", venceEl };
  return { estado: "VIGENTE", venceEl };
}

export const QUESTION_TEXTO_MAX = 400;
export const QUESTION_MIN_OPCIONES = 2;
export const QUESTION_MAX_OPCIONES = 6;

// Serializa/parsea el arreglo de opciones que se guarda como texto JSON en SQLite.
export function parseOpciones(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map((o) => String(o)) : [];
  } catch {
    return [];
  }
}

export const LESSON_TIPOS = ["VIDEO", "FORM", "LINK"] as const;
export type LessonTipo = (typeof LESSON_TIPOS)[number];

export const LESSON_TIPO_LABELS: Record<LessonTipo, string> = {
  VIDEO: "Video",
  FORM: "Formulario",
  LINK: "Recurso / Liga",
};

export const LESSON_TIPO_META: Record<LessonTipo, { icon: string; bg: string; color: string }> = {
  VIDEO: { icon: "▶", bg: "var(--vacation-bg)", color: "var(--vacation-text)" },
  FORM: { icon: "📝", bg: "var(--teal-bg)", color: "var(--teal)" },
  LINK: { icon: "🔗", bg: "var(--tint-purple-bg)", color: "var(--tint-purple-fg)" },
};

export const COURSE_TITULO_MAX = 120;
export const COURSE_DESC_MAX = 2000;
export const LESSON_TITULO_MAX = 140;
export const COURSE_COVER_MAX_CHARS = 3_000_000;

export function isValidLessonTipo(value: unknown): value is LessonTipo {
  return (LESSON_TIPOS as readonly string[]).includes(String(value));
}

export function isValidCoverData(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/(png|jpe?g|webp);base64,/.test(value);
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export type EmbedInfo =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string }
  | { kind: "external"; src: string };

/**
 * Convierte una URL de video pegada por el usuario en una fuente embebible.
 * Soporta YouTube, Vimeo y Google Drive como iframe; archivos de video directos
 * (.mp4/.webm/.ogg) como <video>; cualquier otra cosa queda como enlace externo.
 */
export function getEmbedInfo(rawUrl: string): EmbedInfo {
  const url = rawUrl.trim();

  // YouTube
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };

  // Google Drive
  const drive = url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (drive) return { kind: "iframe", src: `https://drive.google.com/file/d/${drive[1]}/preview` };

  // Archivo de video directo
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { kind: "video", src: url };

  return { kind: "external", src: url };
}

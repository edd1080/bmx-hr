// Módulo Firma Electrónica — constantes y validadores compartidos (sin imports de
// Node, para poder usarse tanto en el cliente como en el servidor).

export const DOCUMENTO_TIPOS = ["POLITICA", "COMUNICADO", "ACUSE", "DOCUMENTO", "CONSTANCIA"] as const;
export type DocumentoTipo = (typeof DOCUMENTO_TIPOS)[number];

export const DOCUMENTO_TIPO_META: Record<
  DocumentoTipo,
  { label: string; plural: string; icon: string; bg: string; text: string }
> = {
  POLITICA: { label: "Política interna", plural: "Políticas internas", icon: "📕", bg: "var(--vacation-bg)", text: "var(--vacation-text)" },
  COMUNICADO: { label: "Comunicado", plural: "Comunicados", icon: "📢", bg: "var(--warning-bg)", text: "var(--warning)" },
  ACUSE: { label: "Acuse de recibido", plural: "Acuses de recibido", icon: "📩", bg: "var(--success-bg)", text: "var(--success)" },
  DOCUMENTO: { label: "Documento interno", plural: "Documentos internos", icon: "📄", bg: "var(--earlyfriday-bg)", text: "var(--earlyfriday-text)" },
  CONSTANCIA: { label: "Constancia", plural: "Constancias", icon: "🎓", bg: "var(--tint-purple-bg)", text: "var(--tint-purple-fg)" },
};

export const DOCUMENTO_ALCANCES = ["TODOS", "AREA", "SELECCION"] as const;
export type DocumentoAlcance = (typeof DOCUMENTO_ALCANCES)[number];

export const ALCANCE_META: Record<DocumentoAlcance, { label: string; hint: string }> = {
  TODOS: { label: "Toda la empresa", hint: "Todos los colaboradores activos deberán firmar." },
  AREA: { label: "Un área", hint: "Solo los colaboradores del área seleccionada." },
  SELECCION: { label: "Colaboradores específicos", hint: "Solo las personas que elijas." },
};

export const DOCUMENTO_TITULO_MAX = 140;
export const DOCUMENTO_CUERPO_MAX = 20000;
export const NOMBRE_FIRMA_MAX = 120;
// El archivo adjunto (PDF/imagen) se guarda como data URL en la BD; se limita el
// tamaño para no inflar dev.db ni la carpeta sincronizada en OneDrive.
export const DOCUMENTO_ARCHIVO_MAX_CHARS = 6_000_000;

export function isValidDocumentoTipo(v: unknown): v is DocumentoTipo {
  return (DOCUMENTO_TIPOS as readonly string[]).includes(String(v));
}
export function isValidDocumentoAlcance(v: unknown): v is DocumentoAlcance {
  return (DOCUMENTO_ALCANCES as readonly string[]).includes(String(v));
}
export function isValidDocumentoArchivo(v: unknown): v is string {
  return typeof v === "string" && /^data:(application\/pdf|image\/(png|jpe?g|webp));base64,/.test(v);
}

// Folio legible derivado del id (no requiere secuencia en BD).
export function documentoFolio(id: string): string {
  return `FE-${id.slice(-6).toUpperCase()}`;
}

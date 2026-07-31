// Tintes vía tokens CSS para que los avatares se adapten al modo oscuro.
const PALETTE = [
  { bg: "var(--vacation-bg)", col: "var(--vacation-text)" },
  { bg: "var(--earlyfriday-bg)", col: "var(--earlyfriday-text)" },
  { bg: "var(--teal-bg)", col: "var(--teal)" },
  { bg: "var(--warning-bg)", col: "var(--warning)" },
  { bg: "var(--tint-purple-bg)", col: "var(--tint-purple-fg)" },
  { bg: "var(--tint-pink-bg)", col: "var(--tint-pink-fg)" },
];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

/** Deterministic avatar colors from any stable string (e.g. user id). */
export function getAvatarColors(seed: string): { bg: string; col: string } {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

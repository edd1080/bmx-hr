"use client";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "500px",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(22,39,75,.42)] p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full overflow-auto rounded-2xl bg-surface shadow-2xl"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-divider px-6 py-5">
          <div>
            <h3 className="font-display text-lg font-bold text-brand-primary">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-text-muted-2">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-page text-text-muted hover:text-brand-primary"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

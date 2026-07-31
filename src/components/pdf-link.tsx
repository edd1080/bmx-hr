export function PdfLink({ requestId }: { requestId: string }) {
  return (
    <a
      href={`/api/requests/${requestId}/pdf`}
      target="_blank"
      className="text-xs font-medium text-brand-accent underline hover:brightness-90"
    >
      PDF de conformidad
    </a>
  );
}

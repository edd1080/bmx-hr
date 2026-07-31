import { auth } from "@/auth";
import { getOrgDirectory } from "@/lib/org-server";
import { OrgChartBrowser } from "@/components/org-chart-browser";

export default async function OrganigramaPage() {
  const session = await auth();
  const { people, rootIds } = await getOrgDirectory();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[23px] font-bold text-brand-primary">Organigrama</h1>
        <p className="mt-1 text-[14.5px] text-text-muted">{people.length} colaboradores en la compañía</p>
      </div>
      <OrgChartBrowser people={people} rootIds={rootIds} currentUserId={session!.user.id} />
    </div>
  );
}

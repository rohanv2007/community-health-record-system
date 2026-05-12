import { ReportsModule } from "@/components/app/modules";
import { loadReportsData } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const profile = await requireCurrentProfile("/reports");
  const data = await loadReportsData(profile);
  return <ReportsModule {...data} profile={{ id: profile.id, role: profile.role, full_name: profile.full_name }} />;
}

import { ReportsModule } from "@/components/app/modules";
import { loadAppData } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const profile = await requireCurrentProfile("/reports");
  const data = await loadAppData(profile);
  return <ReportsModule {...data} profile={{ id: profile.id, role: profile.role, full_name: profile.full_name }} />;
}

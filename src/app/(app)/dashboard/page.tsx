import { DashboardModule } from "@/components/app/modules";
import { loadAppData } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireCurrentProfile("/dashboard");
  const data = await loadAppData(profile);
  return <DashboardModule {...data} profile={{ id: profile.id, role: profile.role, full_name: profile.full_name }} />;
}

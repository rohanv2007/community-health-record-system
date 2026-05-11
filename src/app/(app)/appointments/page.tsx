import { AppointmentsModule } from "@/components/app/modules";
import { loadAppData } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const profile = await requireCurrentProfile("/appointments");
  const data = await loadAppData(profile);
  return <AppointmentsModule {...data} profile={{ id: profile.id, role: profile.role, full_name: profile.full_name }} />;
}

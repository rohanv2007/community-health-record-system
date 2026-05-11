import { PatientsModule } from "@/components/app/modules";
import { loadAppData } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const profile = await requireCurrentProfile("/patients");
  const data = await loadAppData(profile);
  return <PatientsModule {...data} profile={{ id: profile.id, role: profile.role, full_name: profile.full_name }} />;
}

import { DoctorsModule } from "@/components/app/modules";
import { loadDoctorsData } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function DoctorsPage() {
  const profile = await requireCurrentProfile("/doctors");
  const data = await loadDoctorsData(profile);
  return <DoctorsModule {...data} profile={{ id: profile.id, role: profile.role, full_name: profile.full_name }} />;
}

import { StaffModule } from "@/components/app/modules";
import { loadAppData } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const profile = await requireCurrentProfile("/staff");
  const data = await loadAppData(profile);
  return <StaffModule {...data} profile={{ id: profile.id, role: profile.role, full_name: profile.full_name }} />;
}

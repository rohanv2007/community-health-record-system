import { PrescriptionsModule } from "@/components/app/modules";
import { loadAppData } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function PrescriptionsPage() {
  const profile = await requireCurrentProfile("/prescriptions");
  const data = await loadAppData(profile);
  return <PrescriptionsModule {...data} profile={{ id: profile.id, role: profile.role, full_name: profile.full_name }} />;
}

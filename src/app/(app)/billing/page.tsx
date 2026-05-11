import { BillingModule } from "@/components/app/modules";
import { loadAppData } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const profile = await requireCurrentProfile("/billing");
  const data = await loadAppData(profile);
  return <BillingModule {...data} profile={{ id: profile.id, role: profile.role, full_name: profile.full_name }} />;
}

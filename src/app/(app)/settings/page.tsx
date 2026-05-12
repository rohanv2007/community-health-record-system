import { SettingsModule } from "@/components/app/modules";
import { loadSettingsData } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await requireCurrentProfile("/settings");
  const data = await loadSettingsData(profile);
  return <SettingsModule {...data} profile={{ id: profile.id, role: profile.role, full_name: profile.full_name }} />;
}

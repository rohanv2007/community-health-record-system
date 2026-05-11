import { AppShell } from "@/components/app/app-shell";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCurrentProfile();
  return (
    <AppShell
      profile={{ full_name: profile.full_name, role: profile.role, specialty: profile.specialty }}
      clinicName={profile.clinics?.name ?? "HealthPoint Clinic"}
    >
      {children}
    </AppShell>
  );
}

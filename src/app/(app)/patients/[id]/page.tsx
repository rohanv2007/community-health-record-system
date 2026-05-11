import { notFound } from "next/navigation";
import { PatientDetailModule } from "@/components/app/modules";
import { loadPatientDetail } from "@/lib/server/data";
import { requireCurrentProfile } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireCurrentProfile("/patients");
  const detail = await loadPatientDetail(profile, params.id);
  if (!detail.patient) notFound();
  return (
    <PatientDetailModule
      patient={detail.patient}
      data={{ ...detail, profile: { id: profile.id, role: profile.role, full_name: profile.full_name } }}
    />
  );
}

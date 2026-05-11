import { createClient } from "@/lib/supabase/server";
import type {
  ActivityEvent,
  Appointment,
  Clinic,
  Invoice,
  LabReport,
  Patient,
  Prescription,
  Profile,
} from "@/types/database";
import type { CurrentProfile } from "@/lib/server/auth";

export type AppData = {
  clinic: Clinic | null;
  patients: Patient[];
  doctors: Profile[];
  staff: Profile[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  invoices: Invoice[];
  labReports: LabReport[];
  activity: ActivityEvent[];
};

export async function loadAppData(profile: CurrentProfile): Promise<AppData> {
  const supabase = createClient();

  const [
    clinicResult,
    patientsResult,
    doctorsResult,
    staffResult,
    appointmentsResult,
    prescriptionsResult,
    invoicesResult,
    labReportsResult,
    activityResult,
  ] = await Promise.all([
    supabase.from("clinics").select("*").eq("id", profile.clinic_id).single(),
    supabase.from("patients").select("*").order("updated_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("role", "doctor").eq("active", true).order("full_name"),
    supabase.from("profiles").select("*").in("role", ["admin", "receptionist"]).order("full_name"),
    supabase
      .from("appointments")
      .select("*, patients(id, full_name, patient_code, phone), doctor:profiles!appointments_doctor_id_fkey(id, full_name, specialty)")
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("prescriptions")
      .select("*, prescription_items(*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("*, patients(id, full_name, patient_code, phone), invoice_items(*), payments(*)")
      .order("created_at", { ascending: false }),
    supabase.from("lab_reports").select("*").order("created_at", { ascending: false }),
    supabase.from("activity_events").select("*").order("created_at", { ascending: false }).limit(15),
  ]);

  const appointments = ((appointmentsResult.data ?? []) as Appointment[]).filter((appointment) => {
    if (profile.role !== "doctor") return true;
    return appointment.doctor_id === profile.id;
  });

  const doctorPatientIds = new Set(appointments.map((appointment) => appointment.patient_id));
  const patients = ((patientsResult.data ?? []) as Patient[]).filter((patient) => {
    if (profile.role !== "doctor") return true;
    return doctorPatientIds.has(patient.id);
  });

  return {
    clinic: (clinicResult.data as Clinic | null) ?? null,
    patients,
    doctors: (doctorsResult.data ?? []) as Profile[],
    staff: (staffResult.data ?? []) as Profile[],
    appointments,
    prescriptions: (prescriptionsResult.data ?? []) as Prescription[],
    invoices: profile.role === "doctor" ? [] : ((invoicesResult.data ?? []) as Invoice[]),
    labReports: (labReportsResult.data ?? []) as LabReport[],
    activity: (activityResult.data ?? []) as ActivityEvent[],
  };
}

export async function loadPatientDetail(profile: CurrentProfile, patientId: string) {
  const data = await loadAppData(profile);
  const patient = data.patients.find((item) => item.id === patientId) ?? null;

  return {
    ...data,
    patient,
    appointments: data.appointments.filter((item) => item.patient_id === patientId),
    prescriptions: data.prescriptions.filter((item) => item.patient_id === patientId),
    invoices: data.invoices.filter((item) => item.patient_id === patientId),
    labReports: data.labReports.filter((item) => item.patient_id === patientId),
  };
}

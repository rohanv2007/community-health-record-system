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

function clinicFromProfile(profile: CurrentProfile) {
  return (profile.clinics as Clinic | null | undefined) ?? null;
}

function emptyAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    clinic: null,
    patients: [],
    doctors: [],
    staff: [],
    appointments: [],
    prescriptions: [],
    invoices: [],
    labReports: [],
    activity: [],
    ...overrides,
  };
}

function scopeAppointments(profile: CurrentProfile, appointments: Appointment[]) {
  if (profile.role !== "doctor") return appointments;
  return appointments.filter((appointment) => appointment.doctor_id === profile.id);
}

function scopePatients(
  profile: CurrentProfile,
  patients: Patient[],
  appointments: Array<Pick<Appointment, "patient_id" | "doctor_id">>
) {
  if (profile.role !== "doctor") return patients;
  const doctorPatientIds = new Set(
    appointments
      .filter((appointment) => appointment.doctor_id === profile.id)
      .map((appointment) => appointment.patient_id)
  );
  return patients.filter((patient) => doctorPatientIds.has(patient.id));
}

function scopePrescriptions(profile: CurrentProfile, prescriptions: Prescription[]) {
  if (profile.role !== "doctor") return prescriptions;
  return prescriptions.filter((prescription) => prescription.doctor_id === profile.id);
}

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

  const appointments = scopeAppointments(profile, (appointmentsResult.data ?? []) as Appointment[]);
  const patients = scopePatients(
    profile,
    (patientsResult.data ?? []) as Patient[],
    (appointmentsResult.data ?? []) as Appointment[]
  );

  return {
    clinic: ((clinicResult.data as Clinic | null) ?? clinicFromProfile(profile)),
    patients,
    doctors: (doctorsResult.data ?? []) as Profile[],
    staff: (staffResult.data ?? []) as Profile[],
    appointments,
    prescriptions: scopePrescriptions(profile, (prescriptionsResult.data ?? []) as Prescription[]),
    invoices: profile.role === "doctor" ? [] : ((invoicesResult.data ?? []) as Invoice[]),
    labReports: (labReportsResult.data ?? []) as LabReport[],
    activity: (activityResult.data ?? []) as ActivityEvent[],
  };
}

export async function loadDashboardData(profile: CurrentProfile): Promise<AppData> {
  const supabase = createClient();
  const [patientsResult, doctorsResult, appointmentsResult, invoicesResult, activityResult] =
    await Promise.all([
      supabase.from("patients").select("id, dob").order("updated_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "doctor").eq("active", true).order("full_name"),
      supabase
        .from("appointments")
        .select("*, patients(id, full_name, patient_code, phone), doctor:profiles!appointments_doctor_id_fkey(id, full_name, specialty)")
        .order("scheduled_at", { ascending: false }),
      profile.role === "doctor"
        ? Promise.resolve({ data: [] })
        : supabase
            .from("invoices")
            .select("id, status, paid_amount, total, created_at")
            .order("created_at", { ascending: false }),
      supabase.from("activity_events").select("*").order("created_at", { ascending: false }).limit(15),
    ]);

  const appointments = scopeAppointments(profile, (appointmentsResult.data ?? []) as Appointment[]);
  const patients = scopePatients(
    profile,
    (patientsResult.data ?? []) as Patient[],
    (appointmentsResult.data ?? []) as Appointment[]
  );

  return emptyAppData({
    clinic: clinicFromProfile(profile),
    patients,
    doctors: (doctorsResult.data ?? []) as Profile[],
    appointments,
    invoices: (invoicesResult.data ?? []) as Invoice[],
    activity: (activityResult.data ?? []) as ActivityEvent[],
  });
}

export async function loadPatientsData(profile: CurrentProfile): Promise<AppData> {
  const supabase = createClient();
  const [patientsResult, appointmentsResult] = await Promise.all([
    supabase.from("patients").select("*").order("updated_at", { ascending: false }),
    profile.role === "doctor"
      ? supabase.from("appointments").select("patient_id, doctor_id")
      : Promise.resolve({ data: [] }),
  ]);

  return emptyAppData({
    clinic: clinicFromProfile(profile),
    patients: scopePatients(
      profile,
      (patientsResult.data ?? []) as Patient[],
      (appointmentsResult.data ?? []) as Appointment[]
    ),
  });
}

export async function loadAppointmentsData(profile: CurrentProfile): Promise<AppData> {
  const supabase = createClient();
  const [patientsResult, doctorsResult, appointmentsResult] = await Promise.all([
    supabase.from("patients").select("*").order("updated_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("role", "doctor").eq("active", true).order("full_name"),
    supabase
      .from("appointments")
      .select("*, patients(id, full_name, patient_code, phone), doctor:profiles!appointments_doctor_id_fkey(id, full_name, specialty)")
      .order("scheduled_at", { ascending: false }),
  ]);

  const appointments = scopeAppointments(profile, (appointmentsResult.data ?? []) as Appointment[]);

  return emptyAppData({
    clinic: clinicFromProfile(profile),
    patients: scopePatients(
      profile,
      (patientsResult.data ?? []) as Patient[],
      (appointmentsResult.data ?? []) as Appointment[]
    ),
    doctors: (doctorsResult.data ?? []) as Profile[],
    appointments,
  });
}

export async function loadPrescriptionsData(profile: CurrentProfile): Promise<AppData> {
  const supabase = createClient();
  const [patientsResult, doctorsResult, appointmentsResult, prescriptionsResult] = await Promise.all([
    supabase.from("patients").select("*").order("updated_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("role", "doctor").eq("active", true).order("full_name"),
    supabase
      .from("appointments")
      .select("*, patients(id, full_name, patient_code, phone), doctor:profiles!appointments_doctor_id_fkey(id, full_name, specialty)")
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("prescriptions")
      .select("*, prescription_items(*)")
      .order("created_at", { ascending: false }),
  ]);

  const appointments = scopeAppointments(profile, (appointmentsResult.data ?? []) as Appointment[]);

  return emptyAppData({
    clinic: clinicFromProfile(profile),
    patients: scopePatients(
      profile,
      (patientsResult.data ?? []) as Patient[],
      (appointmentsResult.data ?? []) as Appointment[]
    ),
    doctors: (doctorsResult.data ?? []) as Profile[],
    appointments,
    prescriptions: scopePrescriptions(profile, (prescriptionsResult.data ?? []) as Prescription[]),
  });
}

export async function loadBillingData(profile: CurrentProfile): Promise<AppData> {
  const supabase = createClient();
  const [patientsResult, invoicesResult] = await Promise.all([
    supabase.from("patients").select("id, patient_code, full_name, phone").order("updated_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("*, patients(id, full_name, patient_code, phone), invoice_items(*), payments(*)")
      .order("created_at", { ascending: false }),
  ]);

  return emptyAppData({
    clinic: clinicFromProfile(profile),
    patients: (patientsResult.data ?? []) as Patient[],
    invoices: (invoicesResult.data ?? []) as Invoice[],
  });
}

export async function loadDoctorsData(profile: CurrentProfile): Promise<AppData> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "doctor")
    .eq("active", true)
    .order("full_name");

  return emptyAppData({ clinic: clinicFromProfile(profile), doctors: (data ?? []) as Profile[] });
}

export async function loadStaffData(profile: CurrentProfile): Promise<AppData> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "receptionist"])
    .order("full_name");

  return emptyAppData({ clinic: clinicFromProfile(profile), staff: (data ?? []) as Profile[] });
}

export async function loadSettingsData(profile: CurrentProfile): Promise<AppData> {
  return emptyAppData({ clinic: clinicFromProfile(profile) });
}

export async function loadReportsData(profile: CurrentProfile): Promise<AppData> {
  const supabase = createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, paid_amount, created_at")
    .order("created_at", { ascending: false });

  return emptyAppData({ clinic: clinicFromProfile(profile), invoices: (data ?? []) as Invoice[] });
}

export async function loadPatientDetail(profile: CurrentProfile, patientId: string) {
  const supabase = createClient();
  const [
    patientResult,
    appointmentsResult,
    prescriptionsResult,
    invoicesResult,
    labReportsResult,
  ] = await Promise.all([
    supabase.from("patients").select("*").eq("id", patientId).maybeSingle(),
    supabase
      .from("appointments")
      .select("*, patients(id, full_name, patient_code, phone), doctor:profiles!appointments_doctor_id_fkey(id, full_name, specialty)")
      .eq("patient_id", patientId)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("prescriptions")
      .select("*, prescription_items(*)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    profile.role === "doctor"
      ? Promise.resolve({ data: [] })
      : supabase
          .from("invoices")
          .select("*, patients(id, full_name, patient_code, phone), invoice_items(*), payments(*)")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
    supabase.from("lab_reports").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
  ]);

  const appointments = scopeAppointments(profile, (appointmentsResult.data ?? []) as Appointment[]);
  const prescriptions = scopePrescriptions(profile, (prescriptionsResult.data ?? []) as Prescription[]);
  const patient = (patientResult.data as Patient | null) ?? null;
  const canViewPatient = patient && (profile.role !== "doctor" || appointments.length > 0);

  return {
    ...emptyAppData({
      clinic: clinicFromProfile(profile),
      patients: canViewPatient ? [patient] : [],
      appointments,
      prescriptions,
      invoices: (invoicesResult.data ?? []) as Invoice[],
      labReports: (labReportsResult.data ?? []) as LabReport[],
    }),
    patient: canViewPatient ? patient : null,
  };
}

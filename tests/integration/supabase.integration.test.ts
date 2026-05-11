import * as dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password = "Demo@1234";

function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required for integration tests.`);
  return value;
}

async function signIn(email: string) {
  const client = createClient(requireEnv(url, "NEXT_PUBLIC_SUPABASE_URL"), requireEnv(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function profile(client: SupabaseClient, role: "admin" | "doctor" | "receptionist") {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("role", role)
    .eq("active", true)
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

describe("Supabase live integration", () => {
  let admin: SupabaseClient;
  let doctor: SupabaseClient;
  let reception: SupabaseClient;
  let doctorProfile: any;
  let receptionProfile: any;
  let patient: any;

  beforeAll(async () => {
    admin = await signIn("admin@healthpoint.com");
    doctor = await signIn("doctor@healthpoint.com");
    reception = await signIn("reception@healthpoint.com");
    doctorProfile = await profile(admin, "doctor");
    receptionProfile = await profile(admin, "receptionist");
  });

  it("creates, reads, and updates a patient through RLS", async () => {
    const suffix = Date.now();
    const { data, error } = await reception
      .from("patients")
      .insert({
        clinic_id: receptionProfile.clinic_id,
        patient_code: `TST-${suffix}`,
        full_name: `Integration Patient ${suffix}`,
        dob: "1994-02-15",
        gender: "female",
        blood_group: "O+",
        phone: `90000${String(suffix).slice(-5)}`,
        email: `integration-${suffix}@example.com`,
        address: "Test address",
        allergies: "None",
        emergency_contact: "Test Contact",
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    patient = data;
    expect(patient.full_name).toContain("Integration Patient");

    const { data: updated, error: updateError } = await reception
      .from("patients")
      .update({ allergies: "Dust" })
      .eq("id", patient.id)
      .select("*")
      .single();

    expect(updateError).toBeNull();
    expect(updated.allergies).toBe("Dust");
  });

  it("creates and cancels appointments while enforcing doctor slot conflicts", async () => {
    const scheduledAt = new Date(Date.now() + 370 * 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 10_000_000)).toISOString();

    const { data: appointment, error } = await reception
      .from("appointments")
      .insert({
        clinic_id: receptionProfile.clinic_id,
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        scheduled_at: scheduledAt,
        duration_mins: 30,
        reason: "Integration conflict check",
        created_by: receptionProfile.id,
      })
      .select("*")
      .single();

    expect(error).toBeNull();

    const { error: conflictError } = await reception.from("appointments").insert({
      clinic_id: receptionProfile.clinic_id,
      patient_id: patient.id,
      doctor_id: doctorProfile.id,
      scheduled_at: scheduledAt,
      duration_mins: 30,
      reason: "Integration duplicate",
      created_by: receptionProfile.id,
    });

    expect(conflictError).toBeTruthy();

    const { data: cancelled, error: cancelError } = await reception
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment.id)
      .select("status")
      .single();

    expect(cancelError).toBeNull();
    expect(cancelled.status).toBe("cancelled");
  });

  it("creates a prescription with medicine items", async () => {
    const scheduledAt = new Date(Date.now() + 371 * 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 10_000_000)).toISOString();
    const { data: appointment, error: appointmentError } = await reception
      .from("appointments")
      .insert({
        clinic_id: receptionProfile.clinic_id,
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        scheduled_at: scheduledAt,
        duration_mins: 30,
        reason: "Integration prescription appointment",
        status: "completed",
        created_by: receptionProfile.id,
      })
      .select("*")
      .single();
    expect(appointmentError).toBeNull();

    const { data: prescription, error } = await doctor
      .from("prescriptions")
      .insert({
        appointment_id: appointment.id,
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        diagnosis: "Integration diagnosis",
        notes: "Patient stable",
      })
      .select("*")
      .single();

    expect(error).toBeNull();

    const { error: itemError } = await doctor.from("prescription_items").insert({
      prescription_id: prescription.id,
      medicine_name: "Paracetamol",
      dosage: "500 mg",
      frequency: "Twice daily",
      duration_days: 3,
      instructions: "After food",
    });

    expect(itemError).toBeNull();
  });

  it("creates an invoice, records payment, and updates paid status", async () => {
    const invoiceNumber = `TST-${Date.now()}`;
    const { data: invoice, error } = await reception
      .from("invoices")
      .insert({
        clinic_id: receptionProfile.clinic_id,
        patient_id: patient.id,
        invoice_number: invoiceNumber,
        subtotal: 500,
        tax_amount: 25,
        total: 525,
        paid_amount: 0,
        status: "unpaid",
        created_by: receptionProfile.id,
      })
      .select("*")
      .single();
    expect(error).toBeNull();

    const { error: itemError } = await reception.from("invoice_items").insert({
      invoice_id: invoice.id,
      description: "Consultation",
      quantity: 1,
      unit_price: 500,
      total: 500,
    });
    expect(itemError).toBeNull();

    const { error: paymentError } = await reception.from("payments").insert({
      invoice_id: invoice.id,
      amount: 525,
      method: "upi",
      recorded_by: receptionProfile.id,
    });
    expect(paymentError).toBeNull();

    const { data: paidInvoice, error: readError } = await reception
      .from("invoices")
      .select("status, paid_amount")
      .eq("id", invoice.id)
      .single();

    expect(readError).toBeNull();
    expect(paidInvoice.status).toBe("paid");
    expect(Number(paidInvoice.paid_amount)).toBe(525);
  });

  it("enforces billing RLS for doctors", async () => {
    const { data, error } = await doctor.from("invoices").select("id").limit(5);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

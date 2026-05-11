"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateInvoiceTotals, getInvoiceStatus, nextInvoiceNumber } from "@/lib/invoice-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  appointmentSchema,
  clinicSetupSchema,
  invoiceSchema,
  labReportSchema,
  patientSchema,
  paymentSchema,
  prescriptionSchema,
  staffSchema,
} from "@/lib/validation";
import type { AppRole, Profile } from "@/types/database";

type ActionResult = { ok: true; message: string } | { ok: false; message: string };

async function currentProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be signed in.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !profile) throw new Error("Profile not found.");
  return profile as Profile;
}

function assertRole(profile: Profile, roles: AppRole[]) {
  if (!roles.includes(profile.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
}

function valuesFromForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function createActivity(description: string, eventType: string, actor: Profile) {
  const supabase = createClient();
  await supabase.from("activity_events").insert({
    clinic_id: actor.clinic_id,
    actor_id: actor.id,
    event_type: eventType,
    description,
  });
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createPatientAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await currentProfile();
    assertRole(actor, ["admin", "receptionist"]);
    const input = patientSchema.parse(valuesFromForm(formData));
    const supabase = createClient();
    const { count } = await supabase
      .from("patients")
      .select("id", { count: "exact", head: true });
    const patientCode = `HP-${String((count ?? 0) + 1).padStart(5, "0")}`;

    const { error } = await supabase.from("patients").insert({
      ...input,
      email: input.email || null,
      photo_url: input.photo_url || null,
      clinic_id: actor.clinic_id,
      patient_code: patientCode,
    });

    if (error) throw error;
    await createActivity(`Registered new patient ${input.full_name}`, "patient.created", actor);
    revalidatePath("/patients");
    revalidatePath("/dashboard");
    return { ok: true, message: "Patient registered." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Patient could not be saved." };
  }
}

export async function updatePatientAction(patientId: string, formData: FormData): Promise<ActionResult> {
  try {
    const actor = await currentProfile();
    assertRole(actor, ["admin", "receptionist"]);
    const input = patientSchema.parse(valuesFromForm(formData));
    const supabase = createClient();
    const { error } = await supabase.from("patients").update(input).eq("id", patientId);
    if (error) throw error;
    await createActivity(`Updated patient ${input.full_name}`, "patient.updated", actor);
    revalidatePath("/patients");
    revalidatePath(`/patients/${patientId}`);
    return { ok: true, message: "Patient updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Patient could not be updated." };
  }
}

export async function createAppointmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await currentProfile();
    assertRole(actor, ["admin", "doctor", "receptionist"]);
    const input = appointmentSchema.parse(valuesFromForm(formData));
    const supabase = createClient();
    const { error } = await supabase.from("appointments").insert({
      ...input,
      clinic_id: actor.clinic_id,
      created_by: actor.id,
      status: "scheduled",
    });

    if (error) {
      if (error.code === "23P01") throw new Error("This doctor already has an appointment in that slot.");
      throw error;
    }

    await createActivity("Booked a new appointment", "appointment.created", actor);
    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    return { ok: true, message: "Appointment booked." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Appointment could not be booked." };
  }
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: "completed" | "cancelled",
  notes?: string
): Promise<ActionResult> {
  try {
    const actor = await currentProfile();
    assertRole(actor, ["admin", "doctor", "receptionist"]);
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ status, notes: notes || null })
      .eq("id", appointmentId);
    if (error) throw error;
    await createActivity(`Marked appointment as ${status}`, `appointment.${status}`, actor);
    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    return { ok: true, message: `Appointment marked ${status}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Appointment could not be updated." };
  }
}

export async function createPrescriptionAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await currentProfile();
    assertRole(actor, ["admin", "doctor"]);
    const values = valuesFromForm(formData);
    const input = prescriptionSchema.parse({
      ...values,
      items: JSON.parse(String(values.items ?? "[]")),
    });
    const supabase = createClient();
    const { data: prescription, error } = await supabase
      .from("prescriptions")
      .insert({
        appointment_id: input.appointment_id,
        patient_id: input.patient_id,
        doctor_id: input.doctor_id,
        diagnosis: input.diagnosis,
        notes: input.notes || null,
        follow_up_date: input.follow_up_date || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    const { error: itemError } = await supabase.from("prescription_items").insert(
      input.items.map((item) => ({
        prescription_id: prescription.id,
        medicine_name: item.medicine_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration_days: item.duration_days,
        instructions: item.instructions || null,
      }))
    );

    if (itemError) throw itemError;
    await createActivity(`Created prescription for ${input.diagnosis}`, "prescription.created", actor);
    revalidatePath("/prescriptions");
    revalidatePath(`/patients/${input.patient_id}`);
    return { ok: true, message: "Prescription created." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Prescription could not be created." };
  }
}

export async function createInvoiceAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await currentProfile();
    assertRole(actor, ["admin", "receptionist"]);
    const values = valuesFromForm(formData);
    const input = invoiceSchema.parse({
      ...values,
      items: JSON.parse(String(values.items ?? "[]")),
    });
    const supabase = createClient();
    const totals = calculateInvoiceTotals(
      input.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      input.tax_rate
    );
    const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true });
    const paidAmount = Math.min(input.paid_amount, totals.total);
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        clinic_id: actor.clinic_id,
        patient_id: input.patient_id,
        invoice_number: nextInvoiceNumber((count ?? 0) + 1),
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total: totals.total,
        paid_amount: paidAmount,
        status: getInvoiceStatus(totals.total, paidAmount),
        created_by: actor.id,
      })
      .select("id, invoice_number")
      .single();

    if (error) throw error;

    const { error: itemError } = await supabase.from("invoice_items").insert(
      input.items.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }))
    );
    if (itemError) throw itemError;

    if (paidAmount > 0) {
      await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: paidAmount,
        method: "upi",
        recorded_by: actor.id,
      });
    }

    await createActivity(`Created invoice ${invoice.invoice_number}`, "invoice.created", actor);
    revalidatePath("/billing");
    revalidatePath("/dashboard");
    return { ok: true, message: "Invoice created." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invoice could not be created." };
  }
}

export async function recordPaymentAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await currentProfile();
    assertRole(actor, ["admin", "receptionist"]);
    const input = paymentSchema.parse(valuesFromForm(formData));
    const supabase = createClient();
    const { error } = await supabase.from("payments").insert({
      invoice_id: input.invoice_id,
      amount: input.amount,
      method: input.method,
      recorded_by: actor.id,
    });
    if (error) throw error;
    await createActivity("Recorded invoice payment", "invoice.payment", actor);
    revalidatePath("/billing");
    revalidatePath("/dashboard");
    return { ok: true, message: "Payment recorded." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Payment could not be recorded." };
  }
}

export async function updateClinicSettingsAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await currentProfile();
    assertRole(actor, ["admin"]);
    const input = clinicSetupSchema.parse(valuesFromForm(formData));
    const supabase = createClient();
    const { error } = await supabase.from("clinics").update(input).eq("id", actor.clinic_id);
    if (error) throw error;
    revalidatePath("/settings");
    return { ok: true, message: "Clinic settings saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Settings could not be saved." };
  }
}

export async function createLabReportAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await currentProfile();
    assertRole(actor, ["admin", "doctor", "receptionist"]);
    const input = labReportSchema.parse(valuesFromForm(formData));
    const supabase = createClient();
    const { error } = await supabase.from("lab_reports").insert({
      patient_id: input.patient_id,
      title: input.title,
      file_url: input.file_url,
      uploaded_by: actor.id,
    });
    if (error) throw error;
    await createActivity(`Uploaded lab report ${input.title}`, "lab_report.created", actor);
    revalidatePath(`/patients/${input.patient_id}`);
    return { ok: true, message: "Lab report uploaded." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Lab report could not be saved." };
  }
}

export async function inviteStaffAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await currentProfile();
    assertRole(actor, ["admin"]);
    const input = staffSchema.parse(valuesFromForm(formData));
    const admin = createAdminClient();
    const { data: userData, error: authError } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.full_name },
    });
    if (authError) throw authError;
    const supabase = createClient();
    const { error } = await supabase.from("profiles").insert({
      user_id: userData.user.id,
      full_name: input.full_name,
      role: input.role,
      phone: input.phone || null,
      specialty: input.role === "doctor" ? input.specialty || "General Physician" : null,
      clinic_id: actor.clinic_id,
    });
    if (error) throw error;
    await createActivity(`Added ${input.full_name} as ${input.role}`, "staff.created", actor);
    revalidatePath("/doctors");
    revalidatePath("/staff");
    return { ok: true, message: "Staff account created." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Staff account could not be created." };
  }
}

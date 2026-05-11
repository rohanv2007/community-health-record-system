import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Phone number is too long");

const postgresUuidSchema = (message: string) =>
  z.string().regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    message
  );

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const clinicSetupSchema = z.object({
  name: z.string().trim().min(2, "Clinic name is required"),
  address: z.string().trim().min(5, "Address is required"),
  phone: phoneSchema,
  timezone: z.string().trim().min(2),
  tax_rate: z.coerce.number().min(0).max(30),
  default_fee: z.coerce.number().min(0),
  email_notifications: z.coerce.boolean().default(false),
  logo_url: z.string().url().optional().or(z.literal("")),
});

export const patientSchema = z.object({
  full_name: z.string().trim().min(2, "Patient name is required"),
  dob: z.string().date("Date of birth is required"),
  gender: z.enum(["female", "male", "other"]),
  phone: phoneSchema,
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().trim().optional(),
  blood_group: z.string().optional(),
  allergies: z.string().trim().optional(),
  emergency_contact: z.string().trim().optional(),
  photo_url: z.string().url().optional().or(z.literal("")),
});

export const appointmentSchema = z.object({
  patient_id: postgresUuidSchema("Select a patient"),
  doctor_id: postgresUuidSchema("Select a doctor"),
  scheduled_at: z.string().min(1, "Choose date and time"),
  duration_mins: z.coerce.number().int().min(10).max(240),
  reason: z.string().trim().min(3, "Reason is required"),
  notes: z.string().trim().optional(),
});

export const prescriptionItemSchema = z.object({
  medicine_name: z.string().trim().min(2, "Medicine name is required"),
  dosage: z.string().trim().min(1, "Dosage is required"),
  frequency: z.string().trim().min(1, "Frequency is required"),
  duration_days: z.coerce.number().int().min(1).max(365),
  instructions: z.string().trim().optional(),
});

export const prescriptionSchema = z.object({
  appointment_id: postgresUuidSchema("Select an appointment"),
  patient_id: postgresUuidSchema("Select a patient"),
  doctor_id: postgresUuidSchema("Select a doctor"),
  diagnosis: z.string().trim().min(2, "Diagnosis is required"),
  notes: z.string().trim().optional(),
  follow_up_date: z.string().date().optional().or(z.literal("")),
  items: z.array(prescriptionItemSchema).min(1, "Add at least one medicine"),
});

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(2, "Description is required"),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().min(0),
});

export const invoiceSchema = z.object({
  patient_id: postgresUuidSchema("Select a patient"),
  tax_rate: z.coerce.number().min(0).max(30),
  paid_amount: z.coerce.number().min(0).default(0),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});

export const paymentSchema = z.object({
  invoice_id: postgresUuidSchema("Select an invoice"),
  amount: z.coerce.number().positive("Payment amount is required"),
  method: z.enum(["cash", "card", "upi"]),
});

export const staffSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: phoneSchema.optional().or(z.literal("")),
  role: z.enum(["doctor", "receptionist"]),
  specialty: z.string().trim().optional(),
  password: z.string().min(8, "Temporary password must be at least 8 characters"),
});

export const labReportSchema = z.object({
  patient_id: postgresUuidSchema("Select a patient"),
  title: z.string().trim().min(2, "Report title is required"),
  file_url: z.string().trim().min(2, "Upload a report file"),
});

import "dotenv/config";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const clinicId = "11111111-1111-1111-1111-111111111111";
const password = "Demo@1234";

const users = [
  { email: "admin@healthpoint.com", full_name: "Ananya Rao", role: "admin", specialty: null, phone: "+91 90000 10001" },
  { email: "doctor@healthpoint.com", full_name: "Dr. Sarah Menon", role: "doctor", specialty: "Cardiologist", phone: "+91 90000 10002" },
  { email: "reception@healthpoint.com", full_name: "Kavya Nair", role: "receptionist", specialty: null, phone: "+91 90000 10003" },
] as const;

const patientNames = [
  ["Aarav Sharma", "1984-05-10", "male", "A+", "+91 90000 10001"],
  ["Meera Iyer", "1992-11-18", "female", "O+", "+91 90000 10002"],
  ["Rohan Gupta", "1971-03-04", "male", "B+", "+91 90000 10003"],
  ["Priya Nair", "2001-07-22", "female", "AB+", "+91 90000 10004"],
  ["Vikram Singh", "1965-09-13", "male", "O-", "+91 90000 10005"],
  ["Anika Das", "2012-01-29", "female", "A-", "+91 90000 10006"],
  ["Arjun Reddy", "1982-12-02", "male", "B-", "+91 90000 10007"],
  ["Sneha Kulkarni", "1999-06-17", "female", "O+", "+91 90000 10008"],
  ["Kabir Khan", "1970-04-11", "male", "AB-", "+91 90000 10009"],
  ["Ishita Bose", "1986-10-24", "female", "A+", "+91 90000 10010"],
  ["Dev Patel", "1994-08-08", "male", "B+", "+91 90000 10011"],
  ["Tara Menon", "2008-02-19", "female", "O+", "+91 90000 10012"],
  ["Nikhil Jain", "1978-05-27", "male", "A-", "+91 90000 10013"],
  ["Kavita Rao", "1968-12-30", "female", "B-", "+91 90000 10014"],
  ["Aditya Chatterjee", "1989-03-15", "male", "AB+", "+91 90000 10015"],
  ["Leela Krishnan", "1996-07-05", "female", "O-", "+91 90000 10016"],
  ["Manav Bhat", "2015-09-21", "male", "A+", "+91 90000 10017"],
  ["Pooja Sethi", "1981-11-09", "female", "B+", "+91 90000 10018"],
  ["Rahul Verma", "1975-01-03", "male", "O+", "+91 90000 10019"],
  ["Sahana Murthy", "2003-06-01", "female", "AB-", "+91 90000 10020"],
] as const;

function seedUuid(group: string, index: number) {
  return `${group}-${String(index).padStart(4, "0")}-4000-8000-${String(index).padStart(12, "0")}`;
}

async function ensureUser(email: string, fullName: string) {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = listed.users.find((user) => user.email === email);
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  await supabase.from("clinics").upsert({
    id: clinicId,
    name: "HealthPoint Clinic",
    address: "12 Lake Road, Mysuru, Karnataka",
    phone: "+91 821 555 0101",
    tax_rate: 5,
    default_fee: 500,
    timezone: "Asia/Kolkata",
    email_notifications: true,
  });

  const profileIds: Record<string, string> = {};
  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    const authUserId = await ensureUser(user.email, user.full_name);
    const profileId = seedUuid("10000000", index + 1);
    profileIds[user.role] = profileId;
    await supabase.from("profiles").upsert({
      id: profileId,
      user_id: authUserId,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      specialty: user.specialty,
      clinic_id: clinicId,
      active: true,
      availability: {},
    });
  }

  const patients = patientNames.map(([full_name, dob, gender, blood_group, phone], index) => ({
    id: seedUuid("20000000", index + 1),
    clinic_id: clinicId,
    patient_code: `HP-${String(index + 1).padStart(5, "0")}`,
    full_name,
    dob,
    gender,
    blood_group,
    phone,
    email: `${full_name.toLowerCase().replaceAll(" ", ".")}@example.com`,
    address: "Village main road",
    allergies: index % 4 === 0 ? "Penicillin" : "None",
    emergency_contact: "+91 98888 00000",
  }));
  await supabase.from("patients").upsert(patients);

  const now = new Date();
  const appointmentStatuses = ["completed", "scheduled", "cancelled"] as const;
  const appointments = Array.from({ length: 30 }, (_, index) => {
    const scheduled = new Date(now);
    scheduled.setDate(now.getDate() - 29 + index);
    scheduled.setHours(9 + (index % 8), 30, 0, 0);
    return {
      id: seedUuid("30000000", index + 1),
      clinic_id: clinicId,
      patient_id: patients[index % patients.length].id,
      doctor_id: profileIds.doctor,
      scheduled_at: scheduled.toISOString(),
      duration_mins: 30,
      reason: ["Routine check-up", "Blood pressure review", "Chest discomfort", "Follow-up consultation"][index % 4],
      status: appointmentStatuses[Math.floor(index / 10)],
      notes: index < 10 ? "Vitals reviewed. Patient stable." : null,
      created_by: profileIds.receptionist,
    };
  });
  await supabase.from("appointments").upsert(appointments);

  const prescriptions = appointments.slice(0, 15).map((appointment, index) => ({
    id: seedUuid("40000000", index + 1),
    appointment_id: appointment.id,
    patient_id: appointment.patient_id,
    doctor_id: profileIds.doctor,
    diagnosis: ["Hypertension", "Viral fever", "Gastritis", "Diabetes review"][index % 4],
    notes: "Continue medication and hydrate well.",
    follow_up_date: null,
  }));
  await supabase.from("prescriptions").upsert(prescriptions);
  await supabase.from("prescription_items").upsert(
    prescriptions.flatMap((prescription, index) => [
      {
        id: seedUuid("50000000", index * 2 + 1),
        prescription_id: prescription.id,
        medicine_name: "Paracetamol",
        dosage: "500 mg",
        frequency: "Twice daily",
        duration_days: 3,
        instructions: "After food",
      },
      {
        id: seedUuid("50000000", index * 2 + 2),
        prescription_id: prescription.id,
        medicine_name: "Pantoprazole",
        dosage: "40 mg",
        frequency: "Once daily",
        duration_days: 5,
        instructions: "Before breakfast",
      },
    ])
  );

  const invoices = patients.slice(0, 20).map((patient, index) => {
    const total = index % 3 === 0 ? 590 : index % 3 === 1 ? 885 : 1180;
    const paid = index % 4 === 0 ? 0 : index % 4 === 1 ? total / 2 : total;
    return {
      id: seedUuid("60000000", index + 1),
      clinic_id: clinicId,
      patient_id: patient.id,
      invoice_number: `HP-${new Date().getFullYear()}-${String(index + 1).padStart(5, "0")}`,
      subtotal: Math.round(total / 1.05),
      tax_amount: total - Math.round(total / 1.05),
      total,
      paid_amount: paid,
      status: paid === 0 ? "unpaid" : paid >= total ? "paid" : "partially_paid",
      created_by: profileIds.receptionist,
    };
  });
  await supabase.from("invoices").upsert(invoices);
  await supabase.from("invoice_items").upsert(
    invoices.map((invoice, index) => ({
      id: seedUuid("70000000", index + 1),
      invoice_id: invoice.id,
      description: "Consultation and services",
      quantity: 1,
      unit_price: invoice.subtotal,
      total: invoice.subtotal,
    }))
  );
  await supabase.from("payments").upsert(
    invoices
      .filter((invoice) => invoice.paid_amount > 0)
      .map((invoice, index) => ({
        id: seedUuid("80000000", index + 1),
        invoice_id: invoice.id,
        amount: invoice.paid_amount,
        method: index % 2 === 0 ? "upi" : "cash",
        recorded_by: profileIds.receptionist,
      }))
  );

  console.log("Seed complete: HealthPoint Clinic, demo users, patients, appointments, prescriptions, and invoices.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

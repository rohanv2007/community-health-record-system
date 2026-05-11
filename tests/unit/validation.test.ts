import {
  appointmentSchema,
  clinicSetupSchema,
  invoiceSchema,
  labReportSchema,
  patientSchema,
  paymentSchema,
  prescriptionSchema,
  resetPasswordSchema,
  staffSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts a complete patient registration", () => {
    expect(() =>
      patientSchema.parse({
        full_name: "Meera Iyer",
        dob: "1992-04-10",
        gender: "female",
        phone: "9876543210",
        email: "meera@example.com",
        blood_group: "O+",
        address: "Pune",
        allergies: "Penicillin",
        emergency_contact: "Ravi Iyer",
        photo_url: "https://example.com/photo.jpg",
      })
    ).not.toThrow();
  });

  it("rejects invalid patient data", () => {
    expect(() =>
      patientSchema.parse({
        full_name: "A",
        dob: "not-a-date",
        gender: "female",
        phone: "12",
      })
    ).toThrow();
  });

  it("validates clinic settings and reset email", () => {
    expect(clinicSetupSchema.parse({
      name: "HealthPoint Clinic",
      address: "MG Road, Bengaluru",
      phone: "9876543210",
      timezone: "Asia/Kolkata",
      tax_rate: "18",
      default_fee: "500",
      email_notifications: "true",
      logo_url: "",
    }).tax_rate).toBe(18);
    expect(resetPasswordSchema.parse({ email: "admin@healthpoint.com" }).email).toBe("admin@healthpoint.com");
  });

  it("validates appointments, prescriptions, invoices, payments, staff, and lab reports", () => {
    const patientId = "00000000-0000-4000-8000-000000000001";
    const doctorId = "00000000-0000-4000-8000-000000000002";
    const appointmentId = "00000000-0000-4000-8000-000000000003";
    const invoiceId = "00000000-0000-4000-8000-000000000004";

    expect(appointmentSchema.parse({
      patient_id: patientId,
      doctor_id: doctorId,
      scheduled_at: "2026-06-01T10:00",
      duration_mins: "30",
      reason: "Follow-up",
      notes: "",
    }).duration_mins).toBe(30);

    expect(() =>
      prescriptionSchema.parse({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        diagnosis: "Hypertension",
        follow_up_date: "",
        items: [
          {
            medicine_name: "Amlodipine",
            dosage: "5 mg",
            frequency: "Once daily",
            duration_days: "30",
          },
        ],
      })
    ).not.toThrow();

    expect(invoiceSchema.parse({
      patient_id: patientId,
      tax_rate: "5",
      paid_amount: "0",
      items: [{ description: "Consultation", quantity: "1", unit_price: "500" }],
    }).items[0].unit_price).toBe(500);

    expect(paymentSchema.parse({ invoice_id: invoiceId, amount: "250", method: "upi" }).method).toBe("upi");
    expect(staffSchema.parse({
      full_name: "Dr. Neha Sharma",
      email: "neha@example.com",
      phone: "",
      role: "doctor",
      specialty: "Pediatrics",
      password: "Demo@1234",
    }).role).toBe("doctor");
    expect(labReportSchema.parse({
      patient_id: patientId,
      title: "CBC",
      file_url: "clinic/lab-reports/cbc.pdf",
    }).title).toBe("CBC");
  });
});

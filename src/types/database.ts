export type AppRole = "admin" | "doctor" | "receptionist";
export type Gender = "female" | "male" | "other";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";
export type InvoiceStatus = "unpaid" | "partially_paid" | "paid";
export type PaymentMethod = "cash" | "card" | "upi";

export type Clinic = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  tax_rate: number;
  default_fee: number;
  timezone: string;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  role: AppRole;
  phone: string | null;
  avatar_url: string | null;
  clinic_id: string;
  specialty: string | null;
  active: boolean;
  availability: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Patient = {
  id: string;
  clinic_id: string;
  patient_code: string;
  full_name: string;
  dob: string;
  gender: Gender;
  blood_group: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  allergies: string | null;
  emergency_contact: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_mins: number;
  reason: string;
  status: AppointmentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  patients?: Pick<Patient, "id" | "full_name" | "patient_code" | "phone"> | null;
  doctor?: Pick<Profile, "id" | "full_name" | "specialty"> | null;
};

export type Prescription = {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
  prescription_items?: PrescriptionItem[];
};

export type PrescriptionItem = {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string | null;
};

export type Invoice = {
  id: string;
  clinic_id: string;
  patient_id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  status: InvoiceStatus;
  created_by: string | null;
  created_at: string;
  patients?: Pick<Patient, "id" | "full_name" | "patient_code" | "phone"> | null;
  invoice_items?: InvoiceItem[];
  payments?: Payment[];
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  recorded_by: string | null;
};

export type LabReport = {
  id: string;
  patient_id: string;
  title: string;
  file_url: string;
  uploaded_by: string | null;
  created_at: string;
};

export type ActivityEvent = {
  id: string;
  clinic_id: string;
  actor_id: string | null;
  event_type: string;
  description: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: Clinic;
        Insert: Partial<Clinic> & Pick<Clinic, "name">;
        Update: Partial<Clinic>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> &
          Pick<Profile, "user_id" | "full_name" | "role" | "clinic_id">;
        Update: Partial<Profile>;
      };
      patients: {
        Row: Patient;
        Insert: Partial<Patient> &
          Pick<Patient, "clinic_id" | "full_name" | "dob" | "gender" | "phone">;
        Update: Partial<Patient>;
      };
      appointments: {
        Row: Appointment;
        Insert: Partial<Appointment> &
          Pick<
            Appointment,
            "clinic_id" | "patient_id" | "doctor_id" | "scheduled_at" | "reason"
          >;
        Update: Partial<Appointment>;
      };
      prescriptions: {
        Row: Prescription;
        Insert: Partial<Prescription> &
          Pick<
            Prescription,
            "appointment_id" | "patient_id" | "doctor_id" | "diagnosis"
          >;
        Update: Partial<Prescription>;
      };
      prescription_items: {
        Row: PrescriptionItem;
        Insert: Partial<PrescriptionItem> &
          Pick<
            PrescriptionItem,
            | "prescription_id"
            | "medicine_name"
            | "dosage"
            | "frequency"
            | "duration_days"
          >;
        Update: Partial<PrescriptionItem>;
      };
      invoices: {
        Row: Invoice;
        Insert: Partial<Invoice> &
          Pick<
            Invoice,
            "clinic_id" | "patient_id" | "invoice_number" | "subtotal" | "tax_amount" | "total"
          >;
        Update: Partial<Invoice>;
      };
      invoice_items: {
        Row: InvoiceItem;
        Insert: Partial<InvoiceItem> &
          Pick<
            InvoiceItem,
            "invoice_id" | "description" | "quantity" | "unit_price" | "total"
          >;
        Update: Partial<InvoiceItem>;
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & Pick<Payment, "invoice_id" | "amount" | "method">;
        Update: Partial<Payment>;
      };
      lab_reports: {
        Row: LabReport;
        Insert: Partial<LabReport> & Pick<LabReport, "patient_id" | "title" | "file_url">;
        Update: Partial<LabReport>;
      };
      activity_events: {
        Row: ActivityEvent;
        Insert: Partial<ActivityEvent> &
          Pick<ActivityEvent, "clinic_id" | "event_type" | "description">;
        Update: Partial<ActivityEvent>;
      };
    };
  };
};

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatDate, formatDateTime, getAge } from "@/lib/date-utils";
import type {
  Appointment,
  Clinic,
  Invoice,
  Patient,
  Prescription,
  Profile,
} from "@/types/database";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
  },
  header: {
    borderBottom: "1px solid #0d9488",
    paddingBottom: 12,
    marginBottom: 18,
  },
  clinic: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
  },
  muted: {
    color: "#64748b",
    marginTop: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0d9488",
    marginBottom: 10,
  },
  section: {
    marginBottom: 16,
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cell: {
    width: "48%",
    border: "1px solid #e2e8f0",
    padding: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
  },
  table: {
    border: "1px solid #e2e8f0",
    borderBottom: 0,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
  },
  th: {
    backgroundColor: "#f8fafc",
    fontWeight: 700,
  },
  td: {
    padding: 7,
  },
  signature: {
    marginTop: 38,
    paddingTop: 10,
    borderTop: "1px solid #94a3b8",
    width: 180,
    alignSelf: "flex-end",
    textAlign: "center",
  },
});

function ClinicHeader({ clinic }: { clinic?: Clinic | null }) {
  return (
    <View style={styles.header}>
      <Text style={styles.clinic}>{clinic?.name ?? "HealthPoint Clinic"}</Text>
      <Text style={styles.muted}>{clinic?.address ?? "Community Health Record System"}</Text>
      {clinic?.phone ? <Text style={styles.muted}>Phone: {clinic.phone}</Text> : null}
    </View>
  );
}

function Fact({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "Not recorded"}</Text>
    </View>
  );
}

export function PatientSummaryDocument({
  clinic,
  patient,
  appointments,
  prescriptions,
  invoices,
}: {
  clinic?: Clinic | null;
  patient: Patient;
  appointments: Appointment[];
  prescriptions: Prescription[];
  invoices: Invoice[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ClinicHeader clinic={clinic} />
        <Text style={styles.title}>Patient Summary</Text>
        <View style={styles.section}>
          <View style={styles.grid}>
            <Fact label="Patient ID" value={patient.patient_code} />
            <Fact label="Name" value={patient.full_name} />
            <Fact label="Age" value={`${getAge(patient.dob)} years`} />
            <Fact label="DOB" value={formatDate(patient.dob)} />
            <Fact label="Gender" value={patient.gender} />
            <Fact label="Blood group" value={patient.blood_group} />
            <Fact label="Phone" value={patient.phone} />
            <Fact label="Email" value={patient.email} />
            <Fact label="Emergency contact" value={patient.emergency_contact} />
            <Fact label="Allergies" value={patient.allergies || "None"} />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.title}>Clinical Snapshot</Text>
          <Text>Visits: {appointments.length}</Text>
          <Text>Prescriptions: {prescriptions.length}</Text>
          <Text>Invoices: {invoices.length}</Text>
        </View>
        <Text style={styles.muted}>Generated on {formatDateTime(new Date().toISOString())}</Text>
      </Page>
    </Document>
  );
}

export function PrescriptionDocument({
  clinic,
  prescription,
  patient,
  doctor,
}: {
  clinic?: Clinic | null;
  prescription: Prescription;
  patient?: Patient;
  doctor?: Profile;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ClinicHeader clinic={clinic} />
        <Text style={styles.title}>Prescription</Text>
        <View style={styles.section}>
          <View style={styles.grid}>
            <Fact label="Patient" value={patient?.full_name} />
            <Fact label="Patient ID" value={patient?.patient_code} />
            <Fact label="Doctor" value={doctor?.full_name} />
            <Fact label="Specialty" value={doctor?.specialty} />
            <Fact label="Diagnosis" value={prescription.diagnosis} />
            <Fact label="Follow up" value={prescription.follow_up_date ? formatDate(prescription.follow_up_date) : null} />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.title}>Medicines</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.th]}>
              <Text style={[styles.td, { width: "30%" }]}>Medicine</Text>
              <Text style={[styles.td, { width: "18%" }]}>Dosage</Text>
              <Text style={[styles.td, { width: "22%" }]}>Frequency</Text>
              <Text style={[styles.td, { width: "12%" }]}>Days</Text>
              <Text style={[styles.td, { width: "18%" }]}>Instructions</Text>
            </View>
            {(prescription.prescription_items ?? []).map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={[styles.td, { width: "30%" }]}>{item.medicine_name}</Text>
                <Text style={[styles.td, { width: "18%" }]}>{item.dosage}</Text>
                <Text style={[styles.td, { width: "22%" }]}>{item.frequency}</Text>
                <Text style={[styles.td, { width: "12%" }]}>{item.duration_days}</Text>
                <Text style={[styles.td, { width: "18%" }]}>{item.instructions ?? "-"}</Text>
              </View>
            ))}
          </View>
        </View>
        {prescription.notes ? <Text>Notes: {prescription.notes}</Text> : null}
        <Text style={styles.signature}>Doctor signature</Text>
      </Page>
    </Document>
  );
}

export function InvoiceDocument({
  clinic,
  invoice,
}: {
  clinic?: Clinic | null;
  invoice: Invoice;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ClinicHeader clinic={clinic} />
        <Text style={styles.title}>Invoice {invoice.invoice_number}</Text>
        <View style={styles.section}>
          <View style={styles.grid}>
            <Fact label="Patient" value={invoice.patients?.full_name} />
            <Fact label="Patient ID" value={invoice.patients?.patient_code} />
            <Fact label="Phone" value={invoice.patients?.phone} />
            <Fact label="Created" value={formatDate(invoice.created_at)} />
            <Fact label="Status" value={invoice.status.replace("_", " ")} />
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={[styles.row, styles.th]}>
              <Text style={[styles.td, { width: "46%" }]}>Description</Text>
              <Text style={[styles.td, { width: "18%" }]}>Qty</Text>
              <Text style={[styles.td, { width: "18%" }]}>Rate</Text>
              <Text style={[styles.td, { width: "18%" }]}>Total</Text>
            </View>
            {(invoice.invoice_items ?? []).map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={[styles.td, { width: "46%" }]}>{item.description}</Text>
                <Text style={[styles.td, { width: "18%" }]}>{item.quantity}</Text>
                <Text style={[styles.td, { width: "18%" }]}>Rs. {Number(item.unit_price).toFixed(2)}</Text>
                <Text style={[styles.td, { width: "18%" }]}>Rs. {Number(item.total).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ alignSelf: "flex-end", width: 220 }}>
          <Fact label="Subtotal" value={`Rs. ${Number(invoice.subtotal).toFixed(2)}`} />
          <Fact label="Tax" value={`Rs. ${Number(invoice.tax_amount).toFixed(2)}`} />
          <Fact label="Total" value={`Rs. ${Number(invoice.total).toFixed(2)}`} />
          <Fact label="Paid" value={`Rs. ${Number(invoice.paid_amount).toFixed(2)}`} />
        </View>
      </Page>
    </Document>
  );
}

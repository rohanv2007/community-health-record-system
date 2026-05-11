"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InvoiceDocument,
  PatientSummaryDocument,
  PrescriptionDocument,
} from "@/components/pdf/documents";
import type {
  Appointment,
  Clinic,
  Invoice,
  Patient,
  Prescription,
  Profile,
} from "@/types/database";

type PDFDownloadBaseProps = {
  fileName: string;
  label: string;
  icon?: "download" | "printer";
};

export type PDFDownloadButtonProps =
  | (PDFDownloadBaseProps & {
      kind: "patient-summary";
      clinic?: Clinic | null;
      patient: Patient;
      appointments: Appointment[];
      prescriptions: Prescription[];
      invoices: Invoice[];
    })
  | (PDFDownloadBaseProps & {
      kind: "prescription";
      clinic?: Clinic | null;
      prescription: Prescription;
      patient?: Patient;
      doctor?: Profile;
    })
  | (PDFDownloadBaseProps & {
      kind: "invoice";
      clinic?: Clinic | null;
      invoice: Invoice;
    });

export function PDFDownloadButton(props: PDFDownloadButtonProps) {
  const { fileName, label, icon = "download" } = props;
  const Icon = icon === "printer" ? Printer : Download;
  const document =
    props.kind === "patient-summary" ? (
      <PatientSummaryDocument
        clinic={props.clinic}
        patient={props.patient}
        appointments={props.appointments}
        prescriptions={props.prescriptions}
        invoices={props.invoices}
      />
    ) : props.kind === "prescription" ? (
      <PrescriptionDocument
        clinic={props.clinic}
        prescription={props.prescription}
        patient={props.patient}
        doctor={props.doctor}
      />
    ) : (
      <InvoiceDocument clinic={props.clinic} invoice={props.invoice} />
    );

  return (
    <PDFDownloadLink document={document} fileName={fileName}>
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading}>
          <Icon className="mr-2 size-4" />
          {loading ? "Preparing" : label}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

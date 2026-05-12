"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Banknote,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  Download,
  FilePlus2,
  MoreHorizontal,
  Plus,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAppointmentAction,
  createInvoiceAction,
  createLabReportAction,
  createPatientAction,
  createPrescriptionAction,
  inviteStaffAction,
  recordPaymentAction,
  updateAppointmentStatusAction,
  updateClinicSettingsAction,
  updatePatientAction,
} from "@/app/actions";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StorageUploadField } from "@/components/app/storage-upload-field";
import type {
  DashboardChartsProps,
  RevenueChartProps,
} from "@/components/app/dashboard-charts";
import type { PDFDownloadButtonProps } from "@/components/pdf/pdf-download-button";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { bloodGroups } from "@/lib/constants";
import { formatDate, formatDateTime, getAge, lastNDays, nextNDays } from "@/lib/date-utils";
import { calculateInvoiceTotals } from "@/lib/invoice-utils";
import { cn } from "@/lib/utils";
import type {
  ActivityEvent,
  Appointment,
  AppRole,
  Clinic,
  Invoice,
  Patient,
  Prescription,
  Profile,
} from "@/types/database";

type ModuleData = {
  clinic: Clinic | null;
  profile: { id: string; role: AppRole; full_name: string };
  patients: Patient[];
  doctors: Profile[];
  staff: Profile[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  invoices: Invoice[];
  labReports: import("@/types/database").LabReport[];
  activity: ActivityEvent[];
};

const statusStyles = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200",
  cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  unpaid: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200",
  partially_paid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200",
};

const ClientPDFDownloadButton = dynamic<PDFDownloadButtonProps>(
  () => import("@/components/pdf/pdf-download-button").then((mod) => mod.PDFDownloadButton),
  {
    ssr: false,
    loading: () => <Button variant="outline" size="sm" disabled>Preparing</Button>,
  }
);

const DashboardCharts = dynamic<DashboardChartsProps>(
  () => import("@/components/app/dashboard-charts").then((mod) => mod.DashboardCharts),
  {
    ssr: false,
    loading: () => <ChartSkeleton columns="xl:grid-cols-[1.5fr_0.8fr]" heights={["h-80", "h-80"]} />,
  }
);

const RevenueChart = dynamic<RevenueChartProps>(
  () => import("@/components/app/dashboard-charts").then((mod) => mod.RevenueChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton columns="grid-cols-1" heights={["h-96"]} />,
  }
);

function ChartSkeleton({ columns, heights }: { columns: string; heights: string[] }) {
  return (
    <div className={cn("mt-6 grid gap-4", columns)}>
      {heights.map((height, index) => (
        <Card key={`${height}-${index}`}>
          <CardHeader>
            <div className="h-5 w-44 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className={cn("animate-pulse rounded-md bg-muted", height)} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ value }: { value: keyof typeof statusStyles | string }) {
  return (
    <Badge className={statusStyles[value as keyof typeof statusStyles] ?? "bg-muted text-foreground"}>
      {value.replace("_", " ")}
    </Badge>
  );
}

function useActionSubmit() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(
    event: React.FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<{ ok: boolean; message: string }>,
    onSuccess?: () => void,
    extra?: (formData: FormData) => void
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    extra?.(formData);
    startTransition(() => {
      void action(formData)
        .then((result) => {
          toast[result.ok ? "success" : "error"](result.message);
          if (result.ok) {
            form.reset();
            onSuccess?.();
            router.refresh();
          }
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Something went wrong.");
        });
    });
  }

  return { isPending, submit };
}

export function DashboardModule(data: ModuleData) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysAppointments = data.appointments.filter((item) => item.scheduled_at.startsWith(today));
  const pendingBills = data.invoices.filter((invoice) => invoice.status !== "paid");
  const chartDays = lastNDays(14).map((day) => ({
    day: day.label,
    appointments: data.appointments.filter((appointment) =>
      appointment.scheduled_at.startsWith(day.iso)
    ).length,
  }));
  const ageBuckets = [
    { name: "0-18", value: data.patients.filter((patient) => getAge(patient.dob) <= 18).length },
    {
      name: "19-40",
      value: data.patients.filter((patient) => getAge(patient.dob) > 18 && getAge(patient.dob) <= 40).length,
    },
    {
      name: "41-60",
      value: data.patients.filter((patient) => getAge(patient.dob) > 40 && getAge(patient.dob) <= 60).length,
    },
    { name: "60+", value: data.patients.filter((patient) => getAge(patient.dob) > 60).length },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Dashboard"
        description="A live view of clinical flow, billing pressure, and recent activity."
        actions={
          <>
            <Button asChild><Link href="/patients"><UserPlus className="mr-2 size-4" />New Patient</Link></Button>
            <Button asChild variant="outline"><Link href="/appointments"><CalendarDays className="mr-2 size-4" />New Appointment</Link></Button>
            {data.profile.role !== "doctor" && (
              <Button asChild variant="outline"><Link href="/billing"><FilePlus2 className="mr-2 size-4" />New Invoice</Link></Button>
            )}
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Patients" value={data.patients.length} icon={Users} />
        <StatCard label="Today's Appointments" value={todaysAppointments.length} icon={CalendarCheck} tone="blue" />
        <StatCard label="Pending Bills" value={pendingBills.length} icon={Banknote} tone="amber" />
        <StatCard label="Active Doctors" value={data.doctors.length} icon={Stethoscope} tone="green" />
      </div>
      <DashboardCharts appointmentDays={chartDays} ageBuckets={ageBuckets} />
      <Card className="mt-6">
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {data.activity.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="mt-1 size-2 rounded-full bg-teal" />
              <div>
                <p className="text-sm font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

export function PatientsModule(data: ModuleData) {
  const [open, setOpen] = useState(false);
  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: "patient_code",
        header: "Patient ID",
        cell: ({ row }) => <span className="font-medium">{row.original.patient_code}</span>,
      },
      {
        accessorKey: "full_name",
        header: "Name",
        cell: ({ row }) => <Link className="font-medium text-teal hover:underline" href={`/patients/${row.original.id}`}>{row.original.full_name}</Link>,
      },
      { header: "Age", cell: ({ row }) => getAge(row.original.dob) },
      { accessorKey: "gender", header: "Gender" },
      { accessorKey: "blood_group", header: "Blood" },
      { accessorKey: "phone", header: "Phone" },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Actions for ${row.original.full_name}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href={`/patients/${row.original.id}`}>Open profile</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Patients"
        description="Search, register, and review patient records across the clinic."
        actions={data.profile.role !== "doctor" && <Button onClick={() => setOpen(true)}><UserPlus className="mr-2 size-4" />New patient</Button>}
      />
      <PatientSheet open={open} setOpen={setOpen} clinicId={data.clinic?.id} />
      <DataTable columns={columns} data={data.patients} searchPlaceholder="Search by name, ID, phone, blood group..." />
    </>
  );
}

function PatientSheet({ open, setOpen, clinicId }: { open: boolean; setOpen: (value: boolean) => void; clinicId?: string }) {
  const { isPending, submit } = useActionSubmit();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Register patient</SheetTitle>
          <SheetDescription>Capture demographic, medical, and emergency contact details.</SheetDescription>
        </SheetHeader>
        <form className="grid gap-4 px-4 pb-6" onSubmit={(event) => submit(event, createPatientAction, () => setOpen(false))}>
          <Field name="full_name" label="Full name" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="dob" label="Date of birth" type="date" required />
            <SelectField name="gender" label="Gender" options={["female", "male", "other"]} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="phone" label="Phone" required />
            <Field name="email" label="Email" type="email" />
          </div>
          <SelectField name="blood_group" label="Blood group" options={bloodGroups} />
          <Field name="address" label="Address" />
          <Field name="allergies" label="Allergies" />
          <Field name="emergency_contact" label="Emergency contact" />
          <StorageUploadField
            bucket="clinic-assets"
            clinicId={clinicId}
            name="photo_url"
            label="Profile photo"
            folder="patient-photos"
            accept="image/png,image/jpeg,image/webp"
            publicUrl
          />
          <Button disabled={isPending}>{isPending ? "Saving..." : "Register patient"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function PatientDetailModule({
  patient,
  data,
}: {
  patient: Patient;
  data: ModuleData;
}) {
  const visits = data.appointments.filter((item) => item.patient_id === patient.id);
  const prescriptions = data.prescriptions.filter((item) => item.patient_id === patient.id);
  const invoices = data.invoices.filter((item) => item.patient_id === patient.id);
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow={patient.patient_code}
        title={patient.full_name}
        description={`${getAge(patient.dob)} years • ${patient.gender} • ${patient.phone}`}
        actions={
          <>
            {data.profile.role !== "doctor" ? <Button variant="outline" onClick={() => setEditOpen(true)}>Edit patient</Button> : null}
            <PDFButton
              kind="patient-summary"
              clinic={data.clinic}
              patient={patient}
              appointments={visits}
              prescriptions={prescriptions}
              invoices={invoices}
              fileName={`${patient.patient_code}-summary.pdf`}
              label="Print summary"
              icon="printer"
            />
          </>
        }
      />
      <EditPatientSheet
        open={editOpen}
        setOpen={setEditOpen}
        patient={patient}
        clinicId={data.clinic?.id}
      />
      <LabReportSheet
        open={reportOpen}
        setOpen={setReportOpen}
        patient={patient}
        clinicId={data.clinic?.id}
      />
      <Tabs defaultValue="info">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="info">Personal info</TabsTrigger>
          <TabsTrigger value="visits">Visit history</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="reports">Lab reports</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card><CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <Info label="DOB" value={formatDate(patient.dob)} />
            <Info label="Blood group" value={patient.blood_group ?? "Not recorded"} />
            <Info label="Email" value={patient.email ?? "Not recorded"} />
            <Info label="Emergency contact" value={patient.emergency_contact ?? "Not recorded"} />
            <Info label="Address" value={patient.address ?? "Not recorded"} />
            <Info label="Allergies" value={patient.allergies ?? "None"} />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="visits"><RecordList items={visits.map((visit) => ({ title: visit.reason, meta: `${formatDateTime(visit.scheduled_at)} • ${visit.status}`, body: visit.notes }))} /></TabsContent>
        <TabsContent value="prescriptions"><RecordList items={prescriptions.map((item) => ({ title: item.diagnosis, meta: formatDateTime(item.created_at), body: item.notes }))} /></TabsContent>
        <TabsContent value="reports">
          <div className="mb-3 flex justify-end">
            <Button onClick={() => setReportOpen(true)} variant="outline"><FilePlus2 className="mr-2 size-4" />Upload report</Button>
          </div>
          <RecordList items={data.labReports.map((item) => ({ title: item.title, meta: formatDateTime(item.created_at), body: item.file_url }))} />
        </TabsContent>
        <TabsContent value="billing"><RecordList items={invoices.map((invoice) => ({ title: invoice.invoice_number, meta: `${invoice.status} • ₹${invoice.total}`, body: `Paid ₹${invoice.paid_amount}` }))} /></TabsContent>
      </Tabs>
    </>
  );
}

function EditPatientSheet({
  open,
  setOpen,
  patient,
  clinicId,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  patient: Patient;
  clinicId?: string;
}) {
  const { isPending, submit } = useActionSubmit();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit patient</SheetTitle>
          <SheetDescription>Update demographic and clinical registration details.</SheetDescription>
        </SheetHeader>
        <form
          className="grid gap-4 px-4 pb-6"
          onSubmit={(event) => submit(event, (formData) => updatePatientAction(patient.id, formData), () => setOpen(false))}
        >
          <Field name="full_name" label="Full name" defaultValue={patient.full_name} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="dob" label="Date of birth" type="date" defaultValue={patient.dob} required />
            <SelectField name="gender" label="Gender" options={["female", "male", "other"]} defaultValue={patient.gender} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="phone" label="Phone" defaultValue={patient.phone} required />
            <Field name="email" label="Email" type="email" defaultValue={patient.email ?? ""} />
          </div>
          <SelectField name="blood_group" label="Blood group" options={bloodGroups} defaultValue={patient.blood_group ?? ""} />
          <Field name="address" label="Address" defaultValue={patient.address ?? ""} />
          <Field name="allergies" label="Allergies" defaultValue={patient.allergies ?? ""} />
          <Field name="emergency_contact" label="Emergency contact" defaultValue={patient.emergency_contact ?? ""} />
          <StorageUploadField
            bucket="clinic-assets"
            clinicId={clinicId}
            name="photo_url"
            label="Profile photo"
            folder="patient-photos"
            accept="image/png,image/jpeg,image/webp"
            defaultValue={patient.photo_url}
            publicUrl
          />
          <Button disabled={isPending}>{isPending ? "Saving..." : "Save changes"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function LabReportSheet({
  open,
  setOpen,
  patient,
  clinicId,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  patient: Patient;
  clinicId?: string;
}) {
  const { isPending, submit } = useActionSubmit();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Upload lab report</SheetTitle>
          <SheetDescription>Attach PDFs or clinical images to {patient.full_name}&apos;s record.</SheetDescription>
        </SheetHeader>
        <form className="grid gap-4 px-4 pb-6" onSubmit={(event) => submit(event, createLabReportAction, () => setOpen(false))}>
          <input type="hidden" name="patient_id" value={patient.id} />
          <Field name="title" label="Report title" required />
          <StorageUploadField
            bucket="lab-reports"
            clinicId={clinicId}
            name="file_url"
            label="Report file"
            folder={`lab-reports/${patient.id}`}
            accept="image/png,image/jpeg,image/webp,application/pdf"
          />
          <Button disabled={isPending}>{isPending ? "Saving..." : "Save report"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function PDFButton(props: PDFDownloadButtonProps) {
  return <ClientPDFDownloadButton {...props} />;
}

export function AppointmentsModule(data: ModuleData) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      { header: "Patient", cell: ({ row }) => row.original.patients?.full_name ?? "Unknown" },
      { header: "Doctor", cell: ({ row }) => row.original.doctor?.full_name ?? "Doctor" },
      { header: "When", cell: ({ row }) => formatDateTime(row.original.scheduled_at) },
      { accessorKey: "reason", header: "Reason" },
      { header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isPending || row.original.status === "completed"}
              aria-label={`Complete ${row.original.reason}`}
              onClick={() =>
                startTransition(() => {
                  void updateAppointmentStatusAction(
                    row.original.id,
                    "completed",
                    row.original.notes ?? ""
                  ).then((result) => {
                    toast[result.ok ? "success" : "error"](result.message);
                    if (result.ok) router.refresh();
                  });
                })
              }
            >
              Complete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending || row.original.status === "cancelled"}
              aria-label={`Cancel ${row.original.reason}`}
              onClick={() =>
                startTransition(() => {
                  void updateAppointmentStatusAction(row.original.id, "cancelled").then((result) => {
                    toast[result.ok ? "success" : "error"](result.message);
                    if (result.ok) router.refresh();
                  });
                })
              }
            >
              Cancel
            </Button>
          </div>
        ),
      },
    ],
    [isPending, router]
  );

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Appointments"
        description="Book visits, prevent double-booking, and update appointment outcomes."
        actions={
          <>
            <Button variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}>Calendar</Button>
            <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>List</Button>
            <Button onClick={() => setOpen(true)}><Plus className="mr-2 size-4" />Book appointment</Button>
          </>
        }
      />
      <AppointmentSheet open={open} setOpen={setOpen} patients={data.patients} doctors={data.doctors} />
      {view === "list" ? <DataTable columns={columns} data={data.appointments} /> : <CalendarGrid appointments={data.appointments} />}
    </>
  );
}

function AppointmentSheet({ open, setOpen, patients, doctors }: { open: boolean; setOpen: (value: boolean) => void; patients: Patient[]; doctors: Profile[] }) {
  const { isPending, submit } = useActionSubmit();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>Book appointment</SheetTitle><SheetDescription>Doctor availability and overlap checks are enforced in the database.</SheetDescription></SheetHeader>
        <form className="grid gap-4 px-4 pb-6" onSubmit={(event) => submit(event, createAppointmentAction, () => setOpen(false))}>
          <SelectField name="patient_id" label="Patient" options={patients.map((p) => ({ label: `${p.full_name} (${p.patient_code})`, value: p.id }))} />
          <SelectField name="doctor_id" label="Doctor" options={doctors.map((d) => ({ label: `${d.full_name}${d.specialty ? ` • ${d.specialty}` : ""}`, value: d.id }))} />
          <Field name="scheduled_at" label="Date and time" type="datetime-local" required />
          <Field name="duration_mins" label="Duration (mins)" type="number" defaultValue="30" required />
          <Field name="reason" label="Reason" required />
          <Textarea name="notes" placeholder="Notes" />
          <Button disabled={isPending}>{isPending ? "Booking..." : "Book appointment"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CalendarGrid({ appointments }: { appointments: Appointment[] }) {
  const days = nextNDays(30);
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {days.map((day) => {
        const daily = appointments.filter((appointment) => appointment.scheduled_at.startsWith(day.iso));
        return (
          <Card key={day.iso} className="min-h-36">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">{day.label}</CardTitle></CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {daily.length ? daily.map((appointment) => (
                <div key={appointment.id} className="rounded-md border p-2 text-xs">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium">{appointment.patients?.full_name ?? "Patient"}</span>
                    <StatusBadge value={appointment.status} />
                  </div>
                  <p className="font-medium">{appointment.reason}</p>
                  <p className="text-muted-foreground">{formatDateTime(appointment.scheduled_at)}</p>
                </div>
              )) : <p className="text-xs text-muted-foreground">No bookings</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function PrescriptionsModule(data: ModuleData) {
  const [open, setOpen] = useState(false);
  const completed = data.appointments.filter((item) => item.status === "completed");
  return (
    <>
      <PageHeader eyebrow="Clinical" title="Prescriptions" description="Create prescription PDFs linked to completed appointments." actions={<Button onClick={() => setOpen(true)}><ClipboardPlus className="mr-2 size-4" />New prescription</Button>} />
      <PrescriptionSheet open={open} setOpen={setOpen} appointments={completed} doctors={data.doctors} patients={data.patients} />
      <Card>
        <CardContent className="divide-y p-0">
          {data.prescriptions.length ? data.prescriptions.map((item) => {
            const patient = data.patients.find((p) => p.id === item.patient_id);
            const doctor = data.doctors.find((d) => d.id === item.doctor_id);
            return (
              <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{item.diagnosis}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)} - {item.prescription_items?.length ?? 0} medicines</p>
                </div>
                <PDFButton
                  kind="prescription"
                  clinic={data.clinic}
                  prescription={item}
                  patient={patient}
                  doctor={doctor}
                  fileName={`prescription-${item.id}.pdf`}
                  label="Download"
                />
              </div>
            );
          }) : <p className="p-6 text-sm text-muted-foreground">No records yet.</p>}
        </CardContent>
      </Card>
    </>
  );
}

function PrescriptionSheet({ open, setOpen, appointments, doctors, patients }: { open: boolean; setOpen: (value: boolean) => void; appointments: Appointment[]; doctors: Profile[]; patients: Patient[] }) {
  const { isPending, submit } = useActionSubmit();
  const [items, setItems] = useState([{ medicine_name: "Amlodipine", dosage: "5 mg", frequency: "Once daily", duration_days: 30, instructions: "After breakfast" }]);
  const [appointmentId, setAppointmentId] = useState("");
  const appointment = appointments.find((item) => item.id === appointmentId);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto sm:max-w-2xl">
        <SheetHeader><SheetTitle>Create prescription</SheetTitle><SheetDescription>Medicines, diagnosis, notes, and follow-up date.</SheetDescription></SheetHeader>
        <form
          className="grid gap-4 px-4 pb-6"
          onSubmit={(event) => submit(event, createPrescriptionAction, () => setOpen(false), (fd) => fd.set("items", JSON.stringify(items)))}
        >
          <SelectField name="appointment_id" label="Completed appointment" value={appointmentId} onChange={setAppointmentId} options={appointments.map((a) => ({ label: `${a.patients?.full_name ?? "Patient"} - ${a.reason} - ${formatDateTime(a.scheduled_at)}`, value: a.id }))} />
          <input type="hidden" name="patient_id" value={appointment?.patient_id ?? ""} />
          <SelectField name="doctor_id" label="Doctor" options={doctors.map((d) => ({ label: d.full_name, value: d.id }))} defaultValue={appointment?.doctor_id} />
          <Field name="diagnosis" label="Diagnosis" required />
          <Field name="follow_up_date" label="Follow-up date" type="date" />
          <Textarea name="notes" placeholder="Doctor notes" />
          <div className="space-y-3">
            <div className="flex items-center justify-between"><Label>Medicines</Label><Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { medicine_name: "", dosage: "", frequency: "", duration_days: 7, instructions: "" }])}>Add</Button></div>
            {items.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3 md:grid-cols-5">
                {(["medicine_name", "dosage", "frequency", "duration_days", "instructions"] as const).map((key) => (
                  <Input key={key} value={String(item[key] ?? "")} placeholder={key.replace("_", " ")} onChange={(event) => setItems(items.map((row, i) => i === index ? { ...row, [key]: key === "duration_days" ? Number(event.target.value) : event.target.value } : row))} />
                ))}
              </div>
            ))}
          </div>
          <Button disabled={isPending || !patients.length}>{isPending ? "Creating..." : "Create prescription"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function BillingModule(data: ModuleData) {
  const [open, setOpen] = useState(false);
  const paid = data.invoices.reduce((sum, invoice) => sum + Number(invoice.paid_amount), 0);
  const pending = data.invoices.reduce((sum, invoice) => sum + Number(invoice.total) - Number(invoice.paid_amount), 0);
  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      { accessorKey: "invoice_number", header: "Invoice" },
      { header: "Patient", cell: ({ row }) => row.original.patients?.full_name ?? "Unknown" },
      { header: "Total", cell: ({ row }) => `₹${Number(row.original.total).toLocaleString()}` },
      { header: "Paid", cell: ({ row }) => `₹${Number(row.original.paid_amount).toLocaleString()}` },
      { header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
      { header: "Created", cell: ({ row }) => formatDate(row.original.created_at) },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <PDFButton
              kind="invoice"
              clinic={data.clinic}
              invoice={row.original}
              fileName={`${row.original.invoice_number}.pdf`}
              label="PDF"
            />
            <PaymentButton invoice={row.original} />
          </div>
        ),
      },
    ],
    [data.clinic]
  );
  return (
    <>
      <PageHeader eyebrow="Finance" title="Billing & invoices" description="Create invoices, track partial payments, and export professional bills." actions={<Button onClick={() => setOpen(true)}><FilePlus2 className="mr-2 size-4" />New invoice</Button>} />
      <InvoiceSheet open={open} setOpen={setOpen} patients={data.patients} clinic={data.clinic} />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <StatCard label="Revenue collected" value={Math.round(paid)} icon={CheckCircle2} tone="green" suffix="" />
        <StatCard label="Pending amount" value={Math.round(pending)} icon={Banknote} tone="amber" suffix="" />
      </div>
      <DataTable columns={columns} data={data.invoices} searchPlaceholder="Search invoice or patient..." />
    </>
  );
}

function InvoiceSheet({ open, setOpen, patients, clinic }: { open: boolean; setOpen: (value: boolean) => void; patients: Patient[]; clinic: Clinic | null }) {
  const { isPending, submit } = useActionSubmit();
  const [items, setItems] = useState([{ description: "Consultation fee", quantity: 1, unit_price: Number(clinic?.default_fee ?? 500) }]);
  const [taxRate, setTaxRate] = useState(Number(clinic?.tax_rate ?? 0));
  const totals = calculateInvoiceTotals(items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unit_price })), taxRate);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto sm:max-w-2xl">
        <SheetHeader><SheetTitle>Create invoice</SheetTitle><SheetDescription>Line items, tax, and initial payment.</SheetDescription></SheetHeader>
        <form className="grid gap-4 px-4 pb-6" onSubmit={(event) => submit(event, createInvoiceAction, () => setOpen(false), (fd) => fd.set("items", JSON.stringify(items)))}>
          <SelectField name="patient_id" label="Patient" options={patients.map((p) => ({ label: `${p.full_name} (${p.patient_code})`, value: p.id }))} />
          <Field name="tax_rate" label="Tax rate %" type="number" value={String(taxRate)} onChange={(event) => setTaxRate(Number(event.target.value) || 0)} />
          <div className="space-y-3">
            <div className="flex items-center justify-between"><Label>Line items</Label><Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { description: "", quantity: 1, unit_price: 0 }])}>Add</Button></div>
            {items.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_90px_120px]">
                <Input aria-label={`Line item ${index + 1} description`} value={item.description} placeholder="Description" onChange={(event) => setItems(items.map((row, i) => i === index ? { ...row, description: event.target.value } : row))} />
                <Input aria-label={`Line item ${index + 1} quantity`} value={item.quantity} type="number" min="1" onChange={(event) => setItems(items.map((row, i) => i === index ? { ...row, quantity: Number(event.target.value) } : row))} />
                <Input aria-label={`Line item ${index + 1} unit price`} value={item.unit_price} type="number" min="0" onChange={(event) => setItems(items.map((row, i) => i === index ? { ...row, unit_price: Number(event.target.value) } : row))} />
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm">Subtotal ₹{totals.subtotal} • Tax ₹{totals.taxAmount} • Total ₹{totals.total}</div>
          <Field name="paid_amount" label="Initial payment" type="number" defaultValue="0" />
          <Button disabled={isPending}>{isPending ? "Creating..." : "Create invoice"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function PaymentButton({ invoice }: { invoice: Invoice }) {
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useActionSubmit();
  const due = Math.max(Number(invoice.total) - Number(invoice.paid_amount), 0);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" disabled={due <= 0} onClick={() => setOpen(true)}>Record</Button>
      <SheetContent>
        <SheetHeader><SheetTitle>Record payment</SheetTitle><SheetDescription>{invoice.invoice_number} has ₹{due} due.</SheetDescription></SheetHeader>
        <form className="grid gap-4 px-4" onSubmit={(event) => submit(event, recordPaymentAction, () => setOpen(false))}>
          <input type="hidden" name="invoice_id" value={invoice.id} />
          <Field name="amount" label="Amount" type="number" defaultValue={String(due)} />
          <SelectField name="method" label="Method" options={["cash", "card", "upi"]} defaultValue="upi" />
          <Button disabled={isPending}>{isPending ? "Recording..." : "Record payment"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function DoctorsModule(data: ModuleData) {
  return <StaffDirectory title="Doctors" description="Manage clinical providers, specialties, and availability." rows={data.doctors} role="doctor" />;
}

export function StaffModule(data: ModuleData) {
  return <StaffDirectory title="Staff" description="Manage receptionists and clinic operators." rows={data.staff} role="receptionist" />;
}

function StaffDirectory({ title, description, rows, role }: { title: string; description: string; rows: Profile[]; role: "doctor" | "receptionist" }) {
  const [open, setOpen] = useState(false);
  const columns = useMemo<ColumnDef<Profile>[]>(
    () => [
      { accessorKey: "full_name", header: "Name" },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "specialty", header: "Specialty" },
      { accessorKey: "phone", header: "Phone" },
      { header: "Status", cell: ({ row }) => row.original.active ? <StatusBadge value="completed" /> : <StatusBadge value="cancelled" /> },
    ],
    []
  );
  return (
    <>
      <PageHeader eyebrow="Admin" title={title} description={description} actions={<Button onClick={() => setOpen(true)}><UserPlus className="mr-2 size-4" />Add {role}</Button>} />
      <StaffSheet open={open} setOpen={setOpen} role={role} />
      <DataTable columns={columns} data={rows} />
    </>
  );
}

function StaffSheet({ open, setOpen, role }: { open: boolean; setOpen: (value: boolean) => void; role: "doctor" | "receptionist" }) {
  const { isPending, submit } = useActionSubmit();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader><SheetTitle>Add {role}</SheetTitle><SheetDescription>Creates a Supabase Auth account and clinic profile.</SheetDescription></SheetHeader>
        <form className="grid gap-4 px-4" onSubmit={(event) => submit(event, inviteStaffAction, () => setOpen(false))}>
          <input type="hidden" name="role" value={role} />
          <Field name="full_name" label="Full name" required />
          <Field name="email" label="Email" type="email" required />
          <Field name="phone" label="Phone" />
          {role === "doctor" && <Field name="specialty" label="Specialty" defaultValue="General Physician" />}
          <Field name="password" label="Temporary password" defaultValue="Demo@1234" />
          <Button disabled={isPending}>{isPending ? "Creating..." : "Create account"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function SettingsModule(data: ModuleData) {
  const { isPending, submit } = useActionSubmit();
  const clinic = data.clinic;
  return (
    <>
      <PageHeader eyebrow="Admin" title="Clinic settings" description="These details appear in PDFs, defaults, and notification behavior." />
      <Card>
        <CardContent className="p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => submit(event, updateClinicSettingsAction)}>
            <Field name="name" label="Clinic name" defaultValue={clinic?.name ?? ""} required />
            <Field name="phone" label="Phone" defaultValue={clinic?.phone ?? ""} />
            <Field name="address" label="Address" defaultValue={clinic?.address ?? ""} />
            <Field name="timezone" label="Timezone" defaultValue={clinic?.timezone ?? "Asia/Kolkata"} />
            <Field name="default_fee" label="Default consultation fee" type="number" defaultValue={String(clinic?.default_fee ?? 500)} />
            <Field name="tax_rate" label="Tax rate %" type="number" defaultValue={String(clinic?.tax_rate ?? 0)} />
            <StorageUploadField
              bucket="clinic-assets"
              clinicId={clinic?.id}
              name="logo_url"
              label="Clinic logo"
              folder="clinic-logos"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              defaultValue={clinic?.logo_url}
              publicUrl
            />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="email_notifications" defaultChecked={clinic?.email_notifications ?? false} /> Email reminders</label>
            <div className="md:col-span-2"><Button disabled={isPending}>{isPending ? "Saving..." : "Save settings"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

export function ReportsModule(data: ModuleData) {
  const revenue = lastNDays(14).map((day) => ({
    day: day.label,
    revenue: data.invoices
      .filter((invoice) => invoice.created_at.startsWith(day.iso))
      .reduce((sum, invoice) => sum + Number(invoice.paid_amount), 0),
  }));
  return (
    <>
      <PageHeader eyebrow="Admin" title="Reports" description="Revenue and activity summaries for clinic leadership." actions={<Button variant="outline"><Download className="mr-2 size-4" />Export CSV</Button>} />
      <RevenueChart revenue={revenue} />
    </>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string }) {
  const { label, name, ...inputProps } = props;
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...inputProps} />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: Array<string | { label: string; value: string }>;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Select</option>
        {options.map((option) => {
          const item = typeof option === "string" ? { label: option, value: option } : option;
          return <option key={item.value} value={item.value}>{item.label}</option>;
        })}
      </select>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function RecordList({ items }: { items: Array<{ title: string; meta: string; body?: string | null }> }) {
  return (
    <Card>
      <CardContent className="divide-y p-0">
        {items.length ? items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="p-4">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.meta}</p>
            {item.body && <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>}
          </div>
        )) : <p className="p-6 text-sm text-muted-foreground">No records yet.</p>}
      </CardContent>
    </Card>
  );
}

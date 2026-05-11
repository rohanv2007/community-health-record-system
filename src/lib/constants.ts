import {
  Banknote,
  CalendarDays,
  ClipboardList,
  FileText,
  Gauge,
  HeartPulse,
  Settings,
  Stethoscope,
  Users,
  UserCog,
} from "lucide-react";
import type { AppRole } from "@/types/database";

export const appName = "HealthPoint CHRS";

export const demoCredentials = [
  { role: "Admin", email: "admin@healthpoint.com", password: "Demo@1234" },
  { role: "Doctor", email: "doctor@healthpoint.com", password: "Demo@1234" },
  {
    role: "Receptionist",
    email: "reception@healthpoint.com",
    password: "Demo@1234",
  },
] as const;

export const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  doctor: "Doctor",
  receptionist: "Receptionist",
};

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, roles: ["admin", "doctor", "receptionist"] },
  { href: "/patients", label: "Patients", icon: HeartPulse, roles: ["admin", "doctor", "receptionist"] },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, roles: ["admin", "doctor", "receptionist"] },
  { href: "/prescriptions", label: "Prescriptions", icon: ClipboardList, roles: ["admin", "doctor"] },
  { href: "/billing", label: "Billing", icon: Banknote, roles: ["admin", "receptionist"] },
  { href: "/doctors", label: "Doctors", icon: Stethoscope, roles: ["admin"] },
  { href: "/staff", label: "Staff", icon: Users, roles: ["admin"] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  { href: "/setup", label: "Clinic setup", icon: UserCog, roles: ["admin"] },
] satisfies Array<{
  href: string;
  label: string;
  icon: typeof Gauge;
  roles: AppRole[];
}>;

export const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const appointmentStatuses = ["scheduled", "completed", "cancelled"] as const;
export const invoiceStatuses = ["unpaid", "partially_paid", "paid"] as const;

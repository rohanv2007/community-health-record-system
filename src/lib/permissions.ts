import type { AppRole } from "@/types/database";

export const rolePermissions = {
  admin: [
    "dashboard:read",
    "patients:write",
    "appointments:write",
    "prescriptions:write",
    "billing:write",
    "staff:write",
    "settings:write",
    "reports:read",
  ],
  doctor: [
    "dashboard:read",
    "patients:read",
    "appointments:write",
    "prescriptions:write",
  ],
  receptionist: [
    "dashboard:read",
    "patients:write",
    "appointments:write",
    "billing:write",
  ],
} as const;

export type Permission = (typeof rolePermissions)[AppRole][number];

export function can(role: AppRole | undefined, permission: string) {
  if (!role) return false;
  return (rolePermissions[role] as readonly string[]).includes(permission);
}

export function canAccessRoute(role: AppRole | undefined, pathname: string) {
  if (!role) return false;
  if (
    pathname.startsWith("/doctors") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/reports")
  ) {
    return role === "admin";
  }
  if (pathname.startsWith("/billing")) {
    return role === "admin" || role === "receptionist";
  }
  if (pathname.startsWith("/prescriptions")) {
    return role === "admin" || role === "doctor";
  }
  return true;
}

export function visibleRoles(role: AppRole) {
  return {
    canManageClinic: role === "admin",
    canBill: role === "admin" || role === "receptionist",
    canPrescribe: role === "admin" || role === "doctor",
    canRegisterPatients: role === "admin" || role === "receptionist",
  };
}

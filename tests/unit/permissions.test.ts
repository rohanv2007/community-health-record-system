import { can, canAccessRoute, visibleRoles } from "@/lib/permissions";

describe("role permission helpers", () => {
  it("maps feature permissions by role", () => {
    expect(can("admin", "staff:write")).toBe(true);
    expect(can("doctor", "billing:write")).toBe(false);
    expect(can("receptionist", "patients:write")).toBe(true);
    expect(can(undefined, "dashboard:read")).toBe(false);
  });

  it("protects admin-only and role-specific routes", () => {
    expect(canAccessRoute("admin", "/doctors")).toBe(true);
    expect(canAccessRoute("receptionist", "/doctors")).toBe(false);
    expect(canAccessRoute("doctor", "/billing")).toBe(false);
    expect(canAccessRoute("doctor", "/prescriptions")).toBe(true);
    expect(canAccessRoute("receptionist", "/patients")).toBe(true);
  });

  it("returns role-aware UI flags", () => {
    expect(visibleRoles("admin")).toMatchObject({
      canManageClinic: true,
      canBill: true,
      canPrescribe: true,
      canRegisterPatients: true,
    });
    expect(visibleRoles("doctor")).toMatchObject({
      canManageClinic: false,
      canBill: false,
      canPrescribe: true,
      canRegisterPatients: false,
    });
  });
});

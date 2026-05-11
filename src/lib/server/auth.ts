import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessRoute } from "@/lib/permissions";
import type { AppRole, Clinic, Profile } from "@/types/database";

export type CurrentProfile = Profile & { clinics?: Clinic | null };

export async function getCurrentProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*, clinics(*)")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  return (data as CurrentProfile | null) ?? null;
}

export async function requireCurrentProfile(pathname = "/dashboard") {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!canAccessRoute(profile.role, pathname)) redirect("/403");
  return profile;
}

export async function requireRole(roles: AppRole[]) {
  const profile = await requireCurrentProfile();
  if (!roles.includes(profile.role)) redirect("/403");
  return profile;
}

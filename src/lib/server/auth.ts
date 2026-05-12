import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { canAccessRoute } from "@/lib/permissions";
import type { AppRole, Clinic, Profile } from "@/types/database";

export type CurrentProfile = Profile & { clinics?: Clinic | null };

export const getCurrentProfile = cache(async function getCurrentProfile() {
  const supabase = createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || !userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*, clinics(*)")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  return (data as CurrentProfile | null) ?? null;
});

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

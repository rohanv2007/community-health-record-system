import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSupabasePublicEnv, supabaseAnonKey, supabaseUrl } from "@/lib/env";

export function createClient() {
  if (!hasSupabasePublicEnv()) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Middleware refreshes the session.
        }
      },
    },
  });
}

export function tryCreateClient() {
  if (!hasSupabasePublicEnv()) return null;
  return createClient();
}

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { hasSupabasePublicEnv, supabaseAnonKey, supabaseUrl } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!hasSupabasePublicEnv()) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

export function tryCreateClient() {
  if (!hasSupabasePublicEnv()) return null;
  return createClient();
}

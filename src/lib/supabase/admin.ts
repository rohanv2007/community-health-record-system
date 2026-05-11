import { createClient } from "@supabase/supabase-js";
import { hasSupabaseServiceEnv, supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";

let adminClient: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (!hasSupabaseServiceEnv()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation.");
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

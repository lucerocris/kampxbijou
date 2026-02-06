import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/**
 * Server-side Supabase client.
 *
 * IMPORTANT:
 * - SUPABASE_URL must be the https://<project-ref>.supabase.co URL (not the postgres connection string)
 * - SUPABASE_SERVICE_ROLE_KEY must never be exposed to the browser
 */
export function createSupabaseServerClient() {
  const url = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

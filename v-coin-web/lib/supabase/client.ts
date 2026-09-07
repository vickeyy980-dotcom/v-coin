import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for the browser (client components, "use client" files).
 * Reads the anon key — safe to expose, since RLS policies are what
 * actually control access, not this key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

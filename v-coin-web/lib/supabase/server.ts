import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for server components, route handlers, and server
 * actions. Reads the caller's session from cookies, so auth.uid()
 * inside Postgres functions reflects the actual signed-in user —
 * this is what lets transfer_funds() trust who the sender is.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            );
          } catch {
            // setAll is called from a Server Component during render in
            // some cases — safe to ignore if you have middleware.ts
            // refreshing the session (see middleware.ts).
          }
        },
      },
    }
  );
}

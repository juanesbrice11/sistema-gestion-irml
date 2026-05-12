import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client that uses the service_role key.
 * Bypasses RLS — only use in Server Actions that require admin operations
 * (e.g., creating/deleting auth users).
 *
 * NEVER import this file in client components or expose it to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase admin environment variables.')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

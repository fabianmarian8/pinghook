import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Fallback values for build time (when env vars are not available)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Admin client with service role key - use only on server side
export function createAdminClient() {
  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

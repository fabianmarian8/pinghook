import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Fallback values for build time (when env vars are not available)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

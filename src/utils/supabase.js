import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Provide a clear, actionable error to help with setup in dev/test
  // eslint-disable-next-line no-console
  console.error('[Supabase] Missing environment variables. Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in mobitrak-app/.env')
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

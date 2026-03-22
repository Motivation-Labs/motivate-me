import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'dummy-key-for-tests'
)

// Base URL for the app — used for invite links, auth redirects, etc.
// Production: https://me.motivationslabs.ai
export const siteUrl = (import.meta.env.VITE_SITE_URL as string) || window.location.origin

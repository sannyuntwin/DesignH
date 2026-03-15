// --- SUPABASE COMMENTED OUT ---
// import { createClient } from '@supabase/supabase-js'
//
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
//
// if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url') {
//     console.warn('Supabase credentials are missing. Cloud sync will be disabled.')
// }
//
// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Stub export so existing imports don't break while Supabase is disabled
export const supabase = null as any

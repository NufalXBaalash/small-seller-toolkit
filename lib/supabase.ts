import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client for API routes and Server Actions
export const createServerClient = () => {
  // Ensure SUPABASE_SERVICE_ROLE_KEY is only used on the server
  if (typeof window !== "undefined") {
    throw new Error("createServerClient should only be called on the server.")
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes("placeholder") &&
    supabaseAnonKey.length > 0 &&
    supabaseAnonKey !== "placeholder"
  );
}

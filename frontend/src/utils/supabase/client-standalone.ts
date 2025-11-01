import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

/**
 * Standalone Supabase client for use outside of Next.js request context
 * (e.g., in scripts, tools, agents running outside of web requests)
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY are required",
  );
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Don't persist session for standalone usage
  },
});

export { supabaseClient as createStandaloneClient };

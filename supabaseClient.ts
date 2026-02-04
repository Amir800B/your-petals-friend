import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "PUT_YOUR_PROJECT_URL_HERE",
  "PUT_YOUR_ANON_KEY_HERE"
);

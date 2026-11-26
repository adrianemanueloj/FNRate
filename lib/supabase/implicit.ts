import { createClient } from "@supabase/supabase-js";

// Used only to SEND email sign-in links. The implicit flow puts the session in
// the link itself, so it works in whatever browser opens it (e.g. the Gmail app),
// unlike PKCE which only works in the browser that asked for the link.
export function createImplicitClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

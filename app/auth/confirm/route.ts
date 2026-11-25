import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Email links that use {{ .TokenHash }} land here. Unlike the code flow, this
// works even when the email app opens the link in a different browser.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const raw = searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (token_hash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}

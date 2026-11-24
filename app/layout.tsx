import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "FNRate · Rate your teammates",
  description: "Search any player and see how good a teammate they really are.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0f1a",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <header className="top">
          <Link href="/" className="logo">
            FN<span>Rate</span>
          </Link>
          <nav className="nav">
            {user ? (
              <form action="/auth/signout" method="post">
                <button className="linkbtn" type="submit">Sign out</button>
              </form>
            ) : (
              <Link href="/login" className="btn ghost" style={{ padding: "8px 14px" }}>
                Sign in
              </Link>
            )}
          </nav>
        </header>
        <main className="wrap">{children}</main>
        <footer>
          FNRate is a fan project and is not affiliated with or endorsed by Epic Games.
        </footer>
      </body>
    </html>
  );
}

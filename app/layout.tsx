import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import TabBar, { TopLinks } from "@/components/TabBar";
import { LogoMark } from "@/components/Icons";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "FNRate · Rate your teammates",
  description: "Search any player and see how good a teammate they really are. Rate toxicity, teamwork, comms and skill.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0c18",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const initial = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="top">
          <div className="gut">
            <Link href="/" className="logo" aria-label="FNRate home">
              <span className="mark"><LogoMark /></span>
              <span>FN<b>Rate</b></span>
            </Link>
            <TopLinks />
            <div className="acct">
              {user ? (
                <>
                  <form action="/auth/signout" method="post">
                    <button className="linkbtn" type="submit">Sign out</button>
                  </form>
                  <span className="avatar" aria-hidden="true">{initial}</span>
                </>
              ) : (
                <Link href="/login" className="btn sm">Sign in</Link>
              )}
            </div>
          </div>
        </header>
        <main className="gut">{children}</main>
        <footer>
          FNRate is a fan project and is not affiliated with or endorsed by Epic Games.
          <br />Ratings are opinions from other players.
        </footer>
        <TabBar />
      </body>
    </html>
  );
}

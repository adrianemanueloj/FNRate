import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import TabBar, { TopLinks } from "@/components/TabBar";
import { LogoMark } from "@/components/Icons";
import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://fn-rate.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "FNRate · Rate your teammates after the game", template: "%s · FNRate" },
  description: "Rate the people you played with after the game: toxicity, teamwork, comms and skill.",
  openGraph: { siteName: "FNRate", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0e1a",
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
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="top">
          <div className="gut">
            <Link href="/" className="logo" aria-label="FNRate home">
              <span className="mark"><LogoMark /></span>
              <span>FN<em>Rate</em></span>
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
          <div className="gut">
            <span>Scores are opinions from other players. Report anything hateful and it gets hidden.</span>
            <span>FNRate is a fan project, not affiliated with or endorsed by Epic Games.</span>
          </div>
        </footer>
        <TabBar />
      </body>
    </html>
  );
}

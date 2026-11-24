import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  return (
    <div className="stack" style={{ maxWidth: 420, width: "100%", margin: "0 auto", gap: 18 }}>
      <section className="hero">
        <span className="eyebrow grad-text">Welcome</span>
        <h1 className="poster">Sign in to <span className="grad-text">rate</span></h1>
        <p>Use Discord or get a sign-in link by email. No password, and no Epic account needed.</p>
      </section>
      {sp.error && <div className="notice err">Sign-in didn&apos;t work. Please try again.</div>}
      <section className="card"><LoginForm next={next} /></section>
      <p className="small faint" style={{ textAlign: "center", margin: 0 }}>Ratings are anonymous. Other players never see who rated them.</p>
    </div>
  );
}

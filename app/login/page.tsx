import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  return (
    <div className="stack" style={{ maxWidth: 440, width: "100%", gap: 22 }}>
      <section className="hero">
        <h1>Sign in</h1>
        <p className="lede">Discord, or a link by email. No password, and you don’t need your Epic account.</p>
      </section>
      {sp.error && (
        <div className="notice err">
          That sign-in link didn’t work. Links expire after an hour and can only be used once. Ask for a new one below.
        </div>
      )}
      <LoginForm next={next} />
      <p className="small faint" style={{ margin: 0 }}>Nobody sees who rated them. Your email is only used to sign you in.</p>
    </div>
  );
}

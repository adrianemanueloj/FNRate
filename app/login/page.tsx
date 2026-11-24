import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  return (
    <div className="stack" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Sign in</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Sign in to rate players and pin your own account. No password needed.
      </p>
      {sp.error && <div className="notice err">Sign-in failed. Please try again.</div>}
      <LoginForm next={next} />
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <section className="hero">
      <span className="label">404</span>
      <h1>Nothing here</h1>
      <p className="lede">This page doesn’t exist. Looking for a player? Search their Epic name.</p>
      <div className="row"><Link className="btn" href="/search">Search players</Link><Link className="btn ghost" href="/">Home</Link></div>
    </section>
  );
}

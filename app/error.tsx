"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="hero">
      <span className="label">Something broke</span>
      <h1>That didn’t load</h1>
      <p className="lede">It’s probably a hiccup on our side. Try again in a moment.</p>
      <div className="row"><button className="btn" onClick={reset}>Try again</button><a className="btn ghost" href="/">Home</a></div>
    </section>
  );
}

import Badge from "@/components/Badge";
import { IconCheck } from "@/components/Icons";

export const metadata = { title: "FNRate Plus" };

function Item({ children }: { children: React.ReactNode }) {
  return <li><IconCheck />{children}</li>;
}

export default function Premium() {
  return (
    <>
      <section className="hero">
        <span className="eyebrow grad-text">FNRate Plus</span>
        <h1 className="poster">Support FNRate, <span className="grad-text">stand out</span></h1>
        <p>Extras for players who use FNRate a lot. Payments aren&apos;t live yet, so these are coming soon.</p>
      </section>

      <div className="grid2">
        <section className="card glow plan fade-up">
          <span className="chip soon">Coming soon</span>
          <span className="eyebrow">Subscription</span>
          <h2>FNRate Plus</h2>
          <div className="price">Price soon</div>
          <ul>
            <Item><b>10 ratings a day</b> instead of 3</Item>
            <Item>A <span className="plus-tag">PLUS</span> tag next to your name</Item>
            <Item>Helps keep FNRate free for everyone</Item>
          </ul>
          <button className="btn full" type="button" disabled aria-disabled="true">Coming soon</button>
        </section>

        <section className="card plan fade-up d1">
          <span className="chip soon">Coming soon</span>
          <span className="eyebrow">One-time</span>
          <h2>Profile badge</h2>
          <div className="price">9 kr</div>
          <ul>
            <Item>A gold <Badge /> badge on your pinned profile</Item>
            <Item>Shows in search, leaderboards and on your profile</Item>
            <Item>Never changes your scores. Ratings stay fair.</Item>
          </ul>
          <button className="btn ghost full" type="button" disabled aria-disabled="true">Coming soon</button>
        </section>
      </div>

      <p className="small faint" style={{ textAlign: "center", margin: 0 }}>
        Paying never changes a player&apos;s ratings or leaderboard spot.
      </p>
    </>
  );
}

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
        <h1>FNRate <span className="hl">Plus</span></h1>
        <p className="lede">Extras for people who rate a lot, and a way to support the site. Payments aren’t switched on yet.</p>
      </section>

      <div className="grid2">
        <section className="panel plan featured">
          <div className="spread"><span className="label">Monthly</span><span className="chip">Coming soon</span></div>
          <h2>Plus</h2>
          <div className="price">Price TBA</div>
          <ul>
            <Item><span><b>10 ratings a day</b> instead of 3</span></Item>
            <Item><span>A <span className="plus-tag">PLUS</span> tag on your pinned profile</span></Item>
            <Item><span>Keeps FNRate free for everyone else</span></Item>
          </ul>
          <button className="btn full" type="button" disabled aria-disabled="true">Coming soon</button>
        </section>

        <section className="panel plan">
          <div className="spread"><span className="label">One-time</span><span className="chip">Coming soon</span></div>
          <h2>Supporter badge</h2>
          <div className="price">9 <small>kr</small></div>
          <ul>
            <Item><span>A gold <Badge /> tag on your pinned profile</span></Item>
            <Item><span>Shows next to your name in search and on the boards</span></Item>
            <Item><span>Never changes your scores</span></Item>
          </ul>
          <button className="btn ghost full" type="button" disabled aria-disabled="true">Coming soon</button>
        </section>
      </div>

      <p className="small faint" style={{ margin: 0 }}>Paying never changes anyone’s ratings or where they rank.</p>
    </>
  );
}

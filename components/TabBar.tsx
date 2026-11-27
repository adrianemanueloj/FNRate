"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBolt, IconHome, IconSearch, IconTrophy, IconUsers } from "./Icons";

export const NAV = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/search", label: "Search", Icon: IconSearch },
  { href: "/leaderboards", label: "Leaderboards", Icon: IconTrophy },
  { href: "/party", label: "Party", Icon: IconUsers },
  { href: "/premium", label: "Plus", Icon: IconBolt },
];

function isOn(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export function TopLinks() {
  const path = usePathname();
  return (
    <nav className="toplinks" aria-label="Main">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={isOn(path, n.href) ? "on" : ""}>{n.label}</Link>
      ))}
    </nav>
  );
}

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="gut">
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={isOn(path, href) ? "on" : ""} aria-current={isOn(path, href) ? "page" : undefined}>
            <Icon />
            {label === "Leaderboards" ? "Boards" : label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

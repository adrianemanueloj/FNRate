type P = { className?: string };
const s = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const IconHome = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>);
export const IconSearch = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
export const IconTrophy = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>);
export const IconBolt = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>);
export const IconThumb = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M7 10v11H3V10zM7 10l4-8a3 3 0 0 1 3 3v4h6a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.6 21H7" /></svg>);
export const IconFlag = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>);
export const IconPin = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 17v5M8 3h8l-1 6 3 3v2H6v-2l3-3z" /></svg>);
export const IconCheck = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="m5 12 5 5L20 7" /></svg>);
export const IconStar = (p: P) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m12 2 3 6.6 7 .8-5.2 4.8 1.4 7-6.2-3.6L5.8 21l1.4-7L2 9.4l7-.8z" /></svg>);
export const IconPlus = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const LogoMark = (p: P) => (<svg viewBox="0 0 24 24" fill="#fff" {...p}><path d="M6 3h13l-1.6 4.2H11l-.7 2.8h6.2l-1.5 4H9.3L7.6 21H3.5z" /></svg>);
export const IconUsers = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2A6.5 6.5 0 0 1 21.5 20" /></svg>);
export const IconShare = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>);

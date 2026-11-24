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
export const LogoMark = (p: P) => (<svg viewBox="0 0 24 24" fill="#fff" {...p}><path d="M5 3h12l-1.5 4H10l-.6 2.5H15L13.6 13H8.5L6.9 21H3z" /></svg>);

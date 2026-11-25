import { cleanName } from "./categories";

// Route params arrive already decoded; decode again only if it is safe.
export function nameFromParam(raw: string) {
  let v = raw;
  try { v = decodeURIComponent(raw); } catch { /* keep raw */ }
  return cleanName(v);
}

export function isValidName(n: string) {
  return n.length >= 3 && n.length <= 32;
}

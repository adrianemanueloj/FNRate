import { IconSearch } from "./Icons";

export default function SearchBox({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/search" method="get" className="search" role="search">
      <IconSearch className="ico" />
      <input type="search" name="q" defaultValue={defaultValue} placeholder="Epic name" aria-label="Epic name"
        autoComplete="off" autoCapitalize="off" spellCheck={false} minLength={3} maxLength={32} autoFocus={autoFocus} required
        enterKeyHint="search" />
      <button className="btn" type="submit">Search</button>
    </form>
  );
}

import { IconSearch } from "./Icons";

export default function SearchBox({ defaultValue = "", autoFocus = false, large = false }: { defaultValue?: string; autoFocus?: boolean; large?: boolean }) {
  return (
    <form action="/search" method="get" className={`search${large ? " lg" : ""}`} role="search">
      <IconSearch className="ico" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={large ? "Enter an Epic name…" : "Search an Epic name"}
        aria-label="Epic name"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        minLength={3}
        maxLength={32}
        autoFocus={autoFocus}
        required
      />
      <button className="btn" type="submit">Search</button>
    </form>
  );
}

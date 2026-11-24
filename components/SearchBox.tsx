export default function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" method="get" className="searchrow">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search an Epic name…"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        minLength={3}
        maxLength={32}
        required
      />
      <button className="btn" type="submit">Search</button>
    </form>
  );
}

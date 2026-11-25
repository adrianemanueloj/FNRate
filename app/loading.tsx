export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading">
      <div className="sk" style={{ height: 44, width: "70%" }} />
      <div className="sk" style={{ height: 18, width: "90%" }} />
      <div className="sk" style={{ height: 54 }} />
      <div className="sk" style={{ height: 180, marginTop: 12 }} />
    </div>
  );
}

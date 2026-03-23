export default function Loading() {
  return (
    <div className="home-page-stack" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div className="home-map-block" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
        <p style={{ color: "#64748b" }}>Loading map…</p>
      </div>
    </div>
  );
}

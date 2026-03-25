const partyColors = { LDF: "#dc2626", UDF: "#1d4ed8", "BJP/NDA": "#ea580c", Others: "#6b7280" };

export default function QuickStats({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="stats-grid">
        {[...Array(4)].map((_, i) => <div key={i} className="stat-card skeleton" />)}
      </div>
    );
  }

  const total = entries.length;
  const acSet = new Set(entries.map(e => e.ac));

  const faCounts = {};
  entries.forEach(e => { faCounts[e.faName] = (faCounts[e.faName] || 0) + 1; });
  const topFA = Object.entries(faCounts).sort((a, b) => b[1] - a[1])[0];

  const partySums = { LDF: 0, UDF: 0, "BJP/NDA": 0, Others: 0 };
  entries.forEach(e => {
    const p = e.whoWillWin;
    if (partySums[p] !== undefined) partySums[p] += parseFloat(e.normalizedScore) || 0;
  });
  const leading = Object.entries(partySums).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">query_stats</div>
        <div className="stat-label">Total Entries</div>
        <div className="stat-value">{total.toLocaleString()}</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">map</div>
        <div className="stat-label">ACs Covered</div>
        <div className="stat-value">{acSet.size}</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">emoji_events</div>
        <div className="stat-label">Most Active FA ({topFA ? topFA[1] : 0} entries)</div>
        <div className="stat-value" style={{ fontSize: 18 }}>{topFA ? topFA[0].split(" ")[0] : "—"}</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">bar_chart</div>
        <div className="stat-label">Leading Party</div>
        <div className="stat-value" style={{ color: partyColors[leading?.[0]] || "var(--primary)" }}>
          {leading ? leading[0] : "—"}
        </div>
      </div>
    </div>
  );
}

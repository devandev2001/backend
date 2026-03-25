export default function QuickStats({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="stats-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card skeleton" />
        ))}
      </div>
    );
  }

  // Total entries
  const total = entries.length;

  // ACs covered
  const acSet = new Set(entries.map(e => e.ac));
  const acsCovered = acSet.size;

  // Most active FA
  const faCounts = {};
  entries.forEach(e => { faCounts[e.faName] = (faCounts[e.faName] || 0) + 1; });
  const topFA = Object.entries(faCounts).sort((a, b) => b[1] - a[1])[0];

  // Leading party (by sum of normalized scores)
  const partySums = { LDF: 0, UDF: 0, "BJP/NDA": 0, Others: 0 };
  entries.forEach(e => {
    const p = e.whoWillWin;
    if (partySums[p] !== undefined) partySums[p] += parseFloat(e.normalizedScore) || 0;
  });
  const leading = Object.entries(partySums).sort((a, b) => b[1] - a[1])[0];

  const partyColors = { LDF: "#dc2626", UDF: "#2563eb", "BJP/NDA": "#ea580c", Others: "#6b7280" };

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">📋</div>
        <div className="stat-value">{total}</div>
        <div className="stat-label">Total Entries</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🗺️</div>
        <div className="stat-value">{acsCovered}</div>
        <div className="stat-label">ACs Covered</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🏆</div>
        <div className="stat-value">{topFA ? topFA[0].split(" ")[0] : "—"}</div>
        <div className="stat-label">Most Active FA ({topFA ? topFA[1] : 0} entries)</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-value" style={{ color: partyColors[leading?.[0]] || "#1d4ed8" }}>
          {leading ? leading[0] : "—"}
        </div>
        <div className="stat-label">Leading Party (weighted)</div>
      </div>
    </div>
  );
}

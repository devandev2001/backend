import { useState, useMemo } from "react";
import { ACS, PARTIES } from "../config";

export default function EntryTracker({ entries, loading, error, onRefresh }) {
  const [filterAC, setFilterAC] = useState("");
  const [filterFA, setFilterFA] = useState("");
  const [filterParty, setFilterParty] = useState("");

  const faNames = useMemo(() => {
    if (!entries) return [];
    return [...new Set(entries.map(e => e.faName))].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter(e => {
      if (filterAC && e.ac !== filterAC) return false;
      if (filterFA && e.faName !== filterFA) return false;
      if (filterParty && e.whoWillWin !== filterParty) return false;
      return true;
    });
  }, [entries, filterAC, filterFA, filterParty]);

  // Per-FA counts from filtered
  const faCounts = useMemo(() => {
    const counts = {};
    filtered.forEach(e => { counts[e.faName] = (counts[e.faName] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // Per-AC counts from filtered
  const acCounts = useMemo(() => {
    const counts = {};
    filtered.forEach(e => { counts[e.ac] = (counts[e.ac] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  return (
    <div className="tracker-wrap">
      {/* Filters */}
      <div className="filter-bar">
        <select value={filterAC} onChange={e => setFilterAC(e.target.value)}>
          <option value="">All Constituencies</option>
          {ACS.map(ac => <option key={ac} value={ac}>{ac}</option>)}
        </select>
        <select value={filterFA} onChange={e => setFilterFA(e.target.value)}>
          <option value="">All FA Names</option>
          {faNames.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={filterParty} onChange={e => setFilterParty(e.target.value)}>
          <option value="">All Parties (Who Will Win)</option>
          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}

      {/* Mini summaries */}
      <div className="mini-summary-row">
        <div className="mini-card">
          <div className="mini-title">Entries by FA</div>
          {faCounts.slice(0, 8).map(([fa, cnt]) => (
            <div key={fa} className="mini-row">
              <span className="mini-name">{fa}</span>
              <span className="mini-count">{cnt}</span>
            </div>
          ))}
        </div>
        <div className="mini-card">
          <div className="mini-title">Entries by AC</div>
          {acCounts.slice(0, 8).map(([ac, cnt]) => (
            <div key={ac} className="mini-row">
              <span className="mini-name">{ac}</span>
              <span className="mini-count">{cnt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Entry count */}
      <div className="entry-count">
        Showing <strong>{filtered.length}</strong> of <strong>{entries?.length || 0}</strong> entries
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-msg">Fetching data from Google Sheet…</div>
      ) : (
        <div className="table-wrap">
          <table className="entry-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Time</th>
                <th>AC</th>
                <th>FA Name</th>
                <th>Caste Wt</th>
                <th>Gender Wt</th>
                <th>Age Wt</th>
                <th>Vote 2021</th>
                <th>Vote 2024</th>
                <th>Vote 2026</th>
                <th>Who Will Win</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="no-data">No entries found</td></tr>
              ) : (
                filtered.map((e, i) => (
                  <tr key={i} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                    <td className="num-col">{i + 1}</td>
                    <td className="time-col">{String(e.timestamp).split(",")[1]?.trim() || e.timestamp}</td>
                    <td className="ac-col">{e.ac}</td>
                    <td>{e.faName}</td>
                    <td className="num-col">{parseFloat(e.casteWeight).toFixed(4)}</td>
                    <td className="num-col">{parseFloat(e.genderWeight).toFixed(4)}</td>
                    <td className="num-col">{parseFloat(e.ageWeight).toFixed(4)}</td>
                    <td><span className={`party-tag party-${e.vote2021?.replace("/","")}`}>{e.vote2021}</span></td>
                    <td><span className={`party-tag party-${e.vote2024?.replace("/","")}`}>{e.vote2024}</span></td>
                    <td><span className={`party-tag party-${e.vote2026?.replace("/","")}`}>{e.vote2026}</span></td>
                    <td><span className={`party-tag party-${e.whoWillWin?.replace("/","")}`}>{e.whoWillWin}</span></td>
                    <td className="num-col score-col">{parseFloat(e.normalizedScore).toFixed(6)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

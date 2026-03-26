import { useState, useMemo } from "react";
import { ACS, PARTIES, formatAcSelectLabel, getAcNo, sortAcNames } from "../config";
import { getCasteLabel } from "../demographics";

const DEFAULT_LIMIT = 100;

export default function EntryTracker({ entries, loading, error, onRefresh }) {
  const [filterAC, setFilterAC] = useState("");
  const [filterFA, setFilterFA] = useState("");
  const [filterParty, setFilterParty] = useState("");
  const [showAll, setShowAll] = useState(false);

  // FA names filtered by selected AC
  const faNames = useMemo(() => {
    if (!entries) return [];
    const source = filterAC ? entries.filter(e => e.ac === filterAC) : entries;
    return [...new Set(source.map(e => e.faName))].filter(Boolean).sort();
  }, [entries, filterAC]);

  // Reset FA filter when AC changes
  function handleACChange(val) {
    setFilterAC(val);
    setFilterFA(""); // reset FA when AC changes
  }

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter(e => {
      if (filterAC && e.ac !== filterAC) return false;
      if (filterFA && e.faName !== filterFA) return false;
      if (filterParty && e.whoWillWin !== filterParty) return false;
      return true;
    });
  }, [entries, filterAC, filterFA, filterParty]);

  // FA counts from FILTERED entries
  const allFACounts = useMemo(() => {
    if (!filtered) return [];
    const counts = {};
    filtered.forEach(e => { counts[e.faName] = (counts[e.faName] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // AC counts from FILTERED entries
  const allACCounts = useMemo(() => {
    if (!filtered) return [];
    const counts = {};
    filtered.forEach(e => { counts[e.ac] = (counts[e.ac] || 0) + 1; });
    const pairs = Object.entries(counts);
    pairs.sort((a, b) => {
      const na = getAcNo(a[0]);
      const nb = getAcNo(b[0]);
      if (na && nb) return parseInt(na, 10) - parseInt(nb, 10);
      if (na && !nb) return -1;
      if (!na && nb) return 1;
      return b[1] - a[1];
    });
    return pairs;
  }, [filtered]);

  return (
    <div className="tracker-wrap">
      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Assembly Constituency</label>
          <select className="filter-select" value={filterAC} onChange={e => handleACChange(e.target.value)}>
            <option value="">All Constituencies</option>
            {sortAcNames(ACS).map(ac => (
              <option key={ac} value={ac}>{formatAcSelectLabel(ac)}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Field Assistant</label>
          <select className="filter-select" value={filterFA} onChange={e => setFilterFA(e.target.value)}>
            <option value="">All FAs</option>
            {faNames.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Who Will Win</label>
          <select className="filter-select" value={filterParty} onChange={e => setFilterParty(e.target.value)}>
            <option value="">All Parties</option>
            {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button className="refresh-btn" onClick={onRefresh} disabled={loading} style={{ alignSelf: "flex-end" }}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}

      {/* FA Summary Table — always visible */}
      <div className="fa-table-section">
        <div className="section-label">FA Entry Summary</div>
        <div className="table-wrap">
          <table className="fa-summary-table">
            <thead>
              <tr>
                <th>#</th>
                <th>FA Name</th>
                <th>Entries</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {allFACounts.map(([fa, cnt], i) => (
                <tr key={fa} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                  <td className="num-col">{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{fa}</td>
                  <td className="num-col" style={{ color: "#1d4ed8", fontWeight: 700 }}>{cnt}</td>
                  <td>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min((cnt / (allFACounts[0]?.[1] || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AC Summary mini cards */}
      <div className="mini-summary-row">
        <div className="mini-card">
          <div className="mini-title">Entries by AC</div>
          {allACCounts.map(([ac, cnt]) => (
            <div key={ac} className="mini-row">
              <span className="mini-name">{formatAcSelectLabel(ac)}</span>
              <span className="mini-count">{cnt}</span>
            </div>
          ))}
        </div>
        <div className="mini-card">
          <div className="mini-title">Filtered Results</div>
          <div style={{ padding: "8px 0", fontSize: 13, color: "#64748b" }}>
            {filterAC || filterFA || filterParty ? (
              <>
                <div style={{ marginBottom: 6 }}>
                  {filterAC && <span className="filter-chip">{formatAcSelectLabel(filterAC)}</span>}
                  {filterFA && <span className="filter-chip">{filterFA}</span>}
                  {filterParty && <span className="filter-chip">{filterParty}</span>}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#1e3a8a" }}>{filtered.length}</div>
                <div style={{ fontSize: 12 }}>matching entries</div>
              </>
            ) : (
              <div style={{ color: "#94a3b8", fontStyle: "italic" }}>No filters applied</div>
            )}
          </div>
        </div>
      </div>

      {/* Entry count + show-all toggle */}
      <div className="entry-count-row">
        <span className="entry-count">
          Showing <strong>{Math.min(showAll ? filtered.length : DEFAULT_LIMIT, filtered.length)}</strong>
          {" of "}
          <strong>{filtered.length}</strong> entries
          {(filterAC || filterFA || filterParty) && (
            <button className="clear-filters-btn" onClick={() => { setFilterAC(""); setFilterFA(""); setFilterParty(""); setShowAll(false); }}>
              ✕ Clear
            </button>
          )}
        </span>
        {filtered.length > DEFAULT_LIMIT && (
          <button className="show-all-btn" onClick={() => setShowAll(v => !v)}>
            {showAll ? `Show first ${DEFAULT_LIMIT}` : `Show all ${filtered.length} ↓`}
          </button>
        )}
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
                <th className="ac-no-col">AC No.</th>
                <th>AC</th>
                <th>FA Name</th>
                <th>Caste</th>
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
                <tr><td colSpan={14} className="no-data">
                  {!entries?.length
                    ? "No rows for this date range (or API returned nothing). Widen From→To, try Cumulative, or check the sheet’s first tab."
                    : (filterAC || filterFA || filterParty)
                      ? "No entries match the filters above — try clearing them."
                      : "No entries to show."}
                </td></tr>
              ) : (
                (showAll ? filtered : filtered.slice(0, DEFAULT_LIMIT)).map((e, i) => (
                  <tr key={i} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                    <td className="num-col">{i + 1}</td>
                    <td className="time-col">{String(e.timestamp).split(",")[1]?.trim() || e.timestamp}</td>
                    <td className="ac-no-col num-col">{getAcNo(e.ac) || "—"}</td>
                    <td className="ac-col">{e.ac}</td>
                    <td style={{ fontWeight: 500 }}>{e.faName}</td>
                    <td>{getCasteLabel(e.ac, e.casteWeight)}</td>
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
          {/* Show-all footer inside table */}
          {!showAll && filtered.length > DEFAULT_LIMIT && (
            <div className="table-show-more">
              <button className="show-all-btn" onClick={() => setShowAll(true)}>
                Show all {filtered.length} entries ↓
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

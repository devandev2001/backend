import { useState, useMemo } from "react";
import { ACS, PARTIES, formatAcSelectLabel, getAcNo, sortAcNames } from "../config";
import { getCasteLabel, getGenderLabel, getAgeLabel } from "../demographics";

const DEFAULT_LIMIT = 50;
const CASTE_BADGE_STYLES = {
  Nair: { background: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" },
  Ezhava: { background: "#dcfce7", color: "#166534", borderColor: "#86efac" },
  Muslim: { background: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" },
  Christian: { background: "#ede9fe", color: "#5b21b6", borderColor: "#c4b5fd" },
  "SC/ST": { background: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" },
  Others: { background: "#e2e8f0", color: "#334155", borderColor: "#cbd5e1" },
  Unknown: { background: "#f1f5f9", color: "#64748b", borderColor: "#e2e8f0" },
};

function getPartyClassName(v) {
  const s = String(v || "").trim().toUpperCase().replace(/\s+/g, "");
  if (s === "LDF") return "party-chip-ldf";
  if (s === "UDF") return "party-chip-udf";
  if (s === "BJP/NDA" || s === "BJP-NDA" || s === "BJPNDA" || s === "BJP" || s === "NDA") return "party-chip-bjp";
  if (s === "NOTVOTED") return "party-chip-notvoted";
  if (s === "NOTA") return "party-chip-nota";
  return "party-chip-other";
}

function getGenderStyle(label) {
  return label === "Female"
    ? { background: "#fce7f3", color: "#9d174d", borderColor: "#f9a8d4" }
    : { background: "#dbeafe", color: "#1e3a8a", borderColor: "#93c5fd" };
}

export default function EntryTracker({ entries, loading, error, onRefresh }) {
  const [filterAC, setFilterAC] = useState("");
  const [filterFA, setFilterFA] = useState("");
  const [filterParty, setFilterParty] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  function downloadFilteredEntriesCsv() {
    const headers = [
      "Timestamp",
      "Assembly Constituency",
      "FA Name",
      "Caste Weight",
      "Gender Weight",
      "Age Weight",
      "Vote in 2021 AE",
      "Vote in 2024 GE",
      "Vote in 2026 AE",
      "Who Will Win",
      "Who Will Win Normalized",
    ];
    const rows = (showAll ? filtered : filtered.slice(0, DEFAULT_LIMIT)).map((e) => [
      e.timestamp,
      e.ac,
      e.faName,
      e.casteWeight,
      e.genderWeight,
      e.ageWeight,
      e.vote2021,
      e.vote2024,
      e.vote2026,
      e.whoWillWin,
      e.normalizedScore,
    ]);
    const escapeCsv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((line) => line.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Entry_Tracker_${showAll ? "all" : "visible"}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

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
    const toIsoDateFromTimestamp = (ts) => {
      const s = String(ts || "").trim();
      if (!s) return "";
      const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (m) {
        let y = parseInt(m[3], 10);
        if (y < 100) y += 2000;
        const dd = String(parseInt(m[1], 10)).padStart(2, "0");
        const mm = String(parseInt(m[2], 10)).padStart(2, "0");
        return `${y}-${mm}-${dd}`;
      }
      const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
      return "";
    };

    return entries.filter(e => {
      if (filterAC && e.ac !== filterAC) return false;
      if (filterFA && e.faName !== filterFA) return false;
      if (filterParty && e.whoWillWin !== filterParty) return false;
      if (filterDate && toIsoDateFromTimestamp(e.timestamp) !== filterDate) return false;
      return true;
    });
  }, [entries, filterAC, filterFA, filterParty, filterDate]);

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
        <div className="entry-count-left">
          <span className="entry-count">
            Showing <strong>{Math.min(showAll ? filtered.length : DEFAULT_LIMIT, filtered.length)}</strong>
            {" of "}
            <strong>{filtered.length}</strong> entries
          </span>
          <div className="filter-group" style={{ minWidth: 180, maxWidth: 220 }}>
            <label className="filter-label">Filter by date</label>
            <input
              type="date"
              className="date-range-input tracker-date-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          {(filterAC || filterFA || filterParty || filterDate) && (
            <button className="clear-filters-btn" onClick={() => { setFilterAC(""); setFilterFA(""); setFilterParty(""); setFilterDate(""); setShowAll(false); }}>
              ✕ Clear
            </button>
          )}
        </div>
        <div className="entry-count-actions">
          {filtered.length > DEFAULT_LIMIT && (
            <button className="show-all-btn" onClick={() => setShowAll(v => !v)}>
              {showAll ? `Show first ${DEFAULT_LIMIT}` : `Show all ${filtered.length} ↓`}
            </button>
          )}
          <button
            className="download-btn"
            onClick={downloadFilteredEntriesCsv}
            disabled={filtered.length === 0}
          >
            ⬇ Download CSV
          </button>
        </div>
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
                <th>Timestamp</th>
                <th>Assembly Constituency</th>
                <th>FA Name</th>
                <th>Caste Weight</th>
                <th>Caste Label</th>
                <th>Gender Weight</th>
                <th>Gender Label</th>
                <th>Age Weight</th>
                <th>Age Label</th>
                <th>Vote in 2021 AE</th>
                <th>Vote in 2024 GE</th>
                <th>Vote in 2026 AE</th>
                <th>Who Will Win</th>
                <th>Who Will Win Normalized</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={15} className="no-data">
                  {!entries?.length
                    ? "No rows for this date range (or API returned nothing). Widen From→To, try Cumulative, or check the sheet’s first tab."
                    : (filterAC || filterFA || filterParty)
                      ? "No entries match the filters above — try clearing them."
                      : "No entries to show."}
                </td></tr>
              ) : (
                (showAll ? filtered : filtered.slice(0, DEFAULT_LIMIT)).map((e, i) => (
                  <tr key={i} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                    {(() => {
                      const rawCaste = String(e.casteLabel ?? "").trim();
                      const casteIsText = rawCaste && isNaN(parseFloat(rawCaste));
                      const casteLabel = casteIsText ? getCasteLabel(e.ac, rawCaste) : getCasteLabel(e.ac, e.casteWeight);
                      const rawGender = String(e.genderLabel ?? "").trim();
                      const genderIsText = rawGender && isNaN(parseFloat(rawGender));
                      const genderLabel = genderIsText ? getGenderLabel(e.ac, e.genderWeight, rawGender) : getGenderLabel(e.ac, e.genderWeight, "");
                      const rawAge = String(e.ageLabel ?? "").trim();
                      const ageIsText = rawAge && isNaN(parseFloat(rawAge));
                      const ageLabel = ageIsText ? getAgeLabel(rawAge) : getAgeLabel(e.ageWeight);
                      return (
                        <>
                    <td className="num-col">{i + 1}</td>
                    <td>{e.timestamp}</td>
                    <td>{e.ac}</td>
                    <td style={{ fontWeight: 500 }}>{e.faName}</td>
                    <td className="num-col">{e.casteWeight}</td>
                    <td>
                      <span className="label-pill" style={CASTE_BADGE_STYLES[casteLabel] || CASTE_BADGE_STYLES.Others}>{casteLabel}</span>
                    </td>
                    <td className="num-col">{e.genderWeight}</td>
                    <td>
                      <span className="label-pill" style={getGenderStyle(genderLabel)}>{genderLabel}</span>
                    </td>
                    <td className="num-col">{e.ageWeight}</td>
                    <td>
                      <span className="label-pill age-pill">{ageLabel}</span>
                    </td>
                    <td><span className={`party-chip ${getPartyClassName(e.vote2021)}`}>{e.vote2021}</span></td>
                    <td><span className={`party-chip ${getPartyClassName(e.vote2024)}`}>{e.vote2024}</span></td>
                    <td><span className={`party-chip ${getPartyClassName(e.vote2026)}`}>{e.vote2026}</span></td>
                    <td><span className={`party-chip ${getPartyClassName(e.whoWillWin)}`}>{e.whoWillWin}</span></td>
                    <td className="num-col">{e.normalizedScore}</td>
                        </>
                      );
                    })()}
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

import { useState, useMemo } from "react";
import { ACS, formatAcSelectLabel, sortAcNames } from "../config";
import { getCasteLabel, getGenderLabel, getAgeLabel } from "../demographics";

const THRESHOLD_SEC = 35;

// Realistic survey time presets with descriptions
const THRESHOLD_PRESETS = [
  { value: 35,  label: "35s",  verdict: "Definitely Fake",        color: "#dc2626", emoji: "🔴" },
  { value: 60,  label: "60s",  verdict: "Almost Certainly Fake",  color: "#ea580c", emoji: "🔴" },
  { value: 90,  label: "90s",  verdict: "Highly Suspicious",      color: "#f97316", emoji: "🟠" },
  { value: 120, label: "120s", verdict: "Suspicious",             color: "#eab308", emoji: "🟡" },
  { value: 180, label: "180s", verdict: "Questionable",           color: "#84cc16", emoji: "🟡" },
  { value: 300, label: "300s", verdict: "Possibly Fast",          color: "#22c55e", emoji: "⚠️" },
];

const CASTE_BADGE_STYLES = {
  Nair:      { background: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" },
  Ezhava:    { background: "#dcfce7", color: "#166534", borderColor: "#86efac" },
  Muslim:    { background: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" },
  Christian: { background: "#ede9fe", color: "#5b21b6", borderColor: "#c4b5fd" },
  "SC/ST":   { background: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" },
  Others:    { background: "#e2e8f0", color: "#334155", borderColor: "#cbd5e1" },
  Unknown:   { background: "#f1f5f9", color: "#64748b", borderColor: "#e2e8f0" },
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

function parseTimestamp(ts) {
  if (!ts) return null;
  const s = String(ts).trim();
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T ](\d{1,2}):(\d{2}):(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3], +iso[4], +iso[5], +iso[6]);
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?/i);
  if (us) {
    let h = +us[4];
    const ampm = (us[7] || "").toUpperCase();
    if (ampm === "AM" && h === 12) h = 0;
    if (ampm === "PM" && h !== 12) h += 12;
    return new Date(+us[3], +us[1] - 1, +us[2], h, +us[5], +us[6]);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function fmtSec(sec) {
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function getThresholdVerdict(sec) {
  if (sec <= 35)  return { label: "Definitely Fake",       color: "#dc2626", emoji: "🔴" };
  if (sec <= 60)  return { label: "Almost Certainly Fake", color: "#ea580c", emoji: "🔴" };
  if (sec <= 90)  return { label: "Highly Suspicious",     color: "#f97316", emoji: "🟠" };
  if (sec <= 120) return { label: "Suspicious",            color: "#eab308", emoji: "🟡" };
  if (sec <= 180) return { label: "Questionable",          color: "#84cc16", emoji: "🟡" };
  return           { label: "Possibly Fast",               color: "#22c55e", emoji: "⚠️" };
}

function severityBg(sec) {
  if (sec <= 35)  return { bg: "#fef2f2", border: "#fca5a5", badge: "#dc2626" };
  if (sec <= 60)  return { bg: "#fff7ed", border: "#fdba74", badge: "#ea580c" };
  if (sec <= 90)  return { bg: "#fff7ed", border: "#fed7aa", badge: "#f97316" };
  if (sec <= 120) return { bg: "#fefce8", border: "#fde047", badge: "#eab308" };
  return           { bg: "#f0fdf4", border: "#86efac", badge: "#22c55e" };
}

export default function RapidEntryDetector({ entries, loading, onRefresh }) {
  const [threshold, setThreshold]           = useState(THRESHOLD_SEC);
  const [customThreshold, setCustomThreshold] = useState("");
  const [activeTab, setActiveTab]           = useState("pairs"); // "pairs" | "fa" | "scoreboard"
  const [filterFA, setFilterFA]             = useState("");
  const [filterAC, setFilterAC]             = useState("");
  const [searchTimestamp, setSearchTimestamp] = useState("");
  const [filterDate, setFilterDate]         = useState("");
  const [faSearch, setFaSearch]             = useState("");
  const [expandedPair, setExpandedPair]     = useState(null);
  const [expandedFA, setExpandedFA]         = useState(null);

  // ── Core analysis ──────────────────────────────────────────────
  const { allPairs, faStats, allFAs } = useMemo(() => {
    if (!entries || entries.length === 0)
      return { allPairs: [], faStats: {}, allFAs: [] };

    const byFA = {};
    entries.forEach(e => {
      const fa = e.faName || "Unknown";
      if (!byFA[fa]) byFA[fa] = [];
      byFA[fa].push(e);
    });

    const allFAs = Object.keys(byFA).sort();
    const allPairs = [];
    const faStats = {};

    for (const fa of Object.keys(byFA)) {
      const sorted = byFA[fa]
        .map(e => ({ ...e, _parsed: parseTimestamp(e.timestamp) }))
        .filter(e => e._parsed !== null)
        .sort((a, b) => a._parsed - b._parsed);

      let rapidCount = 0;
      let dupVotes = 0;
      let dupProfiles = 0;
      let minGap = Infinity;
      const gaps = [];

      for (let i = 1; i < sorted.length; i++) {
        const diffSec = Math.round((sorted[i]._parsed - sorted[i - 1]._parsed) / 1000);
        gaps.push(diffSec);
        if (diffSec < minGap) minGap = diffSec;

        // Duplicate vote check
        if (sorted[i].vote2026 && sorted[i].vote2026 === sorted[i - 1].vote2026) dupVotes++;
        // Duplicate profile (caste+gender+age label)
        const prof1 = `${getCasteLabel(sorted[i-1].ac, sorted[i-1].casteWeight)}_${getGenderLabel(sorted[i-1].ac, sorted[i-1].genderWeight, sorted[i-1].genderLabel)}_${getAgeLabel(sorted[i-1].ageWeight)}`;
        const prof2 = `${getCasteLabel(sorted[i].ac, sorted[i].casteWeight)}_${getGenderLabel(sorted[i].ac, sorted[i].genderWeight, sorted[i].genderLabel)}_${getAgeLabel(sorted[i].ageWeight)}`;
        if (prof1 === prof2 && prof1 !== "__") dupProfiles++;

        if (diffSec >= 0 && diffSec < threshold) {
          rapidCount++;
          // Build identical/different field list
          const checks = [
            { label: "AC",          v1: sorted[i-1].ac,        v2: sorted[i].ac },
            { label: "Caste",       v1: getCasteLabel(sorted[i-1].ac, sorted[i-1].casteWeight), v2: getCasteLabel(sorted[i].ac, sorted[i].casteWeight) },
            { label: "Gender",      v1: getGenderLabel(sorted[i-1].ac, sorted[i-1].genderWeight, sorted[i-1].genderLabel), v2: getGenderLabel(sorted[i].ac, sorted[i].genderWeight, sorted[i].genderLabel) },
            { label: "Age",         v1: getAgeLabel(sorted[i-1].ageWeight), v2: getAgeLabel(sorted[i].ageWeight) },
            { label: "Vote 2021",   v1: sorted[i-1].vote2021,  v2: sorted[i].vote2021 },
            { label: "Vote 2024",   v1: sorted[i-1].vote2024,  v2: sorted[i].vote2024 },
            { label: "Vote 2026",   v1: sorted[i-1].vote2026,  v2: sorted[i].vote2026 },
            { label: "Who Will Win",v1: sorted[i-1].whoWillWin,v2: sorted[i].whoWillWin },
          ];
          const same = checks.filter(c => String(c.v1||"") === String(c.v2||"") && String(c.v1||"") !== "");
          const diff = checks.filter(c => String(c.v1||"") !== String(c.v2||""));

          allPairs.push({
            fa,
            entry1: sorted[i - 1],
            entry2: sorted[i],
            diffSec,
            ts1: sorted[i - 1].timestamp,
            ts2: sorted[i].timestamp,
            same,
            diff,
          });

          if (!filterAC || sorted[i].ac === filterAC || sorted[i-1].ac === filterAC) {
            // included
          }
        }
      }

      // Suspicion score 0-100
      const total = sorted.length;
      const strikeRate = rapidCount / Math.max(total - 1, 1);
      const dupVoteRate = dupVotes / Math.max(total - 1, 1);
      const dupProfRate = dupProfiles / Math.max(total - 1, 1);
      let score = Math.min(strikeRate * 50, 40)
                + Math.min(dupVoteRate * 30, 25)
                + Math.min(dupProfRate * 30, 25);
      if (minGap < 5) score += 10;
      score = Math.min(Math.round(score), 100);

      const avgGap = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0;

      faStats[fa] = {
        fa,
        total,
        rapid: rapidCount,
        pct: ((rapidCount / Math.max(total - 1, 1)) * 100).toFixed(1),
        dupVotes,
        dupProfiles,
        minGap: minGap === Infinity ? null : minGap,
        avgGap,
        score,
      };
    }

    allPairs.sort((a, b) => a.diffSec - b.diffSec);
    return { allPairs, faStats, allFAs };
  }, [entries, threshold]);

  // ── Filtered pairs ──────────────────────────────────────────────
  const flaggedPairs = useMemo(() => {
    let result = filterAC
      ? allPairs.filter(p => p.entry1.ac === filterAC || p.entry2.ac === filterAC)
      : allPairs;
    if (filterFA) result = result.filter(p => p.fa === filterFA);
    if (searchTimestamp.trim()) {
      const q = searchTimestamp.trim().toLowerCase();
      result = result.filter(p =>
        String(p.ts1).toLowerCase().includes(q) || String(p.ts2).toLowerCase().includes(q)
      );
    }
    if (filterDate) {
      const toYmd = d => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : "";
      result = result.filter(p =>
        toYmd(p.entry1._parsed) === filterDate || toYmd(p.entry2._parsed) === filterDate
      );
    }
    return result;
  }, [allPairs, filterFA, filterAC, searchTimestamp, filterDate]);

  // ── FA scoreboard ───────────────────────────────────────────────
  const sortedFAStats = useMemo(() => {
    let list = Object.values(faStats);
    if (faSearch.trim()) {
      const q = faSearch.trim().toLowerCase();
      list = list.filter(s => s.fa.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.score - a.score);
  }, [faStats, faSearch]);

  const flaggedFAs     = Object.values(faStats).filter(s => s.rapid > 0).length;
  const highRiskFAs    = Object.values(faStats).filter(s => s.score >= 60).length;
  const totalFlagged   = allPairs.length;

  function getRisk(score) {
    if (score >= 60) return { label: "High Risk",   color: "#dc2626", bg: "#fef2f2" };
    if (score >= 35) return { label: "Medium Risk",  color: "#ea580c", bg: "#fff7ed" };
    if (score >= 15) return { label: "Low Risk",     color: "#eab308", bg: "#fefce8" };
    return              { label: "Clean",            color: "#16a34a", bg: "#f0fdf4" };
  }

  // ── Reusable entry detail card (replaces wide horizontal table) ──────────────
  function renderEntryCards(entry1, entry2, same, diff) {
    return (
      <div className="rapid-entry-cards-wrap">
        {[entry1, entry2].map((e, j) => {
          const casteLabel  = getCasteLabel(e.ac, e.casteWeight);
          const genderLabel = getGenderLabel(e.ac, e.genderWeight, e.genderLabel);
          const ageLabel    = getAgeLabel(e.ageWeight);
          const rowLabel    = e.sheetRow ? `Sheet Row ${e.sheetRow}` : `Entry ${j + 1}`;
          const isEntry2    = j === 1;
          return (
            <div key={j} className="rapid-entry-detail-card" style={{ borderColor: isEntry2 ? "#93c5fd" : "#fca5a5", background: isEntry2 ? "#eff6ff" : "#fef2f2" }}>
              {/* Row identity header */}
              <div className="rapid-entry-card-header">
                <span className="rapid-entry-row-badge" style={{ background: isEntry2 ? "#2563eb" : "#dc2626", color: "#fff" }}>
                  {isEntry2 ? "Entry 2" : "Entry 1"}
                </span>
                {e.sheetRow && (
                  <span className="rapid-entry-row-num">
                    🗃 Sheet Row <strong>#{e.sheetRow}</strong>
                  </span>
                )}
                <span className="rapid-entry-ts">{e.timestamp}</span>
              </div>
              {/* Fields grid */}
              <div className="rapid-entry-fields-grid">
                <div className="rapid-entry-field">
                  <span className="ref-field-label">AC</span>
                  <span className="ref-field-value">{formatAcSelectLabel(e.ac)}</span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">FA Name</span>
                  <span className="ref-field-value" style={{ fontWeight: 700 }}>{e.faName}</span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">Caste</span>
                  <span className="ref-field-value">
                    <span className="label-pill" style={CASTE_BADGE_STYLES[casteLabel] || CASTE_BADGE_STYLES.Others}>{casteLabel}</span>
                    <span style={{ color: "#94a3b8", fontSize: 10, marginLeft: 4 }}>wt:{e.casteWeight}</span>
                  </span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">Gender</span>
                  <span className="ref-field-value">
                    <span className="label-pill" style={getGenderStyle(genderLabel)}>{genderLabel}</span>
                    <span style={{ color: "#94a3b8", fontSize: 10, marginLeft: 4 }}>wt:{e.genderWeight}</span>
                  </span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">Age Group</span>
                  <span className="ref-field-value">
                    <span className="label-pill age-pill">{ageLabel}</span>
                    <span style={{ color: "#94a3b8", fontSize: 10, marginLeft: 4 }}>wt:{e.ageWeight}</span>
                  </span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">Vote 2021</span>
                  <span className="ref-field-value"><span className={`party-chip ${getPartyClassName(e.vote2021)}`}>{e.vote2021}</span></span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">Vote 2024</span>
                  <span className="ref-field-value"><span className={`party-chip ${getPartyClassName(e.vote2024)}`}>{e.vote2024}</span></span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">Vote 2026</span>
                  <span className="ref-field-value"><span className={`party-chip ${getPartyClassName(e.vote2026)}`}>{e.vote2026}</span></span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">Who Will Win</span>
                  <span className="ref-field-value"><span className={`party-chip ${getPartyClassName(e.whoWillWin)}`}>{e.whoWillWin}</span></span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">Norm Score</span>
                  <span className="ref-field-value" style={{ fontFamily: "monospace" }}>{e.normalizedScore ?? e.rawNormalizedScore}</span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">GevsVE</span>
                  <span className="ref-field-value" style={{ fontFamily: "monospace" }}>{e.gevsve}</span>
                </div>
                <div className="rapid-entry-field">
                  <span className="ref-field-label">Final Value</span>
                  <span className="ref-field-value" style={{ fontFamily: "monospace" }}>{e.finalValue}</span>
                </div>
              </div>
            </div>
          );
        })}
        {/* Diff summary */}
        <div className="rapid-entry-diff-row">
          {same && same.length > 0 && (
            <div className="rapid-diff-group">
              <span className="rapid-diff-icon" style={{ color: "#dc2626" }}>⚠</span>
              <span className="rapid-diff-title" style={{ color: "#dc2626" }}>Identical ({same.length}):</span>
              {same.map(c => (
                <span key={c.label} className="rapid-diff-chip rapid-diff-same">{c.label}: {String(c.v1)}</span>
              ))}
            </div>
          )}
          {diff && diff.length > 0 && (
            <div className="rapid-diff-group">
              <span className="rapid-diff-icon" style={{ color: "#16a34a" }}>✓</span>
              <span className="rapid-diff-title" style={{ color: "#16a34a" }}>Different ({diff.length}):</span>
              {diff.map(c => (
                <span key={c.label} className="rapid-diff-chip rapid-diff-diff">{c.label}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tracker-wrap">

      {/* ── Header ── */}
      <div className="rapid-header">
        <div className="rapid-header-text">
          <h3 className="rapid-title">
            <span className="mat-icon" style={{ fontSize: 22, verticalAlign: "middle", marginRight: 6, color: "#dc2626" }}>speed</span>
            Rapid Entry Detector &amp; Fake Entry Tracker
          </h3>
          <p className="rapid-subtitle">
            Flags consecutive entries by the same FA under <strong>{threshold}s</strong>.
            A real face-to-face survey takes <strong>3–5 minutes minimum</strong>. Anything under 35s is impossible.
          </p>
        </div>
        <button className="refresh-btn" onClick={onRefresh} disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {/* ── Realistic timing reference banner ── */}
      <div className="rapid-timing-banner">
        <div className="rapid-timing-title">⏱ Realistic Survey Timing Reference</div>
        <div className="rapid-timing-grid">
          <span>🔴 <strong>&lt;35s</strong> Definitely Fake</span>
          <span>🔴 <strong>&lt;60s</strong> Almost Certainly Fake</span>
          <span>🟠 <strong>&lt;90s</strong> Highly Suspicious</span>
          <span>🟡 <strong>&lt;120s</strong> Suspicious</span>
          <span>🟡 <strong>&lt;180s</strong> Questionable</span>
          <span>🟢 <strong>180s+</strong> Plausible (3 min genuine survey)</span>
        </div>
        <div className="rapid-timing-note">
          Steps: Greeting (30s) + 7 questions × 15–20s each + form fill (20s) + move to next person (30s) ≈ 3–5 min
        </div>
      </div>

      {/* ── Threshold preset bar ── */}
      <div className="rapid-threshold-bar">
        <div className="rapid-threshold-label">
          <span className="mat-icon" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>timer</span>
          Set Threshold:
        </div>
        <div className="rapid-threshold-presets">
          {THRESHOLD_PRESETS.map(t => (
            <button
              key={t.value}
              title={t.verdict}
              className={`rapid-threshold-btn ${threshold === t.value && !customThreshold ? "active" : ""}`}
              style={threshold === t.value && !customThreshold ? { background: t.color, borderColor: t.color, color: "#fff" } : {}}
              onClick={() => { setThreshold(t.value); setCustomThreshold(""); setExpandedPair(null); }}
            >
              <span>{t.emoji} {t.label}</span>
              <span className="rapid-threshold-btn-sub">{t.verdict}</span>
            </button>
          ))}
          <div className="rapid-threshold-custom">
            <input
              type="number"
              className="rapid-threshold-input"
              placeholder="Custom"
              value={customThreshold}
              min={1} max={600}
              onChange={e => {
                const v = e.target.value;
                setCustomThreshold(v);
                const n = parseInt(v, 10);
                if (n >= 1) { setThreshold(n); setExpandedPair(null); }
              }}
            />
            <span className="rapid-threshold-unit">sec</span>
          </div>
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div className="rapid-stats-row">
        {[
          { icon: "warning",      bg: "#fef2f2", color: "#dc2626", value: totalFlagged,            label: "Rapid pairs"       },
          { icon: "person_alert", bg: "#fff7ed", color: "#ea580c", value: flaggedFAs,              label: "FAs flagged"       },
          { icon: "crisis_alert", bg: "#fef2f2", color: "#991b1b", value: highRiskFAs,             label: "High-risk FAs"     },
          { icon: "group",        bg: "#eff6ff", color: "#2563eb", value: entries?.length || 0,    label: "Entries scanned"   },
          { icon: "timer",        bg: "#fefce8", color: "#ca8a04", value: `<${threshold}s`,        label: "Active threshold"  },
        ].map(s => (
          <div key={s.label} className="rapid-stat-card">
            <div className="rapid-stat-icon" style={{ background: s.bg, color: s.color }}>
              <span className="mat-icon">{s.icon}</span>
            </div>
            <div>
              <div className="rapid-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="rapid-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab navigation ── */}
      <div className="rapid-tabs">
        {[
          { id: "pairs",      icon: "compare_arrows", label: "Rapid Pairs",   count: flaggedPairs.length },
          { id: "fa",         icon: "manage_accounts", label: "FA Tracker",   count: flaggedFAs },
          { id: "scoreboard", icon: "leaderboard",     label: "Fake Scoreboard", count: highRiskFAs },
        ].map(t => (
          <button
            key={t.id}
            className={`rapid-tab-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="mat-icon" style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
            <span className="rapid-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════ TAB: RAPID PAIRS ══════════════════ */}
      {activeTab === "pairs" && (
        <>
          {/* Filters */}
          <div className="filter-bar">
            <div className="filter-group">
              <label className="filter-label">FA Name</label>
              <select className="filter-select" value={filterFA} onChange={e => { setFilterFA(e.target.value); setExpandedPair(null); }}>
                <option value="">All FAs</option>
                {allFAs.filter(fa => faStats[fa]?.rapid > 0).map(fa => (
                  <option key={fa} value={fa}>{fa} ({faStats[fa].rapid} strikes)</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">AC</label>
              <select className="filter-select" value={filterAC} onChange={e => setFilterAC(e.target.value)}>
                <option value="">All ACs</option>
                {sortAcNames(ACS).map(ac => (
                  <option key={ac} value={ac}>{formatAcSelectLabel(ac)}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Search Timestamp</label>
              <input
                type="text"
                className="filter-select rapid-ts-search"
                placeholder="e.g. 12:42  or  2026-04-02  or  AM"
                value={searchTimestamp}
                onChange={e => { setSearchTimestamp(e.target.value); setExpandedPair(null); }}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Filter Date</label>
              <input type="date" className="date-range-input tracker-date-input" value={filterDate}
                onChange={e => { setFilterDate(e.target.value); setExpandedPair(null); }} />
            </div>
            {(filterFA || filterAC || searchTimestamp || filterDate) && (
              <button className="clear-filters-btn" style={{ alignSelf: "flex-end" }}
                onClick={() => { setFilterFA(""); setFilterAC(""); setSearchTimestamp(""); setFilterDate(""); }}>
                ✕ Clear All
              </button>
            )}
          </div>

          <div className="fa-table-section">
            <div className="section-label">
              ⚡ Rapid Entry Pairs
              {filterFA && <span style={{ fontWeight: 400, color: "#64748b" }}> — {filterFA}</span>}
              {searchTimestamp && <span style={{ fontWeight: 400, color: "#2563eb" }}> — "{searchTimestamp}"</span>}
              {filterDate && <span style={{ fontWeight: 400, color: "#7c3aed" }}> — {filterDate}</span>}
              <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 8 }}>
                ({flaggedPairs.length}{flaggedPairs.length !== totalFlagged ? ` of ${totalFlagged}` : ""} pair{flaggedPairs.length !== 1 ? "s" : ""})
              </span>
            </div>

            {flaggedPairs.length === 0 ? (
              <div className="rapid-empty">
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>No rapid entries found</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  {entries?.length
                    ? `Scanned ${entries.length} entries — no FA had consecutive entries within ${threshold}s.`
                    : "Load entries first using the date range or Cumulative mode."}
                </div>
              </div>
            ) : (
              <div className="rapid-pairs-list">
                {flaggedPairs.map((p, i) => {
                  const sev = severityBg(p.diffSec);
                  const verdict = getThresholdVerdict(p.diffSec);
                  const isExpanded = expandedPair === i;
                  const row1 = p.entry1.sheetRow ? `Row #${p.entry1.sheetRow}` : "Entry 1";
                  const row2 = p.entry2.sheetRow ? `Row #${p.entry2.sheetRow}` : "Entry 2";
                  return (
                    <div key={i} className="rapid-pair-card" style={{ borderColor: sev.border, background: sev.bg }}>
                      <div className="rapid-pair-head" style={{ cursor: "pointer" }}
                        onClick={() => setExpandedPair(isExpanded ? null : i)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, color: "#64748b", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                          <span className="rapid-pair-fa">{p.fa}</span>
                          <span className="rapid-pair-badge" style={{ background: sev.badge }}>{fmtSec(p.diffSec)} gap</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: verdict.color, background: verdict.color + "15", padding: "2px 8px", borderRadius: 6, border: `1px solid ${verdict.color}30` }}>
                            {verdict.emoji} {verdict.label}
                          </span>
                          {p.entry1.sheetRow && (
                            <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>
                              {row1} → {row2}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: p.same.length >= 5 ? "#dc2626" : "#64748b", fontWeight: p.same.length >= 5 ? 700 : 400 }}>
                          {p.same.length} identical fields
                        </span>
                      </div>

                      {/* Compact always-visible row */}
                      <div className="rapid-pair-entries">
                        <div className="rapid-pair-entry">
                          <span className="rapid-pair-label" style={{ background: "#fca5a5", color: "#7f1d1d" }}>{row1}</span>
                          <span className="rapid-pair-ts">{p.ts1}</span>
                          <span className="rapid-pair-ac">{formatAcSelectLabel(p.entry1.ac)}</span>
                          <span className={`party-chip ${getPartyClassName(p.entry1.whoWillWin)}`}>{p.entry1.whoWillWin}</span>
                        </div>
                        <div className="rapid-pair-arrow">⬇ {fmtSec(p.diffSec)}</div>
                        <div className="rapid-pair-entry">
                          <span className="rapid-pair-label" style={{ background: "#93c5fd", color: "#1e3a8a" }}>{row2}</span>
                          <span className="rapid-pair-ts">{p.ts2}</span>
                          <span className="rapid-pair-ac">{formatAcSelectLabel(p.entry2.ac)}</span>
                          <span className={`party-chip ${getPartyClassName(p.entry2.whoWillWin)}`}>{p.entry2.whoWillWin}</span>
                        </div>
                      </div>

                      {/* Expanded full entry cards */}
                      {isExpanded && (
                        <div className="rapid-detail-table-wrap">
                          {renderEntryCards(p.entry1, p.entry2, p.same, p.diff)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════ TAB: FA TRACKER ══════════════════ */}
      {activeTab === "fa" && (
        <div className="fa-table-section">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <div className="filter-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="filter-label">Search FA by name</label>
              <input
                type="text"
                className="filter-select rapid-ts-search"
                placeholder="Type FA name…"
                value={faSearch}
                onChange={e => setFaSearch(e.target.value)}
              />
            </div>
            {faSearch && (
              <button className="clear-filters-btn" style={{ alignSelf: "flex-end" }} onClick={() => setFaSearch("")}>✕ Clear</button>
            )}
          </div>

          {sortedFAStats.filter(s => s.rapid > 0).length === 0 ? (
            <div className="rapid-empty">
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 700 }}>No flagged FAs</div>
            </div>
          ) : (
            sortedFAStats.filter(s => s.rapid > 0).map(s => {
              const risk = getRisk(s.score);
              const isExpanded = expandedFA === s.fa;
              const faPairs = allPairs.filter(p => p.fa === s.fa);
              return (
                <div key={s.fa} className="rapid-fa-expand-card" style={{ borderColor: risk.color + "44", background: risk.bg }}>
                  <div className="rapid-fa-expand-head" onClick={() => setExpandedFA(isExpanded ? null : s.fa)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1 }}>
                      <span style={{ fontSize: 13, color: "#64748b", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{s.fa}</span>
                      <span className="label-pill" style={{ background: risk.color + "18", color: risk.color, borderColor: risk.color + "40", fontWeight: 800, fontSize: 10 }}>
                        {risk.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="rapid-stat-pill" style={{ background: "#fef2f2", color: "#dc2626" }}>⚡ {s.rapid} strikes</span>
                      <span className="rapid-stat-pill" style={{ background: "#eff6ff", color: "#2563eb" }}>📊 {s.total} entries</span>
                      <span className="rapid-stat-pill" style={{ background: "#fff7ed", color: "#ea580c" }}>⏱ avg {s.avgGap}s</span>
                      {s.minGap !== null && <span className="rapid-stat-pill" style={{ background: "#fef2f2", color: "#dc2626" }}>⚡ min {s.minGap}s</span>}
                      <span className="rapid-stat-pill" style={{ background: "#fdf4ff", color: "#7e22ce" }}>🔁 {s.dupVotes} dup votes</span>
                      <span className="rapid-stat-pill" style={{ background: "#fdf4ff", color: "#7e22ce" }}>👥 {s.dupProfiles} dup profiles</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${risk.color}22`, paddingTop: 14, marginTop: 4 }}>
                      <div style={{ marginBottom: 10, fontSize: 12, color: "#64748b" }}>
                        Fake Score: <strong style={{ color: risk.color, fontSize: 16 }}>{s.score}/100</strong>
                        &nbsp;·&nbsp; Strike rate: {s.pct}%
                        &nbsp;·&nbsp; {s.rapid} pairs under {threshold}s
                      </div>
                      {faPairs.map((p, idx) => {
                        const sev = severityBg(p.diffSec);
                        const verdict = getThresholdVerdict(p.diffSec);
                        const pid = `fa_${s.fa}_${idx}`;
                        const isExpP = expandedPair === pid;
                        const row1 = p.entry1.sheetRow ? `Row #${p.entry1.sheetRow}` : "Entry 1";
                        const row2 = p.entry2.sheetRow ? `Row #${p.entry2.sheetRow}` : "Entry 2";
                        return (
                          <div key={idx} className="rapid-pair-card" style={{ borderColor: sev.border, background: sev.bg, marginBottom: 8 }}>
                            <div className="rapid-pair-head" style={{ cursor: "pointer" }} onClick={() => setExpandedPair(isExpP ? null : pid)}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 12, transition: "transform 0.2s", transform: isExpP ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                                <span className="rapid-pair-badge" style={{ background: sev.badge }}>Strike #{idx + 1} — {fmtSec(p.diffSec)} gap</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: verdict.color }}>{verdict.emoji} {verdict.label}</span>
                                {p.entry1.sheetRow && (
                                  <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{row1} → {row2}</span>
                                )}
                              </div>
                              <span style={{ fontSize: 11, color: p.same.length >= 5 ? "#dc2626" : "#94a3b8" }}>{p.same.length} identical fields</span>
                            </div>
                            <div className="rapid-pair-entries">
                              <div className="rapid-pair-entry">
                                <span className="rapid-pair-label" style={{ background: "#fca5a5", color: "#7f1d1d" }}>{row1}</span>
                                <span className="rapid-pair-ts">{p.ts1}</span>
                                <span className="rapid-pair-ac">{formatAcSelectLabel(p.entry1.ac)}</span>
                                <span className={`party-chip ${getPartyClassName(p.entry1.whoWillWin)}`}>{p.entry1.whoWillWin}</span>
                              </div>
                              <div className="rapid-pair-arrow">⬇ {fmtSec(p.diffSec)}</div>
                              <div className="rapid-pair-entry">
                                <span className="rapid-pair-label" style={{ background: "#93c5fd", color: "#1e3a8a" }}>{row2}</span>
                                <span className="rapid-pair-ts">{p.ts2}</span>
                                <span className="rapid-pair-ac">{formatAcSelectLabel(p.entry2.ac)}</span>
                                <span className={`party-chip ${getPartyClassName(p.entry2.whoWillWin)}`}>{p.entry2.whoWillWin}</span>
                              </div>
                            </div>
                            {isExpP && (
                              <div className="rapid-detail-table-wrap">
                                {renderEntryCards(p.entry1, p.entry2, p.same, p.diff)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════ TAB: FAKE SCOREBOARD ══════════════════ */}
      {activeTab === "scoreboard" && (
        <div className="fa-table-section">
          <div className="section-label">🎯 Fake Scoreboard — All FAs ranked by suspicion score</div>
          <div style={{ marginBottom: 14, padding: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 12, lineHeight: 1.8 }}>
            <strong>📐 Score formula (0–100):</strong>&nbsp;
            Strike rate → up to 40 pts &nbsp;|&nbsp;
            Duplicate votes → up to 25 pts &nbsp;|&nbsp;
            Duplicate profiles → up to 25 pts &nbsp;|&nbsp;
            Any gap &lt;5s → +10 pts bonus
          </div>
          <div className="table-wrap">
            <table className="fa-summary-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>FA Name</th>
                  <th>Fake Score</th>
                  <th>Risk Level</th>
                  <th>Strikes</th>
                  <th>Entries</th>
                  <th>Strike Rate</th>
                  <th>Avg Gap</th>
                  <th>Min Gap</th>
                  <th>Dup Votes</th>
                  <th>Dup Profiles</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(faStats)
                  .sort((a, b) => b.score - a.score)
                  .map((s, i) => {
                    const risk = getRisk(s.score);
                    return (
                      <tr
                        key={s.fa}
                        className={`${i % 2 === 0 ? "row-even" : "row-odd"} rapid-fa-row`}
                        style={{ cursor: "pointer" }}
                        onClick={() => { setActiveTab("fa"); setFaSearch(s.fa); setExpandedFA(s.fa); }}
                        title="Click to view details in FA Tracker"
                      >
                        <td className="num-col" style={{ fontWeight: 700 }}>#{i + 1}</td>
                        <td style={{ fontWeight: 700 }}>{s.fa}</td>
                        <td className="num-col">
                          <span style={{
                            display: "inline-block", padding: "3px 10px", borderRadius: 999,
                            background: risk.color + "18", color: risk.color,
                            fontWeight: 800, fontSize: 13, border: `1px solid ${risk.color}44`,
                          }}>{s.score}</span>
                        </td>
                        <td>
                          <span className="label-pill" style={{ background: risk.color + "18", color: risk.color, borderColor: risk.color + "40", fontWeight: 800, fontSize: 10 }}>
                            {risk.label}
                          </span>
                        </td>
                        <td className="num-col" style={{ color: s.rapid > 0 ? "#dc2626" : "#16a34a", fontWeight: 800 }}>{s.rapid}</td>
                        <td className="num-col">{s.total}</td>
                        <td className="num-col" style={{ color: parseFloat(s.pct) > 50 ? "#dc2626" : "#64748b", fontWeight: parseFloat(s.pct) > 50 ? 700 : 400 }}>{s.pct}%</td>
                        <td className="num-col">{s.avgGap}s</td>
                        <td className="num-col" style={{ color: s.minGap !== null && s.minGap < 10 ? "#dc2626" : "#64748b" }}>{s.minGap !== null ? `${s.minGap}s` : "—"}</td>
                        <td className="num-col" style={{ color: s.dupVotes > 0 ? "#7e22ce" : "#64748b" }}>{s.dupVotes}</td>
                        <td className="num-col" style={{ color: s.dupProfiles > 0 ? "#7e22ce" : "#64748b" }}>{s.dupProfiles}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


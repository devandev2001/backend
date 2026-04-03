import { useState, useMemo, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";
import { getCasteLabel, getGenderLabel, getAgeLabel } from "../demographics";
import { ACS, formatAcSelectLabel, sortAcNames } from "../config";

const CASTE_COLORS = {
  Nair:      "#3b82f6",
  Ezhava:    "#10b981",
  Muslim:    "#f59e0b",
  Christian: "#8b5cf6",
  "SC/ST":   "#ef4444",
  Others:    "#6b7280",
  Unknown:   "#cbd5e1",
};

const GENDER_COLORS = { Male: "#3b82f6", Female: "#ec4899" };
const AGE_COLOR  = "#6366f1";
const V21_COLOR  = "#2563eb";
const V24_COLOR  = "#059669";

const VOTE_PARTIES = ["LDF", "UDF", "BJP/NDA", "Others", "NOTA", "Not Voted"];
const VOTE_COLORS  = {
  LDF: "#dc2626", UDF: "#2563eb", "BJP/NDA": "#ea580c", Others: "#6b7280", NOTA: "#94a3b8",
  "Not Voted": "#92400e",
};
const WHO_WIN_ORDER = ["LDF", "UDF", "BJP/NDA", "Others"];
const CORE_PARTIES = ["LDF", "UDF", "BJP/NDA", "Others"];
const SHEET_PARTY_ORDER = ["LDF", "UDF", "BJP/NDA", "Others", "Not Voted", "NOTA", "Blank"];

function pct(count, total) {
  return total === 0 ? 0 : +((count / total) * 100).toFixed(1);
}

function normalizeCoreParty(v) {
  const s = String(v || "").trim().toUpperCase().replace(/\s+/g, "");
  if (s === "LDF") return "LDF";
  if (s === "UDF") return "UDF";
  if (s === "BJP/NDA" || s === "BJP-NDA" || s === "BJPNDA" || s === "BJP" || s === "NDA") return "BJP/NDA";
  return "Others";
}

function normalizeSheetParty(v) {
  const raw = String(v || "").trim();
  if (!raw) return "Blank";
  const key = raw.toUpperCase().replace(/\s+/g, "");
  if (key === "LDF") return "LDF";
  if (key === "UDF") return "UDF";
  if (key === "BJP/NDA" || key === "BJP-NDA" || key === "BJPNDA" || key === "BJP" || key === "NDA") return "BJP/NDA";
  if (key === "NOTVOTED" || key === "NOT-VOTED" || key === "DIDNOTVOTE") return "Not Voted";
  if (key === "NOTA") return "NOTA";
  if (key === "OTHERS" || key === "OTHER") return "Others";
  return raw;
}

function sortPartyLabels(labels) {
  const orderIndex = new Map(SHEET_PARTY_ORDER.map((p, i) => [p, i]));
  return [...labels].sort((a, b) => {
    const ia = orderIndex.has(a) ? orderIndex.get(a) : 999;
    const ib = orderIndex.has(b) ? orderIndex.get(b) : 999;
    if (ia !== ib) return ia - ib;
    return String(a).localeCompare(String(b));
  });
}

function useAnalyticsData(entries) {
  return useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        caste: [], gender: [], age: [], vote2021: [], vote2024: [], vote2026: [], whoWillWin: [],
        total: 0,
      };
    }

    const casteMap = {};
    const genderMap = {};
    const ageMap = {};
    const v21Map = {};
    const v24Map = {};
    const v26Map = {};
    const whoMap = {};
    entries.forEach(e => {
      const ac = String(e.ac || "").trim();
      const norm = Number.parseFloat(e.normalizedScore);
      // Use finalValue/normalizedScore as weight; fall back to 1 so entries with a
      // missing/zero score are still counted rather than silently dropped.
      const weight = (Number.isFinite(norm) && norm > 0) ? norm : 1;

      // Caste — prefer the already-resolved casteLabel column from the API;
      // fall back to weight-based lookup only when the label is absent/blank.
      const rawCasteLabel = String(e.casteLabel ?? "").trim();
      const casteLabel = rawCasteLabel
        ? getCasteLabel(ac, rawCasteLabel)   // canonicalises spelling variants
        : getCasteLabel(ac, e.casteWeight);  // older rows that only have a weight
      casteMap[casteLabel] = (casteMap[casteLabel] || 0) + 1;

      // Gender — prefer genderLabel text column, fall back to weight lookup
      const gLabel = getGenderLabel(ac, e.genderWeight, e.genderLabel);
      genderMap[gLabel] = (genderMap[gLabel] || 0) + 1;

      // Age — prefer ageLabel text column from the API; fall back to weight proximity
      const rawAgeLabel = String(e.ageLabel ?? "").trim();
      const aLabel = rawAgeLabel ? getAgeLabel(rawAgeLabel) : getAgeLabel(e.ageWeight);
      ageMap[aLabel] = (ageMap[aLabel] || 0) + 1;

      // Vote 2021
      const v21 = String(e.vote2021 || "").trim() || "Others";
      const v21key = VOTE_PARTIES.includes(v21) ? v21 : "Others";
      v21Map[v21key] = (v21Map[v21key] || 0) + 1;

      // Vote 2024
      const v24 = String(e.vote2024 || "").trim() || "Others";
      const v24key = VOTE_PARTIES.includes(v24) ? v24 : "Others";
      v24Map[v24key] = (v24Map[v24key] || 0) + 1;

      // Vote 2026 AE (SUM of finalValue per party, then % of row total)
      const v26 = String(e.vote2026 || "").trim() || "Others";
      const v26key = VOTE_PARTIES.includes(v26) ? v26 : "Others";
      v26Map[v26key] = (v26Map[v26key] || 0) + weight;

      // Who will win (SUM of finalValue per party, then % of row total)
      const ww = String(e.whoWillWin || "").trim() || "Others";
      const wwKey = WHO_WIN_ORDER.includes(ww) ? ww : "Others";
      whoMap[wwKey] = (whoMap[wwKey] || 0) + weight;
    });

    const total = entries.length;

    const caste = Object.entries(casteMap)
      .filter(([name]) => name !== "Unknown")
      .map(([name, count]) => ({ name, count, value: pct(count, total) }));

    const gender = Object.entries(genderMap)
      .filter(([name]) => name !== "Unknown")
      .map(([name, count]) => ({ name, count, value: pct(count, total) }));

    const AGE_ORDER = ["18-19","20-29","30-39","40-49","50-59","60-69","70-79","80+"];
    const age = AGE_ORDER.filter(k => ageMap[k]).map(k => ({
      name: k, count: ageMap[k], value: pct(ageMap[k], total),
    }));

    const vote2021 = VOTE_PARTIES.filter(p => v21Map[p]).map(p => ({
      name: p, count: v21Map[p], value: pct(v21Map[p], total),
    }));

    const vote2024 = VOTE_PARTIES.filter(p => v24Map[p]).map(p => ({
      name: p, count: v24Map[p], value: pct(v24Map[p], total),
    }));

    // Vote 2026: SUM of Final Values per party, shown as % of total (matches pivot)
    const vote2026Total = Object.values(v26Map).reduce((s, n) => s + n, 0);
    const vote2026 = VOTE_PARTIES.filter(p => v26Map[p]).map(p => ({
      name: p,
      count: +v26Map[p].toFixed(6),
      value: vote2026Total > 0 ? +((v26Map[p] / vote2026Total) * 100).toFixed(1) : 0,
    }));

    // Who will win: SUM of Final Values per party, shown as % of total (matches pivot)
    const whoTotal = Object.values(whoMap).reduce((s, n) => s + n, 0);
    const whoWillWin = WHO_WIN_ORDER.filter(p => whoMap[p]).map(p => ({
      name: p,
      count: +whoMap[p].toFixed(6),
      value: whoTotal > 0 ? +((whoMap[p] / whoTotal) * 100).toFixed(1) : 0,
    }));

    return { caste, gender, age, vote2021, vote2024, vote2026, whoWillWin, total };
  }, [entries]);
}

/** Percentage share within that year, drawn above each bar (uses row.partyPct). */
function PartySwingPctLabel({ x, y, width, height, value, payload, partyKey }) {
  const n = Number(value);
  if (!partyKey || !payload || !Number.isFinite(n) || n <= 0) return null;
  const pc = payload.partyPct && payload.partyPct[partyKey];
  if (pc == null) return null;
  const cx = (Number(x) || 0) + (Number(width) || 0) / 2;
  const cy = (Number(y) || 0) - 4;
  return (
    <text x={cx} y={cy} fill="#334155" fontSize={11} fontWeight={700} textAnchor="middle">
      {`${pc}%`}
    </text>
  );
}

function DonutChart({ data, colors, title }) {
  if (!data.length) return (
    <div className="analytics-card">
      <h3 className="analytics-card-title">{title}</h3>
      <div className="analytics-empty">No data</div>
    </div>
  );

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
    if (value < 4) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
        fontSize={12} fontWeight="700">
        {`${value}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <strong>{d.name}</strong>: {d.value}% ({d.count})
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-card">
      <h3 className="analytics-card-title">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%"
            innerRadius={60} outerRadius={100} labelLine={false} label={<CustomLabel />}>
            {data.map((d) => (
              <Cell key={d.name} fill={colors[d.name] || "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Main election-style chart: vertical bars, full width, high contrast. */
function PartyHeroChart({ data, colors, title, subtitle }) {
  if (!data.length) {
    return (
      <div className="analytics-card analytics-card-hero">
        <h3 className="analytics-hero-title">{title}</h3>
        <div className="analytics-empty" style={{ padding: "32px 16px" }}>No prediction data for this filter.</div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <strong>{d.name}</strong>: {d.value}% (weighted score {d.count})
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-card analytics-card-hero">
      <h3 className="analytics-hero-title">{title}</h3>
      <p className="analytics-hero-sub">
        {subtitle}
      </p>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={data}
          margin={{ top: 28, right: 20, left: 4, bottom: 16 }}
          barCategoryGap="18%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 13, fontWeight: 800, fill: "#0f172a" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(30, 58, 138, 0.06)" }} />
          <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={88}>
            {data.map((entry, i) => (
              <Cell key={i} fill={colors[entry.name] || "#64748b"} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v) => `${v}%`}
              style={{ fontSize: 15, fontWeight: 800, fill: "#0f172a" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HBarChart({ data, color, colors, title, fixedHeight, vertical = false }) {
  if (!data.length) return (
    <div className="analytics-card">
      <h3 className="analytics-card-title">{title}</h3>
      <div className="analytics-empty">No data</div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <strong>{label}</strong>: {d.value}% ({d.count})
        </div>
      );
    }
    return null;
  };

  const barColor = (entry) => colors ? (colors[entry.name] || "#94a3b8") : color;

  if (vertical) {
    return (
      <div className="analytics-card">
        <h3 className="analytics-card-title">{title}</h3>
        <ResponsiveContainer width="100%" height={fixedHeight || 280}>
          <BarChart data={data} margin={{ top: 14, right: 20, left: 6, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#1e3a5f", fontWeight: 700 }} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "#64748b" }}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72}>
              {data.map((entry, i) => (
                <Cell key={i} fill={barColor(entry)} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v) => `${v}%`}
                style={{ fontSize: 11, fill: "#1e3a5f", fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="analytics-card">
      <h3 className="analytics-card-title">{title}</h3>
      <ResponsiveContainer width="100%" height={fixedHeight || Math.max(180, data.length * 44 + 40)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, left: 12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis type="category" dataKey="name" width={72}
            tick={{ fontSize: 12, fill: "#1e3a5f" }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={barColor(entry)} />
            ))}
            <LabelList dataKey="value" position="right"
              formatter={v => `${v}%`}
              style={{ fontSize: 11, fill: "#1e3a5f", fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Analytics({ entries, loading, selectedAC = "", onSelectedACChange }) {
  const [filterAC, setFilterAC] = useState("");
  const [filterFA, setFilterFA] = useState("");
  const [trendCaste, setTrendCaste] = useState("Nair");

  useEffect(() => {
    if (selectedAC && selectedAC !== filterAC) {
      setFilterAC(selectedAC);
      setFilterFA("");
    }
  }, [selectedAC]);

  const faNames = useMemo(() => {
    if (!entries) return [];
    const src = filterAC ? entries.filter(e => e.ac === filterAC) : entries;
    return [...new Set(src.map(e => e.faName))].filter(Boolean).sort();
  }, [entries, filterAC]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter(e => {
      if (filterAC && e.ac !== filterAC) return false;
      if (filterFA && e.faName !== filterFA) return false;
      return true;
    });
  }, [entries, filterAC, filterFA]);

  const { caste, gender, age, vote2021, vote2024, vote2026, whoWillWin, total } = useAnalyticsData(filtered);
  const casteOptions = ["Nair", "Ezhava", "Muslim", "Christian", "SC/ST", "Others"];

  const casteYearCountData = useMemo(() => {
    const years = [
      { label: "2021", key: "vote2021" },
      { label: "2024", key: "vote2024" },
      { label: "2026", key: "vote2026" },
    ];

    const rows = years.map(y => ({
      year: y.label,
      LDF: 0,
      UDF: 0,
      "BJP/NDA": 0,
      Others: 0,
      total: 0,
    }));

    if (!filtered?.length) return rows;

    filtered.forEach((e) => {
      const rawCasteLabel = String(e.casteLabel ?? "").trim();
      const c = rawCasteLabel
        ? getCasteLabel(e.ac, rawCasteLabel)
        : getCasteLabel(e.ac, e.casteWeight);
      if (c !== trendCaste) return;

      years.forEach((y, idx) => {
        const p = normalizeCoreParty(e[y.key]);
        rows[idx][p] += 1;
        rows[idx].total += 1;
      });
    });

    return rows;
  }, [filtered, trendCaste]);

  /** One row per year; each party is a bar series (x = year, grouped bars = party). */
  const { partySwingByYearRows, partySwingParties } = useMemo(() => {
    const yearDefs = [
      { key: "vote2021", label: "2021" },
      { key: "vote2024", label: "2024" },
      { key: "vote2026", label: "2026" },
    ];
    const totals = { "2021": 0, "2024": 0, "2026": 0 };
    const labels = new Set();
    const countsByYear = { "2021": {}, "2024": {}, "2026": {} };

    (filtered || []).forEach((e) => {
      yearDefs.forEach((y) => {
        const p = normalizeSheetParty(e[y.key]);
        labels.add(p);
        countsByYear[y.label][p] = (countsByYear[y.label][p] || 0) + 1;
        totals[y.label] += 1;
      });
    });

    const parties = sortPartyLabels(labels);
    const rows = ["2021", "2024", "2026"].map((yl) => {
      const t = totals[yl];
      const row = { year: yl, partyPct: {} };
      parties.forEach((party) => {
        const c = countsByYear[yl][party] || 0;
        row[party] = c;
        row.partyPct[party] = pct(c, t);
      });
      return row;
    });

    return { partySwingByYearRows: rows, partySwingParties: parties };
  }, [filtered]);

  const intentVsWinnerData = useMemo(() => {
    const voteMap = {};
    const winMap = {};
    const labels = new Set();
    (filtered || []).forEach((e) => {
      const v = normalizeSheetParty(e.vote2026);
      const w = normalizeSheetParty(e.whoWillWin);
      labels.add(v);
      labels.add(w);
      voteMap[v] = (voteMap[v] || 0) + 1;
      winMap[w] = (winMap[w] || 0) + 1;
    });
    return sortPartyLabels(labels).map((party) => ({
      party,
      vote2026: voteMap[party] || 0,
      whoWillWin: winMap[party] || 0,
      gap: (winMap[party] || 0) - (voteMap[party] || 0),
    }));
  }, [filtered]);

  const acCompetitiveness = useMemo(() => {
    const byAc = {};
    (filtered || []).forEach((e) => {
      const ac = String(e.ac || "").trim() || "Unknown";
      if (!byAc[ac]) byAc[ac] = { LDF: 0, UDF: 0, "BJP/NDA": 0, Others: 0 };
      const p = normalizeCoreParty(e.vote2026);
      byAc[ac][p] += 1;
    });

    const rows = Object.entries(byAc).map(([ac, c]) => {
      const ordered = [...CORE_PARTIES]
        .map((p) => ({ party: p, count: c[p] || 0 }))
        .sort((a, b) => b.count - a.count);
      const top = ordered[0] || { party: "Others", count: 0 };
      const second = ordered[1] || { party: "Others", count: 0 };
      const totalVotes = ordered.reduce((s, x) => s + x.count, 0);
      return {
        ac,
        leader: top.party,
        leaderCount: top.count,
        second: second.party,
        secondCount: second.count,
        margin: top.count - second.count,
        marginPct: pct(top.count - second.count, totalVotes || 1),
        totalVotes,
      };
    });

    return rows.sort((a, b) => a.margin - b.margin);
  }, [filtered]);

  const filterLabel = [
    filterAC ? formatAcSelectLabel(filterAC) : "All ACs",
    filterFA || "All FAs",
  ].join(" › ");

  if (loading) {
    return <div className="loading-msg" style={{ marginTop: 40 }}>Loading analytics…</div>;
  }

  return (
    <div className="analytics-wrap">
      <div className="analytics-header">
        <h2 className="analytics-title">Analytics</h2>
        <span className="analytics-scope">{filterLabel} — {total} entries</span>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="filter-group">
          <label className="filter-label">Assembly Constituency</label>
          <select className="filter-select" value={filterAC}
            onChange={e => {
              const v = e.target.value;
              setFilterAC(v);
              setFilterFA("");
              if (onSelectedACChange) onSelectedACChange(v);
            }}>
            <option value="">All ACs</option>
            {sortAcNames(ACS).map(ac => (
              <option key={ac} value={ac}>{formatAcSelectLabel(ac)}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Field Assistant</label>
          <select className="filter-select" value={filterFA}
            onChange={e => setFilterFA(e.target.value)}>
            <option value="">All FAs</option>
            {faNames.map(fa => <option key={fa} value={fa}>{fa}</option>)}
          </select>
        </div>
        {(filterAC || filterFA) && (
          <button className="clear-btn" style={{ alignSelf: "flex-end" }}
            onClick={() => {
              setFilterAC("");
              setFilterFA("");
              if (onSelectedACChange) onSelectedACChange("");
            }}>
            ✕ Clear
          </button>
        )}
      </div>

      {(!filtered || filtered.length === 0) && (
        <div className="info-banner" style={{ marginTop: 12 }}>
          No entries for the selected filters.
        </div>
      )}

      {filtered.length > 0 && (
        <div className="analytics-row">
          <PartyHeroChart
            data={whoWillWin}
            colors={VOTE_COLORS}
            title="Who will win — 2026 prediction"
            subtitle="Share by predicted winner using normalized score weights (0–100% scale)."
          />
          <PartyHeroChart
            data={vote2026}
            colors={VOTE_COLORS}
            title="Who will you vote for — 2026"
            subtitle="Share by stated 2026 vote using normalized score weights (0–100% scale)."
          />
        </div>
      )}

      <div className="analytics-row analytics-row-three">
        <DonutChart data={caste}  colors={CASTE_COLORS}  title="Caste Distribution" />
        <DonutChart data={gender} colors={GENDER_COLORS} title="Gender Distribution" />
        <HBarChart data={age} color={AGE_COLOR} title="Age Group Distribution" fixedHeight={260} />
      </div>

      <div className="analytics-row">
        <HBarChart data={vote2021} colors={VOTE_COLORS} title="Vote 2021 AE" vertical />
        <HBarChart data={vote2024} colors={VOTE_COLORS} title="Vote 2024 GE" vertical />
      </div>

      <div className="analytics-row single">
        <div className="analytics-card analytics-card-hero analytics-trend-card">
          <div className="analytics-trend-head">
            <div>
              <h3 className="analytics-hero-title" style={{ margin: 0 }}>Caste-wise voting count by year</h3>
              <p className="analytics-hero-sub" style={{ margin: "6px 0 0" }}>
                Raw count by party for 2021, 2024, and 2026 from the selected caste.
              </p>
            </div>
            <div className="analytics-trend-select-wrap">
              <label className="filter-label">Select caste</label>
              <select className="filter-select analytics-trend-select" value={trendCaste} onChange={(e) => setTrendCaste(e.target.value)}>
                {casteOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="analytics-trend-chip-row">
            <span className="analytics-trend-chip">{filterAC ? formatAcSelectLabel(filterAC) : "All ACs"}</span>
            <span className="analytics-trend-chip">{trendCaste}</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={casteYearCountData} margin={{ top: 20, right: 20, left: 8, bottom: 8 }} barCategoryGap="22%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#0f172a", fontWeight: 800 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#475569" }} />
              <Tooltip
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Legend />
              <Bar dataKey="LDF" fill={VOTE_COLORS.LDF} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="LDF" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#0f172a" }} />
              </Bar>
              <Bar dataKey="UDF" fill={VOTE_COLORS.UDF} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="UDF" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#0f172a" }} />
              </Bar>
              <Bar dataKey="BJP/NDA" fill={VOTE_COLORS["BJP/NDA"]} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="BJP/NDA" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#0f172a" }} />
              </Bar>
              <Bar dataKey="Others" fill={VOTE_COLORS.Others} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Others" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#0f172a" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="analytics-row single">
        <div className="analytics-card analytics-card-hero">
          <h3 className="analytics-hero-title">Party swing analysis (2021 → 2024 → 2026)</h3>
          <p className="analytics-hero-sub">Years on the horizontal axis; grouped bars by party. Bar height is count; labels show % share within that year.</p>
          {partySwingParties.length === 0 ? (
            <div className="analytics-empty" style={{ minHeight: 200 }}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={partySwingByYearRows} margin={{ top: 20, right: 20, left: 8, bottom: 8 }} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#0f172a", fontWeight: 800 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#475569" }} />
                <Tooltip
                  formatter={(value, name, item) => {
                    const d = item?.payload || {};
                    const pc = d.partyPct && d.partyPct[name] != null ? d.partyPct[name] : null;
                    return pc != null ? [`${pc}% (${value} responses)`, name] : [value, name];
                  }}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Legend />
                {partySwingParties.map((p) => (
                  <Bar
                    key={p}
                    dataKey={p}
                    name={p}
                    fill={VOTE_COLORS[p] || "#64748b"}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey={p}
                      position="top"
                      content={(props) => <PartySwingPctLabel {...props} partyKey={p} />}
                    />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="analytics-row">
        <div className="analytics-card analytics-card-hero">
          <h3 className="analytics-hero-title">Vote intent vs winner perception gap</h3>
          <p className="analytics-hero-sub">Compares 2026 vote choice count vs who-will-win count for each party.</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={intentVsWinnerData} margin={{ top: 20, right: 20, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="party" tick={{ fontSize: 12, fill: "#0f172a", fontWeight: 800 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#475569" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="vote2026" name="Vote 2026 (count)" fill="#334155">
                <LabelList dataKey="vote2026" position="top" style={{ fontSize: 11, fontWeight: 700, fill: "#334155" }} />
              </Bar>
              <Bar dataKey="whoWillWin" name="Who Will Win (count)" fill="#1d4ed8">
                <LabelList dataKey="whoWillWin" position="top" style={{ fontSize: 11, fontWeight: 700, fill: "#1e3a8a" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-card analytics-card-hero">
          <h3 className="analytics-hero-title">AC competitiveness heatmap (Vote 2026)</h3>
          <p className="analytics-hero-sub">Smaller margin means more competitive AC. Sorted by closest first.</p>
          <div className="ac-heatmap-list">
            {acCompetitiveness.slice(0, 12).map((row) => {
              const intensity = Math.max(0.15, 1 - Math.min(1, row.margin / 80));
              return (
                <div key={row.ac} className="ac-heatmap-row">
                  <div className="ac-heatmap-main">
                    <div className="ac-heatmap-name">{formatAcSelectLabel(row.ac)}</div>
                    <div className="ac-heatmap-meta">
                      {row.leader} ({row.leaderCount}) vs {row.second} ({row.secondCount})
                    </div>
                  </div>
                  <div className="ac-heatmap-badge" style={{ background: `rgba(239, 68, 68, ${intensity})` }}>
                    Margin {row.margin}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}


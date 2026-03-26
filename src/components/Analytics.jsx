import { useState, useMemo } from "react";
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

function pct(count, total) {
  return total === 0 ? 0 : +((count / total) * 100).toFixed(1);
}

function useAnalyticsData(entries) {
  return useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        caste: [], gender: [], age: [], vote2021: [], vote2024: [], vote2026: [], whoWillWin: [], total: 0,
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

      // Caste
      const casteLabel = getCasteLabel(ac, e.casteWeight);
      casteMap[casteLabel] = (casteMap[casteLabel] || 0) + 1;

      // Gender
      const gLabel = getGenderLabel(ac, e.genderWeight);
      genderMap[gLabel] = (genderMap[gLabel] || 0) + 1;

      // Age
      const aLabel = getAgeLabel(e.ageWeight);
      ageMap[aLabel] = (ageMap[aLabel] || 0) + 1;

      // Vote 2021
      const v21 = String(e.vote2021 || "").trim() || "Others";
      const v21key = VOTE_PARTIES.includes(v21) ? v21 : "Others";
      v21Map[v21key] = (v21Map[v21key] || 0) + 1;

      // Vote 2024
      const v24 = String(e.vote2024 || "").trim() || "Others";
      const v24key = VOTE_PARTIES.includes(v24) ? v24 : "Others";
      v24Map[v24key] = (v24Map[v24key] || 0) + 1;

      // Vote 2026 AE
      const v26 = String(e.vote2026 || "").trim() || "Others";
      const v26key = VOTE_PARTIES.includes(v26) ? v26 : "Others";
      v26Map[v26key] = (v26Map[v26key] || 0) + 1;

      // Who will win (2026 prediction)
      const ww = String(e.whoWillWin || "").trim() || "Others";
      const wwKey = WHO_WIN_ORDER.includes(ww) ? ww : "Others";
      whoMap[wwKey] = (whoMap[wwKey] || 0) + 1;
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

    const vote2026 = VOTE_PARTIES.filter(p => v26Map[p]).map(p => ({
      name: p, count: v26Map[p], value: pct(v26Map[p], total),
    }));

    const whoWillWin = WHO_WIN_ORDER.filter(p => whoMap[p]).map(p => ({
      name: p, count: whoMap[p], value: pct(whoMap[p], total),
    }));

    return { caste, gender, age, vote2021, vote2024, vote2026, whoWillWin, total };
  }, [entries]);
}

function DonutChart({ data, colors, title }) {
  if (!data.length) return <div className="analytics-empty">No data</div>;

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
function WhoWillWinHeroChart({ data, colors }) {
  if (!data.length) {
    return (
      <div className="analytics-card analytics-card-hero">
        <h3 className="analytics-hero-title">Who will win — 2026 prediction</h3>
        <div className="analytics-empty" style={{ padding: "32px 16px" }}>No prediction data for this filter.</div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <strong>{d.name}</strong>: {d.value}% of responses ({d.count} entries)
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-card analytics-card-hero">
      <h3 className="analytics-hero-title">Who will win — 2026 prediction</h3>
      <p className="analytics-hero-sub">
        Share of responses by predicted winner for the current filter (vertical bar chart, 0–100% scale).
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

function HBarChart({ data, color, colors, title }) {
  if (!data.length) return <div className="analytics-empty">No data</div>;

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

  return (
    <div className="analytics-card">
      <h3 className="analytics-card-title">{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44 + 40)}>
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

export default function Analytics({ entries, loading }) {
  const [filterAC, setFilterAC] = useState("");
  const [filterFA, setFilterFA] = useState("");

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
            onChange={e => { setFilterAC(e.target.value); setFilterFA(""); }}>
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
            onClick={() => { setFilterAC(""); setFilterFA(""); }}>
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
        <WhoWillWinHeroChart data={whoWillWin} colors={VOTE_COLORS} />
      )}

      <div className="analytics-row">
        <DonutChart data={caste}  colors={CASTE_COLORS}  title="Caste Distribution" />
        <DonutChart data={gender} colors={GENDER_COLORS} title="Gender Distribution" />
      </div>

      <div className="analytics-row single">
        <HBarChart data={age} color={AGE_COLOR} title="Age Group Distribution" />
      </div>

      <div className="analytics-row">
        <HBarChart data={vote2021} colors={VOTE_COLORS} title="Vote 2021 AE" />
        <HBarChart data={vote2024} colors={VOTE_COLORS} title="Vote 2024 GE" />
      </div>

      <div className="analytics-row single">
        <HBarChart data={vote2026} colors={VOTE_COLORS} title="Vote 2026 AE (stated vote)" />
      </div>
    </div>
  );
}


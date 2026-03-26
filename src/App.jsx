import { useState } from "react";
import QuickStats from "./components/QuickStats";
import EntryTracker from "./components/EntryTracker";
import SummaryView from "./components/SummaryView";
import Analytics from "./components/Analytics";
import { useDateRangeEntries, useCumulativeEntries } from "./useSheetData";
import { toTabName } from "./config";
import "./App.css";

const NAV = [
  { id: "entries",   icon: "query_stats", label: "Entry Tracker" },
  { id: "summary",   icon: "bar_chart",   label: "Summary" },
  { id: "analytics", icon: "analytics",   label: "Analytics" },
];

const TAB_TITLES = {
  entries:   { title: "Entry Tracker",       sub: "Real-time field data submissions" },
  summary:   { title: "Summary & Download",  sub: "Party share by assembly constituency" },
  analytics: { title: "Analytics",           sub: "Demographic & vote distribution charts" },
};

function localIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Local calendar date (avoid UTC day skew from toISOString for non-UTC time zones)
const today = localIso(new Date());

export default function App() {
  const [tab, setTab]             = useState("entries");
  const [cumulative, setCumulative] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analyticsAC, setAnalyticsAC] = useState("");

  // Date range — defaults to today
  const [fromDate, setFromDate] = useState(today);
  const [toDate,   setToDate]   = useState(today);

  const range = useDateRangeEntries(
    cumulative ? null : fromDate,
    cumulative ? null : toDate
  );
  const cumul = useCumulativeEntries();

  const active         = cumulative ? cumul  : range;
  const entriesLoading = active.loading;
  const entriesError   = active.error;
  const refreshEntries = active.refresh;
  const entries        = cumulative ? (cumul.entries || []) : (range.entries || []);

  const summaryTabName = cumulative
    ? "Cumulative"
    : (fromDate && toDate)
      ? `${fromDate} → ${toDate}`
      : toTabName(new Date(today + "T00:00:00"));

  const hasDateFilter = cumulative || (fromDate && toDate);
  const { title, sub } = TAB_TITLES[tab];

  return (
    <div className="app">
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-row">
            <div className="sidebar-logo">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff" opacity="0.9"/>
                <path d="M2 17l10 5 10-5" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.7"/>
                <path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.85"/>
              </svg>
            </div>
            <div>
              <div className="sidebar-title">Kerala Survey 2026</div>
              <div className="sidebar-sub">Admin Dashboard</div>
            </div>
          </div>
        </div>

        <div className="sidebar-section-label">Main Menu</div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`sidebar-item ${tab === n.id ? "active" : ""}`}
              onClick={() => { setTab(n.id); setSidebarOpen(false); }}
            >
              <span className="mat-icon">{n.icon}</span>
              {n.label}
              {n.id === "entries" && entries.length > 0 && (
                <span className="sidebar-badge">{entries.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Cumulative toggle in sidebar */}
        <div className="sidebar-date-section">
          <div className="sidebar-date-label">Quick Options</div>
          <button
            className={`cumul-toggle ${cumulative ? "active" : ""}`}
            onClick={() => setCumulative(v => !v)}
          >
            <span className="cumul-dot" />
            {cumulative ? "Cumulative ON" : "All Dates (Cumulative)"}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="app-main">
        {/* Top bar with date range */}
        <div className="topbar">
          <div className="topbar-left">
            <button className="burger-btn" onClick={() => setSidebarOpen(v => !v)}>
              <span className={`burger-icon ${sidebarOpen ? "open" : ""}`}>
                <span /><span /><span />
              </span>
            </button>
            <div>
              <div className="topbar-title">{title}</div>
              <div className="topbar-sub">{sub}</div>
            </div>
          </div>

          {/* Mode tabs (top right) + date range or cumulative */}
          <div className="topbar-right">
            <div className="topbar-mode-tabs" role="tablist" aria-label="Data range mode">
              <button
                type="button"
                role="tab"
                aria-selected={!cumulative}
                className={`topbar-mode-tab ${!cumulative ? "active" : ""}`}
                onClick={() => setCumulative(false)}
              >
                Date range
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={cumulative}
                className={`topbar-mode-tab ${cumulative ? "active" : ""}`}
                onClick={() => setCumulative(true)}
              >
                Cumulative
              </button>
            </div>
            {cumulative ? (
              <span className="cumul-pill">📅 All dates combined</span>
            ) : (
              <div className="date-range-group">
                <div className="date-range-field">
                  <label className="date-range-label">From</label>
                  <input
                    type="date"
                    className="date-range-input"
                    value={fromDate}
                    max={toDate || today}
                    onChange={e => setFromDate(e.target.value)}
                  />
                </div>
                <span className="date-range-sep">→</span>
                <div className="date-range-field">
                  <label className="date-range-label">To</label>
                  <input
                    type="date"
                    className="date-range-input"
                    value={toDate}
                    min={fromDate}
                    max={today}
                    onChange={e => setToDate(e.target.value)}
                  />
                </div>
                {(fromDate || toDate) && (
                  <button className="date-range-clear"
                    onClick={() => { setFromDate(""); setToDate(""); }}
                    title="Clear dates">✕</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="content-scroll">
          {/* Quick stats — only shown when data loaded */}
          {entries.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <QuickStats entries={entries} />
            </div>
          )}

          {/* Empty state — no date selected */}
          {!hasDateFilter && !entriesLoading && entries.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">Select a date range to load entries</div>
              <div className="empty-sub">
                Use the <strong>From</strong> and <strong>To</strong> date pickers above,
                or enable <strong>Cumulative</strong> from the menu to view all dates.
              </div>
              <div className="empty-shortcuts">
                <button className="shortcut-btn" onClick={() => { setFromDate(today); setToDate(today); }}>Today</button>
                <button className="shortcut-btn" onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 6);
                  setFromDate(localIso(d)); setToDate(today);
                }}>Last 7 days</button>
                <button className="shortcut-btn" onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 29);
                  setFromDate(localIso(d)); setToDate(today);
                }}>Last 30 days</button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {entriesLoading && (
            <div className="loading-msg">Fetching entries…</div>
          )}

          {/* No results after fetch (summary/analytics); Entry Tracker has its own empty row */}
          {hasDateFilter && !entriesLoading && entries.length === 0 && tab !== "entries" && (
            <div className="info-banner" style={{ marginTop: 8 }}>
              No entries found for the selected date range.
            </div>
          )}

          {/* Main content tabs — always mount so Refresh / errors work even when count is 0 */}
          {!entriesLoading && hasDateFilter && (
            <>
              {tab === "entries" && (
                <EntryTracker
                  entries={entries}
                  loading={entriesLoading}
                  error={entriesError}
                  onRefresh={refreshEntries}
                />
              )}
              {tab === "summary" && entries.length > 0 && (
                <SummaryView
                  tabName={summaryTabName}
                  loading={entriesLoading}
                  entries={entries}
                  cumulativeEntries={!cumulative ? cumul.entries : null}
                  cumulativeLoading={cumul.loading}
                  onAcClick={(ac) => {
                    setAnalyticsAC(ac);
                    setTab("analytics");
                  }}
                />
              )}
              {tab === "analytics" && entries.length > 0 && (
                <Analytics
                  entries={entries}
                  loading={entriesLoading}
                  selectedAC={analyticsAC}
                  onSelectedACChange={setAnalyticsAC}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

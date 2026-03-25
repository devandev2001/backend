import { useState } from "react";
import QuickStats from "./components/QuickStats";
import EntryTracker from "./components/EntryTracker";
import SummaryView from "./components/SummaryView";
import Analytics from "./components/Analytics";
import { useEntries } from "./useSheetData";
import { toTabName, toEntryDate } from "./config";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("entries");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0]; // "2026-03-25"
  });

  // Convert yyyy-mm-dd → d/M/yyyy for entries API
  const entryDateStr = toEntryDate(new Date(selectedDate + "T00:00:00"));
  // Convert yyyy-mm-dd → dd-Mon-yyyy for summary tab
  const summaryTabName = toTabName(new Date(selectedDate + "T00:00:00"));

  const { data: entriesData, loading: entriesLoading, error: entriesError, refresh: refreshEntries } = useEntries(entryDateStr);

  const entries = entriesData?.entries || [];

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff" opacity="0.9"/>
                <path d="M2 17l10 5 10-5" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.7"/>
                <path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.85"/>
              </svg>
            </div>
            <div>
              <div className="header-title">Kerala Survey 2026</div>
              <div className="header-sub">Admin Dashboard</div>
            </div>
          </div>
          <div className="header-right">
            <input
              type="date"
              className="date-picker"
              value={selectedDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${tab === "entries" ? "active" : ""}`}
          onClick={() => setTab("entries")}
        >
          📋 Entry Tracker
          {entries.length > 0 && <span className="tab-badge">{entries.length}</span>}
        </button>
        <button
          className={`nav-tab ${tab === "summary" ? "active" : ""}`}
          onClick={() => setTab("summary")}
        >
          📊 Summary & Download
        </button>
        <button
          className={`nav-tab ${tab === "analytics" ? "active" : ""}`}
          onClick={() => setTab("analytics")}
        >
          📈 Analytics
        </button>
      </nav>

      {/* Quick stats */}
      <div className="stats-section">
        <QuickStats entries={entries} />
      </div>

      {/* Main content */}
      <main className="main-content">
        {tab === "entries" && (
          <EntryTracker
            entries={entries}
            loading={entriesLoading}
            error={entriesError}
            onRefresh={refreshEntries}
          />
        )}
        {tab === "summary" && (
          <SummaryView
            tabName={summaryTabName}
            loading={entriesLoading}
            entries={entries}
          />
        )}
        {tab === "analytics" && (
          <Analytics
            entries={entries}
            loading={entriesLoading}
          />
        )}
      </main>
    </div>
  );
}

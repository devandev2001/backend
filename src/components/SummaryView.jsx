import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { getAcNo, sortAcNames } from "../config";

const PARTIES = ["LDF", "UDF", "BJP/NDA"];
const partyColor = { LDF: "#dc2626", UDF: "#2563eb", "BJP/NDA": "#ea580c" };

function calcSummary(entries, partyField = "whoWillWin") {
  if (!entries || entries.length === 0) return [];

  const acMap = {};
  entries.forEach(e => {
    const ac = String(e.ac || "").trim();
    const acKey = ac.toLowerCase();
    // Hide blank rows and requested AC exclusions.
    if (!ac || acKey === "kovalam" || acKey === "kowalam") return;
    const party = String(e[partyField]).trim();
    const score = parseFloat(e.normalizedScore) || 0;
    if (!acMap[ac]) {
      acMap[ac] = {};
      PARTIES.forEach(p => { acMap[ac][p] = { sum: 0, count: 0 }; });
    }
    if (acMap[ac][party]) {
      acMap[ac][party].sum += score;
      acMap[ac][party].count += 1;
    }
  });

  return sortAcNames(Object.keys(acMap)).map(ac => {
    const partyData = acMap[ac];
    let totalEntries = 0;
    let grandTotal = 0;
    const partySums = {};

    PARTIES.forEach(p => {
      totalEntries += partyData[p].count;
      partySums[p] = partyData[p].sum;
      grandTotal += partyData[p].sum;
    });

    const pct = {};
    let winner = "-";
    let maxPct = -1;

    PARTIES.forEach(p => {
      pct[p] = grandTotal > 0 ? (partySums[p] / grandTotal) * 100 : 0;
      if (pct[p] > maxPct) { maxPct = pct[p]; winner = p; }
    });

    return {
      ac,
      totalEntries,
      ldf:    pct["LDF"].toFixed(2) + "%",
      udf:    pct["UDF"].toFixed(2) + "%",
      bjp:    pct["BJP/NDA"].toFixed(2) + "%",
      winner,
    };
  });
}

function SummarySection({ title, rows, loading, showDownload, onDownload, downloadDisabled }) {
  if (loading) {
    return (
      <div className="summary-section-block">
        <div className="summary-header-row">
          <h2 className="summary-title">{title}</h2>
        </div>
        <div className="loading-msg">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="summary-section-block">
        <div className="summary-header-row">
          <h2 className="summary-title">{title}</h2>
        </div>
        <div className="info-banner">No entries for this view.</div>
      </div>
    );
  }

  return (
    <div className="summary-section-block">
      <div className="summary-header-row">
        <h2 className="summary-title">{title}</h2>
        {showDownload && (
          <button className="download-btn" onClick={onDownload} disabled={downloadDisabled}>
            ⬇ Download Excel
          </button>
        )}
      </div>

      <div className="table-wrap">
        <table className="summary-table summary-table-centered">
          <thead>
            <tr>
              <th className="ac-no-col">AC No.</th>
              <th>Assembly Constituency</th>
              <th>Total Entries</th>
              <th className="ldf-col">LDF %</th>
              <th className="udf-col">UDF %</th>
              <th className="bjp-col">BJP/NDA %</th>
              <th>Predicted Winner</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                <td className="ac-no-col num-col">{getAcNo(row.ac) || "—"}</td>
                <td className="ac-col">{row.ac}</td>
                <td className="num-col">{row.totalEntries}</td>
                <td className="num-col ldf-val">{row.ldf}</td>
                <td className="num-col udf-val">{row.udf}</td>
                <td className="num-col bjp-val">{row.bjp}</td>
                <td>
                  <span className="winner-badge" style={{ background: partyColor[row.winner] || "#1d4ed8" }}>
                    {row.winner}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default function SummaryView({
  tabName,
  loading,
  entries,
  cumulativeEntries,
  cumulativeLoading,
}) {
  const [metricTab, setMetricTab] = useState("whoWillWin");
  const rowsWW = useMemo(() => calcSummary(entries, "whoWillWin"), [entries]);
  const rowsV26 = useMemo(() => calcSummary(entries, "vote2026"), [entries]);
  const cumRowsWW = useMemo(() => calcSummary(cumulativeEntries || [], "whoWillWin"), [cumulativeEntries]);
  const cumRowsV26 = useMemo(() => calcSummary(cumulativeEntries || [], "vote2026"), [cumulativeEntries]);
  const rows = metricTab === "whoWillWin" ? rowsWW : rowsV26;
  const cumRows = metricTab === "whoWillWin" ? cumRowsWW : cumRowsV26;
  const metricTitle = metricTab === "whoWillWin" ? "Who Will Win (weighted)" : "Vote 2026 (weighted)";

  const showCumulativeBelow = cumulativeEntries != null;

  function downloadExcel(includeCumulativeSheet) {
    const wb = XLSX.utils.book_new();

    const summaryHeaders = [["AC No.","Assembly Constituency","Total Entries","LDF %","UDF %","BJP/NDA %","Predicted Winner"]];
    const summaryRowsWW = rowsWW.map(r => [getAcNo(r.ac) || "", r.ac, r.totalEntries, r.ldf, r.udf, r.bjp, r.winner]);
    const summaryRowsV26 = rowsV26.map(r => [getAcNo(r.ac) || "", r.ac, r.totalEntries, r.ldf, r.udf, r.bjp, r.winner]);
    const wsWW = XLSX.utils.aoa_to_sheet([...summaryHeaders, ...summaryRowsWW]);
    const wsV26 = XLSX.utils.aoa_to_sheet([...summaryHeaders, ...summaryRowsV26]);
    wsWW["!cols"] = [{wch:8},{wch:24},{wch:14},{wch:10},{wch:10},{wch:12},{wch:18}];
    wsV26["!cols"] = [{wch:8},{wch:24},{wch:14},{wch:10},{wch:10},{wch:12},{wch:18}];
    XLSX.utils.book_append_sheet(wb, wsWW, "WW Summary");
    XLSX.utils.book_append_sheet(wb, wsV26, "Vote26 Summary");

    if (includeCumulativeSheet && (cumRowsWW.length > 0 || cumRowsV26.length > 0)) {
      const cumWW = cumRowsWW.map(r => [getAcNo(r.ac) || "", r.ac, r.totalEntries, r.ldf, r.udf, r.bjp, r.winner]);
      const cumV26 = cumRowsV26.map(r => [getAcNo(r.ac) || "", r.ac, r.totalEntries, r.ldf, r.udf, r.bjp, r.winner]);
      const wsCWW = XLSX.utils.aoa_to_sheet([...summaryHeaders, ...cumWW]);
      const wsCV26 = XLSX.utils.aoa_to_sheet([...summaryHeaders, ...cumV26]);
      wsCWW["!cols"] = [{wch:8},{wch:24},{wch:14},{wch:10},{wch:10},{wch:12},{wch:18}];
      wsCV26["!cols"] = [{wch:8},{wch:24},{wch:14},{wch:10},{wch:10},{wch:12},{wch:18}];
      XLSX.utils.book_append_sheet(wb, wsCWW, "WW Cumulative");
      XLSX.utils.book_append_sheet(wb, wsCV26, "Vote26 Cumulative");
    }

    if (entries && entries.length > 0) {
      const entryHeaders = [["Timestamp","AC No.","AC","FA Name","Caste Weight","Gender Weight","Age Weight",
                             "Vote 2021","Vote 2024","Vote 2026","Who Will Win","Normalized Score"]];
      const entryRows = entries.map(e => [
        e.timestamp, getAcNo(e.ac) || "", e.ac, e.faName,
        e.casteWeight, e.genderWeight, e.ageWeight,
        e.vote2021, e.vote2024, e.vote2026, e.whoWillWin, e.normalizedScore
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([...entryHeaders, ...entryRows]);
      ws2["!cols"] = [{wch:22},{wch:8},{wch:20},{wch:20},{wch:14},{wch:14},{wch:16},{wch:12},{wch:12},{wch:12},{wch:14},{wch:18}];
      XLSX.utils.book_append_sheet(wb, ws2, "Raw Entries");
    }

    XLSX.writeFile(wb, `Kerala_Survey_${tabName}.xlsx`);
  }

  if (loading && rowsWW.length === 0 && rowsV26.length === 0) {
    return (
      <div className="summary-wrap">
        <div className="loading-msg">Fetching entries…</div>
      </div>
    );
  }

  if (rowsWW.length === 0 && rowsV26.length === 0) {
    return (
      <div className="summary-wrap">
        <div className="info-banner">No entries found for <strong>{tabName}</strong>. Select a date that has data.</div>
      </div>
    );
  }

  return (
    <div className="summary-wrap summary-wrap-stacked">
      <div className="summary-metric-tabs">
        <button
          className={`summary-metric-tab ${metricTab === "whoWillWin" ? "active" : ""}`}
          onClick={() => setMetricTab("whoWillWin")}
        >
          Who Will Win
        </button>
        <button
          className={`summary-metric-tab ${metricTab === "vote2026" ? "active" : ""}`}
          onClick={() => setMetricTab("vote2026")}
        >
          Vote 2026
        </button>
      </div>
      {showCumulativeBelow && (
        <div className="summary-compare-grid two-cols">
          <div className="summary-col summary-col-selected">
            <SummarySection
              title={`Selected / Today — ${tabName} — ${metricTitle}`}
              rows={rows}
              loading={false}
              showDownload
              onDownload={() => downloadExcel(showCumulativeBelow)}
              downloadDisabled={rows.length === 0 || loading}
            />
          </div>
          <div className="summary-col summary-col-cumulative">
            <SummarySection
              title={`Cumulative — all dates — ${metricTitle}`}
              rows={cumRows}
              loading={!!cumulativeLoading}
              showDownload
              onDownload={() => downloadExcel(true)}
              downloadDisabled={cumRows.length === 0 || !!cumulativeLoading}
            />
          </div>
        </div>
      )}

      {!showCumulativeBelow && (
        <>
          <SummarySection
            title={`Summary — ${tabName} — ${metricTitle}`}
            rows={rows}
            loading={false}
            showDownload
            onDownload={() => downloadExcel(showCumulativeBelow)}
            downloadDisabled={rows.length === 0 || loading}
          />
        </>
      )}
    </div>
  );
}

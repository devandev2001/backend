import { useMemo } from "react";
import * as XLSX from "xlsx";
import { ACS, getAcNo, sortAcNames } from "../config";

const PARTIES = ["LDF", "UDF", "BJP/NDA"];
const partyColor = { LDF: "#dc2626", UDF: "#2563eb", "BJP/NDA": "#ea580c" };

const AC_NAME_BY_KEY = ACS.reduce((acc, name) => {
  const key = String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
  acc[key] = name;
  return acc;
}, {});

function normalizeAcName(rawAc) {
  const input = String(rawAc || "").trim();
  if (!input) return "";
  const key = input.toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliasKey = key === "kattakada" ? "kattakkada" : key === "kowalam" ? "kovalam" : key;
  return AC_NAME_BY_KEY[aliasKey] || input;
}

function normalizeParty(rawParty) {
  const p = String(rawParty || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!p) return "Others";
  if (p === "LDF") return "LDF";
  if (p === "UDF") return "UDF";
  if (p === "BJP/NDA" || p === "BJP-NDA" || p === "BJP" || p === "NDA" || p === "BJPNDA") return "BJP/NDA";
  return "Others";
}

function calcSummary(entries, partyField = "whoWillWin") {
  if (!entries || entries.length === 0) return [];

  const acMap = {};
  entries.forEach(e => {
    const ac = normalizeAcName(e.ac);
    const acKey = ac.toLowerCase();
    // Hide blank rows and requested AC exclusions.
    if (!ac || acKey === "kovalam" || acKey === "kowalam") return;
    const party = normalizeParty(e[partyField]);
    const score = parseFloat(e.normalizedScore) || 0;
    if (!acMap[ac]) {
      acMap[ac] = { totalRows: 0, othersSum: 0, parties: {} };
      PARTIES.forEach(p => { acMap[ac].parties[p] = { sum: 0, count: 0 }; });
    }
    acMap[ac].totalRows += 1;
    if (party === "Others") {
      acMap[ac].othersSum += score;
    } else if (acMap[ac].parties[party]) {
      acMap[ac].parties[party].sum += score;
      acMap[ac].parties[party].count += 1;
    }
  });

  return sortAcNames(Object.keys(acMap)).map(ac => {
    const acData = acMap[ac];
    const partyData = acData.parties;
    let countedEntries = 0;
    let recognizedTotal = 0;
    const partySums = {};

    PARTIES.forEach(p => {
      countedEntries += partyData[p].count;
      partySums[p] = partyData[p].sum;
      recognizedTotal += partyData[p].sum;
    });
    const grandTotal = recognizedTotal + acData.othersSum;

    const pct = {};
    let winner = "No data";
    let maxSum = 0;

    PARTIES.forEach(p => {
      pct[p] = grandTotal > 0 ? (partySums[p] / grandTotal) * 100 : 0;
      if (partySums[p] > maxSum) { maxSum = partySums[p]; winner = p; }
    });

    return {
      ac,
      totalEntries: acData.totalRows,
      countedEntries,
      ldf:    pct["LDF"].toFixed(2) + "%",
      udf:    pct["UDF"].toFixed(2) + "%",
      bjp:    pct["BJP/NDA"].toFixed(2) + "%",
      winner,
    };
  });
}

function SummarySection({ title, rows, loading, showDownload, onDownload, downloadDisabled, onAcClick }) {
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
                <td className="ac-col">
                  {onAcClick ? (
                    <button className="ac-link-btn" onClick={() => onAcClick(row.ac)}>{row.ac}</button>
                  ) : (
                    row.ac
                  )}
                </td>
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
  onAcClick,
}) {
  const rowsWW = useMemo(() => calcSummary(entries, "whoWillWin"), [entries]);
  const rowsV26 = useMemo(() => calcSummary(entries, "vote2026"), [entries]);

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

    // Keep export focused on currently visible summary.

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
      <div className="summary-compare-grid two-cols metric-compare-grid">
        <SummarySection
          title={`Summary — ${tabName} — Who Will You Vote For (2026 weighted)`}
          rows={rowsV26}
          loading={false}
          showDownload
          onDownload={() => downloadExcel(false)}
          downloadDisabled={(rowsWW.length === 0 && rowsV26.length === 0) || loading}
          onAcClick={onAcClick}
        />
        <SummarySection
          title={`Summary — ${tabName} — Who Will Win (weighted)`}
          rows={rowsWW}
          loading={false}
          showDownload
          onDownload={() => downloadExcel(false)}
          downloadDisabled={(rowsWW.length === 0 && rowsV26.length === 0) || loading}
          onAcClick={onAcClick}
        />
      </div>
    </div>
  );
}

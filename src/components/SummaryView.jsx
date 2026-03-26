import { useMemo } from "react";
import * as XLSX from "xlsx";

const PARTIES = ["LDF", "UDF", "BJP/NDA", "Others"];
const partyColor = { LDF: "#dc2626", UDF: "#2563eb", "BJP/NDA": "#ea580c", Others: "#6b7280" };

function calcSummary(entries) {
  if (!entries || entries.length === 0) return [];

  const acMap = {};
  entries.forEach(e => {
    const ac = String(e.ac).trim();
    const party = String(e.whoWillWin).trim();
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

  return Object.keys(acMap).sort().map(ac => {
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
      others: pct["Others"].toFixed(2) + "%",
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
              <th>Assembly Constituency</th>
              <th>Total Entries</th>
              <th className="ldf-col">LDF %</th>
              <th className="udf-col">UDF %</th>
              <th className="bjp-col">BJP/NDA %</th>
              <th className="oth-col">Others %</th>
              <th>Predicted Winner</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                <td className="ac-col">{row.ac}</td>
                <td className="num-col">{row.totalEntries}</td>
                <td className="num-col ldf-val">{row.ldf}</td>
                <td className="num-col udf-val">{row.udf}</td>
                <td className="num-col bjp-val">{row.bjp}</td>
                <td className="num-col oth-val">{row.others}</td>
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

      <div className="bar-section">
        <h3 className="bar-section-title">Party share by AC</h3>
        {rows.map((row, i) => {
          const vals = [
            { party: "LDF",     pct: parseFloat(row.ldf),    color: "#dc2626" },
            { party: "UDF",     pct: parseFloat(row.udf),    color: "#2563eb" },
            { party: "BJP/NDA", pct: parseFloat(row.bjp),    color: "#ea580c" },
            { party: "Others",  pct: parseFloat(row.others), color: "#6b7280" },
          ];
          return (
            <div key={i} className="bar-row">
              <div className="bar-label">{row.ac}</div>
              <div className="bar-track">
                {vals.map(v => v.pct > 0 && (
                  <div key={v.party} className="bar-seg"
                    style={{ width: `${v.pct}%`, background: v.color }}
                    title={`${v.party}: ${v.pct.toFixed(1)}%`}>
                    {v.pct > 8 && <span className="bar-seg-label">{v.party} {v.pct.toFixed(1)}%</span>}
                  </div>
                ))}
              </div>
              <div className="bar-winner" style={{ color: partyColor[row.winner] }}>{row.winner}</div>
            </div>
          );
        })}
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
  const rows = useMemo(() => calcSummary(entries), [entries]);
  const cumRows = useMemo(() => calcSummary(cumulativeEntries || []), [cumulativeEntries]);

  const showCumulativeBelow = cumulativeEntries != null;

  function downloadExcel(includeCumulativeSheet) {
    const wb = XLSX.utils.book_new();

    const summaryHeaders = [["Assembly Constituency","Total Entries","LDF %","UDF %","BJP/NDA %","Others %","Predicted Winner"]];
    const summaryRows = rows.map(r => [r.ac, r.totalEntries, r.ldf, r.udf, r.bjp, r.others, r.winner]);
    const ws1 = XLSX.utils.aoa_to_sheet([...summaryHeaders, ...summaryRows]);
    ws1["!cols"] = [{wch:24},{wch:14},{wch:10},{wch:10},{wch:12},{wch:10},{wch:18}];
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    if (includeCumulativeSheet && cumRows.length > 0) {
      const cumData = cumRows.map(r => [r.ac, r.totalEntries, r.ldf, r.udf, r.bjp, r.others, r.winner]);
      const wsC = XLSX.utils.aoa_to_sheet([...summaryHeaders, ...cumData]);
      wsC["!cols"] = [{wch:24},{wch:14},{wch:10},{wch:10},{wch:12},{wch:10},{wch:18}];
      XLSX.utils.book_append_sheet(wb, wsC, "Cumulative");
    }

    if (entries && entries.length > 0) {
      const entryHeaders = [["Timestamp","AC","FA Name","Caste Weight","Gender Weight","Age Weight",
                             "Vote 2021","Vote 2024","Vote 2026","Who Will Win","Normalized Score"]];
      const entryRows = entries.map(e => [
        e.timestamp, e.ac, e.faName,
        e.casteWeight, e.genderWeight, e.ageWeight,
        e.vote2021, e.vote2024, e.vote2026, e.whoWillWin, e.normalizedScore
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([...entryHeaders, ...entryRows]);
      ws2["!cols"] = [{wch:22},{wch:20},{wch:20},{wch:14},{wch:14},{wch:16},{wch:12},{wch:12},{wch:12},{wch:14},{wch:18}];
      XLSX.utils.book_append_sheet(wb, ws2, "Raw Entries");
    }

    XLSX.writeFile(wb, `Kerala_Survey_${tabName}.xlsx`);
  }

  if (loading && rows.length === 0) {
    return (
      <div className="summary-wrap">
        <div className="loading-msg">Fetching entries…</div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="summary-wrap">
        <div className="info-banner">No entries found for <strong>{tabName}</strong>. Select a date that has data.</div>
      </div>
    );
  }

  return (
    <div className="summary-wrap summary-wrap-stacked">
      <SummarySection
        title={showCumulativeBelow ? `Selected range — ${tabName}` : `Summary — ${tabName}`}
        rows={rows}
        loading={false}
        showDownload
        onDownload={() => downloadExcel(showCumulativeBelow)}
        downloadDisabled={rows.length === 0 || loading}
      />

      {showCumulativeBelow && (
        <>
          <div className="summary-section-divider" />
          <SummarySection
            title="Cumulative — all dates"
            rows={cumRows}
            loading={!!cumulativeLoading}
            showDownload={false}
          />
        </>
      )}
    </div>
  );
}

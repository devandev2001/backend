import * as XLSX from "xlsx";

export default function SummaryView({ data, tabName, loading, error, entries }) {
  const partyColor = { LDF: "#dc2626", UDF: "#2563eb", "BJP/NDA": "#ea580c", Others: "#6b7280" };

  function downloadExcel() {
    const wb = XLSX.utils.book_new();

    // Sheet 1 — Summary
    const summaryHeaders = [["Assembly Constituency","Total Entries","LDF %","UDF %","BJP/NDA %","Others %","Predicted Winner"]];
    const summaryRows = (data?.rows || []).map(r => [
      r.ac, r.totalEntries, r.ldf, r.udf, r.bjp, r.others, r.winner
    ]);
    const ws1 = XLSX.utils.aoa_to_sheet([...summaryHeaders, ...summaryRows]);

    // Style column widths
    ws1["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    // Sheet 2 — Raw Entries
    if (entries && entries.length > 0) {
      const entryHeaders = [["Timestamp","AC","FA Name","Caste Weight","Gender Weight","Age Weight",
                             "Vote 2021","Vote 2024","Vote 2026","Who Will Win","Normalized Score"]];
      const entryRows = entries.map(e => [
        e.timestamp, e.ac, e.faName,
        e.casteWeight, e.genderWeight, e.ageWeight,
        e.vote2021, e.vote2024, e.vote2026, e.whoWillWin, e.normalizedScore
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([...entryHeaders, ...entryRows]);
      ws2["!cols"] = [
        {wch:22},{wch:20},{wch:20},{wch:14},{wch:14},{wch:16},
        {wch:12},{wch:12},{wch:12},{wch:14},{wch:18}
      ];
      XLSX.utils.book_append_sheet(wb, ws2, "Raw Entries");
    }

    XLSX.writeFile(wb, `Kerala_Survey_${tabName}.xlsx`);
  }

  return (
    <div className="summary-wrap">
      <div className="summary-header-row">
        <h2 className="summary-title">
          Summary — {tabName}
          {data && !data.found && <span className="not-found-badge"> (not generated yet)</span>}
        </h2>
        <button
          className="download-btn"
          onClick={downloadExcel}
          disabled={!data?.rows?.length}
        >
          ⬇ Download Excel
        </button>
      </div>

      {loading ? (
        <div className="loading-msg">Fetching summary…</div>
      ) : error && !data ? (
        <div className="error-banner">⚠ {error}</div>
      ) : !data?.found ? (
        <div className="info-banner">
          No summary tab found for <strong>{tabName}</strong>. The report is auto-generated at 8 PM IST.
          <br /><br />To generate it now: open <strong>Apps Script → select <code>generateDailyReport</code> → ▶ Run</strong>
        </div>
      ) : data.rows.length === 0 ? (
        <div className="info-banner">Summary tab exists but has no data.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="summary-table">
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
                {data.rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                    <td className="ac-col">{row.ac}</td>
                    <td className="num-col">{row.totalEntries}</td>
                    <td className="num-col ldf-val">{row.ldf}</td>
                    <td className="num-col udf-val">{row.udf}</td>
                    <td className="num-col bjp-val">{row.bjp}</td>
                    <td className="num-col oth-val">{row.others}</td>
                    <td>
                      <span
                        className="winner-badge"
                        style={{ background: partyColor[row.winner] || "#1d4ed8" }}
                      >
                        {row.winner}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visual bar chart */}
          <div className="bar-section">
            <h3 className="bar-section-title">Party Share by AC</h3>
            {data.rows.map((row, i) => {
              const vals = [
                { party: "LDF", pct: parseFloat(row.ldf), color: "#dc2626" },
                { party: "UDF", pct: parseFloat(row.udf), color: "#2563eb" },
                { party: "BJP/NDA", pct: parseFloat(row.bjp), color: "#ea580c" },
                { party: "Others", pct: parseFloat(row.others), color: "#6b7280" },
              ];
              return (
                <div key={i} className="bar-row">
                  <div className="bar-label">{row.ac}</div>
                  <div className="bar-track">
                    {vals.map(v => (
                      v.pct > 0 && (
                        <div
                          key={v.party}
                          className="bar-seg"
                          style={{ width: `${v.pct}%`, background: v.color }}
                          title={`${v.party}: ${v.pct.toFixed(1)}%`}
                        >
                          {v.pct > 8 && <span className="bar-seg-label">{v.party} {v.pct.toFixed(1)}%</span>}
                        </div>
                      )
                    ))}
                  </div>
                  <div className="bar-winner" style={{ color: partyColor[row.winner] }}>{row.winner}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

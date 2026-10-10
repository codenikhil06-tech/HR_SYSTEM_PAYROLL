import React, { useState, useEffect } from 'react';

export default function DataTable({ rows = [], cols = [], size = 8, minw, empty = 'No records found', foot }) {
  const [pg, setPg] = useState(1);

  const pages = Math.max(1, Math.ceil(rows.length / size));

  useEffect(() => {
    if (pg > pages) setPg(pages);
  }, [rows.length, pages, pg]);

  const from = (pg - 1) * size + 1;
  const to = Math.min(rows.length, pg * size);
  const slice = rows.slice((pg - 1) * size, pg * size);

  const renderPageButtons = () => {
    const buttons = [];
    let prev = 0;

    for (let p = 1; p <= pages; p++) {
      if (p === 1 || p === pages || Math.abs(p - pg) <= 1) {
        if (p - prev > 1) {
          buttons.push(
            <span key={`dots-${p}`} className="pg-d">
              …
            </span>
          );
        }
        buttons.push(
          <button
            key={p}
            className={`pg ${p === pg ? 'on' : ''}`}
            onClick={() => setPg(p)}
          >
            {p}
          </button>
        );
        prev = p;
      }
    }
    return buttons;
  };

  return (
    <>
      <div className="tw">
        <table className="tbl" style={minw ? { minWidth: `${minw}px` } : {}}>
          <thead>
            <tr>
              {cols.map((c, i) => (
                <th key={i} className={c.cls || ''}>
                  {c.h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length ? (
              slice.map((r, ri) => (
                <tr key={r.id || r.employee_id || r.leave_id || r.payroll_id || r.payroll_item_id || ri}>
                  {cols.map((c, ci) => (
                    <td key={ci} className={c.cls || ''}>
                      {c.f ? c.f(r, ri) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={cols.length} className="empty">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
          {foot && rows.length > 0 && <tfoot>{foot}</tfoot>}
        </table>
      </div>

      {rows.length > 0 && (
        <div className="pager">
          <span>
            Showing {from}–{to} of {rows.length}
          </span>
          <div>
            <button className="pg" disabled={pg <= 1} onClick={() => setPg(pg - 1)}>
              ‹
            </button>
            {renderPageButtons()}
            <button className="pg" disabled={pg >= pages} onClick={() => setPg(pg + 1)}>
              ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}

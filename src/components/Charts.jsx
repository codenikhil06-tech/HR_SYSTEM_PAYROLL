import React from 'react';

export function BarChart({ labels = [], series = [], options = {} }) {
  const W = 640;
  const H = options.h || 250;
  const L = 52;
  const B = 30;
  const T = 12;
  const fmt = options.fmt || ((v) => +Number(v).toFixed(1));

  const tot = labels.map((_, i) =>
    options.stacked
      ? series.reduce((a, s) => a + (s.values[i] || 0), 0)
      : Math.max(...series.map((s) => s.values[i] || 0))
  );
  let mx = Math.max(1, ...tot);
  const p = Math.pow(10, Math.floor(Math.log10(mx)));
  mx = Math.ceil((mx / p) * 2) / 2 * p;
  if (!mx) mx = 1;

  const iw = W - L - 10;
  const ih = H - B - T;
  const gw = iw / (labels.length || 1);
  const bw = options.stacked
    ? Math.min(40, gw * 0.55)
    : Math.min(26, (gw * 0.7) / (series.length || 1));

  const gridLines = [0, 1, 2, 3, 4].map((i) => {
    const y = T + ih - (ih * i) / 4;
    return (
      <g key={i}>
        <line x1={L} x2={W - 6} y1={y} y2={y} stroke="var(--border)" />
        <text x={L - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
          {fmt((mx * i) / 4)}
        </text>
      </g>
    );
  });

  const bars = labels.map((lb, i) => {
    const cx = L + gw * i + gw / 2;
    let currentY = T + ih;

    return (
      <g key={i}>
        <text x={cx} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted)">
          {lb}
        </text>
        {options.stacked
          ? series.map((s, j) => {
              const val = s.values[i] || 0;
              const h = (ih * val) / mx;
              currentY -= h;
              return (
                <rect
                  key={j}
                  x={cx - bw / 2}
                  y={currentY}
                  width={bw}
                  height={Math.max(0, h)}
                  fill={s.color}
                  rx="2"
                >
                  <title>{`${s.name}: ${fmt(val)}`}</title>
                </rect>
              );
            })
          : series.map((s, j) => {
              const val = s.values[i] || 0;
              const h = (ih * val) / mx;
              const x = cx - (series.length * bw) / 2 + j * bw;
              return (
                <rect
                  key={j}
                  x={x}
                  y={T + ih - h}
                  width={bw - 2}
                  height={Math.max(0, h)}
                  fill={s.color}
                  rx="3"
                >
                  <title>{`${s.name}: ${fmt(val)}`}</title>
                </rect>
              );
            })}
      </g>
    );
  });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {gridLines}
        {bars}
      </svg>
      <div className="legend">
        {series.map((s, i) => (
          <span key={i}>
            <i style={{ background: s.color }}></i>
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({ items = [], center = '', sz = 170 }) {
  const tot = items.reduce((a, i) => a + (i.value || 0), 0) || 1;
  const R = 60;
  const C = 2 * Math.PI * R;
  let off = 0;

  const circles = items.map((i, idx) => {
    const val = i.value || 0;
    const l = (C * val) / tot;
    const circle = (
      <circle
        key={idx}
        r={R}
        cx="80"
        cy="80"
        fill="none"
        stroke={i.color}
        strokeWidth="22"
        strokeDasharray={`${l} ${C - l}`}
        strokeDashoffset={-off}
      >
        <title>{`${i.label}: ${val}`}</title>
      </circle>
    );
    off += l;
    return circle;
  });

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={sz} height={sz} viewBox="0 0 160 160">
        <g transform="rotate(-90 80 80)">{circles}</g>
        <text x="80" y="78" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text)">
          {center}
        </text>
        <text x="80" y="95" textAnchor="middle" fontSize="10" fill="var(--muted)">
          TOTAL
        </text>
      </svg>
      <div className="legend" style={{ flexDirection: 'column', gap: 6 }}>
        {items.map((i, idx) => (
          <span key={idx}>
            <i style={{ background: i.color }}></i>
            {i.label} — <b>{i.value || 0}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';

const RANGES = ['D', 'W', 'M', 'Y'];

// LeetCode-style consistency view: XP earned per hour/day/week/month
// depending on range. Hand-drawn SVG, no chart lib.
export default function ProgressGraph({ histories }) {
  const [range, setRange] = useState('W');
  const history = histories[range];

  const W = 320, H = 110, PAD = 6;
  const max = Math.max(...history.map((d) => d.xp), 1);
  const pts = history.map((d, i) => [
    PAD + (i / (history.length - 1)) * (W - PAD * 2),
    H - PAD - (d.xp / max) * (H - PAD * 2 - 14),
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]} ${H - PAD} L${pts[0][0]} ${H - PAD} Z`;
  const last = pts[pts.length - 1];
  const total = history.reduce((s, d) => s + d.xp, 0);
  const active = history.filter((d) => d.xp > 0).length;

  return (
    <div className="panel graph-panel">
      <div className="panel-head">
        <h2 className="panel-title">Momentum</h2>
        <div className="range-tabs">
          {RANGES.map((r) => (
            <button key={r} className={`range-tab ${r === range ? 'on' : ''}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="graph-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="graph-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={H * f} y2={H * f} stroke="#ffffff" strokeOpacity="0.05" />
        ))}
        <path d={area} fill="url(#graph-fill)" />
        <path d={line} fill="none" stroke="#8b5cff" strokeWidth="2" strokeLinejoin="round" className="graph-line" />
        <circle cx={last[0]} cy={last[1]} r="3.5" fill="#8b5cff" className="graph-dot" />
      </svg>
      <div className="graph-axis">
        <span>{history[0].label}</span>
        <span>{history[history.length - 1].label}</span>
      </div>
      <div className="graph-stats">
        <span>{total} XP</span>
        <span>{active}/{history.length} active</span>
      </div>
    </div>
  );
}

import { STATS, xpForLevel } from '../game/engine';
import { STAT_ICONS } from './Icons';

function StatBar({ stat, data }) {
  const need = xpForLevel(data.level);
  const pct = Math.min(100, (data.xp / need) * 100);
  const Icon = STAT_ICONS[stat.key];
  return (
    <div className="stat-row">
      <div className="stat-head">
        <span className="stat-icon" style={{ color: stat.color }}><Icon /></span>
        <span className="stat-label">{stat.label}</span>
        <span className="stat-level" style={{ color: stat.color }}>LV {data.level}</span>
      </div>
      <div className="xp-track">
        <div className="xp-fill" style={{ width: `${pct}%`, background: stat.color, boxShadow: `0 0 12px ${stat.color}88` }} />
      </div>
      <div className="xp-text">{data.xp} / {need}</div>
    </div>
  );
}

export default function StatPanel({ stats }) {
  return (
    <div className="panel stat-panel">
      <div className="panel-head"><h2 className="panel-title">Stats</h2></div>
      {Object.values(STATS).map((s) => (
        <StatBar key={s.key} stat={s} data={stats[s.key]} />
      ))}
    </div>
  );
}

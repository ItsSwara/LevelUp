import { useState } from 'react';
import { auraTier, AURA_NAMES } from '../game/engine';

const TIER_COLORS = ['#5a6a8a', '#8b5cff', '#4dd0ff', '#ff9a3c', '#ffe14d'];

// The hooded monarch. `charge` (0..1 = today's quest completion) powers
// the aura: dim when you slack, blazing when the path is cleared.
export default function Avatar({ level, charge }) {
  const tier = auraTier(level);
  const c = TIER_COLORS[tier];
  const [hover, setHover] = useState(false);
  const glow = Math.min(1, 0.22 + charge * 0.78 + (hover ? 0.15 : 0));

  return (
    <div
      className="avatar-wrap"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`Aura charge ${Math.round(charge * 100)}% — complete quests to charge it`}
    >
      <svg viewBox="0 0 200 210" className="avatar-svg" aria-label="Your character">
        <defs>
          <radialGradient id="av-aura" cx="50%" cy="52%" r="52%">
            <stop offset="0%" stopColor={c} stopOpacity={glow * 0.7} />
            <stop offset="55%" stopColor={c} stopOpacity={glow * 0.25} />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="av-cloak" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#23232f" />
            <stop offset="55%" stopColor="#131319" />
            <stop offset="100%" stopColor="#0b0b10" />
          </linearGradient>
          <linearGradient id="av-rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c} stopOpacity="0" />
            <stop offset="100%" stopColor={c} stopOpacity={glow} />
          </linearGradient>
        </defs>

        {/* aura field */}
        <ellipse cx="100" cy="105" rx="88" ry="92" fill="url(#av-aura)" className="aura-breathe" />

        {/* floating aura shards */}
        <g opacity={0.2 + charge * 0.8}>
          {[[26, 120, 3], [172, 96, 4], [40, 62, 2.6], [166, 150, 2.6], [148, 40, 3], [58, 168, 2.4]].map(([x, y, s], i) => (
            <path key={i} d={`M${x} ${y} l${s} ${s * 1.8} l-${s * 2} 0 Z`} fill={c} opacity="0.85"
              className="flame" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>

        {/* cape — wide, angular, wind-caught to the right */}
        <path d="M56 186 C50 138 56 110 70 96 L100 88 L130 96 C148 112 158 142 166 178 L148 186 C142 156 136 140 128 130 C136 152 140 168 142 186 Z"
          fill="url(#av-cloak)" stroke="#2c2c3a" strokeWidth="1" />

        {/* shoulders / mantle */}
        <path d="M62 108 L100 88 L138 108 L132 124 L100 112 L68 124 Z" fill="#1b1b26" stroke="url(#av-rim)" strokeWidth="1.5" />

        {/* torso */}
        <path d="M74 122 L100 110 L126 122 L122 186 L78 186 Z" fill="#15151d" />
        <path d="M100 112 L100 184" stroke={c} strokeOpacity={glow * 0.5} strokeWidth="1" />
        <circle cx="100" cy="126" r="3" fill={c} opacity={glow} />

        {/* hood — sharp peak */}
        <path d="M72 96 C68 56 80 34 100 30 C120 34 132 56 128 96 C122 78 112 70 100 70 C88 70 78 78 72 96 Z"
          fill="#191922" stroke="url(#av-rim)" strokeWidth="1.5" />
        <path d="M100 30 L100 44" stroke={c} strokeOpacity={glow * 0.7} strokeWidth="1.5" />

        {/* face void + slit eyes */}
        <path d="M80 90 C82 72 90 66 100 66 C110 66 118 72 120 90 C112 98 88 98 80 90 Z" fill="#040407" />
        <path d="M87 82 l9 2.5" stroke={c} strokeWidth="2.6" strokeLinecap="round" opacity={0.4 + glow * 0.6} />
        <path d="M113 82 l-9 2.5" stroke={c} strokeWidth="2.6" strokeLinecap="round" opacity={0.4 + glow * 0.6} />

        {/* rim light on the left edge */}
        <path d="M72 96 C68 56 80 34 100 30 M62 108 L100 88 M74 122 L78 186" fill="none" stroke={c} strokeOpacity={glow * 0.35} strokeWidth="1" />

        {/* ground */}
        <ellipse cx="100" cy="188" rx="56" ry="6" fill={c} opacity={glow * 0.18} />
        <line x1="40" y1="196" x2="160" y2="196" stroke={c} strokeOpacity={glow * 0.5} strokeWidth="1" />
      </svg>

      <div className="aura-meta">
        <div className="charge-track"><div className="charge-fill" style={{ width: `${charge * 100}%`, background: c }} /></div>
        <span className="charge-label">AURA {Math.round(charge * 100)}%</span>
      </div>
    </div>
  );
}

export { TIER_COLORS, AURA_NAMES, auraTier };

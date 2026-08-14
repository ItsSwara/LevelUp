import { useState } from 'react';
import { auraTier, AURA_NAMES } from '../game/engine';

// Electric, saturated at every tier — reads instantly against black.
const TIER_COLORS = ['#7c5cff', '#a855f7', '#ec4899', '#fb923c', '#ffd23f'];

// The Shadow Monarch. `charge` (0..1 = today's quest completion) scales
// the glow on top of an always-visible floor — it should never disappear
// into the background, only brighten as the day fills up.
export default function Avatar({ level, charge }) {
  const tier = auraTier(level);
  const c = TIER_COLORS[tier];
  const [hover, setHover] = useState(false);
  const glow = Math.min(1, 0.55 + charge * 0.45 + (hover ? 0.15 : 0));

  return (
    <div
      className="avatar-wrap"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`Aura charge ${Math.round(charge * 100)}% — complete quests to charge it`}
    >
      <svg viewBox="0 0 200 210" className="avatar-svg" aria-label="Your character">
        <defs>
          <radialGradient id="av-aura" cx="50%" cy="52%" r="55%">
            <stop offset="0%" stopColor={c} stopOpacity={glow * 0.9} />
            <stop offset="45%" stopColor={c} stopOpacity={glow * 0.4} />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="av-cloak" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4a3f70" />
            <stop offset="55%" stopColor="#26213a" />
            <stop offset="100%" stopColor="#16141f" />
          </linearGradient>
          <filter id="av-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* aura field — always on, brightens with charge */}
        <ellipse cx="100" cy="105" rx="92" ry="96" fill="url(#av-aura)" className="aura-breathe" />

        {/* rising aura particles */}
        <g opacity={0.5 + charge * 0.5}>
          {[[22, 122, 3.4], [176, 94, 4.2], [36, 58, 2.8], [168, 152, 3], [150, 36, 3.4], [54, 170, 2.6]].map(([x, y, s], i) => (
            <path key={i} d={`M${x} ${y} l${s} ${s * 1.8} l-${s * 2} 0 Z`} fill={c} opacity="0.95"
              className="flame" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>

        <g filter="url(#av-glow)">
          {/* cape */}
          <path d="M56 186 C50 138 56 110 70 96 L100 88 L130 96 C148 112 158 142 166 178 L148 186 C142 156 136 140 128 130 C136 152 140 168 142 186 Z"
            fill="url(#av-cloak)" stroke={c} strokeOpacity={0.5 + glow * 0.5} strokeWidth="1.5" />

          {/* shoulders / mantle */}
          <path d="M62 108 L100 88 L138 108 L132 124 L100 112 L68 124 Z" fill="#2c2745" stroke={c} strokeOpacity={0.6 + glow * 0.4} strokeWidth="1.75" />

          {/* torso */}
          <path d="M74 122 L100 110 L126 122 L122 186 L78 186 Z" fill="#221f33" />
          <path d="M100 112 L100 184" stroke={c} strokeOpacity={0.4 + glow * 0.6} strokeWidth="1.5" />
          <circle cx="100" cy="126" r="3.5" fill={c} opacity={0.7 + glow * 0.3} />

          {/* hood */}
          <path d="M72 96 C68 56 80 34 100 30 C120 34 132 56 128 96 C122 78 112 70 100 70 C88 70 78 78 72 96 Z"
            fill="#2a2540" stroke={c} strokeOpacity={0.6 + glow * 0.4} strokeWidth="1.75" />
          <path d="M100 30 L100 44" stroke={c} strokeOpacity={0.6 + glow * 0.4} strokeWidth="2" />

          {/* face void + glowing eyes */}
          <path d="M80 90 C82 72 90 66 100 66 C110 66 118 72 120 90 C112 98 88 98 80 90 Z" fill="#050408" />
          <path d="M87 82 l9 2.5" stroke={c} strokeWidth="3" strokeLinecap="round" opacity={0.7 + glow * 0.3} />
          <path d="M113 82 l-9 2.5" stroke={c} strokeWidth="3" strokeLinecap="round" opacity={0.7 + glow * 0.3} />
        </g>

        {/* ground glow */}
        <ellipse cx="100" cy="188" rx="58" ry="7" fill={c} opacity={glow * 0.3} />
        <line x1="38" y1="196" x2="162" y2="196" stroke={c} strokeOpacity={glow * 0.6} strokeWidth="1.5" />
      </svg>

      <div className="aura-meta">
        <div className="charge-track"><div className="charge-fill" style={{ width: `${charge * 100}%`, background: c, boxShadow: `0 0 8px ${c}` }} /></div>
        <span className="charge-label">AURA {Math.round(charge * 100)}%</span>
      </div>
    </div>
  );
}

export { TIER_COLORS, AURA_NAMES, auraTier };

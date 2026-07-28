import { useRef, useState } from 'react';
import { STATS, XP_BY_DIFFICULTY, RANK } from '../game/engine';
import { STAT_ICONS } from './Icons';

const HOLD_MS = 900;
const NODE_GAP = 116;   // vertical distance between nodes
const TOP_PAD = 70;     // room for the avatar above the highest node

// Duolingo-style trail: quests are nodes on a winding path, climbed
// bottom-to-top toward the boss. Only the current node is unlocked;
// your character stands on it and advances as you clear quests.

function nodePos(i, count, width) {
  // i = 0 is the FIRST quest → placed at the bottom of the trail
  const y = TOP_PAD + (count - 1 - i) * NODE_GAP;
  const x = width / 2 + Math.sin(i * 1.9) * width * 0.26;
  return { x, y };
}

function MiniHero({ color }) {
  return (
    <svg viewBox="0 0 60 64" width="52" className="mini-hero">
      <defs>
        <radialGradient id="mh-aura" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="34" rx="26" ry="28" fill="url(#mh-aura)" className="aura-breathe" />
      <path d="M19 56 C18 40 22 34 30 33 C38 34 42 40 41 56 Z" fill="#14141c" stroke={color} strokeWidth="1" strokeOpacity="0.9" />
      <path d="M21 34 C20 20 25 15 30 15 C35 15 40 20 39 34 C36 28 33 26 30 26 C27 26 24 28 21 34 Z" fill="#101018" stroke={color} strokeWidth="1" strokeOpacity="0.9" />
      <path d="M24 32 C25 27 27 25 30 25 C33 25 35 27 36 32 C33 35 27 35 24 32 Z" fill="#060609" />
      <rect x="25.5" y="29.5" width="3.4" height="1.6" rx="0.8" fill={color} />
      <rect x="31" y="29.5" width="3.4" height="1.6" rx="0.8" fill={color} />
    </svg>
  );
}

function HoldButton({ color, onHeld }) {
  const [p, setP] = useState(0);
  const timer = useRef(null);
  const start = () => {
    const t0 = Date.now();
    timer.current = setInterval(() => {
      const f = Math.min(1, (Date.now() - t0) / HOLD_MS);
      setP(f);
      if (f >= 1) { stop(); onHeld(); }
    }, 30);
  };
  const stop = () => { clearInterval(timer.current); setP(0); };
  const R = 15, C = 2 * Math.PI * R;
  return (
    <button className="hold-btn" onPointerDown={start} onPointerUp={stop} onPointerLeave={stop}
      style={{ color }} aria-label="Hold to complete">
      <svg viewBox="0 0 38 38" width="38" height="38">
        <circle cx="19" cy="19" r={R} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
        {p > 0 && (
          <circle cx="19" cy="19" r={R} fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={C} strokeDashoffset={C * (1 - p)} strokeLinecap="round"
            transform="rotate(-90 19 19)" />
        )}
        <path d="M13 19.5l4 4L26 15" fill="none" stroke="currentColor" strokeOpacity={0.35 + p * 0.65} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="hold-hint">HOLD</span>
    </button>
  );
}

function AddQuestForm({ onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [stat, setStat] = useState('mind');
  const [difficulty, setDifficulty] = useState('easy');
  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), stat, difficulty });
    onClose();
  };
  return (
    <div className="honor-check">
      <div className="honor-title">NEW QUEST</div>
      <input
        autoFocus value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="What will you do today?"
      />
      <div className="aq-row">
        <select value={stat} onChange={(e) => setStat(e.target.value)}>
          <option value="mind">Mind</option>
          <option value="spirit">Spirit</option>
          <option value="body">Body</option>
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">E-rank (+10)</option>
          <option value="medium">C-rank (+25)</option>
          <option value="hard">A-rank (+50)</option>
        </select>
      </div>
      <div className="honor-actions">
        <button className="ghost" onClick={onClose}>Cancel</button>
        <button className="solid" onClick={submit}>Add to path</button>
      </div>
    </div>
  );
}

export default function QuestPath({ quests, onComplete, onAdd }) {
  const [logging, setLogging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [log, setLog] = useState('');
  const width = 340;
  const count = quests.length;
  const height = TOP_PAD + Math.max(0, count - 1) * NODE_GAP + 90;

  const currentIdx = quests.findIndex((q) => !q.done); // -1 = all cleared
  const current = currentIdx >= 0 ? quests[currentIdx] : null;
  const doneCount = quests.filter((q) => q.done).length;

  const pts = quests.map((_, i) => nodePos(i, count, width));
  const trail = pts.length
    ? [...pts].reverse().map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`)).join(' ')
    : '';

  const confirm = () => { onComplete(current.id, log); setLogging(false); setLog(''); };

  return (
    <div className="panel path-panel">
      <div className="panel-head">
        <h2 className="panel-title">Today's Path</h2>
        <span className="panel-sub">{doneCount} / {count} cleared</span>
      </div>

      {count === 0 && (
        <div className="path-empty">
          Your path is empty. Add a quest below, or ask your mentor to plan your day.
        </div>
      )}

      <div className="path-scroll">
        <div className="path-stage" style={{ width, height: count ? height : 0 }}>
          <svg className="path-trail" width={width} height={height}>
            <path d={trail} fill="none" stroke="#ffffff14" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d={trail} fill="none" stroke="#ffffff08" strokeWidth="3" strokeDasharray="1 14" strokeLinecap="round" />
          </svg>

          {quests.map((q, i) => {
            const { x, y } = pts[i];
            const stat = STATS[q.stat];
            const Icon = STAT_ICONS[q.stat];
            const state = q.done ? 'done' : i === currentIdx ? 'current' : 'locked';
            return (
              <div key={q.id} className={`path-node ${state} ${q.boss ? 'boss' : ''}`} style={{ left: x, top: y }}>
                {state === 'current' && <MiniHero color={stat.color} />}
                <button
                  className="node-btn"
                  style={{ '--nc': stat.color }}
                  disabled={state !== 'current'}
                  onClick={() => setLogging(true)}
                  aria-label={q.title}
                >
                  {q.done ? (
                    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 12.5l4 4L18 8" fill="none" stroke="#0a0a0f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : q.boss ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 17h16M4 17l-1-9 5 4 4-7 4 7 5-4-1 9" /></svg>
                  ) : (
                    <Icon width="17" height="17" />
                  )}
                </button>
                <div className={`node-label ${i % 2 ? 'left' : 'right'}`}>
                  <div className="node-title">{q.title}</div>
                  <div className="node-meta">
                    <span className="rank" data-rank={RANK[q.difficulty]}>{RANK[q.difficulty]}</span>
                    <span className="xp-badge">+{XP_BY_DIFFICULTY[q.difficulty]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {current ? (
        <div className="path-current">
          <div className="pc-info">
            <div className="pc-kicker">CURRENT QUEST</div>
            <div className="pc-title">{current.title}</div>
          </div>
          {!logging && <HoldButton color={STATS[current.stat].color} onHeld={() => setLogging(true)} />}
        </div>
      ) : count > 0 ? (
        <div className="path-current"><div className="pc-title all-clear">PATH CLEARED — AURA AT FULL BLAZE</div></div>
      ) : null}

      {adding ? (
        <AddQuestForm onAdd={onAdd} onClose={() => setAdding(false)} />
      ) : (
        <button className="add-quest" onClick={() => setAdding(true)}>+ NEW QUEST</button>
      )}

      {logging && current && (
        <div className="honor-check">
          <div className="honor-title">ON MY HONOR</div>
          <input
            autoFocus value={log}
            onChange={(e) => setLog(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
            placeholder="What did you actually do? (one line — your mentor reads this)"
          />
          <div className="honor-actions">
            <button className="ghost" onClick={() => setLogging(false)}>Cancel</button>
            <button className="solid" onClick={confirm}>I swear it's done</button>
          </div>
        </div>
      )}
    </div>
  );
}

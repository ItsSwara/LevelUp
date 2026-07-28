import { useRef, useState } from 'react';
import { STATS, XP_BY_DIFFICULTY, gainXp, loseXp, characterLevel, streakBonus, auraCharge, honorDelta, auraTier, AURA_NAMES } from './game/engine';
import { mockPlayer, mockQuests, mockHistories } from './game/mockData';
import Avatar from './components/Avatar';
import StatPanel from './components/StatPanel';
import QuestPath from './components/QuestPath';
import MentorPanel from './components/MentorPanel';
import ProgressGraph from './components/ProgressGraph';
import LevelUpOverlay from './components/LevelUpOverlay';
import { FlameIcon, MoonIcon, ShieldIcon, STAT_ICONS } from './components/Icons';
import { useMentor } from './mentor/useMentor';
import './App.css';

export default function App() {
  const [player, setPlayer] = useState(mockPlayer);
  const [quests, setQuests] = useState(mockQuests);
  const [levelUp, setLevelUp] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const nextQuestId = useRef(100);

  // Refs mirror state so mentor tool executors always read/write the
  // latest values (tool calls arrive async, between renders).
  const playerRef = useRef(player);
  playerRef.current = player;
  const questsRef = useRef(quests);
  questsRef.current = quests;

  const level = characterLevel(player.stats);
  const charge = auraCharge(quests);

  const saveName = (v) => {
    const name = v.trim().toUpperCase();
    if (name) setPlayer((p) => ({ ...p, name }));
    setEditingName(false);
  };

  const grantXp = (statKey, xp) => {
    const after = gainXp(playerRef.current.stats[statKey], xp);
    setPlayer((p) => ({ ...p, stats: { ...p.stats, [statKey]: { level: after.level, xp: after.xp } } }));
    if (after.leveledUp) {
      setLevelUp({ ...STATS[statKey], level: after.level });
      setTimeout(() => setLevelUp(null), 2200);
    }
  };

  const completeQuest = (id, log) => {
    const quest = questsRef.current.find((q) => q.id === id);
    if (!quest || quest.done) return;
    setQuests((qs) => qs.map((q) => (q.id === id ? { ...q, done: true, log } : q)));
    setPlayer((p) => ({ ...p, honor: Math.max(0, Math.min(100, p.honor + honorDelta(log))) }));
    grantXp(quest.stat, Math.round(XP_BY_DIFFICULTY[quest.difficulty] * streakBonus(playerRef.current.streak)));
  };

  // ── Mentor tool executors: the contract between brain and game ──
  const mentor = useMentor({
    getState: () => ({
      player: playerRef.current,
      today: new Date().toDateString(),
      quests: questsRef.current.map(({ id, title, stat, difficulty, done, log }) => ({ id, title, stat, difficulty, done, log })),
      auraChargePct: Math.round(auraCharge(questsRef.current) * 100),
    }),
    generateQuest: ({ title, stat, difficulty }) => {
      const id = nextQuestId.current++;
      setQuests((qs) => [...qs.filter((q) => !q.boss), { id, title, stat, difficulty, done: false, source: 'mentor', log: '' }, ...qs.filter((q) => q.boss)]);
      return `Quest "${title}" added (${stat}, ${difficulty}, +${XP_BY_DIFFICULTY[difficulty]} XP).`;
    },
    adjustDifficulty: ({ direction, reason }) => {
      const order = ['easy', 'medium', 'hard'];
      setQuests((qs) => qs.map((q) => {
        if (q.done || q.boss) return q;
        const i = order.indexOf(q.difficulty);
        const ni = direction === 'easier' ? Math.max(0, i - 1) : Math.min(2, i + 1);
        return { ...q, difficulty: order[ni] };
      }));
      return `Remaining quests made ${direction}. Reason: ${reason}`;
    },
    applyPenalty: ({ stat, xp, reason }) => {
      setPlayer((p) => ({ ...p, stats: { ...p.stats, [stat]: loseXp(p.stats[stat], xp) } }));
      return `Penalty applied: -${xp} XP to ${stat}. Reason: ${reason}`;
    },
    applyReward: ({ kind, stat, xp, reason }) => {
      if (kind === 'rest_day') {
        setPlayer((p) => ({ ...p, restDaysEarned: p.restDaysEarned + 1 }));
        return `Rest day granted. Reason: ${reason}`;
      }
      grantXp(stat, xp);
      return `Bonus +${xp} XP to ${stat}. Reason: ${reason}`;
    },
    scheduleReminder: ({ message, time, urgency }) => {
      // Phase 3 persists these; for now reminders live for this session
      const delay = (() => {
        const [h, m] = time.split(':').map(Number);
        const t = new Date(); t.setHours(h, m, 0, 0);
        return t.getTime() - Date.now();
      })();
      if (delay > 0) setTimeout(() => alert(`[${urgency.toUpperCase()} REMINDER] ${message}`), Math.min(delay, 2 ** 31 - 1));
      return `Reminder set for ${time} (${urgency}): "${message}"`;
    },
    flagBurnout: ({ signals }) => {
      setPlayer((p) => ({ ...p, burnoutFlagged: true }));
      return `Burnout flagged (${signals}). Difficulty protection active; streak is safe today.`;
    },
    setMode: ({ mode }) => `Mode switched to ${mode}.`,
  });

  return (
    <div className="app">
      <header className="hud">
        <span className="logo">LEVEL<em>UP</em></span>
        <div className="hud-right">
          <span className="hud-chip streak"><FlameIcon /> {player.streak} DAY STREAK</span>
          <span className="hud-chip honor" title="Integrity score. Quests are completed on your word — writing a real one-line log of what you did keeps Honor high; blank or lazy logs erode it. Your mentor reads the logs."><ShieldIcon /> HONOR {player.honor}</span>
          <span className="hud-chip rest"><MoonIcon /> {player.restDaysEarned} REST DAY</span>
        </div>
      </header>

      <section className="hero-strip">
        <div className="hero-left">
          <h1 className="hero-name">{AURA_NAMES[auraTier(level)]}</h1>
          <div className="hero-level-line">
            <span className="hero-level">LV {level}</span>
            <span className="hero-sep" />
            {editingName ? (
              <input
                className="name-input" autoFocus defaultValue={player.name}
                onBlur={(e) => saveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName(e.target.value)}
              />
            ) : (
              <button className="name-chip" onClick={() => setEditingName(true)} title="Rename">
                {player.name}
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4L8 20l-5 1 1-5z" /></svg>
              </button>
            )}
          </div>
          <div className="goals">
            {Object.entries(player.goals).map(([k, g]) => {
              const Icon = STAT_ICONS[k];
              return (
                <div key={k} className="goal-line">
                  <span style={{ color: STATS[k].color }}><Icon width="12" height="12" /></span>
                  <span>{g}</span>
                </div>
              );
            })}
          </div>
        </div>
        <Avatar level={level} charge={charge} />
      </section>

      <main className="layout">
        <section className="col">
          <StatPanel stats={player.stats} />
          <ProgressGraph histories={mockHistories} />
        </section>
        <section className="col">
          <QuestPath quests={quests} onComplete={completeQuest} />
        </section>
        <section className="col">
          <MentorPanel feed={mentor.feed} onSend={mentor.send} busy={mentor.busy} demoMode={mentor.demoMode} />
        </section>
      </main>

      <LevelUpOverlay info={levelUp} />
    </div>
  );
}

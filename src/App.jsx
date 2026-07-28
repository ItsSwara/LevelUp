import { useEffect, useRef, useState } from 'react';
import { STATS, XP_BY_DIFFICULTY, gainXp, loseXp, characterLevel, streakBonus, auraCharge, honorDelta, auraTier, AURA_NAMES } from './game/engine';
import { loadSave, persist, wipeSave, freshPlayer, todayKey, buildHistories } from './game/storage';
import Avatar from './components/Avatar';
import StatPanel from './components/StatPanel';
import QuestPath from './components/QuestPath';
import MentorPanel from './components/MentorPanel';
import ProgressGraph from './components/ProgressGraph';
import LevelUpOverlay from './components/LevelUpOverlay';
import Onboarding from './components/Onboarding';
import { FlameIcon, MoonIcon, ShieldIcon, STAT_ICONS } from './components/Icons';
import { useMentor } from './mentor/useMentor';
import './App.css';

export default function App() {
  const [save, setSave] = useState(() => loadSave());
  const [levelUp, setLevelUp] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const nextQuestId = useRef(Date.now());

  // Ref mirror so async mentor tool calls always see the latest state
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (save) persist(save);
  }, [save]);

  const update = (fn) => setSave((s) => fn(s));
  const setPlayer = (fn) => update((s) => ({ ...s, player: fn(s.player) }));
  const setQuests = (fn) => update((s) => ({ ...s, quests: fn(s.quests) }));

  const grantXp = (statKey, xp) => {
    const after = gainXp(saveRef.current.player.stats[statKey], xp);
    const day = todayKey();
    const hour = new Date().getHours();
    update((s) => ({
      ...s,
      player: { ...s.player, stats: { ...s.player.stats, [statKey]: { level: after.level, xp: after.xp } } },
      xpLog: { ...s.xpLog, [day]: (s.xpLog[day] ?? 0) + xp },
      todayHours: { ...s.todayHours, [hour]: (s.todayHours[hour] ?? 0) + xp },
    }));
    if (after.leveledUp) {
      setLevelUp({ ...STATS[statKey], level: after.level });
      setTimeout(() => setLevelUp(null), 2200);
    }
  };

  const completeQuest = (id, log) => {
    const quest = saveRef.current.quests.find((q) => q.id === id);
    if (!quest || quest.done) return;
    setQuests((qs) => qs.map((q) => (q.id === id ? { ...q, done: true, log } : q)));
    setPlayer((p) => ({ ...p, honor: Math.max(0, Math.min(100, p.honor + honorDelta(log))) }));
    grantXp(quest.stat, Math.round(XP_BY_DIFFICULTY[quest.difficulty] * streakBonus(saveRef.current.player.streak)));
  };

  // ── Mentor tool executors: the contract between brain and game ──
  const mentor = useMentor({
    getState: () => {
      const s = saveRef.current;
      return {
        player: s.player,
        today: new Date().toDateString(),
        quests: s.quests.map(({ id, title, stat, difficulty, done, log }) => ({ id, title, stat, difficulty, done, log })),
        auraChargePct: Math.round(auraCharge(s.quests) * 100),
      };
    },
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

  if (!save) {
    return (
      <Onboarding
        onStart={(name, goals) => {
          const s = {
            player: freshPlayer(name, goals),
            quests: [],
            xpLog: {},
            todayHours: {},
            restDayArmed: false,
            lastDate: todayKey(),
          };
          persist(s);
          setSave(s);
        }}
      />
    );
  }

  const { player, quests } = save;
  const level = characterLevel(player.stats);
  const charge = auraCharge(quests);

  const saveName = (v) => {
    const name = v.trim().toUpperCase();
    if (name) setPlayer((p) => ({ ...p, name }));
    setEditingName(false);
  };

  return (
    <div className="app">
      <header className="hud">
        <span className="logo">LEVEL<em>UP</em></span>
        <div className="hud-right">
          <span className="hud-chip streak"><FlameIcon /> {player.streak} DAY STREAK</span>
          <span className="hud-chip honor" title="Integrity score. Quests are completed on your word — writing a real one-line log of what you did keeps Honor high; blank or lazy logs erode it. Your mentor reads the logs."><ShieldIcon /> HONOR {player.honor}</span>
          <button
            className={`hud-chip rest ${save.restDayArmed ? 'armed' : ''}`}
            title={player.restDaysEarned > 0 ? 'Click to use a rest day today — your streak survives with zero quests done' : 'Earn rest days through streaks — the mentor grants them'}
            onClick={() => player.restDaysEarned > 0 && update((s) => ({ ...s, restDayArmed: !s.restDayArmed }))}
          >
            <MoonIcon /> {save.restDayArmed ? 'RESTING TODAY' : `${player.restDaysEarned} REST DAY`}
          </button>
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
          <ProgressGraph histories={buildHistories(save.xpLog, save.todayHours)} />
        </section>
        <section className="col">
          <QuestPath
            quests={quests}
            onComplete={completeQuest}
            onAdd={({ title, stat, difficulty }) => {
              const id = nextQuestId.current++;
              setQuests((qs) => [...qs.filter((q) => !q.boss), { id, title, stat, difficulty, done: false, source: 'user', log: '' }, ...qs.filter((q) => q.boss)]);
            }}
          />
        </section>
        <section className="col">
          <MentorPanel feed={mentor.feed} onSend={mentor.send} busy={mentor.busy} demoMode={mentor.demoMode} />
        </section>
      </main>

      <footer className="app-foot">
        <button className="wipe-btn" onClick={() => { if (confirm('Delete your save and start over?')) { wipeSave(); location.reload(); } }}>
          RESET SAVE
        </button>
      </footer>

      <LevelUpOverlay info={levelUp} />
    </div>
  );
}

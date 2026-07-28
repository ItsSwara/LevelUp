// ── Persistence + daily cycle ────────────────────────────────
// Everything lives in one localStorage key. On load we run the daily
// rollover: archive yesterday's XP, advance/break the streak, clear
// completed quests. Pure functions except load/save.

const KEY = 'levelup-save-v1';

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10); // YYYY-MM-DD

export function freshPlayer(name, goals) {
  return {
    name: name.toUpperCase(),
    title: 'Aura Farmer',
    streak: 0,
    restDaysEarned: 0,
    honor: 100,
    burnoutFlagged: false,
    stats: {
      mind:   { level: 1, xp: 0 },
      spirit: { level: 1, xp: 0 },
      body:   { level: 1, xp: 0 },
    },
    goals,
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    return rollover(save);
  } catch {
    return null;
  }
}

export function persist(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...save, lastDate: todayKey() }));
  } catch { /* storage full/blocked — game still works, just won't persist */ }
}

export function wipeSave() {
  localStorage.removeItem(KEY);
}

// Advance the world to today if the save is from an earlier day.
function rollover(save) {
  const today = todayKey();
  if (save.lastDate === today) return save;

  const earnedYesterday = (save.xpLog?.[save.lastDate] ?? 0) > 0;
  const player = { ...save.player };

  if (earnedYesterday) {
    player.streak += 1;
  } else if (player.burnoutFlagged && player.restDaysEarned === 0) {
    // burnout protection: streak survives one empty day
  } else if (!earnedYesterday && player.restDaysEarned > 0 && save.restDayArmed) {
    player.restDaysEarned -= 1; // spent the earned day off
  } else {
    player.streak = 0;
  }
  player.burnoutFlagged = false;

  return {
    ...save,
    player,
    // completed dailies clear; unfinished ones and boss quests carry over
    quests: save.quests.filter((q) => !q.done || q.boss),
    todayHours: {},
    restDayArmed: false,
    lastDate: today,
  };
}

// ── Momentum graph data from the real XP log ─────────────────
const short = (iso) => {
  const d = new Date(iso + 'T12:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function buildHistories(xpLog = {}, todayHours = {}) {
  const days = (n) => Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    const iso = todayKey(d);
    return { label: short(iso), xp: xpLog[iso] ?? 0 };
  });

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    const prefix = d.toISOString().slice(0, 7); // YYYY-MM
    const xp = Object.entries(xpLog)
      .filter(([k]) => k.startsWith(prefix))
      .reduce((s, [, v]) => s + v, 0);
    return { label: d.toLocaleDateString('en-US', { month: 'short' }), xp };
  });

  const hours = ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'].map((label, i) => {
    const bucket = [6, 9, 12, 15, 18, 21, 24][i];
    const xp = Object.entries(todayHours)
      .filter(([h]) => Number(h) < bucket && Number(h) >= (i ? [6, 9, 12, 15, 18, 21][i - 1] : 0))
      .reduce((s, [, v]) => s + v, 0);
    return { label, xp };
  });

  return { D: hours, W: days(7), M: days(30), Y: months };
}

// ── LevelUp game math ─────────────────────────────────────────
// Pure functions only: no React, no storage. The mentor brain and
// UI both call into this, so tuning numbers happens in one place.

export const STATS = {
  mind:   { key: 'mind',   label: 'Mind',   color: '#8b5cff' },
  spirit: { key: 'spirit', label: 'Spirit', color: '#ff4d6d' },
  body:   { key: 'body',   label: 'Body',   color: '#2dd4a7' },
};

export const XP_BY_DIFFICULTY = { easy: 10, medium: 25, hard: 50, boss: 120 };
export const RANK = { easy: 'E', medium: 'C', hard: 'A', boss: 'S' };

// XP needed to go from `level` to `level + 1`
export const xpForLevel = (level) => 100 * level;

// Character level = derived from the three stat levels
export const characterLevel = (stats) =>
  Math.max(1, Math.floor((stats.mind.level + stats.spirit.level + stats.body.level) / 2));

// Apply xp to a stat, returning { level, xp, leveledUp }
export function gainXp(stat, amount) {
  let { level, xp } = stat;
  xp += amount;
  let leveledUp = false;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    leveledUp = true;
  }
  return { level, xp, leveledUp };
}

// Penalties never de-level; they floor at 0 xp within the current level.
export function loseXp(stat, amount) {
  return { ...stat, xp: Math.max(0, stat.xp - amount) };
}

export const streakBonus = (streak) =>
  streak >= 14 ? 1.5 : streak >= 7 ? 1.25 : streak >= 3 ? 1.1 : 1;

// Aura tier drives the avatar's long-term visual evolution
export function auraTier(level) {
  if (level >= 20) return 4;
  if (level >= 12) return 3;
  if (level >= 6)  return 2;
  if (level >= 3)  return 1;
  return 0;
}
export const AURA_NAMES = ['NOVICE', 'SPARK', 'AWAKENED', 'BLAZING', 'RADIANT'];

// Today's aura charge (0..1): how lit the avatar is right now.
export const auraCharge = (quests) => {
  if (!quests.length) return 0;
  return quests.filter((q) => q.done).length / quests.length;
};

// Honor: starts at 100. Empty logs erode it slightly; written logs restore it.
// The Phase-2 mentor reads the logs themselves to judge consistency.
export function honorDelta(log) {
  return log && log.trim().length >= 8 ? +1 : -2;
}

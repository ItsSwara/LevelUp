// Fake state for the Phase-1 static shell. Replaced by real
// persisted state in Phase 3.

export const mockPlayer = {
  name: 'WEGA',
  title: 'Aura Farmer',
  streak: 5,
  restDaysEarned: 1,
  honor: 96,
  stats: {
    mind:   { level: 4, xp: 130 },
    spirit: { level: 3, xp: 210 },
    body:   { level: 2, xp: 45 },
  },
  goals: {
    mind:   'Pass the calculus exam',
    spirit: 'Reduce anxiety, journal daily',
    body:   'Run a 5K by September',
  },
};

export const mockQuests = [
  { id: 1, title: 'Solve 10 calc integration problems', stat: 'mind',   difficulty: 'medium', done: true,  source: 'mentor', log: 'did probs 1-10 from ch.7, got 8/10' },
  { id: 2, title: '10-minute evening journal',           stat: 'spirit', difficulty: 'easy',   done: true,  source: 'mentor', log: 'wrote about exam stress' },
  { id: 3, title: '2K training run',                     stat: 'body',   difficulty: 'medium', done: false, source: 'mentor', log: '' },
  { id: 4, title: 'Review lecture 7 notes',              stat: 'mind',   difficulty: 'easy',   done: false, source: 'user',   log: '' },
  { id: 5, title: 'Calc midterm — Aug 4',                stat: 'mind',   difficulty: 'boss',   done: false, source: 'mentor', log: '', boss: true },
];

// XP history per range (LeetCode-style consistency views).
// D = today by hour, W = last 7 days, M = last 30 days (weekly buckets
// would hide dips, so daily), Y = last 12 months.
const seeded = (n, max, seed = 7) =>
  Array.from({ length: n }, (_, i) => Math.round(Math.abs(Math.sin(i * seed + 2)) * max * (i % 5 ? 1 : 0.15)));

export const mockHistories = {
  D: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'].map((label, i) => ({ label, xp: [0, 25, 10, 0, 35, 20][i] })),
  W: ['Jul 21', 'Jul 22', 'Jul 23', 'Jul 24', 'Jul 25', 'Jul 26', 'Jul 27'].map((label, i) => ({ label, xp: [25, 55, 80, 70, 95, 85, 35][i] })),
  M: seeded(30, 95, 3).map((xp, i) => ({ label: i < 3 ? `Jun ${28 + i}` : `Jul ${i - 2}`, xp })),
  Y: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((label, i) => ({ label, xp: seeded(12, 900, 5)[i] })),
};

export const mockMentorFeed = [
  { role: 'mentor', mode: 'coach', text: "5-day streak. That's momentum, not luck — protect it. Today's focus: that 2K run before the evening slump hits." },
  { role: 'user', text: 'feeling kinda tired today ngl' },
  { role: 'mentor', mode: 'therapist', text: "Heard. Tired after 5 strong days is normal, not failure. Want to swap the run for a 15-min walk today and keep the streak alive? You've also earned a rest day — it's yours whenever you want it." },
];

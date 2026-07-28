// Zero-cost stand-in for the Claude API. Returns responses in the SAME
// shape as /api/mentor ({content: [text | tool_use blocks]}), so
// useMentor runs the identical agentic pipeline — tools execute, quests
// appear, modes switch — just with scripted reasoning instead of a model.
// Used automatically when the API is unreachable or has no credits.

let idCounter = 1;
const tool = (name, input) => ({ type: 'tool_use', id: `demo_${idCounter++}`, name, input });
const text = (t) => ({ type: 'text', text: t });

const QUEST_POOL = {
  body:   [['15-minute walk or jog', 'easy'], ['2K training run', 'medium'], ['30-min strength workout', 'medium']],
  mind:   [['Review one lecture of notes', 'easy'], ['Solve 10 practice problems', 'medium'], ['1-hour deep-work study block', 'hard']],
  spirit: [['5-minute breathing exercise', 'easy'], ['10-minute evening journal', 'easy'], ['Screen-free hour before bed', 'medium']],
};

function pickQuest(stat, state) {
  const existing = new Set(state.quests.map((q) => q.title));
  const pool = QUEST_POOL[stat].filter(([t]) => !existing.has(t));
  return (pool[0] ?? QUEST_POOL[stat][0]);
}

export function demoRespond(userText, state, askedWhy) {
  const t = userText.toLowerCase();
  const statAsked = ['body', 'mind', 'spirit'].find((s) => t.includes(s));

  // Burnout / overwhelm signals → therapist mode, ease off
  if (/(tired|exhaust|burn|overwhelm|stress|too much|can'?t do this|anxious)/.test(t)) {
    return [
      tool('escalate_to_therapist_mode', { mode: 'therapist' }),
      tool('flag_burnout', { signals: 'User language indicates exhaustion/overwhelm' }),
      tool('adjust_difficulty', { direction: 'easier', reason: 'Protecting you from burnout — we scale down, not quit' }),
      text("Heard. Pushing through exhaustion isn't discipline, it's debt. I've eased today's quests and your streak is safe. What's been draining you the most this week?"),
    ];
  }

  // Missed tasks → ask why first (never punish blindly)
  if (/(missed|skip|didn'?t do|failed|behind)/.test(t) && !askedWhy) {
    return [text("Before anything else — what happened? Genuinely: was it exhaustion, something outside your control, or just avoidance? No penalty until I understand, and maybe not even then.")];
  }
  if (askedWhy && /(lazy|avoid|procrast|no reason|just didn'?t)/.test(t)) {
    return [
      tool('apply_penalty', { stat: 'spirit', xp: 10, reason: 'Acknowledged avoidance — small penalty, clean slate' }),
      text("Respect for the honesty — that's worth more than the XP. Small penalty applied, slate wiped. Today's a new run."),
    ];
  }
  if (askedWhy) {
    return [
      tool('adjust_difficulty', { direction: 'easier', reason: 'Circumstances outside your control — no penalty' }),
      text("That's not a discipline problem, that's life happening. No penalty. I've lightened the load — let's just win today."),
    ];
  }

  // Quest requests
  if (/(quest|task|todo|to do|what should i|give me|plan)/.test(t)) {
    const stat = statAsked ?? ['body', 'mind', 'spirit'][state.quests.length % 3];
    const [title, difficulty] = pickQuest(stat, state);
    return [
      tool('generate_quest', { title, stat, difficulty }),
      text(`Added to your path. One node at a time — hold the ring when it's done, and log it honestly.`),
    ];
  }

  // Streak / reward
  if (/(streak|reward|rest day|break)/.test(t)) {
    if (state.player.streak >= 7) {
      return [
        tool('apply_reward', { kind: 'rest_day', stat: 'spirit', xp: 0, reason: `${state.player.streak}-day streak — earned, not given` }),
        text("You've earned this one. Rest is part of the program, not a failure state. Enjoy it guilt-free."),
      ];
    }
    return [text(`You're at ${state.player.streak} days — rest days unlock at 7. ${7 - state.player.streak} more and it's yours. Keep stacking.`)];
  }

  // Strategy / goals
  if (/(goal|milestone|long.?term|strategy|how do i)/.test(t)) {
    return [
      tool('escalate_to_therapist_mode', { mode: 'strategist' }),
      text("Think like a CEO planning quarters: your goals are the year, weeks are sprints, today's quests are the standup. Pick the goal that scares you most and I'll break it into daily nodes — which one?"),
    ];
  }

  // Default coach
  return [text(`${state.auraChargePct}% aura today with a ${state.player.streak}-day streak behind you. The next node on your path is all that matters right now — go take it.`)];
}

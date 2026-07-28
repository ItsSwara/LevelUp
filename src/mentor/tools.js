// ── Mentor tool definitions ──────────────────────────────────
// These schemas are sent to Claude; the matching executors live in
// useMentor.js and act on game state. Adding a tool = add schema here
// + executor there. The UI never needs to change.

export const MENTOR_TOOLS = [
  {
    name: 'generate_quest',
    description:
      "Create a new quest on today's path, tied to one of the user's long-term goals. Use when the user asks for tasks, when their day looks empty, or when re-planning after burnout/difficulty changes.",
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short actionable quest title, e.g. "Solve 10 integration problems"' },
        stat: { type: 'string', enum: ['mind', 'spirit', 'body'] },
        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
      },
      required: ['title', 'stat', 'difficulty'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'adjust_difficulty',
    description:
      "Temporarily raise or lower the difficulty of the user's remaining (incomplete) quests. Lower it when you detect overload/burnout; raise it when the user is cruising and wants a challenge.",
    input_schema: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['easier', 'harder'] },
        reason: { type: 'string', description: 'One sentence shown to the user explaining why' },
      },
      required: ['direction', 'reason'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'apply_penalty',
    description:
      'Apply an in-game XP penalty to a stat. ONLY use after you have asked the user why they missed tasks and judged the reason to be avoidable (laziness/avoidance). Never penalize burnout, illness, or external crises.',
    input_schema: {
      type: 'object',
      properties: {
        stat: { type: 'string', enum: ['mind', 'spirit', 'body'] },
        xp: { type: 'integer', description: 'XP to remove, 5-40' },
        reason: { type: 'string' },
      },
      required: ['stat', 'xp', 'reason'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'apply_reward',
    description:
      'Grant a reward: bonus XP to a stat, or an earned rest day (a guilt-free day off from quests). Use for consistent streaks (7+ days) or exceptional effort.',
    input_schema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['bonus_xp', 'rest_day'] },
        stat: { type: 'string', enum: ['mind', 'spirit', 'body'], description: 'Required when kind is bonus_xp; for rest_day pass any value (ignored)' },
        xp: { type: 'integer', description: 'Bonus XP amount when kind is bonus_xp; pass 0 for rest_day' },
        reason: { type: 'string' },
      },
      required: ['kind', 'stat', 'xp', 'reason'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'schedule_reminder',
    description:
      'Schedule an in-app reminder for later today. Escalation levels: gentle (morning nudge), firm (evening), last_call (near midnight).',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        time: { type: 'string', description: '24h clock HH:MM local time' },
        urgency: { type: 'string', enum: ['gentle', 'firm', 'last_call'] },
      },
      required: ['message', 'time', 'urgency'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'flag_burnout',
    description:
      "Record that you've detected burnout signals (missed tasks + exhausted/overwhelmed language). This lowers quest difficulty, protects the streak for a day, and switches your tone to therapist mode.",
    input_schema: {
      type: 'object',
      properties: {
        signals: { type: 'string', description: 'What you observed that indicates burnout' },
      },
      required: ['signals'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'escalate_to_therapist_mode',
    description:
      'Switch your active mode. Use therapist when the user seems stressed/overwhelmed, strategist for goal-breakdown planning, coach as the motivating default.',
    input_schema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['coach', 'therapist', 'strategist'] },
      },
      required: ['mode'],
      additionalProperties: false,
    },
    strict: true,
  },
];

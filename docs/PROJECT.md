# LevelUp — Project Doc

## Concept

Most habit apps are checklists with a coat of paint. LevelUp tries to be an actual RPG: you have a character, an aura, a level, and three stats that only move because of things you did in real life. The AI layer is not a chatbot bolted onto a to-do list — it's an agent with tools that can change the game state on its own judgment, the way a real coach would.

Three pillars, one character:

- 🧠 **Mind** — academic goals (exams, study plans, assignments)
- ❤️ **Spirit** — mental health (journaling, reflection, rest)
- 💪 **Body** — physical goals (training, fitness milestones)

## Design decisions and why

**Dark, minimal UI instead of a cute game skin.** Early versions leaned cartoonish; user feedback pushed toward something closer to a premium product (Trionn-style: near-black canvas, huge display type, hairline borders, one accent color, zero emoji, custom stroke icons). The RPG feel comes from mechanics (aura, XP, quest path, level-up bursts), not decoration.

**Duolingo-style quest path, not a checklist.** Quests are nodes on a winding trail; the character stands on the current node and visibly climbs it as you clear quests, with a boss node at the summit for the big deadline (exam, race day). Locked-in-order progression creates the same climb-the-ladder pull Duolingo uses.

**The avatar's aura is functional, not decorative.** It's dim when you've done nothing today and blazes as you clear quests — a glance at the character tells you your day's status. Long-term level also shifts the aura through five tiers (Novice → Radiant).

**No screenshots, but not blind trust either — the honor system.** Completing a quest requires a deliberate press-and-hold ("on my honor") plus a one-line log of what you actually did. There's no verification, but there's friction (you can't absent-mindedly tick a box) and a paper trail: an Honor score erodes on lazy/blank logs, and the mentor reads every log, which means it can notice patterns a screenshot never could (vague logs, suspiciously fast completions, logs that don't match the stated goal).

**Agentic, not single-shot.** The mentor doesn't just answer questions — it's given real tools (`generate_quest`, `apply_penalty`, `apply_reward`, `flag_burnout`, `adjust_difficulty`, `schedule_reminder`, `escalate_to_therapist_mode`) and a full snapshot of game state with every message, and decides which to call. A single user message like "I'm exhausted and behind on everything" can trigger three tool calls in sequence — mode switch to therapist, burnout flag, difficulty adjustment — before it even writes a reply.

**Never punish blindly.** The system prompt hard-codes the rule: on missed tasks, ask why first. Burnout, illness, or a real crisis get no penalty and a difficulty pullback instead. Only confirmed avoidance after an honest conversation gets a (small) XP penalty. Streaks of 7+ days can earn a real rest day — framed as earned, not a loophole.

**Safety guardrail that overrides everything else.** The mentor is explicitly never a licensed therapist. If the conversation surfaces anything resembling a real mental-health crisis (self-harm, abuse, etc.), the system prompt instructs it to drop all game framing immediately and point to real resources — this rule sits above every other instruction in the prompt.

## The zero-cost fallback

The hackathon budget was $0. Rather than block the whole mentor feature on API credits, `useMentor.js` tries the live Claude API first and transparently falls back to `demoBrain.js` — a small scripted "brain" that returns responses in the *exact same shape* the real API would (text blocks + tool-use blocks), so the entire tool-execution pipeline runs identically either way. The UI marks demo responses with a visible `DEMO` tag so it's never dishonest about what's live. Add API credits later and the next message uses the real model automatically — no code changes.

## Architecture

```
src/game/       pure functions — XP curve, streak bonuses, honor delta, aura tiers, save/load + daily rollover
src/components/ presentational only — no game logic lives here
src/mentor/     the agent brain, fully decoupled from React:
  systemPrompt.js   persona, modes, behavioral + safety rules
  tools.js          strict JSON-schema tool definitions sent to Claude
  useMentor.js      the tool-calling loop (fetch -> execute tools -> feed results back -> repeat)
  demoBrain.js      zero-cost fallback, same response shape as the real API
api/mentor.js   serverless proxy — the only place ANTHROPIC_API_KEY exists
dev-api.mjs     local stand-in for that proxy during `npm run dev`
```

`useMentor` takes a plain `actions` object from `App.jsx` (`generateQuest`, `applyPenalty`, ...) rather than importing React state directly — the brain has zero UI dependencies and could be swapped onto a different frontend without touching a line of prompt or tool logic.

### Data model

Everything lives in one localStorage record: `player` (stats, streak, honor, goals), `quests` (today's path), `xpLog` (date → XP, powers the Momentum graph), `todayHours` (hour → XP, powers the daily view). On load, `storage.js` runs a daily rollover: if the last save is from a previous day, completed quests clear, the streak advances or breaks based on whether any XP was earned, and burnout protection or an armed rest day can save the streak for one empty day.

## What's built (as of this write-up)

- Full gamified UI shell: hero-strip with editable name and aura-tier title, animated aura avatar, stat bars, Duolingo-style quest path with hold-to-complete honor logging, D/W/M/Y momentum graph, level-up burst animation
- Character-creation onboarding (name + one goal per stat)
- Full localStorage persistence with daily rollover, streak, and rest-day logic
- Agentic mentor with all 7 tools wired to real game state, streaming through a real Claude Opus 5 tool-calling loop with automatic safety-refusal fallback
- Zero-cost offline demo mentor with an honest UI indicator

## What's next (stretch goals)

- **Escalating reminders through the day** — the `schedule_reminder` tool already fires browser alerts at a given time; the next step is a proper notification UI (gentle morning nudge → firmer evening → last-call) instead of a blocking `alert()`.
- **Google Calendar integration** — OAuth connect, read upcoming exams/deadlines, factor them into quest generation and boss-quest scheduling.
- **Boss battles / milestones UI** — currently a single boss node on the path; could expand into a dedicated "exam week" or "race day" event view.

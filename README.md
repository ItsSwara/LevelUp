# LevelUp

A gamified RPG life-mentor. Three real-life stats — 🧠 Mind, ❤️ Spirit, 💪 Body — leveled by completing daily quests tied to your actual goals, coached by an agentic AI mentor built on the Claude API.

Built solo for [hackathon name] in 9 days.

## What it is

Not a to-do list with a skin. LevelUp is a dark-fantasy RPG shell — a Duolingo-style quest path, a hooded character whose aura literally charges as you clear the day, XP bars, level-up bursts — wired to a mentor that doesn't just chat, it **acts**: it generates quests, adjusts difficulty, applies rewards and penalties, flags burnout, and switches between coach / therapist / strategist personas, all through real Claude tool-calling.

Proof of work is honor-based, not screenshot-based: completing a quest is a deliberate hold-to-confirm ritual plus a one-line honest log of what you actually did. The mentor reads those logs.

## Try it

```bash
npm install
npm run dev
```

Opens the app at `http://localhost:5173` and a local API stand-in at `http://localhost:8787` (both start together via `npm run dev`).

To talk to the real Claude mentor instead of the offline demo brain, copy `.env.example` to `.env` and add your key from [console.anthropic.com](https://console.anthropic.com). No key (or no credits)? The app automatically falls back to a scripted offline mentor — same tool-calling pipeline, zero cost, tagged `DEMO` in the UI so it's never pretending to be live.

## Architecture

```
src/
  game/          pure game logic — XP curve, streaks, honor, save/load, daily rollover
  components/    UI only — Avatar, QuestPath, StatPanel, MentorPanel, Onboarding, ...
  mentor/        the agent brain — system prompt, tool schemas, the tool-calling loop, demo fallback
api/mentor.js    serverless proxy — the only place the API key exists
dev-api.mjs      local stand-in for that same proxy during `npm run dev`
```

The mentor brain is deliberately decoupled from the UI: `useMentor.js` takes a plain `actions` object (`generateQuest`, `applyPenalty`, `flagBurnout`, ...) and knows nothing about React state — `App.jsx` supplies the wiring. Swap the UI, the model, or the tool set independently.

**Why a server at all?** The API key can never ship to the browser — anyone could read it from dev tools and spend your credits. `api/mentor.js` is the one place it lives; the client only ever calls `/api/mentor`.

## The mentor's tools

| Tool | What it does |
|---|---|
| `generate_quest` | Adds a quest to today's path, tied to a stated goal |
| `adjust_difficulty` | Eases or raises remaining quests |
| `apply_penalty` | Small XP deduction — only after asking *why*, and only for avoidable misses |
| `apply_reward` | Bonus XP or an earned rest day for real streaks |
| `schedule_reminder` | Escalating nudges through the day |
| `flag_burnout` | Detects overload signals, protects the streak, eases the load |
| `escalate_to_therapist_mode` | Switches persona: coach / therapist / strategist |

Guardrails are hard-coded in the system prompt: the mentor is never a licensed therapist, never diagnoses, and routes anything resembling a real crisis to real help instead of staying in the game.

## Stack

Vite + React, vanilla CSS (no framework), Claude Opus 5 via the Anthropic SDK, localStorage persistence, deployed on Vercel. No backend database — the serverless function only proxies the API call.

See [`docs/PROJECT.md`](docs/PROJECT.md) for the full write-up: design decisions, the honor system, and what's left for future phases.

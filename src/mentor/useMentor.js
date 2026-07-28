import { useRef, useState } from 'react';
import { MENTOR_TOOLS } from './tools';
import { SYSTEM_PROMPT } from './systemPrompt';
import { demoRespond } from './demoBrain';

// The agentic loop. Each turn:
//   1. POST conversation (+ current game state) to /api/mentor
//   2. Claude replies with text and/or tool_use blocks
//   3. We execute each tool against game state (via the actions object
//      App provides) and send tool_results back
//   4. Repeat until Claude stops calling tools
//
// If the API is unreachable (no key / no credits), the loop transparently
// falls back to demoBrain.js — same block format, same tool pipeline,
// scripted reasoning. The feed marks those turns as demo so it's honest.
//
// `actions` is the contract between brain and game:
//   { getState, generateQuest, adjustDifficulty, applyPenalty, applyReward,
//     scheduleReminder, flagBurnout, setMode }
// Each returns a short string describing what happened — Claude reads it.
export function useMentor(actions) {
  const [feed, setFeed] = useState([]);
  const [busy, setBusy] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const history = useRef([]); // raw API messages (kept outside render state)
  const mode = useRef('coach');
  const askedWhy = useRef(false);
  const MAX_TURNS = 6;

  const pushFeed = (item) => setFeed((f) => [...f, item]);

  const executeTool = (name, input) => {
    switch (name) {
      case 'generate_quest': return actions.generateQuest(input);
      case 'adjust_difficulty': return actions.adjustDifficulty(input);
      case 'apply_penalty': return actions.applyPenalty(input);
      case 'apply_reward': return actions.applyReward(input);
      case 'schedule_reminder': return actions.scheduleReminder(input);
      case 'flag_burnout': mode.current = 'therapist'; return actions.flagBurnout(input);
      case 'escalate_to_therapist_mode': mode.current = input.mode; return actions.setMode(input);
      default: return `Unknown tool: ${name}`;
    }
  };

  // Renders one API-shaped response (text + tool_use blocks) into the feed
  // and the game. Returns tool_result blocks, or null if no tools ran.
  const applyBlocks = (blocks, isDemo) => {
    // Process in order so a mode switch colors the text that follows it
    const results = [];
    for (const block of blocks) {
      if (block.type === 'text' && block.text.trim()) {
        pushFeed({ role: 'mentor', mode: mode.current, text: block.text, demo: isDemo });
      } else if (block.type === 'tool_use') {
        const result = executeTool(block.name, block.input);
        pushFeed({ role: 'action', tool: block.name, text: result });
        results.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }
    }
    return results.length ? results : null;
  };

  const runDemo = (userText) => {
    const blocks = demoRespond(userText, actions.getState(), askedWhy.current);
    if (blocks.some((b) => b.type === 'text' && /what happened|was it exhaustion/i.test(b.text))) {
      askedWhy.current = true;
    } else if (blocks.some((b) => b.type === 'tool_use' && ['apply_penalty', 'adjust_difficulty'].includes(b.name))) {
      askedWhy.current = false;
    }
    applyBlocks(blocks, true);
  };

  const send = async (userText) => {
    if (busy) return;
    setBusy(true);
    pushFeed({ role: 'user', text: userText });

    if (demoMode) {
      // Small delay so it feels like thinking, not a vending machine
      await new Promise((r) => setTimeout(r, 600));
      runDemo(userText);
      setBusy(false);
      return;
    }

    // Fresh game-state snapshot travels with every user turn
    history.current.push({
      role: 'user',
      content: `<game_state>${JSON.stringify(actions.getState())}</game_state>\n\n${userText}`,
    });

    try {
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const r = await fetch('/api/mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: SYSTEM_PROMPT,
            messages: history.current,
            tools: MENTOR_TOOLS,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `Server error ${r.status}`);

        if (data.stop_reason === 'refusal') {
          pushFeed({ role: 'mentor', mode: mode.current, text: "I can't help with that one — let's get back to your quests." });
          break;
        }

        history.current.push({ role: 'assistant', content: data.content });
        const results = applyBlocks(data.content, false);
        if (!results) break;
        history.current.push({ role: 'user', content: results });
      }
    } catch {
      // API unavailable (no key / no credits / offline) → demo brain takes over
      setDemoMode(true);
      pushFeed({ role: 'error', text: 'Live API unavailable — switched to offline demo mentor.' });
      runDemo(userText);
    } finally {
      setBusy(false);
    }
  };

  return { feed, send, busy, demoMode };
}

import { useState } from 'react';
import { STATS } from '../game/engine';
import { STAT_ICONS } from './Icons';

const PLACEHOLDERS = {
  mind: 'e.g. Pass the calculus exam',
  spirit: 'e.g. Journal daily, reduce anxiety',
  body: 'e.g. Run a 5K by September',
};

// First-visit character creation: name + one long-term goal per pillar.
export default function Onboarding({ onStart }) {
  const [name, setName] = useState('');
  const [goals, setGoals] = useState({ mind: '', spirit: '', body: '' });

  const ready = name.trim() && Object.values(goals).every((g) => g.trim());
  const start = (e) => {
    e.preventDefault();
    if (!ready) return;
    onStart(name.trim(), {
      mind: goals.mind.trim(),
      spirit: goals.spirit.trim(),
      body: goals.body.trim(),
    });
  };

  return (
    <div className="onboarding">
      <form className="ob-card" onSubmit={start}>
        <div className="ob-kicker">CHARACTER CREATION</div>
        <h1 className="ob-title">BEGIN YOUR<br />ASCENT</h1>
        <p className="ob-sub">
          Three stats. Real-life quests. An AI mentor watching your back.
          Set the long-term goals your quests will climb toward.
        </p>

        <label className="ob-label">YOUR NAME</label>
        <input
          className="ob-input" autoFocus value={name} maxLength={16}
          onChange={(e) => setName(e.target.value)}
          placeholder="What do we call you?"
        />

        {Object.values(STATS).map((s) => {
          const Icon = STAT_ICONS[s.key];
          return (
            <div key={s.key}>
              <label className="ob-label" style={{ color: s.color }}>
                <Icon width="12" height="12" /> {s.label.toUpperCase()} GOAL
              </label>
              <input
                className="ob-input" value={goals[s.key]} maxLength={80}
                onChange={(e) => setGoals((g) => ({ ...g, [s.key]: e.target.value }))}
                placeholder={PLACEHOLDERS[s.key]}
              />
            </div>
          );
        })}

        <button className="ob-start" type="submit" disabled={!ready}>
          START AT LEVEL 1
        </button>
      </form>
    </div>
  );
}

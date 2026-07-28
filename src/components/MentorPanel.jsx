import { useEffect, useRef, useState } from 'react';

const MODE_STYLE = {
  coach:      { label: 'COACH',      color: '#4dd0ff' },
  therapist:  { label: 'THERAPIST',  color: '#ff4d6d' },
  strategist: { label: 'STRATEGIST', color: '#ffb84d' },
};

export default function MentorPanel({ feed, onSend, busy, demoMode }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [feed, busy]);

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="panel mentor-panel">
      <div className="panel-head">
        <h2 className="panel-title">Mentor</h2>
        {demoMode ? <span className="demo-tag" title="Live API unavailable — scripted demo responses">DEMO</span> : <span className="live-dot" />}
      </div>
      <div className="mentor-feed" ref={scrollRef}>
        {feed.length === 0 && (
          <div className="mentor-empty">
            Your mentor is watching your stats, streak, and honor logs.
            Say hello, ask for today's quests, or tell it how you're doing.
          </div>
        )}
        {feed.map((m, i) => {
          if (m.role === 'mentor') {
            return (
              <div key={i} className="msg mentor-msg">
                <span className="mode-chip" style={{ color: MODE_STYLE[m.mode].color }}>{MODE_STYLE[m.mode].label}{m.demo ? ' · DEMO' : ''}</span>
                {m.text}
              </div>
            );
          }
          if (m.role === 'action') {
            return <div key={i} className="msg action-msg">⟡ {m.text}</div>;
          }
          if (m.role === 'error') {
            return <div key={i} className="msg error-msg">{m.text}</div>;
          }
          return <div key={i} className="msg user-msg">{m.text}</div>;
        })}
        {busy && <div className="msg mentor-msg thinking-msg">…</div>}
      </div>
      <form className="mentor-input" onSubmit={submit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? 'Mentor is thinking…' : 'Talk to your mentor'}
          disabled={busy}
        />
        <button type="submit" aria-label="Send" disabled={busy}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}

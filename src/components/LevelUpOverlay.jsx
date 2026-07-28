// Full-screen celebration when a stat levels up. Rendered briefly, then
// dismissed by App via a timeout.
export default function LevelUpOverlay({ info }) {
  if (!info) return null;
  return (
    <div className="levelup-overlay">
      <div className="levelup-burst" style={{ '--c': info.color }}>
        <div className="levelup-rays" />
        <div className="levelup-text">LEVEL UP!</div>
        <div className="levelup-sub">{info.label.toUpperCase()} — LV {info.level}</div>
      </div>
    </div>
  );
}

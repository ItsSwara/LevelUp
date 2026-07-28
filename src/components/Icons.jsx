// Minimal geometric stroke icons — no emoji anywhere in the app.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const MindIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}>
    <path d="M12 3l7 4v7l-7 7-7-7V7z" />
    <path d="M12 3v18M5 7l7 4 7-4" />
  </svg>
);

export const SpiritIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const BodyIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}>
    <path d="M12 4l8 16H4z" />
    <path d="M12 10v10" />
  </svg>
);

export const FlameIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}>
    <path d="M12 3c1 4-4 6-4 10a4 4 0 008 0c0-2-1-3-1-5 2 1 3 3 3 5a6 6 0 11-12 0c0-5 5-7 6-10z" />
  </svg>
);

export const MoonIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}>
    <path d="M20 14A8 8 0 1110 4a6.5 6.5 0 0010 10z" />
  </svg>
);

export const ShieldIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const SparkIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}>
    <path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" />
  </svg>
);

export const STAT_ICONS = { mind: MindIcon, spirit: SpiritIcon, body: BodyIcon };

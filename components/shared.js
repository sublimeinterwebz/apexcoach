// ── Design Tokens ─────────────────────────────────────
export const C = {
  bg:           '#111214',
  bgCard:       '#1c1d21',
  bgInput:      '#1c1d21',
  bgDeep:       '#0d0e10',
  border:       '#2a2b2f',
  borderMid:    '#35363b',
  accent:       '#c4ff00',
  accentDim:    'rgba(196,255,0,0.12)',
  accentBorder: 'rgba(196,255,0,0.28)',
  white:        '#ffffff',
  text:         '#e8e9ec',
  muted:        '#9a9b9f',
  dim:          '#55565c',
  ghost:        '#2a2b2f',
};

// ── Font helper ────────────────────────────────────────
const F = "'Lexend', sans-serif";

// ── Input style ────────────────────────────────────────
export const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  background: C.bgCard,
  border: `1px solid ${C.border}`,
  color: C.text,
  fontSize: 15,
  fontFamily: F,
  fontWeight: 400,
  boxSizing: 'border-box',
};

// ── Button style ───────────────────────────────────────
export function btnStyle(variant = 'primary') {
  const base = {
    width: '100%', padding: '15px', borderRadius: 14,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, transition: 'all 0.18s', fontFamily: F,
    border: 'none', letterSpacing: 0.3,
  };
  if (variant === 'primary')  return { ...base, background: C.accent, color: '#0a0a0a' };
  if (variant === 'outline')  return { ...base, background: 'transparent', border: `1.5px solid ${C.border}`, color: C.text };
  if (variant === 'ghost')    return { ...base, background: C.bgCard, border: `1px solid ${C.border}`, color: C.muted };
  return base;
}

// ── Screen wrapper ─────────────────────────────────────
export function Screen({ children, style = {} }) {
  return (
    <div style={{
      background: C.bg,
      minHeight: '100vh',
      maxWidth: 430,
      margin: '0 auto',
      fontFamily: F,
      color: C.text,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Label ──────────────────────────────────────────────
export function Label({ children }) {
  return (
    <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, fontWeight: 600, marginBottom: 8, fontFamily: F }}>
      {children}
    </div>
  );
}

// ── Chip ───────────────────────────────────────────────
export function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 15px', borderRadius: 20, fontSize: 13, fontWeight: 500,
      background: active ? C.accentDim : C.bgCard,
      border: `1.5px solid ${active ? C.accent : C.border}`,
      color: active ? C.accent : C.muted,
      cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap',
      fontFamily: F,
    }}>{label}</button>
  );
}

// ── Radio Card ─────────────────────────────────────────
export function RadioCard({ value, label, desc, active, onClick }) {
  return (
    <button onClick={() => onClick(value)} style={{
      background: active ? C.accentDim : C.bgCard,
      border: `1.5px solid ${active ? C.accent : C.border}`,
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      cursor: 'pointer', transition: 'all 0.18s', width: '100%', fontFamily: F,
    }}>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontWeight: 600, color: active ? C.accent : C.text, fontSize: 15 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{desc}</div>}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: `2px solid ${active ? C.accent : C.borderMid}`,
        background: active ? C.accent : 'transparent',
        flexShrink: 0, transition: 'all 0.18s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0a0a0a' }}/>}
      </div>
    </button>
  );
}

// ── SVG Icons ──────────────────────────────────────────
function IconHome({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3L21 12V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V12Z"/>
    </svg>
  );
}
function IconDumbbell({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5H5C4.17 6.5 3.5 7.17 3.5 8V10C3.5 10.83 4.17 11.5 5 11.5H6.5"/>
      <path d="M6.5 17.5H5C4.17 17.5 3.5 16.83 3.5 16V14C3.5 13.17 4.17 12.5 5 12.5H6.5"/>
      <path d="M17.5 6.5H19C19.83 6.5 20.5 7.17 20.5 8V10C20.5 10.83 19.83 11.5 19 11.5H17.5"/>
      <path d="M17.5 17.5H19C19.83 17.5 20.5 16.83 20.5 16V14C20.5 13.17 19.83 12.5 19 12.5H17.5"/>
      <line x1="6.5" y1="6.5" x2="6.5" y2="17.5"/>
      <line x1="17.5" y1="6.5" x2="17.5" y2="17.5"/>
      <line x1="6.5" y1="12" x2="17.5" y2="12"/>
    </svg>
  );
}
function IconNutrition({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2V8C3 10.21 4.79 12 7 12V22"/>
      <path d="M7 2V12"/>
      <path d="M11 2V8C11 10.21 12.79 12 15 12V22"/>
      <path d="M19 2C19 2 21 4 21 8C21 10.21 19.21 12 17 12"/>
      <path d="M17 12V22"/>
    </svg>
  );
}
function IconReview({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M8 17V13"/>
      <path d="M12 17V7"/>
      <path d="M16 17V11"/>
    </svg>
  );
}
function IconCoach({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z"/>
      <path d="M9 21C9 21.55 9.45 22 10 22H14C14.55 22 15 21.55 15 21V20H9V21Z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  );
}

const NAV_ICONS = {
  dashboard: IconHome,
  workout:   IconDumbbell,
  nutrition: IconNutrition,
  review:    IconReview,
  chat:      IconCoach,
};

// ── Bottom Nav ─────────────────────────────────────────
// NOTE: Re-exports the new 3-tab nav from ui/. Maps old active keys to new keys.
import NewBottomNav from "./ui/BottomNav";

const ACTIVE_MAP = {
  dashboard: "home",
  workout:   "home",    // workout is accessed from home now
  nutrition: "home",    // nutrition is accessed from home now
  review:    "coach",
  chat:      "coach",
  coach:     "coach",
  profile:   "profile",
  home:      "home",
};

export function BottomNav({ active, router }) {
  const mapped = ACTIVE_MAP[active] || active;
  return <NewBottomNav active={mapped} router={router} />;
}

// ── Spinner ────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ background: C.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${C.border}` }}/>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: C.accent, animation: 'spin 0.9s linear infinite' }}/>
      </div>
    </div>
  );
}

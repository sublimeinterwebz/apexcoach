// ── Design Tokens ─────────────────────────────────────
export const C = {
  bg:         "#080808",
  surface:    "#0d0d0d",
  surfaceAlt: "#0a0a0a",
  border:     "#1a1a1a",
  borderDim:  "#111111",
  green:      "#00ff80",
  greenDim:   "rgba(0,255,128,0.08)",
  greenBorder:"rgba(0,255,128,0.2)",
  text:       "#f0f0f0",
  textMuted:  "#888",
  textDim:    "#444",
  textGhost:  "#2a2a2a",
};

// ── Shared inline styles ───────────────────────────────
export const inputStyle = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 10,
  background: "#0e0e0e",
  border: "1px solid #1e1e1e",
  color: "#f0f0f0",
  fontSize: 14,
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
};

export function btnStyle(variant = "primary") {
  const base = {
    width: "100%",
    padding: "15px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    border: "none",
    letterSpacing: 0.5,
  };
  if (variant === "primary")  return { ...base, background: "linear-gradient(135deg,#00ff80,#00cc55)", color: "#000" };
  if (variant === "outline")  return { ...base, background: "transparent", border: "1px solid #2a2a2a", color: "#e0e0e0" };
  if (variant === "ghost")    return { ...base, background: "#0e0e0e", border: "1px solid #1a1a1a", color: "#666" };
  return base;
}

// ── Screen wrapper ─────────────────────────────────────
export function Screen({ children, style = {} }) {
  return (
    <div style={{
      background: "#080808",
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      fontFamily: "'DM Sans', sans-serif",
      color: "#f0f0f0",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: `linear-gradient(rgba(0,255,128,0.025) 1px,transparent 1px),
          linear-gradient(90deg,rgba(0,255,128,0.025) 1px,transparent 1px)`,
        backgroundSize: "40px 40px",
        pointerEvents: "none", zIndex: 0,
      }}/>
      {/* Top glow */}
      <div style={{
        position: "fixed", top: -80, left: "50%", transform: "translateX(-50%)",
        width: 500, height: 300,
        background: "radial-gradient(ellipse,rgba(0,255,128,0.06) 0%,transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }}/>
      {children}
    </div>
  );
}

// ── Label ──────────────────────────────────────────────
export function Label({ children }) {
  return (
    <div style={{ fontSize: 11, color: "#888", letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>
      {children}
    </div>
  );
}

// ── Chip ───────────────────────────────────────────────
export function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
      background: active ? "rgba(0,255,128,0.12)" : "#0e0e0e",
      border: `1px solid ${active ? "#00ff80" : "#1e1e1e"}`,
      color: active ? "#00ff80" : "#666",
      cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
      fontFamily: "'DM Sans'",
    }}>{label}</button>
  );
}

// ── Radio Card ─────────────────────────────────────────
export function RadioCard({ value, label, desc, active, onClick }) {
  return (
    <button onClick={() => onClick(value)} style={{
      background: active ? "rgba(0,255,128,0.08)" : "#0e0e0e",
      border: `1px solid ${active ? "#00ff80" : "#1e1e1e"}`,
      borderRadius: 12, padding: "13px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      cursor: "pointer", transition: "all 0.2s", width: "100%",
      fontFamily: "'DM Sans'",
    }}>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: 600, color: active ? "#00ff80" : "#e0e0e0", fontSize: 14 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        border: `2px solid ${active ? "#00ff80" : "#333"}`,
        background: active ? "#00ff80" : "transparent",
        flexShrink: 0, transition: "all 0.2s",
      }}/>
    </button>
  );
}

// ── Bottom Nav ─────────────────────────────────────────
export function BottomNav({ active, router }) {
  const tabs = [
    { key: "dashboard", label: "Home",      icon: "▦", href: "/dashboard" },
    { key: "workout",   label: "Workout",   icon: "◈", href: "/workout"   },
    { key: "nutrition", label: "Nutrition", icon: "◑", href: "/nutrition" },
    { key: "review",    label: "Review",    icon: "◷", href: "/review"    },
    { key: "chat",      label: "Coach",     icon: "◉", href: "/chat"      },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: "rgba(8,8,8,0.96)", backdropFilter: "blur(12px)",
      borderTop: "1px solid #141414",
      display: "flex", padding: "12px 24px 28px",
      zIndex: 100,
    }}>
      {tabs.map(({ key, label, icon, href }) => (
        <button key={key} onClick={() => router.push(href)} style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 4,
          background: "none", border: "none", cursor: "pointer",
        }}>
          <span style={{ fontSize: 16, color: active === key ? "#00ff80" : "#2a2a2a" }}>{icon}</span>
          <span style={{
            fontSize: 9, letterSpacing: 1.5, fontWeight: 600,
            color: active === key ? "#00ff80" : "#2a2a2a",
          }}>{label.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

import { C, F, FS, FW } from "./tokens";

export default function FAB({
  icon,
  label,
  onClick,
  position = "bottom-right",  // bottom-right | bottom-left
  offsetBottom = 96,          // above bottom nav
}) {
  const pos = {
    "bottom-right": { right: 20, left: "auto" },
    "bottom-left":  { left: 20, right: "auto" },
  };

  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: offsetBottom,
        ...pos[position],
        background: C.accent,
        border: "none",
        borderRadius: 28,
        padding: label ? "12px 18px" : "14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: F,
        fontSize: FS.md,
        fontWeight: FW.bold,
        color: "#0a0a0a",
        cursor: "pointer",
        boxShadow: "0 8px 24px rgba(196,255,0,0.35), 0 2px 8px rgba(0,0,0,0.3)",
        zIndex: 90,
        transition: "all 0.18s",
      }}
      onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      {icon}
      {label}
    </button>
  );
}

import { C, F, FS, FW, R } from "./tokens";

export default function Chip({
  label,
  active = false,
  onClick,
  size = "md",    // sm | md | lg
  color = "accent",  // accent | danger | neutral
  icon = null,
  style = {},
}) {
  const sizes = {
    sm: { padY: 4,  padX: 10, fontSize: FS.xs },
    md: { padY: 7,  padX: 14, fontSize: FS.md },
    lg: { padY: 9,  padX: 16, fontSize: FS.lg },
  };
  const sz = sizes[size];

  const colors = {
    accent:  { activeBg: C.accentDim, activeBorder: C.accent, activeFg: C.accent },
    danger:  { activeBg: "rgba(255,59,48,0.15)", activeBorder: "#ff3b30", activeFg: "#ff3b30" },
    neutral: { activeBg: C.bgCard, activeBorder: C.white, activeFg: C.white },
  };
  const col = colors[color];

  return (
    <button
      onClick={onClick}
      style={{
        padding: `${sz.padY}px ${sz.padX}px`,
        borderRadius: R.pill,
        background: active ? col.activeBg : C.bgCard,
        border: `1.5px solid ${active ? col.activeBorder : C.border}`,
        color: active ? col.activeFg : C.muted,
        fontSize: sz.fontSize,
        fontWeight: active ? FW.semibold : FW.normal,
        fontFamily: F,
        cursor: "pointer",
        transition: "all 0.18s",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        ...style,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

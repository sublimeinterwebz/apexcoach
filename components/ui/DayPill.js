import { C, F, FS, FW, R } from "./tokens";

export default function DayPill({
  label,
  active = false,
  onClick,
  indicator = false,   // shows colored dot
  disabled = false,
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: "7px 14px",
        borderRadius: R.pill,
        border: `1.5px solid ${active ? C.accent : C.border}`,
        background: active ? C.accentDim : C.bgCard,
        color: active ? C.accent : (disabled ? C.dim : C.muted),
        fontSize: FS.xs,
        fontWeight: FW.bold,
        fontFamily: F,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.18s",
      }}
    >
      {label}
      {indicator && (
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: active ? C.accent : C.dim,
        }}/>
      )}
    </button>
  );
}

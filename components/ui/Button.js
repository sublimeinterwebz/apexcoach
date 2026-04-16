import { C, F, FS, FW, R, S } from "./tokens";

export default function Button({
  children,
  onClick,
  variant = "primary",   // primary | outline | ghost | danger | accentDim
  size    = "md",        // sm | md | lg
  icon    = null,        // leading JSX
  trailing = null,       // trailing JSX
  loading = false,
  disabled = false,
  fullWidth = true,
  style   = {},
  type    = "button",
}) {
  const sizeMap = {
    sm: { padY: 10, padX: 14, fontSize: FS.sm, radius: R.md },
    md: { padY: 14, padX: 16, fontSize: FS.lg, radius: R.xl },
    lg: { padY: 16, padX: 18, fontSize: FS.xl, radius: R.xl },
  };
  const sz = sizeMap[size];

  const variants = {
    primary:   { bg: C.accent,     fg: "#0a0a0a", border: C.accent },
    outline:   { bg: "transparent", fg: C.text,   border: C.border },
    ghost:     { bg: C.bgCard,     fg: C.muted,   border: C.border },
    danger:    { bg: "#ff3b30",    fg: "#fff",    border: "#ff3b30" },
    accentDim: { bg: C.accentDim,  fg: C.accent,  border: C.accentBorder },
  };
  const v = variants[variant] || variants.primary;

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: `${sz.padY}px ${sz.padX}px`,
        borderRadius: sz.radius,
        background: isDisabled && variant === "primary" ? C.accentDim : v.bg,
        color: isDisabled && variant === "primary" ? C.accent : v.fg,
        border: `1.5px solid ${v.border}`,
        fontSize: sz.fontSize,
        fontWeight: FW.bold,
        fontFamily: F,
        cursor: isDisabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "all 0.18s",
        letterSpacing: 0.3,
        opacity: disabled && !loading ? 0.5 : 1,
        ...style,
      }}
    >
      {loading && (
        <>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          <div style={{
            width: 14, height: 14, borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: variant === "primary" ? "#0a0a0a" : v.fg,
            animation: "spin 0.8s linear infinite",
          }}/>
        </>
      )}
      {!loading && icon}
      {children}
      {!loading && trailing}
    </button>
  );
}

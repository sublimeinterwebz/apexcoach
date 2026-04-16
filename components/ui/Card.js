import { C, R, S } from "./tokens";

export default function Card({
  children,
  variant = "default",  // default | deep | bordered | accent
  padding = "md",        // none | sm | md | lg
  style = {},
  onClick,
}) {
  const bgMap = {
    default:  C.bgCard,
    deep:     C.bgDeep,
    bordered: "transparent",
    accent:   C.accentDim,
  };
  const borderMap = {
    default:  C.border,
    deep:     C.border,
    bordered: C.border,
    accent:   C.accentBorder,
  };
  const padMap = {
    none: 0,
    sm:   "10px 12px",
    md:   "14px 16px",
    lg:   "18px 20px",
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: bgMap[variant],
        border: `1px solid ${borderMap[variant]}`,
        borderRadius: R.xxl,
        padding: padMap[padding],
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

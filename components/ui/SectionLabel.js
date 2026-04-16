import { C, F, FW, LS } from "./tokens";

export default function SectionLabel({
  children,
  color = C.muted,
  size = "md",  // sm | md
  style = {},
}) {
  const sizes = {
    sm: { fontSize: 9,  letterSpacing: LS.wide },
    md: { fontSize: 10, letterSpacing: 2.5 },
  };
  const sz = sizes[size];

  return (
    <div style={{
      fontSize: sz.fontSize,
      color,
      letterSpacing: sz.letterSpacing,
      fontWeight: FW.semibold,
      textTransform: "uppercase",
      fontFamily: F,
      ...style,
    }}>
      {children}
    </div>
  );
}

import { C, FW, LS } from "./tokens";

export default function BlockSection({
  blockKey,       // warmup | main | accessory | finisher | core | cooldown
  label,          // display label
  color,
  children,
  style = {},
}) {
  return (
    <div style={style}>
      <div style={{
        fontSize: 9, color,
        letterSpacing: LS.wider, fontWeight: FW.semibold,
        marginBottom: 6, textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

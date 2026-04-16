import { C, F, FS, FW, LS, R } from "./tokens";

export default function StatCell({
  label,
  value,
  color = C.accent,
  size = "md",  // sm | md | lg
}) {
  const sizes = {
    sm: { padY: 8,  padX: 4, valFs: 14, labFs: 8  },
    md: { padY: 10, padX: 4, valFs: 16, labFs: 8  },
    lg: { padY: 14, padX: 6, valFs: 20, labFs: 9  },
  };
  const sz = sizes[size];

  return (
    <div style={{
      flex: 1,
      background: C.bgDeep,
      borderRadius: R.md,
      padding: `${sz.padY}px ${sz.padX}px`,
      textAlign: "center",
      fontFamily: F,
    }}>
      <div style={{ fontSize: sz.valFs, fontWeight: FW.bold, color }}>
        {value}
      </div>
      <div style={{
        fontSize: sz.labFs,
        color: C.dim,
        letterSpacing: 1,
        fontWeight: FW.semibold,
        marginTop: 2,
        textTransform: "uppercase",
      }}>
        {label}
      </div>
    </div>
  );
}

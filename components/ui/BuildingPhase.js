// BuildingPhase — shared "AI is working on your plan" view.
// Used by:
//   - pages/index.js           (first-time plan after onboarding)
//   - pages/coach.js           (Sunday regen of next week)
//   - pages/profile/edit.js    (rebuild after profile change)
//
// Display-only. Drive `progress` (0-100) from the caller, typically via the
// exported `useBuildingProgress` hook which animates progress on its own and
// lets the caller snap to 100 when the real API call resolves.

import { useState, useEffect, useRef } from "react";
import { C, F, FS, FW, LS, R, S } from "./tokens";

const DEFAULT_THRESHOLDS = [20, 42, 63, 82, 100];

export default function BuildingPhase({
  title,
  subtitle,
  steps,
  progress = 0,
  thresholds = DEFAULT_THRESHOLDS,
}) {
  const r = 46, circ = 2 * Math.PI * r;

  // Derive the active step from progress rather than tracking it separately.
  // First index whose threshold hasn't been crossed is the one currently working.
  const firstUndone = thresholds.findIndex((t) => progress < t);
  const activeIdx   = firstUndone === -1 ? steps.length : firstUndone;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 28px",
        position: "relative",
        zIndex: 1,
        fontFamily: F,
      }}
    >
      {/* Progress ring with percentage */}
      <div style={{ position: "relative", width: 110, height: 110, marginBottom: S.huge }}>
        <svg width="110" height="110" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke={C.border} strokeWidth="5" />
          <circle
            cx="55" cy="55" r={r}
            fill="none"
            stroke={C.accent}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - (progress / 100) * circ}
            style={{ transition: "stroke-dashoffset .1s linear" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: FW.black,
            color: C.accent,
            fontFamily: F,
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: FS.display,
          fontWeight: FW.black,
          color: C.white,
          letterSpacing: LS.tight,
          marginBottom: S.md,
          textAlign: "center",
          fontFamily: F,
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: FS.md,
          color: C.muted,
          marginBottom: S.huge - 4,
          textAlign: "center",
          fontFamily: F,
        }}
      >
        {subtitle}
      </div>

      {/* Thin horizontal progress bar */}
      <div
        style={{
          width: "100%",
          height: 3,
          background: C.border,
          borderRadius: 3,
          marginBottom: S.huge - 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: C.accent,
            borderRadius: 3,
            transition: "width .1s linear",
          }}
        />
      </div>

      {/* Step list */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: S.lg }}>
        {steps.map((label, i) => {
          const done   = progress >= thresholds[i];
          const active = !done && i === activeIdx;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: S.lg }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: done ? C.accent : active ? C.accentDim : C.bgCard,
                  border: `1.5px solid ${done ? C.accent : active ? C.accentBorder : C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: FW.bold,
                  color: done ? "#0a0a0a" : C.dim,
                  transition: "all .3s",
                }}
              >
                {done ? "✓" : ""}
              </div>
              <div
                style={{
                  fontSize: FS.md,
                  fontWeight: done ? FW.normal : active ? FW.semibold : 400,
                  color: done ? C.muted : active ? C.white : C.dim,
                  transition: "color .3s",
                  fontFamily: F,
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress animation hook
// ─────────────────────────────────────────────────────────────
//
// Typical usage in a caller:
//
//   const { progress, start, finish } = useBuildingProgress();
//
//   async function run() {
//     start();
//     const plan = await fetch("/api/generate-plan", ...).then(r => r.json());
//     finish();                      // snap to 100
//     setTimeout(() => goToNextPhase(), 500);
//   }
//
// The animation runs independently of the real API call. If the API returns
// before the bar reaches 100, `finish()` snaps it there. If it returns after,
// the bar simply holds at 100 until `finish()` transitions.

export function useBuildingProgress(initial = 0) {
  const [progress, setProgress] = useState(initial);
  const intervalRef = useRef(null);

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = () => {
    clear();
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clear(); return 100; }
        return p + 1.4;
      });
    }, 50);
  };

  const finish = () => {
    clear();
    setProgress(100);
  };

  const reset = () => {
    clear();
    setProgress(0);
  };

  useEffect(() => () => clear(), []);

  return { progress, start, finish, reset, setProgress };
}

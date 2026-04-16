import { useState } from "react";
import { C, F, FS, FW, R, S } from "./tokens";
import ExerciseGif from "../ExerciseGif";

// Block color map — shared across the app wherever exercises are displayed
export const BLOCK_COLORS = {
  warmup:    "#ffaa00",
  main:      C.accent,
  accessory: "#00cfff",
  finisher:  "#ff5e8a",
  core:      "#aa88ff",
  cooldown:  C.muted,
};
export const BLOCK_LABELS = {
  warmup:    "Warm-Up",
  main:      "Main Lifts",
  accessory: "Accessory",
  finisher:  "Finisher",
  core:      "Core",
  cooldown:  "Cooldown",
};

export default function ExerciseRow({
  exercise,
  index,
  blockColor = C.accent,
  editable = false,         // shows edit controls (replace/remove)
  reorderable = false,      // shows up/down arrows
  showGif = true,           // include the Watch form toggle
  onReplace,
  onRemove,
  onEdit,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast  = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const metric = exercise.sets && exercise.reps
    ? `${exercise.sets} × ${exercise.reps}${exercise.restSeconds ? ` · ${exercise.restSeconds}s rest` : ""}`
    : (exercise.details || exercise.duration || "");

  return (
    <div style={{
      background: C.bgCard,
      borderRadius: R.lg,
      border: `1px solid ${C.border}`,
      padding: "10px 12px",
      fontFamily: F,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Index bubble */}
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: `${blockColor}18`,
          border: `1px solid ${blockColor}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: FS.xs, fontWeight: FW.bold, color: blockColor,
          flexShrink: 0, marginTop: 1,
        }}>
          {index + 1}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: FS.md, fontWeight: FW.semibold, color: C.text,
            textTransform: "capitalize",
          }}>
            {exercise.name}
          </div>
          {metric && (
            <div style={{ fontSize: FS.xs, color: C.muted, marginTop: 2 }}>
              {metric}
            </div>
          )}
          {exercise.notes && (
            <div style={{ fontSize: FS.xs, color: C.dim, fontStyle: "italic", marginTop: 2 }}>
              {exercise.notes}
            </div>
          )}
        </div>

        {/* Edit controls */}
        {editable && (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                width: 28, height: 28, borderRadius: R.sm,
                background: menuOpen ? C.accentDim : C.bgDeep,
                border: `1px solid ${menuOpen ? C.accentBorder : C.border}`,
                cursor: "pointer", color: menuOpen ? C.accent : C.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.8"/>
                <circle cx="12" cy="12" r="1.8"/>
                <circle cx="12" cy="19" r="1.8"/>
              </svg>
            </button>

            {menuOpen && (
              <>
                {/* Invisible overlay to close menu */}
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 10 }}
                />
                <div style={{
                  position: "absolute", top: 32, right: 0, zIndex: 11,
                  background: C.bgCard, border: `1px solid ${C.border}`,
                  borderRadius: R.md, padding: 4, minWidth: 140,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}>
                  {reorderable && !isFirst && (
                    <MenuItem
                      label="Move up"
                      icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>}
                      onClick={() => { setMenuOpen(false); onMoveUp?.(); }}
                    />
                  )}
                  {reorderable && !isLast && (
                    <MenuItem
                      label="Move down"
                      icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>}
                      onClick={() => { setMenuOpen(false); onMoveDown?.(); }}
                    />
                  )}
                  {onEdit && (
                    <MenuItem
                      label="Edit details"
                      icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                      onClick={() => { setMenuOpen(false); onEdit(); }}
                    />
                  )}
                  {onReplace && (
                    <MenuItem
                      label="Replace"
                      icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>}
                      onClick={() => { setMenuOpen(false); onReplace(); }}
                    />
                  )}
                  {onRemove && (
                    <MenuItem
                      label="Remove"
                      danger
                      icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>}
                      onClick={() => { setMenuOpen(false); onRemove(); }}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* GIF toggle */}
      {showGif && (
        <div style={{ marginTop: 6, marginLeft: 32 }}>
          <ExerciseGif key={exercise.name} exerciseName={exercise.name} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, icon, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left",
        padding: "9px 12px",
        background: "transparent",
        border: "none",
        borderRadius: R.xs,
        color: danger ? "#ff3b30" : C.text,
        fontSize: FS.sm,
        fontWeight: FW.medium,
        cursor: "pointer",
        display: "flex", alignItems: "center", gap: 10,
        fontFamily: F,
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? "rgba(255,59,48,0.12)" : C.bgDeep}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ color: danger ? "#ff3b30" : C.muted, display: "flex" }}>{icon}</span>
      {label}
    </button>
  );
}

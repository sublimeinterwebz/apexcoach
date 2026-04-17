import { useState, useEffect } from "react";
import { BottomSheet, Button, Icon, C, F, FS, FW, R } from "./index";

// Re-usable for: add new exercise (after picker), replace exercise (keep or change params),
// edit existing exercise details. Accepts initial values, returns updated values on save.

const DEFAULTS = {
  warmup:    { sets: null,   reps: null,    restSeconds: 0,   details: "30 seconds" },
  main:      { sets: 4,      reps: "8",     restSeconds: 120, notes: "" },
  accessory: { sets: 3,      reps: "10-12", restSeconds: 75,  notes: "" },
  finisher:  { sets: 1,      reps: "AMRAP", restSeconds: 0,   notes: "" },
  core:      { sets: 3,      reps: "12-15", restSeconds: 60,  notes: "" },
  cooldown:  { sets: null,   reps: null,    restSeconds: 0,   details: "30 seconds each side" },
};

export default function ExerciseConfigSheet({
  isOpen,
  onClose,
  onConfirm,
  exerciseName,
  blockKey = "main",
  initial = null,
  title = null,
  confirmLabel = "Save",
}) {
  const fallback = DEFAULTS[blockKey] || DEFAULTS.main;
  const isTimed = blockKey === "warmup" || blockKey === "cooldown";

  const [sets,    setSets]    = useState("");
  const [reps,    setReps]    = useState("");
  const [rest,    setRest]    = useState("");
  const [notes,   setNotes]   = useState("");
  const [details, setDetails] = useState("");

  // Initialize form when opening
  useEffect(() => {
    if (!isOpen) return;
    const src = initial || fallback;
    setSets((src.sets ?? fallback.sets ?? "") + "");
    setReps((src.reps ?? fallback.reps ?? "") + "");
    setRest((src.restSeconds ?? fallback.restSeconds ?? "") + "");
    setNotes(src.notes ?? "");
    setDetails(src.details ?? src.duration ?? fallback.details ?? "");
  }, [isOpen, exerciseName, blockKey]);

  const handleConfirm = () => {
    if (isTimed) {
      onConfirm({ details: details.trim() || fallback.details, notes: notes.trim() });
    } else {
      const setsNum = parseInt(sets, 10);
      onConfirm({
        sets:        isNaN(setsNum) ? fallback.sets : setsNum,
        reps:        reps.trim() || fallback.reps,
        restSeconds: parseInt(rest, 10) || fallback.restSeconds,
        notes:       notes.trim(),
      });
    }
  };

  // Quick-adjust stepper for numeric fields
  const step = (val, delta, min = 1, max = 20) => {
    const n = parseInt(val, 10) || 0;
    return Math.max(min, Math.min(max, n + delta)) + "";
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title || (initial ? "Edit Exercise" : "Configure Exercise")}
      maxHeight="80vh"
    >
      {/* Selected exercise name */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.accentBorder}`,
        borderRadius: R.lg, padding: "14px 16px", marginBottom: 18,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: R.sm,
          background: C.accentDim, border: `1px solid ${C.accentBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name="dumbbell" size={16} color={C.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: FS.md, fontWeight: FW.bold, color: C.white,
            textTransform: "capitalize",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {exerciseName}
          </div>
          <div style={{ fontSize: FS.xs, color: C.muted, marginTop: 1, textTransform: "capitalize" }}>
            {blockKey} · set your parameters
          </div>
        </div>
      </div>

      {/* Numeric exercise fields */}
      {!isTimed && (
        <>
          {/* Sets */}
          <FieldLabel label="Sets" />
          <StepperField
            value={sets}
            onChange={setSets}
            onDecrement={() => setSets(step(sets, -1, 1, 10))}
            onIncrement={() => setSets(step(sets, +1, 1, 10))}
            suffix="sets"
            inputMode="numeric"
          />

          {/* Reps */}
          <FieldLabel label="Reps" hint="e.g. 8, 10-12, AMRAP, 30s" />
          <TextField
            value={reps}
            onChange={setReps}
            placeholder="10-12"
          />

          {/* Rest */}
          <FieldLabel label="Rest Between Sets" />
          <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
            {[30, 45, 60, 75, 90, 120, 180].map(s => {
              const active = parseInt(rest, 10) === s;
              return (
                <button
                  key={s}
                  onClick={() => setRest(s + "")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: R.pill,
                    background: active ? C.accentDim : C.bgCard,
                    border: `1.5px solid ${active ? C.accent : C.border}`,
                    color: active ? C.accent : C.muted,
                    fontSize: FS.sm, fontWeight: FW.bold,
                    fontFamily: F, cursor: "pointer",
                  }}
                >
                  {s}s
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Timed exercise (warmup/cooldown) */}
      {isTimed && (
        <>
          <FieldLabel label="Duration / Details" hint="e.g. 30 seconds, 10 reps each side" />
          <TextField
            value={details}
            onChange={setDetails}
            placeholder="30 seconds"
          />
        </>
      )}

      {/* Notes */}
      <FieldLabel label="Notes (optional)" hint="Coaching cues, form reminders" />
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Keep spine neutral, control the eccentric"
        rows={2}
        style={{
          width: "100%",
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: R.lg,
          padding: "12px 14px",
          fontSize: FS.md,
          fontFamily: F,
          color: C.text,
          outline: "none",
          resize: "none",
          marginBottom: 20,
          boxSizing: "border-box",
        }}
      />

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="ghost" onClick={onClose} fullWidth={false} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm} fullWidth={false} style={{ flex: 2 }}>
          {confirmLabel}
        </Button>
      </div>
    </BottomSheet>
  );
}

function FieldLabel({ label, hint }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{
        fontSize: FS.xs, color: C.muted, letterSpacing: 1.5,
        fontWeight: FW.semibold, textTransform: "uppercase",
      }}>
        {label}
      </div>
      {hint && (
        <div style={{ fontSize: FS.xs, color: C.dim, marginTop: 3, fontWeight: FW.normal }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function TextField({ value, onChange, placeholder, inputMode }) {
  return (
    <input
      type="text"
      inputMode={inputMode}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: R.lg,
        padding: "12px 14px",
        fontSize: FS.lg,
        fontFamily: F,
        fontWeight: FW.semibold,
        color: C.text,
        outline: "none",
        marginBottom: 18,
        boxSizing: "border-box",
      }}
    />
  );
}

function StepperField({ value, onChange, onDecrement, onIncrement, suffix, inputMode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
    }}>
      <button
        onClick={onDecrement}
        style={{
          width: 44, height: 44,
          borderRadius: R.lg,
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          color: C.accent,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="x" size={14} color={C.muted} strokeWidth={2.5} style={{ transform: "rotate(45deg)" }} />
      </button>

      <div style={{ flex: 1, position: "relative" }}>
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          style={{
            width: "100%",
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: R.lg,
            padding: "12px 14px",
            fontSize: FS.xxl,
            fontFamily: F,
            fontWeight: FW.black,
            color: C.white,
            outline: "none",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        />
        {suffix && (
          <span style={{
            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
            fontSize: FS.xs, color: C.dim, fontWeight: FW.semibold, letterSpacing: 1,
            textTransform: "uppercase", pointerEvents: "none",
          }}>
            {suffix}
          </span>
        )}
      </div>

      <button
        onClick={onIncrement}
        style={{
          width: 44, height: 44,
          borderRadius: R.lg,
          background: C.accentDim,
          border: `1px solid ${C.accentBorder}`,
          color: C.accent,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="plus" size={16} color={C.accent} strokeWidth={2.5} />
      </button>
    </div>
  );
}

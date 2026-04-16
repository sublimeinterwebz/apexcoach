import { useState, useMemo, useEffect } from "react";
import { BottomSheet, Chip, Button, Icon, C, F, FS, FW, R } from "./index";
import exercisesData from "../../data/exercises.json";

// Body part groupings for filter chips — shorter, user-friendly labels
const MUSCLE_GROUPS = [
  { label: "Chest",      bodyParts: ["chest"] },
  { label: "Back",       bodyParts: ["back"] },
  { label: "Shoulders",  bodyParts: ["shoulders"] },
  { label: "Arms",       bodyParts: ["upper arms", "lower arms"] },
  { label: "Legs",       bodyParts: ["upper legs", "lower legs"] },
  { label: "Core",       bodyParts: ["waist"] },
  { label: "Cardio",     bodyParts: ["cardio"] },
  { label: "Neck",       bodyParts: ["neck"] },
];

const EQUIPMENT_FILTERS = [
  "barbell", "dumbbell", "cable", "leverage machine", "smith machine",
  "kettlebell", "body weight", "band", "ez barbell",
];

export default function ExercisePicker({ isOpen, onClose, onPick, title = "Pick Exercise" }) {
  const [query,       setQuery]       = useState("");
  const [muscleGroup, setMuscleGroup] = useState(null);
  const [equipment,   setEquipment]   = useState(null);
  const [visibleCount, setVisibleCount] = useState(40); // virtualized pagination

  // Reset filters when reopening
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setMuscleGroup(null);
      setEquipment(null);
      setVisibleCount(40);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercisesData.filter(ex => {
      if (muscleGroup) {
        const group = MUSCLE_GROUPS.find(g => g.label === muscleGroup);
        if (group && !group.bodyParts.includes(ex.bodyPart)) return false;
      }
      if (equipment && ex.equipment !== equipment) return false;
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, muscleGroup, equipment]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} maxHeight="88vh">
      {/* Search bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: R.lg, padding: "10px 14px", marginBottom: 14,
      }}>
        <Icon name="search" size={16} color={C.muted} />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setVisibleCount(40); }}
          placeholder="Search 1,324 exercises..."
          autoFocus
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: C.text, fontSize: FS.lg, fontFamily: F, fontWeight: FW.medium,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 2 }}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>

      {/* Muscle group filter */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: FS.xs, color: C.muted, letterSpacing: 1.5, fontWeight: FW.semibold, marginBottom: 8, textTransform: "uppercase" }}>
          Muscle Group
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
          {MUSCLE_GROUPS.map(g => (
            <Chip
              key={g.label}
              label={g.label}
              active={muscleGroup === g.label}
              onClick={() => { setMuscleGroup(muscleGroup === g.label ? null : g.label); setVisibleCount(40); }}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Equipment filter */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: FS.xs, color: C.muted, letterSpacing: 1.5, fontWeight: FW.semibold, marginBottom: 8, textTransform: "uppercase" }}>
          Equipment
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
          {EQUIPMENT_FILTERS.map(eq => (
            <Chip
              key={eq}
              label={eq}
              active={equipment === eq}
              onClick={() => { setEquipment(equipment === eq ? null : eq); setVisibleCount(40); }}
              size="sm"
              style={{ textTransform: "capitalize" }}
            />
          ))}
        </div>
      </div>

      {/* Result count */}
      <div style={{ fontSize: FS.xs, color: C.dim, marginBottom: 10, fontWeight: FW.medium }}>
        {filtered.length} {filtered.length === 1 ? "exercise" : "exercises"}
      </div>

      {/* Results list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.dim, fontSize: FS.md }}>
            No exercises match your filters
          </div>
        ) : visible.map(ex => (
          <button
            key={ex.id}
            onClick={() => { onPick(ex); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px",
              background: C.bgCard, border: `1px solid ${C.border}`,
              borderRadius: R.lg, cursor: "pointer",
              fontFamily: F, textAlign: "left",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accentBorder}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: FS.md, fontWeight: FW.semibold, color: C.text,
                textTransform: "capitalize",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {ex.name}
              </div>
              <div style={{ fontSize: FS.xs, color: C.muted, marginTop: 2, textTransform: "capitalize" }}>
                {ex.equipment} · {ex.bodyPart} · {ex.target}
              </div>
            </div>
            <Icon name="plus" size={14} color={C.accent} />
          </button>
        ))}
      </div>

      {hasMore && (
        <div style={{ marginTop: 14, marginBottom: 8 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleCount(c => c + 40)}
          >
            Load more ({filtered.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}

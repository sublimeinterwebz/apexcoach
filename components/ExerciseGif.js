import { useState, useEffect } from "react";
import { C } from "./shared";

const F = "'Lexend', sans-serif";

// In-module cache so repeated mounts don't re-fetch
const gifCache = {};

export default function ExerciseGif({ exerciseName }) {
  const [gif,     setGif]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [errored, setErrored] = useState(false);

  // Fetch on first expand
  useEffect(() => {
    if (!open || gif || !exerciseName) return;
    const key = exerciseName.toLowerCase().trim();
    if (gifCache[key] !== undefined) { setGif(gifCache[key]); return; }

    setLoading(true);
    fetch(`/api/exercise-gif?name=${encodeURIComponent(exerciseName)}`)
      .then(r => r.json())
      .then(data => {
        const url = data?.gif || null;
        gifCache[key] = url;
        setGif(url);
      })
      .catch(() => { gifCache[key] = null; setGif(null); })
      .finally(() => setLoading(false));
  }, [open, exerciseName]);

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          padding: "4px 0", fontFamily: F,
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 7,
          background: open ? C.accentDim : C.bgCard,
          border: `1px solid ${open ? C.accentBorder : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {/* Play / close icon */}
          {open ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill={C.muted}>
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: open ? C.accent : C.muted,
          letterSpacing: 0.5,
        }}>
          {open ? "Hide form" : "Watch form"}
        </span>
      </button>

      {/* GIF panel */}
      {open && (
        <div style={{
          marginTop: 8, borderRadius: 12, overflow: "hidden",
          background: C.bgDeep, border: `1px solid ${C.border}`,
        }}>
          {loading ? (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.accent, animation: "spin 0.9s linear infinite" }}/>
            </div>
          ) : gif && !errored ? (
            <img
              src={gif}
              alt={`${exerciseName} demonstration`}
              onError={() => setErrored(true)}
              style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "cover" }}
            />
          ) : (
            <div style={{ height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
              </svg>
              <span style={{ fontSize: 11, color: C.dim }}>No demo available</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

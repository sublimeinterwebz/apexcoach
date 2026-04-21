import { useState } from "react";
import { C } from "./shared";

const F = "var(--font-lexend), sans-serif";

export default function ExerciseGif({ exerciseName }) {
  const [open,    setOpen]    = useState(false);
  const [errored, setErrored] = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  // URL points to our server-side proxy — key never touches client
  const src = `/api/exercise-gif?name=${encodeURIComponent(exerciseName)}`;

  return (
    <div>
      {/* Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontFamily:F }}
      >
        <div style={{
          width:22, height:22, borderRadius:7,
          background: open ? C.accentDim : C.bgCard,
          border: `1px solid ${open ? C.accentBorder : C.border}`,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        }}>
          {open
            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="10" height="10" viewBox="0 0 24 24" fill={C.muted}><polygon points="5,3 19,12 5,21"/></svg>
          }
        </div>
        <span style={{ fontSize:11, fontWeight:600, color: open ? C.accent : C.muted, letterSpacing:0.5 }}>
          {open ? "Hide form" : "Watch form"}
        </span>
      </button>

      {/* GIF panel */}
      {open && (
        <div style={{ marginTop:8, borderRadius:12, overflow:"hidden", background:C.bgDeep, border:`1px solid ${C.border}` }}>
          {/* Loading spinner — shown until image loads or errors */}
          {!loaded && !errored && (
            <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              <div style={{ width:24, height:24, borderRadius:"50%", border:`2px solid ${C.border}`, borderTopColor:C.accent, animation:"spin 0.9s linear infinite" }}/>
            </div>
          )}

          {errored ? (
            <div style={{ height:100, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/></svg>
              <span style={{ fontSize:11, color:C.dim }}>No demo available</span>
            </div>
          ) : (
            <img
              src={src}
              alt={`${exerciseName} form`}
              onLoad={() => setLoaded(true)}
              onError={() => { setErrored(true); setLoaded(true); }}
              style={{ width:"100%", display: loaded ? "block" : "none", maxHeight:220, objectFit:"cover" }}
            />
          )}
        </div>
      )}
    </div>
  );
}

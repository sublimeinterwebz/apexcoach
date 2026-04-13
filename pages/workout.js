import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Screen } from "../components/shared";

const EXERCISES = [
  { name:"Barbell Back Squat", muscle:"Quads · Glutes",      sets:4, reps:"8–10",    rest:90 },
  { name:"Romanian Deadlift",  muscle:"Hamstrings · Glutes", sets:3, reps:"10–12",   rest:75 },
  { name:"Leg Press",          muscle:"Quads · Hamstrings",  sets:3, reps:"12–15",   rest:60 },
  { name:"Walking Lunges",     muscle:"Quads · Glutes",      sets:3, reps:"12 each", rest:60 },
];

function buildSets(count) {
  return Array.from({ length: count }, () => ({ weight:"", reps:"", done:false }));
}

export default function Workout() {
  const router = useRouter();
  const [phase,   setPhase]   = useState("preview"); // preview | active | finished
  const [exIdx,   setExIdx]   = useState(0);
  const [allSets, setAllSets] = useState(EXERCISES.map(e => buildSets(e.sets)));
  const [timer,   setTimer]   = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const timerRef   = useRef(null);
  const elapsedRef = useRef(null);

  const ex      = EXERCISES[exIdx];
  const sets    = allSets[exIdx];
  const allDone = sets.every(s => s.done);
  const isLast  = exIdx === EXERCISES.length - 1;

  useEffect(() => {
    if (phase !== "active") return;
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(elapsedRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase === "finished") clearInterval(elapsedRef.current);
  }, [phase]);

  useEffect(() => {
    if (!timer) { clearInterval(timerRef.current); return; }
    if (timer.seconds <= 0) { setTimer(null); return; }
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (!t || t.seconds <= 1) { clearInterval(timerRef.current); return null; }
        return { ...t, seconds: t.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [!!timer]);

  const updateSet = (si, field, val) => {
    setAllSets(prev => {
      const next = prev.map(s => [...s]);
      next[exIdx][si] = { ...next[exIdx][si], [field]: val };
      return next;
    });
  };

  const completeSet = (si) => {
    setAllSets(prev => {
      const next = prev.map(s => [...s]);
      next[exIdx][si] = { ...next[exIdx][si], done:true };
      return next;
    });
    clearInterval(timerRef.current);
    setTimer({ seconds: ex.rest, initial: ex.rest });
  };

  const adjustTimer = (d) => setTimer(t => t ? { ...t, seconds: Math.max(5, t.seconds + d), initial: Math.max(5, t.seconds + d) } : null);
  const skipTimer   = () => { clearInterval(timerRef.current); setTimer(null); };
  const fmtTime     = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const timerPct    = timer ? (timer.seconds / timer.initial) * 100 : 0;

  return (
    <Screen style={{ height:"100vh", overflow:"hidden" }}>
      <style>{`input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;} input:focus{outline:none;border-color:#00ff80!important;}`}</style>

      {phase === "preview"  && <PreviewScreen  exercises={EXERCISES} onStart={() => setPhase("active")} onBack={() => router.push("/dashboard")} />}
      {phase === "active"   && <ActiveScreen   ex={ex} exIdx={exIdx} sets={sets} allDone={allDone} isLast={isLast} elapsed={elapsed} timer={timer} timerPct={timerPct} fmtTime={fmtTime} updateSet={updateSet} completeSet={completeSet} adjustTimer={adjustTimer} skipTimer={skipTimer} onBack={() => { setExIdx(i => i-1); setTimer(null); }} onNext={() => { isLast ? setPhase("finished") : (setExIdx(i => i+1), setTimer(null)); }} router={router} />}
      {phase === "finished" && <FinishedScreen allSets={allSets} elapsed={elapsed} fmtTime={fmtTime} router={router} />}
    </Screen>
  );
}

// ── Preview Screen ─────────────────────────────────────
function PreviewScreen({ exercises, onStart, onBack }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"48px 20px 32px", position:"relative", zIndex:1 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#666", fontSize:13, cursor:"pointer", textAlign:"left", marginBottom:20, fontFamily:"'DM Sans'", letterSpacing:1 }}>← BACK</button>

      <div style={{ marginBottom:6 }}>
        <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:4 }}>TODAY</div>
        <div style={{ fontFamily:"'Bebas Neue'", fontSize:38, letterSpacing:1.5, lineHeight:1 }}>Legs Day</div>
        <div style={{ fontSize:12, color:"#666", marginTop:4 }}>{exercises.length} exercises · Est. 60–75 min</div>
      </div>

      <div style={{ height:1, background:"#1a1a1a", margin:"18px 0" }}/>

      <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
        {exercises.map((ex, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"#111", border:"1px solid #1e1e1e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#555", fontWeight:700 }}>{i+1}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#e0e0e0" }}>{ex.name}</div>
              <div style={{ fontSize:11, color:"#666", marginTop:1 }}>{ex.sets} sets · {ex.reps} reps</div>
            </div>
            <div style={{ fontSize:10, color:"#444" }}>{ex.rest}s rest</div>
          </div>
        ))}
      </div>

      <button onClick={onStart} style={{ marginTop:20, padding:"16px", background:"linear-gradient(135deg,#00ff80,#00cc55)", border:"none", borderRadius:13, fontFamily:"'DM Sans'", fontSize:15, fontWeight:700, color:"#000", cursor:"pointer", letterSpacing:0.5 }}>
        Start Workout
      </button>
    </div>
  );
}

// ── Active Screen ──────────────────────────────────────
function ActiveScreen({ ex, exIdx, sets, allDone, isLast, elapsed, timer, timerPct, fmtTime, updateSet, completeSet, adjustTimer, skipTimer, onBack, onNext, router }) {
  return (
    <>
      {/* Header */}
      <div style={{ padding:"44px 20px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <button onClick={() => router.push("/dashboard")} style={{ background:"#0e0e0e", border:"1px solid #1e1e1e", borderRadius:8, padding:"5px 12px", color:"#666", fontSize:11, fontWeight:600, cursor:"pointer", letterSpacing:1 }}>EXIT</button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, color:"#00ff80", letterSpacing:2.5, fontWeight:600 }}>LEGS DAY</div>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:18, color:"#777", letterSpacing:2 }}>{fmtTime(elapsed)}</div>
          </div>
          <div style={{ background:"rgba(0,255,128,0.08)", border:"1px solid rgba(0,255,128,0.15)", borderRadius:8, padding:"5px 12px", fontSize:11, fontWeight:700, color:"#00ff80", letterSpacing:1 }}>{exIdx+1}/{EXERCISES.length}</div>
        </div>
        <div style={{ display:"flex", gap:5, marginBottom:14 }}>
          {EXERCISES.map((_,i) => <div key={i} style={{ flex:1, height:3, borderRadius:3, background: i<exIdx?"#00aa55":i===exIdx?"#00ff80":"#1a1a1a", transition:"background 0.3s" }}/>)}
        </div>
      </div>

      {/* Exercise info */}
      <div key={exIdx} className="fu" style={{ padding:"0 20px 10px", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:9, color:"#666", letterSpacing:2.5, fontWeight:600, marginBottom:3 }}>{ex.muscle.toUpperCase()}</div>
        <div style={{ fontFamily:"'Bebas Neue'", fontSize:28, letterSpacing:1.5, lineHeight:1, marginBottom:2 }}>{ex.name}</div>
        <div style={{ fontSize:11, color:"#666", marginBottom:12 }}>Target: {ex.reps} reps · {ex.rest}s rest</div>
      </div>

      {/* Table header */}
      <div style={{ display:"flex", padding:"0 20px", marginBottom:6, position:"relative", zIndex:1 }}>
        <div style={{ width:34, fontSize:9, color:"#444", letterSpacing:2, fontWeight:600 }}>SET</div>
        <div style={{ flex:1, fontSize:9, color:"#444", letterSpacing:2, fontWeight:600, textAlign:"center" }}>KG</div>
        <div style={{ flex:1, fontSize:9, color:"#444", letterSpacing:2, fontWeight:600, textAlign:"center" }}>REPS</div>
        <div style={{ width:46 }}/>
      </div>

      {/* Set rows */}
      <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:7, flex:1, position:"relative", zIndex:1 }}>
        {sets.map((s, si) => {
          const isActive = !s.done && sets.slice(0,si).every(x => x.done);
          const canLog   = s.weight !== "" && s.reps !== "";
          return (
            <div key={si} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:11, background: s.done?"rgba(0,255,128,0.05)":isActive?"#0e0e0e":"#090909", border:`1px solid ${s.done?"rgba(0,255,128,0.2)":isActive?"#1e1e1e":"#0e0e0e"}`, transition:"all 0.25s", overflow:"hidden", width:"100%" }}>
              <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, background: s.done?"rgba(0,255,128,0.12)":"#111", border:`1px solid ${s.done?"rgba(0,255,128,0.25)":"#1a1a1a"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color: s.done?"#00ff80":"#444" }}>{si+1}</div>
              <input type="number" placeholder="—" value={s.weight} disabled={s.done||!isActive} onChange={e => updateSet(si,"weight",e.target.value)}
                style={{ flex:1, minWidth:0, background:"transparent", border:`1px solid ${isActive&&!s.done?"#1e1e1e":"transparent"}`, borderRadius:7, padding:"6px 0", color: s.done?"#00aa55":isActive?"#f0f0f0":"#333", fontSize:20, fontFamily:"'Bebas Neue'", letterSpacing:1, textAlign:"center", outline:"none" }}/>
              <div style={{ width:1, height:16, background:"#1a1a1a", flexShrink:0 }}/>
              <input type="number" placeholder="—" value={s.reps} disabled={s.done||!isActive} onChange={e => updateSet(si,"reps",e.target.value)}
                style={{ flex:1, minWidth:0, background:"transparent", border:`1px solid ${isActive&&!s.done?"#1e1e1e":"transparent"}`, borderRadius:7, padding:"6px 0", color: s.done?"#00aa55":isActive?"#f0f0f0":"#333", fontSize:20, fontFamily:"'Bebas Neue'", letterSpacing:1, textAlign:"center", outline:"none" }}/>
              <button onClick={() => !s.done&&isActive&&canLog&&completeSet(si)} style={{ width:34, height:34, minWidth:34, borderRadius:9, flexShrink:0, background: s.done?"rgba(0,255,128,0.14)":isActive&&canLog?"rgba(0,255,128,0.08)":"#0a0a0a", border:`1px solid ${s.done?"rgba(0,255,128,0.35)":isActive&&canLog?"rgba(0,255,128,0.25)":"#0e0e0e"}`, color: s.done?"#00ff80":isActive&&canLog?"#00ff80":"#2a2a2a", fontSize:14, cursor: isActive&&canLog&&!s.done?"pointer":"default", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center" }}>{s.done?"✓":"○"}</button>
            </div>
          );
        })}
      </div>

      {/* Nav */}
      <div style={{ padding:"12px 20px 30px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", gap:10 }}>
          {exIdx > 0 && <button onClick={onBack} style={{ padding:"12px 16px", borderRadius:12, background:"#0e0e0e", border:"1px solid #1e1e1e", color:"#666", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans'" }}>Back</button>}
          <button onClick={allDone ? onNext : undefined} style={{ flex:1, padding:"13px", background: allDone?"linear-gradient(135deg,#00ff80,#00cc55)":"#0e0e0e", border:`1px solid ${allDone?"transparent":"#1a1a1a"}`, borderRadius:12, color: allDone?"#000":"#444", fontSize:13, fontWeight:700, cursor: allDone?"pointer":"default", fontFamily:"'DM Sans'", transition:"all 0.3s" }}>
            {allDone ? (isLast ? "Finish Workout" : "Next Exercise") : `Complete all ${ex.sets} sets to continue`}
          </button>
        </div>
      </div>

      {/* Rest timer overlay */}
      {timer && (
        <div className="fi" style={{ position:"absolute", inset:0, background:"rgba(8,8,8,0.93)", backdropFilter:"blur(16px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:20 }}>
          <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:14 }}>REST</div>
          <div style={{ position:"relative", width:170, height:170, marginBottom:24 }}>
            <svg width="170" height="170" style={{ transform:"rotate(-90deg)", position:"absolute" }}>
              <circle cx="85" cy="85" r="76" fill="none" stroke="#141414" strokeWidth="5"/>
              <circle cx="85" cy="85" r="76" fill="none" stroke="#00ff80" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${2*Math.PI*76}`} strokeDashoffset={`${2*Math.PI*76*(1-timerPct/100)}`} style={{ transition:"stroke-dashoffset 1s linear" }}/>
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontFamily:"'Bebas Neue'", fontSize:52, letterSpacing:2, lineHeight:1 }}>{fmtTime(timer.seconds)}</div>
              <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginTop:3 }}>SECONDS</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:24 }}>
            <button onClick={() => adjustTimer(-20)} style={{ width:52, height:52, borderRadius:12, background:"#0e0e0e", border:"1px solid #1e1e1e", color:"#e0e0e0", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans'" }}>-20</button>
            <div style={{ fontSize:9, color:"#333", letterSpacing:2 }}>ADJUST</div>
            <button onClick={() => adjustTimer(20)}  style={{ width:52, height:52, borderRadius:12, background:"#0e0e0e", border:"1px solid #1e1e1e", color:"#e0e0e0", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans'" }}>+20</button>
          </div>
          <button onClick={skipTimer} style={{ padding:"10px 32px", borderRadius:12, background:"transparent", border:"1px solid #1e1e1e", color:"#555", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans'", letterSpacing:1 }}>SKIP REST</button>
        </div>
      )}
    </>
  );
}

// ── Finished Screen ────────────────────────────────────
function FinishedScreen({ allSets, elapsed, fmtTime, router }) {
  const totalSets = allSets.reduce((a,s) => a + s.filter(x => x.done).length, 0);
  const totalVol  = allSets.reduce((a,sets) => a + sets.filter(s => s.done&&s.weight&&s.reps).reduce((b,s) => b+(parseFloat(s.weight)*parseInt(s.reps)),0), 0);
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 24px", position:"relative", zIndex:1 }}>
      <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:10 }}>WORKOUT COMPLETE</div>
      <div style={{ fontFamily:"'Bebas Neue'", fontSize:48, letterSpacing:2, textAlign:"center", lineHeight:1, marginBottom:24 }}>Legs Day<br/><span style={{ color:"#00ff80" }}>Crushed</span></div>
      <div style={{ display:"flex", gap:12, width:"100%", marginBottom:32 }}>
        {[
          { label:"Duration", value:fmtTime(elapsed), unit:"" },
          { label:"Sets Done", value:totalSets, unit:"sets" },
          { label:"Volume",   value:Math.round(totalVol).toLocaleString(), unit:"kg" },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{ flex:1, background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:13, padding:"14px 10px", textAlign:"center" }}>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:26, color:"#00ff80", letterSpacing:1 }}>{value}<span style={{ fontSize:11, color:"#555", fontFamily:"'DM Sans'", fontWeight:400 }}> {unit}</span></div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2, fontWeight:600, marginTop:4 }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <button onClick={() => router.push("/dashboard")} style={{ width:"100%", padding:"15px", background:"linear-gradient(135deg,#00ff80,#00cc55)", border:"none", borderRadius:13, fontFamily:"'DM Sans'", fontSize:14, fontWeight:700, color:"#000", cursor:"pointer" }}>
        Back to Dashboard
      </button>
    </div>
  );
}

const EXERCISES_REF = EXERCISES;

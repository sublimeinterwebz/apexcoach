import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Screen } from "../components/shared";

const EXERCISES = [
  { name:"Barbell Back Squat", muscle:"Quads · Glutes",      sets:4, reps:"8–10",    rest:90 },
  { name:"Romanian Deadlift",  muscle:"Hamstrings · Glutes", sets:3, reps:"10–12",   rest:75 },
  { name:"Leg Press",          muscle:"Quads · Hamstrings",  sets:3, reps:"12–15",   rest:60 },
  { name:"Walking Lunges",     muscle:"Quads · Glutes",      sets:3, reps:"12 each", rest:60 },
];

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function buildSets(count) {
  return Array.from({ length: count }, () => ({ weight:"", reps:"", done:false }));
}

export default function Workout() {
  const router = useRouter();
  const [exIdx, setExIdx]     = useState(0);
  const [allSets, setAllSets] = useState(EXERCISES.map(e => buildSets(e.sets)));
  const [timer, setTimer]     = useState(null);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const timerRef   = useRef(null);
  const elapsedRef = useRef(null);

  const ex   = EXERCISES[exIdx];
  const sets = allSets[exIdx];
  const allDone = sets.every(s => s.done);
  const isLast  = exIdx === EXERCISES.length - 1;

  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(elapsedRef.current);
  }, []);

  useEffect(() => {
    if (finished) clearInterval(elapsedRef.current);
  }, [finished]);

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

  const adjustTimer = (delta) => setTimer(t => t ? { ...t, seconds: Math.max(5, t.seconds + delta), initial: Math.max(5, t.seconds + delta) } : null);
  const skipTimer   = () => { clearInterval(timerRef.current); setTimer(null); };
  const fmtTime     = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const timerPct    = timer ? (timer.seconds / timer.initial) * 100 : 0;

  return (
    <Screen style={{ height:"100vh", overflow:"hidden" }}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input:focus{outline:none;border-color:#00ff80!important;}
      `}</style>

      {finished ? (
        <FinishedScreen allSets={allSets} elapsed={elapsed} fmtTime={fmtTime} router={router} />
      ) : (
        <>
          {/* Header */}
          <div style={{ padding:"44px 20px 0", position:"relative", zIndex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <button onClick={() => router.push("/dashboard")} style={{ background:"#0e0e0e", border:"1px solid #1e1e1e", borderRadius:8, padding:"5px 12px", color:"#444", fontSize:11, fontWeight:600, cursor:"pointer", letterSpacing:1 }}>EXIT</button>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#00ff80", letterSpacing:2.5, fontWeight:600 }}>LEGS DAY</div>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:18, color:"#666", letterSpacing:2 }}>{fmtTime(elapsed)}</div>
              </div>
              <div style={{ background:"rgba(0,255,128,0.08)", border:"1px solid rgba(0,255,128,0.15)", borderRadius:8, padding:"5px 12px", fontSize:11, fontWeight:700, color:"#00ff80", letterSpacing:1 }}>
                {exIdx+1}/{EXERCISES.length}
              </div>
            </div>
            <div style={{ display:"flex", gap:5, marginBottom:18 }}>
              {EXERCISES.map((_,i) => (
                <div key={i} style={{ flex:1, height:3, borderRadius:3, background: i<exIdx?"#00aa55":i===exIdx?"#00ff80":"#141414", transition:"background 0.3s" }}/>
              ))}
            </div>
          </div>

          {/* Exercise info */}
          <div key={exIdx} className="fu" style={{ padding:"0 20px", position:"relative", zIndex:1 }}>
            <div style={{ fontSize:9, color:"#444", letterSpacing:2.5, fontWeight:600, marginBottom:3 }}>{ex.muscle.toUpperCase()}</div>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:34, letterSpacing:1.5, lineHeight:1, marginBottom:3 }}>{ex.name}</div>
            <div style={{ fontSize:11, color:"#333", marginBottom:18 }}>Target: {ex.reps} reps · {ex.rest}s rest</div>
          </div>

          {/* Table header */}
          <div style={{ display:"flex", padding:"0 20px", marginBottom:8, position:"relative", zIndex:1 }}>
            <div style={{ width:34, fontSize:9, color:"#222", letterSpacing:2, fontWeight:600 }}>SET</div>
            <div style={{ flex:1, fontSize:9, color:"#222", letterSpacing:2, fontWeight:600, textAlign:"center" }}>KG</div>
            <div style={{ flex:1, fontSize:9, color:"#222", letterSpacing:2, fontWeight:600, textAlign:"center" }}>REPS</div>
            <div style={{ width:48 }}/>
          </div>

          {/* Set rows */}
          <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:9, flex:1, position:"relative", zIndex:1 }}>
            {sets.map((s, si) => {
              const isActive = !s.done && sets.slice(0,si).every(x => x.done);
              const canLog   = s.weight !== "" && s.reps !== "";
              return (
                <div key={si} style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"11px 13px", borderRadius:12,
                  background: s.done ? "rgba(0,255,128,0.05)" : isActive ? "#0e0e0e" : "#090909",
                  border:`1px solid ${s.done?"rgba(0,255,128,0.2)":isActive?"#1e1e1e":"#0e0e0e"}`,
                  transition:"all 0.25s",
                }}>
                  <div style={{ width:24, height:24, borderRadius:6, background: s.done?"rgba(0,255,128,0.12)":"#111", border:`1px solid ${s.done?"rgba(0,255,128,0.25)":"#1a1a1a"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color: s.done?"#00ff80":"#2a2a2a" }}>{si+1}</div>
                  <input type="number" placeholder="—" value={s.weight} disabled={s.done||!isActive} onChange={e => updateSet(si,"weight",e.target.value)}
                    style={{ flex:1, background:"transparent", border:`1px solid ${isActive&&!s.done?"#1e1e1e":"transparent"}`, borderRadius:7, padding:"7px 0", color: s.done?"#00aa55":isActive?"#f0f0f0":"#2a2a2a", fontSize:20, fontFamily:"'Bebas Neue'", letterSpacing:1, textAlign:"center", outline:"none" }}/>
                  <div style={{ width:1, height:18, background:"#141414" }}/>
                  <input type="number" placeholder="—" value={s.reps} disabled={s.done||!isActive} onChange={e => updateSet(si,"reps",e.target.value)}
                    style={{ flex:1, background:"transparent", border:`1px solid ${isActive&&!s.done?"#1e1e1e":"transparent"}`, borderRadius:7, padding:"7px 0", color: s.done?"#00aa55":isActive?"#f0f0f0":"#2a2a2a", fontSize:20, fontFamily:"'Bebas Neue'", letterSpacing:1, textAlign:"center", outline:"none" }}/>
                  <button onClick={() => !s.done&&isActive&&canLog&&completeSet(si)} style={{
                    width:36, height:36, borderRadius:9, flexShrink:0,
                    background: s.done?"rgba(0,255,128,0.14)":isActive&&canLog?"rgba(0,255,128,0.08)":"#0a0a0a",
                    border:`1px solid ${s.done?"rgba(0,255,128,0.35)":isActive&&canLog?"rgba(0,255,128,0.25)":"#0e0e0e"}`,
                    color: s.done?"#00ff80":isActive&&canLog?"#00ff80":"#1a1a1a",
                    fontSize:15, cursor: isActive&&canLog&&!s.done?"pointer":"default",
                    transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center",
                  }}>{s.done?"✓":"○"}</button>
                </div>
              );
            })}
          </div>

          {/* Nav */}
          <div style={{ padding:"14px 20px 32px", position:"relative", zIndex:1 }}>
            <div style={{ display:"flex", gap:10 }}>
              {exIdx > 0 && (
                <button onClick={() => { setExIdx(i => i-1); setTimer(null); }} style={{ padding:"13px 18px", borderRadius:12, background:"#0e0e0e", border:"1px solid #1e1e1e", color:"#444", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans'" }}>Back</button>
              )}
              <button onClick={allDone ? () => { isLast ? setFinished(true) : (setExIdx(i => i+1), setTimer(null)) } : undefined} style={{
                flex:1, padding:"14px",
                background: allDone ? "linear-gradient(135deg,#00ff80,#00cc55)" : "#0e0e0e",
                border:`1px solid ${allDone?"transparent":"#1a1a1a"}`,
                borderRadius:12, color: allDone?"#000":"#2a2a2a",
                fontSize:13, fontWeight:700, cursor: allDone?"pointer":"default",
                fontFamily:"'DM Sans'", transition:"all 0.3s",
              }}>
                {allDone ? (isLast ? "Finish Workout" : "Next Exercise") : `Complete all ${ex.sets} sets to continue`}
              </button>
            </div>
          </div>

          {/* Rest timer overlay */}
          {timer && (
            <div className="fi" style={{ position:"absolute", inset:0, background:"rgba(8,8,8,0.93)", backdropFilter:"blur(16px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:20, gap:0 }}>
              <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:14 }}>REST</div>
              <div style={{ position:"relative", width:180, height:180, marginBottom:26 }}>
                <svg width="180" height="180" style={{ transform:"rotate(-90deg)", position:"absolute" }}>
                  <circle cx="90" cy="90" r="80" fill="none" stroke="#141414" strokeWidth="5"/>
                  <circle cx="90" cy="90" r="80" fill="none" stroke="#00ff80" strokeWidth="5"
                    strokeLinecap="round" strokeDasharray={`${2*Math.PI*80}`}
                    strokeDashoffset={`${2*Math.PI*80*(1-timerPct/100)}`}
                    style={{ transition:"stroke-dashoffset 1s linear" }}/>
                </svg>
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ fontFamily:"'Bebas Neue'", fontSize:56, letterSpacing:2, lineHeight:1 }}>{fmtTime(timer.seconds)}</div>
                  <div style={{ fontSize:9, color:"#333", letterSpacing:2, marginTop:4 }}>SECONDS</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:28 }}>
                <button onClick={() => adjustTimer(-20)} style={{ width:54, height:54, borderRadius:13, background:"#0e0e0e", border:"1px solid #1e1e1e", color:"#e0e0e0", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans'" }}>-20</button>
                <div style={{ fontSize:9, color:"#222", letterSpacing:2 }}>ADJUST</div>
                <button onClick={() => adjustTimer(20)}  style={{ width:54, height:54, borderRadius:13, background:"#0e0e0e", border:"1px solid #1e1e1e", color:"#e0e0e0", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans'" }}>+20</button>
              </div>
              <button onClick={skipTimer} style={{ padding:"11px 36px", borderRadius:12, background:"transparent", border:"1px solid #1e1e1e", color:"#333", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans'", letterSpacing:1 }}>SKIP REST</button>
            </div>
          )}
        </>
      )}
    </Screen>
  );
}

function FinishedScreen({ allSets, elapsed, fmtTime, router }) {
  const totalSets = allSets.reduce((a,s) => a + s.filter(x => x.done).length, 0);
  const totalVol  = allSets.reduce((a,sets) => a + sets.filter(s => s.done&&s.weight&&s.reps).reduce((b,s) => b+(parseFloat(s.weight)*parseInt(s.reps)),0), 0);
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 24px", position:"relative", zIndex:1 }}>
      <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:10 }}>WORKOUT COMPLETE</div>
      <div style={{ fontFamily:"'Bebas Neue'", fontSize:48, letterSpacing:2, textAlign:"center", lineHeight:1, marginBottom:24 }}>
        Legs Day<br/><span style={{ color:"#00ff80" }}>Crushed</span>
      </div>
      <div style={{ display:"flex", gap:12, width:"100%", marginBottom:32 }}>
        {[
          { label:"Duration", value:fmtTime(elapsed), unit:"" },
          { label:"Sets Done", value:totalSets,        unit:"sets" },
          { label:"Volume",   value:Math.round(totalVol).toLocaleString(), unit:"kg" },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{ flex:1, background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:13, padding:"14px 10px", textAlign:"center" }}>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:26, color:"#00ff80", letterSpacing:1 }}>
              {value}<span style={{ fontSize:11, color:"#333", fontFamily:"'DM Sans'", fontWeight:400 }}> {unit}</span>
            </div>
            <div style={{ fontSize:9, color:"#2a2a2a", letterSpacing:2, fontWeight:600, marginTop:4 }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <button onClick={() => router.push("/dashboard")} style={{ width:"100%", padding:"15px", background:"linear-gradient(135deg,#00ff80,#00cc55)", border:"none", borderRadius:13, fontFamily:"'DM Sans'", fontSize:14, fontWeight:700, color:"#000", cursor:"pointer" }}>
        Back to Dashboard
      </button>
    </div>
  );
}

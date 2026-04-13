import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Screen } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan } from "../lib/firebase";

const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

function buildSets(count) {
  return Array.from({ length: count }, () => ({ weight:"", reps:"", done:false }));
}

export default function Workout() {
  const router = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [plan,      setPlan]      = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [phase,     setPhase]     = useState("preview");
  const [exIdx,     setExIdx]     = useState(0);
  const [allSets,   setAllSets]   = useState([]);
  const [timer,     setTimer]     = useState(null);
  const [elapsed,   setElapsed]   = useState(0);
  const timerRef   = useRef(null);
  const elapsedRef = useRef(null);

  if (loading) return null;

  const currentWeek = profile?.currentWeek || 1;

  // Load plan
  useEffect(() => {
    if (!user) return;
    async function load() {
      setPlanLoading(true);
      try {
        const cached = profile?.plan?.weekPlan;
        if (cached) { setPlan(profile.plan); }
        else {
          const p = await getWeekPlan(user.uid, currentWeek);
          if (p) setPlan(p);
        }
      } catch(e) { console.error(e); }
      setPlanLoading(false);
    }
    load();
  }, [user]);

  // Today's workout from the plan
  const todayPlan  = plan?.weekPlan?.[TODAY_IDX];
  const exercises  = todayPlan?.type === "workout" ? (todayPlan.exercises || []) : [];

  // Init sets when exercises load
  useEffect(() => {
    if (exercises.length > 0) setAllSets(exercises.map(e => buildSets(e.sets || 3)));
  }, [exercises.length]);

  const ex      = exercises[exIdx];
  const sets    = allSets[exIdx] || [];
  const allDone = sets.length > 0 && sets.every(s => s.done);
  const isLast  = exIdx === exercises.length - 1;

  useEffect(() => {
    if (phase !== "active") return;
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(elapsedRef.current);
  }, [phase]);

  useEffect(() => { if (phase === "finished") clearInterval(elapsedRef.current); }, [phase]);

  useEffect(() => {
    if (!timer) { clearInterval(timerRef.current); return; }
    if (timer.seconds <= 0) { setTimer(null); return; }
    timerRef.current = setInterval(() => {
      setTimer(t => { if (!t || t.seconds <= 1) { clearInterval(timerRef.current); return null; } return { ...t, seconds: t.seconds - 1 }; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [!!timer]);

  const updateSet = (si, field, val) => setAllSets(prev => { const next = prev.map(s => [...s]); next[exIdx][si] = { ...next[exIdx][si], [field]: val }; return next; });
  const completeSet = (si) => {
    setAllSets(prev => { const next = prev.map(s => [...s]); next[exIdx][si] = { ...next[exIdx][si], done:true }; return next; });
    clearInterval(timerRef.current);
    setTimer({ seconds: ex?.restSeconds || 60, initial: ex?.restSeconds || 60 });
  };
  const adjustTimer = (d) => setTimer(t => t ? { ...t, seconds: Math.max(5, t.seconds + d), initial: Math.max(5, t.seconds + d) } : null);
  const skipTimer   = () => { clearInterval(timerRef.current); setTimer(null); };
  const fmtTime     = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const timerPct    = timer ? (timer.seconds / timer.initial) * 100 : 0;

  if (planLoading) return (
    <Screen style={{ alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#00ff80", animation:"spin 1s linear infinite" }}/>
    </Screen>
  );

  if (!plan || !todayPlan || todayPlan.type === "rest") return (
    <Screen style={{ alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", padding:"0 32px", position:"relative", zIndex:1 }}>
        <div style={{ fontFamily:"'Bebas Neue'", fontSize:32, letterSpacing:2, color:"#1e1e1e", marginBottom:8 }}>
          {!plan ? "NO PLAN YET" : "REST DAY"}
        </div>
        <div style={{ fontSize:13, color:"#333", lineHeight:1.7, marginBottom:20 }}>
          {!plan ? "Generate your plan from the dashboard first." : "Recovery is part of the process. Sleep well and stay hydrated."}
        </div>
        <button onClick={() => router.push("/dashboard")} style={{ padding:"12px 24px", background:"rgba(0,255,128,0.1)", border:"1px solid rgba(0,255,128,0.3)", borderRadius:12, color:"#00ff80", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans'" }}>Back to Dashboard</button>
      </div>
    </Screen>
  );

  return (
    <Screen style={{ height:"100vh", overflow:"hidden" }}>
      <style>{`input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;} input:focus{outline:none;border-color:#00ff80!important;} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

      {phase === "preview"  && <PreviewScreen exercises={exercises} todayPlan={todayPlan} onStart={() => setPhase("active")} onBack={() => router.push("/dashboard")} />}
      {phase === "active"   && ex && <ActiveScreen ex={ex} exIdx={exIdx} exercises={exercises} sets={sets} allDone={allDone} isLast={isLast} elapsed={elapsed} timer={timer} timerPct={timerPct} fmtTime={fmtTime} updateSet={updateSet} completeSet={completeSet} adjustTimer={adjustTimer} skipTimer={skipTimer} onBack={() => { setExIdx(i => i-1); setTimer(null); }} onNext={() => { isLast ? setPhase("finished") : (setExIdx(i => i+1), setTimer(null)); }} router={router} />}
      {phase === "finished" && <FinishedScreen allSets={allSets} elapsed={elapsed} fmtTime={fmtTime} router={router} />}
    </Screen>
  );
}

function PreviewScreen({ exercises, todayPlan, onStart, onBack }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"48px 20px 32px", position:"relative", zIndex:1 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#666", fontSize:12, cursor:"pointer", textAlign:"left", marginBottom:20, fontFamily:"'DM Sans'", letterSpacing:1 }}>← BACK</button>
      <div style={{ marginBottom:6 }}>
        <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:4 }}>TODAY</div>
        <div style={{ fontFamily:"'Bebas Neue'", fontSize:36, letterSpacing:1.5, lineHeight:1 }}>{todayPlan.sessionLabel}</div>
        <div style={{ fontSize:12, color:"#666", marginTop:4 }}>{todayPlan.muscleGroups} · {exercises.length} exercises · {todayPlan.estimatedDuration}</div>
      </div>
      <div style={{ height:1, background:"#1a1a1a", margin:"18px 0" }}/>
      <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1, overflowY:"auto" }}>
        {exercises.map((ex, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:"#111", border:"1px solid #1e1e1e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#555", fontWeight:700 }}>{i+1}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#e0e0e0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ex.name}</div>
              <div style={{ fontSize:11, color:"#555", marginTop:1 }}>{ex.sets} sets · {ex.reps} reps</div>
            </div>
            <div style={{ fontSize:10, color:"#333", flexShrink:0 }}>{ex.restSeconds}s rest</div>
          </div>
        ))}
      </div>
      <button onClick={onStart} style={{ marginTop:16, padding:"15px", background:"linear-gradient(135deg,#00ff80,#00cc55)", border:"none", borderRadius:13, fontFamily:"'DM Sans'", fontSize:14, fontWeight:700, color:"#000", cursor:"pointer" }}>Start Workout</button>
    </div>
  );
}

function ActiveScreen({ ex, exIdx, exercises, sets, allDone, isLast, elapsed, timer, timerPct, fmtTime, updateSet, completeSet, adjustTimer, skipTimer, onBack, onNext, router }) {
  return (
    <>
      <div style={{ padding:"44px 20px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <button onClick={() => router.push("/dashboard")} style={{ background:"#0e0e0e", border:"1px solid #1e1e1e", borderRadius:8, padding:"5px 12px", color:"#666", fontSize:11, fontWeight:600, cursor:"pointer", letterSpacing:1 }}>EXIT</button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, color:"#00ff80", letterSpacing:2.5, fontWeight:600 }}>WORKOUT</div>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:18, color:"#777", letterSpacing:2 }}>{fmtTime(elapsed)}</div>
          </div>
          <div style={{ background:"rgba(0,255,128,0.08)", border:"1px solid rgba(0,255,128,0.15)", borderRadius:8, padding:"5px 12px", fontSize:11, fontWeight:700, color:"#00ff80" }}>{exIdx+1}/{exercises.length}</div>
        </div>
        <div style={{ display:"flex", gap:4, marginBottom:14 }}>
          {exercises.map((_,i) => <div key={i} style={{ flex:1, height:3, borderRadius:3, background: i<exIdx?"#00aa55":i===exIdx?"#00ff80":"#1a1a1a", transition:"background 0.3s" }}/>)}
        </div>
      </div>
      <div key={exIdx} style={{ padding:"0 20px 10px", position:"relative", zIndex:1, animation:"fadeIn 0.3s ease" }}>
        <div style={{ fontSize:9, color:"#666", letterSpacing:2.5, fontWeight:600, marginBottom:3 }}>{ex.notes || ""}</div>
        <div style={{ fontFamily:"'Bebas Neue'", fontSize:28, letterSpacing:1.5, lineHeight:1, marginBottom:2 }}>{ex.name}</div>
        <div style={{ fontSize:11, color:"#555", marginBottom:12 }}>Target: {ex.reps} reps · {ex.restSeconds}s rest</div>
      </div>
      <div style={{ display:"flex", padding:"0 20px", marginBottom:6, position:"relative", zIndex:1 }}>
        <div style={{ width:30, fontSize:9, color:"#333", letterSpacing:2, fontWeight:600 }}>SET</div>
        <div style={{ flex:1, fontSize:9, color:"#333", letterSpacing:2, fontWeight:600, textAlign:"center" }}>KG</div>
        <div style={{ flex:1, fontSize:9, color:"#333", letterSpacing:2, fontWeight:600, textAlign:"center" }}>REPS</div>
        <div style={{ width:44 }}/>
      </div>
      <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:7, flex:1, position:"relative", zIndex:1 }}>
        {sets.map((s, si) => {
          const isActive = !s.done && sets.slice(0,si).every(x => x.done);
          const canLog   = s.weight !== "" && s.reps !== "";
          return (
            <div key={si} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 10px", borderRadius:11, background: s.done?"rgba(0,255,128,0.05)":isActive?"#0e0e0e":"#090909", border:`1px solid ${s.done?"rgba(0,255,128,0.2)":isActive?"#1e1e1e":"#0e0e0e"}`, transition:"all 0.25s", boxSizing:"border-box" }}>
              <div style={{ width:20, height:20, borderRadius:5, flexShrink:0, background: s.done?"rgba(0,255,128,0.12)":"#111", border:`1px solid ${s.done?"rgba(0,255,128,0.25)":"#1a1a1a"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color: s.done?"#00ff80":"#444" }}>{si+1}</div>
              <input type="number" placeholder="—" value={s.weight} disabled={s.done||!isActive} onChange={e => updateSet(si,"weight",e.target.value)}
                style={{ flex:1, minWidth:0, width:0, background:"transparent", border:`1px solid ${isActive&&!s.done?"#1e1e1e":"transparent"}`, borderRadius:7, padding:"6px 2px", color: s.done?"#00aa55":isActive?"#f0f0f0":"#333", fontSize:20, fontFamily:"'Bebas Neue'", letterSpacing:1, textAlign:"center", outline:"none" }}/>
              <div style={{ width:1, height:16, background:"#1a1a1a", flexShrink:0 }}/>
              <input type="number" placeholder="—" value={s.reps} disabled={s.done||!isActive} onChange={e => updateSet(si,"reps",e.target.value)}
                style={{ flex:1, minWidth:0, width:0, background:"transparent", border:`1px solid ${isActive&&!s.done?"#1e1e1e":"transparent"}`, borderRadius:7, padding:"6px 2px", color: s.done?"#00aa55":isActive?"#f0f0f0":"#333", fontSize:20, fontFamily:"'Bebas Neue'", letterSpacing:1, textAlign:"center", outline:"none" }}/>
              <button onClick={() => !s.done&&isActive&&canLog&&completeSet(si)} style={{ width:36, height:36, minWidth:36, borderRadius:9, flexShrink:0, background: s.done?"rgba(0,255,128,0.14)":isActive&&canLog?"rgba(0,255,128,0.08)":"#0a0a0a", border:`1px solid ${s.done?"rgba(0,255,128,0.35)":isActive&&canLog?"rgba(0,255,128,0.25)":"#0e0e0e"}`, color: s.done?"#00ff80":isActive&&canLog?"#00ff80":"#2a2a2a", fontSize:15, cursor: isActive&&canLog&&!s.done?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center" }}>{s.done?"✓":"○"}</button>
            </div>
          );
        })}
      </div>
      <div style={{ padding:"12px 20px 30px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", gap:10 }}>
          {exIdx > 0 && <button onClick={onBack} style={{ padding:"12px 16px", borderRadius:12, background:"#0e0e0e", border:"1px solid #1e1e1e", color:"#666", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans'" }}>Back</button>}
          <button onClick={allDone ? onNext : undefined} style={{ flex:1, padding:"13px", background: allDone?"linear-gradient(135deg,#00ff80,#00cc55)":"#0e0e0e", border:`1px solid ${allDone?"transparent":"#1a1a1a"}`, borderRadius:12, color: allDone?"#000":"#444", fontSize:13, fontWeight:700, cursor: allDone?"pointer":"default", fontFamily:"'DM Sans'", transition:"all 0.3s" }}>
            {allDone ? (isLast ? "Finish Workout" : "Next Exercise") : `Complete all ${ex.sets} sets to continue`}
          </button>
        </div>
      </div>
      {timer && (
        <div style={{ position:"absolute", inset:0, background:"rgba(8,8,8,0.93)", backdropFilter:"blur(16px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:20, animation:"fadeIn 0.2s ease" }}>
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

function FinishedScreen({ allSets, elapsed, fmtTime, router }) {
  const totalSets = allSets.reduce((a,s) => a + s.filter(x => x.done).length, 0);
  const totalVol  = allSets.reduce((a,sets) => a + sets.filter(s => s.done&&s.weight&&s.reps).reduce((b,s) => b+(parseFloat(s.weight)*parseInt(s.reps)),0), 0);
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 24px", position:"relative", zIndex:1 }}>
      <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:10 }}>WORKOUT COMPLETE</div>
      <div style={{ fontFamily:"'Bebas Neue'", fontSize:48, letterSpacing:2, textAlign:"center", lineHeight:1, marginBottom:24 }}>Session<br/><span style={{ color:"#00ff80" }}>Crushed</span></div>
      <div style={{ display:"flex", gap:12, width:"100%", marginBottom:32 }}>
        {[{ label:"Duration", value:fmtTime(elapsed), unit:"" },{ label:"Sets Done", value:totalSets, unit:"sets" },{ label:"Volume", value:Math.round(totalVol).toLocaleString(), unit:"kg" }].map(({ label, value, unit }) => (
          <div key={label} style={{ flex:1, background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:13, padding:"14px 10px", textAlign:"center" }}>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:26, color:"#00ff80", letterSpacing:1 }}>{value}<span style={{ fontSize:11, color:"#555", fontFamily:"'DM Sans'", fontWeight:400 }}> {unit}</span></div>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2, fontWeight:600, marginTop:4 }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <button onClick={() => router.push("/dashboard")} style={{ width:"100%", padding:"15px", background:"linear-gradient(135deg,#00ff80,#00cc55)", border:"none", borderRadius:13, fontFamily:"'DM Sans'", fontSize:14, fontWeight:700, color:"#000", cursor:"pointer" }}>Back to Dashboard</button>
    </div>
  );
}

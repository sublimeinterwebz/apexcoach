import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan } from "../lib/firebase";

const STATUS_STYLE = {
  improved:   { color:"#00ff80", bg:"rgba(0,255,128,0.08)",  border:"rgba(0,255,128,0.25)" },
  maintained: { color:"#ffaa00", bg:"rgba(255,170,0,0.08)",  border:"rgba(255,170,0,0.25)" },
  missed:     { color:"#ff5e5e", bg:"rgba(255,94,94,0.08)",  border:"rgba(255,94,94,0.25)" },
};

const GEN_STEPS = [
  { label:"Analyzing your week's performance",      threshold:20  },
  { label:"Identifying progression opportunities",  threshold:42  },
  { label:"Calculating new loads and volume",       threshold:63  },
  { label:"Building nutrition targets",             threshold:82  },
  { label:"Finalizing next week's plan",            threshold:100 },
];

export default function Review() {
  const router = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [plan,      setPlan]      = useState(null);
  const [phase,     setPhase]     = useState("review");
  const [page,      setPage]      = useState(0);
  const [progress,  setProgress]  = useState(0);
  const [genStep,   setGenStep]   = useState(0);
  const intervalRef = useRef(null);

  if (loading) return null;

  const currentWeek = profile?.currentWeek || 1;

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        if (profile?.plan?.weekPlan) { setPlan(profile.plan); return; }
        const p = await getWeekPlan(user.uid, currentWeek);
        if (p) setPlan(p);
      } catch(e) { console.error(e); }
    }
    load();
  }, [user]);

  const startGeneration = () => {
    setPhase("generating"); setProgress(0); setGenStep(0);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        const next = p + 1.6;
        if (next >= 100) { clearInterval(intervalRef.current); setTimeout(() => setPhase("ready"), 400); return 100; }
        return next;
      });
    }, 50);
  };
  useEffect(() => () => clearInterval(intervalRef.current), []);
  useEffect(() => {
    const s = GEN_STEPS.findIndex(s => progress < s.threshold);
    setGenStep(s === -1 ? GEN_STEPS.length : s);
  }, [progress]);

  // Build real exercise list from plan
  const exercises = plan ? plan.weekPlan
    ?.filter(d => d.type === "workout")
    .flatMap(d => (d.exercises || []).map(e => ({ ...e, day: d.sessionLabel }))) : [];

  const weekPlan = plan?.weekPlan || [];
  const totalWorkouts = weekPlan.filter(d => d.type === "workout").length;

  return (
    <Screen>
      {phase === "review"     && <ReviewPhase page={page} setPage={setPage} onGenerate={startGeneration} plan={plan} totalWorkouts={totalWorkouts} exercises={exercises} currentWeek={currentWeek} />}
      {phase === "generating" && <GeneratingPhase progress={progress} currentStep={genStep} />}
      {phase === "ready"      && <ReadyPhase router={router} currentWeek={currentWeek} />}
      {phase === "review" && <BottomNav active="review" router={router} />}
    </Screen>
  );
}

function ReviewPhase({ page, setPage, onGenerate, plan, totalWorkouts, exercises, currentWeek }) {
  // For now show plan summary stats since we don't track real session logs yet
  const stats = [
    { label:"Exercises", value: exercises.length.toString(), sub:"in your plan" },
    { label:"Sessions",  value: totalWorkouts.toString(),    sub:"this week" },
    { label:"Week",      value: currentWeek.toString(),      sub:"current week" },
  ];

  return (
    <div className="fu" style={{ flex:1, display:"flex", flexDirection:"column", padding:"44px 20px 80px", position:"relative", zIndex:1 }}>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:4 }}>WEEK {currentWeek}</div>
        <div style={{ fontFamily:"'Bebas Neue'", fontSize:34, letterSpacing:1.5, lineHeight:1.05 }}>Your Weekly <span style={{ color:"#00ff80" }}>Review</span></div>
      </div>
      <div style={{ display:"flex", gap:5, marginBottom:14 }}>
        {["Overview","Exercises"].map((label,i) => (
          <button key={i} onClick={() => setPage(i)} style={{ flex: i===page?2:1, height:3, borderRadius:3, background: i===page?"#00ff80":"#1e1e1e", border:"none", cursor:"pointer", transition:"all .3s", padding:0 }}/>
        ))}
      </div>

      {page === 0 ? (
        <div key="p0" style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"flex", gap:8 }}>
            {stats.map(({ label, value, sub }) => (
              <div key={label} style={{ flex:1, background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"11px 8px", textAlign:"center" }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:26, letterSpacing:1, color:"#00ff80", lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:9, color:"#333", letterSpacing:1.5, fontWeight:600, marginTop:4 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize:9, color:"#222", marginTop:2 }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"#0a0a0a", border:"1px solid #1a1a1a", borderLeft:"2px solid #00ff80", borderRadius:12, padding:"13px", flex:1 }}>
            <div style={{ fontSize:9, color:"#00ff80", letterSpacing:2.5, fontWeight:600, marginBottom:9 }}>YOUR PLAN SUMMARY</div>
            {plan ? (
              <>
                <p style={{ fontSize:13, color:"#888", lineHeight:1.68, marginBottom:10 }}>{plan.coachNote || "Your personalized plan is ready. Stay consistent and track your workouts."}</p>
                <p style={{ fontSize:12, color:"#555", lineHeight:1.65 }}>{plan.nutrition?.nutritionNotes || ""}</p>
              </>
            ) : (
              <p style={{ fontSize:13, color:"#555", lineHeight:1.68 }}>Generate your plan from the dashboard to see your personalized review here.</p>
            )}
          </div>
          <button onClick={() => setPage(1)} style={{ width:"100%", padding:"13px", background:"#0e0e0e", border:"1px solid #1e1e1e", borderRadius:12, fontFamily:"'DM Sans'", fontSize:13, fontWeight:600, color:"#555", cursor:"pointer" }}>
            See Exercise Breakdown
          </button>
        </div>
      ) : (
        <div key="p1" style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"13px", flex:1, overflowY:"auto" }}>
            <div style={{ fontSize:9, color:"#333", letterSpacing:2.5, fontWeight:600, marginBottom:13 }}>EXERCISE BREAKDOWN</div>
            {exercises.length === 0 ? (
              <div style={{ fontSize:12, color:"#333", textAlign:"center", padding:"24px 0" }}>No plan generated yet</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {exercises.map(({ name, sets, reps, day }, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#d0d0d0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
                      <div style={{ fontSize:10, color:"#2a2a2a", marginTop:2 }}>{sets} sets · {reps} reps · {day}</div>
                    </div>
                    <div style={{ padding:"3px 11px", borderRadius:20, fontSize:10, fontWeight:700, flexShrink:0, background:STATUS_STYLE.improved.bg, border:`1px solid ${STATUS_STYLE.improved.border}`, color:STATUS_STYLE.improved.color }}>Planned</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={onGenerate} style={{ width:"100%", padding:"15px", background:"linear-gradient(135deg,#00ff80,#00cc55)", border:"none", borderRadius:12, fontFamily:"'DM Sans'", fontSize:14, fontWeight:700, color:"#000", cursor:"pointer" }}>
            Generate Next Week's Plan
          </button>
        </div>
      )}
    </div>
  );
}

function GeneratingPhase({ progress, currentStep }) {
  const r = 44, c = 2*Math.PI*r;
  return (
    <div className="fu" style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 28px", position:"relative", zIndex:1 }}>
      <div style={{ position:"relative", width:100, height:100, marginBottom:28 }}>
        <svg width="100" height="100" style={{ position:"absolute" }}><circle cx="50" cy="50" r={r} fill="none" stroke="#141414" strokeWidth="5"/></svg>
        <svg width="100" height="100" style={{ position:"absolute", transform:"rotate(-90deg)" }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#00ff80" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c-(progress/100)*c} style={{ transition:"stroke-dashoffset .1s linear" }}/>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:22, color:"#00ff80", letterSpacing:1 }}>{Math.round(progress)}%</div>
      </div>
      <div style={{ fontFamily:"'Bebas Neue'", fontSize:30, letterSpacing:2, marginBottom:6, textAlign:"center" }}>Building Next Plan</div>
      <div style={{ fontSize:11, color:"#333", marginBottom:24, textAlign:"center" }}>Powered by AI</div>
      <div style={{ width:"100%", height:3, background:"#141414", borderRadius:3, marginBottom:24, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#00ff80,#00cc55)", borderRadius:3, transition:"width .1s linear" }}/>
      </div>
      <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:10 }}>
        {GEN_STEPS.map(({ label, threshold }, i) => {
          const done   = progress >= threshold;
          const active = !done && i === currentStep;
          return (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0, background: done?"rgba(0,255,128,0.14)":"#0e0e0e", border:`1px solid ${done?"rgba(0,255,128,0.35)":active?"#2a2a2a":"#141414"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color: done?"#00ff80":"#2a2a2a" }}>{done?"✓":""}</div>
              <div style={{ fontSize:12, fontWeight:500, color: done?"#444":active?"#d0d0d0":"#1e1e1e", transition:"color .3s" }}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReadyPhase({ router, currentWeek }) {
  return (
    <div className="fu" style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 24px", position:"relative", zIndex:1 }}>
      <div style={{ position:"relative", width:110, height:110, marginBottom:22 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,255,128,.14) 0%,transparent 70%)", animation:"glow 2s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", inset:10, borderRadius:"50%", background:"linear-gradient(135deg,rgba(0,255,128,.12),rgba(0,200,85,.04))", border:"1px solid rgba(0,255,128,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:28, color:"#00ff80", letterSpacing:1 }}>W{currentWeek + 1}</div>
      </div>
      <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:8 }}>PLAN READY</div>
      <div style={{ fontFamily:"'Bebas Neue'", fontSize:40, letterSpacing:2, textAlign:"center", lineHeight:1, marginBottom:8 }}>Week {currentWeek + 1} Is Live</div>
      <div style={{ fontSize:13, color:"#444", textAlign:"center", lineHeight:1.7, marginBottom:22 }}>Your plan has been updated. Stay consistent and keep pushing.</div>
      <button onClick={() => router.push("/dashboard")} style={{ width:"100%", padding:"15px", background:"linear-gradient(135deg,#00ff80,#00cc55)", border:"none", borderRadius:12, fontFamily:"'DM Sans'", fontSize:14, fontWeight:700, color:"#000", cursor:"pointer" }}>
        View New Plan
      </button>
    </div>
  );
}

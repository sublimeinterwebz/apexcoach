import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav, C } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan } from "../lib/firebase";

const F = "'Lexend', sans-serif";
const GEN_STEPS = [
  "Analyzing your week's performance",
  "Identifying progression opportunities",
  "Calculating new loads and volume",
  "Building nutrition targets",
  "Finalizing next week's plan",
];

export default function Review() {
  const router = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [plan,     setPlan]     = useState(null);
  const [phase,    setPhase]    = useState("review");
  const [page,     setPage]     = useState(0);
  const [progress, setProgress] = useState(0);
  const [genStep,  setGenStep]  = useState(0);
  const intervalRef = useRef(null);


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
    const thresholds = [20,42,63,82,100];
    const s = thresholds.findIndex(t => progress < t);
    setGenStep(s === -1 ? GEN_STEPS.length : s);
  }, [progress]);

  const exercises    = plan ? plan.weekPlan?.filter(d=>d.type==="workout").flatMap(d=>(d.exercises||d.blocks?.main||[]).map(e=>({...e,day:d.focus||d.sessionLabel}))) : [];
  const totalWorkouts= plan?.weekPlan?.filter(d=>d.type==="workout").length || 0;

  if (loading) return null;

  return (
    <Screen>
      {phase==="review"     && <ReviewPhase page={page} setPage={setPage} onGenerate={startGeneration} plan={plan} totalWorkouts={totalWorkouts} exercises={exercises} currentWeek={currentWeek} router={router} />}
      {phase==="generating" && <GeneratingPhase progress={progress} currentStep={genStep} />}
      {phase==="ready"      && <ReadyPhase router={router} currentWeek={currentWeek} />}
      {phase==="review"     && <BottomNav active="review" router={router} />}
    </Screen>
  );
}

function ReviewPhase({ page, setPage, onGenerate, plan, totalWorkouts, exercises, currentWeek, router }) {
  const stats = [
    {label:"EXERCISES", value:exercises.length, color:C.accent},
    {label:"SESSIONS",  value:totalWorkouts,    color:"#00cfff"},
    {label:"WEEK",      value:currentWeek,      color:"#ffaa00"},
  ];
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"52px 20px 90px",position:"relative",zIndex:1}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,color:C.muted,letterSpacing:3,fontWeight:600,marginBottom:6}}>WEEK {currentWeek}</div>
        <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5}}>WEEKLY <span style={{color:C.accent}}>REVIEW</span></div>
      </div>

      {/* Tab pills */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["Overview","Exercises"].map((label,i)=>(
          <button key={i} onClick={()=>setPage(i)} style={{padding:"9px 20px",borderRadius:20,fontSize:13,fontWeight:700,background:page===i?C.accent:C.bgCard,border:`1.5px solid ${page===i?C.accent:C.border}`,color:page===i?"#0a0a0a":C.muted,cursor:"pointer",fontFamily:F}}>
            {label}
          </button>
        ))}
      </div>

      {page===0 ? (
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
          {/* Stats row */}
          <div style={{display:"flex",gap:10}}>
            {stats.map(({label,value,color})=>(
              <div key={label} style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 10px",textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:900,color,letterSpacing:-0.5}}>{value}</div>
                <div style={{fontSize:9,color:C.muted,letterSpacing:2,fontWeight:700,marginTop:4}}>{label}</div>
              </div>
            ))}
          </div>
          {/* Coach note */}
          <div style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,borderRadius:16,padding:"16px"}}>
            <div style={{fontSize:10,color:C.accent,letterSpacing:2.5,fontWeight:700,marginBottom:10}}>PLAN SUMMARY</div>
            {plan ? (
              <>
                <p style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:plan.progression?12:0}}>{plan.coachNote||"Stay consistent and track your workouts."}</p>
                {plan.progression?.strategy && (
                  <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                    <div style={{fontSize:10,color:C.dim,letterSpacing:2,fontWeight:700,marginBottom:6}}>PROGRESSION</div>
                    <p style={{fontSize:13,color:C.dim,lineHeight:1.65}}>{plan.progression.strategy}</p>
                  </div>
                )}
              </>
            ) : (
              <p style={{fontSize:13,color:C.dim,lineHeight:1.7}}>Generate your plan from the dashboard.</p>
            )}
          </div>
          <button onClick={()=>setPage(1)} style={{padding:"14px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,fontFamily:F,fontSize:13,fontWeight:700,color:C.muted,cursor:"pointer"}}>
            See Exercise Breakdown →
          </button>
        </div>
      ) : (
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
          <div style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px",overflowY:"auto"}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:14}}>EXERCISE BREAKDOWN</div>
            {exercises.length===0 ? (
              <div style={{fontSize:13,color:C.dim,textAlign:"center",padding:"24px 0"}}>No plan generated yet</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {exercises.map(({name,sets,reps,day},i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"10px 0",borderBottom:i<exercises.length-1?`1px solid ${C.border}`:"none"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}</div>
                      <div style={{fontSize:11,color:C.dim,marginTop:2}}>{sets} sets · {reps} reps · {day}</div>
                    </div>
                    <div style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:C.accentDim,border:`1px solid ${C.accentBorder}`,color:C.accent,flexShrink:0}}>Planned</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={onGenerate} style={{padding:"16px",background:C.accent,border:"none",borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,color:"#0a0a0a",cursor:"pointer",letterSpacing:0.5}}>
            GENERATE NEXT WEEK
          </button>
        </div>
      )}
    </div>
  );
}

function GeneratingPhase({ progress, currentStep }) {
  const r = 46, circ = 2*Math.PI*r;
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 28px",position:"relative",zIndex:1}}>
      <div style={{position:"relative",width:110,height:110,marginBottom:32}}>
        <svg width="110" height="110" style={{position:"absolute",transform:"rotate(-90deg)"}}>
          <circle cx="55" cy="55" r={r} fill="none" stroke={C.border} strokeWidth="5"/>
          <circle cx="55" cy="55" r={r} fill="none" stroke={C.accent} strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ-(progress/100)*circ} style={{transition:"stroke-dashoffset .1s linear"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:C.accent}}>{Math.round(progress)}%</div>
      </div>
      <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5,marginBottom:8,textAlign:"center"}}>BUILDING NEXT PLAN</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:28,textAlign:"center"}}>AI is analyzing your performance</div>
      <div style={{width:"100%",height:3,background:C.border,borderRadius:3,marginBottom:28,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${progress}%`,background:C.accent,borderRadius:3,transition:"width .1s linear"}}/>
      </div>
      <div style={{width:"100%",display:"flex",flexDirection:"column",gap:12}}>
        {GEN_STEPS.map((label,i)=>{
          const thresholds=[20,42,63,82,100];
          const done=progress>=thresholds[i], active=!done&&i===currentStep;
          return (
            <div key={label} style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,background:done?C.accent:active?C.accentDim:C.bgCard,border:`1.5px solid ${done?C.accent:active?C.accentBorder:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:done?"#0a0a0a":C.dim,transition:"all .3s"}}>{done?"✓":""}</div>
              <div style={{fontSize:13,fontWeight:done?500:active?600:400,color:done?C.muted:active?C.text:C.dim,transition:"color .3s"}}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReadyPhase({ router, currentWeek }) {
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",position:"relative",zIndex:1}}>
      <div style={{width:100,height:100,borderRadius:"50%",background:C.accentDim,border:`2px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:900,color:C.accent,letterSpacing:-1,marginBottom:24}}>W{currentWeek+1}</div>
      <div style={{fontSize:11,color:C.accent,letterSpacing:3,fontWeight:700,marginBottom:10}}>PLAN READY</div>
      <div style={{fontSize:36,fontWeight:900,color:C.white,textAlign:"center",lineHeight:1,letterSpacing:-1,marginBottom:12}}>WEEK {currentWeek+1}<br/>IS LIVE</div>
      <div style={{fontSize:14,color:C.muted,textAlign:"center",lineHeight:1.7,marginBottom:32}}>Your updated plan is ready. Stay consistent.</div>
      <button onClick={()=>router.push("/dashboard")} style={{width:"100%",padding:"16px",background:C.accent,border:"none",borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,color:"#0a0a0a",cursor:"pointer",letterSpacing:0.5}}>VIEW NEW PLAN</button>
    </div>
  );
}

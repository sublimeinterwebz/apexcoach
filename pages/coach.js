import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav, C } from "../components/shared";
import { FAB, Icon } from "../components/ui";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan, getWeekLogs, getWeekFeedback, saveWeekPlan } from "../lib/firebase";

const F = "'Lexend', sans-serif";
const GEN_STEPS = [
  "Reading your workout history",
  "Analyzing performance & feedback",
  "Calculating progressive overload",
  "Personalizing nutrition targets",
  "Finalizing next week's plan",
];

export default function Coach() {
  const router = useRouter();
  const { user, profile, setProfile, loading } = useRequireAuth();
  const [plan,       setPlan]       = useState(null);
  const [logs,       setLogs]       = useState([]);   // array of 7, null where no log
  const [feedback,   setFeedback]   = useState(null);
  const [dataLoading,setDataLoading]= useState(true);
  const [phase,      setPhase]      = useState("review");
  const [page,       setPage]       = useState(0);
  const [progress,   setProgress]   = useState(0);
  const [genStep,    setGenStep]    = useState(0);
  const intervalRef  = useRef(null);

  const currentWeek = profile?.currentWeek || 1;

  useEffect(() => {
    if (!user) return;
    async function load() {
      setDataLoading(true);
      try {
        const [planData, logsData, feedbackData] = await Promise.all([
          profile?.plan?.weekPlan ? Promise.resolve(profile.plan) : getWeekPlan(user.uid, currentWeek),
          getWeekLogs(user.uid, currentWeek),
          getWeekFeedback(user.uid, currentWeek),
        ]);
        if (planData) setPlan(planData);
        setLogs(logsData || []);
        setFeedback(feedbackData);
      } catch(e) { console.error(e); }
      setDataLoading(false);
    }
    load();
  }, [user]);

  if (loading) return null;

  // ── Derived stats from real logs ─────────────────────
  const completedLogs    = logs.filter(Boolean);
  const plannedWorkouts  = plan?.weekPlan?.filter(d=>d.type==="workout").length || 0;
  const completedWorkouts= completedLogs.length;
  const consistency      = plannedWorkouts > 0 ? Math.round((completedWorkouts/plannedWorkouts)*100) : 0;
  const totalVolume      = completedLogs.reduce((a,log)=>a+(log.totalVolume||0), 0);
  const totalSets        = completedLogs.reduce((a,log)=>a+(log.totalSets||0), 0);

  // ── Generate next week ───────────────────────────────
  const startGeneration = async () => {
    setPhase("generating"); setProgress(0); setGenStep(0);

    // Build feedback summary for Gemini
    const feedbackSummary = feedback ? {
      difficulty:        feedback.difficulty,
      energy:            feedback.energy,
      completedWorkouts: completedWorkouts,
      plannedWorkouts,
    } : null;

    // Build last week plan summary (just session names + types)
    const lastWeekSummary = plan?.weekPlan?.map(d=>({
      day:   d.dayName || d.day,
      type:  d.type,
      focus: d.focus  || d.sessionLabel,
    }));

    // Animate progress
    intervalRef.current = setInterval(()=>{
      setProgress(p=>{
        if (p>=100){ clearInterval(intervalRef.current); return 100; }
        return p+1.4;
      });
    }, 50);

    try {
      // Pull current week's user edits to pass to Gemini so they persist as preferences
      const currentWeekPlan = plan || await getWeekPlan(user.uid, currentWeek);
      const lastWeekEdits   = currentWeekPlan?.edits || [];

      const r = await fetch("/api/generate-plan", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          ...profile,
          currentWeek: currentWeek + 1,
          lastWeekPlan: JSON.stringify(lastWeekSummary),
          lastWeekFeedback: feedbackSummary,
          lastWeekEdits,
        }),
      });
      const newPlan = await r.json();
      if (!newPlan.error && user) {
        await saveWeekPlan(user.uid, currentWeek + 1, newPlan);
        // Update profile week counter
        const { saveUserProfile } = await import("../lib/firebase");
        const updatedProfile = { ...profile, currentWeek: currentWeek + 1, plan: newPlan };
        await saveUserProfile(user.uid, updatedProfile);
        try { localStorage.setItem(`apex_profile_${user.uid}`, JSON.stringify(updatedProfile)); } catch {}
        setProfile(updatedProfile);
      }
    } catch(e) { console.error("Plan gen error:", e); }

    clearInterval(intervalRef.current);
    setProgress(100);
    setTimeout(()=>setPhase("ready"), 600);
  };

  useEffect(()=>(()=>clearInterval(intervalRef.current)), []);
  useEffect(()=>{
    const thresholds=[20,42,63,82,100];
    const s=thresholds.findIndex(t=>progress<t);
    setGenStep(s===-1?GEN_STEPS.length:s);
  }, [progress]);

  const allExercises = plan?.weekPlan?.filter(d=>d.type==="workout")
    .flatMap(d=>(d.blocks?.main||d.exercises||[]).map(e=>({...e,day:d.focus||d.sessionLabel}))) || [];

  return (
    <Screen>
      {phase==="review"     && <ReviewPhase page={page} setPage={setPage} onGenerate={startGeneration} plan={plan} logs={logs} completedLogs={completedLogs} plannedWorkouts={plannedWorkouts} completedWorkouts={completedWorkouts} consistency={consistency} totalVolume={totalVolume} totalSets={totalSets} feedback={feedback} allExercises={allExercises} currentWeek={currentWeek} dataLoading={dataLoading} />}
      {phase==="generating" && <GeneratingPhase progress={progress} currentStep={genStep} />}
      {phase==="ready"      && <ReadyPhase router={router} currentWeek={currentWeek} />}
      {phase==="review"     && (
        <>
          <FAB
            icon={<Icon name="chat" size={20} color="#0a0a0a"/>}
            onClick={() => router.push("/chat")}
            offsetBottom={88}
            position="bottom-right"
          />
          <BottomNav active="coach" router={router} />
        </>
      )}
    </Screen>
  );
}

// ── Review Phase ───────────────────────────────────────
function ReviewPhase({ page, setPage, onGenerate, plan, logs, completedLogs, plannedWorkouts, completedWorkouts, consistency, totalVolume, totalSets, feedback, allExercises, currentWeek, dataLoading }) {

  const feedbackColor = {
    easy:"#00cfff", good:C.accent, hard:"#ff5e8a",
  };
  const energyColor = {
    low:"#ff5e8a", normal:"#ffaa00", high:C.accent,
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"52px 20px 140px",position:"relative",zIndex:1}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,color:C.muted,letterSpacing:3,fontWeight:600,marginBottom:6}}>WEEK {currentWeek}</div>
        <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5}}>WEEKLY <span style={{color:C.accent}}>REVIEW</span></div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["Overview","Sessions","Exercises"].map((label,i)=>(
          <button key={i} onClick={()=>setPage(i)} style={{padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:700,background:page===i?C.accent:C.bgCard,border:`1.5px solid ${page===i?C.accent:C.border}`,color:page===i?"#0a0a0a":C.muted,cursor:"pointer",fontFamily:F}}>
            {label}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          <div style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${C.border}`,borderTopColor:C.accent,animation:"spin 0.9s linear infinite"}}/>
        </div>
      ) : page===0 ? (

        // ── Overview ────────────────────────────────────
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
          {/* Stats */}
          <div style={{display:"flex",gap:10}}>
            {[
              {label:"SESSIONS",  value:`${completedWorkouts}/${plannedWorkouts}`, color:C.accent},
              {label:"CONSISTENCY",value:`${consistency}%`,                        color:consistency>=80?C.accent:consistency>=50?"#ffaa00":"#ff5e8a"},
              {label:"VOLUME",    value:`${Math.round(totalVolume/1000*10)/10}k`,  color:"#00cfff", unit:"kg"},
            ].map(({label,value,color,unit})=>(
              <div key={label} style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 10px",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:900,color,letterSpacing:-0.5}}>{value}<span style={{fontSize:10,color:C.dim,fontWeight:400}}>{unit||""}</span></div>
                <div style={{fontSize:9,color:C.muted,letterSpacing:2,fontWeight:700,marginTop:4}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Feedback summary */}
          {feedback ? (
            <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,borderRadius:16,padding:"16px"}}>
              <div style={{fontSize:10,color:C.accent,letterSpacing:2.5,fontWeight:700,marginBottom:12}}>YOUR FEEDBACK</div>
              <div style={{display:"flex",gap:10}}>
                <div style={{flex:1,background:C.bgDeep,borderRadius:12,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.muted,letterSpacing:1.5,fontWeight:600,marginBottom:6}}>DIFFICULTY</div>
                  <div style={{fontSize:14,fontWeight:800,color:feedbackColor[feedback.difficulty]||C.text,textTransform:"uppercase"}}>{feedback.difficulty||"—"}</div>
                </div>
                <div style={{flex:1,background:C.bgDeep,borderRadius:12,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.muted,letterSpacing:1.5,fontWeight:600,marginBottom:6}}>ENERGY</div>
                  <div style={{fontSize:14,fontWeight:800,color:energyColor[feedback.energy]||C.text,textTransform:"uppercase"}}>{feedback.energy||"—"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px",textAlign:"center"}}>
              <div style={{fontSize:13,color:C.dim}}>No feedback yet this week.<br/>Complete a workout to leave feedback.</div>
            </div>
          )}

          {/* Coach note */}
          {plan?.coachNote && (
            <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px",flex:1}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:10}}>COACH NOTE</div>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.7}}>{plan.coachNote}</p>
              {plan.progression?.nextWeekFocus && (
                <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                  <div style={{fontSize:10,color:C.dim,letterSpacing:2,fontWeight:700,marginBottom:6}}>NEXT WEEK FOCUS</div>
                  <p style={{fontSize:12,color:C.dim,lineHeight:1.65}}>{plan.progression.nextWeekFocus}</p>
                </div>
              )}
            </div>
          )}

          <button onClick={onGenerate} style={{padding:"16px",background:C.accent,border:"none",borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,color:"#0a0a0a",cursor:"pointer",letterSpacing:0.5}}>
            GENERATE WEEK {currentWeek+1}
          </button>
        </div>

      ) : page===1 ? (

        // ── Sessions ────────────────────────────────────
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px",overflowY:"auto"}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:14}}>SESSION LOG</div>
            {plan?.weekPlan?.map((day,i)=>{
              const log = logs[i];
              const isWorkout = day.type==="workout"||day.type==="hypertrophy"||day.type==="conditioning";
              const completed = !!log;
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<6?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:completed?C.accentDim:C.bgDeep,border:`1.5px solid ${completed?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                    {completed?"✓":isWorkout?"○":"—"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:completed?C.text:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{day.focus||day.sessionLabel||day.dayName}</div>
                    {completed && log.totalVolume>0 ? (
                      <div style={{fontSize:11,color:C.dim,marginTop:2}}>{log.totalSets} sets · {log.totalVolume.toLocaleString()}kg · {Math.floor((log.durationSecs||0)/60)}min</div>
                    ) : (
                      <div style={{fontSize:11,color:C.dim,marginTop:2}}>{isWorkout?"Not completed":day.type}</div>
                    )}
                  </div>
                  <div style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,flexShrink:0,
                    background:completed?C.accentDim:C.bgDeep,
                    border:`1px solid ${completed?C.accentBorder:C.border}`,
                    color:completed?C.accent:C.dim,
                  }}>{completed?"DONE":isWorkout?"MISSED":"REST"}</div>
                </div>
              );
            })}
          </div>
        </div>

      ) : (

        // ── Exercises ───────────────────────────────────
        <div style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px",overflowY:"auto"}}>
          <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:14}}>PLANNED EXERCISES</div>
          {allExercises.length===0 ? (
            <div style={{fontSize:13,color:C.dim,textAlign:"center",padding:"24px 0"}}>No plan generated yet</div>
          ) : allExercises.map(({name,sets,reps,day},i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"10px 0",borderBottom:i<allExercises.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}</div>
                <div style={{fontSize:11,color:C.dim,marginTop:2}}>{sets} sets · {reps} reps · {day}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Generating Phase ───────────────────────────────────
function GeneratingPhase({ progress, currentStep }) {
  const r=46, circ=2*Math.PI*r;
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 28px",position:"relative",zIndex:1}}>
      <div style={{position:"relative",width:110,height:110,marginBottom:32}}>
        <svg width="110" height="110" style={{position:"absolute",transform:"rotate(-90deg)"}}>
          <circle cx="55" cy="55" r={r} fill="none" stroke={C.border} strokeWidth="5"/>
          <circle cx="55" cy="55" r={r} fill="none" stroke={C.accent} strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ-(progress/100)*circ} style={{transition:"stroke-dashoffset .1s linear"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:C.accent}}>{Math.round(progress)}%</div>
      </div>
      <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5,marginBottom:8,textAlign:"center"}}>BUILDING WEEK {currentStep+1}</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:28,textAlign:"center"}}>AI is adapting your program</div>
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
              <div style={{fontSize:13,fontWeight:done?500:active?700:400,color:done?C.muted:active?C.white:C.dim,transition:"color .3s"}}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Ready Phase ────────────────────────────────────────
function ReadyPhase({ router, currentWeek }) {
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",position:"relative",zIndex:1}}>
      <div style={{width:100,height:100,borderRadius:"50%",background:C.accentDim,border:`2px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:C.accent,letterSpacing:-1,marginBottom:24}}>W{currentWeek+1}</div>
      <div style={{fontSize:11,color:C.accent,letterSpacing:3,fontWeight:700,marginBottom:10}}>PLAN READY</div>
      <div style={{fontSize:36,fontWeight:900,color:C.white,textAlign:"center",lineHeight:1,letterSpacing:-1,marginBottom:12}}>WEEK {currentWeek+1}<br/>IS LIVE</div>
      <div style={{fontSize:14,color:C.muted,textAlign:"center",lineHeight:1.7,marginBottom:32}}>Your plan has been updated based on your performance and feedback.</div>
      <button onClick={()=>router.push("/dashboard")} style={{width:"100%",padding:"16px",background:C.accent,border:"none",borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,color:"#0a0a0a",cursor:"pointer",letterSpacing:0.5}}>VIEW NEW PLAN</button>
    </div>
  );
}

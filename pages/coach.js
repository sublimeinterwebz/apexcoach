import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav, C } from "../components/shared";
import { FAB, Icon, Card, Chip, Button, SectionLabel, StatCell, BuildingPhase } from "../components/ui";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan, getWeekLogs, getWeekFeedback, saveWeekPlan } from "../lib/firebase";
import { buildDaySlots } from "../lib/dayMapping";

const F = "var(--font-lexend), sans-serif";
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
  const intervalRef  = useRef(null);

  const currentWeek = profile?.currentWeek || 1;

  useEffect(() => {
    if (!user) return;
    async function load() {
      setDataLoading(true);
      try {
        // Fast render from profile cache (may be missing generatedAt on older plans)
        if (profile?.plan?.weekPlan) setPlan(profile.plan);
        // Source of truth from Firestore — has generatedAt via serverTimestamp()
        const [freshPlan, logsData, feedbackData] = await Promise.all([
          getWeekPlan(user.uid, currentWeek),
          getWeekLogs(user.uid, currentWeek),
          getWeekFeedback(user.uid, currentWeek),
        ]);
        if (freshPlan) setPlan(freshPlan);
        setLogs(logsData || []);
        setFeedback(feedbackData);
      } catch(e) { console.error(e); }
      setDataLoading(false);
    }
    load();
  }, [user]);

  if (loading) return null;

  // Normalize generatedAt from Firestore Timestamp | ISO string | serialized {seconds,nanoseconds}
  const planGeneratedDate = (() => {
    const g = plan?.generatedAt;
    if (!g) return null;
    if (typeof g === "string") return new Date(g);
    if (typeof g.toDate === "function") return g.toDate();
    if (typeof g.seconds === "number") return new Date(g.seconds * 1000);
    return null;
  })();

  // Egypt week starts Sunday. Generate button is only active on Sunday
  // AND only if the current plan wasn't generated today (prevents same-Sunday re-triggering).
  const isSunday = new Date().getDay() === 0;
  const planGeneratedToday = planGeneratedDate
    ? planGeneratedDate.toDateString() === new Date().toDateString()
    : false;
  const canGenerate = isSunday && !planGeneratedToday;

  // Day-name → JS day number (0=Sun...6=Sat)
  const DAY_NAME_JS = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };
  const todayJS = new Date().getDay();

  // ── Derived stats from real logs ─────────────────────
  const REST_TYPES = new Set(["rest","recovery","active recovery"]);
  const completedLogs    = logs.filter(Boolean);
  const plannedWorkouts  = plan?.weekPlan?.filter(d => !REST_TYPES.has((d.type||"").toLowerCase())).length || 0;
  const completedWorkouts= completedLogs.length;
  const consistency      = plannedWorkouts > 0 ? Math.round((completedWorkouts/plannedWorkouts)*100) : 0;
  const totalVolume      = completedLogs.reduce((a,log)=>a+(log.totalVolume||0), 0);
  const totalSets        = completedLogs.reduce((a,log)=>a+(log.totalSets||0), 0);

  // ── Generate next week ───────────────────────────────
  const startGeneration = async () => {
    setPhase("generating"); setProgress(0);

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
      // Safe-parse: on 504 or HTML error page, r.json() would throw
      // "Unexpected token 'A'..." — catch and surface a readable error.
      let newPlan;
      if (!r.ok) {
        newPlan = { error: r.status === 504
          ? "The AI took too long to respond. Please try again."
          : `Something went wrong (${r.status}). Please try again.` };
      } else {
        try { newPlan = await r.json(); }
        catch { newPlan = { error: "The server returned an invalid response. Please try again." }; }
      }
      if (!newPlan.error && user) {
        await saveWeekPlan(user.uid, currentWeek + 1, newPlan);
        // Update profile week counter
        const { saveUserProfile } = await import("../lib/firebase");
        const updatedProfile = { ...profile, currentWeek: currentWeek + 1, plan: { ...newPlan, generatedAt: new Date().toISOString() } };
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

  return (
    <Screen>
      {phase==="review"     && <ReviewPhase page={page} setPage={setPage} onGenerate={startGeneration} plan={plan} logs={logs} completedLogs={completedLogs} plannedWorkouts={plannedWorkouts} completedWorkouts={completedWorkouts} consistency={consistency} totalVolume={totalVolume} totalSets={totalSets} feedback={feedback} currentWeek={currentWeek} dataLoading={dataLoading} isSunday={canGenerate} todayJS={todayJS} DAY_NAME_JS={DAY_NAME_JS} />}
      {phase==="generating" && (
        <BuildingPhase
          title={`BUILDING WEEK ${currentWeek + 1}`}
          subtitle="AI is adapting your program"
          steps={GEN_STEPS}
          progress={progress}
        />
      )}
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
function ReviewPhase({ page, setPage, onGenerate, plan, logs, completedLogs, plannedWorkouts, completedWorkouts, consistency, totalVolume, totalSets, feedback, currentWeek, dataLoading, isSunday, todayJS, DAY_NAME_JS }) {

  const feedbackColor = { easy:"#00cfff", good:C.accent, hard:"#ff5e8a" };
  const energyColor   = { low:"#ff5e8a",  normal:"#ffaa00", high:C.accent };

  // Determine status of each planned day
  const getDayStatus = (day, log) => {
    if (log) return "done";
    const type = (day.type||"").toLowerCase();
    if (type === "rest" || type === "recovery" || type === "active recovery") return "rest";
    // Compare day name to today
    const dayJS = DAY_NAME_JS[day.dayName];
    if (dayJS === undefined) return "upcoming"; // can't determine, assume upcoming
    if (dayJS === todayJS) return "today";
    // In Egypt week (Sun=0), a day is "past" if its JS day < today, but wrap around:
    // Week runs Sun→Sat (0→6). If dayJS < todayJS it's already passed this week.
    if (dayJS < todayJS) return "missed";
    return "upcoming";
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"52px 20px 140px",position:"relative",zIndex:1}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,color:C.muted,letterSpacing:3,fontWeight:600,marginBottom:6}}>WEEK {currentWeek}</div>
        <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5}}>WEEKLY <span style={{color:C.accent}}>REVIEW</span></div>
      </div>

      {/* 2 tabs only */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["Overview","Sessions"].map((label,i)=>(
          <Chip key={i} label={label} active={page===i} onClick={()=>setPage(i)} />
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
          <div style={{display:"flex",gap:8}}>
            <StatCell label="Sessions"    value={`${completedWorkouts}/${plannedWorkouts}`} color={C.accent} size="lg" />
            <StatCell label="Consistency" value={`${consistency}%`} color={consistency>=80?C.accent:consistency>=50?"#ffaa00":"#ff5e8a"} size="lg" />
            <StatCell label="Volume"      value={totalVolume>=1000?`${Math.round(totalVolume/100)/10}k`:(totalVolume||"0")} color="#00cfff" size="lg" />
          </div>

          {feedback ? (
            <Card padding="md" style={{borderLeft:`3px solid ${C.accent}`}}>
              <SectionLabel color={C.accent} style={{marginBottom:12}}>YOUR FEEDBACK</SectionLabel>
              <div style={{display:"flex",gap:10}}>
                <StatCell label="Difficulty" value={(feedback.difficulty||"—").toUpperCase()} color={feedbackColor[feedback.difficulty]||C.text} size="md" />
                <StatCell label="Energy"     value={(feedback.energy||"—").toUpperCase()}     color={energyColor[feedback.energy]||C.text}     size="md" />
              </div>
            </Card>
          ) : (
            <Card padding="md" style={{textAlign:"center"}}>
              <div style={{fontSize:13,color:C.dim,lineHeight:1.6}}>No feedback yet this week.<br/>Complete a workout to leave feedback.</div>
            </Card>
          )}

          {plan?.coachNote && (
            <Card padding="md" style={{flex:1}}>
              <SectionLabel style={{marginBottom:10}}>COACH NOTE</SectionLabel>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.7,margin:0}}>{plan.coachNote}</p>
              {plan.progression?.nextWeekFocus && (
                <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                  <SectionLabel size="sm" color={C.dim} style={{marginBottom:6}}>NEXT WEEK FOCUS</SectionLabel>
                  <p style={{fontSize:12,color:C.dim,lineHeight:1.65,margin:0}}>{plan.progression.nextWeekFocus}</p>
                </div>
              )}
            </Card>
          )}

          {/* Generate button — only active on Sunday */}
          {isSunday ? (
            <Button variant="primary" size="lg" onClick={onGenerate}>
              GENERATE WEEK {currentWeek+1}
            </Button>
          ) : (
            <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:4}}>NEXT PLAN AVAILABLE SUNDAY</div>
              <div style={{fontSize:11,color:C.dim,lineHeight:1.5}}>New plans generate at the start of each week. Come back on Sunday to generate Week {currentWeek+1}.</div>
            </div>
          )}
        </div>

      ) : (
        // ── Sessions ────────────────────────────────────
        <Card padding="md" style={{flex:1,overflowY:"auto"}}>
          <SectionLabel style={{marginBottom:14}}>SESSION LOG</SectionLabel>
          {(() => {
            // Render in Sun→Sat order using shared slot helper so display matches the rest of the app.
            const slots = buildDaySlots(plan?.weekPlan || []);
            return slots.map((day, i) => {
              if (!day) return null;
              const log = logs[i];
              const status = getDayStatus(day, log);
              const statusMeta = {
                done:     { label:"DONE",     bg:C.accentDim,                  border:C.accentBorder,        color:C.accent },
                today:    { label:"TODAY",    bg:"rgba(196,255,0,0.2)",        border:C.accentBorder,        color:C.accent },
                upcoming: { label:"UPCOMING", bg:"rgba(0,207,255,0.12)",       border:"rgba(0,207,255,0.35)",color:"#00cfff" },
                missed:   { label:"MISSED",   bg:"rgba(255,94,138,0.12)",      border:"rgba(255,94,138,0.35)",color:"#ff5e8a" },
                rest:     { label:"REST",     bg:C.bgDeep,                     border:C.border,              color:C.dim },
              };
              const sm = statusMeta[status] || statusMeta.upcoming;
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<6?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:status==="done"?C.accentDim:C.bgDeep,border:`1.5px solid ${status==="done"?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,color:status==="done"?C.accent:C.dim}}>
                    {status==="done"?"✓":status==="rest"?"—":"○"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:status==="done"?C.text:status==="upcoming"||status==="today"?C.text:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{day.focus||day.sessionLabel||day.dayName}</div>
                    {status==="done" && log?.totalVolume>0 ? (
                      <div style={{fontSize:11,color:C.dim,marginTop:2}}>{log.totalSets} sets · {log.totalVolume.toLocaleString()}kg · {Math.floor((log.durationSecs||0)/60)}min</div>
                    ) : (
                      <div style={{fontSize:11,color:C.dim,marginTop:2}}>{day.dayName}{day.estimatedDuration?` · ${day.estimatedDuration}`:""}</div>
                    )}
                  </div>
                  <div style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,flexShrink:0,background:sm.bg,border:`1px solid ${sm.border}`,color:sm.color}}>
                    {sm.label}
                  </div>
                </div>
              );
            });
          })()}
        </Card>
      )}
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

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav, C } from "../components/shared";
import { Card, StatCell, SectionLabel, F, FW } from "../components/ui";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan, getWorkoutLog } from "../lib/firebase";

const DAY_SHORT = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const TYPE_COLOR = {
  strength:     C.accent,
  hypertrophy:  "#00cfff",
  conditioning: "#ffaa00",
  recovery:     "#aa88ff",
  rest:         C.dim,
};

function getWeekDates() {
  const today = new Date();
  const dow   = today.getDay();
  const mon   = new Date(today);
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.getDate();
  });
}

function greetingTag() {
  const h = new Date().getHours();
  if (h < 12) return "READY FOR THE APEX?";
  if (h < 17) return "KEEP PUSHING TODAY";
  return "EVENING GRIND";
}

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING,";
  if (h < 17) return "GOOD AFTERNOON,";
  return "GOOD EVENING,";
}

export default function Dashboard() {
  const router  = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [plan,        setPlan]        = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [selectedDay,    setSelectedDay]    = useState(TODAY_IDX);
  const [completedToday, setCompletedToday] = useState(false);
  const [dismissedSundayBanner, setDismissedSundayBanner] = useState(false);

  // ALL hooks must be BEFORE any early return (Rules of Hooks)
  useEffect(() => {
    if (!user) return;
    const wk = profile?.currentWeek || 1;
    async function load() {
      setPlanLoading(true);
      try {
        if (profile?.plan?.weekPlan) { setPlan(profile.plan); setPlanLoading(false); return; }
        const p = await getWeekPlan(user.uid, wk);
        setPlan(p);
      } catch(e) { console.error(e); }
      setPlanLoading(false);
    }
    load();
  }, [user, profile?.currentWeek]);

  if (loading) return null;

  const firstName   = profile?.displayName?.split(" ")[0] || user?.displayName?.split(" ")[0] || "Athlete";
  const userInitial = firstName[0]?.toUpperCase() || "A";
  const currentWeek = profile?.currentWeek || 1;
  const weekDates   = getWeekDates();

  const weekPlan = plan?.weekPlan || [];
  const dayData  = weekPlan[selectedDay] || null;

  // Nutrition — resilient to schema variations
  const nutrition = plan?.nutrition || null;
  const macros    = nutrition?.macros || null;

  // Today's calories may come from: mealPlans[today].totalCalories, mealPlans[today].meals totals,
  // or the top-level dailyCalories. Fall back through these in order.
  const todayMealPlan = nutrition?.mealPlans?.[selectedDay] || null;
  const todayCalories = todayMealPlan?.totalCalories
    || todayMealPlan?.meals?.reduce((s, m) => s + (m.calories || 0), 0)
    || nutrition?.dailyCalories
    || nutrition?.calories
    || null;
  const calories = todayCalories;

  const todayExCount = dayData?.blocks
    ? Object.values(dayData.blocks).flat().filter(e => !e.isHeader).length
    : (dayData?.exercises?.length || 0);

  const mainCount = dayData?.blocks
    ? Object.values(dayData.blocks).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    : (dayData?.exercises?.length || 0);

  // Sunday = new week in Egypt. Show generate banner if it's Sunday and user has a plan.
  const isSunday = new Date().getDay() === 0;
  const showSundayBanner = isSunday && !!plan && !dismissedSundayBanner;

  return (
    <Screen>
      <div style={{ flex:1, display:"flex", flexDirection:"column", position:"relative", zIndex:1 }}>

        {/* ── SUNDAY NEW WEEK BANNER ── */}
        {showSundayBanner && (
          <div style={{
            margin:"52px 20px 0",
            background:"linear-gradient(135deg, rgba(196,255,0,0.12) 0%, rgba(196,255,0,0.05) 100%)",
            border:`1.5px solid ${C.accentBorder}`,
            borderRadius:18, padding:"16px 18px",
          }}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:C.accent,letterSpacing:2.5,fontWeight:700,marginBottom:6}}>NEW WEEK</div>
                <div style={{fontSize:16,fontWeight:900,color:C.white,marginBottom:6}}>Time to build Week {currentWeek+1}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.5,marginBottom:14}}>Your AI coach is ready to generate next week's personalised plan based on your progress.</div>
                <button
                  onClick={() => router.push("/coach")}
                  style={{background:C.accent,border:"none",borderRadius:10,padding:"10px 18px",fontFamily:F,fontSize:12,fontWeight:800,color:"#0a0a0a",cursor:"pointer",letterSpacing:0.5}}
                >
                  GENERATE WEEK {currentWeek+1} →
                </button>
              </div>
              <button
                onClick={() => setDismissedSundayBanner(true)}
                style={{background:"none",border:"none",cursor:"pointer",color:C.dim,padding:4,flexShrink:0}}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* ── TOP BAR ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding: showSundayBanner ? "16px 20px 0" : "52px 20px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => router.push("/profile")} style={{
              width:40, height:40, borderRadius:"50%",
              background: C.bgCard, border:`1.5px solid ${C.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20"/>
              </svg>
            </button>
            <span style={{ fontFamily:F, fontWeight:800, fontSize:13, color:C.accent, letterSpacing:3, fontWeight:700, fontStyle:"italic" }}>APEXCOACH</span>
          </div>
          <button style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round">
              <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"/>
              <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"/>
            </svg>
          </button>
        </div>

        {/* ── GREETING ── */}
        <div style={{ padding:"24px 20px 0" }}>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:3, fontWeight:600, marginBottom:6 }}>{greetingTag()}</div>
          <div style={{ fontSize:32, fontWeight:800, color:C.white, lineHeight:1.1, letterSpacing:-0.5 }}>
            {greetingWord()}<br />{firstName.toUpperCase()}
          </div>
        </div>

        {/* ── DAY STRIP ── */}
        <div style={{ padding:"28px 20px 0", display:"flex", gap:8 }}>
          {DAY_SHORT.map((d, i) => {
            const day      = weekPlan[i];
            const isSelected = i === selectedDay;
            const isToday  = i === TODAY_IDX;
            const isRest   = !day || day.type === "rest" || day.type === "recovery";
            const typeColor= day ? (TYPE_COLOR[day.type] || C.accent) : C.dim;
            return (
              <button key={i} onClick={() => setSelectedDay(i)} style={{
                flex:1, padding:"10px 0 8px", borderRadius:20,
                display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                background: isSelected ? C.accent : C.bgCard,
                border: `1.5px solid ${isSelected ? C.accent : C.border}`,
                cursor:"pointer", transition:"all 0.18s",
              }}>
                <span style={{ fontSize:9, letterSpacing:1, fontWeight:700, color: isSelected?"#0a0a0a":C.muted }}>{d}</span>
                <span style={{ fontSize:18, fontWeight:800, color: isSelected?"#0a0a0a":C.text, lineHeight:1 }}>{weekDates[i]}</span>
                <div style={{ width:5, height:5, borderRadius:"50%", background: isSelected?"rgba(0,0,0,0.35)": isRest?C.border:typeColor }}/>
              </button>
            );
          })}
        </div>

        {/* ── MAIN CARD ── */}
        <div style={{ padding:"20px 20px 0", flex:1 }}>
          {planLoading ? (
            <LoadingCard />
          ) : !plan ? (
            <NoPlanCard profile={profile} user={user} onGenerated={p => setPlan(p)} />
          ) : !dayData ? (
            <EmptyCard />
          ) : dayData.type === "rest" || dayData.type === "recovery" ? (
            <RestCard dayData={dayData} selectedDay={selectedDay} onViewWorkout={() => router.push(`/workout?day=${selectedDay}`)} />
          ) : (
            <WorkoutCard dayData={dayData} mainCount={mainCount} calories={calories} selectedDay={selectedDay} completedToday={completedToday} onStart={() => router.push(`/workout?day=${selectedDay}`)} />
          )}
        </div>

        {/* ── NUTRITION STRIP ── */}
        {nutrition ? (
          <Card padding="md" style={{ margin:"16px 20px 120px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <SectionLabel>NUTRITION TODAY</SectionLabel>
              <button onClick={() => router.push("/nutrition")} style={{ background:"none", border:"none", fontSize:11, color:C.accent, cursor:"pointer", fontFamily:F, fontWeight:FW.medium, letterSpacing:1 }}>VIEW MEALS</button>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <StatCell label="KCAL"    value={calories || "—"}                                                                color={C.accent}  size="md" />
              <StatCell label="Protein" value={macros?.protein != null ? `${macros.protein}g` : "—"}                            color="#00cfff"   size="md" />
              <StatCell label="Carbs"   value={macros?.carbs   != null ? `${macros.carbs}g`   : "—"}                            color="#ffaa00"   size="md" />
              <StatCell label="Fat"     value={(macros?.fat ?? macros?.fats) != null ? `${macros?.fat ?? macros?.fats}g` : "—"} color="#ff5e8a"   size="md" />
            </div>
          </Card>
        ) : plan ? (
          <Card padding="md" variant="bordered" style={{ margin:"16px 20px 120px", textAlign:"center", borderStyle:"dashed" }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:6, fontWeight:FW.medium }}>No nutrition data</div>
            <div style={{ fontSize:11, color:C.dim, lineHeight:1.5 }}>Your plan is missing nutrition targets. Regenerate from the Coach tab to get daily macros.</div>
          </Card>
        ) : null}
      </div>
      <BottomNav active="dashboard" router={router} />
    </Screen>
  );
}

// ── Workout Card ───────────────────────────────────────
function WorkoutCard({ dayData, mainCount, calories, selectedDay, completedToday, onStart }) {
  const typeColor = TYPE_COLOR[dayData.type] || C.accent;
  const isToday   = selectedDay === TODAY_IDX;
  const level     = { beginner:"STARTER", intermediate:"ELITE", advanced:"PRO" }["intermediate"] || "ELITE";
  const parts     = (dayData.focus || dayData.sessionLabel || "").split(" ");
  const last      = parts.pop();
  const rest      = parts.join(" ");

  return (
    <div style={{ background:C.bgCard, borderRadius:20, padding:22, border:`1px solid ${C.border}` }}>
      {/* Badges */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <span style={{ background:C.accent, color:"#0a0a0a", fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, letterSpacing:1 }}>
          {(dayData.type || "STRENGTH").toUpperCase()}
        </span>
        <span style={{ background:"transparent", border:`1.5px solid ${C.border}`, color:C.muted, fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:20, letterSpacing:1 }}>
          {level}
        </span>
      </div>

      {/* Session name */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:36, fontWeight:900, color:C.white, lineHeight:1, letterSpacing:-1 }}>
          {rest || last}
        </div>
        {rest && (
          <div style={{ fontSize:36, fontWeight:900, color:C.accent, lineHeight:1, letterSpacing:-1 }}>
            {last}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display:"flex", gap:20, marginBottom:8 }}>
        {dayData.estimatedDuration && (
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>{dayData.estimatedDuration.toUpperCase()}</span>
          </div>
        )}
        {mainCount > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M6.5 6.5H5C4.17 6.5 3.5 7.17 3.5 8V10C3.5 10.83 4.17 11.5 5 11.5H6.5"/><path d="M17.5 6.5H19C19.83 6.5 20.5 7.17 20.5 8V10C20.5 10.83 19.83 11.5 19 11.5H17.5"/><line x1="6.5" y1="6.5" x2="6.5" y2="17.5"/><line x1="17.5" y1="6.5" x2="17.5" y2="17.5"/><line x1="6.5" y1="12" x2="17.5" y2="12"/><path d="M6.5 17.5H5C4.17 17.5 3.5 16.83 3.5 16V14C3.5 13.17 4.17 12.5 5 12.5H6.5"/><path d="M17.5 17.5H19C19.83 17.5 20.5 16.83 20.5 16V14C20.5 13.17 19.83 12.5 19 12.5H17.5"/></svg>
            <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>{mainCount} EXERCISES</span>
          </div>
        )}
      </div>

      {calories && (
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:20 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={C.muted}><path d="M11.85 2.1C11.9 2.04 11.95 2 12 2C12.05 2 12.1 2.04 12.15 2.1L13.8 4.5C15.3 6.7 16 9.3 16 12C16 14.2 15.2 16.2 13.9 17.7C13.6 14.8 11.5 12.4 8.7 11.4C9.2 8.5 10.3 5.1 11.85 2.1ZM8 12.5C10.5 13.4 12 15.7 12 18.5C12 20.43 10.43 22 8.5 22C6.57 22 5 20.43 5 18.5C5 15.7 6.5 13.4 8 12.5Z"/></svg>
          <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>{calories} KCAL</span>
        </div>
      )}

      {completedToday && isToday ? (
        <div style={{width:"100%",padding:"14px",background:"rgba(90,138,0,0.12)",border:"1.5px solid #5a8a00",borderRadius:14,textAlign:"center"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#7acc00",letterSpacing:0.5}}>✓ WORKOUT COMPLETE</div>
          <div style={{fontSize:11,color:C.muted,marginTop:3}}>Great work today. Rest and recover.</div>
        </div>
      ) : (
        <button onClick={onStart} style={{
          width:"100%", padding:"16px",
          background: isToday ? C.accent : "transparent",
          border: isToday ? "none" : `1.5px solid ${C.border}`,
          borderRadius:14, fontFamily:F, fontSize:14, fontWeight:800,
          color: isToday ? "#0a0a0a" : C.muted,
          cursor:"pointer", letterSpacing:1,
        }}>
          {isToday ? "START WORKOUT" : "VIEW WORKOUT"}
        </button>
      )}
    </div>
  );
}

// ── Rest Card ──────────────────────────────────────────
function RestCard({ dayData, selectedDay, onViewWorkout }) {
  const isToday    = selectedDay === TODAY_IDX;
  const mobilityEx = [...(dayData.blocks?.warmup || []), ...(dayData.blocks?.cooldown || [])];
  return (
    <div style={{ background:C.bgCard, borderRadius:20, padding:22, border:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <span style={{ background:C.bgDeep, color:C.muted, fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, letterSpacing:1 }}>REST</span>
        <span style={{ background:"transparent", border:`1.5px solid ${C.border}`, color:C.dim, fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:20, letterSpacing:1 }}>RECOVERY</span>
      </div>
      <div style={{ fontSize:32, fontWeight:900, color:C.muted, lineHeight:1.1, letterSpacing:-0.5, marginBottom:8 }}>REST<br/>DAY</div>
      <div style={{ fontSize:13, color:C.dim, marginBottom:mobilityEx.length?20:0 }}>Recovery is training. Sleep well.</div>
      {mobilityEx.length > 0 && (
        <>
          <div style={{ fontSize:10, color:C.muted, letterSpacing:2.5, fontWeight:700, marginBottom:10 }}>RECOMMENDED MOBILITY</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {mobilityEx.map((ex, i) => (
              <div key={i} style={{ padding:"10px 14px", background:C.bgDeep, borderRadius:12, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{ex.name}</div>
                {(ex.details || ex.duration) && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{ex.details || ex.duration}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Loading / Empty / No-Plan ──────────────────────────
function LoadingCard() {
  return (
    <div style={{ background:C.bgCard, borderRadius:20, padding:32, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", minHeight:200 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:32, height:32, borderRadius:"50%", border:`2px solid ${C.border}`, borderTopColor:C.accent, animation:"spin 0.9s linear infinite" }}/>
    </div>
  );
}
function EmptyCard() {
  return (
    <div style={{ background:C.bgCard, borderRadius:20, padding:32, border:`1px solid ${C.border}`, textAlign:"center", minHeight:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:C.dim, fontSize:14 }}>No session for this day</div>
    </div>
  );
}
function NoPlanCard({ profile, user, onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const generate = async () => {
    setLoading(true); setError("");
    try {
      const r    = await fetch("/api/generate-plan", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(profile||{}) });
      const data = await r.json();
      if (data.error) { setError(data.error); return; }
      const { saveWeekPlan } = await import("../lib/firebase");
      if (user) await saveWeekPlan(user.uid, profile?.currentWeek||1, data);
      onGenerated(data);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ background:C.bgCard, borderRadius:20, padding:24, border:`1px solid ${C.border}`, textAlign:"center" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize:22, fontWeight:800, color:C.muted, letterSpacing:-0.5, marginBottom:8 }}>NO PLAN YET</div>
      <div style={{ fontSize:13, color:C.dim, lineHeight:1.6, marginBottom:20 }}>Generate your personalized AI plan to get started.</div>
      {error && <div style={{ fontSize:11, color:"#ff5e5e", marginBottom:12 }}>{error}</div>}
      <button onClick={generate} disabled={loading} style={{ width:"100%", padding:"15px", background:C.accent, border:"none", borderRadius:14, fontFamily:"'Lexend',sans-serif", fontSize:14, fontWeight:800, color:"#0a0a0a", cursor:loading?"default":"pointer", opacity:loading?0.6:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        {loading && <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#0a0a0a", animation:"spin 0.8s linear infinite" }}/>}
        {loading ? "Generating..." : "Generate My Plan"}
      </button>
    </div>
  );
}

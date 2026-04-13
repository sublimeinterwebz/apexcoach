import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan, saveWeekPlan } from "../lib/firebase";

const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const TYPE_COLOR = {
  strength:      "#00ff80",
  hypertrophy:   "#00cfff",
  conditioning:  "#ffaa00",
  recovery:      "#aa88ff",
  rest:          "#2a2a2a",
};

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [plan,        setPlan]        = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(TODAY_IDX);

  if (loading) return null;

  const firstName   = profile?.displayName?.split(" ")[0] || user?.displayName?.split(" ")[0] || profile?.email?.split("@")[0] || "Athlete";
  const userInitial = firstName[0]?.toUpperCase() || "A";
  const currentWeek = profile?.currentWeek || 1;

  useEffect(() => {
    if (!user) return;
    async function load() {
      setPlanLoading(true);
      try {
        if (profile?.plan?.weekPlan) { setPlan(profile.plan); setPlanLoading(false); return; }
        const p = await getWeekPlan(user.uid, currentWeek);
        setPlan(p);
      } catch (e) { console.error(e); }
      setPlanLoading(false);
    }
    load();
  }, [user, currentWeek]);

  const weekPlan = plan?.weekPlan || [];
  const dayData  = weekPlan[selectedDay] || null;
  const macros   = plan?.nutrition?.macros || null;
  const calories = plan?.nutrition?.dailyCalories || null;

  // Count total exercises for today
  const todayExCount = dayData?.blocks
    ? Object.values(dayData.blocks).flat().length
    : (dayData?.exercises?.length || 0);

  return (
    <Screen>
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 20px", position:"relative", zIndex:1 }}>

        {/* Top bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:52, paddingBottom:16 }}>
          <div>
            <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:2 }}>APEXCOACH</div>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:1, lineHeight:1 }}>{`Good Morning, ${firstName}`}</div>
          </div>
          <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#00ff80,#00aa55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#000" }}>{userInitial}</div>
        </div>

        {/* Week label */}
        <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid #161616", paddingTop:10, marginBottom:14 }}>
          <span style={{ fontSize:10, color:"#333", letterSpacing:2, fontWeight:600 }}>{`WEEK ${currentWeek}`}</span>
          <span style={{ fontSize:10, color: plan?"#00ff80":"#444", letterSpacing:1.5, fontWeight:600 }}>
            {planLoading ? "Loading..." : plan ? plan.coachNote ? "Plan ready" : "Plan ready" : "No plan yet"}
          </span>
        </div>

        {planLoading ? (
          <PlanLoader />
        ) : !plan ? (
          <NoPlan profile={profile} user={user} onPlanGenerated={p => setPlan(p)} />
        ) : (
          <>
            {/* Week strip */}
            <div style={{ display:"flex", gap:5, marginBottom:16 }}>
              {weekPlan.map((day, i) => {
                const isSelected = i === selectedDay;
                const isRest     = day.type === "rest" || day.type === "recovery";
                const isToday    = i === TODAY_IDX;
                const isPast     = i < TODAY_IDX;
                const typeColor  = TYPE_COLOR[day.type] || "#00ff80";
                return (
                  <button key={i} onClick={() => setSelectedDay(i)} style={{ flex:1, padding:"8px 0", borderRadius:10, display:"flex", flexDirection:"column", alignItems:"center", gap:4, background: isSelected?"rgba(0,255,128,0.08)":"#0d0d0d", border:`1px solid ${isSelected?typeColor:"#141414"}`, cursor:"pointer", transition:"all 0.2s" }}>
                    <span style={{ fontSize:8, letterSpacing:1, color: isSelected?typeColor:"#2a2a2a", fontWeight:600 }}>{(day.dayName || DAY_NAMES[i] || day.day || "").slice(0,3).toUpperCase()}</span>
                    <div style={{ width:5, height:5, borderRadius:"50%", background: isRest?"#1e1e1e": isPast?"#00aa55": isToday?typeColor:"#1e1e1e" }}/>
                    <span style={{ fontSize:7, fontWeight:700, color: isRest?"#222": isPast?"#00aa55": isToday?typeColor:"#222" }}>
                      {isRest ? "—" : (day.type || "").slice(0,4).toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Day card */}
            {dayData && (
              <div key={selectedDay} style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:16, padding:16, marginBottom:12, flex:1, overflow:"hidden" }}>
                {dayData.type === "rest" || dayData.type === "recovery" ? (
                  <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", height:"100%", gap:6 }}>
                    <div style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:2, color:"#1e1e1e" }}>
                      {dayData.type === "recovery" ? "ACTIVE RECOVERY" : "REST DAY"}
                    </div>
                    {dayData.blocks?.warmup?.length > 0 && (
                      <div style={{ fontSize:12, color:"#2a2a2a", textAlign:"center", lineHeight:1.6 }}>
                        {dayData.blocks.cooldown?.map(e => e.name).join(" · ") || "Light movement, stretching, hydration"}
                      </div>
                    )}
                    {!dayData.blocks?.warmup?.length && (
                      <div style={{ fontSize:12, color:"#2a2a2a", textAlign:"center" }}>Recovery is training. Sleep well. Stay hydrated.</div>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:9, color: TYPE_COLOR[dayData.type] || "#00ff80", letterSpacing:2.5, fontWeight:600, marginBottom:3 }}>
                          {selectedDay === TODAY_IDX ? "TODAY" : (dayData.dayName || DAY_NAMES[selectedDay] || "").toUpperCase()} · {(dayData.type || "").toUpperCase()}
                        </div>
                        <div style={{ fontFamily:"'Bebas Neue'", fontSize:26, letterSpacing:1.5, lineHeight:1 }}>{dayData.focus || dayData.sessionLabel}</div>
                        <div style={{ fontSize:11, color:"#555", marginTop:2 }}>{dayData.muscleGroups} · {dayData.estimatedDuration}</div>
                      </div>
                      <div style={{ background:"rgba(0,255,128,0.08)", border:"1px solid rgba(0,255,128,0.15)", borderRadius:8, padding:"3px 10px", fontSize:10, color:"#00ff80", fontWeight:600 }}>
                        {todayExCount} moves
                      </div>
                    </div>
                    <div style={{ height:1, background:"#141414", marginBottom:10 }}/>

                    {/* Show main block preview */}
                    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {(dayData.blocks?.main || dayData.exercises || []).slice(0, 4).map((ex, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:20, height:20, borderRadius:5, background:"#111", border:"1px solid #1a1a1a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#333", fontWeight:700 }}>{i+1}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:500, color:"#d0d0d0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ex.name}</div>
                            <div style={{ fontSize:10, color:"#444", marginTop:1 }}>{ex.sets} sets · {ex.reps} reps</div>
                          </div>
                        </div>
                      ))}
                      {(dayData.blocks?.main || dayData.exercises || []).length > 4 && (
                        <div style={{ fontSize:11, color:"#444", paddingLeft:30 }}>+{(dayData.blocks?.main || dayData.exercises || []).length - 4} more in full workout</div>
                      )}
                    </div>

                    {selectedDay === TODAY_IDX && (
                      <button onClick={() => router.push("/workout")} style={{ width:"100%", marginTop:14, padding:"13px", background:"linear-gradient(135deg,#00ff80,#00cc55)", border:"none", borderRadius:11, fontFamily:"'DM Sans'", fontSize:13, fontWeight:700, color:"#000", cursor:"pointer" }}>
                        Start Workout
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Nutrition macros */}
            {macros && (
              <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:16, padding:"14px 16px", marginBottom:80 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ fontSize:9, color:"#444", letterSpacing:2.5, fontWeight:600 }}>TODAY'S NUTRITION</div>
                  <button onClick={() => router.push("/nutrition")} style={{ background:"none", border:"none", fontSize:10, color:"#00ff80", cursor:"pointer", fontFamily:"'DM Sans'", letterSpacing:1 }}>VIEW MEALS</button>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {[
                    { label:"Calories", value:calories,      unit:"kcal", color:"#00ff80" },
                    { label:"Protein",  value:macros.protein, unit:"g",    color:"#00cfff" },
                    { label:"Carbs",    value:macros.carbs,   unit:"g",    color:"#ffaa00" },
                    { label:"Fat",      value:macros.fat,     unit:"g",    color:"#ff5e8a" },
                  ].map(m => (
                    <div key={m.label} style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
                      <div style={{ fontSize:9, color:"#444", letterSpacing:1, fontWeight:600 }}>{m.label.toUpperCase()}</div>
                      <div style={{ fontFamily:"'Bebas Neue'", fontSize:20, letterSpacing:1, color:m.color, lineHeight:1 }}>
                        {m.value}<span style={{ fontSize:9, color:"#2a2a2a", fontFamily:"'DM Sans'", fontWeight:400 }}> {m.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav active="dashboard" router={router} />
    </Screen>
  );
}

function PlanLoader() {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#00ff80", animation:"spin 1s linear infinite" }}/>
      <div style={{ fontSize:12, color:"#444", letterSpacing:2 }}>LOADING YOUR PLAN</div>
    </div>
  );
}

function NoPlan({ profile, user, onPlanGenerated }) {
  const [generating, setGenerating] = useState(false);
  const [error,       setError]       = useState("");

  const regenerate = async () => {
    setGenerating(true); setError("");
    try {
      const data = await fetch("/api/generate-plan", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(profile || {}),
      }).then(r => r.json());
      if (data.error) { setError(data.error); return; }
      const { saveWeekPlan } = await import("../lib/firebase");
      if (user) await saveWeekPlan(user.uid, profile?.currentWeek || 1, data);
      onPlanGenerated(data);
    } catch(e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, padding:"0 24px", textAlign:"center" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontFamily:"'Bebas Neue'", fontSize:22, letterSpacing:2, color:"#1e1e1e" }}>NO PLAN YET</div>
      <div style={{ fontSize:12, color:"#444", lineHeight:1.7 }}>Tap below to generate your personalized AI plan.</div>
      {error && <div style={{ fontSize:11, color:"#ff5e5e", whiteSpace:"pre-wrap", textAlign:"left" }}>{error}</div>}
      <button onClick={regenerate} disabled={generating} style={{ marginTop:8, padding:"14px 28px", background:"linear-gradient(135deg,#00ff80,#00cc55)", border:"none", borderRadius:12, color:"#000", fontSize:13, fontWeight:700, cursor:generating?"default":"pointer", fontFamily:"'DM Sans'", opacity:generating?0.6:1, display:"flex", alignItems:"center", gap:8 }}>
        {generating && <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#000", animation:"spin 0.8s linear infinite" }}/>}
        {generating ? "Generating..." : "Generate My Plan"}
      </button>
    </div>
  );
}

import { useState } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav } from "../components/shared";
import { useAuth } from "../lib/AuthContext";
import { signOut } from "../lib/firebase";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const TODAY = 2;

const WEEK_PLAN = {
  0:{ type:"workout", label:"Push",   muscles:"Chest · Shoulders · Triceps" },
  1:{ type:"workout", label:"Pull",   muscles:"Back · Biceps" },
  2:{ type:"workout", label:"Legs",   muscles:"Quads · Hamstrings · Glutes" },
  3:{ type:"rest",    label:"Rest",   muscles:"" },
  4:{ type:"workout", label:"Upper",  muscles:"Full Upper Body" },
  5:{ type:"workout", label:"Cardio", muscles:"HIIT · Core" },
  6:{ type:"rest",    label:"Rest",   muscles:"" },
};

const EXERCISES = [
  { name:"Barbell Back Squat", sets:4, reps:"8–10",    rest:"90s" },
  { name:"Romanian Deadlift",  sets:3, reps:"10–12",   rest:"75s" },
  { name:"Leg Press",          sets:3, reps:"12–15",   rest:"60s" },
  { name:"Walking Lunges",     sets:3, reps:"12 each", rest:"60s" },
];

const MACROS = [
  { label:"Calories", value:1840, target:2200, unit:"kcal", color:"#00ff80" },
  { label:"Protein",  value:112,  target:160,  unit:"g",    color:"#00cfff" },
  { label:"Carbs",    value:190,  target:250,  unit:"g",    color:"#ffaa00" },
  { label:"Fat",      value:48,   target:70,   unit:"g",    color:"#ff5e8a" },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [selectedDay, setSelectedDay] = useState(TODAY);

  // Derive first name from profile or Google display name
  const firstName = profile?.displayName?.split(" ")[0]
    || user?.displayName?.split(" ")[0]
    || profile?.email?.split("@")[0]
    || "Athlete";

  const userInitial = firstName[0]?.toUpperCase() || "A";
  const currentWeek = profile?.currentWeek || 1;
  const day = WEEK_PLAN[selectedDay];

  return (
    <Screen>
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 20px", position:"relative", zIndex:1 }}>

        {/* Top bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:52, paddingBottom:16 }}>
          <div>
            <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:2 }}>APEXCOACH</div>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:1, lineHeight:1 }}>Good Morning, {firstName}</div>
          </div>
          <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#00ff80,#00aa55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#000" }}>{userInitial}</div>
        </div>

        {/* Week label */}
        <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid #161616", paddingTop:10, marginBottom:14 }}>
          <span style={{ fontSize:10, color:"#2a2a2a", letterSpacing:2, fontWeight:600 }}>`WEEK ${currentWeek}`</span>
          <span style={{ fontSize:10, color:"#00ff80", letterSpacing:1.5, fontWeight:600 }}>4 of 5 sessions done</span>
        </div>

        {/* Week strip */}
        <div style={{ display:"flex", gap:5, marginBottom:16 }}>
          {DAYS.map((d, i) => {
            const plan = WEEK_PLAN[i];
            const isSelected = i === selectedDay;
            const isRest = plan.type === "rest";
            const isPast = i < TODAY;
            return (
              <button key={d} onClick={() => setSelectedDay(i)} style={{
                flex:1, padding:"8px 0", borderRadius:10,
                display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                background: isSelected ? (isRest ? "#1a1a1a" : "rgba(0,255,128,0.1)") : "#0d0d0d",
                border:`1px solid ${isSelected ? (isRest ? "#2a2a2a" : "#00ff80") : "#141414"}`,
                cursor:"pointer", transition:"all 0.2s",
              }}>
                <span style={{ fontSize:8, letterSpacing:1, color: isSelected ? (isRest ? "#333" : "#00ff80") : "#2a2a2a", fontWeight:600 }}>
                  {d.toUpperCase()}
                </span>
                <div style={{
                  width:5, height:5, borderRadius:"50%",
                  background: isRest ? "#1e1e1e" : isPast ? "#00aa55" : i===TODAY ? "#00ff80" : "#1e1e1e",
                }}/>
                <span style={{ fontSize:7, letterSpacing:.5, fontWeight:700, color: isRest?"#222": isPast?"#00aa55": i===TODAY?"#00ff80":"#222" }}>
                  {isRest ? "—" : plan.label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Workout card */}
        <div key={selectedDay} className="fu" style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:16, padding:16, marginBottom:12, flex:1 }}>
          {day.type === "rest" ? (
            <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", height:"100%", gap:6 }}>
              <div style={{ fontFamily:"'Bebas Neue'", fontSize:26, letterSpacing:2, color:"#1e1e1e" }}>REST DAY</div>
              <div style={{ fontSize:12, color:"#2a2a2a", textAlign:"center", lineHeight:1.6 }}>Recovery is part of the process. Sleep well. Stay hydrated.</div>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:9, color:"#00ff80", letterSpacing:2.5, fontWeight:600, marginBottom:3 }}>
                    {selectedDay===TODAY ? "TODAY'S WORKOUT" : DAYS[selectedDay].toUpperCase()}
                  </div>
                  <div style={{ fontFamily:"'Bebas Neue'", fontSize:28, letterSpacing:1.5, lineHeight:1 }}>{day.label} Day</div>
                  <div style={{ fontSize:11, color:"#333", marginTop:2 }}>{day.muscles}</div>
                </div>
                <div style={{ background:"rgba(0,255,128,0.08)", border:"1px solid rgba(0,255,128,0.15)", borderRadius:8, padding:"3px 10px", fontSize:10, color:"#00ff80", fontWeight:600, letterSpacing:1 }}>
                  {EXERCISES.length} exercises
                </div>
              </div>
              <div style={{ height:1, background:"#141414", marginBottom:12 }}/>
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                {EXERCISES.map((ex, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:22, height:22, borderRadius:6, background:"#111", border:"1px solid #1a1a1a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#2a2a2a", fontWeight:700 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12.5, fontWeight:500, color:"#d0d0d0" }}>{ex.name}</div>
                      <div style={{ fontSize:10, color:"#333", marginTop:1 }}>{ex.sets} sets · {ex.reps} reps · {ex.rest} rest</div>
                    </div>
                    <div style={{ width:5, height:5, borderRadius:"50%", background: i<1 ? "#00aa55" : "#1a1a1a" }}/>
                  </div>
                ))}
              </div>
              {selectedDay===TODAY && (
                <button onClick={() => router.push("/workout")} style={{
                  width:"100%", marginTop:14, padding:"13px",
                  background:"linear-gradient(135deg,#00ff80,#00cc55)",
                  border:"none", borderRadius:11, fontFamily:"'DM Sans'",
                  fontSize:13, fontWeight:700, color:"#000", cursor:"pointer",
                }}>Start Workout</button>
              )}
            </>
          )}
        </div>

        {/* Nutrition macros */}
        <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:16, padding:"14px 16px", marginBottom:80 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:9, color:"#333", letterSpacing:2.5, fontWeight:600 }}>TODAY'S NUTRITION</div>
            <div style={{ fontSize:10, color:"#2a2a2a" }}>Tap to log meals</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {MACROS.map(m => {
              const pct = Math.round((m.value / m.target) * 100);
              return (
                <div key={m.label} style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
                  <div style={{ fontSize:9, color:"#333", letterSpacing:1, fontWeight:600 }}>{m.label.toUpperCase()}</div>
                  <div style={{ fontFamily:"'Bebas Neue'", fontSize:20, letterSpacing:1, color:m.color, lineHeight:1 }}>
                    {m.value}<span style={{ fontSize:9, color:"#2a2a2a", fontFamily:"'DM Sans'", fontWeight:400 }}> {m.unit}</span>
                  </div>
                  <div style={{ fontSize:8, color:"#2a2a2a" }}>of {m.target}</div>
                  <div style={{ height:3, background:"#141414", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:m.color, borderRadius:3, transition:"width 0.6s ease" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav active="dashboard" router={router} />
    </Screen>
  );
}

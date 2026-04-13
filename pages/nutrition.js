import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan } from "../lib/firebase";

export default function Nutrition() {
  const router = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [plan,        setPlan]        = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [expanded,    setExpanded]    = useState(null);

  if (loading) return null;

  const currentWeek = profile?.currentWeek || 1;

  useEffect(() => {
    if (!user) return;
    async function load() {
      setPlanLoading(true);
      try {
        if (profile?.plan?.nutrition) {
          setPlan(profile.plan.nutrition);
        } else {
          const p = await getWeekPlan(user.uid, currentWeek);
          if (p?.nutrition) setPlan(p.nutrition);
        }
      } catch(e) { console.error(e); }
      setPlanLoading(false);
    }
    load();
  }, [user]);

  return (
    <Screen>
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 20px", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ paddingTop:52, paddingBottom:20 }}>
          <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:4 }}>WEEK {currentWeek}</div>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:34, letterSpacing:1.5, lineHeight:1 }}>
            Nutrition <span style={{ color:"#00ff80" }}>Plan</span>
          </div>
        </div>

        {planLoading ? (
          <Loader />
        ) : !plan ? (
          <NoPlan />
        ) : (
          <div style={{ flex:1, overflowY:"auto", paddingBottom:90 }}>

            {/* Macro summary */}
            <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2.5, fontWeight:600, marginBottom:12 }}>DAILY TARGETS</div>
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { label:"Calories", value:plan.dailyCalories, unit:"kcal", color:"#00ff80" },
                  { label:"Protein",  value:plan.macros?.protein,  unit:"g", color:"#00cfff" },
                  { label:"Carbs",    value:plan.macros?.carbs,    unit:"g", color:"#ffaa00" },
                  { label:"Fat",      value:plan.macros?.fat,      unit:"g", color:"#ff5e8a" },
                ].map(m => (
                  <div key={m.label} style={{ flex:1, textAlign:"center" }}>
                    <div style={{ fontFamily:"'Bebas Neue'", fontSize:22, color:m.color, letterSpacing:1, lineHeight:1 }}>{m.value}</div>
                    <div style={{ fontSize:9, color:"#333", marginTop:2 }}>{m.unit}</div>
                    <div style={{ fontSize:8, color:"#2a2a2a", letterSpacing:1.5, fontWeight:600, marginTop:3 }}>{m.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach note */}
            {plan.nutritionNotes && (
              <div style={{ background:"#0a0a0a", border:"1px solid #1a1a1a", borderLeft:"2px solid #00ff80", borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
                <div style={{ fontSize:9, color:"#00ff80", letterSpacing:2, fontWeight:600, marginBottom:6 }}>NUTRITION NOTES</div>
                <p style={{ fontSize:12, color:"#777", lineHeight:1.65 }}>{plan.nutritionNotes}</p>
              </div>
            )}

            {/* Meals */}
            <div style={{ fontSize:9, color:"#444", letterSpacing:2.5, fontWeight:600, marginBottom:10 }}>DAILY MEALS</div>

            {plan.meals && ["breakfast", "lunch", "dinner"].filter(k => plan.meals[k]).map((mealKey) => {
              const meal = plan.meals[mealKey]; if (!meal) return null;
              const isOpen = expanded === mealKey;
              return (
                <MealCard key={mealKey} mealKey={mealKey} meal={meal} isOpen={isOpen} onToggle={() => setExpanded(isOpen ? null : mealKey)} />
              );
            })}

            {/* Snacks */}
            {plan.meals?.snacks?.length > 0 && (
              <>
                <div style={{ fontSize:9, color:"#444", letterSpacing:2.5, fontWeight:600, margin:"14px 0 10px" }}>SNACKS</div>
                {plan.meals.snacks.map((snack, i) => {
                  const key = `snack_${i}`;
                  const isOpen = expanded === key;
                  return (
                    <MealCard key={key} mealKey={key} meal={snack} isOpen={isOpen} onToggle={() => setExpanded(isOpen ? null : key)} isSnack />
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
      <BottomNav active="nutrition" router={router} />
    </Screen>
  );
}

function MealCard({ mealKey, meal, isOpen, onToggle, isSnack }) {
  const label = isSnack ? "Snack" : mealKey.charAt(0).toUpperCase() + mealKey.slice(1);
  return (
    <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:13, marginBottom:10, overflow:"hidden", transition:"all 0.3s" }}>
      <button onClick={onToggle} style={{ width:"100%", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans'" }}>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontSize:10, color:"#555", letterSpacing:2, fontWeight:600, marginBottom:3 }}>{label.toUpperCase()}</div>
          <div style={{ fontSize:14, fontWeight:600, color:"#d0d0d0" }}>{meal.name}</div>
          <div style={{ fontSize:11, color:"#444", marginTop:2 }}>{meal.calories} kcal · {meal.protein}g protein</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
          <div style={{ fontSize:18, color:"#333", fontWeight:300 }}>{isOpen ? "−" : "+"}</div>
          <div style={{ display:"flex", gap:6 }}>
            {[
              { val:meal.protein, unit:"P", color:"#00cfff" },
              { val:meal.carbs,   unit:"C", color:"#ffaa00" },
              { val:meal.fat,     unit:"F", color:"#ff5e8a" },
            ].map(m => (
              <div key={m.unit} style={{ fontSize:9, color:m.color, fontWeight:600 }}>{m.val}g {m.unit}</div>
            ))}
          </div>
        </div>
      </button>

      {isOpen && (
        <div style={{ padding:"0 16px 16px", borderTop:"1px solid #141414" }}>
          {/* Ingredients */}
          {meal.ingredients?.length > 0 && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2, fontWeight:600, marginBottom:8 }}>INGREDIENTS</div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {meal.ingredients.map((ing, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:4, height:4, borderRadius:"50%", background:"#00ff80", flexShrink:0 }}/>
                    <span style={{ fontSize:12, color:"#888" }}>{ing}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Instructions */}
          {meal.instructions && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2, fontWeight:600, marginBottom:8 }}>INSTRUCTIONS</div>
              <p style={{ fontSize:12, color:"#666", lineHeight:1.65 }}>{meal.instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#00ff80", animation:"spin 1s linear infinite" }}/>
      <div style={{ fontSize:12, color:"#444", letterSpacing:2 }}>LOADING NUTRITION</div>
    </div>
  );
}

function NoPlan() {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10, textAlign:"center" }}>
      <div style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:2, color:"#1e1e1e" }}>NO PLAN YET</div>
      <div style={{ fontSize:12, color:"#333", lineHeight:1.7 }}>Complete onboarding to generate your personalized nutrition plan.</div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan } from "../lib/firebase";

export default function Nutrition() {
  const router = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [nutrition,    setNutrition]    = useState(null);
  const [planLoading,  setPlanLoading]  = useState(true);
  const [expandedMeal, setExpandedMeal] = useState(null);

  if (loading) return null;

  const currentWeek = profile?.currentWeek || 1;

  useEffect(() => {
    if (!user) return;
    async function load() {
      setPlanLoading(true);
      try {
        const planData = profile?.plan || await getWeekPlan(user.uid, currentWeek);
        if (planData?.nutrition) setNutrition(planData.nutrition);
      } catch(e) { console.error(e); }
      setPlanLoading(false);
    }
    load();
  }, [user]);

  return (
    <Screen>
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 20px", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ paddingTop:52, paddingBottom:18 }}>
          <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:4 }}>WEEK {currentWeek}</div>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:34, letterSpacing:1.5, lineHeight:1 }}>
            Nutrition <span style={{ color:"#00ff80" }}>Plan</span>
          </div>
        </div>

        {planLoading ? (
          <Loader />
        ) : !nutrition ? (
          <NoPlan />
        ) : (
          <div style={{ flex:1, overflowY:"auto", paddingBottom:90 }}>

            {/* Macro targets */}
            <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2.5, fontWeight:600, marginBottom:12 }}>DAILY TARGETS</div>
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { label:"Calories", value:nutrition.dailyCalories || nutrition.calories, unit:"kcal", color:"#00ff80" },
                  { label:"Protein",  value:nutrition.macros?.protein, unit:"g", color:"#00cfff" },
                  { label:"Carbs",    value:nutrition.macros?.carbs,   unit:"g", color:"#ffaa00" },
                  { label:"Fat",      value:nutrition.macros?.fat || nutrition.macros?.fats, unit:"g", color:"#ff5e8a" },
                ].map(m => (
                  <div key={m.label} style={{ flex:1, textAlign:"center" }}>
                    <div style={{ fontFamily:"'Bebas Neue'", fontSize:22, color:m.color, letterSpacing:1, lineHeight:1 }}>{m.value}</div>
                    <div style={{ fontSize:9, color:"#333", marginTop:2 }}>{m.unit}</div>
                    <div style={{ fontSize:8, color:"#2a2a2a", letterSpacing:1.5, fontWeight:600, marginTop:3 }}>{m.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach tips */}
            {nutrition.tips?.length > 0 && (
              <div style={{ background:"#0a0a0a", border:"1px solid #1a1a1a", borderLeft:"2px solid #00ff80", borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
                <div style={{ fontSize:9, color:"#00ff80", letterSpacing:2, fontWeight:600, marginBottom:8 }}>NUTRITION NOTES</div>
                {nutrition.tips.map((tip, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom: i < nutrition.tips.length-1 ? 6 : 0 }}>
                    <div style={{ width:4, height:4, borderRadius:"50%", background:"#00ff80", marginTop:5, flexShrink:0 }}/>
                    <div style={{ fontSize:12, color:"#777", lineHeight:1.6 }}>{tip}</div>
                  </div>
                ))}
                {nutrition.nutritionNotes && !nutrition.tips.length && (
                  <p style={{ fontSize:12, color:"#777", lineHeight:1.65 }}>{nutrition.nutritionNotes}</p>
                )}
              </div>
            )}

            {/* Meal examples */}
            {nutrition.mealExamples?.length > 0 ? (
              <>
                <div style={{ fontSize:9, color:"#444", letterSpacing:2.5, fontWeight:600, marginBottom:10 }}>DAILY MEALS</div>
                {nutrition.mealExamples.map((m, i) => (
                  <MealCard key={i} meal={m} isOpen={expandedMeal === i} onToggle={() => setExpandedMeal(expandedMeal === i ? null : i)} />
                ))}
              </>
            ) : nutrition.meals ? (
              /* Legacy format fallback */
              <>
                <div style={{ fontSize:9, color:"#444", letterSpacing:2.5, fontWeight:600, marginBottom:10 }}>DAILY MEALS</div>
                {["breakfast","lunch","dinner"].filter(k => nutrition.meals[k]).map((k) => {
                  const meal = nutrition.meals[k];
                  return <LegacyMealCard key={k} mealKey={k} meal={meal} isOpen={expandedMeal === k} onToggle={() => setExpandedMeal(expandedMeal === k ? null : k)} />;
                })}
                {(nutrition.meals.snacks || []).map((s, i) => (
                  <LegacyMealCard key={`snack_${i}`} mealKey="snack" meal={s} isOpen={expandedMeal === `snack_${i}`} onToggle={() => setExpandedMeal(expandedMeal === `snack_${i}` ? null : `snack_${i}`)} />
                ))}
              </>
            ) : null}
          </div>
        )}
      </div>
      <BottomNav active="nutrition" router={router} />
    </Screen>
  );
}

// New format: { meal: "Breakfast", example: "...", calories: 500, protein: 35 }
function MealCard({ meal, isOpen, onToggle }) {
  return (
    <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:13, marginBottom:10, overflow:"hidden" }}>
      <button onClick={onToggle} style={{ width:"100%", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans'" }}>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontSize:10, color:"#555", letterSpacing:2, fontWeight:600, marginBottom:3 }}>{(meal.meal || "").toUpperCase()}</div>
          <div style={{ fontSize:13.5, fontWeight:600, color:"#d0d0d0" }}>{meal.example?.split(",")[0] || meal.meal}</div>
          {(meal.calories || meal.protein) && (
            <div style={{ fontSize:11, color:"#444", marginTop:2 }}>
              {meal.calories ? `${meal.calories} kcal` : ""}{meal.calories && meal.protein ? " · " : ""}{meal.protein ? `${meal.protein}g protein` : ""}
            </div>
          )}
        </div>
        <div style={{ fontSize:18, color:"#333", fontWeight:300, flexShrink:0, marginLeft:8 }}>{isOpen ? "−" : "+"}</div>
      </button>
      {isOpen && (
        <div style={{ padding:"0 16px 16px", borderTop:"1px solid #141414" }}>
          <p style={{ fontSize:13, color:"#888", lineHeight:1.7, marginTop:12 }}>{meal.example}</p>
        </div>
      )}
    </div>
  );
}

// Legacy format fallback
function LegacyMealCard({ mealKey, meal, isOpen, onToggle }) {
  const label = { breakfast:"Breakfast", lunch:"Lunch", dinner:"Dinner", snack:"Snack" }[mealKey] || mealKey;
  return (
    <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:13, marginBottom:10, overflow:"hidden" }}>
      <button onClick={onToggle} style={{ width:"100%", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans'" }}>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontSize:10, color:"#555", letterSpacing:2, fontWeight:600, marginBottom:3 }}>{label.toUpperCase()}</div>
          <div style={{ fontSize:14, fontWeight:600, color:"#d0d0d0" }}>{meal.name}</div>
          <div style={{ fontSize:11, color:"#444", marginTop:2 }}>{meal.calories} kcal · {meal.protein}g protein</div>
        </div>
        <div style={{ fontSize:18, color:"#333" }}>{isOpen ? "−" : "+"}</div>
      </button>
      {isOpen && (
        <div style={{ padding:"0 16px 16px", borderTop:"1px solid #141414" }}>
          {meal.ingredients?.length > 0 && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2, fontWeight:600, marginBottom:6 }}>INGREDIENTS</div>
              {meal.ingredients.map((ing, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:4 }}>
                  <div style={{ width:4, height:4, borderRadius:"50%", background:"#00ff80", marginTop:5, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:"#888" }}>{ing}</span>
                </div>
              ))}
            </div>
          )}
          {meal.instructions && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2, fontWeight:600, marginBottom:6 }}>HOW TO PREP</div>
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
      <div style={{ fontSize:12, color:"#444", letterSpacing:2 }}>LOADING</div>
    </div>
  );
}

function NoPlan() {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10, textAlign:"center" }}>
      <div style={{ fontFamily:"'Bebas Neue'", fontSize:22, letterSpacing:2, color:"#1e1e1e" }}>NO PLAN YET</div>
      <div style={{ fontSize:12, color:"#333", lineHeight:1.7 }}>Generate your plan from the dashboard to see your nutrition here.</div>
    </div>
  );
}

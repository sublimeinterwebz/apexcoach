import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav, C } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan } from "../lib/firebase";

const F = "'Lexend', sans-serif";

export default function Nutrition() {
  const router  = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [nutrition,   setNutrition]   = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [expanded,    setExpanded]    = useState(null);


  useEffect(() => {
    if (!user) return;
    async function load() {
      setPlanLoading(true);
      try {
        const p = profile?.plan || await getWeekPlan(user.uid, profile?.currentWeek||1);
        if (p?.nutrition) setNutrition(p.nutrition);
      } catch(e) { console.error(e); }
      setPlanLoading(false);
    }
    load();
  }, [user]);

  const macros = nutrition?.macros || {};

  if (loading) return null;

  return (
    <Screen>
      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative",zIndex:1}}>
        {/* Header */}
        <div style={{padding:"52px 20px 24px"}}>
          <div style={{fontSize:11,color:C.muted,letterSpacing:3,fontWeight:600,marginBottom:6}}>WEEK {profile?.currentWeek||1}</div>
          <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5}}>NUTRITION <span style={{color:C.accent}}>PLAN</span></div>
        </div>

        {planLoading ? (
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            <div style={{width:34,height:34,borderRadius:"50%",border:`2px solid ${C.border}`,borderTopColor:C.accent,animation:"spin 0.9s linear infinite"}}/>
          </div>
        ) : !nutrition ? (
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10,textAlign:"center",padding:"0 32px"}}>
            <div style={{fontSize:22,fontWeight:900,color:C.muted}}>NO PLAN YET</div>
            <div style={{fontSize:13,color:C.dim,lineHeight:1.7}}>Generate your plan from the dashboard.</div>
          </div>
        ) : (
          <div style={{flex:1,overflowY:"auto",padding:"0 20px",paddingBottom:90}}>
            {/* Macro targets */}
            <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:20,padding:"18px 16px",marginBottom:16}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:14}}>DAILY TARGETS</div>
              <div style={{display:"flex",gap:8}}>
                {[
                  {label:"KCAL",    value:nutrition.dailyCalories||nutrition.calories, color:C.accent},
                  {label:"PROTEIN", value:macros.protein, color:"#00cfff"},
                  {label:"CARBS",   value:macros.carbs,   color:"#ffaa00"},
                  {label:"FAT",     value:macros.fat||macros.fats, color:"#ff5e8a"},
                ].map(m=>(
                  <div key={m.label} style={{flex:1,textAlign:"center",background:C.bgDeep,borderRadius:14,padding:"12px 6px"}}>
                    <div style={{fontSize:22,fontWeight:900,color:m.color,letterSpacing:-0.5}}>{m.value}</div>
                    <div style={{fontSize:9,color:C.dim,letterSpacing:1.5,fontWeight:700,marginTop:4}}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {nutrition.tips?.length>0 && (
              <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,borderRadius:16,padding:"14px 16px",marginBottom:16}}>
                <div style={{fontSize:10,color:C.accent,letterSpacing:2.5,fontWeight:700,marginBottom:10}}>COACH NOTES</div>
                {nutrition.tips.map((tip,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:i<nutrition.tips.length-1?8:0}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:C.accent,marginTop:5,flexShrink:0}}/>
                    <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>{tip}</div>
                  </div>
                ))}
                {!nutrition.tips.length && nutrition.nutritionNotes && (
                  <p style={{fontSize:13,color:C.muted,lineHeight:1.65}}>{nutrition.nutritionNotes}</p>
                )}
              </div>
            )}

            {/* Meals */}
            <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:12}}>DAILY MEALS</div>

            {nutrition.mealExamples?.length>0 ? (
              nutrition.mealExamples.map((m,i)=>(
                <MealCard key={i} idx={i} meal={m} isOpen={expanded===i} onToggle={()=>setExpanded(expanded===i?null:i)} />
              ))
            ) : nutrition.meals ? (
              <>
                {["breakfast","lunch","dinner"].filter(k=>nutrition.meals[k]).map(k=>(
                  <LegacyMealCard key={k} mealKey={k} meal={nutrition.meals[k]} isOpen={expanded===k} onToggle={()=>setExpanded(expanded===k?null:k)} />
                ))}
                {(nutrition.meals.snacks||[]).map((s,i)=>(
                  <LegacyMealCard key={`snack_${i}`} mealKey="snack" meal={s} isOpen={expanded===`snack_${i}`} onToggle={()=>setExpanded(expanded===`snack_${i}`?null:`snack_${i}`)} />
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

function MealCard({ idx, meal, isOpen, onToggle }) {
  const mealColors = ["#c4ff00","#00cfff","#ffaa00","#ff5e8a","#aa88ff"];
  const color = mealColors[idx % mealColors.length];
  return (
    <div style={{background:C.bgCard,border:`1px solid ${isOpen?color:C.border}`,borderRadius:16,marginBottom:10,overflow:"hidden",transition:"border-color 0.2s"}}>
      <button onClick={onToggle} style={{width:"100%",padding:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",fontFamily:F}}>
        <div style={{textAlign:"left"}}>
          <div style={{fontSize:10,color:color,letterSpacing:2,fontWeight:700,marginBottom:4}}>{(meal.meal||"").toUpperCase()}</div>
          <div style={{fontSize:15,fontWeight:700,color:C.text}}>{meal.example?.split(",")[0]||meal.meal}</div>
          {(meal.calories||meal.protein)&&<div style={{fontSize:12,color:C.muted,marginTop:3}}>{meal.calories?`${meal.calories} kcal`:""}{meal.calories&&meal.protein?" · ":""}{meal.protein?`${meal.protein}g protein`:""}</div>}
        </div>
        <div style={{width:28,height:28,borderRadius:8,background:isOpen?color:C.bgDeep,border:`1px solid ${isOpen?color:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:isOpen?"#0a0a0a":C.muted,fontWeight:800,flexShrink:0,marginLeft:12,transition:"all 0.2s"}}>{isOpen?"−":"+"}</div>
      </button>
      {isOpen && (
        <div style={{padding:"0 16px 16px",borderTop:`1px solid ${C.border}`}}>
          <p style={{fontSize:14,color:C.muted,lineHeight:1.7,marginTop:14}}>{meal.example}</p>
        </div>
      )}
    </div>
  );
}

function LegacyMealCard({ mealKey, meal, isOpen, onToggle }) {
  const label = {breakfast:"Breakfast",lunch:"Lunch",dinner:"Dinner",snack:"Snack"}[mealKey]||mealKey;
  const colorMap = {breakfast:C.accent,lunch:"#00cfff",dinner:"#ffaa00",snack:"#aa88ff"};
  const color = colorMap[mealKey]||C.muted;
  return (
    <div style={{background:C.bgCard,border:`1px solid ${isOpen?color:C.border}`,borderRadius:16,marginBottom:10,overflow:"hidden",transition:"border-color 0.2s"}}>
      <button onClick={onToggle} style={{width:"100%",padding:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",fontFamily:F}}>
        <div style={{textAlign:"left"}}>
          <div style={{fontSize:10,color:color,letterSpacing:2,fontWeight:700,marginBottom:4}}>{label.toUpperCase()}</div>
          <div style={{fontSize:15,fontWeight:700,color:C.text}}>{meal.name}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:3}}>{meal.calories} kcal · {meal.protein}g protein</div>
        </div>
        <div style={{width:28,height:28,borderRadius:8,background:isOpen?color:C.bgDeep,border:`1px solid ${isOpen?color:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:isOpen?"#0a0a0a":C.muted,fontWeight:800,flexShrink:0,marginLeft:12,transition:"all 0.2s"}}>{isOpen?"−":"+"}</div>
      </button>
      {isOpen && (
        <div style={{padding:"0 16px 16px",borderTop:`1px solid ${C.border}`}}>
          {meal.ingredients?.length>0 && (
            <div style={{marginTop:14}}>
              <div style={{fontSize:9,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:8}}>INGREDIENTS</div>
              {meal.ingredients.map((ing,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:6}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:color,marginTop:6,flexShrink:0}}/>
                  <span style={{fontSize:13,color:C.muted}}>{ing}</span>
                </div>
              ))}
            </div>
          )}
          {meal.instructions && (
            <div style={{marginTop:14}}>
              <div style={{fontSize:9,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:8}}>HOW TO PREP</div>
              <p style={{fontSize:13,color:C.dim,lineHeight:1.65}}>{meal.instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

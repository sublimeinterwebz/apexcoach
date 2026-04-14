import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav, C } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan } from "../lib/firebase";

const F = "'Lexend', sans-serif";
const DAY_SHORT = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const TODAY_IDX = new Date().getDay()===0?6:new Date().getDay()-1;

const TYPE_COLOR = {
  strength:"#c4ff00", hypertrophy:"#00cfff", conditioning:"#ffaa00", recovery:"#aa88ff", rest:C.dim,
};

const BLOCK_META = {
  warmup:    { label:"Warm-Up",    color:"#ffaa00", bg:"rgba(255,170,0,0.08)" },
  main:      { label:"Main Lifts", color:"#c4ff00", bg:"rgba(196,255,0,0.08)" },
  accessory: { label:"Accessory",  color:"#00cfff", bg:"rgba(0,207,255,0.08)" },
  finisher:  { label:"Finisher",   color:"#ff5e8a", bg:"rgba(255,94,138,0.08)" },
  core:      { label:"Core",       color:"#aa88ff", bg:"rgba(170,136,255,0.08)" },
  cooldown:  { label:"Cooldown",   color:C.muted,   bg:"transparent" },
};

function getWeekDates() {
  const today = new Date(), dow = today.getDay();
  const mon   = new Date(today);
  mon.setDate(today.getDate() - (dow===0?6:dow-1));
  return Array.from({length:7}, (_,i) => { const d=new Date(mon); d.setDate(mon.getDate()+i); return d.getDate(); });
}

function flattenBlocks(blocks) {
  if (!blocks) return [];
  const result = [];
  for (const key of ["warmup","main","accessory","finisher","core","cooldown"]) {
    const items = blocks[key] || [];
    if (!items.length) continue;
    result.push({ isHeader:true, key, ...BLOCK_META[key] });
    for (const ex of items) result.push({ isHeader:false, key, ...ex, sets:ex.sets||null, reps:ex.reps||null, restSeconds:ex.restSeconds||(key==="main"?90:60) });
  }
  return result;
}

function getLoggable(flat) { return flat.filter(i => !i.isHeader && i.sets && i.reps); }
function buildSets(count)  { return Array.from({length:parseInt(count)||3}, () => ({weight:"",reps:"",done:false})); }

export default function Workout() {
  const router = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [weekPlan,    setWeekPlan]    = useState([]);
  const [planLoading, setPlanLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(TODAY_IDX);
  const [phase,       setPhase]       = useState("browse");
  const [exIdx,       setExIdx]       = useState(0);
  const [allSets,     setAllSets]     = useState([]);
  const [timer,       setTimer]       = useState(null);
  const [elapsed,     setElapsed]     = useState(0);
  const timerRef = useRef(null), elapsedRef = useRef(null);

  if (loading) return null;

  const weekDates = getWeekDates();

  useEffect(() => {
    if (!user) return;
    async function load() {
      setPlanLoading(true);
      try {
        const p = profile?.plan || await getWeekPlan(user.uid, profile?.currentWeek||1);
        if (p?.weekPlan) setWeekPlan(p.weekPlan);
      } catch(e) { console.error(e); }
      setPlanLoading(false);
    }
    load();
  }, [user]);

  const dayData  = weekPlan[selectedDay]||null;
  const flat     = flattenBlocks(dayData?.blocks);
  const loggable = getLoggable(flat);
  const curEx    = loggable[exIdx];
  const sets     = allSets[exIdx]||[];
  const allDone  = sets.length>0 && sets.every(s=>s.done);
  const isLast   = exIdx===loggable.length-1;

  useEffect(() => { if(loggable.length>0&&phase==="active") setAllSets(loggable.map(e=>buildSets(e.sets))); }, [loggable.length, phase]);
  useEffect(() => { if(phase!=="active")return; elapsedRef.current=setInterval(()=>setElapsed(e=>e+1),1000); return()=>clearInterval(elapsedRef.current); },[phase]);
  useEffect(() => { if(phase==="finished")clearInterval(elapsedRef.current); },[phase]);
  useEffect(() => {
    if(!timer){clearInterval(timerRef.current);return;}
    if(timer.seconds<=0){setTimer(null);return;}
    timerRef.current=setInterval(()=>setTimer(t=>{if(!t||t.seconds<=1){clearInterval(timerRef.current);return null;}return{...t,seconds:t.seconds-1};}),1000);
    return()=>clearInterval(timerRef.current);
  },[!!timer]);

  const updateSet   = (si,f,v) => setAllSets(p=>{const n=p.map(s=>[...s]);n[exIdx][si]={...n[exIdx][si],[f]:v};return n;});
  const completeSet = (si)     => { setAllSets(p=>{const n=p.map(s=>[...s]);n[exIdx][si]={...n[exIdx][si],done:true};return n;}); clearInterval(timerRef.current); setTimer({seconds:curEx?.restSeconds||60,initial:curEx?.restSeconds||60}); };
  const adjustTimer = d        => setTimer(t=>t?{...t,seconds:Math.max(5,t.seconds+d),initial:Math.max(5,t.seconds+d)}:null);
  const skipTimer   = ()       => { clearInterval(timerRef.current); setTimer(null); };
  const fmtTime     = s        => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const timerPct    = timer ? (timer.seconds/timer.initial)*100 : 0;
  const startWorkout= ()       => { setExIdx(0); setElapsed(0); setAllSets(loggable.map(e=>buildSets(e.sets))); setPhase("active"); };

  if (planLoading) return <Screen style={{alignItems:"center",justifyContent:"center"}}><Loader/></Screen>;

  if (phase==="finished") return <Screen><FinishedScreen allSets={allSets} loggable={loggable} elapsed={elapsed} fmtTime={fmtTime} router={router} onBrowse={()=>{setPhase("browse");}} /></Screen>;

  if (phase==="active"&&curEx) return (
    <Screen style={{height:"100vh",overflow:"hidden"}}>
      <ActiveScreen ex={curEx} exIdx={exIdx} loggable={loggable} sets={sets} allDone={allDone} isLast={isLast} elapsed={elapsed} timer={timer} timerPct={timerPct} fmtTime={fmtTime} updateSet={updateSet} completeSet={completeSet} adjustTimer={adjustTimer} skipTimer={skipTimer}
        onBack={()=>{setExIdx(i=>i-1);setTimer(null);}}
        onNext={()=>{isLast?setPhase("finished"):(setExIdx(i=>i+1),setTimer(null));}}
        onExit={()=>setPhase("browse")} />
    </Screen>
  );

  return (
    <Screen>
      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative",zIndex:1}}>
        {/* Header */}
        <div style={{padding:"52px 20px 24px"}}>
          <div style={{fontSize:11,color:C.muted,letterSpacing:3,fontWeight:600,marginBottom:6}}>APEXCOACH</div>
          <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5}}>WEEKLY <span style={{color:C.accent}}>SCHEDULE</span></div>
        </div>

        {/* Day strip */}
        {weekPlan.length>0 && (
          <div style={{display:"flex",gap:8,padding:"0 20px 20px"}}>
            {weekPlan.map((day,i)=>{
              const isSelected=i===selectedDay, isToday=i===TODAY_IDX;
              const isRest=!day||day.type==="rest"||day.type==="recovery";
              const tc=day?(TYPE_COLOR[day.type]||C.accent):C.dim;
              return (
                <button key={i} onClick={()=>setSelectedDay(i)} style={{flex:1,padding:"10px 0 8px",borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:isSelected?C.accent:C.bgCard,border:`1.5px solid ${isSelected?C.accent:C.border}`,cursor:"pointer",transition:"all 0.18s"}}>
                  <span style={{fontSize:9,letterSpacing:1,fontWeight:700,color:isSelected?"#0a0a0a":C.muted}}>{DAY_SHORT[i]}</span>
                  <span style={{fontSize:18,fontWeight:800,color:isSelected?"#0a0a0a":C.text,lineHeight:1}}>{weekDates[i]}</span>
                  <div style={{width:5,height:5,borderRadius:"50%",background:isSelected?"rgba(0,0,0,0.35)":isRest?C.border:tc}}/>
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div style={{flex:1,padding:"0 20px",overflowY:"auto",paddingBottom:90}}>
          {!dayData ? (
            <div style={{textAlign:"center",padding:"40px 0",color:C.dim,fontSize:14}}>No plan yet. Generate from dashboard.</div>
          ) : dayData.type==="rest"||dayData.type==="recovery" ? (
            <RestView day={dayData} flat={flat} isToday={selectedDay===TODAY_IDX} />
          ) : (
            <WorkoutView day={dayData} flat={flat} loggable={loggable} isToday={selectedDay===TODAY_IDX} onStart={startWorkout} router={router} />
          )}
        </div>
      </div>
      <BottomNav active="workout" router={router} />
    </Screen>
  );
}

function RestView({ day, flat, isToday }) {
  const mobility = [...(day.blocks?.warmup||[]),...(day.blocks?.cooldown||[])];
  return (
    <div>
      <div style={{background:C.bgCard,borderRadius:20,padding:22,border:`1px solid ${C.border}`,marginBottom:14}}>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <span style={{background:C.bgDeep,color:C.muted,fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,letterSpacing:1}}>REST</span>
          <span style={{background:"transparent",border:`1.5px solid ${C.border}`,color:C.dim,fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:20,letterSpacing:1}}>RECOVERY</span>
        </div>
        <div style={{fontSize:36,fontWeight:900,color:C.muted,lineHeight:1,letterSpacing:-1,marginBottom:6}}>REST<br/>DAY</div>
        <div style={{fontSize:13,color:C.dim}}>{isToday?"Today is a rest day.":"Rest day."} Recovery is part of the process.</div>
      </div>
      {mobility.length>0 && (
        <div style={{background:C.bgCard,borderRadius:20,padding:20,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:14}}>RECOMMENDED MOBILITY</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {mobility.map((ex,i)=>(
              <div key={i} style={{padding:"12px 14px",background:C.bgDeep,borderRadius:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:14,fontWeight:600,color:C.text}}>{ex.name}</div>
                {(ex.details||ex.duration)&&<div style={{fontSize:12,color:C.muted,marginTop:3}}>{ex.details||ex.duration}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutView({ day, flat, loggable, isToday, onStart }) {
  const tc = TYPE_COLOR[day.type]||C.accent;
  return (
    <div>
      <div style={{background:C.bgCard,borderRadius:20,padding:20,border:`1px solid ${C.border}`,marginBottom:14}}>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <span style={{background:C.accent,color:"#0a0a0a",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,letterSpacing:1}}>{(day.type||"STRENGTH").toUpperCase()}</span>
          <span style={{background:"transparent",border:`1.5px solid ${C.border}`,color:C.muted,fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:20,letterSpacing:1}}>{day.estimatedDuration}</span>
        </div>
        <div style={{fontSize:30,fontWeight:900,color:C.white,lineHeight:1.05,letterSpacing:-0.5,marginBottom:6}}>{day.focus||day.sessionLabel}</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{day.muscleGroups} · {loggable.length} logged exercises</div>
        {isToday ? (
          <button onClick={onStart} style={{width:"100%",padding:"15px",background:C.accent,border:"none",borderRadius:14,fontFamily:F,fontSize:14,fontWeight:800,color:"#0a0a0a",cursor:"pointer",letterSpacing:0.5}}>START WORKOUT</button>
        ) : (
          <div style={{fontSize:12,color:C.dim,fontStyle:"italic",textAlign:"center"}}>Tap START WORKOUT on today's session</div>
        )}
      </div>

      {/* All blocks */}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {flat.map((item,i) => item.isHeader ? (
          <div key={i} style={{fontSize:10,letterSpacing:2.5,fontWeight:700,color:item.color,marginTop:i===0?0:14,paddingBottom:8,borderBottom:`1px solid ${item.color}22`}}>{item.label.toUpperCase()}</div>
        ) : (
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{item.name}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{item.sets&&item.reps?`${item.sets} sets · ${item.reps} reps`:item.duration||item.details||""}</div>
              {item.notes&&<div style={{fontSize:11,color:C.dim,marginTop:2,fontStyle:"italic"}}>{item.notes}</div>}
            </div>
            {item.restSeconds&&item.sets&&<div style={{fontSize:11,color:C.dim,flexShrink:0}}>{item.restSeconds}s</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveScreen({ ex, exIdx, loggable, sets, allDone, isLast, elapsed, timer, timerPct, fmtTime, updateSet, completeSet, adjustTimer, skipTimer, onBack, onNext, onExit }) {
  const bm = BLOCK_META[ex.key]||{label:"Exercise",color:C.accent};
  return (
    <>
      <div style={{padding:"44px 20px 0",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <button onClick={onExit} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 14px",color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F,letterSpacing:0.5}}>EXIT</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:10,color:bm.color,letterSpacing:2.5,fontWeight:700}}>{bm.label.toUpperCase()}</div>
            <div style={{fontSize:20,fontWeight:800,color:C.muted,letterSpacing:2}}>{fmtTime(elapsed)}</div>
          </div>
          <div style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:10,padding:"6px 14px",fontSize:12,fontWeight:700,color:C.accent,fontFamily:F}}>{exIdx+1}/{loggable.length}</div>
        </div>
        <div style={{display:"flex",gap:3,marginBottom:20}}>
          {loggable.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:3,background:i<exIdx?"#5a8a00":i===exIdx?C.accent:C.border,transition:"background 0.3s"}}/>)}
        </div>
      </div>

      <div style={{padding:"0 20px 10px",position:"relative",zIndex:1}}>
        <div style={{fontSize:10,color:bm.color,letterSpacing:2.5,fontWeight:700,marginBottom:4}}>{bm.label.toUpperCase()}</div>
        <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5,lineHeight:1,marginBottom:4}}>{ex.name}</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:ex.notes?4:0}}>Target: {ex.reps} reps · {ex.restSeconds}s rest</div>
        {ex.notes&&<div style={{fontSize:12,color:C.dim,fontStyle:"italic"}}>{ex.notes}</div>}
      </div>

      <div style={{display:"flex",padding:"0 20px",marginBottom:8,position:"relative",zIndex:1}}>
        <div style={{width:28,fontSize:9,color:C.dim,letterSpacing:2,fontWeight:600}}>SET</div>
        <div style={{flex:1,fontSize:9,color:C.dim,letterSpacing:2,fontWeight:600,textAlign:"center"}}>KG</div>
        <div style={{flex:1,fontSize:9,color:C.dim,letterSpacing:2,fontWeight:600,textAlign:"center"}}>REPS</div>
        <div style={{width:44}}/>
      </div>

      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:8,flex:1,position:"relative",zIndex:1}}>
        {sets.map((s,si)=>{
          const isActive=!s.done&&sets.slice(0,si).every(x=>x.done), canLog=s.weight!==""&&s.reps!=="";
          return (
            <div key={si} style={{display:"flex",alignItems:"center",gap:8,padding:"10px",borderRadius:14,background:s.done?C.accentDim:isActive?C.bgCard:C.bgDeep,border:`1.5px solid ${s.done?C.accent:isActive?C.borderMid:C.border}`,boxSizing:"border-box",transition:"all 0.2s"}}>
              <div style={{width:22,height:22,borderRadius:7,flexShrink:0,background:s.done?C.accent:C.bgDeep,border:`1.5px solid ${s.done?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:s.done?"#0a0a0a":C.dim}}>{si+1}</div>
              <input type="number" placeholder="—" value={s.weight} disabled={s.done||!isActive} onChange={e=>updateSet(si,"weight",e.target.value)} style={{flex:1,minWidth:0,width:0,background:"transparent",border:"none",borderRadius:0,padding:"4px 0",color:s.done?C.accent:isActive?C.white:C.dim,fontSize:22,fontFamily:F,fontWeight:800,textAlign:"center",outline:"none"}}/>
              <div style={{width:1,height:18,background:C.border,flexShrink:0}}/>
              <input type="number" placeholder="—" value={s.reps} disabled={s.done||!isActive} onChange={e=>updateSet(si,"reps",e.target.value)} style={{flex:1,minWidth:0,width:0,background:"transparent",border:"none",borderRadius:0,padding:"4px 0",color:s.done?C.accent:isActive?C.white:C.dim,fontSize:22,fontFamily:F,fontWeight:800,textAlign:"center",outline:"none"}}/>
              <button onClick={()=>!s.done&&isActive&&canLog&&completeSet(si)} style={{width:38,height:38,minWidth:38,borderRadius:10,flexShrink:0,background:s.done?C.accent:isActive&&canLog?C.accentDim:C.bgDeep,border:`1.5px solid ${s.done?C.accent:isActive&&canLog?C.accentBorder:C.border}`,color:s.done?"#0a0a0a":isActive&&canLog?C.accent:C.dim,fontSize:16,cursor:isActive&&canLog&&!s.done?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontFamily:F}}>{s.done?"✓":"○"}</button>
            </div>
          );
        })}
      </div>

      <div style={{padding:"12px 20px 30px",position:"relative",zIndex:1}}>
        <div style={{display:"flex",gap:10}}>
          {exIdx>0&&<button onClick={onBack} style={{padding:"14px 18px",borderRadius:14,background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>Back</button>}
          <button onClick={allDone?onNext:undefined} style={{flex:1,padding:"15px",background:allDone?C.accent:C.bgCard,border:`1.5px solid ${allDone?C.accent:C.border}`,borderRadius:14,color:allDone?"#0a0a0a":C.dim,fontSize:14,fontWeight:800,cursor:allDone?"pointer":"default",fontFamily:F,transition:"all 0.2s",letterSpacing:0.3}}>
            {allDone?(isLast?"FINISH WORKOUT":"NEXT EXERCISE"):`Complete all ${ex.sets} sets`}
          </button>
        </div>
      </div>

      {timer && (
        <div style={{position:"absolute",inset:0,background:"rgba(17,18,20,0.95)",backdropFilter:"blur(20px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:20}}>
          <div style={{fontSize:10,color:C.accent,letterSpacing:3,fontWeight:700,marginBottom:16}}>REST TIMER</div>
          <div style={{position:"relative",width:180,height:180,marginBottom:28}}>
            <svg width="180" height="180" style={{transform:"rotate(-90deg)",position:"absolute"}}>
              <circle cx="90" cy="90" r="80" fill="none" stroke={C.border} strokeWidth="6"/>
              <circle cx="90" cy="90" r="80" fill="none" stroke={C.accent} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2*Math.PI*80}`} strokeDashoffset={`${2*Math.PI*80*(1-timerPct/100)}`} style={{transition:"stroke-dashoffset 1s linear"}}/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:56,fontWeight:900,color:C.white,letterSpacing:-2,lineHeight:1}}>{fmtTime(timer.seconds)}</div>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginTop:4}}>SECONDS</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
            <button onClick={()=>adjustTimer(-20)} style={{width:56,height:56,borderRadius:14,background:C.bgCard,border:`1px solid ${C.border}`,color:C.text,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:F}}>-20</button>
            <div style={{fontSize:9,color:C.dim,letterSpacing:2}}>ADJUST</div>
            <button onClick={()=>adjustTimer(20)} style={{width:56,height:56,borderRadius:14,background:C.bgCard,border:`1px solid ${C.border}`,color:C.text,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:F}}>+20</button>
          </div>
          <button onClick={skipTimer} style={{padding:"12px 36px",borderRadius:14,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>SKIP REST</button>
        </div>
      )}
    </>
  );
}

function FinishedScreen({ allSets, elapsed, fmtTime, router, onBrowse }) {
  const totalSets = allSets.reduce((a,s)=>a+s.filter(x=>x.done).length,0);
  const totalVol  = allSets.reduce((a,sets)=>a+sets.filter(s=>s.done&&s.weight&&s.reps).reduce((b,s)=>b+(parseFloat(s.weight)*parseInt(s.reps)),0),0);
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",position:"relative",zIndex:1}}>
      <div style={{fontSize:11,color:C.accent,letterSpacing:3,fontWeight:700,marginBottom:12}}>WORKOUT COMPLETE</div>
      <div style={{fontSize:52,fontWeight:900,color:C.white,textAlign:"center",lineHeight:1,letterSpacing:-2,marginBottom:32}}>SESSION<br/><span style={{color:C.accent}}>CRUSHED</span></div>
      <div style={{display:"flex",gap:12,width:"100%",marginBottom:32}}>
        {[{label:"DURATION",value:fmtTime(elapsed),unit:""},{label:"SETS",value:totalSets,unit:"done"},{label:"VOLUME",value:Math.round(totalVol).toLocaleString(),unit:"kg"}].map(({label,value,unit})=>(
          <div key={label} style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 10px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:900,color:C.accent,letterSpacing:-0.5}}>{value}<span style={{fontSize:11,color:C.dim,fontWeight:500}}> {unit}</span></div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:2,fontWeight:600,marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
      <button onClick={()=>router.push("/dashboard")} style={{width:"100%",padding:"16px",background:C.accent,border:"none",borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,color:"#0a0a0a",cursor:"pointer",letterSpacing:0.5,marginBottom:12}}>BACK TO DASHBOARD</button>
      <button onClick={onBrowse} style={{width:"100%",padding:"14px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:14,fontFamily:F,fontSize:14,fontWeight:600,color:C.muted,cursor:"pointer"}}>View Week Schedule</button>
    </div>
  );
}

function Loader() {
  return (
    <>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${C.border}`,borderTopColor:C.accent,animation:"spin 0.9s linear infinite"}}/>
    </>
  );
}

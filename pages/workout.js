import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav, C } from "../components/shared";
import { ExerciseRow, ExercisePicker, ExerciseConfigSheet, BLOCK_COLORS, BLOCK_LABELS, Icon, Button } from "../components/ui";
import ExerciseGif from "../components/ExerciseGif";
import { useRequireAuth } from "../lib/useRequireAuth";
import { getWeekPlan, saveWorkoutLog, saveWeekFeedback, getWorkoutLog, applyPlanEdit } from "../lib/firebase";
import { DAY_SHORT, DAY_NAMES, TODAY_SLOT, buildDaySlots, resolveArrayIdx, getWeekDates } from "../lib/dayMapping";

const F = "var(--font-lexend), sans-serif";
const TODAY_IDX = TODAY_SLOT();

const TYPE_COLOR = {
  strength:"#c4ff00", hypertrophy:"#00cfff", conditioning:"#ffaa00", recovery:"#aa88ff", rest:C.dim,
};

const BLOCK_META = {
  warmup:    { label:"Warm-Up",    color:"#ffaa00" },
  main:      { label:"Main Lifts", color:"#c4ff00" },
  accessory: { label:"Accessory",  color:"#00cfff" },
  finisher:  { label:"Finisher",   color:"#ff5e8a" },
  core:      { label:"Core",       color:"#aa88ff" },
  cooldown:  { label:"Cooldown",   color:C.muted   },
};

// Resolves any plan entry to its canonical Sun→Sat slot index (0=Sun .. 6=Sat).
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

function getLoggable(flat) { return flat.filter(i => !i.isHeader); } // all blocks included
function buildSets(count)  { return Array.from({length:parseInt(count)||3}, () => ({weight:"",reps:"",done:false})); }
// Simple exercises (warmup/cooldown) just need one "done" flag
function isSimpleEx(ex) { return !ex.sets && !ex.reps; }

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
  const [workoutLog,  setWorkoutLog]  = useState(null); // saved after finish
  const [completedLog, setCompletedLog] = useState(null);  // existing log from Firestore
  const [pickerState,  setPickerState]  = useState({ open: false, mode: null, block: null, exerciseIndex: null, dayIndex: null });
  const [configState,  setConfigState]  = useState({ open: false, mode: null, block: null, exerciseIndex: null, dayIndex: null, exerciseName: "", initial: null });
  const timerRef = useRef(null), elapsedRef = useRef(null);

  // Sync from dashboard ?day= param
  useEffect(() => {
    if (typeof router.query.day !== "undefined") {
      setSelectedDay(parseInt(router.query.day));
    }
  }, [router.query.day]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setPlanLoading(true);
      try {
        const week = profile?.currentWeek || 1;
        // Fast render from profile cache (may be stale)
        if (profile?.plan?.weekPlan) setWeekPlan(profile.plan.weekPlan);
        // Source of truth from Firestore
        const [p, existingLog] = await Promise.all([
          getWeekPlan(user.uid, week),
          getWorkoutLog(user.uid, week, TODAY_IDX),
        ]);
        if (p?.weekPlan) setWeekPlan(p.weekPlan);
        if (existingLog) setCompletedLog(existingLog);
      } catch(e) { console.error(e); }
      setPlanLoading(false);
    }
    load();
  }, [user, profile?.currentWeek]);

  if (loading) return null;

  const weekDates = getWeekDates();
  const daySlots  = buildDaySlots(weekPlan);
  const dayData   = daySlots[selectedDay] || null;
  const flat      = flattenBlocks(dayData?.blocks);
  const loggable  = getLoggable(flat);
  const curEx     = loggable[exIdx];
  const sets      = allSets[exIdx] || [];
  const isSimple  = isSimpleEx(curEx || {});
  const allDone   = isSimple
    ? (sets[0]?.done === true)
    : (sets.length > 0 && sets.every(s => s.done));
  const isLast    = exIdx === loggable.length - 1;

  useEffect(() => { if(loggable.length>0&&phase==="active") setAllSets(loggable.map(e=>isSimpleEx(e)?[{done:false}]:buildSets(e.sets))); }, [loggable.length, phase]);
  useEffect(() => { if(phase!=="active") return; elapsedRef.current=setInterval(()=>setElapsed(e=>e+1),1000); return()=>clearInterval(elapsedRef.current); }, [phase]);
  useEffect(() => { if(phase==="finished"||phase==="feedback") clearInterval(elapsedRef.current); }, [phase]);
  useEffect(() => {
    if(!timer){clearInterval(timerRef.current);return;}
    if(timer.seconds<=0){setTimer(null);return;}
    timerRef.current=setInterval(()=>setTimer(t=>{if(!t||t.seconds<=1){clearInterval(timerRef.current);return null;}return{...t,seconds:t.seconds-1};}),1000);
    return()=>clearInterval(timerRef.current);
  }, [!!timer]);

  // ── Plan edits (add/replace/remove/reorder) ──────────────
  const persistPlanEdit = async (newWeekPlan, editRecord) => {
    if (!user) return;
    const week = profile?.currentWeek || 1;
    const fullPlan = { ...(profile?.plan || {}), weekPlan: newWeekPlan };
    setWeekPlan(newWeekPlan); // optimistic
    try {
      await applyPlanEdit(user.uid, week, fullPlan, editRecord);
    } catch(e) { console.error("plan edit save failed:", e); }
  };

  const handleRemoveExercise = (dayIdx, blockKey, exerciseIdx) => {
    const realIdx = resolveArrayIdx(weekPlan, dayIdx);
    const day = weekPlan[realIdx];
    if (!day?.blocks?.[blockKey]) return;
    const removed = day.blocks[blockKey][exerciseIdx];
    const newBlocks = { ...day.blocks, [blockKey]: day.blocks[blockKey].filter((_, i) => i !== exerciseIdx) };
    const newWeek = weekPlan.map((d, i) => i === realIdx ? { ...d, blocks: newBlocks } : d);
    persistPlanEdit(newWeek, { type: "remove", day: day.dayName || day.day, block: blockKey, from: removed?.name });
  };

  const handleMoveExercise = (dayIdx, blockKey, fromIdx, direction) => {
    const realIdx = resolveArrayIdx(weekPlan, dayIdx);
    const day = weekPlan[realIdx];
    if (!day?.blocks?.[blockKey]) return;
    const arr = [...day.blocks[blockKey]];
    const toIdx = fromIdx + (direction === "up" ? -1 : 1);
    if (toIdx < 0 || toIdx >= arr.length) return;
    [arr[fromIdx], arr[toIdx]] = [arr[toIdx], arr[fromIdx]];
    const newBlocks = { ...day.blocks, [blockKey]: arr };
    const newWeek = weekPlan.map((d, i) => i === realIdx ? { ...d, blocks: newBlocks } : d);
    persistPlanEdit(newWeek, { type: "reorder", day: day.dayName || day.day, block: blockKey, note: `Moved ${arr[toIdx].name} ${direction}` });
  };

  const openPickerForReplace = (dayIdx, blockKey, exerciseIdx) => {
    setPickerState({ open: true, mode: "replace", block: blockKey, exerciseIndex: exerciseIdx, dayIndex: dayIdx });
  };
  const openPickerForAdd = (dayIdx, blockKey) => {
    setPickerState({ open: true, mode: "add", block: blockKey, exerciseIndex: null, dayIndex: dayIdx });
  };
  const closePicker = () => setPickerState({ open: false, mode: null, block: null, exerciseIndex: null, dayIndex: null });
  const closeConfig = () => setConfigState({ open: false, mode: null, block: null, exerciseIndex: null, dayIndex: null, exerciseName: "", initial: null });

  // "Edit details" on existing exercise → open config directly
  const openEditConfig = (dayIdx, blockKey, exerciseIdx) => {
    const realIdx = resolveArrayIdx(weekPlan, dayIdx);
    const ex = weekPlan[realIdx]?.blocks?.[blockKey]?.[exerciseIdx];
    if (!ex) return;
    setConfigState({
      open: true, mode: "edit",
      block: blockKey, exerciseIndex: exerciseIdx, dayIndex: dayIdx,
      exerciseName: ex.name,
      initial: ex,
    });
  };

  // User picked an exercise from the DB — close picker, open config sheet to set sets/reps
  const handlePick = (picked) => {
    const { mode, block, exerciseIndex, dayIndex } = pickerState;
    const realIdx = resolveArrayIdx(weekPlan, dayIndex);
    // For replace, pre-fill with the current exercise's sets/reps so user can keep or edit them
    const current = mode === "replace" ? weekPlan[realIdx]?.blocks?.[block]?.[exerciseIndex] : null;
    closePicker();
    setConfigState({
      open: true, mode,
      block, exerciseIndex, dayIndex,
      exerciseName: picked.name,
      initial: current ? { ...current, name: picked.name } : null,
    });
  };

  // Config sheet confirmed — write the exercise with its chosen sets/reps to the plan
  const handleConfigConfirm = (values) => {
    const { mode, block, exerciseIndex, dayIndex, exerciseName } = configState;
    const realIdx = resolveArrayIdx(weekPlan, dayIndex);
    const day = weekPlan[realIdx];
    if (!day) { closeConfig(); return; }

    if (mode === "edit") {
      const oldEx = day.blocks[block][exerciseIndex];
      const newEx = { ...oldEx, ...values };
      const newBlocks = { ...day.blocks, [block]: day.blocks[block].map((e, i) => i === exerciseIndex ? newEx : e) };
      const newWeek = weekPlan.map((d, i) => i === realIdx ? { ...d, blocks: newBlocks } : d);
      persistPlanEdit(newWeek, { type: "edit", day: day.dayName || day.day, block, from: oldEx.name, note: `Updated sets/reps for ${oldEx.name}` });
    } else if (mode === "replace") {
      const oldEx = day.blocks[block][exerciseIndex];
      const newEx = { name: exerciseName, ...values };
      const newBlocks = { ...day.blocks, [block]: day.blocks[block].map((e, i) => i === exerciseIndex ? newEx : e) };
      const newWeek = weekPlan.map((d, i) => i === realIdx ? { ...d, blocks: newBlocks } : d);
      persistPlanEdit(newWeek, { type: "swap", day: day.dayName || day.day, block, from: oldEx?.name, to: exerciseName });
    } else if (mode === "add") {
      const newEx = { name: exerciseName, ...values };
      const existing = day.blocks[block] || [];
      const newBlocks = { ...day.blocks, [block]: [...existing, newEx] };
      const newWeek = weekPlan.map((d, i) => i === realIdx ? { ...d, blocks: newBlocks } : d);
      persistPlanEdit(newWeek, { type: "add", day: day.dayName || day.day, block, to: exerciseName });
    }
    closeConfig();
  };

  const updateSet   = (si,f,v) => setAllSets(p=>{const n=p.map(s=>[...s]);n[exIdx][si]={...n[exIdx][si],[f]:v};return n;});
  const completeSet = (si) => {
    setAllSets(p=>{const n=p.map(s=>[...s]);n[exIdx][si]={...n[exIdx][si],done:true};return n;});
    clearInterval(timerRef.current);
    setTimer({seconds:curEx?.restSeconds||60,initial:curEx?.restSeconds||60});
  };
  const adjustTimer = d => setTimer(t=>t?{...t,seconds:Math.max(5,t.seconds+d),initial:Math.max(5,t.seconds+d)}:null);
  const skipTimer   = () => { clearInterval(timerRef.current); setTimer(null); };
  const fmtTime     = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const timerPct    = timer ? (timer.seconds/timer.initial)*100 : 0;

  const startWorkout = () => {
    setExIdx(0); setElapsed(0);
    setAllSets(loggable.map(e=>isSimpleEx(e)?[{done:false}]:buildSets(e.sets)));
    setPhase("active");
  };

  // Called when user finishes last exercise
  const finishWorkout = async (finalSets, finalElapsed) => {
    const week = profile?.currentWeek || 1;

    // Build the log object
    const totalSets = finalSets.reduce((a,s)=>a+s.filter(x=>x.done).length, 0);
    const totalVol  = finalSets.reduce((a,sets)=>a+sets.filter(s=>s.done&&s.weight&&s.reps).reduce((b,s)=>b+(parseFloat(s.weight)*parseInt(s.reps)),0), 0);

    const log = {
      dayIndex:    selectedDay,
      dayName:     dayData?.dayName || DAY_SHORT[selectedDay],
      sessionLabel:dayData?.focus   || dayData?.sessionLabel || "",
      type:        dayData?.type    || "strength",
      durationSecs:finalElapsed,
      totalSets,
      totalVolume: Math.round(totalVol),
      exercises: loggable.map((ex, i) => ({
        name:  ex.name,
        block: ex.key,
        sets:  (finalSets[i] || []).map(s => ({
          weight: parseFloat(s.weight) || 0,
          reps:   parseInt(s.reps)    || 0,
          done:   s.done,
        })),
      })),
      completedAt: new Date().toISOString(),
    };

    // Save to Firestore (non-blocking — don't await, let it happen in background)
    if (user) {
      saveWorkoutLog(user.uid, week, selectedDay, log).catch(e => console.error("Log save error:", e));
    }

    setWorkoutLog(log);
    setPhase("finished");
  };

  if (planLoading) return (
    <Screen style={{alignItems:"center",justifyContent:"center"}}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${C.border}`,borderTopColor:C.accent,animation:"spin 0.9s linear infinite"}}/>
    </Screen>
  );

  if (phase==="finished") return (
    <Screen>
      <FinishedScreen allSets={allSets} elapsed={elapsed} fmtTime={fmtTime}
        onFeedback={() => setPhase("feedback")} />
    </Screen>
  );

  if (phase==="feedback") return (
    <Screen>
      <FeedbackScreen
        user={user}
        profile={profile}
        workoutLog={workoutLog}
        weekPlan={weekPlan}
        onDone={() => router.push("/dashboard")}
      />
    </Screen>
  );

  if (phase==="active" && curEx) return (
    <Screen style={{height:"100vh",overflow:"hidden"}}>
      <style>{`input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;} input:focus{outline:none;}`}</style>
      <ActiveScreen
        ex={curEx} exIdx={exIdx} loggable={loggable} sets={sets}
        allDone={allDone} isLast={isLast} isSimple={isSimple} elapsed={elapsed}
        timer={timer} timerPct={timerPct} fmtTime={fmtTime}
        updateSet={updateSet} completeSet={completeSet}
        markSimpleDone={() => setAllSets(p=>{ const n=p.map(s=>[...s]); n[exIdx][0]={done:true}; return n; })}
        adjustTimer={adjustTimer} skipTimer={skipTimer}
        onBack={() => { setExIdx(i=>i-1); setTimer(null); }}
        onNext={() => {
          if (isLast) {
            finishWorkout(allSets, elapsed);
          } else {
            setExIdx(i=>i+1);
            setTimer(null);
          }
        }}
        onExit={() => setPhase("browse")}
      />
    </Screen>
  );

  // ── BROWSE VIEW ───────────────────────────────────────
  return (
    <Screen>
      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative",zIndex:1}}>
        <div style={{padding:"52px 20px 24px"}}>
          <div style={{fontSize:11,color:C.muted,letterSpacing:3,fontWeight:600,marginBottom:6}}>APEXCOACH</div>
          <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5}}>WEEKLY <span style={{color:C.accent}}>SCHEDULE</span></div>
        </div>

        {weekPlan.length > 0 && (
          <div style={{display:"flex",gap:8,padding:"0 20px 20px"}}>
            {DAY_SHORT.map((label,i) => {
              const day = daySlots[i] || null;
              const isSelected=i===selectedDay, isToday=i===TODAY_IDX;
              const isRest=!day||(day.type||"").toLowerCase().includes("rest")||(day.type||"").toLowerCase().includes("recovery");
              const tc=day?(TYPE_COLOR[day.type]||C.accent):C.dim;
              return (
                <button key={i} onClick={()=>setSelectedDay(i)} style={{flex:1,padding:"10px 0 8px",borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:isSelected?C.accent:C.bgCard,border:`1.5px solid ${isSelected?C.accent:C.border}`,cursor:"pointer",transition:"all 0.18s"}}>
                  <span style={{fontSize:9,letterSpacing:1,fontWeight:700,color:isSelected?"#0a0a0a":C.muted}}>{label}</span>
                  <span style={{fontSize:18,fontWeight:800,color:isSelected?"#0a0a0a":C.text,lineHeight:1}}>{weekDates[i]}</span>
                  <div style={{width:5,height:5,borderRadius:"50%",background:isSelected?"rgba(0,0,0,0.35)":isRest?C.border:tc}}/>
                </button>
              );
            })}
          </div>
        )}

        <div style={{flex:1,padding:"0 20px",overflowY:"auto",paddingBottom:110}}>
          {!dayData ? (
            <div style={{textAlign:"center",padding:"40px 0",color:C.dim,fontSize:14}}>No plan yet. Generate from dashboard.</div>
          ) : (dayData.type||"").toLowerCase().includes("rest")||(dayData.type||"").toLowerCase().includes("recovery") ? (
            <RestView day={dayData} isToday={selectedDay===TODAY_IDX} />
          ) : (
            <WorkoutView
              day={dayData}
              dayIndex={selectedDay}
              flat={flat}
              loggable={loggable}
              isToday={selectedDay===TODAY_IDX}
              onStart={startWorkout}
              completedLog={selectedDay===TODAY_IDX ? completedLog : null}
              onRemove={handleRemoveExercise}
              onReplace={openPickerForReplace}
              onAdd={openPickerForAdd}
              onEdit={openEditConfig}
              onMoveUp={(dIdx,block,exIdx) => handleMoveExercise(dIdx,block,exIdx,"up")}
              onMoveDown={(dIdx,block,exIdx) => handleMoveExercise(dIdx,block,exIdx,"down")}
            />
          )}
        </div>
      </div>
      <BottomNav active="workout" router={router} />
      <ExercisePicker
        isOpen={pickerState.open}
        onClose={closePicker}
        onPick={handlePick}
        title={pickerState.mode === "replace" ? "Replace Exercise" : "Add Exercise"}
      />
      <ExerciseConfigSheet
        isOpen={configState.open}
        onClose={closeConfig}
        onConfirm={handleConfigConfirm}
        exerciseName={configState.exerciseName}
        blockKey={configState.block}
        initial={configState.initial}
        title={
          configState.mode === "edit"    ? "Edit Details" :
          configState.mode === "replace" ? "Configure Replacement" :
          "Add to Workout"
        }
        confirmLabel={configState.mode === "add" ? "Add Exercise" : "Save"}
      />
    </Screen>
  );
}

// ── Rest View ──────────────────────────────────────────
function RestView({ day, isToday }) {
  const mobility = [...(day.blocks?.warmup||[]),...(day.blocks?.cooldown||[])];
  return (
    <div>
      <div style={{background:C.bgCard,borderRadius:20,padding:22,border:`1px solid ${C.border}`,marginBottom:14}}>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <span style={{background:C.bgDeep,color:C.muted,fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,letterSpacing:1}}>REST</span>
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

// ── Workout View (preview) ─────────────────────────────
function WorkoutView({ day, dayIndex, flat, loggable, isToday, onStart, completedLog, onRemove, onReplace, onAdd, onEdit, onMoveUp, onMoveDown }) {
  const isCompleted = !!completedLog;

  // Group exercises by block for editing
  const blocks = day?.blocks || {};
  const blockOrder = ["warmup","main","accessory","finisher","core","cooldown"];

  return (
    <div>
      <div style={{background:C.bgCard,borderRadius:20,padding:20,border:`1.5px solid ${isCompleted?"#5a8a00":C.border}`,marginBottom:14}}>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <span style={{background:isCompleted?"#5a8a00":C.accent,color:"#0a0a0a",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,letterSpacing:1}}>{isCompleted?"COMPLETED":(day.type||"STRENGTH").toUpperCase()}</span>
          <span style={{background:"transparent",border:`1.5px solid ${C.border}`,color:C.muted,fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:20,letterSpacing:1}}>{day.estimatedDuration}</span>
        </div>
        <div style={{fontSize:30,fontWeight:900,color:C.white,lineHeight:1.05,letterSpacing:-0.5,marginBottom:6}}>{day.focus||day.sessionLabel}</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{day.muscleGroups} · {loggable.length} exercises</div>

        {isCompleted ? (
          <div style={{background:C.bgDeep,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:10,color:"#5a8a00",letterSpacing:2.5,fontWeight:700,marginBottom:10}}>SESSION LOGGED</div>
            <div style={{display:"flex",gap:8}}>
              {[
                {label:"SETS",     value:completedLog.totalSets || "—"},
                {label:"VOLUME",   value:completedLog.totalVolume ? `${completedLog.totalVolume}kg` : "—"},
                {label:"DURATION", value:completedLog.durationSecs ? `${Math.floor(completedLog.durationSecs/60)}min` : "—"},
              ].map(({label,value}) => (
                <div key={label} style={{flex:1,textAlign:"center",background:C.bgCard,borderRadius:10,padding:"10px 6px"}}>
                  <div style={{fontSize:16,fontWeight:800,color:"#7acc00"}}>{value}</div>
                  <div style={{fontSize:9,color:C.dim,letterSpacing:1.5,fontWeight:600,marginTop:3}}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : isToday ? (
          <button onClick={onStart} style={{width:"100%",padding:"15px",background:C.accent,border:"none",borderRadius:14,fontFamily:F,fontSize:14,fontWeight:800,color:"#0a0a0a",cursor:"pointer",letterSpacing:0.5}}>START WORKOUT</button>
        ) : (
          <div style={{fontSize:12,color:C.dim,fontStyle:"italic",textAlign:"center",padding:"4px 0"}}>Navigate to today's session to start</div>
        )}
      </div>

      {/* Editable block sections */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {blockOrder.map(blockKey => {
          const exercises = blocks[blockKey] || [];
          const meta = BLOCK_META[blockKey];
          if (!meta) return null;

          // Don't render empty blocks unless they're main/accessory (to allow adding)
          if (exercises.length === 0 && !["main","accessory","core"].includes(blockKey)) return null;

          return (
            <div key={blockKey}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:10,letterSpacing:2.5,fontWeight:700,color:meta.color,paddingBottom:4}}>
                  {meta.label.toUpperCase()}
                </div>
                {!isCompleted && (
                  <button
                    onClick={() => onAdd(dayIndex, blockKey)}
                    style={{
                      background:"transparent", border:`1px dashed ${meta.color}44`,
                      color:meta.color, fontSize:10, fontWeight:700, letterSpacing:0.5,
                      padding:"4px 10px", borderRadius:14, cursor:"pointer",
                      fontFamily:F, display:"flex", alignItems:"center", gap:4,
                    }}
                  >
                    <Icon name="plus" size={11} color={meta.color}/>
                    ADD
                  </button>
                )}
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {exercises.length === 0 ? (
                  <div style={{padding:"16px 12px",background:C.bgCard,border:`1px dashed ${C.border}`,borderRadius:12,textAlign:"center"}}>
                    <div style={{fontSize:12,color:C.dim,fontStyle:"italic"}}>No exercises in this block</div>
                  </div>
                ) : exercises.map((ex, idx) => (
                  <ExerciseRow
                    key={`${blockKey}-${idx}-${ex.name}`}
                    exercise={ex}
                    index={idx}
                    blockColor={meta.color}
                    editable={!isCompleted}
                    reorderable={exercises.length > 1}
                    showGif={true}
                    isFirst={idx === 0}
                    isLast={idx === exercises.length - 1}
                    onReplace={() => onReplace(dayIndex, blockKey, idx)}
                    onRemove={() => onRemove(dayIndex, blockKey, idx)}
                    onEdit={() => onEdit(dayIndex, blockKey, idx)}
                    onMoveUp={() => onMoveUp(dayIndex, blockKey, idx)}
                    onMoveDown={() => onMoveDown(dayIndex, blockKey, idx)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Active Screen ──────────────────────────────────────
function ActiveScreen({ ex, exIdx, loggable, sets, allDone, isLast, isSimple, elapsed, timer, timerPct, fmtTime, updateSet, completeSet, markSimpleDone, adjustTimer, skipTimer, onBack, onNext, onExit }) {
  const bm = BLOCK_META[ex.key] || { label:"Exercise", color:C.accent };
  return (
    <>
      {/* Header */}
      <div style={{padding:"44px 20px 0",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <button onClick={onExit} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 14px",color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>EXIT</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:10,color:bm.color,letterSpacing:2.5,fontWeight:700}}>{bm.label.toUpperCase()}</div>
            <div style={{fontSize:20,fontWeight:800,color:C.muted}}>{fmtTime(elapsed)}</div>
          </div>
          <div style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:10,padding:"6px 14px",fontSize:12,fontWeight:700,color:C.accent,fontFamily:F}}>{exIdx+1}/{loggable.length}</div>
        </div>
        <div style={{display:"flex",gap:3,marginBottom:20}}>
          {loggable.map((item,i) => {
            const c2 = (BLOCK_META[item.key]||{color:C.accent}).color;
            return <div key={i} style={{flex:1,height:3,borderRadius:3,background:i<exIdx?"#5a8a00":i===exIdx?c2:C.border,transition:"background 0.3s"}}/>;
          })}
        </div>
      </div>

      {/* Exercise info */}
      <div style={{padding:"0 20px 16px",position:"relative",zIndex:1}}>
        <div style={{fontSize:10,color:bm.color,letterSpacing:2.5,fontWeight:700,marginBottom:4}}>{bm.label.toUpperCase()}</div>
        <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5,lineHeight:1.1,marginBottom:6}}>{ex.name}</div>
        {isSimple ? (
          <div style={{fontSize:14,color:C.muted}}>{ex.details || ex.duration || ""}</div>
        ) : (
          <>
            <div style={{fontSize:13,color:C.muted,marginBottom:ex.notes?4:0}}>Target: {ex.reps} reps · {ex.restSeconds}s rest</div>
            {ex.notes && <div style={{fontSize:12,color:C.dim,fontStyle:"italic"}}>{ex.notes}</div>}
          </>
        )}
        {/* Form demo GIF — lazy loaded on demand */}
        <div style={{marginTop:8}}>
          <ExerciseGif key={ex.name} exerciseName={ex.name} />
        </div>
      </div>

      {/* SIMPLE: big tap-to-complete circle */}
      {isSimple ? (
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",position:"relative",zIndex:1}}>
          <div
            onClick={() => !allDone && markSimpleDone()}
            style={{
              width:140,height:140,borderRadius:"50%",cursor:allDone?"default":"pointer",
              background:allDone?C.accent:C.bgCard,
              border:`3px solid ${allDone?C.accent:C.borderMid}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:52,transition:"all 0.25s",marginBottom:16,
            }}>
            {allDone ? "✓" : "○"}
          </div>
          <div style={{fontSize:13,color:allDone?C.accent:C.muted,fontWeight:600,letterSpacing:1.5}}>
            {allDone ? "DONE" : "TAP WHEN COMPLETE"}
          </div>
        </div>
      ) : (
        /* LOGGED: weight + reps per set */
        <>
          <div style={{display:"flex",padding:"0 20px",marginBottom:8,position:"relative",zIndex:1}}>
            <div style={{width:28,fontSize:9,color:C.dim,letterSpacing:2,fontWeight:600}}>SET</div>
            <div style={{flex:1,fontSize:9,color:C.dim,letterSpacing:2,fontWeight:600,textAlign:"center"}}>KG</div>
            <div style={{flex:1,fontSize:9,color:C.dim,letterSpacing:2,fontWeight:600,textAlign:"center"}}>REPS</div>
            <div style={{width:44}}/>
          </div>
          <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:8,flex:1,position:"relative",zIndex:1}}>
            {sets.map((s,si) => {
              const isActive=!s.done&&sets.slice(0,si).every(x=>x.done), canLog=s.weight!==""&&s.reps!=="";
              return (
                <div key={si} style={{display:"flex",alignItems:"center",gap:8,padding:"10px",borderRadius:14,background:s.done?C.accentDim:isActive?C.bgCard:C.bgDeep,border:`1.5px solid ${s.done?C.accent:isActive?C.borderMid:C.border}`,boxSizing:"border-box",transition:"all 0.2s"}}>
                  <div style={{width:22,height:22,borderRadius:7,flexShrink:0,background:s.done?C.accent:C.bgDeep,border:`1.5px solid ${s.done?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:s.done?"#0a0a0a":C.dim}}>{si+1}</div>
                  <input type="number" placeholder="—" value={s.weight} disabled={s.done||!isActive} onChange={e=>updateSet(si,"weight",e.target.value)} style={{flex:1,minWidth:0,width:0,background:"transparent",border:"none",padding:"4px 0",color:s.done?C.accent:isActive?C.white:C.dim,fontSize:22,fontFamily:F,fontWeight:800,textAlign:"center",outline:"none"}}/>
                  <div style={{width:1,height:18,background:C.border,flexShrink:0}}/>
                  <input type="number" placeholder="—" value={s.reps} disabled={s.done||!isActive} onChange={e=>updateSet(si,"reps",e.target.value)} style={{flex:1,minWidth:0,width:0,background:"transparent",border:"none",padding:"4px 0",color:s.done?C.accent:isActive?C.white:C.dim,fontSize:22,fontFamily:F,fontWeight:800,textAlign:"center",outline:"none"}}/>
                  <button onClick={()=>!s.done&&isActive&&canLog&&completeSet(si)} style={{width:38,height:38,minWidth:38,borderRadius:10,flexShrink:0,background:s.done?C.accent:isActive&&canLog?C.accentDim:C.bgDeep,border:`1.5px solid ${s.done?C.accent:isActive&&canLog?C.accentBorder:C.border}`,color:s.done?"#0a0a0a":isActive&&canLog?C.accent:C.dim,fontSize:16,cursor:isActive&&canLog&&!s.done?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{s.done?"✓":"○"}</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CTA */}
      <div style={{padding:"12px 20px 30px",position:"relative",zIndex:1}}>
        <div style={{display:"flex",gap:10}}>
          {exIdx>0 && <button onClick={onBack} style={{padding:"14px 18px",borderRadius:14,background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>Back</button>}
          <button onClick={allDone?onNext:undefined} style={{flex:1,padding:"15px",background:allDone?C.accent:C.bgCard,border:`1.5px solid ${allDone?C.accent:C.border}`,borderRadius:14,color:allDone?"#0a0a0a":C.dim,fontSize:14,fontWeight:800,cursor:allDone?"pointer":"default",fontFamily:F,transition:"all 0.2s"}}>
            {allDone
              ? (isLast?"FINISH WORKOUT":"NEXT →")
              : isSimple?"Tap the circle to continue":`Complete all ${ex.sets} sets`}
          </button>
        </div>
      </div>

      {/* Rest timer overlay */}
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

// ── Finished Screen ────────────────────────────────────
function FinishedScreen({ allSets, elapsed, fmtTime, onFeedback }) {
  const totalSets = allSets.reduce((a,s)=>a+s.filter(x=>x.done).length, 0);
  const totalVol  = allSets.reduce((a,sets)=>a+sets.filter(s=>s.done&&s.weight&&s.reps).reduce((b,s)=>b+(parseFloat(s.weight)*parseInt(s.reps)),0), 0);
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",position:"relative",zIndex:1}}>
      <div style={{fontSize:11,color:C.accent,letterSpacing:3,fontWeight:700,marginBottom:12}}>WORKOUT COMPLETE</div>
      <div style={{fontSize:52,fontWeight:900,color:C.white,textAlign:"center",lineHeight:1,letterSpacing:-2,marginBottom:32}}>SESSION<br/><span style={{color:C.accent}}>CRUSHED</span></div>
      <div style={{display:"flex",gap:12,width:"100%",marginBottom:36}}>
        {[
          {label:"DURATION", value:fmtTime(elapsed), unit:""},
          {label:"SETS",     value:totalSets,         unit:"done"},
          {label:"VOLUME",   value:Math.round(totalVol).toLocaleString(), unit:"kg"},
        ].map(({label,value,unit})=>(
          <div key={label} style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 10px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:900,color:C.accent,letterSpacing:-0.5}}>{value}<span style={{fontSize:11,color:C.dim,fontWeight:500}}> {unit}</span></div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:2,fontWeight:600,marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
      {/* CTA goes to feedback, not straight to dashboard */}
      <button onClick={onFeedback} style={{width:"100%",padding:"16px",background:C.accent,border:"none",borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,color:"#0a0a0a",cursor:"pointer",letterSpacing:0.5}}>
        HOW WAS YOUR WORKOUT? →
      </button>
    </div>
  );
}

// ── Feedback Screen ────────────────────────────────────
const DIFFICULTY_OPTIONS = [
  { value:"easy", label:"Too Easy",  emoji:"😴", desc:"Could've done more" },
  { value:"good", label:"Just Right",emoji:"💪", desc:"Challenging but doable" },
  { value:"hard", label:"Too Hard",  emoji:"🔥", desc:"Struggled to finish" },
];
const ENERGY_OPTIONS = [
  { value:"low",    label:"Low",    emoji:"🔋", desc:"Felt drained" },
  { value:"normal", label:"Normal", emoji:"⚡", desc:"Felt fine" },
  { value:"high",   label:"High",   emoji:"🚀", desc:"Felt great" },
];

function FeedbackScreen({ user, profile, workoutLog, weekPlan, onDone }) {
  const [difficulty, setDifficulty] = useState(null);
  const [energy,     setEnergy]     = useState(null);
  const [saving,     setSaving]     = useState(false);

  const week = profile?.currentWeek || 1;

  // Count completed workouts this week from the current log + what we can infer
  // For now we just count the current session as +1 completed
  const plannedWorkouts = (weekPlan||[]).filter(d=>d.type==="workout").length;

  const handleSave = async () => {
    if (!difficulty || !energy) return;
    setSaving(true);
    try {
      const feedback = {
        difficulty,
        energy,
        completedWorkouts: 1, // Will be summed properly once logs are read in review
        plannedWorkouts,
        sessionLabel: workoutLog?.sessionLabel || "",
        weekIndex: week,
        savedAt: new Date().toISOString(),
      };
      if (user) {
        await saveWeekFeedback(user.uid, week, feedback);
      }
    } catch(e) { console.error("Feedback save error:", e); }
    finally { setSaving(false); onDone(); }
  };

  const canSave = difficulty && energy;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"52px 24px 40px",position:"relative",zIndex:1}}>
      <div style={{marginBottom:32}}>
        <div style={{fontSize:11,color:C.accent,letterSpacing:3,fontWeight:700,marginBottom:8}}>QUICK CHECK-IN</div>
        <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5,lineHeight:1.1}}>How did that<br/>session feel?</div>
        <div style={{fontSize:13,color:C.muted,marginTop:8,lineHeight:1.6}}>Your feedback trains your AI coach to build a better plan next week.</div>
      </div>

      {/* Difficulty */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:12}}>DIFFICULTY</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {DIFFICULTY_OPTIONS.map(opt => (
            <button key={opt.value} onClick={()=>setDifficulty(opt.value)} style={{
              display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,
              background:difficulty===opt.value?C.accentDim:C.bgCard,
              border:`1.5px solid ${difficulty===opt.value?C.accent:C.border}`,
              cursor:"pointer",fontFamily:F,transition:"all 0.18s",textAlign:"left",
            }}>
              <span style={{fontSize:22,flexShrink:0}}>{opt.emoji}</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:difficulty===opt.value?C.accent:C.text}}>{opt.label}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:1}}>{opt.desc}</div>
              </div>
              <div style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",border:`2px solid ${difficulty===opt.value?C.accent:C.borderMid}`,background:difficulty===opt.value?C.accent:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {difficulty===opt.value&&<div style={{width:8,height:8,borderRadius:"50%",background:"#0a0a0a"}}/>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div style={{marginBottom:"auto"}}>
        <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:12}}>ENERGY LEVEL</div>
        <div style={{display:"flex",gap:10}}>
          {ENERGY_OPTIONS.map(opt => (
            <button key={opt.value} onClick={()=>setEnergy(opt.value)} style={{
              flex:1,padding:"14px 8px",borderRadius:14,textAlign:"center",
              background:energy===opt.value?C.accentDim:C.bgCard,
              border:`1.5px solid ${energy===opt.value?C.accent:C.border}`,
              cursor:"pointer",fontFamily:F,transition:"all 0.18s",
            }}>
              <div style={{fontSize:24,marginBottom:6}}>{opt.emoji}</div>
              <div style={{fontSize:12,fontWeight:700,color:energy===opt.value?C.accent:C.text}}>{opt.label}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div style={{marginTop:28,display:"flex",flexDirection:"column",gap:10}}>
        <button onClick={handleSave} disabled={!canSave||saving} style={{
          width:"100%",padding:"16px",background:canSave?C.accent:C.bgCard,
          border:`1.5px solid ${canSave?C.accent:C.border}`,borderRadius:14,
          fontFamily:F,fontSize:15,fontWeight:800,
          color:canSave?"#0a0a0a":C.dim,
          cursor:canSave&&!saving?"pointer":"default",
          transition:"all 0.2s",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
        }}>
          {saving && <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>}
          {saving && <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid transparent",borderTopColor:"#0a0a0a",animation:"spin 0.8s linear infinite"}}/>}
          {saving ? "Saving..." : "SAVE & FINISH"}
        </button>
        <button onClick={onDone} style={{background:"none",border:"none",color:C.dim,fontSize:13,cursor:"pointer",fontFamily:F,padding:"8px 0",textAlign:"center"}}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

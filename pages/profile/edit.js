import { useState } from "react";
import { useRouter } from "next/router";
import { Screen, Label, RadioCard, C } from "../../components/shared";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { useAuth } from "../../lib/AuthContext";
import { saveUserProfile } from "../../lib/firebase";
import ExerciseGif from "../../components/ExerciseGif";
import ExerciseConfigSheet from "../../components/ui/ExerciseConfigSheet";

const F = "'Lexend', sans-serif";
const STEPS = ["Body","Health","Lifestyle","Goals"];

const DIETARY_OPTIONS = ["No Restrictions","Vegetarian","Vegan","Keto","Halal","Gluten-Free","Dairy-Free","Nut Allergy","Low Carb"];
const INJURY_OPTIONS  = ["None","Lower Back","Knee","Shoulder","Neck","Hip","Wrist/Elbow","Ankle","Heart Condition"];
const WEEK_DAYS       = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const GYM_CATEGORIES  = ["Full Commercial Gym","Free Weights (Barbells & Dumbbells)","Cable & Pulley Machines","Resistance Machines","Cardio Equipment","Racks & Benches","Smith Machine","Pull-up / Dip Station"];
const HOME_EQUIPMENT  = ["Dumbbells","Resistance Bands","Pull-up Bar","Kettlebells","Barbell & Plates","Bench","Yoga Mat / Floor Space","No Equipment"];

const ADJUST_CHIPS = [
  "Add more warm-up drills",
  "Include a specific machine",
  "Reduce overall volume",
  "Increase intensity",
  "Swap an exercise",
  "Change a rest day",
  "Adjust nutrition macros",
  "Add more core work",
];

const inputStyle = {
  width:"100%", padding:"14px 16px", borderRadius:12,
  background:C.bgCard, border:`1px solid ${C.border}`,
  color:C.text, fontSize:15, fontFamily:F, fontWeight:400, boxSizing:"border-box",
};

function ChipBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"7px 15px", borderRadius:20, fontSize:13, fontWeight:500, background:active?C.accentDim:C.bgCard, border:`1.5px solid ${active?C.accent:C.border}`, color:active?C.accent:C.muted, cursor:"pointer", fontFamily:F }}>
      {label}
    </button>
  );
}

function UnitToggle({ value, options, onChange }) {
  return (
    <div style={{ display:"flex", background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
      {options.map(o => (
        <button key={o} onClick={()=>onChange(o)} style={{ padding:"6px 16px", fontSize:12, fontWeight:700, background:value===o?C.accentDim:"transparent", border:"none", color:value===o?C.accent:C.muted, cursor:"pointer", fontFamily:F }}>{o}</button>
      ))}
    </div>
  );
}

function StepTitle({ title, sub }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:26,fontWeight:900,color:C.white,letterSpacing:-0.5,marginBottom:4}}>{title}</div>
      <div style={{fontSize:13,color:C.muted}}>{sub}</div>
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const { setProfile } = useAuth();                      // useRequireAuth doesn't expose setProfile
  const { user, profile, loading } = useRequireAuth();
  const [step,        setStep]        = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [showRegen,     setShowRegen]     = useState(false);
  const [regening,      setRegening]      = useState(false);
  const [regenError,    setRegenError]    = useState("");
  const [reviewPlan,    setReviewPlan]    = useState(null);   // plan to review after regen


  // ALL hooks must be before any early return (Rules of Hooks)
  const [form, setFormState] = useState({
    age:               profile?.age            || "",
    gender:            profile?.gender         || "",
    weight:            profile?.weight         || 70,
    weightUnit:        profile?.weightUnit     || "kg",
    height:            profile?.height         || 170,
    heightUnit:        profile?.heightUnit     || "cm",
    bodyFat:           profile?.bodyFat        || "",
    fitnessLevel:      profile?.fitnessLevel   || "",
    injuries:          profile?.injuries       || [],
    medicalConditions: profile?.medicalConditions || "",
    jobType:           profile?.jobType        || "",
    sleepHours:        profile?.sleepHours     || "",
    stressLevel:       profile?.stressLevel    || "",
    trainingDays:      profile?.trainingDays   || "",
    trainingDaysOfWeek:profile?.trainingDaysOfWeek || [],
    primaryGoal:       profile?.primaryGoal    || "",
    targetWeight:      profile?.targetWeight   || "",
    workoutLocation:   profile?.workoutLocation || [],
    gymEquipment:      profile?.gymEquipment   || [],
    homeEquipment:     profile?.homeEquipment  || [],
    equipmentOther:    profile?.equipmentOther || "",
    dietaryPrefs:      profile?.dietaryPrefs   || [],
  });

  if (loading) return null;

  // Detect if user has actually changed anything
  const isDirty = (() => {
    const keys = ["age","gender","weight","weightUnit","height","heightUnit","bodyFat",
      "fitnessLevel","medicalConditions","jobType","sleepHours","stressLevel",
      "trainingDays","primaryGoal","targetWeight","equipmentOther"];
    for (const k of keys) {
      if (String(form[k]||"") !== String(profile?.[k]||"")) return true;
    }
    const arrKeys = ["injuries","trainingDaysOfWeek","workoutLocation","gymEquipment","homeEquipment","dietaryPrefs"];
    for (const k of arrKeys) {
      const a = JSON.stringify([...(form[k]||[])].sort());
      const b = JSON.stringify([...(profile?.[k]||[])].sort());
      if (a !== b) return true;
    }
    return false;
  })();

  const setField  = (k,v) => setFormState(f=>({...f,[k]:v}));
  const toggleArr = (k,v) => setFormState(f=>({...f,[k]:f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v]}));
  const progress  = ((step+1)/STEPS.length)*100;
  const isLast    = step === STEPS.length-1;

  const buildUpdated = () => {
    const hasGym  = form.workoutLocation.includes("Gym")  || form.workoutLocation.includes("Both");
    const hasHome = form.workoutLocation.includes("Home") || form.workoutLocation.includes("Both");
    const equipParts = [];
    if (hasGym  && form.gymEquipment.length)  equipParts.push(...form.gymEquipment);
    if (hasHome && form.homeEquipment.length) equipParts.push(...form.homeEquipment);
    if (form.equipmentOther) equipParts.push(form.equipmentOther);
    return {
      ...profile,
      ...form,
      equipment:    equipParts,
      equipmentStr: equipParts.join(", ") || "standard gym equipment",
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = buildUpdated();
      await saveUserProfile(user.uid, updated);
      setProfile(updated);
      try { localStorage.setItem(`apex_profile_${user.uid}`, JSON.stringify(updated)); } catch {}
      setSaved(true);
      // Brief "Saved" feedback then go to dashboard
      setTimeout(() => router.push("/dashboard"), 800);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleSaveAndRegen = async () => {
    setSaving(true); setRegenError("");
    try {
      const updated = buildUpdated();
      await saveUserProfile(user.uid, updated);
      setProfile(updated);
      try { localStorage.setItem(`apex_profile_${user.uid}`, JSON.stringify(updated)); } catch {}
      setSaving(false);
      setRegening(true);
      const r = await fetch("/api/generate-plan", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...updated, lastWeekPlan:null, lastWeekFeedback:null }),
      });
      const newPlan = await r.json();
      if (newPlan.error) { setRegenError(newPlan.error); setRegening(false); return; }
      setRegening(false);
      setReviewPlan({ plan: newPlan, profile: updated }); // show review screen
    } catch(e) { setRegenError(e.message); setSaving(false); setRegening(false); }
  };


  const handleRegen = async () => {
    setRegening(true); setRegenError("");
    try {
      const updated = buildUpdated();
      const r = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updated,
          lastWeekPlan: null,
          lastWeekFeedback: null,
        }),
      });
      const newPlan = await r.json();
      if (newPlan.error) { setRegenError(newPlan.error); setRegening(false); return; }
      const { saveWeekPlan } = await import("../../lib/firebase");
      await saveWeekPlan(user.uid, updated.currentWeek || 1, newPlan);
      const withPlan = { ...updated, plan: newPlan };
      setProfile(withPlan);
      try { localStorage.setItem(`apex_profile_${user.uid}`, JSON.stringify(withPlan)); } catch {}
      router.push("/dashboard");
    } catch(e) { setRegenError(e.message); setRegening(false); }
  };



  // ── Plan review screen (after regen) ─────────────────
  if (reviewPlan) return (
    <ProfilePlanReview
      plan={reviewPlan.plan}
      profile={reviewPlan.profile}
      user={user}
      setProfile={setProfile}
      onDone={() => router.push("/dashboard")}
    />
  );



  return (
    <Screen style={{overflow:"hidden"}}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* ── PINNED HEADER ── */}
      <div style={{
        padding:"44px 20px 16px",
        background:C.bg,
        borderBottom:`1px solid ${C.border}`,
        flexShrink:0,
        zIndex:10,
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontSize:11,color:C.accent,letterSpacing:3,fontWeight:700,fontStyle:"italic",marginBottom:3}}>APEXCOACH</div>
            <div style={{fontSize:22,fontWeight:900,color:C.white,letterSpacing:-0.5}}>Edit Profile</div>
          </div>
          <button onClick={()=>router.back()} style={{background:"none",border:"none",color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F,padding:"4px 0"}}>Cancel</button>
        </div>
        {/* Progress bar */}
        <div style={{height:2,background:C.border,borderRadius:4,overflow:"hidden",marginBottom:12}}>
          <div style={{height:"100%",width:`${progress}%`,background:C.accent,borderRadius:4,transition:"width 0.35s ease"}}/>
        </div>
        {/* Step pills — tap to navigate */}
        <div style={{display:"flex",gap:6}}>
          {STEPS.map((s,i)=>(
            <button key={s} onClick={()=>setStep(i)} style={{
              fontSize:9,letterSpacing:1.5,fontWeight:700,
              padding:"5px 12px",borderRadius:20,
              background:i===step?C.accentDim:"transparent",
              color:i===step?C.accent:i<step?C.muted:C.dim,
              border:`1.5px solid ${i===step?C.accent:i<step?C.borderMid:C.border}`,
              cursor:"pointer",fontFamily:F,transition:"all 0.2s",
            }}>{s.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 20px 0"}}>
        {step===0 && <StepBody      form={form} setField={setField} />}
        {step===1 && <StepHealth    form={form} setField={setField} toggleArr={toggleArr} />}
        {step===2 && <StepLifestyle form={form} setField={setField} toggleArr={toggleArr} />}
        {step===3 && <StepGoals     form={form} setField={setField} toggleArr={toggleArr} />}
        <div style={{height:20}}/>

      <div style={{height:20}}/>
      </div>

      {/* ── PINNED FOOTER ── */}
      <div style={{
        padding:"12px 20px 36px",
        background:C.bg,
        borderTop:`1px solid ${C.border}`,
        flexShrink:0,
      }}>
        {!isLast ? (
          <button onClick={()=>setStep(s=>s+1)} style={{width:"100%",padding:"15px",background:C.accent,border:"none",borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,color:"#0a0a0a",cursor:"pointer"}}>Continue</button>
        ) : (
          <>
            <button
              onClick={handleSaveAndRegen}
              disabled={!isDirty||saving||regening}
              style={{
                width:"100%",padding:"15px",borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,
                border:"none",
                background:(!isDirty||saving||regening)?C.bgCard:C.accent,
                color:(!isDirty||saving||regening)?C.dim:"#0a0a0a",
                cursor:(!isDirty||saving||regening)?"default":"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                transition:"all 0.2s",
                opacity: !isDirty ? 0.5 : 1,
              }}>
              {(saving||regening)&&<div style={{width:13,height:13,borderRadius:"50%",border:"2px solid transparent",borderTopColor:C.muted,animation:"spin 0.8s linear infinite"}}/>}
              {saving?"Saving...":regening?"Rebuilding plan...":isDirty?"Save & Rebuild Plan":"No changes made"}
            </button>
            {regenError&&<div style={{fontSize:11,color:"#ff5e5e",textAlign:"center",marginTop:10}}>{regenError}</div>}
          </>
        )}
      </div>
    </Screen>
  );
}

// ── Step 0: Body ──────────────────────────────────────────
function StepBody({ form, setField }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <StepTitle title="Body Stats" sub="Update your measurements" />
      <div style={{display:"flex",gap:12}}>
        <div style={{flex:1}}>
          <Label>Age</Label>
          <input style={inputStyle} placeholder="28" type="number" value={form.age} onChange={e=>setField("age",e.target.value)} />
        </div>
        <div style={{flex:1.5}}>
          <Label>Gender</Label>
          <div style={{display:"flex",gap:6}}>
            {["Male","Female"].map(g => (
              <ChipBtn key={g} label={g} active={form.gender===g} onClick={()=>setField("gender",g)} />
            ))}
          </div>
        </div>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <Label>Weight</Label>
          <UnitToggle value={form.weightUnit} options={["kg","lbs"]} onChange={v=>setField("weightUnit",v)} />
        </div>
        <input style={inputStyle} placeholder="75" type="number" value={form.weight} onChange={e=>setField("weight",e.target.value)} />
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <Label>Height</Label>
          <UnitToggle value={form.heightUnit} options={["cm","ft"]} onChange={v=>setField("heightUnit",v)} />
        </div>
        <input style={inputStyle} placeholder="175" type="number" value={form.height} onChange={e=>setField("height",e.target.value)} />
      </div>
      <div>
        <Label>Body Fat % <span style={{color:C.dim,fontWeight:400}}>(optional)</span></Label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["<10%","10–15%","15–20%","20–25%","25–30%","30%+","Not sure"].map(v=>(
            <ChipBtn key={v} label={v} active={form.bodyFat===v} onClick={()=>setField("bodyFat",v)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Health ────────────────────────────────────────
function StepHealth({ form, setField, toggleArr }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <StepTitle title="Health" sub="Keep your limitations up to date" />
      <div>
        <Label>Fitness Level</Label>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {value:"beginner",     label:"Beginner",     desc:"Less than 6 months"},
            {value:"intermediate", label:"Intermediate", desc:"6 months – 2 years"},
            {value:"advanced",     label:"Advanced",     desc:"2+ years training"},
          ].map(o=><RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.fitnessLevel===o.value} onClick={v=>setField("fitnessLevel",v)} />)}
        </div>
      </div>
      <div>
        <Label>Injuries / Limitations</Label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {INJURY_OPTIONS.map(v=><ChipBtn key={v} label={v} active={form.injuries.includes(v)} onClick={()=>toggleArr("injuries",v)} />)}
        </div>
      </div>
      <div>
        <Label>Medical Conditions <span style={{color:C.dim,fontWeight:400}}>(optional)</span></Label>
        <textarea style={{...inputStyle,minHeight:70}} placeholder="e.g. diabetes, hypertension..." value={form.medicalConditions} onChange={e=>setField("medicalConditions",e.target.value)} />
      </div>
    </div>
  );
}

// ── Step 2: Lifestyle ─────────────────────────────────────
function StepLifestyle({ form, setField, toggleArr }) {
  const targetDays   = parseInt(form.trainingDays) || 0;
  const selectedCount = form.trainingDaysOfWeek.length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <StepTitle title="Lifestyle" sub="Adjust based on changes in your life" />
      <div>
        <Label>Job Type</Label>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {value:"sedentary", label:"Sedentary",     desc:"Desk job, mostly sitting"},
            {value:"light",     label:"Lightly Active", desc:"On feet occasionally"},
            {value:"active",    label:"Active",         desc:"Physical job"},
          ].map(o=><RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.jobType===o.value} onClick={v=>setField("jobType",v)} />)}
        </div>
      </div>
      <div>
        <Label>Avg Sleep</Label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["<5h","5–6h","6–7h","7–8h","8h+"].map(v=><ChipBtn key={v} label={v} active={form.sleepHours===v} onClick={()=>setField("sleepHours",v)} />)}
        </div>
      </div>
      <div>
        <Label>Stress Level</Label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["Low","Medium","High","Very High"].map(v=><ChipBtn key={v} label={v} active={form.stressLevel===v} onClick={()=>setField("stressLevel",v)} />)}
        </div>
      </div>

      {/* Training days count */}
      <div>
        <Label>Training Days per Week</Label>
        <div style={{display:"flex",gap:8}}>
          {["2","3","4","5","6"].map(v=>(
            <button key={v} onClick={()=>{
              setField("trainingDays",v);
              if(form.trainingDaysOfWeek.length > parseInt(v)) {
                setField("trainingDaysOfWeek", form.trainingDaysOfWeek.slice(0, parseInt(v)));
              }
            }} style={{width:50,height:50,borderRadius:14,background:form.trainingDays===v?C.accent:C.bgCard,border:`1.5px solid ${form.trainingDays===v?C.accent:C.border}`,color:form.trainingDays===v?"#0a0a0a":C.muted,fontWeight:800,fontSize:17,cursor:"pointer",fontFamily:F}}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Specific training days */}
      {form.trainingDays && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Label>Which days work for you?</Label>
            <span style={{fontSize:11,color:selectedCount===targetDays?C.accent:C.muted,fontWeight:600}}>
              {selectedCount}/{targetDays} selected
            </span>
          </div>
          <div style={{display:"flex",gap:7}}>
            {WEEK_DAYS.map(day=>{
              const isActive   = form.trainingDaysOfWeek.includes(day);
              const isDisabled = !isActive && selectedCount >= targetDays;
              return (
                <button key={day} onClick={()=>!isDisabled && toggleArr("trainingDaysOfWeek",day)} style={{
                  flex:1, padding:"10px 0", borderRadius:12,
                  display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                  background: isActive ? C.accent : C.bgCard,
                  border: `1.5px solid ${isActive?C.accent:isDisabled?C.border:C.borderMid}`,
                  color: isActive ? "#0a0a0a" : isDisabled ? C.dim : C.muted,
                  cursor: isDisabled ? "default" : "pointer",
                  opacity: isDisabled ? 0.4 : 1,
                  transition:"all 0.18s", fontFamily:F,
                }}>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:0.5}}>{day.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
          {selectedCount === targetDays && (
            <div style={{fontSize:11,color:C.accent,marginTop:8,fontWeight:500}}>✓ Your training schedule is set</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Goals ─────────────────────────────────────────
function StepGoals({ form, setField, toggleArr }) {
  const hasGym  = form.workoutLocation.includes("Gym")  || form.workoutLocation.includes("Both");
  const hasHome = form.workoutLocation.includes("Home") || form.workoutLocation.includes("Both");

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <StepTitle title="Goals & Setup" sub="Update what you are training for" />
      <div>
        <Label>Primary Goal</Label>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {value:"fat_loss",    label:"Fat Loss",        desc:"Burn fat, get leaner"},
            {value:"muscle_gain", label:"Muscle Gain",     desc:"Build size and strength"},
            {value:"maintain",    label:"Maintain & Tone", desc:"Stay fit, improve definition"},
          ].map(o=><RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.primaryGoal===o.value} onClick={v=>setField("primaryGoal",v)} />)}
        </div>
      </div>
      <div>
        <Label>Target Weight <span style={{color:C.dim,fontWeight:400}}>(optional)</span></Label>
        <input style={inputStyle} placeholder="e.g. 80 kg" value={form.targetWeight} onChange={e=>setField("targetWeight",e.target.value)} />
      </div>

      {/* Location — tiered entry point */}
      <div>
        <Label>Where do you train?</Label>
        <div style={{display:"flex",gap:8}}>
          {["Gym","Home","Both"].map(v=>(
            <button key={v} onClick={()=>{
              const current = form.workoutLocation;
              let next;
              if(v==="Both") {
                next = current.includes("Both") ? [] : ["Both"];
              } else {
                const without = current.filter(x=>x!=="Both");
                next = without.includes(v) ? without.filter(x=>x!==v) : [...without,v];
              }
              setField("workoutLocation",next);
            }} style={{flex:1,padding:"12px 8px",borderRadius:14,background:form.workoutLocation.includes(v)?C.accentDim:C.bgCard,border:`1.5px solid ${form.workoutLocation.includes(v)?C.accent:C.border}`,color:form.workoutLocation.includes(v)?C.accent:C.muted,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:F}}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Gym equipment categories */}
      {hasGym && (
        <div>
          <Label>What's available at your gym?</Label>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {GYM_CATEGORIES.map(v=><ChipBtn key={v} label={v} active={form.gymEquipment.includes(v)} onClick={()=>toggleArr("gymEquipment",v)} />)}
          </div>
        </div>
      )}

      {/* Home equipment */}
      {hasHome && (
        <div>
          <Label>Home equipment available</Label>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {HOME_EQUIPMENT.map(v=><ChipBtn key={v} label={v} active={form.homeEquipment.includes(v)} onClick={()=>toggleArr("homeEquipment",v)} />)}
          </div>
        </div>
      )}

      {/* Other equipment free text */}
      {(hasGym||hasHome) && (
        <div>
          <Label>Anything else? <span style={{color:C.dim,fontWeight:400}}>(optional)</span></Label>
          <input style={inputStyle} placeholder="e.g. cable chest fly machine, TRX straps, battle ropes..." value={form.equipmentOther} onChange={e=>setField("equipmentOther",e.target.value)} />
        </div>
      )}

      <div>
        <Label>Dietary Preferences</Label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {DIETARY_OPTIONS.map(v=><ChipBtn key={v} label={v} active={form.dietaryPrefs.includes(v)} onClick={()=>toggleArr("dietaryPrefs",v)} />)}
        </div>
      </div>
    </div>
  );
}

// ── Plan Review (after profile edit regen) ────────────
function ProfilePlanReview({ plan, profile, user, setProfile, onDone }) {
  const [adjusting,    setAdjusting]    = useState(false);
  const [adjustInput,  setAdjustInput]  = useState("");
  const [selectedChip, setSelectedChip] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [currentPlan,  setCurrentPlan]  = useState(plan);
  const [error,        setError]        = useState("");
  const [adjustCount,  setAdjustCount]  = useState(0);
  const [committing,   setCommitting]   = useState(false);
  const [expandedDay,  setExpandedDay]  = useState(null);
  const [editTarget,   setEditTarget]   = useState(null); // { dayIdx, blockKey, exIdx, ex }

  const weekPlan = currentPlan?.weekPlan || [];
  const macros   = currentPlan?.nutrition?.macros || {};
  const calories = currentPlan?.nutrition?.dailyCalories;

  const handleAdjust = async () => {
    const request = selectedChip
      ? `${selectedChip}${adjustInput ? ": " + adjustInput : ""}`
      : adjustInput;
    if (!request.trim()) return;
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/adjust-plan", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ plan: currentPlan, request, profile }),
      });
      const updated = await r.json();
      if (updated.error) { setError(updated.error); }
      else { setCurrentPlan(updated); setAdjustCount(n=>n+1); setAdjusting(false); setSelectedChip(""); setAdjustInput(""); }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const { saveWeekPlan } = await import("../../lib/firebase");
      await saveWeekPlan(user.uid, profile.currentWeek || 1, currentPlan);
      const withPlan = { ...profile, plan: currentPlan };
      setProfile(withPlan);
      try { localStorage.setItem(`apex_profile_${user.uid}`, JSON.stringify(withPlan)); } catch {}
    } catch(e) { console.error(e); }
    onDone();
  };

  return (
    <Screen>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <div style={{padding:"44px 20px 0",flexShrink:0}}>
        <div style={{fontSize:11,color:C.accent,letterSpacing:3,fontWeight:600,marginBottom:6}}>NEW PLAN READY</div>
        <div style={{fontSize:24,fontWeight:900,color:C.white,letterSpacing:-0.5}}>Review & Adjust</div>
        <div style={{fontSize:13,color:C.muted,marginTop:4}}>Check your updated plan before committing.</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>

        {/* Macros */}
        {calories && (
          <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:12}}>NUTRITION TARGETS</div>
            <div style={{display:"flex",gap:8}}>
              {[
                {label:"KCAL",    value:calories,      color:C.accent},
                {label:"PROTEIN", value:`${macros.protein}g`, color:"#00cfff"},
                {label:"CARBS",   value:`${macros.carbs}g`,   color:"#ffaa00"},
                {label:"FAT",     value:`${macros.fat||macros.fats}g`,    color:"#ff5e8a"},
              ].map(m=>(
                <div key={m.label} style={{flex:1,background:C.bgDeep,borderRadius:10,padding:"10px 4px",textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:800,color:m.color}}>{m.value}</div>
                  <div style={{fontSize:8,color:C.dim,letterSpacing:1,fontWeight:600,marginTop:2}}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Week schedule — expandable */}
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 16px",marginBottom:12}}>
          <div style={{fontSize:10,color:C.muted,letterSpacing:2.5,fontWeight:700,marginBottom:4}}>WEEKLY SCHEDULE</div>
          <div style={{fontSize:11,color:C.dim,marginBottom:12}}>Tap a workout to see exercises</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {weekPlan.map((day,i)=>{
              const isRest    = day.type==="rest"||day.type==="recovery";
              const isOpen    = expandedDay===i;
              const blocks    = day.blocks || {};
              const BLOCK_COLORS = {warmup:"#ffaa00",main:C.accent,accessory:"#00cfff",finisher:"#ff5e8a",core:"#aa88ff",cooldown:C.muted};
              const BLOCK_LABELS = {warmup:"Warm-Up",main:"Main Lifts",accessory:"Accessory",finisher:"Finisher",core:"Core",cooldown:"Cooldown"};
              return (
                <div key={i} style={{borderRadius:12,overflow:"hidden",border:`1px solid ${isOpen?C.accentBorder:C.border}`,transition:"border-color 0.2s"}}>
                  {/* Day header row — tappable */}
                  <button
                    onClick={()=>!isRest&&setExpandedDay(isOpen?null:i)}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 12px",background:isOpen?C.accentDim:C.bgDeep,border:"none",cursor:isRest?"default":"pointer",fontFamily:F,transition:"background 0.2s"}}
                  >
                    <div style={{width:32,textAlign:"center",fontSize:10,color:isOpen?C.accent:C.muted,fontWeight:700,flexShrink:0}}>{day.dayName||`D${i+1}`}</div>
                    <div style={{flex:1,minWidth:0,textAlign:"left"}}>
                      <div style={{fontSize:13,fontWeight:600,color:isRest?C.dim:isOpen?C.accent:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {isRest?"Rest Day":(day.focus||day.sessionLabel||"Workout")}
                      </div>
                      {!isRest&&day.muscleGroups&&<div style={{fontSize:11,color:C.dim,marginTop:1}}>{day.muscleGroups}</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      <div style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:isRest?C.bgCard:isOpen?C.accent:C.accentDim,border:`1px solid ${isRest?C.border:C.accentBorder}`,color:isRest?C.dim:isOpen?"#0a0a0a":C.accent}}>
                        {isRest?"REST":(day.type||"").toUpperCase()}
                      </div>
                      {!isRest&&<span style={{fontSize:14,color:isOpen?C.accent:C.dim,transition:"transform 0.2s",display:"inline-block",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</span>}
                    </div>
                  </button>

                  {/* Expanded exercise list */}
                  {isOpen&&!isRest&&(
                    <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 12px",display:"flex",flexDirection:"column",gap:10}}>
                      {["warmup","main","accessory","finisher","core","cooldown"].map(blockKey=>{
                        const exs = blocks[blockKey];
                        if(!exs||!exs.length) return null;
                        return (
                          <div key={blockKey}>
                            <div style={{fontSize:9,color:BLOCK_COLORS[blockKey],letterSpacing:2,fontWeight:700,marginBottom:6}}>{BLOCK_LABELS[blockKey].toUpperCase()}</div>
                            <div style={{display:"flex",flexDirection:"column",gap:5}}>
                              {exs.map((ex,ei)=>(
                                <div key={ei} style={{padding:"8px 10px",background:C.bgCard,borderRadius:8}}>
                                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontSize:12,fontWeight:600,color:C.text}}>{ex.name}</div>
                                      {ex.notes&&<div style={{fontSize:10,color:C.dim,marginTop:2,fontStyle:"italic"}}>{ex.notes}</div>}
                                    </div>
                                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                                      <div style={{fontSize:11,color:C.muted,textAlign:"right"}}>
                                        {ex.sets&&ex.reps?`${ex.sets}×${ex.reps}`:ex.duration||ex.details||""}
                                      </div>
                                      <button
                                        onClick={()=>setEditTarget({dayIdx:i,blockKey,exIdx:ei,ex})}
                                        style={{background:"none",border:"none",cursor:"pointer",padding:4,color:C.dim,display:"flex",alignItems:"center"}}
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                  <div style={{marginTop:6}}>
                                    <ExerciseGif exerciseName={ex.name} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Adjustment count badge */}
        {adjustCount>0 && (
          <div style={{background:"rgba(196,255,0,0.06)",border:`1px solid ${C.accentBorder}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{fontSize:12,color:C.accent,fontWeight:600}}>{adjustCount} adjustment{adjustCount>1?"s":""} applied</span>
          </div>
        )}

        {/* Adjust panel */}
        {adjusting ? (
          <div style={{background:C.bgCard,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"16px"}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2,fontWeight:700,marginBottom:12}}>WHAT WOULD YOU LIKE TO CHANGE?</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>
              {ADJUST_CHIPS.map(chip=>(
                <button key={chip} onClick={()=>setSelectedChip(selectedChip===chip?"":chip)} style={{
                  padding:"6px 13px",borderRadius:20,fontSize:12,fontWeight:500,
                  background:selectedChip===chip?C.accentDim:C.bgDeep,
                  border:`1.5px solid ${selectedChip===chip?C.accent:C.border}`,
                  color:selectedChip===chip?C.accent:C.muted,
                  cursor:"pointer",fontFamily:F,
                }}>
                  {chip}
                </button>
              ))}
            </div>
            <textarea
              value={adjustInput}
              onChange={e=>setAdjustInput(e.target.value)}
              placeholder={selectedChip?"Add details (optional)...":"Describe your specific request..."}
              style={{...inputStyle,minHeight:72,marginBottom:12,resize:"none"}}
            />
            {error&&<div style={{fontSize:11,color:"#ff5e5e",marginBottom:10}}>{error}</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setAdjusting(false);setSelectedChip("");setAdjustInput("");setError("");}} style={{padding:"14px 18px",borderRadius:14,background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>Cancel</button>
              <button onClick={handleAdjust} disabled={(!selectedChip&&!adjustInput.trim())||loading} style={{
                flex:1,padding:"14px",background:(!selectedChip&&!adjustInput.trim())||loading?C.bgCard:C.accent,
                border:`1.5px solid ${(!selectedChip&&!adjustInput.trim())||loading?C.border:C.accent}`,
                borderRadius:14,fontFamily:F,fontSize:14,fontWeight:800,
                color:(!selectedChip&&!adjustInput.trim())||loading?C.dim:"#0a0a0a",
                cursor:(!selectedChip&&!adjustInput.trim())||loading?"default":"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              }}>
                {loading&&<div style={{width:13,height:13,borderRadius:"50%",border:"2px solid transparent",borderTopColor:"#0a0a0a",animation:"spin 0.8s linear infinite"}}/>}
                {loading?"Adjusting...":"Apply Change"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={()=>setAdjusting(true)} style={{width:"100%",padding:"14px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,fontFamily:F,fontSize:13,fontWeight:600,color:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Request a Change
          </button>
        )}
      </div>

      <div style={{padding:"12px 20px 36px",flexShrink:0}}>
        <button onClick={handleCommit} disabled={committing} style={{width:"100%",padding:"16px",background:committing?C.accentDim:C.accent,border:`1.5px solid ${C.accent}`,borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,color:committing?C.accent:"#0a0a0a",cursor:committing?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {committing&&<div style={{width:14,height:14,borderRadius:"50%",border:"2px solid transparent",borderTopColor:"#0a0a0a",animation:"spin 0.8s linear infinite"}}/>}
          {committing?"Saving...":"This looks great — let's go!"}
        </button>
        <div style={{fontSize:11,color:C.dim,textAlign:"center",marginTop:10}}>You can always adjust from the Review tab later.</div>
      </div>

      <ExerciseConfigSheet
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        exerciseName={editTarget?.ex?.name || ""}
        blockKey={editTarget?.blockKey || "main"}
        initial={editTarget?.ex || null}
        title="Edit Exercise"
        confirmLabel="Save"
        onConfirm={(updated) => {
          if (!editTarget) return;
          const { dayIdx, blockKey, exIdx } = editTarget;
          const newPlan = JSON.parse(JSON.stringify(currentPlan));
          const ex = newPlan.weekPlan[dayIdx]?.blocks?.[blockKey]?.[exIdx];
          if (ex) Object.assign(ex, updated);
          setCurrentPlan(newPlan);
          setEditTarget(null);
        }}
      />
    </Screen>
  );
}

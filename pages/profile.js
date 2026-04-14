import { useState } from "react";
import { useRouter } from "next/router";
import { Screen, Label, RadioCard, C } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";
import { saveUserProfile } from "../lib/firebase";

const F = "'Lexend', sans-serif";
const STEPS = ["Body","Health","Lifestyle","Goals"];
const EQUIPMENT_OPTIONS = ["Barbell & Plates","Dumbbells","Cables/Pulleys","Smith Machine","Pull-up Bar","Resistance Bands","Kettlebells","Bench","No Equipment"];
const DIETARY_OPTIONS   = ["No Restrictions","Vegetarian","Vegan","Keto","Halal","Gluten-Free","Dairy-Free","Nut Allergy","Low Carb"];
const INJURY_OPTIONS    = ["None","Lower Back","Knee","Shoulder","Neck","Hip","Wrist/Elbow","Ankle","Heart Condition"];

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

export default function Profile() {
  const router = useRouter();
  const { user, profile, setProfile, loading } = useRequireAuth();
  const [step,   setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  if (loading) return null;

  const [form, setFormState] = useState({
    age:profile?.age||"", gender:profile?.gender||"",
    weight:profile?.weight||70, weightUnit:profile?.weightUnit||"kg",
    height:profile?.height||170, heightUnit:profile?.heightUnit||"cm",
    bodyFat:profile?.bodyFat||"", fitnessLevel:profile?.fitnessLevel||"",
    injuries:profile?.injuries||[], medicalConditions:profile?.medicalConditions||"",
    jobType:profile?.jobType||"", sleepHours:profile?.sleepHours||"",
    stressLevel:profile?.stressLevel||"", trainingDays:profile?.trainingDays||"",
    primaryGoal:profile?.primaryGoal||"", targetWeight:profile?.targetWeight||"",
    workoutLocation:profile?.workoutLocation||[], equipment:profile?.equipment||[], dietaryPrefs:profile?.dietaryPrefs||[],
  });

  const setField  = (k,v) => setFormState(f=>({...f,[k]:v}));
  const toggleArr = (k,v) => setFormState(f=>({...f,[k]:f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v]}));
  const progress  = ((step+1)/STEPS.length)*100;
  const isLast    = step === STEPS.length-1;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = {...profile,...form};
      await saveUserProfile(user.uid, updated);
      setProfile(updated);
      try { localStorage.setItem(`apex_profile_${user.uid}`, JSON.stringify(updated)); } catch {}
      setSaved(true);
      setTimeout(()=>router.push("/dashboard"),1000);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const inputStyle = {
    width:"100%", padding:"14px 16px", borderRadius:12,
    background:C.bgCard, border:`1px solid ${C.border}`,
    color:C.text, fontSize:15, fontFamily:F, fontWeight:400, boxSizing:"border-box",
  };

  return (
    <Screen>
      <div style={{padding:"44px 20px 0",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:11,color:C.accent,letterSpacing:3,fontWeight:700,fontStyle:"italic",marginBottom:4}}>APEXCOACH</div>
            <div style={{fontSize:24,fontWeight:900,color:C.white,letterSpacing:-0.5}}>Edit Profile</div>
          </div>
          <button onClick={()=>router.back()} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 16px",color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>Cancel</button>
        </div>
        <div style={{height:3,background:C.bgCard,borderRadius:4,overflow:"hidden",marginBottom:14}}>
          <div style={{height:"100%",width:`${progress}%`,background:C.accent,borderRadius:4,transition:"width 0.4s ease"}}/>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:24}}>
          {STEPS.map((s,i)=>(
            <button key={s} onClick={()=>setStep(i)} style={{fontSize:9,letterSpacing:1.5,fontWeight:700,padding:"5px 12px",borderRadius:20,background:i===step?C.accentDim:"transparent",color:i===step?C.accent:i<step?C.muted:C.dim,border:`1.5px solid ${i===step?C.accent:i<step?C.borderMid:C.border}`,cursor:"pointer",fontFamily:F}}>{s.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{flex:1,padding:"0 20px",position:"relative",zIndex:1,overflowY:"auto"}}>
        {step===0 && <StepBody  form={form} setField={setField} toggleArr={toggleArr} inputStyle={inputStyle} />}
        {step===1 && <StepHealth form={form} setField={setField} toggleArr={toggleArr} inputStyle={inputStyle} />}
        {step===2 && <StepLifestyle form={form} setField={setField} />}
        {step===3 && <StepGoals form={form} setField={setField} toggleArr={toggleArr} inputStyle={inputStyle} />}
      </div>

      <div style={{padding:"16px 20px 36px",display:"flex",gap:10,position:"relative",zIndex:1}}>
        {step>0 && <button onClick={()=>setStep(s=>s-1)} style={{padding:"15px 20px",borderRadius:14,background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F,flex:1}}>Back</button>}
        {!isLast ? (
          <button onClick={()=>setStep(s=>s+1)} style={{flex:2,padding:"15px",background:C.accent,border:"none",borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,color:"#0a0a0a",cursor:"pointer"}}>Continue</button>
        ) : (
          <button onClick={handleSave} disabled={saving} style={{flex:2,padding:"15px",background:saving?C.accentDim:C.accent,border:`1.5px solid ${C.accent}`,borderRadius:14,fontFamily:F,fontSize:15,fontWeight:800,color:saving?C.accent:"#0a0a0a",cursor:saving?"default":"pointer",transition:"all 0.2s"}}>
            {saved?"Saved!":saving?"Saving...":"Save Changes"}
          </button>
        )}
      </div>
    </Screen>
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

function StepBody({ form, setField, inputStyle }) {
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
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["Male","Female","Other"].map(g=><ChipBtn key={g} label={g} active={form.gender===g} onClick={()=>setField("gender",g)} />)}
          </div>
        </div>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <Label>Weight</Label><UnitToggle value={form.weightUnit} options={["kg","lbs"]} onChange={v=>setField("weightUnit",v)} />
        </div>
        <input style={inputStyle} placeholder="75" type="number" value={form.weight} onChange={e=>setField("weight",e.target.value)} />
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <Label>Height</Label><UnitToggle value={form.heightUnit} options={["cm","ft"]} onChange={v=>setField("heightUnit",v)} />
        </div>
        <input style={inputStyle} placeholder="175" type="number" value={form.height} onChange={e=>setField("height",e.target.value)} />
      </div>
      <div>
        <Label>Body Fat %</Label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["<10%","10–15%","15–20%","20–25%","25–30%","30%+","Not sure"].map(v=><ChipBtn key={v} label={v} active={form.bodyFat===v} onClick={()=>setField("bodyFat",v)} />)}
        </div>
      </div>
    </div>
  );
}

function StepHealth({ form, setField, toggleArr, inputStyle }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <StepTitle title="Health" sub="Keep your limitations up to date" />
      <div>
        <Label>Fitness Level</Label>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{value:"beginner",label:"Beginner",desc:"Less than 6 months"},{value:"intermediate",label:"Intermediate",desc:"6 months – 2 years"},{value:"advanced",label:"Advanced",desc:"2+ years training"}].map(o=><RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.fitnessLevel===o.value} onClick={v=>setField("fitnessLevel",v)} />)}
        </div>
      </div>
      <div>
        <Label>Injuries / Limitations</Label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {INJURY_OPTIONS.map(v=><ChipBtn key={v} label={v} active={form.injuries.includes(v)} onClick={()=>toggleArr("injuries",v)} />)}
        </div>
      </div>
      <div>
        <Label>Medical Conditions</Label>
        <textarea style={{...inputStyle,minHeight:70}} placeholder="e.g. diabetes, hypertension..." value={form.medicalConditions} onChange={e=>setField("medicalConditions",e.target.value)} />
      </div>
    </div>
  );
}

function StepLifestyle({ form, setField }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <StepTitle title="Lifestyle" sub="Adjust based on changes in your life" />
      <div>
        <Label>Job Type</Label>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{value:"sedentary",label:"Sedentary",desc:"Desk job, mostly sitting"},{value:"light",label:"Lightly Active",desc:"On feet occasionally"},{value:"active",label:"Active",desc:"Physical job"}].map(o=><RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.jobType===o.value} onClick={v=>setField("jobType",v)} />)}
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
      <div>
        <Label>Training Days per Week</Label>
        <div style={{display:"flex",gap:8}}>
          {["2","3","4","5","6"].map(v=>(
            <button key={v} onClick={()=>setField("trainingDays",v)} style={{width:50,height:50,borderRadius:14,background:form.trainingDays===v?C.accent:C.bgCard,border:`1.5px solid ${form.trainingDays===v?C.accent:C.border}`,color:form.trainingDays===v?"#0a0a0a":C.muted,fontWeight:800,fontSize:17,cursor:"pointer",fontFamily:F}}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepGoals({ form, setField, toggleArr, inputStyle }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <StepTitle title="Goals" sub="Update what you are training for" />
      <div>
        <Label>Primary Goal</Label>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{value:"fat_loss",label:"Fat Loss",desc:"Burn fat, get leaner"},{value:"muscle_gain",label:"Muscle Gain",desc:"Build size and strength"},{value:"maintain",label:"Maintain & Tone",desc:"Stay fit, improve definition"}].map(o=><RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.primaryGoal===o.value} onClick={v=>setField("primaryGoal",v)} />)}
        </div>
      </div>
      <div>
        <Label>Target Weight</Label>
        <input style={inputStyle} placeholder="e.g. 80 kg" value={form.targetWeight} onChange={e=>setField("targetWeight",e.target.value)} />
      </div>
      <div>
        <Label>Workout Location</Label>
        <div style={{display:"flex",gap:8}}>
          {["Gym","Home","Both"].map(v=><ChipBtn key={v} label={v} active={form.workoutLocation.includes(v)} onClick={()=>toggleArr("workoutLocation",v)} />)}
        </div>
      </div>
      <div>
        <Label>Equipment Available</Label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {EQUIPMENT_OPTIONS.map(v=><ChipBtn key={v} label={v} active={form.equipment.includes(v)} onClick={()=>toggleArr("equipment",v)} />)}
        </div>
      </div>
      <div>
        <Label>Dietary Preferences</Label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {DIETARY_OPTIONS.map(v=><ChipBtn key={v} label={v} active={form.dietaryPrefs.includes(v)} onClick={()=>toggleArr("dietaryPrefs",v)} />)}
        </div>
      </div>
    </div>
  );
}

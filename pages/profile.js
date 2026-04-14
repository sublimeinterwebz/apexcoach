import { useState } from "react";
import { useRouter } from "next/router";
import { Screen, btnStyle, inputStyle, Label, RadioCard } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";
import { saveUserProfile } from "../lib/firebase";

const EQUIPMENT_OPTIONS = ["Barbell & Plates","Dumbbells","Cables/Pulleys","Smith Machine","Pull-up Bar","Resistance Bands","Kettlebells","Bench","No Equipment"];
const DIETARY_OPTIONS   = ["No Restrictions","Vegetarian","Vegan","Keto","Halal","Gluten-Free","Dairy-Free","Nut Allergy","Low Carb"];
const INJURY_OPTIONS    = ["None","Lower Back","Knee","Shoulder","Neck","Hip","Wrist/Elbow","Ankle","Heart Condition"];

const STEPS = ["Body","Health","Lifestyle","Goals"];

export default function Profile() {
  const router = useRouter();
  const { user, profile, setProfile, loading } = useRequireAuth();
  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  if (loading) return null;

  // Pre-fill form from existing profile
  const [form, setFormState] = useState({
    age:              profile?.age || "",
    gender:           profile?.gender || "",
    weight:           profile?.weight || 70,
    weightUnit:       profile?.weightUnit || "kg",
    height:           profile?.height || 170,
    heightUnit:       profile?.heightUnit || "cm",
    bodyFat:          profile?.bodyFat || "",
    fitnessLevel:     profile?.fitnessLevel || "",
    injuries:         profile?.injuries || [],
    medicalConditions:profile?.medicalConditions || "",
    jobType:          profile?.jobType || "",
    sleepHours:       profile?.sleepHours || "",
    stressLevel:      profile?.stressLevel || "",
    trainingDays:     profile?.trainingDays || "",
    primaryGoal:      profile?.primaryGoal || "",
    targetWeight:     profile?.targetWeight || "",
    workoutLocation:  profile?.workoutLocation || [],
    equipment:        profile?.equipment || [],
    dietaryPrefs:     profile?.dietaryPrefs || [],
  });

  const setField  = (k, v) => setFormState(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setFormState(f => ({ ...f, [k]: f[k].includes(v) ? f[k].filter(x => x!==v) : [...f[k], v] }));
  const progress  = ((step + 1) / STEPS.length) * 100;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = { ...profile, ...form };
      await saveUserProfile(user.uid, updated);
      setProfile(updated);
      try { localStorage.setItem(`apex_profile_${user.uid}`, JSON.stringify(updated)); } catch {}
      setSaved(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const isLast = step === STEPS.length - 1;

  return (
    <Screen>
      <div style={{ padding:"44px 20px 0", position:"relative", zIndex:1 }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:10, color:"#00ff80", letterSpacing:3, fontWeight:600 }}>APEXCOACH</div>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:1.5 }}>Edit Profile</div>
          </div>
          <button onClick={() => router.back()} style={{ background:"#0e0e0e", border:"1px solid #1e1e1e", borderRadius:8, padding:"6px 14px", color:"#666", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans'" }}>Cancel</button>
        </div>

        {/* Progress */}
        <div style={{ height:3, background:"#1a1a1a", borderRadius:4, overflow:"hidden", marginBottom:12 }}>
          <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#00ff80,#00cc55)", borderRadius:4, transition:"width 0.4s ease" }}/>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:20 }}>
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)} style={{ fontSize:9, letterSpacing:1.5, fontWeight:600, padding:"3px 10px", borderRadius:20, background:i===step?"rgba(0,255,128,0.15)":"transparent", color:i===step?"#00ff80":i<step?"#555":"#333", border:`1px solid ${i===step?"#00ff80":i<step?"#333":"#1a1a1a"}`, transition:"all 0.3s", cursor:"pointer" }}>{s.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, padding:"0 20px", position:"relative", zIndex:1, overflowY:"auto" }}>
        {step === 0 && <StepBody  form={form} setField={setField} toggleArr={toggleArr} />}
        {step === 1 && <StepHealth form={form} setField={setField} toggleArr={toggleArr} />}
        {step === 2 && <StepLifestyle form={form} setField={setField} />}
        {step === 3 && <StepGoals form={form} setField={setField} toggleArr={toggleArr} />}
      </div>

      <div style={{ padding:"14px 20px 36px", display:"flex", gap:10, position:"relative", zIndex:1 }}>
        {step > 0 && <button onClick={() => setStep(s => s-1)} style={{ ...btnStyle("ghost"), flex:1 }}>Back</button>}
        {!isLast ? (
          <button onClick={() => setStep(s => s+1)} style={{ ...btnStyle("primary"), flex:2 }}>Continue</button>
        ) : (
          <button onClick={handleSave} disabled={saving} style={{ ...btnStyle("primary"), flex:2, opacity:saving?0.7:1 }}>
            {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
    </Screen>
  );
}

// ── Step components ────────────────────────────────────
function StepBody({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Body Stats" sub="Update your measurements" />
      <div style={{ display:"flex", gap:12 }}>
        <div style={{ flex:1 }}>
          <Label>Age</Label>
          <input style={inputStyle} placeholder="e.g. 28" type="number" value={form.age} onChange={e => setField("age", e.target.value)} />
        </div>
        <div style={{ flex:1.5 }}>
          <Label>Gender</Label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {["Male","Female","Other"].map(g => (
              <button key={g} onClick={() => setField("gender", g)} style={{ padding:"8px 12px", borderRadius:20, fontSize:12, fontWeight:500, background:form.gender===g?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.gender===g?"#00ff80":"#1e1e1e"}`, color:form.gender===g?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{g}</button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <Label>Weight</Label>
          <UnitToggle value={form.weightUnit} options={["kg","lbs"]} onChange={v => setField("weightUnit", v)} />
        </div>
        <input style={inputStyle} placeholder="e.g. 80" type="number" value={form.weight} onChange={e => setField("weight", e.target.value)} />
      </div>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <Label>Height</Label>
          <UnitToggle value={form.heightUnit} options={["cm","ft"]} onChange={v => setField("heightUnit", v)} />
        </div>
        <input style={inputStyle} placeholder="e.g. 175" type="number" value={form.height} onChange={e => setField("height", e.target.value)} />
      </div>
      <div>
        <Label>Body Fat % <span style={{ color:"#555", fontWeight:400 }}>(optional)</span></Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["<10%","10–15%","15–20%","20–25%","25–30%","30%+","Not sure"].map(v => (
            <button key={v} onClick={() => setField("bodyFat", v)} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:500, background:form.bodyFat===v?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.bodyFat===v?"#00ff80":"#1e1e1e"}`, color:form.bodyFat===v?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepHealth({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Health" sub="Keep your limitations up to date" />
      <div>
        <Label>Fitness Level</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{value:"beginner",label:"Beginner",desc:"Less than 6 months"},{value:"intermediate",label:"Intermediate",desc:"6 months – 2 years"},{value:"advanced",label:"Advanced",desc:"2+ years training"}].map(o => (
            <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.fitnessLevel===o.value} onClick={v => setField("fitnessLevel", v)} />
          ))}
        </div>
      </div>
      <div>
        <Label>Injuries / Limitations</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {INJURY_OPTIONS.map(v => (
            <button key={v} onClick={() => toggleArr("injuries", v)} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:500, background:form.injuries.includes(v)?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.injuries.includes(v)?"#00ff80":"#1e1e1e"}`, color:form.injuries.includes(v)?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>Medical Conditions <span style={{ color:"#555", fontWeight:400 }}>(optional)</span></Label>
        <textarea style={{ ...inputStyle, minHeight:70 }} placeholder="e.g. diabetes, hypertension..." value={form.medicalConditions} onChange={e => setField("medicalConditions", e.target.value)} />
      </div>
    </div>
  );
}

function StepLifestyle({ form, setField }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Lifestyle" sub="Adjust based on how your life has changed" />
      <div>
        <Label>Job Type</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{value:"sedentary",label:"Sedentary",desc:"Desk job, mostly sitting"},{value:"light",label:"Lightly Active",desc:"On feet occasionally"},{value:"active",label:"Active",desc:"Physical job or always on feet"}].map(o => (
            <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.jobType===o.value} onClick={v => setField("jobType", v)} />
          ))}
        </div>
      </div>
      <div>
        <Label>Avg Sleep</Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["<5h","5–6h","6–7h","7–8h","8h+"].map(v => (
            <button key={v} onClick={() => setField("sleepHours", v)} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:500, background:form.sleepHours===v?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.sleepHours===v?"#00ff80":"#1e1e1e"}`, color:form.sleepHours===v?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>Stress Level</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["Low","Medium","High","Very High"].map(v => (
            <button key={v} onClick={() => setField("stressLevel", v)} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:500, background:form.stressLevel===v?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.stressLevel===v?"#00ff80":"#1e1e1e"}`, color:form.stressLevel===v?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>Training Days per Week</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["2","3","4","5","6"].map(v => (
            <button key={v} onClick={() => setField("trainingDays", v)} style={{ width:48, height:48, borderRadius:10, background:form.trainingDays===v?"#00ff80":"#0e0e0e", border:`1px solid ${form.trainingDays===v?"#00ff80":"#1e1e1e"}`, color:form.trainingDays===v?"#000":"#777", fontWeight:700, fontSize:16, cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepGoals({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Goals" sub="Update what you are training for" />
      <div>
        <Label>Primary Goal</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{value:"fat_loss",label:"Fat Loss",desc:"Burn fat, get leaner"},{value:"muscle_gain",label:"Muscle Gain",desc:"Build size and strength"},{value:"maintain",label:"Maintain & Tone",desc:"Stay fit, improve definition"}].map(o => (
            <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.primaryGoal===o.value} onClick={v => setField("primaryGoal", v)} />
          ))}
        </div>
      </div>
      <div>
        <Label>Target Weight <span style={{ color:"#555", fontWeight:400 }}>(optional)</span></Label>
        <input style={inputStyle} placeholder="e.g. 80 kg" value={form.targetWeight} onChange={e => setField("targetWeight", e.target.value)} />
      </div>
      <div>
        <Label>Workout Location</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["Gym","Home","Both"].map(v => (
            <button key={v} onClick={() => toggleArr("workoutLocation", v)} style={{ padding:"6px 18px", borderRadius:20, fontSize:12, fontWeight:500, background:form.workoutLocation.includes(v)?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.workoutLocation.includes(v)?"#00ff80":"#1e1e1e"}`, color:form.workoutLocation.includes(v)?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>Equipment Available</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {EQUIPMENT_OPTIONS.map(v => (
            <button key={v} onClick={() => toggleArr("equipment", v)} style={{ padding:"6px 12px", borderRadius:20, fontSize:11, fontWeight:500, background:form.equipment.includes(v)?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.equipment.includes(v)?"#00ff80":"#1e1e1e"}`, color:form.equipment.includes(v)?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>Dietary Preferences</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {DIETARY_OPTIONS.map(v => (
            <button key={v} onClick={() => toggleArr("dietaryPrefs", v)} style={{ padding:"6px 12px", borderRadius:20, fontSize:11, fontWeight:500, background:form.dietaryPrefs.includes(v)?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.dietaryPrefs.includes(v)?"#00ff80":"#1e1e1e"}`, color:form.dietaryPrefs.includes(v)?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepTitle({ title, sub }) {
  return (
    <div style={{ marginBottom:4 }}>
      <h2 style={{ fontFamily:"'Bebas Neue'", fontSize:32, letterSpacing:2, margin:0 }}>{title}</h2>
      <p style={{ color:"#666", fontSize:12, margin:"4px 0 0" }}>{sub}</p>
    </div>
  );
}



function UnitToggle({ value, options, onChange }) {
  return (
    <div style={{ display:"flex", background:"#0e0e0e", border:"1px solid #1e1e1e", borderRadius:8, overflow:"hidden" }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{ padding:"4px 14px", fontSize:12, fontWeight:600, background:value===o?"rgba(0,255,128,0.15)":"transparent", border:"none", color:value===o?"#00ff80":"#555", cursor:"pointer", fontFamily:"'DM Sans'" }}>{o}</button>
      ))}
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, btnStyle, inputStyle, Label, Chip, RadioCard } from "../components/shared";

const STEPS = ["Profile", "Health", "Lifestyle", "Goals"];

const EQUIPMENT_OPTIONS = [
  "Barbell & Plates","Dumbbells","Cables/Pulleys","Smith Machine",
  "Pull-up Bar","Resistance Bands","Kettlebells","Bench","No Equipment",
];
const DIETARY_OPTIONS = [
  "No Restrictions","Vegetarian","Vegan","Keto","Halal",
  "Gluten-Free","Dairy-Free","Nut Allergy","Low Carb",
];
const INJURY_OPTIONS = [
  "None","Lower Back","Knee","Shoulder","Neck",
  "Hip","Wrist/Elbow","Ankle","Heart Condition",
];

function buildForm() {
  return {
    age:"", gender:"", weight:70, weightUnit:"kg",
    height:170, heightUnit:"cm", bodyFat:"",
    fitnessLevel:"", injuries:[], medicalConditions:"",
    jobType:"", sleepHours:"", stressLevel:"", trainingDays:"",
    primaryGoal:"", targetWeight:"", workoutLocation:[], equipment:[], dietaryPrefs:[],
  };
}

export default function Home() {
  const router = useRouter();
  const [screen, setScreen] = useState("welcome");
  const [step, setStep]     = useState(0);
  const [authMode, setAuthMode] = useState(null);
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm]     = useState(buildForm());

  const setField   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr  = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }));
  const progress = ((step + 1) / STEPS.length) * 100;

  if (screen === "welcome") return (
    <Screen style={{ justifyContent:"space-between" }}>
      <div style={{ padding:"56px 24px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:44 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:"linear-gradient(135deg,#00ff80,#00cc66)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:20, color:"#000", letterSpacing:1 }}>A</div>
          <span style={{ fontFamily:"'Bebas Neue'", fontSize:22, letterSpacing:3, color:"#00ff80" }}>APEXCOACH</span>
        </div>
        <div style={{ fontSize:11, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:8 }}>YOUR AI TRAINER</div>
        <h1 style={{ fontFamily:"'Bebas Neue'", fontSize:62, lineHeight:1, letterSpacing:2, margin:"0 0 18px", background:"linear-gradient(180deg,#ffffff 0%,#999 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          BUILD YOUR<br /><span style={{ WebkitTextFillColor:"#00ff80" }}>BEST SELF</span>
        </h1>
        <p style={{ color:"#777", fontSize:15, lineHeight:1.7, maxWidth:300 }}>
          AI-powered workout and nutrition plans tailored to your body, goals, and life — updated every week.
        </p>
      </div>
      <div style={{ padding:"0 24px 48px", position:"relative", zIndex:1 }}>
        {!authMode ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button onClick={() => alert("Wire up Firebase Google Sign-In")} style={btnStyle("outline")}>Continue with Google</button>
            <button onClick={() => setAuthMode("email")} style={btnStyle("ghost")}>Continue with Email</button>
            <button onClick={() => setScreen("onboarding")} style={{ ...btnStyle("primary"), marginTop:4 }}>Get Started</button>
            <p style={{ textAlign:"center", color:"#555", fontSize:11, marginTop:6 }}>By continuing, you agree to our Terms and Privacy Policy</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} type="email" />
            <input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} type="password" />
            <button onClick={() => setScreen("onboarding")} style={btnStyle("primary")}>Get Started</button>
            <button onClick={() => setAuthMode(null)} style={{ background:"none", border:"none", color:"#666", fontSize:13, cursor:"pointer", marginTop:4 }}>Back</button>
          </div>
        )}
      </div>
    </Screen>
  );

  if (screen === "generating") return (
    <Screen style={{ alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", zIndex:1, padding:"0 32px" }}>
        <PulsingRing />
        <div style={{ fontFamily:"'Bebas Neue'", fontSize:32, letterSpacing:2, marginTop:28 }}>BUILDING YOUR PLAN</div>
        <p style={{ color:"#777", fontSize:13, marginTop:10, lineHeight:1.7 }}>Analyzing your profile and crafting a personalized workout and nutrition plan...</p>
        <LoadingDots />
        <button onClick={() => router.push("/dashboard")} style={{ ...btnStyle("primary"), marginTop:32, maxWidth:300, margin:"32px auto 0" }}>View My Plan</button>
      </div>
    </Screen>
  );

  return (
    <Screen>
      <div style={{ padding:"44px 20px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <span style={{ fontFamily:"'Bebas Neue'", fontSize:18, letterSpacing:3, color:"#00ff80" }}>APEXCOACH</span>
          <span style={{ fontSize:12, color:"#777" }}>Step {step + 1} of {STEPS.length}</span>
        </div>
        <div style={{ height:3, background:"#1a1a1a", borderRadius:4, overflow:"hidden", marginBottom:12 }}>
          <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#00ff80,#00cc55)", borderRadius:4, transition:"width 0.4s ease" }}/>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:20 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ fontSize:9, letterSpacing:1.5, fontWeight:600, padding:"3px 10px", borderRadius:20, background: i===step?"rgba(0,255,128,0.15)":"transparent", color: i===step?"#00ff80": i<step?"#555":"#333", border:`1px solid ${i===step?"#00ff80":i<step?"#333":"#1a1a1a"}`, transition:"all 0.3s" }}>{s.toUpperCase()}</div>
          ))}
        </div>
      </div>

      <div style={{ flex:1, padding:"0 20px", position:"relative", zIndex:1, overflowY:"auto" }}>
        {step === 0 && <StepProfile  form={form} setField={setField} toggleArr={toggleArr} />}
        {step === 1 && <StepHealth   form={form} setField={setField} toggleArr={toggleArr} />}
        {step === 2 && <StepLifestyle form={form} setField={setField} />}
        {step === 3 && <StepGoals    form={form} setField={setField} toggleArr={toggleArr} />}
      </div>

      <div style={{ padding:"14px 20px 36px", display:"flex", gap:10, position:"relative", zIndex:1 }}>
        {step > 0 && <button onClick={() => setStep(s => s-1)} style={{ ...btnStyle("ghost"), flex:1 }}>Back</button>}
        <button onClick={() => step < STEPS.length-1 ? setStep(s => s+1) : setScreen("generating")} style={{ ...btnStyle("primary"), flex:2 }}>
          {step < STEPS.length-1 ? "Continue" : "Generate My Plan"}
        </button>
      </div>
    </Screen>
  );
}

// ── Step 1: Body Stats ─────────────────────────────────
function StepProfile({ form, setField }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Body Stats" sub="Help us understand your starting point" />

      <div style={{ display:"flex", gap:12 }}>
        <div style={{ flex:1 }}>
          <Label>Age</Label>
          <input style={inputStyle} placeholder="e.g. 28" type="number" value={form.age} onChange={e => setField("age", e.target.value)} />
        </div>
        <div style={{ flex:1.5 }}>
          <Label>Gender</Label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {["Male","Female","Other"].map(g => (
              <button key={g} onClick={() => setField("gender", g)} style={{ padding:"8px 12px", borderRadius:20, fontSize:12, fontWeight:500, background: form.gender===g?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.gender===g?"#00ff80":"#1e1e1e"}`, color: form.gender===g?"#00ff80":"#777", cursor:"pointer", transition:"all 0.2s", fontFamily:"'DM Sans'" }}>{g}</button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <Label>Weight</Label>
          <div style={{ display:"flex", background:"#0e0e0e", border:"1px solid #1e1e1e", borderRadius:8, overflow:"hidden" }}>
            {["kg","lbs"].map(u => (
              <button key={u} onClick={() => setField("weightUnit", u)} style={{ padding:"4px 14px", fontSize:12, fontWeight:600, background: form.weightUnit===u?"rgba(0,255,128,0.15)":"transparent", border:"none", color: form.weightUnit===u?"#00ff80":"#555", cursor:"pointer", fontFamily:"'DM Sans'" }}>{u}</button>
            ))}
          </div>
        </div>
        <RulerPicker value={form.weight} onChange={v => setField("weight", v)} min={form.weightUnit==="kg"?30:66} max={form.weightUnit==="kg"?200:440} unit={form.weightUnit} />
      </div>

      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <Label>Height</Label>
          <div style={{ display:"flex", background:"#0e0e0e", border:"1px solid #1e1e1e", borderRadius:8, overflow:"hidden" }}>
            {["cm","ft"].map(u => (
              <button key={u} onClick={() => setField("heightUnit", u)} style={{ padding:"4px 14px", fontSize:12, fontWeight:600, background: form.heightUnit===u?"rgba(0,255,128,0.15)":"transparent", border:"none", color: form.heightUnit===u?"#00ff80":"#555", cursor:"pointer", fontFamily:"'DM Sans'" }}>{u}</button>
            ))}
          </div>
        </div>
        <RulerPicker value={form.height} onChange={v => setField("height", v)} min={form.heightUnit==="cm"?120:4} max={form.heightUnit==="cm"?220:7} unit={form.heightUnit} step={form.heightUnit==="ft"?0.1:1} />
      </div>

      <div>
        <Label>Body Fat % <span style={{ color:"#555", fontWeight:400 }}>(optional)</span></Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["<10%","10–15%","15–20%","20–25%","25–30%","30%+","Not sure"].map(v => (
            <button key={v} onClick={() => setField("bodyFat", v)} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:500, background: form.bodyFat===v?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.bodyFat===v?"#00ff80":"#1e1e1e"}`, color: form.bodyFat===v?"#00ff80":"#777", cursor:"pointer", transition:"all 0.2s", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Health ────────────────────────────────────
function StepHealth({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Health" sub="So we can keep you safe and progressing" />
      <div>
        <Label>Fitness Level</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { value:"beginner",     label:"Beginner",     desc:"Less than 6 months training" },
            { value:"intermediate", label:"Intermediate", desc:"6 months – 2 years training" },
            { value:"advanced",     label:"Advanced",     desc:"2+ years consistent training" },
          ].map(o => (
            <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.fitnessLevel===o.value} onClick={v => setField("fitnessLevel", v)} />
          ))}
        </div>
      </div>
      <div>
        <Label>Injuries / Limitations</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["None","Lower Back","Knee","Shoulder","Neck","Hip","Wrist/Elbow","Ankle","Heart Condition"].map(v => (
            <button key={v} onClick={() => toggleArr("injuries", v)} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:500, background: form.injuries.includes(v)?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.injuries.includes(v)?"#00ff80":"#1e1e1e"}`, color: form.injuries.includes(v)?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
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

// ── Step 3: Lifestyle ─────────────────────────────────
function StepLifestyle({ form, setField }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Lifestyle" sub="Your plan adapts to your daily life" />
      <div>
        <Label>Job Type</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { value:"sedentary", label:"Sedentary",      desc:"Desk job, mostly sitting" },
            { value:"light",     label:"Lightly Active", desc:"On feet occasionally" },
            { value:"active",    label:"Active",         desc:"Physical job or always on feet" },
          ].map(o => (
            <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.jobType===o.value} onClick={v => setField("jobType", v)} />
          ))}
        </div>
      </div>
      <div>
        <Label>Avg Sleep</Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["<5h","5–6h","6–7h","7–8h","8h+"].map(v => (
            <button key={v} onClick={() => setField("sleepHours", v)} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:500, background: form.sleepHours===v?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.sleepHours===v?"#00ff80":"#1e1e1e"}`, color: form.sleepHours===v?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>Stress Level</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["Low","Medium","High","Very High"].map(v => (
            <button key={v} onClick={() => setField("stressLevel", v)} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:500, background: form.stressLevel===v?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.stressLevel===v?"#00ff80":"#1e1e1e"}`, color: form.stressLevel===v?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>Training Days per Week</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["2","3","4","5","6"].map(v => (
            <button key={v} onClick={() => setField("trainingDays", v)} style={{ width:48, height:48, borderRadius:10, background: form.trainingDays===v?"#00ff80":"#0e0e0e", border:`1px solid ${form.trainingDays===v?"#00ff80":"#1e1e1e"}`, color: form.trainingDays===v?"#000":"#777", fontWeight:700, fontSize:16, cursor:"pointer", transition:"all 0.2s", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Goals ─────────────────────────────────────
function StepGoals({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Goals" sub="Tell us what you are training for" />
      <div>
        <Label>Primary Goal</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { value:"fat_loss",    label:"Fat Loss",        desc:"Burn fat, get leaner" },
            { value:"muscle_gain", label:"Muscle Gain",     desc:"Build size and strength" },
            { value:"maintain",    label:"Maintain & Tone", desc:"Stay fit, improve definition" },
          ].map(o => (
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
            <button key={v} onClick={() => toggleArr("workoutLocation", v)} style={{ padding:"6px 18px", borderRadius:20, fontSize:12, fontWeight:500, background: form.workoutLocation.includes(v)?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.workoutLocation.includes(v)?"#00ff80":"#1e1e1e"}`, color: form.workoutLocation.includes(v)?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>Equipment Available</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {EQUIPMENT_OPTIONS.map(v => (
            <button key={v} onClick={() => toggleArr("equipment", v)} style={{ padding:"6px 12px", borderRadius:20, fontSize:11, fontWeight:500, background: form.equipment.includes(v)?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.equipment.includes(v)?"#00ff80":"#1e1e1e"}`, color: form.equipment.includes(v)?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>Dietary Preferences</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {DIETARY_OPTIONS.map(v => (
            <button key={v} onClick={() => toggleArr("dietaryPrefs", v)} style={{ padding:"6px 12px", borderRadius:20, fontSize:11, fontWeight:500, background: form.dietaryPrefs.includes(v)?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.dietaryPrefs.includes(v)?"#00ff80":"#1e1e1e"}`, color: form.dietaryPrefs.includes(v)?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Ruler Picker ───────────────────────────────────────
function RulerPicker({ value, onChange, min, max, unit, step = 1 }) {
  const trackRef  = useRef(null);
  const startX    = useRef(null);
  const startVal  = useRef(null);
  const pixelsPerUnit = 4;

  const clamp = v => Math.min(max, Math.max(min, Math.round(v / step) * step));

  const onPointerDown = (e) => {
    startX.current   = e.clientX ?? e.touches?.[0]?.clientX;
    startVal.current  = value;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup",   onPointerUp);
    window.addEventListener("touchmove",   onTouchMove, { passive:false });
    window.addEventListener("touchend",    onPointerUp);
  };
  const onPointerMove = (e) => {
    const x    = e.clientX;
    const delta = (startX.current - x) / pixelsPerUnit * step;
    onChange(clamp(startVal.current + delta));
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    const x    = e.touches[0].clientX;
    const delta = (startX.current - x) / pixelsPerUnit * step;
    onChange(clamp(startVal.current + delta));
  };
  const onPointerUp = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup",   onPointerUp);
    window.removeEventListener("touchmove",   onTouchMove);
    window.removeEventListener("touchend",    onPointerUp);
  };

  const displayVal = step < 1 ? value.toFixed(1) : Math.round(value);
  const ticks = [];
  const range = max - min;
  for (let i = 0; i <= range; i++) {
    const v = min + i;
    const isMajor = v % 10 === 0;
    const isMid   = v % 5  === 0;
    ticks.push({ v, isMajor, isMid });
  }

  return (
    <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:14, overflow:"hidden", userSelect:"none" }}>
      {/* Value display */}
      <div style={{ textAlign:"center", padding:"16px 0 8px" }}>
        <span style={{ fontFamily:"'Bebas Neue'", fontSize:52, color:"#f0f0f0", letterSpacing:2 }}>{displayVal}</span>
        <span style={{ fontSize:14, color:"#777", marginLeft:6, fontWeight:500 }}>{unit}</span>
      </div>

      {/* Ruler */}
      <div ref={trackRef} onPointerDown={onPointerDown} onTouchStart={onPointerDown}
        style={{ position:"relative", height:60, overflow:"hidden", cursor:"ew-resize", touchAction:"none" }}>

        {/* Center line */}
        <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:2, background:"#00ff80", zIndex:2, transform:"translateX(-50%)" }}/>
        <div style={{ position:"absolute", left:"50%", top:0, width:0, height:0, zIndex:3, transform:"translateX(-50%)", borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderTop:"8px solid #00ff80" }}/>

        {/* Tick marks */}
        <div style={{ position:"absolute", top:0, bottom:0, display:"flex", alignItems:"flex-end", paddingBottom:8,
          left:`calc(50% - ${(value - min) * pixelsPerUnit / step}px)`,
          transition:"left 0s",
        }}>
          {ticks.map(({ v, isMajor, isMid }) => (
            <div key={v} style={{ display:"flex", flexDirection:"column", alignItems:"center", width: pixelsPerUnit / step }}>
              <div style={{ width:1, height: isMajor?28:isMid?18:10, background: isMajor?"#555":isMid?"#333":"#222", flexShrink:0 }}/>
              {isMajor && <div style={{ fontSize:9, color:"#555", marginTop:3, position:"absolute", bottom:2, transform:"translateX(-50%)", whiteSpace:"nowrap" }}>{v}</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign:"center", paddingBottom:10, fontSize:10, color:"#444", letterSpacing:2 }}>DRAG TO ADJUST</div>
    </div>
  );
}

function StepTitle({ title, sub }) {
  return (
    <div style={{ marginBottom:4 }}>
      <h2 style={{ fontFamily:"'Bebas Neue'", fontSize:34, letterSpacing:2, margin:0 }}>{title}</h2>
      <p style={{ color:"#666", fontSize:12, margin:"4px 0 0" }}>{sub}</p>
    </div>
  );
}

function PulsingRing() {
  return (
    <div style={{ position:"relative", width:90, height:90, margin:"0 auto" }}>
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid rgba(0,255,128,0.12)", animation:"pulse 2s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", inset:8, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#00ff80", animation:"spin 1.2s linear infinite" }}/>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:22, color:"#00ff80" }}>AC</div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:18 }}>
      {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#00ff80", animation:`dots 1.4s ease-in-out ${i*0.2}s infinite` }}/>)}
    </div>
  );
}

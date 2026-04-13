import { useState } from "react";
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
    age:"", gender:"", weight:"", weightUnit:"kg",
    height:"", heightUnit:"cm", bodyFat:"",
    fitnessLevel:"", injuries:[], medicalConditions:"",
    jobType:"", sleepHours:"", stressLevel:"", trainingDays:"",
    primaryGoal:"", targetWeight:"", workoutLocation:[], equipment:[], dietaryPrefs:[],
  };
}

export default function Home() {
  const router = useRouter();
  const [screen, setScreen] = useState("welcome"); // welcome | onboarding | generating
  const [step, setStep]     = useState(0);
  const [authMode, setAuthMode] = useState(null);
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm]     = useState(buildForm());

  const setField   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr  = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }));
  const progress   = ((step + 1) / STEPS.length) * 100;

  // ── Welcome ──
  if (screen === "welcome") return (
    <Screen style={{ justifyContent:"space-between" }}>
      <div style={{ padding:"60px 24px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:48 }}>
          <div style={{
            width:36, height:36, borderRadius:8,
            background:"linear-gradient(135deg,#00ff80,#00cc66)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'Bebas Neue'", fontSize:20, color:"#000", letterSpacing:1,
          }}>A</div>
          <span style={{ fontFamily:"'Bebas Neue'", fontSize:22, letterSpacing:3, color:"#00ff80" }}>APEXCOACH</span>
        </div>
        <div style={{ fontSize:11, color:"#00ff80", letterSpacing:3, fontWeight:600, marginBottom:8 }}>YOUR AI TRAINER</div>
        <h1 style={{
          fontFamily:"'Bebas Neue'", fontSize:62, lineHeight:1, letterSpacing:2, margin:"0 0 18px",
          background:"linear-gradient(180deg,#ffffff 0%,#888 100%)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>
          BUILD YOUR<br />
          <span style={{ WebkitTextFillColor:"#00ff80" }}>BEST SELF</span>
        </h1>
        <p style={{ color:"#555", fontSize:15, lineHeight:1.7, maxWidth:300 }}>
          AI-powered workout and nutrition plans tailored to your body, goals, and life — updated every week.
        </p>
      </div>

      <div style={{ padding:"0 24px 48px", position:"relative", zIndex:1 }}>
        {!authMode ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button onClick={() => alert("Wire up Firebase Google Sign-In")} style={btnStyle("outline")}>
              Continue with Google
            </button>
            <button onClick={() => setAuthMode("email")} style={btnStyle("ghost")}>
              Continue with Email
            </button>
            <button onClick={() => setScreen("onboarding")} style={{ ...btnStyle("primary"), marginTop:4 }}>
              Get Started
            </button>
            <p style={{ textAlign:"center", color:"#333", fontSize:11, marginTop:6 }}>
              By continuing, you agree to our Terms and Privacy Policy
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} type="email" />
            <input placeholder="Password"      value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} type="password" />
            <button onClick={() => setScreen("onboarding")} style={btnStyle("primary")}>Get Started</button>
            <button onClick={() => setAuthMode(null)} style={{ background:"none", border:"none", color:"#444", fontSize:13, cursor:"pointer", marginTop:4 }}>Back</button>
          </div>
        )}
      </div>
    </Screen>
  );

  // ── Generating ──
  if (screen === "generating") return (
    <Screen style={{ alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", zIndex:1, padding:"0 32px" }}>
        <PulsingRing />
        <div style={{ fontFamily:"'Bebas Neue'", fontSize:32, letterSpacing:2, marginTop:28 }}>BUILDING YOUR PLAN</div>
        <p style={{ color:"#555", fontSize:13, marginTop:10, lineHeight:1.7 }}>
          Analyzing your profile and crafting a personalized workout and nutrition plan...
        </p>
        <LoadingDots />
        <button
          onClick={() => router.push("/dashboard")}
          style={{ ...btnStyle("primary"), marginTop:32, maxWidth:300, margin:"32px auto 0" }}
        >
          View My Plan
        </button>
      </div>
    </Screen>
  );

  // ── Onboarding steps ──
  return (
    <Screen>
      <div style={{ padding:"48px 20px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontFamily:"'Bebas Neue'", fontSize:18, letterSpacing:3, color:"#00ff80" }}>APEXCOACH</span>
          <span style={{ fontSize:12, color:"#333" }}>Step {step + 1} of {STEPS.length}</span>
        </div>
        <div style={{ height:3, background:"#1a1a1a", borderRadius:4, overflow:"hidden", marginBottom:12 }}>
          <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#00ff80,#00cc55)", borderRadius:4, transition:"width 0.4s ease" }}/>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:24 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              fontSize:9, letterSpacing:1.5, fontWeight:600,
              padding:"3px 10px", borderRadius:20,
              background: i === step ? "rgba(0,255,128,0.15)" : "transparent",
              color: i === step ? "#00ff80" : i < step ? "#333" : "#222",
              border:`1px solid ${i === step ? "#00ff80" : i < step ? "#222" : "#1a1a1a"}`,
              transition:"all 0.3s",
            }}>{s.toUpperCase()}</div>
          ))}
        </div>
      </div>

      <div style={{ flex:1, padding:"0 20px", position:"relative", zIndex:1, overflowY:"auto" }}>
        {step === 0 && <StepProfile  form={form} setField={setField} toggleArr={toggleArr} />}
        {step === 1 && <StepHealth   form={form} setField={setField} toggleArr={toggleArr} />}
        {step === 2 && <StepLifestyle form={form} setField={setField} />}
        {step === 3 && <StepGoals    form={form} setField={setField} toggleArr={toggleArr} />}
      </div>

      <div style={{ padding:"16px 20px 36px", display:"flex", gap:10, position:"relative", zIndex:1 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{ ...btnStyle("ghost"), flex:1 }}>Back</button>
        )}
        <button
          onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : setScreen("generating")}
          style={{ ...btnStyle("primary"), flex:2 }}
        >
          {step < STEPS.length - 1 ? "Continue" : "Generate My Plan"}
        </button>
      </div>
    </Screen>
  );
}

// ── Step components ────────────────────────────────────
function StepProfile({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <StepTitle title="Body Stats" sub="Help us understand your starting point" />
      <div style={{ display:"flex", gap:12 }}>
        <div style={{ flex:1 }}>
          <Label>Age</Label>
          <input style={inputStyle} placeholder="e.g. 28" type="number" value={form.age} onChange={e => setField("age", e.target.value)} />
        </div>
        <div style={{ flex:1.5 }}>
          <Label>Gender</Label>
          <div style={{ display:"flex", gap:6 }}>
            {["Male","Female","Other"].map(g => <Chip key={g} label={g} active={form.gender===g} onClick={() => setField("gender",g)} />)}
          </div>
        </div>
      </div>
      <div>
        <Label>Weight</Label>
        <div style={{ display:"flex", gap:6 }}>
          <input style={{ ...inputStyle, flex:1 }} placeholder="70" type="number" value={form.weight} onChange={e => setField("weight",e.target.value)} />
          <UnitToggle value={form.weightUnit} options={["kg","lbs"]} onChange={v => setField("weightUnit",v)} />
        </div>
      </div>
      <div>
        <Label>Height</Label>
        <div style={{ display:"flex", gap:6 }}>
          <input style={{ ...inputStyle, flex:1 }} placeholder="175" type="number" value={form.height} onChange={e => setField("height",e.target.value)} />
          <UnitToggle value={form.heightUnit} options={["cm","ft"]} onChange={v => setField("heightUnit",v)} />
        </div>
      </div>
      <div>
        <Label>Body Fat % <span style={{ color:"#333", fontWeight:400 }}>(optional)</span></Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["<10%","10–15%","15–20%","20–25%","25–30%","30%+","Not sure"].map(v => (
            <Chip key={v} label={v} active={form.bodyFat===v} onClick={() => setField("bodyFat",v)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepHealth({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <StepTitle title="Health" sub="So we can keep you safe and progressing" />
      <div>
        <Label>Fitness Level</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { val:"beginner",     label:"Beginner",     desc:"Less than 6 months training" },
            { val:"intermediate", label:"Intermediate", desc:"6 months – 2 years training" },
            { val:"advanced",     label:"Advanced",     desc:"2+ years consistent training" },
          ].map(o => <RadioCard key={o.val} {...o} active={form.fitnessLevel===o.val} onClick={v => setField("fitnessLevel",v)} />)}
        </div>
      </div>
      <div>
        <Label>Injuries / Limitations</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {INJURY_OPTIONS.map(v => <Chip key={v} label={v} active={form.injuries.includes(v)} onClick={() => toggleArr("injuries",v)} />)}
        </div>
      </div>
      <div>
        <Label>Medical Conditions <span style={{ color:"#333", fontWeight:400 }}>(optional)</span></Label>
        <textarea style={{ ...inputStyle, minHeight:70 }} placeholder="e.g. diabetes, hypertension..." value={form.medicalConditions} onChange={e => setField("medicalConditions",e.target.value)} />
      </div>
    </div>
  );
}

function StepLifestyle({ form, setField }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <StepTitle title="Lifestyle" sub="Your plan adapts to your daily life" />
      <div>
        <Label>Job Type</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { val:"sedentary", label:"Sedentary",       desc:"Desk job, mostly sitting" },
            { val:"light",     label:"Lightly Active",  desc:"On feet occasionally" },
            { val:"active",    label:"Active",          desc:"Physical job or always on feet" },
          ].map(o => <RadioCard key={o.val} {...o} active={form.jobType===o.val} onClick={v => setField("jobType",v)} />)}
        </div>
      </div>
      <div>
        <Label>Avg Sleep</Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["<5h","5–6h","6–7h","7–8h","8h+"].map(v => <Chip key={v} label={v} active={form.sleepHours===v} onClick={() => setField("sleepHours",v)} />)}
        </div>
      </div>
      <div>
        <Label>Stress Level</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["Low","Medium","High","Very High"].map(v => <Chip key={v} label={v} active={form.stressLevel===v} onClick={() => setField("stressLevel",v)} />)}
        </div>
      </div>
      <div>
        <Label>Training Days per Week</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["2","3","4","5","6"].map(v => (
            <button key={v} onClick={() => setField("trainingDays",v)} style={{
              width:48, height:48, borderRadius:10,
              background: form.trainingDays===v ? "#00ff80" : "#0e0e0e",
              border:`1px solid ${form.trainingDays===v ? "#00ff80" : "#1e1e1e"}`,
              color: form.trainingDays===v ? "#000" : "#666",
              fontWeight:700, fontSize:16, cursor:"pointer", transition:"all 0.2s",
              fontFamily:"'DM Sans'",
            }}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepGoals({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <StepTitle title="Goals" sub="Tell us what you are training for" />
      <div>
        <Label>Primary Goal</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { val:"fat_loss",     label:"Fat Loss",        desc:"Burn fat, get leaner" },
            { val:"muscle_gain",  label:"Muscle Gain",     desc:"Build size and strength" },
            { val:"maintain",     label:"Maintain & Tone", desc:"Stay fit, improve definition" },
          ].map(o => <RadioCard key={o.val} {...o} active={form.primaryGoal===o.val} onClick={v => setField("primaryGoal",v)} />)}
        </div>
      </div>
      <div>
        <Label>Target Weight <span style={{ color:"#333", fontWeight:400 }}>(optional)</span></Label>
        <input style={inputStyle} placeholder="e.g. 80 kg" value={form.targetWeight} onChange={e => setField("targetWeight",e.target.value)} />
      </div>
      <div>
        <Label>Workout Location</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["Gym","Home","Both"].map(v => <Chip key={v} label={v} active={form.workoutLocation.includes(v)} onClick={() => toggleArr("workoutLocation",v)} />)}
        </div>
      </div>
      <div>
        <Label>Equipment Available</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {EQUIPMENT_OPTIONS.map(v => <Chip key={v} label={v} active={form.equipment.includes(v)} onClick={() => toggleArr("equipment",v)} />)}
        </div>
      </div>
      <div>
        <Label>Dietary Preferences</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {DIETARY_OPTIONS.map(v => <Chip key={v} label={v} active={form.dietaryPrefs.includes(v)} onClick={() => toggleArr("dietaryPrefs",v)} />)}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────
function StepTitle({ title, sub }) {
  return (
    <div style={{ marginBottom:4 }}>
      <h2 style={{ fontFamily:"'Bebas Neue'", fontSize:34, letterSpacing:2, margin:0 }}>{title}</h2>
      <p style={{ color:"#444", fontSize:12, margin:"4px 0 0" }}>{sub}</p>
    </div>
  );
}

function UnitToggle({ value, options, onChange }) {
  return (
    <div style={{ display:"flex", background:"#0e0e0e", border:"1px solid #1e1e1e", borderRadius:8, overflow:"hidden", flexShrink:0 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding:"0 13px", fontSize:12, fontWeight:600,
          background: value===o ? "rgba(0,255,128,0.15)" : "transparent",
          border:"none", color: value===o ? "#00ff80" : "#444",
          cursor:"pointer", fontFamily:"'DM Sans'",
        }}>{o}</button>
      ))}
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
      {[0,1,2].map(i => (
        <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#00ff80", animation:`dots 1.4s ease-in-out ${i*0.2}s infinite` }}/>
      ))}
    </div>
  );
}

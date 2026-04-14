import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, btnStyle, inputStyle, Label, Chip, RadioCard, C } from "../components/shared";
import { signInWithGoogle, signUpWithEmail, signInWithEmail, signInAnonymously, saveUserProfile, saveWeekPlan } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";

const F = "'Lexend', sans-serif";
const STEPS = ["Profile","Health","Lifestyle","Goals"];
const EQUIPMENT_OPTIONS = ["Barbell & Plates","Dumbbells","Cables/Pulleys","Smith Machine","Pull-up Bar","Resistance Bands","Kettlebells","Bench","No Equipment"];
const DIETARY_OPTIONS   = ["No Restrictions","Vegetarian","Vegan","Keto","Halal","Gluten-Free","Dairy-Free","Nut Allergy","Low Carb"];
const INJURY_OPTIONS    = ["None","Lower Back","Knee","Shoulder","Neck","Hip","Wrist/Elbow","Ankle","Heart Condition"];

function buildForm() {
  return {
    age:"", gender:"", weight:70, weightUnit:"kg", height:170, heightUnit:"cm", bodyFat:"",
    fitnessLevel:"", injuries:[], medicalConditions:"",
    jobType:"", sleepHours:"", stressLevel:"", trainingDays:"",
    primaryGoal:"", targetWeight:"", workoutLocation:[], equipment:[], dietaryPrefs:[],
  };
}

export default function Home() {
  const router = useRouter();
  const { user, profile, loading, setProfile } = useAuth();
  const [screen,      setScreen]      = useState("welcome");
  const [step,        setStep]        = useState(0);
  const [authMode,    setAuthMode]    = useState(null);
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [authErr,     setAuthErr]     = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [form,        setForm]        = useState(buildForm());

  useEffect(() => {
    if (loading) return;
    if (user && profile?.onboardingComplete) router.replace("/dashboard");
    else if (user && !profile?.onboardingComplete && screen === "welcome") setScreen("onboarding");
  }, [user, profile, loading]);

  if (loading) return <LoadingScreen />;

  const setField  = (k,v) => setForm(f => ({ ...f, [k]:v }));
  const toggleArr = (k,v) => setForm(f => ({ ...f, [k]: f[k].includes(v) ? f[k].filter(x=>x!==v) : [...f[k],v] }));
  const progress  = ((step+1)/STEPS.length)*100;

  const handleGoogle = async () => {
    setAuthLoading(true); setAuthErr("");
    try { await signInWithGoogle(); }
    catch(e) { setAuthErr(e.message); setAuthLoading(false); }
  };
  const handleGuest = async () => {
    setAuthLoading(true); setAuthErr("");
    try { await signInAnonymously(); }
    catch(e) { setAuthErr(e.message); setAuthLoading(false); }
  };
  const handleEmailAuth = async () => {
    setAuthLoading(true); setAuthErr("");
    try {
      if (authMode === "signup") await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
    } catch(e) {
      setAuthErr(e.code === "auth/user-not-found" || e.code === "auth/wrong-password" ? "Invalid email or password." : e.message);
      setAuthLoading(false);
    }
  };

  // ── WELCOME ───────────────────────────────────────────
  if (screen === "welcome") return (
    <Screen style={{ justifyContent:"space-between" }}>
      <div style={{ padding:"60px 24px 0", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:11, color:C.muted, letterSpacing:3, fontWeight:600, marginBottom:12 }}>YOUR AI TRAINER</div>
        <div style={{ fontSize:52, fontWeight:900, color:C.white, lineHeight:1, letterSpacing:-1, marginBottom:8 }}>
          BUILD YOUR<br /><span style={{ color:C.accent }}>BEST SELF</span>
        </div>
        <div style={{ fontSize:14, fontWeight:400, color:C.muted, lineHeight:1.7, marginTop:16, maxWidth:300 }}>
          AI-powered workout and nutrition plans tailored to your body, goals, and life.
        </div>
      </div>

      <div style={{ padding:"0 24px 52px", position:"relative", zIndex:1 }}>
        {authLoading ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            <div style={{ width:32, height:32, borderRadius:"50%", border:`2px solid ${C.border}`, borderTopColor:C.accent, animation:"spin 0.9s linear infinite", margin:"0 auto" }}/>
          </div>
        ) : !authMode ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button onClick={handleGoogle} style={{ ...btnStyle("outline"), gap:10 }}>
              <span style={{ fontSize:16, fontWeight:700 }}>G</span> Continue with Google
            </button>
            <button onClick={() => setAuthMode("signup")} style={btnStyle("ghost")}>Sign Up with Email</button>
            <button onClick={() => setAuthMode("signin")} style={{ ...btnStyle("ghost"), border:`1px solid ${C.border}` }}>Sign In</button>
            <button onClick={handleGoogle} style={{ ...btnStyle("primary"), marginTop:4 }}>Get Started</button>
            <button onClick={handleGuest} style={{ background:"none", border:"none", color:C.dim, fontSize:12, cursor:"pointer", fontFamily:F, textDecoration:"underline", textDecorationColor:C.border, marginTop:4 }}>
              Continue as Guest
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:11, color:C.accent, letterSpacing:2, fontWeight:700, marginBottom:4 }}>
              {authMode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}
            </div>
            <input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} type="email" />
            <input placeholder="Password"      value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} type="password" />
            {authErr && <div style={{ fontSize:12, color:"#ff5e5e" }}>{authErr}</div>}
            <button onClick={handleEmailAuth} disabled={!email||!password} style={{ ...btnStyle("primary"), opacity:(!email||!password)?0.4:1 }}>
              {authMode === "signup" ? "Create Account" : "Sign In"}
            </button>
            <button onClick={() => { setAuthMode(null); setAuthErr(""); }} style={{ background:"none", border:"none", color:C.muted, fontSize:13, cursor:"pointer", fontFamily:F }}>Back</button>
          </div>
        )}
      </div>
    </Screen>
  );

  // ── GENERATING ───────────────────────────────────────
  if (screen === "generating") return (
    <GeneratingScreen user={user} form={form} setProfile={setProfile} onDone={() => router.replace("/dashboard")} />
  );

  // ── ONBOARDING ───────────────────────────────────────
  return (
    <Screen>
      <div style={{ padding:"48px 20px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontSize:13, fontWeight:800, color:C.accent, letterSpacing:2, fontStyle:"italic" }}>APEXCOACH</span>
          <span style={{ fontSize:12, color:C.muted, fontWeight:500 }}>Step {step+1} of {STEPS.length}</span>
        </div>
        {/* Progress */}
        <div style={{ height:3, background:C.bgCard, borderRadius:4, overflow:"hidden", marginBottom:14 }}>
          <div style={{ height:"100%", width:`${progress}%`, background:C.accent, borderRadius:4, transition:"width 0.4s ease" }}/>
        </div>
        {/* Step pills */}
        <div style={{ display:"flex", gap:6, marginBottom:24 }}>
          {STEPS.map((s,i) => (
            <div key={s} style={{ fontSize:9, letterSpacing:1.5, fontWeight:700, padding:"4px 12px", borderRadius:20, background:i===step?C.accentDim:"transparent", color:i===step?C.accent:i<step?C.muted:C.dim, border:`1.5px solid ${i===step?C.accent:i<step?C.borderMid:C.border}`, transition:"all 0.3s" }}>{s.toUpperCase()}</div>
          ))}
        </div>
      </div>

      <div style={{ flex:1, padding:"0 20px", position:"relative", zIndex:1, overflowY:"auto" }}>
        {step===0 && <StepProfile  form={form} setField={setField} toggleArr={toggleArr} />}
        {step===1 && <StepHealth   form={form} setField={setField} toggleArr={toggleArr} />}
        {step===2 && <StepLifestyle form={form} setField={setField} />}
        {step===3 && <StepGoals   form={form} setField={setField} toggleArr={toggleArr} />}
      </div>

      <div style={{ padding:"16px 20px 36px", display:"flex", gap:10, position:"relative", zIndex:1 }}>
        {step>0 && <button onClick={() => setStep(s=>s-1)} style={{ ...btnStyle("ghost"), flex:1 }}>Back</button>}
        <button onClick={() => step<STEPS.length-1 ? setStep(s=>s+1) : setScreen("generating")} style={{ ...btnStyle("primary"), flex:2 }}>
          {step<STEPS.length-1 ? "Continue" : "Generate My Plan"}
        </button>
      </div>
    </Screen>
  );
}

// ── Generating Screen ──────────────────────────────────
function GeneratingScreen({ user, form, setProfile, onDone }) {
  const [status,   setStatus]   = useState("saving");
  const [step,     setStep]     = useState("Saving your profile...");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function run() {
      const newProfile = { displayName:user?.displayName||"", email:user?.email||"", ...form, onboardingComplete:true, currentWeek:1 };
      try {
        const { saveUserProfile, saveWeekPlan } = await import("../lib/firebase");
        if (user) await saveUserProfile(user.uid, newProfile);
        setStep("Generating your personalized plan with AI...");
        let plan = null;
        try {
          const r = await fetch("/api/generate-plan", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(newProfile) });
          const data = await r.json();
          if (!data.error) { plan = data; if (user) await saveWeekPlan(user.uid, 1, data); }
        } catch(planErr) { setErrorMsg(planErr.message); }
        const toCache = { ...newProfile, plan };
        try { localStorage.setItem(`apex_profile_${user?.uid}`, JSON.stringify(toCache)); } catch {}
        setProfile(toCache);
        setStatus("ready");
      } catch(e) {
        setErrorMsg(e.message);
        try { localStorage.setItem(`apex_profile_${user?.uid}`, JSON.stringify({...form, onboardingComplete:true})); } catch {}
        setProfile({...form, onboardingComplete:true, plan:null});
        setStatus("ready");
      }
    }
    const t = setTimeout(run, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen style={{ alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
      <div style={{ textAlign:"center", padding:"0 32px", width:"100%", zIndex:1 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:C.accentDim, border:`2px solid ${C.accentBorder}`, margin:"0 auto 28px", display:"flex", alignItems:"center", justifyContent:"center", animation:status==="ready"?"none":"pulse 2s ease-in-out infinite" }}>
          {status === "ready" ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <div style={{ width:32, height:32, borderRadius:"50%", border:`2px solid ${C.border}`, borderTopColor:C.accent, animation:"spin 0.9s linear infinite" }}/>
          )}
        </div>
        <div style={{ fontSize:28, fontWeight:900, color:C.white, letterSpacing:-0.5, marginBottom:10 }}>
          {status==="ready" ? "PLAN READY" : "BUILDING YOUR PLAN"}
        </div>
        <div style={{ fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:errorMsg?16:0 }}>{status==="ready" ? (errorMsg?"Profile saved. Generate your plan from dashboard.":"Your personalized plan is ready.") : step}</div>
        {errorMsg && status==="ready" && (
          <div style={{ fontSize:11, color:"#ff5e8a", background:"rgba(255,94,138,0.08)", border:"1px solid rgba(255,94,138,0.2)", borderRadius:10, padding:"10px 14px", textAlign:"left", marginTop:12, marginBottom:12 }}>{errorMsg}</div>
        )}
        <button onClick={status==="ready"?onDone:undefined} style={{ ...btnStyle("primary"), marginTop:24, opacity:status==="ready"?1:0.35, cursor:status==="ready"?"pointer":"default" }}>
          {status==="ready" ? "View My Plan" : "Please wait..."}
        </button>
      </div>
    </Screen>
  );
}

// ── Step components ────────────────────────────────────
function StepTitle({ title, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:28, fontWeight:900, color:C.white, letterSpacing:-0.5, marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:13, color:C.muted }}>{sub}</div>
    </div>
  );
}

function ChipBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"7px 15px", borderRadius:20, fontSize:13, fontWeight:500, background:active?C.accentDim:C.bgCard, border:`1.5px solid ${active?C.accent:C.border}`, color:active?C.accent:C.muted, cursor:"pointer", fontFamily:F }}>
      {label}
    </button>
  );
}

function StepProfile({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Body Stats" sub="Help us understand your starting point" />
      <div style={{ display:"flex", gap:12 }}>
        <div style={{ flex:1 }}>
          <Label>Age</Label>
          <input style={inputStyle} placeholder="28" type="number" value={form.age} onChange={e => setField("age",e.target.value)} />
        </div>
        <div style={{ flex:1.5 }}>
          <Label>Gender</Label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {["Male","Female","Other"].map(g => <ChipBtn key={g} label={g} active={form.gender===g} onClick={() => setField("gender",g)} />)}
          </div>
        </div>
      </div>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <Label>Weight</Label>
          <UnitToggle value={form.weightUnit} options={["kg","lbs"]} onChange={v => setField("weightUnit",v)} />
        </div>
        <input style={inputStyle} placeholder="75" type="number" value={form.weight} onChange={e => setField("weight",e.target.value)} />
      </div>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <Label>Height</Label>
          <UnitToggle value={form.heightUnit} options={["cm","ft"]} onChange={v => setField("heightUnit",v)} />
        </div>
        <input style={inputStyle} placeholder="175" type="number" value={form.height} onChange={e => setField("height",e.target.value)} />
      </div>
      <div>
        <Label>Body Fat % <span style={{ color:C.dim, fontWeight:400 }}>(optional)</span></Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["<10%","10–15%","15–20%","20–25%","25–30%","30%+","Not sure"].map(v => <ChipBtn key={v} label={v} active={form.bodyFat===v} onClick={() => setField("bodyFat",v)} />)}
        </div>
      </div>
    </div>
  );
}

function StepHealth({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Health" sub="So we can keep you safe and progressing" />
      <div>
        <Label>Fitness Level</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{value:"beginner",label:"Beginner",desc:"Less than 6 months"},{value:"intermediate",label:"Intermediate",desc:"6 months – 2 years"},{value:"advanced",label:"Advanced",desc:"2+ years training"}].map(o => <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.fitnessLevel===o.value} onClick={v=>setField("fitnessLevel",v)} />)}
        </div>
      </div>
      <div>
        <Label>Injuries / Limitations</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {INJURY_OPTIONS.map(v => <ChipBtn key={v} label={v} active={form.injuries.includes(v)} onClick={() => toggleArr("injuries",v)} />)}
        </div>
      </div>
      <div>
        <Label>Medical Conditions <span style={{ color:C.dim, fontWeight:400 }}>(optional)</span></Label>
        <textarea style={{ ...inputStyle, minHeight:70 }} placeholder="e.g. diabetes, hypertension..." value={form.medicalConditions} onChange={e => setField("medicalConditions",e.target.value)} />
      </div>
    </div>
  );
}

function StepLifestyle({ form, setField }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Lifestyle" sub="Your plan adapts to your daily life" />
      <div>
        <Label>Job Type</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{value:"sedentary",label:"Sedentary",desc:"Desk job, mostly sitting"},{value:"light",label:"Lightly Active",desc:"On feet occasionally"},{value:"active",label:"Active",desc:"Physical job or always on feet"}].map(o => <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.jobType===o.value} onClick={v=>setField("jobType",v)} />)}
        </div>
      </div>
      <div>
        <Label>Avg Sleep</Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["<5h","5–6h","6–7h","7–8h","8h+"].map(v => <ChipBtn key={v} label={v} active={form.sleepHours===v} onClick={() => setField("sleepHours",v)} />)}
        </div>
      </div>
      <div>
        <Label>Stress Level</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["Low","Medium","High","Very High"].map(v => <ChipBtn key={v} label={v} active={form.stressLevel===v} onClick={() => setField("stressLevel",v)} />)}
        </div>
      </div>
      <div>
        <Label>Training Days per Week</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["2","3","4","5","6"].map(v => (
            <button key={v} onClick={() => setField("trainingDays",v)} style={{ width:48, height:48, borderRadius:12, background:form.trainingDays===v?C.accent:C.bgCard, border:`1.5px solid ${form.trainingDays===v?C.accent:C.border}`, color:form.trainingDays===v?"#0a0a0a":C.muted, fontWeight:800, fontSize:16, cursor:"pointer", fontFamily:F }}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepGoals({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Goals" sub="Tell us what you are training for" />
      <div>
        <Label>Primary Goal</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{value:"fat_loss",label:"Fat Loss",desc:"Burn fat, get leaner"},{value:"muscle_gain",label:"Muscle Gain",desc:"Build size and strength"},{value:"maintain",label:"Maintain & Tone",desc:"Stay fit, improve definition"}].map(o => <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.primaryGoal===o.value} onClick={v=>setField("primaryGoal",v)} />)}
        </div>
      </div>
      <div>
        <Label>Target Weight <span style={{ color:C.dim, fontWeight:400 }}>(optional)</span></Label>
        <input style={inputStyle} placeholder="e.g. 80 kg" value={form.targetWeight} onChange={e => setField("targetWeight",e.target.value)} />
      </div>
      <div>
        <Label>Workout Location</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["Gym","Home","Both"].map(v => <ChipBtn key={v} label={v} active={form.workoutLocation.includes(v)} onClick={() => toggleArr("workoutLocation",v)} />)}
        </div>
      </div>
      <div>
        <Label>Equipment Available</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {EQUIPMENT_OPTIONS.map(v => <ChipBtn key={v} label={v} active={form.equipment.includes(v)} onClick={() => toggleArr("equipment",v)} />)}
        </div>
      </div>
      <div>
        <Label>Dietary Preferences</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {DIETARY_OPTIONS.map(v => <ChipBtn key={v} label={v} active={form.dietaryPrefs.includes(v)} onClick={() => toggleArr("dietaryPrefs",v)} />)}
        </div>
      </div>
    </div>
  );
}

function UnitToggle({ value, options, onChange }) {
  return (
    <div style={{ display:"flex", background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{ padding:"5px 14px", fontSize:12, fontWeight:700, background:value===o?C.accentDim:"transparent", border:"none", color:value===o?C.accent:C.muted, cursor:"pointer", fontFamily:F }}>{o}</button>
      ))}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ background:C.bg, height:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:40, height:40, borderRadius:"50%", border:`2px solid ${C.border}`, borderTopColor:C.accent, animation:"spin 0.9s linear infinite" }}/>
    </div>
  );
}

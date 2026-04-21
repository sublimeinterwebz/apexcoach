import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, btnStyle, inputStyle, Label, RadioCard, C } from "../components/shared";
import ExerciseGif from "../components/ExerciseGif";
import ExerciseConfigSheet from "../components/ui/ExerciseConfigSheet";
import { BuildingPhase, useBuildingProgress } from "../components/ui";
import { signInWithGoogle, signUpWithEmail, signInWithEmail, signInAnonymously, saveUserProfile, saveWeekPlan } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";

const F = "var(--font-lexend), sans-serif";
const STEPS = ["Profile", "Health", "Lifestyle", "Goals"];

const DIETARY_OPTIONS = ["No Restrictions","Vegetarian","Vegan","Keto","Halal","Gluten-Free","Dairy-Free","Nut Allergy","Low Carb"];
const INJURY_OPTIONS  = ["None","Lower Back","Knee","Shoulder","Neck","Hip","Wrist/Elbow","Ankle","Heart Condition"];
const WEEK_DAYS       = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Gym equipment categories (broad — covers most commercial gyms)
const GYM_CATEGORIES  = ["Full Commercial Gym","Free Weights (Barbells & Dumbbells)","Cable & Pulley Machines","Resistance Machines","Cardio Equipment","Racks & Benches","Smith Machine","Pull-up / Dip Station"];
// Home equipment options (granular)
const HOME_EQUIPMENT  = ["Dumbbells","Resistance Bands","Pull-up Bar","Kettlebells","Barbell & Plates","Bench","Yoga Mat / Floor Space","No Equipment"];

// Adjustment request chips
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

function buildForm() {
  return {
    age:"", gender:"", weight:70, weightUnit:"kg", height:170, heightUnit:"cm", bodyFat:"",
    fitnessLevel:"", injuries:[], medicalConditions:"",
    jobType:"", sleepHours:"", stressLevel:"", sessionDuration:"",
    trainingDays:"", trainingDaysOfWeek:[],
    primaryGoal:"", trainingStyle:"", targetWeight:"",
    workoutLocation:[], gymEquipment:[], homeEquipment:[], equipmentOther:"",
    dietaryPrefs:[],
  };
}

export default function Home() {
  const router  = useRouter();
  const { user, profile, loading, setProfile } = useAuth();
  const [screen,       setScreen]       = useState("welcome");
  const [step,         setStep]         = useState(0);
  const [authMode,     setAuthMode]     = useState(null);
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [authErr,      setAuthErr]      = useState("");
  const [authLoading,  setAuthLoading]  = useState(false);
  const [form,         setForm]         = useState(buildForm());
  const [generatedPlan,setGeneratedPlan]= useState(null);

  useEffect(() => {
    if (loading) return;
    if (user && profile?.onboardingComplete) router.replace("/dashboard");
    else if (user && !profile?.onboardingComplete && screen === "welcome") setScreen("intro");
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

  // ── WELCOME ─────────────────────────────────────────────
  if (screen === "welcome") return (
    <Screen style={{ justifyContent:"space-between" }}>
      <div style={{ padding:"60px 24px 0", zIndex:1, position:"relative" }}>
        <div style={{ fontSize:11, color:C.muted, letterSpacing:3, fontWeight:600, marginBottom:12 }}>YOUR AI TRAINER</div>
        <div style={{ fontSize:52, fontWeight:900, color:C.white, lineHeight:1, letterSpacing:-1, marginBottom:8 }}>
          BUILD YOUR<br /><span style={{ color:C.accent }}>BEST SELF</span>
        </div>
        <div style={{ fontSize:14, color:C.muted, lineHeight:1.7, marginTop:16, maxWidth:300 }}>
          AI-powered workout and nutrition plans tailored to your body, goals, and life.
        </div>
      </div>

      <div style={{ padding:"0 24px 52px", zIndex:1, position:"relative" }}>
        {authLoading ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            <div style={{ width:32, height:32, borderRadius:"50%", border:`2px solid ${C.border}`, borderTopColor:C.accent, animation:"spin 0.9s linear infinite", margin:"0 auto" }}/>
          </div>
        ) : !authMode ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Primary CTA — works for both new and returning Google users */}
            <button onClick={handleGoogle} style={{ ...btnStyle("primary"), gap:10 }}>
              <span style={{ fontSize:16, fontWeight:700 }}>G</span> Continue with Google
            </button>
            {/* Returning user — email sign in */}
            <button onClick={() => setAuthMode("signin")} style={{ ...btnStyle("outline") }}>
              Sign In with Email
            </button>
            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0" }}>
              <div style={{ flex:1, height:1, background:C.border }}/>
              <span style={{ fontSize:11, color:C.dim, fontFamily:F }}>NEW USER?</span>
              <div style={{ flex:1, height:1, background:C.border }}/>
            </div>
            <button onClick={() => setAuthMode("signup")} style={{ ...btnStyle("ghost") }}>Create Account with Email</button>
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
            <input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} type="password" />
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

  // ── ONBOARDING INTRO ─────────────────────────────────────
  if (screen === "intro") return (
    <IntroScreen user={user} onStart={() => setScreen("onboarding")} />
  );

  // ── GENERATING ─────────────────────────────────────────
  if (screen === "generating") return (
    <GeneratingScreen
      user={user} form={form} setProfile={setProfile}
      onReview={(plan) => { setGeneratedPlan(plan); setScreen("review"); }}
      onDone={() => router.replace("/dashboard")}
    />
  );

  // ── PLAN REVIEW ──────────────────────────────────────────
  if (screen === "review") return (
    <PlanReviewScreen
      plan={generatedPlan}
      profile={form}
      user={user}
      setProfile={setProfile}
      onPlanUpdate={(updated) => setGeneratedPlan(updated)}
      onCommit={async () => {
        const profileToSave = { ...form, onboardingComplete:true, currentWeek:1 };
        if (user) {
          await saveUserProfile(user.uid, profileToSave);
          if (generatedPlan) await saveWeekPlan(user.uid, 1, generatedPlan);
        }
        const toCache = { ...profileToSave, plan:generatedPlan };
        try { localStorage.setItem(`apex_profile_${user?.uid}`, JSON.stringify(toCache)); } catch {}
        setProfile(toCache);
        router.replace("/dashboard");
      }}
    />
  );

  // ── ONBOARDING ───────────────────────────────────────────
  return (
    <Screen>
      <div style={{ padding:"48px 20px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontSize:13, fontWeight:800, color:C.accent, letterSpacing:2, fontStyle:"italic" }}>APEXCOACH</span>
          <span style={{ fontSize:12, color:C.muted, fontWeight:500 }}>Step {step+1} of {STEPS.length}</span>
        </div>
        <div style={{ height:3, background:C.bgCard, borderRadius:4, overflow:"hidden", marginBottom:14 }}>
          <div style={{ height:"100%", width:`${progress}%`, background:C.accent, borderRadius:4, transition:"width 0.4s ease" }}/>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:24 }}>
          {STEPS.map((s,i) => (
            <div key={s} style={{ fontSize:9, letterSpacing:1.5, fontWeight:700, padding:"4px 12px", borderRadius:20, background:i===step?C.accentDim:"transparent", color:i===step?C.accent:i<step?C.muted:C.dim, border:`1.5px solid ${i===step?C.accent:i<step?C.borderMid:C.border}`, transition:"all 0.3s" }}>{s.toUpperCase()}</div>
          ))}
        </div>
      </div>

      <div style={{ flex:1, padding:"0 20px", overflowY:"auto", position:"relative", zIndex:1 }}>
        {step===0 && <StepProfile  form={form} setField={setField} />}
        {step===1 && <StepHealth   form={form} setField={setField} toggleArr={toggleArr} />}
        {step===2 && <StepLifestyle form={form} setField={setField} toggleArr={toggleArr} />}
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

// ── Onboarding Intro Screen ───────────────────────────────
function IntroScreen({ user, onStart }) {
  // Derive first name from display name, email, or fallback
  const firstName = (() => {
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "There";
  })();

  const steps = [
    { num: "01", title: "Answer a few questions", sub: "Your body, goals, and schedule", active: true },
    { num: "02", title: "AI builds your plan",    sub: "Personalized workouts + nutrition", active: false },
    { num: "03", title: "Start training",          sub: "Guided sessions, real-time coaching", active: false },
  ];

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0a0a0a",
      fontFamily: "var(--font-lexend), sans-serif",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background gradient — dark olive glow at top matching screenshot */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "55%",
        background: "radial-gradient(ellipse 90% 60% at 30% 0%, rgba(40,52,12,0.95) 0%, rgba(20,28,8,0.7) 50%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Header ── */}
      <div style={{ padding: "52px 20px 0", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
          {/* Logo badge */}
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "#c4ff00",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#0a0a0a", letterSpacing: -0.5 }}>A</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", letterSpacing: 2.5 }}>APEXCOACH</span>
        </div>

        {/* Welcome heading */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#ffffff", lineHeight: 1.08, letterSpacing: -1 }}>
            Welcome,
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#c4ff00", lineHeight: 1.08, letterSpacing: -1 }}>
            {firstName}.
          </div>
        </div>

        {/* Subtitle */}
        <p style={{
          fontSize: 14, color: "#9a9ca0", lineHeight: 1.65,
          margin: "0 0 32px", maxWidth: 300,
          fontWeight: 500,
        }}>
          Let&rsquo;s build a training plan that fits your body, your goals, and your week. Three quick steps.
        </p>

        {/* Section label */}
        <div style={{
          fontSize: 10, fontWeight: 700, color: "#9a9ca0",
          letterSpacing: 3, marginBottom: 16,
        }}>
          HOW IT WORKS
        </div>

        {/* Step cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map(({ num, title, sub, active }) => (
            <div key={num} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "#1c1d21",
              borderRadius: 16,
              padding: "16px 18px",
              border: "1.5px solid #2a2b30",
            }}>
              {/* Number badge */}
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: active ? "#c4ff00" : "#2a2b30",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{
                  fontSize: 15, fontWeight: 900,
                  color: active ? "#0a0a0a" : "#5d5e62",
                  letterSpacing: -0.3,
                }}>
                  {num}
                </span>
              </div>
              {/* Text */}
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", marginBottom: 3, lineHeight: 1.2 }}>
                  {title}
                </div>
                <div style={{ fontSize: 12, color: "#9a9ca0", fontWeight: 500 }}>
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 20px 36px",
        background: "linear-gradient(to top, #0a0a0a 70%, transparent)",
        zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <button
          onClick={onStart}
          style={{
            width: "100%", maxWidth: 400,
            padding: "18px 24px",
            background: "#c4ff00",
            border: "none", borderRadius: 100,
            fontSize: 16, fontWeight: 800,
            color: "#0a0a0a", fontFamily: "var(--font-lexend), sans-serif",
            cursor: "pointer", letterSpacing: 0.2,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          Build My Plan &nbsp;→
        </button>
        <div style={{ fontSize: 12, color: "#5d5e62", fontWeight: 500, textAlign: "center" }}>
          You can adjust anything later in your profile
        </div>
      </div>

      {/* Spacer so cards don't hide behind fixed button */}
      <div style={{ height: 140 }} />
    </div>
  );
}

// ── Generating Screen ────────────────────────────────────
const ONBOARDING_BUILD_STEPS = [
  "Reviewing your profile",
  "Matching your equipment",
  "Calculating starting loads",
  "Personalizing nutrition targets",
  "Finalizing your plan",
];

function GeneratingScreen({ user, form, setProfile, onReview, onDone }) {
  const { progress, start, finish } = useBuildingProgress();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function run() {
      start();

      // Build equipment string for Gemini
      const hasGym  = form.workoutLocation?.includes("Gym")  || form.workoutLocation?.includes("Both");
      const hasHome = form.workoutLocation?.includes("Home") || form.workoutLocation?.includes("Both");
      const equipParts = [];
      if (hasGym  && form.gymEquipment?.length)  equipParts.push(...form.gymEquipment);
      if (hasHome && form.homeEquipment?.length) equipParts.push(...form.homeEquipment);
      if (form.equipmentOther) equipParts.push(form.equipmentOther);
      const equipStr = equipParts.length ? equipParts.join(", ") : "standard gym equipment";

      const profileToSave = {
        displayName: user?.displayName || "",
        email:       user?.email || "",
        ...form,
        equipment:    equipParts,
        equipmentStr: equipStr,
      };

      try {
        if (user) await saveUserProfile(user.uid, profileToSave).catch(()=>{});
        let plan = null;
        try {
          const r = await fetch("/api/generate-plan", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
              ...profileToSave,
              equipment: equipStr,
              trainingDaysOfWeek: form.trainingDaysOfWeek,
            }),
          });
          // Safe-parse: on 504 or HTML error page, surface a readable message
          // instead of letting r.json() throw "Unexpected token 'A'...".
          if (!r.ok) {
            setErrorMsg(r.status === 504
              ? "The AI took too long to respond. Please try again."
              : `Something went wrong (${r.status}). Please try again.`);
          } else {
            try {
              const data = await r.json();
              if (!data.error) plan = data;
              else setErrorMsg(data.error);
            } catch {
              setErrorMsg("The server returned an invalid response. Please try again.");
            }
          }
        } catch(e) { setErrorMsg(e.message); }
        finish();
        setTimeout(() => onReview(plan), 500);
      } catch(e) {
        setErrorMsg(e.message);
        finish();
        setTimeout(() => onDone(), 500);
      }
    }
    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen>
      <BuildingPhase
        title="BUILDING YOUR PLAN"
        subtitle="Creating your first AI program"
        steps={ONBOARDING_BUILD_STEPS}
        progress={progress}
      />
    </Screen>
  );
}

// ── Plan Review Screen ───────────────────────────────────
function PlanReviewScreen({ plan, profile, user, setProfile, onPlanUpdate, onCommit }) {
  const [adjusting,    setAdjusting]    = useState(false);
  const [adjustInput,  setAdjustInput]  = useState("");
  const [selectedChip, setSelectedChip] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [committing,   setCommitting]   = useState(false);
  const [adjustCount,  setAdjustCount]  = useState(0);
  const [expandedDay,  setExpandedDay]  = useState(null);
  const [editTarget,   setEditTarget]   = useState(null); // { dayIdx, blockKey, exIdx, ex }

  const weekPlan = plan?.weekPlan || [];
  const macros   = plan?.nutrition?.macros || {};
  const calories  = plan?.nutrition?.dailyCalories;

  const handleAdjust = async () => {
    const request = selectedChip ? `${selectedChip}${adjustInput ? ": " + adjustInput : ""}` : adjustInput;
    if (!request.trim() || !plan) return;
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/adjust-plan", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ plan, request, profile }),
      });
      const updated = await r.json();
      if (updated.error) { setError(updated.error); }
      else { onPlanUpdate(updated); setAdjustCount(n => n+1); setAdjusting(false); setSelectedChip(""); setAdjustInput(""); }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const handleCommit = async () => {
    setCommitting(true);
    await onCommit();
  };

  return (
    <Screen>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding:"48px 20px 0", flexShrink:0 }}>
        <div style={{ fontSize:11, color:C.accent, letterSpacing:3, fontWeight:600, marginBottom:6 }}>YOUR PLAN IS READY</div>
        <div style={{ fontSize:26, fontWeight:900, color:C.white, letterSpacing:-0.5 }}>Review & Adjust</div>
        <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
          Review your plan before you commit. You can request changes.
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

        {/* ── Nutrition Summary ── */}
        {calories && (
          <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px 16px", marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:2.5, fontWeight:700, marginBottom:12 }}>NUTRITION TARGETS</div>
            <div style={{ display:"flex", gap:8 }}>
              {[
                {label:"KCAL", value:calories, color:C.accent},
                {label:"PROTEIN", value:`${macros.protein}g`, color:"#00cfff"},
                {label:"CARBS", value:`${macros.carbs}g`, color:"#ffaa00"},
                {label:"FAT", value:`${macros.fat||macros.fats}g`, color:"#ff5e8a"},
              ].map(m => (
                <div key={m.label} style={{ flex:1, background:C.bgDeep, borderRadius:10, padding:"10px 4px", textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:800, color:m.color }}>{m.value}</div>
                  <div style={{ fontSize:8, color:C.dim, letterSpacing:1, fontWeight:600, marginTop:2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Week Plan Summary — expandable ── */}
        <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px 16px", marginBottom:12 }}>
          <div style={{ fontSize:10, color:C.muted, letterSpacing:2.5, fontWeight:700, marginBottom:4 }}>WEEKLY SCHEDULE</div>
          <div style={{ fontSize:11, color:C.dim, marginBottom:12 }}>Tap a workout to see exercises</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {weekPlan.map((day, i) => {
              const isRest   = day.type==="rest"||day.type==="recovery";
              const isOpen   = expandedDay===i;
              const blocks   = day.blocks || {};
              const BLOCK_COLORS = {warmup:"#ffaa00",main:C.accent,accessory:"#00cfff",finisher:"#ff5e8a",core:"#aa88ff",cooldown:C.muted};
              const BLOCK_LABELS = {warmup:"Warm-Up",main:"Main Lifts",accessory:"Accessory",finisher:"Finisher",core:"Core",cooldown:"Cooldown"};
              return (
                <div key={i} style={{ borderRadius:12, overflow:"hidden", border:`1px solid ${isOpen?C.accentBorder:C.border}`, transition:"border-color 0.2s" }}>
                  <button
                    onClick={() => !isRest && setExpandedDay(isOpen?null:i)}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"11px 12px", background:isOpen?C.accentDim:C.bgDeep, border:"none", cursor:isRest?"default":"pointer", fontFamily:"var(--font-lexend), sans-serif", transition:"background 0.2s" }}
                  >
                    <div style={{ width:32, textAlign:"center", fontSize:10, color:isOpen?C.accent:C.muted, fontWeight:700, flexShrink:0 }}>{day.dayName||`D${i+1}`}</div>
                    <div style={{ flex:1, minWidth:0, textAlign:"left" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:isRest?C.dim:isOpen?C.accent:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {isRest ? "Rest Day" : (day.focus||day.sessionLabel||"Workout")}
                      </div>
                      {!isRest && day.muscleGroups && <div style={{ fontSize:11, color:C.dim, marginTop:1 }}>{day.muscleGroups}</div>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                      <div style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:isRest?C.bgCard:isOpen?C.accent:C.accentDim, border:`1px solid ${isRest?C.border:C.accentBorder}`, color:isRest?C.dim:isOpen?"#0a0a0a":C.accent }}>
                        {isRest ? "REST" : (day.type||"").toUpperCase()}
                      </div>
                      {!isRest && <span style={{ fontSize:14, color:isOpen?C.accent:C.dim, display:"inline-block", transform:isOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}>▾</span>}
                    </div>
                  </button>

                  {isOpen && !isRest && (
                    <div style={{ borderTop:`1px solid ${C.border}`, padding:"10px 12px", display:"flex", flexDirection:"column", gap:10 }}>
                      {["warmup","main","accessory","finisher","core","cooldown"].map(blockKey => {
                        const exs = blocks[blockKey];
                        if(!exs||!exs.length) return null;
                        return (
                          <div key={blockKey}>
                            <div style={{ fontSize:9, color:BLOCK_COLORS[blockKey], letterSpacing:2, fontWeight:700, marginBottom:6 }}>{BLOCK_LABELS[blockKey].toUpperCase()}</div>
                            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                              {exs.map((ex,ei) => (
                                <div key={ei} style={{ padding:"8px 10px", background:C.bgCard, borderRadius:8 }}>
                                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{ex.name}</div>
                                      {ex.notes && <div style={{ fontSize:10, color:C.dim, marginTop:2, fontStyle:"italic" }}>{ex.notes}</div>}
                                    </div>
                                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                                      <div style={{ fontSize:11, color:C.muted, textAlign:"right" }}>
                                        {ex.sets&&ex.reps?`${ex.sets}×${ex.reps}`:ex.duration||ex.details||""}
                                      </div>
                                      <button
                                        onClick={() => setEditTarget({ dayIdx:i, blockKey, exIdx:ei, ex })}
                                        style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:C.dim, display:"flex", alignItems:"center" }}
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                  <div style={{ marginTop:6 }}>
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

        {/* ── Coach Note ── */}
        {plan?.coachNote && (
          <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.accent}`, borderRadius:16, padding:"14px 16px", marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.accent, letterSpacing:2.5, fontWeight:700, marginBottom:8 }}>COACH NOTE</div>
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, margin:0 }}>{plan.coachNote}</p>
          </div>
        )}

        {/* ── Adjustment Count Banner ── */}
        {adjustCount > 0 && (
          <div style={{ background:"rgba(196,255,0,0.06)", border:`1px solid ${C.accentBorder}`, borderRadius:12, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize:12, color:C.accent, fontWeight:600 }}>{adjustCount} adjustment{adjustCount>1?"s":""} applied to your plan</span>
          </div>
        )}

        {/* ── Adjust Panel ── */}
        {adjusting ? (
          <div style={{ background:C.bgCard, border:`1.5px solid ${C.border}`, borderRadius:16, padding:"16px" }}>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:2, fontWeight:700, marginBottom:12 }}>WHAT WOULD YOU LIKE TO CHANGE?</div>

            {/* Quick chips */}
            <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:12 }}>
              {ADJUST_CHIPS.map(chip => (
                <button key={chip} onClick={() => setSelectedChip(selectedChip===chip?"":chip)} style={{
                  padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:500,
                  background: selectedChip===chip ? C.accentDim : C.bgDeep,
                  border: `1.5px solid ${selectedChip===chip ? C.accent : C.border}`,
                  color: selectedChip===chip ? C.accent : C.muted,
                  cursor:"pointer", fontFamily:F,
                }}>
                  {chip}
                </button>
              ))}
            </div>

            {/* Free-text */}
            <textarea
              value={adjustInput}
              onChange={e => setAdjustInput(e.target.value)}
              placeholder={selectedChip ? `Add details (optional)...` : "Describe your specific request, e.g. 'Include incline bench press in the push day'"}
              style={{ ...inputStyle, minHeight:72, marginBottom:12, resize:"none" }}
            />

            {error && <div style={{ fontSize:11, color:"#ff5e5e", marginBottom:10 }}>{error}</div>}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setAdjusting(false); setSelectedChip(""); setAdjustInput(""); setError(""); }} style={{ ...btnStyle("ghost"), flex:1 }}>Cancel</button>
              <button onClick={handleAdjust} disabled={(!selectedChip&&!adjustInput.trim())||loading} style={{
                ...btnStyle("primary"), flex:2,
                opacity:(!selectedChip&&!adjustInput.trim())||loading ? 0.4 : 1,
                cursor:(!selectedChip&&!adjustInput.trim())||loading ? "default" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}>
                {loading && <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#0a0a0a", animation:"spin 0.8s linear infinite" }}/>}
                {loading ? "Adjusting..." : "Apply Change"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdjusting(true)} style={{ ...btnStyle("ghost"), width:"100%", marginBottom:0, justifyContent:"center", gap:8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Request a Change
          </button>
        )}
      </div>

      {/* ── Commit Button ── */}
      <div style={{ padding:"12px 20px 36px", flexShrink:0 }}>
        <button onClick={handleCommit} disabled={committing} style={{ ...btnStyle("primary"), opacity:committing?0.6:1, cursor:committing?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {committing && <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#0a0a0a", animation:"spin 0.8s linear infinite" }}/>}
          {committing ? "Saving..." : "This looks great — let's go!"}
        </button>
        {!committing && (
          <div style={{ fontSize:11, color:C.dim, textAlign:"center", marginTop:10, lineHeight:1.5 }}>
            You can always adjust your plan from the Review tab later.
          </div>
        )}
      </div>

      {/* ── Exercise edit sheet ── */}
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
          const newPlan = JSON.parse(JSON.stringify(plan));
          const ex = newPlan.weekPlan[dayIdx]?.blocks?.[blockKey]?.[exIdx];
          if (ex) Object.assign(ex, updated);
          onPlanUpdate(newPlan);
          setEditTarget(null);
        }}
      />
    </Screen>
  );
}

// ── Step components ──────────────────────────────────────
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

function UnitToggle({ value, options, onChange }) {
  return (
    <div style={{ display:"flex", background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{ padding:"5px 14px", fontSize:12, fontWeight:700, background:value===o?C.accentDim:"transparent", border:"none", color:value===o?C.accent:C.muted, cursor:"pointer", fontFamily:F }}>{o}</button>
      ))}
    </div>
  );
}

// ── Step 0: Profile ──────────────────────────────────────
function StepProfile({ form, setField }) {
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
          <div style={{ display:"flex", gap:6 }}>
            {["Male","Female"].map(g => <ChipBtn key={g} label={g} active={form.gender===g} onClick={() => setField("gender",g)} />)}
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

// ── Step 1: Health ───────────────────────────────────────
function StepHealth({ form, setField, toggleArr }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Health" sub="So we can keep you safe and progressing" />
      <div>
        <Label>Fitness Level</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            {value:"beginner",     label:"Beginner",      desc:"Less than 6 months"},
            {value:"intermediate", label:"Intermediate",   desc:"6 months – 2 years"},
            {value:"advanced",     label:"Advanced",       desc:"2+ years training"},
          ].map(o => <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.fitnessLevel===o.value} onClick={v=>setField("fitnessLevel",v)} />)}
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

// ── Step 2: Lifestyle ────────────────────────────────────
function StepLifestyle({ form, setField, toggleArr }) {
  const targetDays = parseInt(form.trainingDays) || 0;
  const selectedCount = form.trainingDaysOfWeek.length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Lifestyle" sub="Your plan adapts to your daily life" />

      <div>
        <Label>Job Type</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            {value:"sedentary", label:"Sedentary",      desc:"Desk job, mostly sitting"},
            {value:"light",     label:"Lightly Active",  desc:"On feet occasionally"},
            {value:"active",    label:"Active",          desc:"Physical job or always on feet"},
          ].map(o => <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.jobType===o.value} onClick={v=>setField("jobType",v)} />)}
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
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["Low","Medium","High","Very High"].map(v => <ChipBtn key={v} label={v} active={form.stressLevel===v} onClick={() => setField("stressLevel",v)} />)}
        </div>
      </div>

      <div>
        <Label>Max Session Duration</Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["30 min","45 min","60 min","90+ min"].map(v => <ChipBtn key={v} label={v} active={form.sessionDuration===v} onClick={() => setField("sessionDuration",v)} />)}
        </div>
      </div>

      {/* ── How many training days ── */}
      <div>
        <Label>Training Days per Week</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["2","3","4","5","6"].map(v => (
            <button key={v} onClick={() => {
              setField("trainingDays", v);
              // Reset day selection if count changes
              if (form.trainingDaysOfWeek.length > parseInt(v)) {
                setField("trainingDaysOfWeek", form.trainingDaysOfWeek.slice(0, parseInt(v)));
              }
            }} style={{ width:50, height:50, borderRadius:14, background:form.trainingDays===v?C.accent:C.bgCard, border:`1.5px solid ${form.trainingDays===v?C.accent:C.border}`, color:form.trainingDays===v?"#0a0a0a":C.muted, fontWeight:800, fontSize:17, cursor:"pointer", fontFamily:F }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Which specific days ── */}
      {form.trainingDays && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <Label>Which days work for you?</Label>
            <span style={{ fontSize:11, color:selectedCount===targetDays?C.accent:C.muted, fontWeight:600 }}>
              {selectedCount}/{targetDays} selected
            </span>
          </div>
          <div style={{ display:"flex", gap:7 }}>
            {WEEK_DAYS.map(day => {
              const isActive = form.trainingDaysOfWeek.includes(day);
              const isDisabled = !isActive && selectedCount >= targetDays;
              return (
                <button
                  key={day}
                  onClick={() => !isDisabled && toggleArr("trainingDaysOfWeek", day)}
                  style={{
                    flex:1, padding:"10px 0", borderRadius:12,
                    display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                    background: isActive ? C.accent : C.bgCard,
                    border: `1.5px solid ${isActive ? C.accent : isDisabled ? C.border : C.borderMid}`,
                    color: isActive ? "#0a0a0a" : isDisabled ? C.dim : C.muted,
                    cursor: isDisabled ? "default" : "pointer",
                    opacity: isDisabled ? 0.4 : 1,
                    transition: "all 0.18s",
                    fontFamily: F,
                  }}
                >
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:0.5 }}>{day.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
          {selectedCount === targetDays && (
            <div style={{ fontSize:11, color:C.accent, marginTop:8, fontWeight:500 }}>
              ✓ Your training schedule is set
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Goals ────────────────────────────────────────
function StepGoals({ form, setField, toggleArr }) {
  const hasGym  = form.workoutLocation.includes("Gym")  || form.workoutLocation.includes("Both");
  const hasHome = form.workoutLocation.includes("Home") || form.workoutLocation.includes("Both");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <StepTitle title="Goals & Setup" sub="Tell us what you are training for" />

      <div>
        <Label>Primary Goal</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            {value:"fat_loss",    label:"Fat Loss",       desc:"Burn fat, get leaner"},
            {value:"muscle_gain", label:"Muscle Gain",    desc:"Build size and strength"},
            {value:"maintain",    label:"Maintain & Tone",desc:"Stay fit, improve definition"},
          ].map(o => <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.primaryGoal===o.value} onClick={v=>setField("primaryGoal",v)} />)}
        </div>
      </div>

      <div>
        <Label>Training Modality / Style</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            {value:"bodybuilding",  label:"Bodybuilding",   desc:"Focus on muscle size and aesthetics"},
            {value:"powerlifting",  label:"Powerlifting",   desc:"Focus on maximum strength (SBD)"},
            {value:"calisthenics",  label:"Calisthenics",   desc:"Bodyweight mastery and control"},
            {value:"cross_training",label:"Cross-training", desc:"Mix of strength, cardio, and agility"},
            {value:"general",       label:"General Fitness",desc:"Overall health and longevity"},
          ].map(o => <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.trainingStyle===o.value} onClick={v=>setField("trainingStyle",v)} />)}
        </div>
      </div>

      <div>
        <Label>Target Weight <span style={{ color:C.dim, fontWeight:400 }}>(optional)</span></Label>
        <input style={inputStyle} placeholder="e.g. 80 kg" value={form.targetWeight} onChange={e => setField("targetWeight",e.target.value)} />
      </div>

      {/* ── Location (tiered equipment entry point) ── */}
      <div>
        <Label>Where do you train?</Label>
        <div style={{ display:"flex", gap:8 }}>
          {["Gym","Home","Both"].map(v => (
            <button key={v} onClick={() => {
              // Toggle location
              const current = form.workoutLocation;
              let next;
              if (v === "Both") {
                next = current.includes("Both") ? [] : ["Both"];
              } else {
                const without = current.filter(x => x !== "Both");
                next = without.includes(v) ? without.filter(x=>x!==v) : [...without, v];
              }
              setField("workoutLocation", next);
            }} style={{ flex:1, padding:"12px 8px", borderRadius:14, background:form.workoutLocation.includes(v)?C.accentDim:C.bgCard, border:`1.5px solid ${form.workoutLocation.includes(v)?C.accent:C.border}`, color:form.workoutLocation.includes(v)?C.accent:C.muted, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:F }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Gym equipment categories ── */}
      {hasGym && (
        <div>
          <Label>What's available at your gym?</Label>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {GYM_CATEGORIES.map(v => (
              <ChipBtn key={v} label={v} active={form.gymEquipment.includes(v)} onClick={() => toggleArr("gymEquipment", v)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Home equipment ── */}
      {hasHome && (
        <div>
          <Label>Home equipment available</Label>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {HOME_EQUIPMENT.map(v => (
              <ChipBtn key={v} label={v} active={form.homeEquipment.includes(v)} onClick={() => toggleArr("homeEquipment", v)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Other equipment (free text) ── */}
      {(hasGym || hasHome) && (
        <div>
          <Label>Anything else? <span style={{ color:C.dim, fontWeight:400 }}>(optional)</span></Label>
          <input
            style={inputStyle}
            placeholder="e.g. cable chest fly machine, TRX straps, battle ropes..."
            value={form.equipmentOther}
            onChange={e => setField("equipmentOther", e.target.value)}
          />
        </div>
      )}

      <div>
        <Label>Dietary Preferences</Label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {DIETARY_OPTIONS.map(v => <ChipBtn key={v} label={v} active={form.dietaryPrefs.includes(v)} onClick={() => toggleArr("dietaryPrefs",v)} />)}
        </div>
      </div>
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

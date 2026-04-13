import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, btnStyle, inputStyle, Label, RadioCard } from "../components/shared";
import { signInWithGoogle, signUpWithEmail, signInWithEmail, signInAnonymously, saveUserProfile, saveWeekPlan } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";

const STEPS = ["Profile", "Health", "Lifestyle", "Goals"];

const EQUIPMENT_OPTIONS = ["Barbell & Plates","Dumbbells","Cables/Pulleys","Smith Machine","Pull-up Bar","Resistance Bands","Kettlebells","Bench","No Equipment"];
const DIETARY_OPTIONS   = ["No Restrictions","Vegetarian","Vegan","Keto","Halal","Gluten-Free","Dairy-Free","Nut Allergy","Low Carb"];
const INJURY_OPTIONS    = ["None","Lower Back","Knee","Shoulder","Neck","Hip","Wrist/Elbow","Ankle","Heart Condition"];

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
  const { user, profile, loading, setProfile } = useAuth();

  const [screen,   setScreen]   = useState("welcome");
  const [step,     setStep]     = useState(0);
  const [authMode, setAuthMode] = useState(null);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [authErr,  setAuthErr]  = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [form,     setForm]     = useState(buildForm());

  // Redirect logged-in + onboarded users straight to dashboard
  useEffect(() => {
    if (loading) return;
    if (user && profile?.onboardingComplete) {
      router.replace("/dashboard");
    } else if (user && !profile?.onboardingComplete && screen === "welcome") {
      // Signed in but not onboarded — go to onboarding steps
      setScreen("onboarding");
    }
  }, [user, profile, loading]);

  // Show spinner while resolving auth
  if (loading) return <Spinner />;

  const setField  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }));
  const progress = ((step + 1) / STEPS.length) * 100;

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
      setAuthErr(e.code === "auth/user-not-found" || e.code === "auth/wrong-password"
        ? "Invalid email or password." : e.message);
      setAuthLoading(false);
    }
  };

  // ── WELCOME SCREEN ────────────────────────────────────
  if (screen === "welcome") return (
    <Screen style={{ justifyContent:"space-between" }}>
      <div style={{ padding:"56px 24px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:44 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:"linear-gradient(135deg,#00ff80,#00cc66)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:20, color:"#000" }}>A</div>
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
        {authLoading ? (
          <div style={{ textAlign:"center", color:"#00ff80", fontFamily:"'Bebas Neue'", fontSize:18, letterSpacing:2, padding:"20px 0" }}>SIGNING IN...</div>
        ) : !authMode ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button onClick={handleGoogle} style={btnStyle("outline")}>Continue with Google</button>
            <button onClick={() => setAuthMode("signup")} style={btnStyle("ghost")}>Sign Up with Email</button>
            <button onClick={() => setAuthMode("signin")} style={{ ...btnStyle("ghost"), marginTop:-4 }}>Sign In</button>
            <button onClick={handleGuest} style={{ background:"none", border:"none", color:"#555", fontSize:13, fontWeight:500, cursor:"pointer", padding:"10px 0", fontFamily:"'DM Sans'", textDecoration:"underline", textDecorationColor:"#333" }}>
              Continue as Guest
            </button>
            <p style={{ textAlign:"center", color:"#444", fontSize:11, marginTop:4 }}>By continuing, you agree to our Terms and Privacy Policy</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:12, color:"#00ff80", letterSpacing:2, fontWeight:600, marginBottom:4 }}>
              {authMode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}
            </div>
            <input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} type="email" />
            <input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} type="password" />
            {authErr && <div style={{ fontSize:12, color:"#ff5e5e" }}>{authErr}</div>}
            <button onClick={handleEmailAuth} disabled={!email || !password} style={{ ...btnStyle("primary"), opacity:(!email||!password)?0.5:1 }}>
              {authMode === "signup" ? "Create Account" : "Sign In"}
            </button>
            <button onClick={() => { setAuthMode(null); setAuthErr(""); }} style={{ background:"none", border:"none", color:"#555", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans'" }}>Back</button>
          </div>
        )}
      </div>
    </Screen>
  );

  // ── GENERATING SCREEN ─────────────────────────────────
  if (screen === "generating") return (
    <GeneratingScreen user={user} form={form} setProfile={setProfile} onDone={() => router.replace("/dashboard")} />
  );

  // ── ONBOARDING STEPS ──────────────────────────────────
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
            <div key={s} style={{ fontSize:9, letterSpacing:1.5, fontWeight:600, padding:"3px 10px", borderRadius:20, background:i===step?"rgba(0,255,128,0.15)":"transparent", color:i===step?"#00ff80":i<step?"#555":"#333", border:`1px solid ${i===step?"#00ff80":i<step?"#333":"#1a1a1a"}`, transition:"all 0.3s" }}>{s.toUpperCase()}</div>
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

// ── Call Gemini directly from browser (no serverless timeout) ──
async function callGeminiDirectly(profile) {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error("API key missing — add NEXT_PUBLIC_GEMINI_API_KEY in Vercel settings and redeploy");

  const days     = parseInt(profile.trainingDays) || 4;
  const injuries = (profile.injuries || []).filter(x => x && x !== "None").join(", ") || "none";
  const equip    = (profile.equipment || []).slice(0, 5).join(", ") || "bodyweight";
  const diet     = (profile.dietaryPrefs || []).filter(x => x && x !== "No Restrictions").join(", ") || "none";
  const loc      = (profile.workoutLocation || []).join("/") || "gym";
  const goal     = { fat_loss:"fat loss", muscle_gain:"muscle gain", maintain:"maintain" }[profile.primaryGoal] || "maintain";
  const calNote  = profile.primaryGoal === "fat_loss" ? "300kcal deficit" : profile.primaryGoal === "muscle_gain" ? "300kcal surplus" : "maintenance calories";

  const prompt = `You are a fitness coach. Return ONLY a JSON object, no markdown, no explanation.

User: ${profile.age}yr ${profile.gender}, ${profile.weight}${profile.weightUnit}, ${profile.height}${profile.heightUnit}, ${profile.fitnessLevel || "beginner"}, goal: ${goal}, ${days} training days/week, location: ${loc}, equipment: ${equip}, injuries: ${injuries}, diet: ${diet}, sleep: ${profile.sleepHours || "7h"}, stress: ${profile.stressLevel || "medium"}, job: ${profile.jobType || "sedentary"}.

Generate exactly 7 days (${days} workouts, ${7 - days} rest). Only use: ${equip}. Avoid exercises stressing: ${injuries}. Calories: ${calNote}. Respect diet: ${diet}.

Return this exact JSON with all 7 days:
{"weekPlan":[{"dayIndex":0,"dayName":"Monday","type":"workout","sessionLabel":"Push Day","muscleGroups":"Chest, Shoulders","estimatedDuration":"45 min","exercises":[{"name":"Push-up","sets":3,"reps":"12","restSeconds":60,"notes":""}]},{"dayIndex":1,"dayName":"Tuesday","type":"rest","sessionLabel":"Rest","muscleGroups":"","estimatedDuration":"","exercises":[]}],"nutrition":{"dailyCalories":2200,"macros":{"protein":160,"carbs":220,"fat":70},"meals":{"breakfast":{"name":"Protein Oats","calories":450,"protein":32,"carbs":50,"fat":10,"ingredients":["80g oats","1 scoop whey","1 banana","200ml milk"],"instructions":"Cook oats with milk, stir in protein off heat, top with banana."},"lunch":{"name":"Chicken Rice Bowl","calories":600,"protein":48,"carbs":65,"fat":12,"ingredients":["180g chicken breast","150g white rice","vegetables","olive oil"],"instructions":"Grill chicken, cook rice, steam veg, serve together."},"dinner":{"name":"Salmon Sweet Potato","calories":650,"protein":42,"carbs":58,"fat":20,"ingredients":["180g salmon","200g sweet potato","mixed salad","lemon"],"instructions":"Bake salmon 200C 18min, roast diced potato 25min."},"snacks":[{"name":"Greek Yogurt Berries","calories":180,"protein":15,"carbs":18,"fat":3,"ingredients":["200g Greek yogurt","100g berries","honey"],"instructions":"Mix and serve cold."}]},"nutritionNotes":"Note specific to this user."},"coachNote":"One coaching note for this specific user."}`;

  const errors = [];

  for (const model of ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"]) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2500 },
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        const msg = `${model}: HTTP ${r.status} — ${data?.error?.message || JSON.stringify(data).slice(0, 150)}`;
        errors.push(msg);
        continue;
      }

      const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
      if (!text) {
        errors.push(`${model}: empty response (finishReason: ${data?.candidates?.[0]?.finishReason})`);
        continue;
      }

      const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      return JSON.parse(clean);

    } catch (e) {
      errors.push(`${model}: ${e.message}`);
    }
  }

  throw new Error("Plan generation failed:\n" + errors.join("\n"));
}

// ── Generating Screen — saves profile THEN navigates ──
function GeneratingScreen({ user, form, setProfile, onDone }) {
  const [status,   setStatus]   = useState("saving");
  const [step,     setStep]     = useState("Saving your profile...");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function run() {
      const newProfile = {
        displayName: user?.displayName || "",
        email: user?.email || "",
        ...form,
        onboardingComplete: true,
        currentWeek: 1,
      };
      try {
        // 1. Save profile to Firestore first
        if (user) await saveUserProfile(user.uid, newProfile);

        // 2. Call Gemini DIRECTLY from browser — no serverless timeout
        setStep("Generating your personalized plan with AI...");
        let plan = null;
        try {
          plan = await callGeminiDirectly(newProfile);
          if (user && plan) await saveWeekPlan(user.uid, 1, plan);
        } catch (planErr) {
          // Show real error — don't swallow it
          setErrorMsg(planErr.message);
          setStep("Plan generation failed — you can retry from your dashboard.");
        }

        // 3. Cache in localStorage
        const toCache = { ...newProfile, plan };
        try { localStorage.setItem(`apex_profile_${user?.uid}`, JSON.stringify(toCache)); } catch {}

        // 4. Update context — let user proceed even if plan failed
        setProfile(toCache);
        setStatus("ready");
      } catch(e) {
        console.error("Save error:", e);
        setErrorMsg(e.message);
        try { localStorage.setItem(`apex_profile_${user?.uid}`, JSON.stringify(newProfile)); } catch {}
        setProfile(newProfile);
        setStatus("ready");
      }
    }
    const t = setTimeout(run, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen style={{ alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", zIndex:1, padding:"0 32px", width:"100%" }}>
        <PulsingRing />
        <div style={{ fontFamily:"'Bebas Neue'", fontSize:32, letterSpacing:2, marginTop:28 }}>
          {status === "ready" ? "PROFILE SAVED" : "BUILDING YOUR PLAN"}
        </div>
        <p style={{ color:"#777", fontSize:13, marginTop:10, lineHeight:1.7 }}>
          {status === "ready"
            ? errorMsg
              ? "Profile saved. Plan generation had an issue — you can generate from your dashboard."
              : "Your personalized workout and nutrition plan is ready."
            : step}
        </p>
        {status !== "ready" && <LoadingDots />}
        {errorMsg && status === "ready" && (
          <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(255,94,94,0.06)", border:"1px solid rgba(255,94,94,0.2)", borderRadius:10, textAlign:"left" }}>
            <div style={{ fontSize:10, color:"#ff5e5e", letterSpacing:2, fontWeight:600, marginBottom:6 }}>ERROR DETAILS</div>
            <p style={{ fontSize:11, color:"#cc4444", lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{errorMsg}</p>
          </div>
        )}
        <button
          onClick={status === "ready" ? onDone : undefined}
          style={{ ...btnStyle("primary"), marginTop:20, width:"100%", opacity: status === "ready" ? 1 : 0.35, cursor: status === "ready" ? "pointer" : "default" }}
        >
          {status === "ready" ? "Continue to Dashboard" : "Please wait..."}
        </button>
      </div>
    </Screen>
  );
}

// ── Step components ────────────────────────────────────
function StepProfile({ form, setField, toggleArr }) {
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
              <button key={g} onClick={() => setField("gender", g)} style={{ padding:"8px 12px", borderRadius:20, fontSize:12, fontWeight:500, background:form.gender===g?"rgba(0,255,128,0.12)":"#0e0e0e", border:`1px solid ${form.gender===g?"#00ff80":"#1e1e1e"}`, color:form.gender===g?"#00ff80":"#777", cursor:"pointer", fontFamily:"'DM Sans'" }}>{g}</button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <Label>Weight</Label>
          <UnitToggle value={form.weightUnit} options={["kg","lbs"]} onChange={v => setField("weightUnit", v)} />
        </div>
        <RulerPicker value={form.weight} onChange={v => setField("weight", v)} min={form.weightUnit==="kg"?30:66} max={form.weightUnit==="kg"?200:440} unit={form.weightUnit} />
      </div>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <Label>Height</Label>
          <UnitToggle value={form.heightUnit} options={["cm","ft"]} onChange={v => setField("heightUnit", v)} />
        </div>
        <RulerPicker value={form.height} onChange={v => setField("height", v)} min={form.heightUnit==="cm"?120:4} max={form.heightUnit==="cm"?220:7} unit={form.heightUnit} step={form.heightUnit==="ft"?0.1:1} />
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
      <StepTitle title="Health" sub="So we can keep you safe and progressing" />
      <div>
        <Label>Fitness Level</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { value:"beginner",     label:"Beginner",     desc:"Less than 6 months training" },
            { value:"intermediate", label:"Intermediate", desc:"6 months – 2 years training" },
            { value:"advanced",     label:"Advanced",     desc:"2+ years consistent training" },
          ].map(o => <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.fitnessLevel===o.value} onClick={v => setField("fitnessLevel", v)} />)}
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
      <StepTitle title="Lifestyle" sub="Your plan adapts to your daily life" />
      <div>
        <Label>Job Type</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { value:"sedentary", label:"Sedentary",      desc:"Desk job, mostly sitting" },
            { value:"light",     label:"Lightly Active", desc:"On feet occasionally" },
            { value:"active",    label:"Active",         desc:"Physical job or always on feet" },
          ].map(o => <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.jobType===o.value} onClick={v => setField("jobType", v)} />)}
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
      <StepTitle title="Goals" sub="Tell us what you are training for" />
      <div>
        <Label>Primary Goal</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { value:"fat_loss",    label:"Fat Loss",        desc:"Burn fat, get leaner" },
            { value:"muscle_gain", label:"Muscle Gain",     desc:"Build size and strength" },
            { value:"maintain",    label:"Maintain & Tone", desc:"Stay fit, improve definition" },
          ].map(o => <RadioCard key={o.value} value={o.value} label={o.label} desc={o.desc} active={form.primaryGoal===o.value} onClick={v => setField("primaryGoal", v)} />)}
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

// ── Shared components ──────────────────────────────────
function StepTitle({ title, sub }) {
  return (
    <div style={{ marginBottom:4 }}>
      <h2 style={{ fontFamily:"'Bebas Neue'", fontSize:34, letterSpacing:2, margin:0 }}>{title}</h2>
      <p style={{ color:"#666", fontSize:12, margin:"4px 0 0" }}>{sub}</p>
    </div>
  );
}

function UnitToggle({ value, options, onChange }) {
  return (
    <div style={{ display:"flex", background:"#0e0e0e", border:"1px solid #1e1e1e", borderRadius:8, overflow:"hidden", flexShrink:0 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{ padding:"4px 14px", fontSize:12, fontWeight:600, background:value===o?"rgba(0,255,128,0.15)":"transparent", border:"none", color:value===o?"#00ff80":"#555", cursor:"pointer", fontFamily:"'DM Sans'" }}>{o}</button>
      ))}
    </div>
  );
}

function RulerPicker({ value, onChange, min, max, unit, step = 1 }) {
  const startX   = useRef(null);
  const startVal = useRef(null);
  const ppu      = 4;
  const clamp    = v => Math.min(max, Math.max(min, Math.round(v / step) * step));

  const onDown = (e) => {
    startX.current   = e.clientX ?? e.touches?.[0]?.clientX;
    startVal.current = value;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    window.addEventListener("touchmove",   onTouch, { passive:false });
    window.addEventListener("touchend",    onUp);
  };
  const onMove  = (e) => onChange(clamp(startVal.current + (startX.current - e.clientX) / ppu * step));
  const onTouch = (e) => { e.preventDefault(); onChange(clamp(startVal.current + (startX.current - e.touches[0].clientX) / ppu * step)); };
  const onUp    = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("touchmove", onTouch); window.removeEventListener("touchend", onUp); };

  const displayVal = step < 1 ? value.toFixed(1) : Math.round(value);
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);

  return (
    <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:14, overflow:"hidden", userSelect:"none" }}>
      <div style={{ textAlign:"center", padding:"14px 0 6px" }}>
        <span style={{ fontFamily:"'Bebas Neue'", fontSize:48, color:"#f0f0f0", letterSpacing:2 }}>{displayVal}</span>
        <span style={{ fontSize:13, color:"#777", marginLeft:6 }}>{unit}</span>
      </div>
      <div onPointerDown={onDown} onTouchStart={onDown} style={{ position:"relative", height:56, overflow:"hidden", cursor:"ew-resize", touchAction:"none" }}>
        <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:2, background:"#00ff80", zIndex:2, transform:"translateX(-50%)" }}/>
        <div style={{ position:"absolute", top:0, bottom:0, display:"flex", alignItems:"flex-end", paddingBottom:6, left:`calc(50% - ${(value - min) / step * ppu}px)` }}>
          {ticks.map((v, i) => {
            const isMajor = i % Math.round(10/step) === 0;
            const isMid   = i % Math.round(5/step) === 0;
            return (
              <div key={v} style={{ display:"flex", flexDirection:"column", alignItems:"center", width:ppu, flexShrink:0 }}>
                <div style={{ width:1, height:isMajor?24:isMid?16:8, background:isMajor?"#555":isMid?"#333":"#222" }}/>
                {isMajor && <div style={{ fontSize:8, color:"#444", marginTop:2, position:"absolute", bottom:0, transform:"translateX(-50%)", whiteSpace:"nowrap" }}>{Math.round(v)}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ textAlign:"center", padding:"6px 0 10px", fontSize:9, color:"#444", letterSpacing:2 }}>DRAG TO ADJUST</div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ background:"#080808", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ position:"relative", width:60, height:60 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#00ff80", animation:"spin 1s linear infinite" }}/>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:14, color:"#00ff80", letterSpacing:1 }}>AC</div>
      </div>
    </div>
  );
}

function PulsingRing() {
  return (
    <div style={{ position:"relative", width:90, height:90, margin:"0 auto" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}} @keyframes dots{0%,80%,100%{opacity:0}40%{opacity:1}}`}</style>
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

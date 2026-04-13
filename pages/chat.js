import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";

const QUICK_PROMPTS = [
  "Should I train with muscle soreness?",
  "Can you swap an exercise for me?",
  "What should I eat before training?",
  "How am I progressing this week?",
];

const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export default function Chat() {
  const router = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false); // renamed from 'loading' to avoid conflict
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  if (loading) return null;

  const buildSystemPrompt = () => {
    const name     = profile?.displayName?.split(" ")[0] || user?.displayName?.split(" ")[0] || "there";
    const goal     = profile?.primaryGoal?.replace("_", " ") || "general fitness";
    const level    = profile?.fitnessLevel || "intermediate";
    const days     = profile?.trainingDays || "4";
    const week     = profile?.currentWeek || 1;
    const location = Array.isArray(profile?.workoutLocation) ? profile.workoutLocation.join("/") : "gym";
    const diet     = Array.isArray(profile?.dietaryPrefs) ? profile.dietaryPrefs.join(", ") : "no restrictions";
    const injuries = Array.isArray(profile?.injuries) ? profile.injuries.join(", ") : "none";
    return `You are ApexCoach, an elite AI personal trainer and nutritionist. You are speaking with ${name}, currently on Week ${week} of their program.

Their profile:
- Goal: ${goal}
- Fitness level: ${level}
- Training: ${days} days/week, ${location}
- Dietary preferences: ${diet}
- Injuries/limitations: ${injuries}

Speak like a knowledgeable, direct, encouraging trainer. Be concise — 2-4 sentences max unless a detailed answer is genuinely needed. No fluff. Give real, specific advice. Never use emojis.`;
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || sending) return;
    setInput("");
    const userMsg  = { role: "user", content };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setSending(true);
    try {
      const geminiContents = [
        { role: "user",  parts: [{ text: buildSystemPrompt() + "\n\n---\n\nNow respond to the following conversation:" }] },
        { role: "model", parts: [{ text: "Understood. I am ApexCoach, ready to help." }] },
        ...nextMsgs.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
      ];
      const res  = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: geminiContents }) }
      );
      const data  = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Something went wrong. Try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <Screen style={{ height: "100vh", overflow: "hidden" }}>
      <style>{`textarea:focus{outline:none;} ::-webkit-scrollbar{width:0;}`}</style>

      {/* Header */}
      <div style={{ padding:"44px 20px 12px", borderBottom:"1px solid #0e0e0e", position:"relative", zIndex:2, background:"rgba(8,8,8,0.96)", backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:"linear-gradient(135deg,#001a0d,#002e14)", border:"1px solid rgba(0,255,128,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:16, color:"#00ff80", letterSpacing:1 }}>AC</div>
            <div style={{ position:"absolute", bottom:-2, right:-2, width:9, height:9, borderRadius:"50%", background:"#00ff80", border:"2px solid #080808" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:19, letterSpacing:1.5, lineHeight:1 }}>ApexCoach</div>
            <div style={{ fontSize:10, color:"#00ff80", marginTop:2, letterSpacing:.5 }}>AI Trainer · Online</div>
          </div>
          <div style={{ background:"rgba(0,255,128,0.08)", border:"1px solid rgba(0,255,128,0.15)", borderRadius:7, padding:"4px 10px", fontSize:9, fontWeight:700, color:"#00ff80", letterSpacing:1 }}>
            WEEK {profile?.currentWeek || 1}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 0", position:"relative", zIndex:1 }}>
        {isEmpty ? (
          <div style={{ display:"flex", flexDirection:"column", height:"100%", justifyContent:"center" }}>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:2, color:"#1a1a1a", marginBottom:6 }}>Ask Your Trainer</div>
              <div style={{ fontSize:12, color:"#222", lineHeight:1.6 }}>Questions about your plan, nutrition, form, or recovery — ask anything.</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)} style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"13px 16px", textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"'DM Sans'" }}>
                  <span style={{ fontSize:13, color:"#666", fontWeight:500 }}>{p}</span>
                  <span style={{ fontSize:14, color:"#222", marginLeft:8 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:13, paddingBottom:8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "assistant" && (
                  <div style={{ width:26, height:26, borderRadius:7, flexShrink:0, background:"linear-gradient(135deg,#001a0d,#002e14)", border:"1px solid rgba(0,255,128,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:10, color:"#00ff80", marginRight:8, alignSelf:"flex-end" }}>AC</div>
                )}
                <div style={{ maxWidth:"73%", padding:"11px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? "linear-gradient(135deg,rgba(0,255,128,0.16),rgba(0,200,85,0.09))" : "#0e0e0e", border: m.role === "user" ? "1px solid rgba(0,255,128,0.22)" : "1px solid #1a1a1a", fontSize:13.5, lineHeight:1.65, color: m.role === "user" ? "#e0ffe8" : "#b0b0b0", fontWeight: m.role === "user" ? 500 : 400, whiteSpace:"pre-wrap" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
                <div style={{ width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#001a0d,#002e14)", border:"1px solid rgba(0,255,128,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:10, color:"#00ff80" }}>AC</div>
                <div style={{ padding:"12px 16px", borderRadius:"16px 16px 16px 4px", background:"#0e0e0e", border:"1px solid #1a1a1a", display:"flex", gap:5, alignItems:"center" }}>
                  <style>{`@keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}`}</style>
                  {[0,1,2].map(i => <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:"#00ff80", animation:`blink 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding:"10px 16px 90px", borderTop:"1px solid #0e0e0e", background:"rgba(8,8,8,0.97)", backdropFilter:"blur(12px)", position:"relative", zIndex:2 }}>
        {!isEmpty && (
          <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:10, paddingBottom:2 }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)} style={{ background:"#0d0d0d", border:"1px solid #141414", borderRadius:20, padding:"5px 12px", whiteSpace:"nowrap", fontSize:10, color:"#444", cursor:"pointer", fontFamily:"'DM Sans'", flexShrink:0 }}>{p}</button>
            ))}
          </div>
        )}
        <div style={{ display:"flex", gap:10, alignItems:"flex-end", background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:13, padding:"9px 9px 9px 14px" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Ask your trainer anything..." rows={1}
            style={{ flex:1, background:"transparent", border:"none", color:"#f0f0f0", fontSize:14, fontFamily:"'DM Sans'", lineHeight:1.5, maxHeight:100, overflowY:"auto", outline:"none", resize:"none" }}/>
          <button onClick={() => sendMessage()} disabled={!input.trim() || sending} style={{ width:36, height:36, borderRadius:9, flexShrink:0, background: input.trim() && !sending ? "linear-gradient(135deg,#00ff80,#00cc55)" : "#111", border:`1px solid ${input.trim() && !sending ? "transparent" : "#1a1a1a"}`, cursor: input.trim() && !sending ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke={input.trim() && !sending ? "#000" : "#2a2a2a"} strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim() && !sending ? "#000" : "#2a2a2a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <BottomNav active="chat" router={router} />
    </Screen>
  );
}

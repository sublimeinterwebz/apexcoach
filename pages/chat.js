import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav } from "../components/shared";

const QUICK_PROMPTS = [
  "Should I train with muscle soreness?",
  "Can you swap an exercise for me?",
  "What should I eat before training?",
  "How am I progressing this week?",
];

// ── Replace with your Gemini API key in .env.local ─────────────────
// NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const SYSTEM_CONTEXT = `You are ApexCoach, an elite AI personal trainer and nutritionist. You are speaking with Hussain, a gym-goer currently on Week 3 of his program.

His profile:
- Goal: Muscle gain
- Training: 5 days/week, gym
- Current plan: Push/Pull/Legs split
- This week: Completed 4/5 sessions, missed Pull Day
- Notable lifts: Barbell Back Squat 100kg x8, Romanian Deadlift 80kg x10

Speak like a knowledgeable, direct, encouraging trainer. Be concise — 2-4 sentences max unless a detailed answer is genuinely needed. No fluff, no excessive motivation. Give real, specific advice. Never use emojis.`;

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg    = { role:"user", content };
    const nextMsgs   = [...messages, userMsg];
    setMessages(nextMsgs);
    setLoading(true);

    try {
      // Build Gemini request payload
      const geminiContents = [
        { role:"user", parts:[{ text: SYSTEM_CONTEXT + "\n\n---\n\nNow respond to the following conversation:" }] },
        { role:"model", parts:[{ text:"Understood. I am ApexCoach, ready to help Hussain." }] },
        ...nextMsgs.map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts:[{ text: m.content }],
        })),
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify({ contents: geminiContents }),
        }
      );
      const data  = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Something went wrong. Try again.";
      setMessages(prev => [...prev, { role:"assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role:"assistant", content:"Connection error. Please check your API key and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <Screen style={{ height:"100vh", overflow:"hidden" }}>
      <style>{`textarea:focus{outline:none;} ::-webkit-scrollbar{width:0;}`}</style>

      {/* Header */}
      <div style={{ padding:"44px 20px 12px", borderBottom:"1px solid #0e0e0e", position:"relative", zIndex:2, background:"rgba(8,8,8,0.96)", backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:"linear-gradient(135deg,#001a0d,#002e14)", border:"1px solid rgba(0,255,128,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:16, color:"#00ff80", letterSpacing:1 }}>AC</div>
            <div style={{ position:"absolute", bottom:-2, right:-2, width:9, height:9, borderRadius:"50%", background:"#00ff80", border:"2px solid #080808", animation:"pulse 2s ease-in-out infinite" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:19, letterSpacing:1.5, lineHeight:1 }}>ApexCoach</div>
            <div style={{ fontSize:10, color:"#00ff80", marginTop:2, letterSpacing:.5 }}>AI Trainer · Online</div>
          </div>
          <div style={{ background:"rgba(0,255,128,0.08)", border:"1px solid rgba(0,255,128,0.15)", borderRadius:7, padding:"4px 10px", fontSize:9, fontWeight:700, color:"#00ff80", letterSpacing:1 }}>WEEK 3</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 0", position:"relative", zIndex:1 }}>
        {isEmpty ? (
          <div className="fu" style={{ display:"flex", flexDirection:"column", height:"100%", justifyContent:"center" }}>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:2, color:"#1a1a1a", marginBottom:6 }}>Ask Your Trainer</div>
              <div style={{ fontSize:12, color:"#222", lineHeight:1.6 }}>Questions about your plan, nutrition, form, or recovery — ask anything.</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {QUICK_PROMPTS.map((p,i) => (
                <button key={i} onClick={() => sendMessage(p)} style={{
                  background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12,
                  padding:"13px 16px", textAlign:"left", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  transition:"border-color .2s", fontFamily:"'DM Sans'",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(0,255,128,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#1a1a1a"; }}>
                  <span style={{ fontSize:13, color:"#666", fontWeight:500 }}>{p}</span>
                  <span style={{ fontSize:14, color:"#222", marginLeft:8 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:13, paddingBottom:8 }}>
            {messages.map((m,i) => (
              <div key={i} className="fu" style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start" }}>
                {m.role === "assistant" && (
                  <div style={{ width:26, height:26, borderRadius:7, flexShrink:0, background:"linear-gradient(135deg,#001a0d,#002e14)", border:"1px solid rgba(0,255,128,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:10, color:"#00ff80", marginRight:8, alignSelf:"flex-end" }}>AC</div>
                )}
                <div style={{
                  maxWidth:"73%", padding:"11px 14px",
                  borderRadius: m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                  background: m.role==="user"?"linear-gradient(135deg,rgba(0,255,128,0.16),rgba(0,200,85,0.09))":"#0e0e0e",
                  border: m.role==="user"?"1px solid rgba(0,255,128,0.22)":"1px solid #1a1a1a",
                  fontSize:13.5, lineHeight:1.65,
                  color: m.role==="user"?"#e0ffe8":"#b0b0b0",
                  fontWeight: m.role==="user"?500:400,
                  whiteSpace:"pre-wrap",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="fu" style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
                <div style={{ width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#001a0d,#002e14)", border:"1px solid rgba(0,255,128,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:10, color:"#00ff80" }}>AC</div>
                <div style={{ padding:"12px 16px", borderRadius:"16px 16px 16px 4px", background:"#0e0e0e", border:"1px solid #1a1a1a", display:"flex", gap:5, alignItems:"center" }}>
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
            {QUICK_PROMPTS.map((p,i) => (
              <button key={i} onClick={() => sendMessage(p)} style={{ background:"#0d0d0d", border:"1px solid #141414", borderRadius:20, padding:"5px 12px", whiteSpace:"nowrap", fontSize:10, color:"#444", cursor:"pointer", fontFamily:"'DM Sans'", flexShrink:0 }}>
                {p}
              </button>
            ))}
          </div>
        )}
        <div style={{ display:"flex", gap:10, alignItems:"flex-end", background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:13, padding:"9px 9px 9px 14px" }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Ask your trainer anything..." rows={1}
            style={{ flex:1, background:"transparent", border:"none", color:"#f0f0f0", fontSize:14, fontFamily:"'DM Sans'", lineHeight:1.5, maxHeight:100, overflowY:"auto", outline:"none", resize:"none" }}/>
          <button onClick={() => sendMessage()} disabled={!input.trim()||loading} style={{
            width:36, height:36, borderRadius:9, flexShrink:0,
            background: input.trim()&&!loading ? "linear-gradient(135deg,#00ff80,#00cc55)" : "#111",
            border:`1px solid ${input.trim()&&!loading?"transparent":"#1a1a1a"}`,
            cursor: input.trim()&&!loading?"pointer":"default",
            display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke={input.trim()&&!loading?"#000":"#2a2a2a"} strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim()&&!loading?"#000":"#2a2a2a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <BottomNav active="chat" router={router} />
    </Screen>
  );
}

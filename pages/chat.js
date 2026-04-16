import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Screen, BottomNav, C } from "../components/shared";
import { useRequireAuth } from "../lib/useRequireAuth";

const F = "'Lexend', sans-serif";

const QUICK = [
  "Should I train with muscle soreness?",
  "Can you swap an exercise for me?",
  "What should I eat before training?",
  "Am I progressing well?",
];

export default function Chat() {
  const router  = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);


  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, sending]);

  const buildSystem = () => {
    const name  = profile?.displayName?.split(" ")[0] || "Athlete";
    const goal  = (profile?.primaryGoal||"general fitness").replace("_"," ");
    const level = profile?.fitnessLevel || "intermediate";
    const days  = profile?.trainingDays || "4";
    const week  = profile?.currentWeek  || 1;
    const loc   = (profile?.workoutLocation||[]).join("/") || "gym";
    const diet  = (profile?.dietaryPrefs||[]).filter(x=>x!=="No Restrictions").join(", ") || "no restrictions";
    const inj   = (profile?.injuries||[]).filter(x=>x!=="None").join(", ") || "none";
    return `You are ApexCoach, an elite AI personal trainer. Speaking with ${name}, Week ${week}. Profile: goal: ${goal}, ${level}, ${days} days/week, ${loc}, diet: ${diet}, injuries: ${inj}. Be direct, knowledgeable, motivating. 2-4 sentences max. No fluff.`;
  };

  const sendMessage = async (text) => {
    const content = (text||input).trim();
    if (!content||sending) return;
    setInput("");
    const next = [...messages, {role:"user",content}];
    setMessages(next);
    setSending(true);
    try {
      const r    = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({messages:next, systemPrompt:buildSystem()}) });
      const data = await r.json();
      setMessages(prev => [...prev, {role:"assistant", content:r.ok?(data.reply||"No response."):(data.error||"Something went wrong.")}]);
    } catch(e) {
      setMessages(prev => [...prev, {role:"assistant", content:"Connection error. Please try again."}]);
    } finally { setSending(false); }
  };

  const handleKey = e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} };
  const isEmpty   = messages.length===0;

  if (loading) return null;

  return (
    <Screen style={{height:"100vh",overflow:"hidden"}}>
      <style>{`@keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}`}</style>

      {/* Header */}
      <div style={{padding:"44px 20px 16px",borderBottom:`1px solid ${C.border}`,background:`rgba(17,18,20,0.98)`,backdropFilter:"blur(16px)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button
            onClick={() => router.push("/coach")}
            style={{
              width:36, height:36, borderRadius:12,
              background:C.bgCard, border:`1px solid ${C.border}`,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color:C.muted, flexShrink:0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{position:"relative",flexShrink:0}}>
            <div style={{width:44,height:44,borderRadius:14,background:C.accentDim,border:`1.5px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:C.accent,fontFamily:F}}>AC</div>
            <div style={{position:"absolute",bottom:-2,right:-2,width:10,height:10,borderRadius:"50%",background:C.accent,border:`2px solid ${C.bg}`}}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:17,fontWeight:900,color:C.white,letterSpacing:-0.3}}>ApexCoach</div>
            <div style={{fontSize:11,color:C.accent,fontWeight:600,marginTop:1}}>AI Trainer · Online</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 0"}}>
        {isEmpty ? (
          <div style={{display:"flex",flexDirection:"column",height:"100%",justifyContent:"center"}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <div style={{fontSize:22,fontWeight:900,color:C.muted,letterSpacing:-0.5,marginBottom:6}}>ASK YOUR TRAINER</div>
              <div style={{fontSize:13,color:C.dim,lineHeight:1.6}}>Questions about your plan, form, nutrition, or recovery.</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {QUICK.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p)} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:F,transition:"border-color 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.accentBorder}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <span style={{fontSize:14,color:C.muted,fontWeight:500}}>{p}</span>
                  <span style={{fontSize:16,color:C.dim,marginLeft:8,flexShrink:0}}>›</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14,paddingBottom:8}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:10}}>
                {m.role==="assistant" && (
                  <div style={{width:30,height:30,borderRadius:9,flexShrink:0,background:C.accentDim,border:`1px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:C.accent,fontFamily:F}}>AC</div>
                )}
                <div style={{maxWidth:"75%",padding:"12px 16px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.role==="user"?C.accentDim:C.bgCard,border:`1.5px solid ${m.role==="user"?C.accentBorder:C.border}`,fontSize:14,lineHeight:1.65,color:m.role==="user"?C.text:C.muted,fontWeight:m.role==="user"?500:400}}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{display:"flex",alignItems:"flex-end",gap:10}}>
                <div style={{width:30,height:30,borderRadius:9,background:C.accentDim,border:`1px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:C.accent,fontFamily:F}}>AC</div>
                <div style={{padding:"14px 18px",borderRadius:"18px 18px 18px 4px",background:C.bgCard,border:`1px solid ${C.border}`,display:"flex",gap:5,alignItems:"center"}}>
                  {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.accent,animation:`blink 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        )}
      </div>

      {/* Quick prompts scroll (when in conversation) */}
      {!isEmpty && (
        <div style={{padding:"8px 16px 0",flexShrink:0}}>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
            {QUICK.map((p,i)=>(
              <button key={i} onClick={()=>sendMessage(p)} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 14px",whiteSpace:"nowrap",fontSize:11,color:C.muted,cursor:"pointer",fontFamily:F,flexShrink:0,fontWeight:500}}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{padding:"10px 16px 90px",flexShrink:0,background:`rgba(17,18,20,0.98)`,backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-end",background:C.bgCard,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"10px 10px 10px 16px"}}>
          <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Ask your trainer anything..." rows={1}
            style={{flex:1,background:"transparent",border:"none",color:C.text,fontSize:15,fontFamily:F,lineHeight:1.5,maxHeight:100,overflowY:"auto",outline:"none",resize:"none"}}/>
          <button onClick={()=>sendMessage()} disabled={!input.trim()||sending} style={{width:40,height:40,borderRadius:12,flexShrink:0,background:input.trim()&&!sending?C.accent:C.bgDeep,border:`1.5px solid ${input.trim()&&!sending?C.accent:C.border}`,cursor:input.trim()&&!sending?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke={input.trim()&&!sending?"#0a0a0a":C.dim} strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim()&&!sending?"#0a0a0a":C.dim} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <BottomNav active="chat" router={router} />
    </Screen>
  );
}

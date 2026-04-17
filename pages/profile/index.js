import { useRouter } from "next/router";
import { Screen, BottomNav, C } from "../../components/shared";
import { Card, Button, SectionLabel, Icon, StatCell, FS, FW, F, R, S } from "../../components/ui";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { signOut } from "../../lib/firebase";

const GOAL_LABELS = {
  fat_loss:    "Fat Loss",
  muscle_gain: "Muscle Gain",
  maintain:    "Maintenance",
};

const LEVEL_LABELS = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
};

export default function ProfileSummary() {
  const router = useRouter();
  const { user, profile, loading } = useRequireAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (loading || !profile) return null;

  const handleLogout = async () => {
    try {
      await signOut();
      try { Object.keys(localStorage).forEach(k => { if (k.startsWith("apex_")) localStorage.removeItem(k); }); } catch {}
      router.replace("/");
    } catch(e) { console.error(e); }
  };

  const initials = (profile?.name || user?.email || "U").slice(0,2).toUpperCase();
  const name     = profile?.name || user?.email?.split("@")[0] || "Athlete";
  const goal     = GOAL_LABELS[profile?.primaryGoal] || "—";
  const level    = LEVEL_LABELS[profile?.fitnessLevel] || "—";
  const days     = profile?.trainingDays || "—";
  const weight   = profile?.weight ? `${profile.weight}${profile.weightUnit || "kg"}` : "—";
  const height   = profile?.height ? `${profile.height}${profile.heightUnit || "cm"}` : "—";
  const loc      = (profile?.workoutLocation || []).join(" / ") || "—";

  return (
    <Screen>
      <div style={{flex:1,overflowY:"auto",padding:"52px 20px 130px",fontFamily:F}}>

        {/* Header */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:C.accent,letterSpacing:3,fontWeight:700,fontStyle:"italic",marginBottom:6}}>APEXCOACH</div>
          <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5}}>
            PROFILE
          </div>
        </div>

        {/* Avatar + name card */}
        <Card padding="lg" style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{
              width:58, height:58, borderRadius:18,
              background:C.accentDim, border:`1.5px solid ${C.accentBorder}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, fontWeight:900, color:C.accent, letterSpacing:-0.5, flexShrink:0,
            }}>
              {initials}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:17, fontWeight:800, color:C.white, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                {name}
              </div>
              <div style={{fontSize:12, color:C.muted, marginTop:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                {user?.email || ""}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats row */}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <StatCell label="GOAL"  value={goal}   color={C.accent}   size="sm" />
          <StatCell label="LEVEL" value={level}  color="#00cfff"    size="sm" />
          <StatCell label="DAYS/WK" value={days} color="#ffaa00"    size="sm" />
        </div>

        {/* Profile details */}
        <SectionLabel style={{marginBottom:10}}>YOUR DETAILS</SectionLabel>
        <Card padding="md" style={{marginBottom:14}}>
          <DetailRow label="Weight"   value={weight}   />
          <DetailRow label="Height"   value={height}   />
          <DetailRow label="Location" value={loc}      />
          <DetailRow label="Age"      value={profile?.age ? `${profile.age} yrs` : "—"} />
          <DetailRow label="Gender"   value={profile?.gender || "—"} last />
        </Card>

        {/* Edit button */}
        <Button
          variant="outline"
          size="md"
          icon={<Icon name="edit" size={16} />}
          onClick={() => router.push("/profile/edit")}
          style={{marginBottom:20}}
        >
          Edit Full Profile
        </Button>

        {/* Account section */}
        <SectionLabel style={{marginBottom:10}}>ACCOUNT</SectionLabel>
        <Card padding="none" style={{marginBottom:20}}>
          <AccountRow
            icon={<Icon name="creditCard" size={16} color={C.muted}/>}
            label="Billing & Subscription"
            value="Free Plan"
            onClick={() => {/* placeholder for future billing page */}}
            disabled
          />
          <AccountRow
            icon={<Icon name="shield" size={16} color={C.muted}/>}
            label="Privacy & Data"
            onClick={() => {/* placeholder */}}
            disabled
            last
          />
        </Card>

        {/* Log out */}
        <Button
          variant="ghost"
          size="md"
          icon={<Icon name="logout" size={16} />}
          onClick={() => setShowLogoutConfirm(true)}
        >
          Log Out
        </Button>

        <div style={{textAlign:"center",marginTop:28,fontSize:10,color:C.dim,letterSpacing:1.5}}>
          APEXCOACH · v1.0
        </div>
      </div>

      <BottomNav active="profile" router={router} />

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <>
          <div
            onClick={() => setShowLogoutConfirm(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(4px)",zIndex:300}}
          />
          <div style={{
            position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
            width:"calc(100% - 32px)",maxWidth:390,
            background:C.bgCard,border:`1px solid ${C.border}`,
            borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",
            zIndex:301,fontFamily:F,
          }}>
            <div style={{width:38,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px"}}/>
            <div style={{fontSize:18,fontWeight:900,color:C.white,marginBottom:8}}>Log Out?</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:24}}>
              Your data is saved to your account and will be here when you sign back in.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <Button variant="danger" size="md" onClick={handleLogout}>
                Yes, Log Out
              </Button>
              <Button variant="outline" size="md" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}

function DetailRow({ label, value, last = false }) {
  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"10px 0",
      borderBottom: last ? "none" : `1px solid ${C.border}`,
    }}>
      <span style={{fontSize:FS.md, color:C.muted, fontWeight:FW.medium}}>{label}</span>
      <span style={{fontSize:FS.md, color:C.text, fontWeight:FW.semibold, textAlign:"right"}}>{value}</span>
    </div>
  );
}

function AccountRow({ icon, label, value, onClick, disabled = false, last = false }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        width:"100%",
        display:"flex", alignItems:"center", gap:12,
        padding:"14px 16px",
        background:"transparent", border:"none",
        borderBottom: last ? "none" : `1px solid ${C.border}`,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontFamily: F, textAlign:"left",
      }}
    >
      {icon}
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:FS.md, color:C.text, fontWeight:FW.semibold}}>{label}</div>
      </div>
      {value && (
        <div style={{fontSize:FS.xs, color:C.dim, fontWeight:FW.medium}}>{value}</div>
      )}
      {!disabled && <Icon name="chevronRight" size={15} color={C.dim}/>}
    </button>
  );
}

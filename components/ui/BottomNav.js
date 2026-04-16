import { C, F, FW } from "./tokens";
import { Icon } from "./Icon";

export default function BottomNav({ active, router }) {
  const tabs = [
    { key: "home",    label: "HOME",    icon: "home",  href: "/dashboard" },
    { key: "coach",   label: "COACH",   icon: "coach", href: "/coach"     },
    { key: "profile", label: "PROFILE", icon: "user",  href: "/profile"   },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: "rgba(17,18,20,0.97)",
      backdropFilter: "blur(16px)",
      borderTop: `1px solid ${C.border}`,
      display: "flex", alignItems: "center",
      padding: "10px 8px 28px",
      zIndex: 100,
      fontFamily: F,
    }}>
      {tabs.map(({ key, label, icon, href }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => router.push(href)}
            style={{
              flex: 1,
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              padding: "2px 0",
            }}
          >
            <div style={{
              width: 50, height: 40, borderRadius: 14,
              background: isActive ? C.bgCard : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.18s",
            }}>
              <Icon name={icon} size={21} color={isActive ? C.accent : C.dim} />
            </div>
            <span style={{
              fontSize: 9, letterSpacing: 1,
              fontWeight: isActive ? FW.bold : FW.normal,
              color: isActive ? C.accent : C.dim,
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

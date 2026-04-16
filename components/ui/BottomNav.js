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
      position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 32px)", maxWidth: 360,
      background: "rgba(28,29,33,0.92)",
      backdropFilter: "blur(20px)",
      border: `1px solid ${C.border}`,
      borderRadius: 22,
      display: "flex", alignItems: "center",
      padding: "6px 6px",
      zIndex: 100,
      fontFamily: F,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      {tabs.map(({ key, label, icon, href }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => router.push(href)}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6,
              background: isActive ? C.accent : "transparent",
              border: "none", cursor: "pointer",
              padding: "10px 6px",
              borderRadius: 18,
              transition: "all 0.18s",
            }}
          >
            <Icon name={icon} size={16} color={isActive ? "#0a0a0a" : C.muted} />
            {isActive && (
              <span style={{
                fontSize: 11, letterSpacing: 0.5,
                fontWeight: FW.bold,
                color: "#0a0a0a",
              }}>
                {label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

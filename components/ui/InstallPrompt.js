import { useState, useEffect, useCallback } from "react";
import { C, F, S, R, FS, FW } from "./tokens";

const DISMISSED_KEY = "apex_install_dismissed";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

function isAndroidChrome() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent) && /chrome/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState(null); // "ios" | "android"
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;
    // Already installed
    if (isInStandaloneMode()) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("android");
      // Delay slightly so page has settled
      setTimeout(() => setVisible(true), 2500);
    };

    if (isAndroidChrome()) {
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    } else if (isIOS()) {
      setPlatform("ios");
      setTimeout(() => setVisible(true), 2500);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }, []);

  const installAndroid = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === "accepted") {
      dismiss();
    }
  }, [deferredPrompt, dismiss]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop tap to dismiss */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
          animation: "apexFadeIn 0.25s ease-out forwards",
        }}
      />

      {/* Toast panel */}
      <div style={{
        position: "fixed",
        bottom: 24,
        left: 16,
        right: 16,
        zIndex: 9999,
        background: C.bgCard,
        border: `1px solid rgba(196,255,0,0.25)`,
        borderRadius: R.xxl,
        padding: "18px 18px 20px",
        fontFamily: F,
        boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(196,255,0,0.08)",
        animation: "apexSlideUp 0.32s cubic-bezier(0.22,1,0.36,1) forwards",
      }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          {/* Icon */}
          <div style={{
            width: 40, height: 40, borderRadius: R.md,
            background: "rgba(196,255,0,0.12)",
            border: "1px solid rgba(196,255,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12" y2="18"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: FS.xs, color: C.muted, letterSpacing: 2, fontWeight: FW.semibold, marginBottom: 3 }}>
              INSTALL APP
            </div>
            <div style={{ fontSize: FS.lg, fontWeight: FW.bold, color: C.white, lineHeight: 1.25 }}>
              Add ApexCoach to<br/>your home screen
            </div>
          </div>
          {/* Close */}
          <button
            onClick={dismiss}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.dim, padding: 2, flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {platform === "ios" ? (
          <>
            <div style={{ fontSize: FS.sm, color: C.muted, lineHeight: 1.65, marginBottom: 16 }}>
              Get the full app experience — offline access, push notifications, and a real app icon.
            </div>
            {/* Step list */}
            <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
              {[
                { n: "1", text: "Tap the Share button in Safari", icon: ShareIcon },
                { n: "2", text: "Scroll down and tap "Add to Home Screen"", icon: AddIcon },
                { n: "3", text: "Tap Add in the top-right corner", icon: CheckIcon },
              ].map(({ n, text, icon: Ico }) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "rgba(196,255,0,0.1)",
                    border: "1px solid rgba(196,255,0,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    fontSize: FS.xs, fontWeight: FW.bold, color: C.accent,
                  }}>{n}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <Ico />
                    <span style={{ fontSize: FS.sm, color: C.text }}>{text}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Arrow pointing down */}
            <div style={{
              marginTop: 16, textAlign: "center",
              fontSize: FS.xs, color: C.dim, letterSpacing: 1,
            }}>
              ↓ Open this in Safari to install ↓
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: FS.sm, color: C.muted, lineHeight: 1.65, marginBottom: 16 }}>
              Install ApexCoach for offline access, faster load times, and a native app experience.
            </div>
            <button
              onClick={installAndroid}
              disabled={installing}
              style={{
                width: "100%",
                background: C.accent,
                color: "#000",
                border: "none",
                borderRadius: R.xl,
                padding: "13px 0",
                fontSize: FS.xl,
                fontWeight: FW.bold,
                fontFamily: F,
                cursor: installing ? "not-allowed" : "pointer",
                opacity: installing ? 0.7 : 1,
                letterSpacing: 0.3,
              }}
            >
              {installing ? "Installing…" : "Install App →"}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes apexSlideUp {
          from { transform: translateY(32px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes apexFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00cfff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  );
}

function AddIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

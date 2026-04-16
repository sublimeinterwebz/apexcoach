import { useEffect } from "react";
import { C, F, FS, FW, R } from "./tokens";

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = "85vh",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed",
        bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: C.bg,
        borderRadius: `${R.xxl}px ${R.xxl}px 0 0`,
        borderTop: `1px solid ${C.border}`,
        zIndex: 201,
        maxHeight,
        display: "flex",
        flexDirection: "column",
        animation: "slideUp 0.25s ease-out",
        fontFamily: F,
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideUp { from { transform: translate(-50%, 100%) } to { transform: translate(-50%, 0) } }
        `}</style>

        {/* Drag handle */}
        <div style={{ padding: "10px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: C.border }}/>
        </div>

        {/* Header */}
        {title && (
          <div style={{
            padding: "12px 20px 8px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: FS.xxl, fontWeight: FW.black, color: C.white, letterSpacing: -0.3 }}>
              {title}
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: C.bgCard, border: "none", cursor: "pointer",
                color: C.muted, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 32px" }}>
          {children}
        </div>
      </div>
    </>
  );
}

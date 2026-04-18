import "../styles/globals.css";
import Head from "next/head";
import { useState } from "react";
import { AuthProvider, useAuth } from "../lib/AuthContext";
import InstallPrompt from "../components/ui/InstallPrompt";
import { useFCM } from "../lib/useFCM";

// Handles notification permission banner only.
// System notifications are delivered via firebase-messaging-sw.js (no foreground duplicate).
function FCMProvider() {
  const { user } = useAuth();
  const { permissionState, requestPermission } = useFCM(user);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const showBanner = !!user && permissionState === "default" && !bannerDismissed;

  const handleEnable = async () => {
    await requestPermission();
    setBannerDismissed(true);
  };

  if (!showBanner) return null;

  return (
    <>
      <div style={{
        position: "fixed", bottom: 100, left: 16, right: 16, zIndex: 9997,
        background: "#1c1d21", border: "1px solid #2a2b30", borderRadius: 14,
        padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        fontFamily: "'Lexend', sans-serif",
        animation: "apexSlideUp 0.3s cubic-bezier(0.22,1,0.36,1) forwards",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: "rgba(196,255,0,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 1 }}>Enable notifications</div>
          <div style={{ fontSize: 11, color: "#9a9ca0" }}>Get alerts when your plan is ready</div>
        </div>
        <button
          onClick={handleEnable}
          style={{
            background: "#c4ff00", border: "none", borderRadius: 8,
            padding: "6px 12px", fontSize: 11, fontWeight: 800,
            color: "#0a0a0a", cursor: "pointer", fontFamily: "'Lexend', sans-serif", flexShrink: 0,
          }}
        >Enable</button>
        <button
          onClick={() => setBannerDismissed(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#5d5e62", padding: 2, flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <style>{`@keyframes apexSlideUp { from { transform:translateY(16px);opacity:0 } to { transform:translateY(0);opacity:1 } }`}</style>
    </>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>ApexCoach</title>
        <meta name="description" content="Your AI-powered personal trainer and nutritionist" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="ApexCoach" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#111214" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ApexCoach" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Splash screen color */}
        <meta name="msapplication-TileColor" content="#111214" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap"
          media="print"
          onLoad="this.media='all'"
        />
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap" />
        </noscript>
      </Head>
      <FCMProvider />
      <Component {...pageProps} />
      <InstallPrompt />
    </AuthProvider>
  );
}

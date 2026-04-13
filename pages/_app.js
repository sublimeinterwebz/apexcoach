import "../styles/globals.css";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { AuthProvider, useAuth } from "../lib/AuthContext";

const PUBLIC_ROUTES = ["/"];

function RouteGuard({ children }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_ROUTES.includes(router.pathname);

    if (!user && !isPublic) {
      // Not signed in — send to welcome
      router.replace("/");
    } else if (user && isPublic && profile?.onboardingComplete) {
      // Signed in + onboarded — skip welcome, go to dashboard
      router.replace("/dashboard");
    } else if (user && !isPublic && !profile?.onboardingComplete) {
      // Signed in but NOT onboarded — send to onboarding
      router.replace("/");
    }
  }, [user, profile, loading, router.pathname]);

  if (loading) return (
    <div style={{ background:"#080808", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ position:"relative", width:60, height:60 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#00ff80", animation:"spin 1s linear infinite" }}/>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue'", fontSize:14, color:"#00ff80", letterSpacing:1 }}>AC</div>
      </div>
    </div>
  );

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>ApexCoach</title>
        <meta name="description" content="Your AI-powered personal trainer and nutritionist" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#080808" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ApexCoach" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <RouteGuard>
        <Component {...pageProps} />
      </RouteGuard>
    </AuthProvider>
  );
}

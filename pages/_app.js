import "../styles/globals.css";
import Head from "next/head";
import { AuthProvider } from "../lib/AuthContext";

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
      <Component {...pageProps} />
    </AuthProvider>
  );
}

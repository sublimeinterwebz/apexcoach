import { useEffect, useRef } from "react";
import { db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

// Saves FCM token to users/{uid}.fcmToken in Firestore
async function saveToken(uid, token) {
  try {
    await updateDoc(doc(db, "users", uid), { fcmToken: token });
  } catch {}
}

// Hook: requests notification permission and captures FCM token.
// Call once after auth resolves. Safe to call on iOS (gracefully no-ops).
export function useFCM(user) {
  const didRun = useRef(false);

  useEffect(() => {
    if (!user?.uid || didRun.current) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    // FCM web push not supported in Safari < 16.4 or non-HTTPS
    if (!("serviceWorker" in navigator)) return;

    didRun.current = true;

    (async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // Dynamic import — keeps firebase/messaging out of the main bundle
        const { getMessaging, getToken } = await import("firebase/messaging");
        const { firebaseApp: app } = await import("./firebase");

        const messaging = getMessaging(app);
        const vapidKey  = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) return;

        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
        if (token) await saveToken(user.uid, token);
      } catch (e) {
        // Silently fail — notifications are non-critical
        console.warn("[FCM] Setup failed:", e.message);
      }
    })();
  }, [user?.uid]);
}

import { useEffect, useRef } from "react";
import { db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

async function saveToken(uid, token) {
  try { await updateDoc(doc(db, "users", uid), { fcmToken: token }); } catch {}
}

// Dispatches a custom event so _app.js can render a foreground toast
function dispatchForegroundNotification(payload) {
  const detail = {
    title: payload.notification?.title || "ApexCoach",
    body:  payload.notification?.body  || "",
    link:  payload.fcmOptions?.link || payload.data?.link || "/dashboard",
  };
  window.dispatchEvent(new CustomEvent("apex:notification", { detail }));
}

export function useFCM(user) {
  const didRun = useRef(false);

  useEffect(() => {
    if (!user?.uid || didRun.current) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    didRun.current = true;

    (async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("[FCM] Permission denied");
          return;
        }

        const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
        const { firebaseApp: app } = await import("./firebase");

        const messaging = getMessaging(app);
        const vapidKey  = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
          console.warn("[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set");
          return;
        }

        // Register the FCM service worker explicitly
        const swReg = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );
        await swReg.update(); // Force fresh SW on every load

        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });

        if (token) {
          console.log("[FCM] Token captured:", token.slice(0, 20) + "…");
          await saveToken(user.uid, token);
        } else {
          console.warn("[FCM] getToken returned null — check VAPID key");
        }

        // Foreground message handler — fires when app tab is open and focused
        onMessage(messaging, (payload) => {
          console.log("[FCM] Foreground message:", payload);
          dispatchForegroundNotification(payload);
        });

      } catch (e) {
        console.warn("[FCM] Setup failed:", e.message);
      }
    })();
  }, [user?.uid]);
}

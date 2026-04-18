import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

async function saveToken(uid, token) {
  try { await updateDoc(doc(db, "users", uid), { fcmToken: token }); } catch {}
}

function dispatchForegroundNotification(payload) {
  const detail = {
    title: payload.notification?.title || "ApexCoach",
    body:  payload.notification?.body  || "",
    link:  payload.fcmOptions?.link || payload.data?.link || "/dashboard",
  };
  window.dispatchEvent(new CustomEvent("apex:notification", { detail }));
}

// Returns { permissionState, requestPermission }
// permissionState: "default" | "granted" | "denied" | "unsupported"
// requestPermission: must be called from a user gesture (button click)
export function useFCM(user) {
  const didSetup = useRef(false);
  const [permissionState, setPermissionState] = useState("default");

  // Read current permission state on mount (no prompt)
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermissionState("unsupported");
      return;
    }
    setPermissionState(Notification.permission); // "default" | "granted" | "denied"
  }, []);

  // Wire up token + foreground listener once permission is granted
  useEffect(() => {
    if (!user?.uid || didSetup.current || permissionState !== "granted") return;
    didSetup.current = true;

    (async () => {
      try {
        const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
        const { firebaseApp: app } = await import("./firebase");
        const messaging = getMessaging(app);
        const vapidKey  = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) { console.warn("[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set"); return; }

        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
        await swReg.update();

        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
        if (token) {
          console.log("[FCM] Token captured:", token.slice(0, 20) + "…");
          await saveToken(user.uid, token);
        } else {
          console.warn("[FCM] getToken returned null — check VAPID key");
        }

        onMessage(messaging, (payload) => {
          console.log("[FCM] Foreground message:", payload);
          dispatchForegroundNotification(payload);
        });
      } catch (e) {
        console.warn("[FCM] Setup failed:", e.message);
      }
    })();
  }, [user?.uid, permissionState]);

  // Must be called from a click/tap handler — satisfies browser user-gesture requirement
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermissionState(result);
    return result;
  }, []);

  return { permissionState, requestPermission };
}

import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "./firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

async function saveToken(uid, token) {
  try {
    // arrayUnion: adds token only if not already present — one entry per device, no overwrites
    await updateDoc(doc(db, "users", uid), { fcmTokens: arrayUnion(token) });
    console.log("[FCM] Token saved to Firestore");
  } catch (e) {
    console.warn("[FCM] Token save failed:", e.message);
  }
}

// Wait for the service worker to reach "activated" state.
// On mobile PWA, the SW may still be installing when getToken() runs,
// causing it to fail silently. This helper waits up to 10s.
function waitForSWActivation(reg) {
  return new Promise((resolve, reject) => {
    if (reg.active) return resolve(reg);

    const sw = reg.installing || reg.waiting;
    if (!sw) return reject(new Error("No SW found in registration"));

    const timeout = setTimeout(() => reject(new Error("SW activation timed out")), 10000);

    sw.addEventListener("statechange", () => {
      if (sw.state === "activated") {
        clearTimeout(timeout);
        resolve(reg);
      }
    });
  });
}

async function captureToken(uid) {
  const { getMessaging, getToken } = await import("firebase/messaging");
  const { firebaseApp: app } = await import("./firebase");
  const messaging = getMessaging(app);
  const vapidKey  = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) { console.warn("[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set"); return false; }

  // Register and wait for the service worker to be fully active
  const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  await swReg.update();
  await waitForSWActivation(swReg);

  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
  if (token) {
    console.log("[FCM] Token captured:", token.slice(0, 20) + "…");
    await saveToken(uid, token);
    return true;
  } else {
    console.warn("[FCM] getToken returned null — check VAPID key");
    return false;
  }
}

// Returns { permissionState, requestPermission }
// permissionState: "default" | "granted" | "denied" | "unsupported"
// requestPermission: must be called from a user gesture (button click)
export function useFCM(user) {
  const [permissionState, setPermissionState] = useState("default");
  const [tokenCaptured, setTokenCaptured] = useState(false);
  const attemptInFlight = useRef(false);

  // Read current permission state on mount (no prompt)
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermissionState("unsupported");
      return;
    }
    setPermissionState(Notification.permission); // "default" | "granted" | "denied"
  }, []);

  // Wire up token capture once permission is granted + user is logged in.
  // Unlike the old version, this retries on failure (up to 3 times with backoff)
  // and only sets "captured" after a successful save.
  useEffect(() => {
    if (!user?.uid || tokenCaptured || permissionState !== "granted" || attemptInFlight.current) return;
    attemptInFlight.current = true;

    let cancelled = false;

    (async () => {
      const MAX_RETRIES = 3;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (cancelled) return;
        try {
          const ok = await captureToken(user.uid);
          if (ok) {
            setTokenCaptured(true);
            attemptInFlight.current = false;
            return;
          }
        } catch (e) {
          console.warn(`[FCM] Attempt ${attempt}/${MAX_RETRIES} failed:`, e.message);
        }
        // Exponential backoff: 2s, 4s, 8s
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
        }
      }
      console.warn("[FCM] All token capture attempts failed");
      attemptInFlight.current = false;
    })();

    return () => { cancelled = true; };
  }, [user?.uid, permissionState, tokenCaptured]);

  // Must be called from a click/tap handler — satisfies browser user-gesture requirement
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermissionState(result);
    return result;
  }, []);

  return { permissionState, requestPermission };
}

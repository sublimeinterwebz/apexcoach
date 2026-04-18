// Server-only — imported exclusively from API routes (Node.js env)
// Requires FIREBASE_SERVICE_ACCOUNT env var: the full service account JSON as a string

import admin from "firebase-admin";

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    } catch (e) {
      console.error("[FCM Admin] Init failed:", e.message);
    }
  }
  // If env var missing, admin stays uninitialised — sends will silently no-op
}

// Send a push notification to a single FCM token.
// Returns true on success, false if the token is stale or env var missing.
export async function sendPushNotification({ token, title, body, link = "/dashboard" }) {
  if (!token || !admin.apps.length) return false;
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      webpush: {
        notification: {
          icon:  "/icons/icon-192.png",
          badge: "/icons/icon-96.png",
        },
        fcmOptions: { link },
      },
    });
    return true;
  } catch (e) {
    if (
      e.code === "messaging/registration-token-not-registered" ||
      e.code === "messaging/invalid-registration-token"
    ) return false; // stale token — caller can clean up
    console.error("[FCM Admin] Send failed:", e.message);
    return false;
  }
}

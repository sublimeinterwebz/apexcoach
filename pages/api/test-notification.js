// Dev/test endpoint — sends a push notification to the calling user's stored FCM token.
// Usage: GET /api/test-notification?uid=<firebase_uid>

import { sendPushNotification } from "../../lib/firebaseAdmin";
import admin from "firebase-admin";

export default async function handler(req, res) {
  // Prevent browser caching — every hit must reach the server
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");

  if (req.method !== "GET") return res.status(405).end();

  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "uid query param required" });

  let fcmToken;
  try {
    const snap = await admin.firestore().doc(`users/${uid}`).get();
    if (!snap.exists) return res.status(404).json({ error: "User doc not found" });
    fcmToken = snap.data()?.fcmToken;
  } catch (e) {
    return res.status(500).json({ error: `Firestore read failed: ${e.message}` });
  }

  if (!fcmToken) {
    return res.status(404).json({
      error: "No FCM token stored for this user yet.",
      hint: "Open the app, grant notification permission, and try again.",
    });
  }

  console.log("[FCM Test] Sending to token:", fcmToken.slice(0, 20) + "…");

  const ok = await sendPushNotification({
    token: fcmToken,
    title: "🧪 Test notification",
    body: "ApexCoach push notifications are working.",
    link: "/dashboard",
  });

  console.log("[FCM Test] Result:", ok);

  if (ok) {
    return res.status(200).json({ success: true, tokenPrefix: fcmToken.slice(0, 20) });
  } else {
    return res.status(500).json({
      error: "Send failed — token stale or VAPID key mismatch. Re-open the app to refresh token.",
      tokenPrefix: fcmToken.slice(0, 20),
    });
  }
}

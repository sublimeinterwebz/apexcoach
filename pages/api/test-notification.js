// Dev/test endpoint — sends a push notification to the calling user's stored FCM token.
// Usage: GET /api/test-notification?uid=<firebase_uid>
// (uid is passed as query param since this is a simple test route — no auth middleware)

import { sendPushNotification } from "../../lib/firebaseAdmin";
import admin from "firebase-admin";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "uid query param required" });

  // Ensure Admin is initialised (firebaseAdmin.js handles this on import)
  // Read the FCM token directly from Firestore
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
      hint: "Open the app in a supported browser, grant notification permission, and try again.",
    });
  }

  const ok = await sendPushNotification({
    token: fcmToken,
    title: "🧪 Test notification",
    body: "ApexCoach push notifications are working.",
    link: "/dashboard",
  });

  if (ok) {
    return res.status(200).json({ success: true, message: "Notification sent." });
  } else {
    return res.status(500).json({
      error: "Send failed — token may be stale. Re-open the app to refresh it.",
    });
  }
}

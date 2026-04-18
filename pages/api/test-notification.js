// Dev/test endpoint — sends a push notification to the calling user's stored FCM token.
// Usage: GET /api/test-notification?uid=<firebase_uid>

import "../../lib/firebaseAdmin"; // triggers initAdmin()
import admin from "firebase-admin";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");

  if (req.method !== "GET") return res.status(405).end();

  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "uid query param required" });

  // Verify Admin is initialised
  if (!admin.apps.length) {
    return res.status(500).json({ error: "Firebase Admin not initialised — check FIREBASE_SERVICE_ACCOUNT env var" });
  }

  let fcmToken;
  try {
    const snap = await admin.firestore().doc(`users/${uid}`).get();
    if (!snap.exists) return res.status(404).json({ error: "User doc not found" });
    fcmToken = snap.data()?.fcmToken;
  } catch (e) {
    return res.status(500).json({ error: `Firestore read failed: ${e.message}` });
  }

  if (!fcmToken) {
    return res.status(404).json({ error: "No FCM token stored. Open the app, grant permission, refresh." });
  }

  console.log("[FCM Test] Token prefix:", fcmToken.slice(0, 20));
  console.log("[FCM Test] Token length:", fcmToken.length);

  try {
    const msgId = await admin.messaging().send({
      token: fcmToken,
      notification: { title: "🧪 Test notification", body: "ApexCoach push notifications are working." },
      webpush: {
        notification: { icon: "/icons/icon-192.png" },
        fcmOptions: { link: "/dashboard" },
      },
    });
    console.log("[FCM Test] Message ID:", msgId);
    return res.status(200).json({ success: true, messageId: msgId, tokenLength: fcmToken.length, tokenPrefix: fcmToken.slice(0, 20) });
  } catch (e) {
    console.error("[FCM Test] Send error code:", e.code);
    console.error("[FCM Test] Send error message:", e.message);
    return res.status(500).json({ error: e.message, code: e.code, tokenLength: fcmToken.length, tokenPrefix: fcmToken.slice(0, 20) });
  }
}

import "../../lib/firebaseAdmin"; // triggers initAdmin()
import admin from "firebase-admin";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.method !== "GET") return res.status(405).end();

  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "uid query param required" });

  if (!admin.apps.length) {
    return res.status(500).json({ error: "Firebase Admin not initialised — check FIREBASE_SERVICE_ACCOUNT env var" });
  }

  let data;
  try {
    const snap = await admin.firestore().doc(`users/${uid}`).get();
    if (!snap.exists) return res.status(404).json({ error: "User doc not found" });
    data = snap.data();
  } catch (e) {
    return res.status(500).json({ error: `Firestore read failed: ${e.message}` });
  }

  // Support both legacy single token and new per-device array
  const fcmTokens = data?.fcmTokens || (data?.fcmToken ? [data.fcmToken] : []);
  if (!fcmTokens.length) {
    return res.status(404).json({ error: "No FCM tokens stored. Open the app, grant permission, refresh." });
  }

  console.log("[FCM Test] Sending to", fcmTokens.length, "token(s)");

  const results = [];
  for (const token of fcmTokens) {
    try {
      const msgId = await admin.messaging().send({
        token,
        notification: { title: "🧪 Test notification", body: "ApexCoach push notifications are working." },
        webpush: {
          notification: { icon: "/icons/icon-192.png" },
          fcmOptions: { link: "/dashboard" },
        },
      });
      results.push({ token: token.slice(0, 20), msgId, ok: true });
    } catch (e) {
      results.push({ token: token.slice(0, 20), error: e.message, code: e.code, ok: false });
    }
  }

  const anyOk = results.some(r => r.ok);
  return res.status(anyOk ? 200 : 500).json({ results });
}

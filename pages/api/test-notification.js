import "../../lib/firebaseAdmin";
import admin from "firebase-admin";
import { sendPushNotification } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.method !== "GET") return res.status(405).end();

  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "uid query param required" });
  if (!admin.apps.length) return res.status(500).json({ error: "Firebase Admin not initialised" });

  let data;
  try {
    const snap = await admin.firestore().doc(`users/${uid}`).get();
    if (!snap.exists) return res.status(404).json({ error: "User doc not found" });
    data = snap.data();
  } catch (e) {
    return res.status(500).json({ error: `Firestore read failed: ${e.message}` });
  }

  const fcmTokens = data?.fcmTokens || (data?.fcmToken ? [data.fcmToken] : []);
  if (!fcmTokens.length) {
    return res.status(404).json({ error: "No FCM tokens stored. Open the app, grant permission, refresh." });
  }

  console.log("[FCM Test] Sending to", fcmTokens.length, "token(s) for uid:", uid);

  const ok = await sendPushNotification({
    uid,
    tokens: fcmTokens,
    title: "🧪 Test notification",
    body: "ApexCoach push notifications are working.",
    link: "/dashboard",
  });

  // Re-read tokens after cleanup to show current state
  const fresh = (await admin.firestore().doc(`users/${uid}`).get()).data()?.fcmTokens || [];

  return res.status(ok ? 200 : 500).json({
    success: ok,
    tokensBefore: fcmTokens.length,
    tokensAfter: fresh.length,
    staleRemoved: fcmTokens.length - fresh.length,
  });
}

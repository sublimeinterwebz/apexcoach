import "../../lib/firebaseAdmin";
import admin from "firebase-admin";
import { sendPushNotification } from "../../lib/firebaseAdmin";

/**
 * POST /api/send-notification
 *
 * Send a custom push notification to one user, multiple users, or all users.
 *
 * Body (JSON):
 *   title   (string, required)  — notification title
 *   body    (string, required)  — notification body text
 *   link    (string, optional)  — route to open on tap (default: "/dashboard")
 *   uid     (string, optional)  — send to a single user
 *   uids    (string[], optional) — send to multiple specific users
 *   all     (boolean, optional) — send to every user who has FCM tokens
 *
 * Exactly one of uid, uids, or all must be provided.
 *
 * Examples:
 *   Single user:    { "title": "Hey!", "body": "Your plan is updated.", "uid": "abc123" }
 *   Multiple users: { "title": "Hey!", "body": "New feature!", "uids": ["abc123", "def456"] }
 *   Broadcast:      { "title": "Announcement", "body": "V2 is live!", "all": true }
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!admin.apps.length) return res.status(500).json({ error: "Firebase Admin not initialised" });

  const { title, body, link = "/dashboard", uid, uids, all } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "title and body are required" });
  }

  // Determine which user IDs to send to
  let targetUids = [];

  if (uid) {
    targetUids = [uid];
  } else if (Array.isArray(uids) && uids.length > 0) {
    targetUids = uids;
  } else if (all) {
    // Fetch all users who have completed onboarding
    try {
      const snap = await admin.firestore()
        .collection("users")
        .where("onboardingComplete", "==", true)
        .get();
      targetUids = snap.docs.map(d => d.id);
    } catch (e) {
      return res.status(500).json({ error: `Firestore query failed: ${e.message}` });
    }
  } else {
    return res.status(400).json({ error: "Provide one of: uid (string), uids (string[]), or all (true)" });
  }

  const results = { sent: 0, skipped: 0, failed: 0, details: [] };

  for (const targetUid of targetUids) {
    try {
      const snap = await admin.firestore().doc(`users/${targetUid}`).get();
      if (!snap.exists) {
        results.skipped++;
        results.details.push({ uid: targetUid, status: "skipped", reason: "user not found" });
        continue;
      }

      const data = snap.data();
      const tokens = data?.fcmTokens || (data?.fcmToken ? [data.fcmToken] : []);
      if (!tokens.length) {
        results.skipped++;
        results.details.push({ uid: targetUid, status: "skipped", reason: "no FCM tokens" });
        continue;
      }

      const ok = await sendPushNotification({ uid: targetUid, tokens, title, body, link });
      if (ok) {
        results.sent++;
        results.details.push({ uid: targetUid, status: "sent", tokens: tokens.length });
      } else {
        results.failed++;
        results.details.push({ uid: targetUid, status: "failed", tokens: tokens.length });
      }
    } catch (e) {
      results.failed++;
      results.details.push({ uid: targetUid, status: "error", message: e.message });
    }
  }

  return res.status(200).json({
    success: results.sent > 0,
    totalTargeted: targetUids.length,
    ...results,
  });
}

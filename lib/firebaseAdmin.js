import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length) return true;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) { console.error("[FCM Admin] FIREBASE_SERVICE_ACCOUNT not set"); return false; }
  try {
    const cleaned = raw.trim().replace(/^["']|["']$/g, "");
    const parsed  = JSON.parse(cleaned);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    admin.initializeApp({ credential: admin.credential.cert(parsed) });
    console.log("[FCM Admin] Initialised for project:", parsed.project_id);
    return true;
  } catch (e) {
    console.error("[FCM Admin] Init failed:", e.message);
    return false;
  }
}
initAdmin();

// Sends a DATA-ONLY FCM message. Our service worker (firebase-messaging-sw.js)
// reads the payload and calls showNotification exactly once.
//
// Why data-only: if we send a `notification` field, Firebase's built-in SDK
// shows a default notification AND our onBackgroundMessage handler shows one too.
// Data-only puts us in full control — exactly one notification per send.
export async function sendPushNotification({ uid, token, tokens, title, body, link = "/dashboard" }) {
  const targets = tokens || (token ? [token] : []);
  if (!targets.length || !admin.apps.length) return false;

  const message = {
    data: { title, body, link },
    webpush: {
      headers: { Urgency: "high" },
    },
  };

  const stale = [];
  let anySuccess = false;

  for (const t of targets) {
    try {
      await admin.messaging().send({ ...message, token: t });
      anySuccess = true;
    } catch (e) {
      if (
        e.code === "messaging/registration-token-not-registered" ||
        e.code === "messaging/invalid-registration-token"
      ) {
        stale.push(t);
      } else {
        console.error("[FCM Admin] Send failed:", e.message);
      }
    }
  }

  if (stale.length && uid) {
    try {
      const { FieldValue } = admin.firestore;
      await admin.firestore().doc(`users/${uid}`).update({
        fcmTokens: FieldValue.arrayRemove(...stale),
      });
      console.log("[FCM Admin] Removed", stale.length, "stale token(s) for uid:", uid);
    } catch (e) {
      console.warn("[FCM Admin] Stale token cleanup failed:", e.message);
    }
  }

  return anySuccess;
}

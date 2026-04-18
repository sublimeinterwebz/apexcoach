// Server-only — imported exclusively from API routes (Node.js env)
// Requires FIREBASE_SERVICE_ACCOUNT env var: the full service account JSON as a string
//
// Common Vercel gotcha: when you paste JSON into Vercel's env var UI, the private_key
// field's \n sequences can get double-escaped or the JSON can get wrapped in extra quotes.
// This init function handles all known variants.

import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length) return true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.error("[FCM Admin] FIREBASE_SERVICE_ACCOUNT env var is not set");
    return false;
  }

  try {
    // Strip wrapping quotes if Vercel added them (e.g. '"{"type":...' → '{"type":...')
    const cleaned = raw.trim().replace(/^["']|["']$/g, "");
    const parsed = JSON.parse(cleaned);

    // Vercel sometimes double-escapes \n in private_key → \\n. Fix it.
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }

    admin.initializeApp({ credential: admin.credential.cert(parsed) });
    console.log("[FCM Admin] Initialised for project:", parsed.project_id);
    return true;
  } catch (e) {
    console.error("[FCM Admin] Init failed:", e.message);
    console.error("[FCM Admin] Raw value starts with:", raw.slice(0, 30));
    return false;
  }
}

// Call on every import — safe to call multiple times
initAdmin();

export async function sendPushNotification({ token, title, body, link = "/dashboard" }) {
  if (!token || !admin.apps.length) return false;
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      webpush: {
        notification: { icon: "/icons/icon-192.png", badge: "/icons/icon-96.png" },
        fcmOptions: { link },
      },
    });
    return true;
  } catch (e) {
    if (
      e.code === "messaging/registration-token-not-registered" ||
      e.code === "messaging/invalid-registration-token"
    ) return false;
    console.error("[FCM Admin] Send failed:", e.message);
    return false;
  }
}

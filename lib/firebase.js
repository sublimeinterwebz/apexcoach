import { initializeApp, getApps } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut as firebaseSignOut, onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  setPersistence, browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_rQab_YoOmwccXY-uJoSbOrm1GfJm7II",
  authDomain: "apexcoach-be717.firebaseapp.com",
  projectId: "apexcoach-be717",
  storageBucket: "apexcoach-be717.firebasestorage.app",
  messagingSenderId: "225684428011",
  appId: "1:225684428011:web:664394dec6309da6ebdaae",
  measurementId: "G-T167BH9Y6P",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Set persistence once at init — keeps user logged in across sessions
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

// ── Auth helpers ──────────────────────────────────────
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result   = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signInAnonymously() {
  const result = await firebaseSignInAnonymously(auth);
  return result.user;
}

export async function signUpWithEmail(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };

// ── Firestore helpers ────────────────────────────────
export async function saveUserProfile(uid, profile) {
  await setDoc(doc(db, "users", uid), {
    ...profile,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveWeekPlan(uid, week, plan) {
  await setDoc(doc(db, "users", uid, "plans", `week_${week}`), {
    ...plan,
    generatedAt: serverTimestamp(),
  });
}

export async function getWeekPlan(uid, week) {
  const snap = await getDoc(doc(db, "users", uid, "plans", `week_${week}`));
  return snap.exists() ? snap.data() : null;
}

export async function saveWorkoutLog(uid, week, day, log) {
  await setDoc(doc(db, "users", uid, "logs", `week_${week}_day_${day}`), {
    ...log,
    loggedAt: serverTimestamp(),
  });
}

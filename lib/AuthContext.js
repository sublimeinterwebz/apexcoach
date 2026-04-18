import { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth, db, onAuthStateChanged, onSnapshot } from "./firebase";
import { doc } from "firebase/firestore";

const AuthContext = createContext({ user: null, profile: null, loading: true, setProfile: () => {} });

const SESSION_KEY = "apex_profile";

function cacheProfile(uid, p) {
  try { localStorage.setItem(`${SESSION_KEY}_${uid}`, JSON.stringify(p)); } catch {}
}
function getCachedProfile(uid) {
  try {
    const s = localStorage.getItem(`${SESSION_KEY}_${uid}`);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined);
  const [profile, setProfile] = useState(undefined);
  const unsubProfileRef = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Tear down any previous profile listener
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
        unsubProfileRef.current = null;
      }

      setUser(firebaseUser ?? null);

      if (firebaseUser) {
        // Seed UI instantly from cache — no flicker
        const cached = getCachedProfile(firebaseUser.uid);
        if (cached) setProfile(cached);

        // Real-time listener — fires immediately with Firestore data,
        // then again any time the doc changes (other tab, other device, profile edit).
        const profileRef = doc(db, "users", firebaseUser.uid);
        unsubProfileRef.current = onSnapshot(profileRef, (snap) => {
          const p = snap.exists() ? snap.data() : null;
          setProfile(p);
          if (p) cacheProfile(firebaseUser.uid, p);
        }, () => {
          // On error, cached value already applied above — no-op
        });

        // If no cache existed, resolve profile to null so loading clears
        // once the listener fires its first snapshot
        if (!cached) setProfile(prev => prev === undefined ? null : prev);
      } else {
        setProfile(null);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfileRef.current) unsubProfileRef.current();
    };
  }, []);

  // Called by profile/edit.js after saving — keeps context in sync immediately.
  // onSnapshot will also confirm the write, so no double-write risk.
  const updateProfile = (p) => {
    setProfile(p);
    if (p && user?.uid) cacheProfile(user.uid, p);
  };

  const loading = user === undefined || profile === undefined;

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile: updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

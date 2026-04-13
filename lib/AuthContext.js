import { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth, onAuthStateChanged, getUserProfile } from "./firebase";

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
  const fetchingRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      setUser(firebaseUser ?? null);

      if (firebaseUser) {
        // 1. Load from localStorage instantly (no flicker, no network wait)
        const cached = getCachedProfile(firebaseUser.uid);
        if (cached) {
          setProfile(cached);
          fetchingRef.current = false;
          // Refresh from Firestore in background (non-blocking)
          getUserProfile(firebaseUser.uid)
            .then(p => { if (p) { setProfile(p); cacheProfile(firebaseUser.uid, p); } })
            .catch(() => {});
          return;
        }
        // 2. No cache — fetch from Firestore
        try {
          const p = await getUserProfile(firebaseUser.uid);
          const resolved = p ?? null;
          setProfile(resolved);
          if (resolved) cacheProfile(firebaseUser.uid, resolved);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      fetchingRef.current = false;
    });
    return unsub;
  }, []);

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

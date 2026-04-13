import { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth, onAuthStateChanged, getUserProfile } from "./firebase";

const AuthContext = createContext({
  user: null, profile: null, loading: true, setProfile: () => {}
});

const SESSION_KEY = "apex_profile";

function saveSession(uid, profile) {
  try { sessionStorage.setItem(`${SESSION_KEY}_${uid}`, JSON.stringify(profile)); } catch {}
}
function loadSession(uid) {
  try { const s = sessionStorage.getItem(`${SESSION_KEY}_${uid}`); return s ? JSON.parse(s) : null; } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined);
  const [profile, setProfile] = useState(undefined);
  const fetchingRef = useRef(false);

  const setAndCacheProfile = (uid, p) => {
    if (p) saveSession(uid, p);
    setProfile(p);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (fetchingRef.current) return; // prevent concurrent fetches
      fetchingRef.current = true;

      setUser(firebaseUser ?? null);

      if (firebaseUser) {
        // Check sessionStorage first for instant load (no flicker)
        const cached = loadSession(firebaseUser.uid);
        if (cached) {
          setProfile(cached);
          fetchingRef.current = false;
          return;
        }
        // Otherwise fetch from Firestore
        try {
          const p = await getUserProfile(firebaseUser.uid);
          setProfile(p ?? null);
          if (p) saveSession(firebaseUser.uid, p);
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

  // Expose a setProfile that also updates sessionStorage
  const updateProfile = (p) => {
    setProfile(p);
    if (p && user?.uid) saveSession(user.uid, p);
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

import { createContext, useContext, useEffect, useState } from "react";
import { auth, onAuthStateChanged, getUserProfile } from "./firebase";

const AuthContext = createContext({ user: null, profile: null, loading: true });

export function AuthProvider({ children }) {
  const [user,           setUser]           = useState(null);
  const [profile,        setProfile]        = useState(null);
  const [loading,        setLoading]        = useState(true);   // auth loading
  const [profileLoading, setProfileLoading] = useState(false);  // firestore loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setProfileLoading(true);
        try {
          const p = await getUserProfile(firebaseUser.uid);
          setProfile(p);
        } catch (e) {
          console.error("Profile fetch error:", e);
          setProfile(null);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
        setProfileLoading(false);
      }

      setLoading(false);
    });
    return unsub;
  }, []);

  // Still loading if auth OR profile fetch is in flight
  const fullyLoaded = !loading && !profileLoading;

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading: !fullyLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

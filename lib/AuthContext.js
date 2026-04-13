import { createContext, useContext, useEffect, useState } from "react";
import { auth, onAuthStateChanged, getUserProfile } from "./firebase";

const AuthContext = createContext({ user: null, profile: null, loading: true, setProfile: () => {} });

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined); // undefined = not yet resolved
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ?? null);
      if (firebaseUser) {
        try {
          const p = await getUserProfile(firebaseUser.uid);
          setProfile(p ?? null);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });
    return unsub;
  }, []);

  // loading = true until both user AND profile have resolved (not undefined)
  const loading = user === undefined || profile === undefined;

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

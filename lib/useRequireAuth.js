import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "./AuthContext";

// Use in every protected page (dashboard, workout, review, chat)
// Redirects to / if user is not signed in
// Returns { user, profile, loading } for the page to use
export function useRequireAuth() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;          // wait for auth + profile to resolve
    if (!user) router.replace("/"); // not signed in → welcome
    // ✅ No check on onboardingComplete here — that's only needed on the index page
  }, [user, loading]);

  return { user, profile, loading };
}

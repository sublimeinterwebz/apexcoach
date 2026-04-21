import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "./AuthContext";

export function useRequireAuth() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const checked = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (checked.current) return;
    checked.current = true;

    if (!user) {
      router.replace("/");
    }
  }, [user, loading]);

  // Reset check flag if user changes
  useEffect(() => {
    checked.current = false;
  }, [user]);

  return { user, profile, loading: loading || !user };
}

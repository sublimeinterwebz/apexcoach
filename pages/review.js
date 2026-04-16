import { useEffect } from "react";
import { useRouter } from "next/router";

// Legacy route — Review is now merged into Coach tab
export default function ReviewRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/coach"); }, [router]);
  return null;
}

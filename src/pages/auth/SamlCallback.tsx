import { AuthLayout } from "./AuthLayout";
import API_CONFIG from "@/lib/apiConfig";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { track } from "@/lib/analytics";

/**
 * Where the API's SAML ACS route sends the browser after a valid assertion.
 *
 * By the time this mounts the session cookies are already set — the redirect
 * that brought us here carried them. All that is left is the readable `pl_user`
 * cookie the app reads for display state, exactly as the password and social
 * paths do. Nothing here decides whether the login succeeded; the server did
 * that, and a failure would have gone to /login?sso_error=1 instead.
 */
const SamlCallback = () => {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const response = await API_CONFIG.get("/api/v1/auth/session");
        const user = response?.data?.data?.user;
        if (!user?.email) throw new Error("no user");

        // asUser has already resolved the photon sentinel client_id.
        Cookies.set("pl_user", JSON.stringify(user), { secure: true, sameSite: "lax", path: "/" });
        track("login_succeeded", { method: "saml" });
        navigate("/", { replace: true });
      } catch {
        navigate("/login?sso_error=1", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <AuthLayout title="Completing sign in" description="Checking your workspace session.">
      <div role="status" className="flex items-center gap-3 text-sm text-pl-text-2">
        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none text-pl-navy" />
        Please wait…
      </div>
    </AuthLayout>
  );
};

export default SamlCallback;

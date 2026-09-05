import API_CONFIG from "@/lib/apiConfig";
import { useGoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import Cookies from "js-cookie";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "@/style.css";
import { Button } from "@/components/ui/button";
import { AuthLayout, AuthMessage } from "./AuthLayout";
import { AuthField } from "./AuthField";
import { SsoButton, SsoEmailStep } from "./SsoPanel";
import { PlatformPayloadInterface } from "./Signup";
import AuthLoadingOverlay from "@/components/auth/AuthLoadingOverlay";
import { GoogleIcon, MicrosoftIcon } from "@/components/auth/BrandIcons";

type loginDataType = {
  email: string;
  name?: string;
};

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .max(50, "Email must be max 50 characters")
    .email("Enter a valid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export interface iLoginForm {
  email: string;
  password: string;
}

const formInitialValues: iLoginForm = {
  email: "",
  password: "",
};

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [entryError, setEntryError] = useState<string | undefined>(() => searchParams.has("session_expired") ? "Your session has expired. Sign in again to return to your workspace." : undefined);
  const [emailOpen, setEmailOpen] = useState(false);

  const { data, mutate, isSuccess, isPending } = useMutation({
    mutationKey: ["social_login"],
    mutationFn: async (data: PlatformPayloadInterface) => {
      try {
        const response = await API_CONFIG.post(
          "/api/v1/auth/social-login",
          data,
        );
        if (response?.data?.data) {
          Cookies.set("pl_user", JSON.stringify(response?.data?.data?.user), { secure: true, sameSite: "lax", path: "/" });

          navigate("/", { replace: true });
        }

        return response.data;
      } catch (error) {
        setEntryError(error?.response?.data?.message || "Sign-in could not be completed. Try again or choose another method.");
      }
    },
  });

  useEffect(() => {
    if (isSuccess && data) {
      const { user } = data.data;

      if (user) {
        Cookies.set("pl_user", JSON.stringify(user), { secure: true, sameSite: "lax", path: "/" });
      }

      navigate("/", { replace: true });
    }
  }, [isSuccess, data]);

  // The API's Microsoft callback redirects back here with ?error= when the
  // state handshake fails or the token exchange does. It never says which —
  // deliberately, so a reason cannot be screenshotted into a ticket — but the
  // user still deserves to be told something happened. This screen used to
  // ignore the parameter entirely and show a silent, ordinary login form.
  useEffect(() => {
    // Two spellings, because two things redirect here on failure: the API's
    // Microsoft callback uses ?error=, and the SAML failure redirect — whose
    // default lives in the backend's saml.config.ts — uses ?sso_error=1. A
    // parameter this screen does not read is a user returned to a silent,
    // ordinary login form with no idea what happened.
    const err = searchParams.get("error") ?? (searchParams.get("sso_error") ? "sso" : null);
    if (!err) return;
    setEntryError(
      err === "oauth_state"
        ? "That sign-in link expired. Please try again."
        : err === "sso"
          ? "SSO sign-in could not be completed. Please try again."
          : "Microsoft sign-in could not be completed. Please try again.",
    );
    const next = new URLSearchParams(searchParams);
    next.delete("error");
    next.delete("sso_error");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const userInfo = await fetchUserInfo(tokenResponse);

        if (userInfo) {
          const payload: PlatformPayloadInterface = {
            code: tokenResponse?.access_token,
            platform_type: "google",
          };
          mutate(payload);
        }
      } catch (error) {
        setEntryError("Google sign-in could not be completed. Try again or choose another method.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      setIsLoading(false);
      setEntryError("Google sign-in could not be completed. Try again or choose another method.");
    },
  });

  const fetchUserInfo = async (tokenResponse) => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        },
      );

      const userInfo = await response.json();

      return userInfo;
    } catch (error) {
      throw error;
    }
  };

  // Errors are a response to submitting, not to typing. Formik's defaults
  // (validateOnChange + validateOnBlur) meant tabbing out of an empty field
  // scolded the user before they had asked for anything. Validation is off
  // until the first submit and live afterwards, so a message that has appeared
  // clears as soon as the value is fixed.
  const [ssoStep, setSsoStep] = useState<"idle" | "email">("idle");
  const [submitted, setSubmitted] = useState(false);

  const {
    values,
    handleChange,
    handleSubmit,
    errors,
  } = useFormik({
    initialValues: formInitialValues,
    validationSchema,
    validateOnChange: submitted,
    validateOnBlur: submitted,
    onSubmit: (values: iLoginForm) => {
      // The ATTEMPT, not the credentials — `method` is an enum and nothing else
      // from this form is ever sent. Paired with the server's login_succeeded /
      // login_failed, this is what turns "logins are down" into "which method".
      track("login_attempted", { method: "password" });
      loginMutate(values);
    },
  });

  // Login mutation for email/password
  const { mutate: loginMutate, isPending: isLoadingLogin } = useMutation({
    mutationKey: ["email_login"],
    mutationFn: async (data: iLoginForm) => {
      try {
        const response = await API_CONFIG.post("/api/v1/auth/login", data, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response?.data?.data) {
          const { user } = response.data.data;

          if (user) {
            Cookies.set("pl_user", JSON.stringify(user), { secure: true, sameSite: "lax", path: "/" });
            navigate("/", { replace: true });
          }
        }
      } catch (error) {
        setEntryError(error?.response?.data?.message === "This account has been disabled."
          ? "This account has been disabled. Contact the person who manages your Pulse access, or use another work account."
          : error?.response?.data?.message || "Sign-in could not be completed. Try again.");
      }
    },
  });

  /**
   * Hand off to the API's own Microsoft route. A full-page navigation, not an
   * XHR — the server issues the redirect, holds the `state` in an HttpOnly
   * cookie and exchanges the code with the client secret, which a browser
   * cannot do and should not try to.
   *
   * This page used to run its own authorize flow against the **`/common`**
   * tenant and POST the returned code to `social-login`, which sent it to the
   * GOOGLE verifier. `/common` is also the unpinned posture the server refuses
   * outright: it would accept an assertion from any Microsoft directory, not
   * just ours. The path below goes through the app origin so the session
   * cookie the callback sets is first-party.
   */
  const microsoftLogin = () => {
    track("login_attempted", { method: "microsoft" });
    window.location.href = "/v1/auth/microsoft";
  };

  if (location.state?.passwordLinkUnavailable) return <AuthLayout title="Password link unavailable" description="This password link is incomplete. Request a new reset link to continue.">
    <Button size="sm" className="w-full" onClick={() => navigate("/forgot-password")}>Request a new reset link</Button>
    <Button variant="link" size="sm" className="mt-6 h-auto px-0 py-0" onClick={() => navigate("/login", { replace: true, state: null })}>Back to sign in</Button>
  </AuthLayout>;

  return (
    <AuthLayout
      title={ssoStep === "email" ? "Sign in with workspace SSO" : emailOpen ? "Sign in with email" : "Sign in to Pulse"}
      description={ssoStep === "email" ? "Enter your work email to continue to your workspace’s sign-in service." : "Use the work account connected to your workspace."}
    >
      <AuthLoadingOverlay show={isLoading} />
      {!emailOpen && <AuthMessage>{entryError}</AuthMessage>}
      {ssoStep === "email" ? (
        <SsoEmailStep onCancel={() => setSsoStep("idle")} />
      ) : emailOpen ? (
        <>
          <Button variant="link" size="sm" className="mb-4 h-auto px-0 py-0" onClick={() => setEmailOpen(false)}>Other sign-in methods</Button>
          <form className="ph-no-capture space-y-2" noValidate aria-busy={isLoadingLogin} onSubmit={(e) => {
            setSubmitted(true);
            setEntryError(undefined);
            handleSubmit(e);
          }}>
            <AuthField label="Work email" name="email" type="email" maxLength={50} autoComplete="username" placeholder="you@company.test"
              error={submitted ? errors.email : undefined} value={values.email}
              onChange={(e) => handleChange({ target: { name: "email", value: e.target.value?.replace(/\s+/g, "").toLowerCase() } })} />
            <AuthField label="Password" name="password" type="password" autoComplete="current-password"
              error={submitted ? errors.password : undefined} value={values.password} onChange={handleChange} />
            <div className="flex justify-end pb-2"><Button variant="link" size="sm" type="button" className="h-auto px-0 py-0" onClick={() => navigate("/forgot-password")}>Forgot password?</Button></div>
            <AuthMessage>{entryError}</AuthMessage>
            <Button size="sm" type="submit" className="w-full" disabled={isLoadingLogin}>{isLoadingLogin ? "Signing in…" : "Sign in"}</Button>
          </form>
        </>
      ) : (
        <>
          <div className="space-y-3">
            <Button size="sm" className="w-full" onClick={() => { track("login_attempted", { method: "google" }); handleLogin(); }} disabled={isLoading || isPending}><GoogleIcon />Continue with Google</Button>
            <Button variant="outline" size="sm" className="w-full" onClick={microsoftLogin} disabled={isLoading || isPending}><MicrosoftIcon />Continue with Microsoft</Button>
            <SsoButton onStart={() => setSsoStep("email")} disabled={isLoading || isPending} />
          </div>
          <div className="mt-5 border-t border-pl-border pt-5">
            <Button variant="link" size="sm" className="h-auto px-0 py-0" onClick={() => setEmailOpen(true)}>Sign in with email</Button>
          </div>
        </>
      )}
      <p className="mt-6 text-sm text-pl-text-2">New to Pulse? <Button variant="link" size="sm" className="h-auto px-0 py-0" onClick={() => navigate("/signup")}>Create an account</Button></p>
    </AuthLayout>
  );
};

export default Login;

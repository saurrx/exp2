import { AuthLayout, AuthMessage, AuthBackLink } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import API_CONFIG from "@/lib/apiConfig";
import { useGoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import Cookies from "js-cookie";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, useSearchParams } from "react-router-dom";
import "@/style.css";
import { AuthField } from "./AuthField";
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
});

export interface iLoginForm {
  email: string;
  source: string;
}

export interface PlatformPayloadInterface {
  code: string;
  platform_type: string;
}

const formInitialValues: iLoginForm = {
  email: "",
  source: "email-signup",
};

const Signup = () => {
  // The screen was reached. Fired once per mount (the ref survives the strict-mode
  // double-invoke), so signup_started → signup_submitted → signup_succeeded reads
  // as three real steps rather than a render count.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    track("signup_started");
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entryError, setEntryError] = useState<string>();
  const [emailOpen, setEmailOpen] = useState(false);
  const [requestReceived, setRequestReceived] = useState(false);

  const { data, mutate, isSuccess, isPending } = useMutation({
    mutationKey: ["social-login"],
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

        setEntryError(response?.data?.message || "Logged in successfully!");

        return response.data;
      } catch (error) {
        setEntryError(error?.response?.data?.message || "Your account request could not be completed. Try again.");
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

  // The API's Microsoft callback reports failure as ?error= and never says
  // which failure, deliberately. Say something rather than nothing.
  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    setEntryError(
      err === "oauth_state"
        ? "That sign-in link expired. Please try again."
        : "Microsoft sign-in could not be completed. Please try again.",
    );
    const next = new URLSearchParams(searchParams);
    next.delete("error");
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

  /** Same server-side flow as Login — see the note there. */
  const microsoftLogin = () => {
    track("signup_submitted");
    window.location.href = "/v1/auth/microsoft";
  };

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

  // Formik for email form
  // Errors answer a submit, not a keystroke — see AuthField for why.
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
      // The submit, not the form. The gap between this and the server's
      // signup_succeeded / signup_rejected_domain is the domain allow-list
      // turning people away — invisible from either end alone.
      track("signup_submitted");
      loginMutate(values);
    },
  });

  // Signup mutation for email
  const { mutate: loginMutate, isPending: isLoadingLogin } = useMutation({
    mutationKey: ["email_signup"],
    mutationFn: async (data: iLoginForm) => {
      try {
        const response = await API_CONFIG.post(
          "/api/v1/auth/email-signup",
          data,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response?.data?.data) {
          setRequestReceived(true);
        }
      } catch (error) {
        setEntryError(error?.response?.status === 403
          ? "Your organization’s domain is not enabled for self-signup. Ask your Workspace Admin to confirm access or request an invitation."
          : error?.response?.data?.message || "Your request could not be completed. Try again.");
      }
    },
  });

  return (
    <AuthLayout title={requestReceived ? "Request received" : "Create your Pulse account"}
      description={requestReceived ? "If your email is eligible, follow the instructions sent to your inbox to continue." : "Use your work account. Self-signup is available for organizations already onboarded to Pulse."}>
      <AuthLoadingOverlay show={isLoading} />
      {!emailOpen && <AuthMessage>{entryError}</AuthMessage>}
      {requestReceived ? <p className="ph-no-capture break-words text-sm font-medium text-pl-navy">{values.email}</p> : emailOpen ? <>
        <Button variant="link" size="sm" className="mb-4 h-auto px-0 py-0" onClick={() => setEmailOpen(false)}>Other account methods</Button>
        <form className="ph-no-capture space-y-2" noValidate aria-busy={isLoadingLogin} onSubmit={(e) => { setSubmitted(true); setEntryError(undefined); handleSubmit(e); }}>
          <AuthField label="Work email" name="email" type="email" maxLength={50} autoComplete="username" placeholder="you@company.test"
          error={submitted ? errors.email : undefined} value={values.email}
          onChange={(e) => handleChange({ target: { name: "email", value: e.target.value?.replace(/\s+/g, "").toLowerCase() } })} />
          <AuthMessage>{entryError}</AuthMessage>
          <Button type="submit" size="sm" className="w-full" disabled={isLoadingLogin}>{isLoadingLogin ? "Sending…" : "Continue with work email"}</Button>
        </form>
      </> : <>
        <div className="space-y-3">
          <Button size="sm" className="w-full" onClick={() => { track("signup_submitted"); handleLogin(); }} disabled={isLoading || isPending}><GoogleIcon />Continue with Google</Button>
          <Button variant="outline" size="sm" className="w-full" onClick={microsoftLogin} disabled={isLoading || isPending}><MicrosoftIcon />Continue with Microsoft</Button>
        </div>
        <div className="mt-5 border-t border-pl-border pt-5"><Button variant="link" size="sm" className="h-auto px-0 py-0" onClick={() => setEmailOpen(true)}>Continue with work email</Button></div>
      </>}
      <AuthBackLink />
    </AuthLayout>
  );
};

export default Signup;

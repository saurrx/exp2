import { AuthLayout, AuthMessage, AuthBackLink } from "./AuthLayout";
import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AuthField } from "./AuthField";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import API_CONFIG from "@/lib/apiConfig";
import { Eye, EyeOff } from "lucide-react";
import { iLoginForm } from "./Login";
import Cookies from "js-cookie";
import { useMemo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion"
import AuthLoadingOverlay from "@/components/auth/AuthLoadingOverlay";
// password and confirm_password fields. both should be same case sentsitive
const validationSchema = Yup.object().shape({
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/\d/, "Must contain at least one number")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, "Must contain at least one special character"),
  confirm_password: Yup.string()
    .required("Confirm Password is required")
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

// define interface for form values
interface FormValues {
  password: string;
  confirm_password: string;
}

// define initial values for form
const initialValues: FormValues = {
  password: "",
  confirm_password: "",
};

type CurrentPageStatusType = "SUCCESS_RESET" | "SUCCESS_SET" | "ALREADY_ACTIVE" | "PENDING";

const ResetPassword: React.FC = () => {
  const [currentPageStatus, setCurrentPageStatus] =
    useState<CurrentPageStatusType>("PENDING");
  const [searchParams] = useSearchParams();
  const [entryError, setEntryError] = useState<string>();
  const navigate = useNavigate();
  const source = searchParams?.get("source");
  const isForgotPasswordFlow = source === "forgot_password";

  const { mutate: loginMutate, isPending: isLoadingLogin } = useMutation({
    mutationKey: ["ihc_login"],
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
            window.location.href = "/";
          }
        }
      } catch (error) {
        console.error("Error logging in:", error);
        toast.error(error?.response?.data?.message || "Error logging in");
      }
    },
  });

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Redirect to login if token is missing or invalid
  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { passwordLinkUnavailable: true } });
    }
  }, [token, navigate]);

  const { mutate, isPending } = useMutation({
    mutationKey: ["reset_password"],
    mutationFn: async (values: {
      user_id: string;
      password: string;
      source?: "verify_link";
      email?: string;
    }) => {
      try {
        let response;

        if (source === "email_signup") {
          // Email signup: user does not exist yet; backend creates them.
          response = await API_CONFIG.post(
            `/api/v1/auth/complete-signup`,
            {
              token,
              email: email || values.email,
              password: values.password,
            },
            { headers: { "Content-Type": "application/json" } }
          );
          if (response?.status === 200) {
            setCurrentPageStatus("SUCCESS_SET");
            setTimeout(() => navigate("/login"), 2000);
          }
          return response?.data;
        }
  

        if (isForgotPasswordFlow) {
          // Forgot password flow - call reset-password endpoint
          response = await API_CONFIG.post(
            `/api/v1/auth/reset-password`,
            {
              token,
              password: values.password,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response?.status === 200) {
            setCurrentPageStatus("SUCCESS_RESET");
            // Redirect to login page after a short delay
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          }
        } else {
          // Original set-password flow
          response = await API_CONFIG.post(
            `/api/v1/auth/ihc/set-password`,
            {
              token,
              password: values.password,
              email: values.email,
              source: source || null,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response?.status === 200) {
            setCurrentPageStatus("SUCCESS_SET");
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          }
        }

        return response?.data;
      } catch (error: any) {
        console.error("Error resetting password:", error);
        setEntryError(error?.response?.data?.message || "Your password could not be saved. Try again or request a new reset link.");
      }
    },
  });

  // useFormik hook to manage form state and validation
  // Errors answer a submit, not a keystroke — see AuthField for why.
  const [submitted, setSubmitted] = useState(false);

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
  } = useFormik({
    initialValues,
    validationSchema,
    validateOnChange: submitted,
    validateOnBlur: submitted,
    onSubmit: (values) => {
      // handle form submission
      if (isForgotPasswordFlow) {
        mutate({
          password: values.password,
          user_id: searchParams?.get("user_id") || "",
        });
      } else {
        mutate({
          password: values.password,
          source: "verify_link",
          user_id: searchParams?.get("user_id") || "",
          email: searchParams?.get("email") || "",
        });
      }
    },
  });

  const complete = currentPageStatus === "SUCCESS_RESET" || currentPageStatus === "SUCCESS_SET";
  if (complete) return <PasswordCompletion reset={isForgotPasswordFlow} />;
  return (
    <AuthLayout title={isForgotPasswordFlow ? "Reset your password" : "Set your password"}
      description="Use at least 8 characters, with an uppercase letter, lowercase letter, number and special character.">
      <AuthLoadingOverlay show={isLoadingLogin} />
      {<form className="ph-no-capture space-y-2" noValidate aria-busy={isPending} onSubmit={(e) => { setSubmitted(true); setEntryError(undefined); handleSubmit(e); }}>
        <AuthField label="New password" name="password" type="password" autoComplete="new-password" error={submitted ? errors.password : undefined} value={values.password} onChange={handleChange} />
        <AuthField label="Confirm password" name="confirm_password" type="password" autoComplete="new-password" error={submitted ? errors.confirm_password : undefined} value={values.confirm_password} onChange={handleChange} />
        <AuthMessage>{entryError}</AuthMessage>
        <Button type="submit" size="sm" className="w-full" disabled={isPending}>{isPending ? "Saving password…" : isForgotPasswordFlow ? "Reset password" : "Set password"}</Button>
      </form>}
      {entryError ? <Button variant="link" size="sm" className="mt-6 h-auto px-0 py-0" onClick={() => navigate(isForgotPasswordFlow ? "/forgot-password" : "/signup")}>{isForgotPasswordFlow ? "Request a new reset link" : "Return to account setup"}</Button> : <AuthBackLink />}
    </AuthLayout>
  );
};

export default ResetPassword;

/** The transient completion shown before the existing two-second sign-in return. */
export function PasswordCompletion({ reset = true }: { reset?: boolean }) {
  return <AuthLayout title={reset ? "Password reset" : "Password set"} description={<span role="status">Taking you back to sign in. Use your new password when you return.</span>}>
    <AuthBackLink />
  </AuthLayout>;
}

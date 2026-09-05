import { AuthLayout, AuthMessage, AuthBackLink } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { AuthField } from "./AuthField";
import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import API_CONFIG from "@/lib/apiConfig";


const validationSchema = Yup.object().shape({
  email: Yup.string().max(50, "Email must be max 50 characters").email("Enter a valid email address").required("Email is required"),
});

export interface iForgotPasswordForm {
  email: string;
}

const formInitialValues: iForgotPasswordForm = {
  email: "",
};

type StatusType = "PENDING" | "SENT";

const ForgotPassword = () => {
  const [status, setStatus] = React.useState<StatusType>("PENDING");
  const [entryError, setEntryError] = React.useState<string>();

  // Errors answer a submit, not a keystroke — see AuthField for why.
  const [submitted, setSubmitted] = React.useState(false);

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
    onSubmit: (values: iForgotPasswordForm) => {
      forgotPasswordMutate(values.email);
    },
  });

  // forgot password mutation
  const { mutate: forgotPasswordMutate, isPending: isLoading } = useMutation({
    mutationKey: ["forgot_password"],
    mutationFn: async (email: string) => {
      try {
        const response = await API_CONFIG.post(
          "/api/v1/auth/forgot-password",
          {
            email,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response?.data) {
          setStatus("SENT");
        }
      } catch (error: any) {
        console.error("Error sending forgot password email:", error);
        setEntryError(
          error?.response?.data?.message ||
            "Error sending password reset link. Please try again."
        );
      }
    },
  });

  return (
    <AuthLayout title={status === "SENT" ? "Check your email" : "Reset your password"}
      description={status === "SENT" ? "If an eligible account uses this email, you’ll receive a password reset link." : "Enter your work email to request a password reset link."}>
      {status === "PENDING" ? <form className="ph-no-capture space-y-2" noValidate aria-busy={isLoading} onSubmit={(e) => { setSubmitted(true); setEntryError(undefined); handleSubmit(e); }}>
        <AuthField label="Work email" name="email" type="email" maxLength={50} autoComplete="username" placeholder="you@company.test"
          error={submitted ? errors.email : undefined} value={values.email}
          onChange={(e) => handleChange({ target: { name: "email", value: e.target.value?.replace(/\s+/g, "").toLowerCase() } })} />
        <AuthMessage>{entryError}</AuthMessage>
        <Button type="submit" size="sm" className="w-full" disabled={isLoading}>{isLoading ? "Sending…" : "Send reset link"}</Button>
      </form> : <div className="space-y-4">
        <p className="ph-no-capture break-words text-sm font-medium text-pl-navy">{values.email}</p>
        <p className="text-sm leading-relaxed text-pl-text-2">Check your spam folder. If it does not arrive, return to the form to check your email and request another link.</p>
        <Button size="sm" className="w-full" onClick={() => { setStatus("PENDING"); setSubmitted(false); }}>Check email or resend</Button>
      </div>}
      <AuthBackLink />
    </AuthLayout>
  );
};

export default ForgotPassword;

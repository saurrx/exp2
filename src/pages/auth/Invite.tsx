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
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import "@/style.css";
import { motion } from "framer-motion";
import { AuthField } from "./AuthField";
import AuthLoadingOverlay from "@/components/auth/AuthLoadingOverlay";

type loginDataType = {
  email: string
};

const validationSchema = Yup.object().shape({
  email: Yup.string().max(50, "Email must be max 50 characters").email("Enter a valid email address").required("Email is required"),
});

export interface iLoginForm {
  email: string;
}

const formInitialValues: iLoginForm = {
  email: "",
};

const Invite = () => {
  const loaction = useLocation();
  const { state } = loaction;
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [entryError, setEntryError] = useState<string>();
  const [linkUnavailable, setLinkUnavailable] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { inviteCode } = useParams();

  const code = searchParams.get("code") || inviteCode;
  const domain = searchParams.get("domain");

  useEffect(() => { setIsSent(false); setLinkUnavailable(false); setEntryError(undefined); }, [code]);

  // Someone followed an invite or share link and landed here. The code itself is
  // a credential and never travels; this is only "a link was opened", which is
  // the missing first step of invite_opened → invite_accepted / share_link_accepted.
  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current || !code) return;
    openedRef.current = true;
    track("invite_opened");
  }, [code]);

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
      sendInvitationMutate(values.email);
    },
  });

  // Send invitation mutation for email
  const { mutate: sendInvitationMutate, isPending: isLoadingSendInvitation } = useMutation({
    mutationKey: ["send_invitation"],
    mutationFn: async (email: string) => {
      try {
        const response = await API_CONFIG.post(`/api/v1/auth/ihc/verify?code=${code}&domain=${domain}`, { email }, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response?.data?.data) {
          setIsSent(true);
        }
      } catch (error) {
        console.error("Error sending invitation:", error);
        setLinkUnavailable(error?.response?.status === 404);
        setEntryError(error?.response?.status === 404
          ? "This invitation link is no longer valid. Ask your Workspace Admin for a new invitation, or sign in if you already have access."
          : error?.response?.data?.message || "The invitation could not be verified. Check your email and try again.");
      }
    },
  });

  if (linkUnavailable) return <AuthLayout title="Invitation unavailable">
    <AuthMessage>{entryError}</AuthMessage>
    <Button size="sm" className="w-full" onClick={() => navigate("/login")}>Back to sign in</Button>
  </AuthLayout>;

  return (
    <AuthLayout title={isSent ? "Invitation verified" : "Join your workspace"}
      description={isSent ? "Continue to sign in with your work account." : "Enter your work email to verify this invitation."}>
      {isSent ? <div className="space-y-4">
        <p className="ph-no-capture break-words text-sm font-medium text-pl-navy">{values.email}</p>
        <Button size="sm" className="w-full" onClick={() => navigate("/login")}>Continue to sign in</Button>
      </div> : <>
        <form className="ph-no-capture space-y-2" noValidate aria-busy={isLoadingSendInvitation} onSubmit={(e) => { setSubmitted(true); setEntryError(undefined); handleSubmit(e); }}>
          <AuthField label="Work email" name="email" type="email" maxLength={50} autoComplete="username" placeholder="you@company.test"
          error={submitted ? errors.email : undefined} value={values.email}
          onChange={(e) => handleChange({ target: { name: "email", value: e.target.value?.replace(/\s+/g, "").toLowerCase() } })} />
          <AuthMessage>{entryError}</AuthMessage>
          <Button type="submit" size="sm" className="w-full" disabled={isLoadingSendInvitation}>{isLoadingSendInvitation ? "Verifying…" : "Verify invitation"}</Button>
        </form>
        <AuthBackLink />
      </>}
    </AuthLayout>
  );
};

export default Invite;

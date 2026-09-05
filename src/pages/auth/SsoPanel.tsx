import { Button } from "@/components/ui/button";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { AuthField } from "./AuthField";
import { ssoAllows, SSO_START_URL } from "./ssoAccess";

/**
 * The enterprise SSO hand-off, in two steps.
 *
 * Step one is a button beside Google and Microsoft. Step two asks for a work
 * email before redirecting, which exists for one reason: there is a single IdP
 * for the whole product, so someone whose organisation does not use it would
 * otherwise be sent to an Okta login they cannot possibly pass and left to work
 * out why. Telling them here is kinder and leaks nothing — the list is public
 * knowledge to anyone who reads the bundle, and it authorises nobody. See
 * ssoAccess.ts.
 *
 * The hand-off is a full-page navigation, not an XHR. The API answers with a
 * redirect to the IdP and holds the SAML `state` in an HttpOnly cookie; neither
 * survives being fetched from JavaScript.
 */
export function SsoButton({ onStart, disabled }: { onStart: () => void; disabled?: boolean }) {
  return (
    <Button type="button" variant="link" size="sm" onClick={onStart} disabled={disabled} className="h-auto px-0 py-0">
      Use workspace SSO
    </Button>
  );
}

export function SsoEmailStep({ onCancel }: { onCancel: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [unavailable, setUnavailable] = useState(false);

  const submit = () => {
    const value = email.trim().toLowerCase();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email address");
      return;
    }
    if (!ssoAllows(value)) {
      setUnavailable(true);
      setError(
        "SSO isn't enabled for your organisation. Use your email and password, or Google or Microsoft.",
      );
      return;
    }
    track("login_attempted", { method: "sso" });
    window.location.href = SSO_START_URL;
  };

  return (
    <div className="space-y-3">
      {!unavailable && <Button type="button" variant="link" size="sm" onClick={onCancel} className="mb-2 h-auto px-0 py-0">Other sign-in methods</Button>}
      <AuthField label="Work email" name="sso-email" type="email" autoComplete="username" placeholder="you@company.test"
        error={error} value={email} onChange={(e) => {
          setEmail(e.target.value.replace(/\s+/g, "").toLowerCase());
          setUnavailable(false);
          if (error) setError(undefined);
        }} onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); submit(); }
        }} />
      <Button type="button" size="sm" onClick={unavailable ? onCancel : submit} className="w-full">{unavailable ? "Choose another method" : "Continue with SSO"}</Button>
    </div>
  );
}

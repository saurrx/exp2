# DSN-0019 — proposed email-signup contract correction

Status: awaiting the founder’s narrow auth/adapter exception. No correction to the adapter or authentication handlers has been applied.

The full application sends `{ email, source: "email-signup" }` from the existing email signup form. `src/lib/realAdapter.ts` maps that request to `/v1/auth/signup`, whose existing mock handler requires a password before it checks the organization domain. Both `new@northwind.test` (eligible) and `new@not-onboarded.test` (ineligible) return HTTP 400, `Email and password are required.` The form has no password input. Evidence: `functional-initial.log` and `signup-contract-blocker.png`. The Unknown domain story currently verifies the presentation of a supplied HTTP 403; it is explicitly not proof that the real signup path works.

The existing signup-completion mapping also points `/api/v1/auth/complete-signup` at password-reset completion, dropping the email and never creating the new signup user. Merely accepting an email at the first endpoint would leave activation incomplete.

## Proposed bounded change

1. Preserve the existing public routes, email-first screen, provider choices and later password-setting screen. Change only the two email signup translations in `src/lib/realAdapter.ts` to dedicated request/completion endpoints in the mock’s `/v1` vocabulary. Declare these V0 capabilities in `mock/proposed-routes.json` with a reconciliation entry.
2. The mock request checks the active onboarded domain. An unknown domain receives the domain-rejection response and no account. An eligible request records a synthetic pending verification bound to that email and client; it does not create a session or grant access. Existing accounts receive a generic response without an account-existence disclosure.
3. Completion requires the matching, unexpired, unused synthetic verification and the submitted password. Recheck that the domain/client remains eligible. Create only an Inventor in that client, consume the verification, then retain the existing return to sign in. Reject mismatched/replayed/expired completion without changing any account. Synthetic state belongs in the mock; no external message or provider host is contacted.
4. Replace the response-only domain story with the actual handler path. Add meaningful API tests for eligible completion, unknown domain, expired/mismatched/replayed verification and client/role boundaries. Re-run the full-app request-to-completion-to-login path, required gates, screenshot review and independent evaluation before landing.

No changes are proposed to OAuth/SAML handoffs, session refresh, client-view restoration, permissions for existing users, analytics, or product-context. The correction implements the already-authorized domain-gated activation journey.

## Why explicit approval is needed

`RUN-GOALS.md`, condition template, says: “do not touch src/lib/realAdapter.ts, auth or analytics.” The existing exception recorded in PROGRESS.md covers client-view exit and identity restoration. It does not cover signup. This proposal needs a separate narrow exception for the email-signup translations and mock request/completion mechanics above.

# Auth Security Review

**Last audited:** 2026-04-07
**Scope:** All custom authentication code — see file list below
**Auditor:** Auth Auditor Agent

### Files Audited

- `src/auth.ts`
- `src/auth.config.ts`
- `src/proxy.ts`
- `src/lib/auth/verification.ts`
- `src/lib/auth/password-reset.ts`
- `src/lib/db/profile.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/app/api/auth/delete-account/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/sign-in/page.tsx`
- `src/app/register/page.tsx`
- `src/app/verify-email/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/profile/page.tsx`
- `src/components/auth/SignInForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ForgotPasswordForm.tsx`
- `src/components/auth/ResetPasswordForm.tsx`
- `src/components/profile/ChangePasswordSection.tsx`
- `src/components/profile/DeleteAccountSection.tsx`

---

## Summary

The overall authentication implementation is solid for an early-stage application. Password hashing is done correctly (bcrypt, 12 rounds), token generation uses a cryptographically secure source (`crypto.randomBytes`), tokens are single-use, and all protected API routes verify the session before acting. The most impactful gaps are: no rate limiting on any auth endpoint (leaving brute-force and token-stuffing attacks fully open), an unvalidated `callbackUrl` that enables open redirect, and a token namespace collision between the email-verification and password-reset flows that allows one type of token to be consumed as the other.

---

## Findings

### 🔴 Critical

#### C1 — Token Namespace Collision: Password-Reset Token Accepted as Email-Verification Token (and Vice Versa)

- **File:** `src/lib/auth/verification.ts` (lines 58–86), `src/lib/auth/password-reset.ts` (lines 8–25), `src/app/api/auth/reset-password/route.ts`
- **Lines:** `verification.ts:59`, `password-reset.ts:13–15`
- **Issue:** Both `generateVerificationToken()` and `generatePasswordResetToken()` write to the same `VerificationToken` table using `identifier = email`. There is no field distinguishing the token's purpose. A valid password-reset token can be submitted to `POST /api/auth/reset-password` — correct — but also to `GET /verify-email?token=<reset-token>`, which will mark the user's email as verified without them ever confirming their address. The reverse is also true: a verification token is accepted by the password-reset endpoint and would fail only because no password is supplied, but the token is still consumed and deleted, acting as a denial-of-service against the legitimate reset flow.

  More seriously: `generatePasswordResetToken()` calls `prisma.verificationToken.deleteMany({ where: { identifier: email } })` at line 13–15, which silently deletes any pending email-verification token for that address. An attacker who knows a victim just registered can trigger a password-reset request for that email immediately, invalidating the victim's verification token and blocking account activation indefinitely.

- **Impact:** Account-activation denial-of-service; cross-flow token acceptance allows email bypass when `REQUIRE_EMAIL_VERIFICATION=true`.
- **Fix:** Add a `type` discriminator to the token. The simplest approach without a migration is to prefix the `identifier` field with the flow name: store `"verify:<email>"` for verification tokens and `"reset:<email>"` for reset tokens, then query with the corresponding prefix. Look up and delete using the same prefix in each helper. Alternatively, add a `purpose` column to `VerificationToken` via a migration.

---

### 🟠 High

#### H1 — No Rate Limiting on Any Auth Endpoint

- **File:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/auth/change-password/route.ts`
- **Lines:** All route handlers — no rate-limiting middleware present anywhere in the codebase.
- **Issue:** Every custom auth endpoint accepts unlimited unauthenticated requests with no throttling. Confirmed by searching the entire `src/` directory — there is no `rateLimit`, `redis`, or throttling import anywhere.
  - `POST /api/auth/register`: An attacker can create thousands of accounts in seconds, exhausting the free-tier user limit, polluting the database, and triggering unlimited Resend emails (cost amplification).
  - `POST /api/auth/forgot-password`: An attacker can hammer this with real email addresses, triggering mass email sends to victims (email bombing / Resend quota exhaustion).
  - `POST /api/auth/reset-password`: An attacker with a partially known token can brute-force the 64-hex-character token space — impractical mathematically, but the endpoint provides unlimited attempts with no lockout.
  - `POST /api/auth/change-password`: An authenticated attacker who has compromised a session can attempt unlimited current-password guesses to pivot to other accounts.
  - NextAuth's built-in Credentials `authorize` is also called without rate limiting; brute-force on `POST /api/auth/callback/credentials` is unrestricted.
- **Impact:** Account takeover via credential stuffing/brute force; resource exhaustion (DB, email provider quota); spam account creation.
- **Fix:** Add rate limiting at the middleware or route level. For a Next.js/Vercel stack, the most practical options are:
  - **Upstash Redis + `@upstash/ratelimit`** — pair with the existing Redis mention in the project stack. Apply per-IP limits: e.g., 5 requests/15 min on `/api/auth/forgot-password`, 10 requests/hour on `/api/auth/register`.
  - **Vercel's built-in Edge rate limiting** (if on Vercel Pro).
  - At minimum, limit `forgot-password` (email bombing risk) and `register` (spam risk) before going to production.

#### H2 — Open Redirect via Unvalidated `callbackUrl`

- **File:** `src/app/sign-in/page.tsx` (line 8), `src/components/auth/SignInForm.tsx` (lines 62, 79)
- **Lines:** `sign-in/page.tsx:8`, `SignInForm.tsx:62`
- **Issue:** The `callbackUrl` query parameter is read directly from `searchParams` and passed to `router.push(callbackUrl)` after a successful credentials sign-in, and to `signIn('github', { callbackUrl })` for GitHub OAuth — with no origin validation. An attacker can craft a link such as:
  ```
  https://devstash.app/sign-in?callbackUrl=https://evil.com/steal-tokens
  ```
  After successful authentication the user is silently redirected to the attacker's domain. This is a well-documented phishing vector for credential-harvesting pages.

  Note: NextAuth itself validates `callbackUrl` for OAuth flows when the URL is passed through its own internals, but the manual `router.push(callbackUrl)` on line 62 of `SignInForm.tsx` bypasses that protection entirely for the credentials flow.

- **Impact:** Post-login open redirect enabling phishing, credential theft via redirect to attacker-controlled lookalike pages.
- **Fix:** Validate that `callbackUrl` is a relative path before using it:
  ```typescript
  // In sign-in/page.tsx, before passing to SignInForm:
  function isSafeRedirect(url: string): boolean {
    return url.startsWith('/') && !url.startsWith('//')
  }
  const safeCallbackUrl = isSafeRedirect(callbackUrl ?? '') ? callbackUrl : '/dashboard'
  ```
  Apply this in the server component (`sign-in/page.tsx`) so `SignInForm` receives only a validated value.

---

### 🟡 Medium

#### M1 — Email Addresses Not Normalized at Registration

- **File:** `src/app/api/auth/register/route.ts` (lines 10–56)
- **Lines:** 39, 47
- **Issue:** The forgot-password route normalizes email with `.toLowerCase().trim()` before querying (line 14 of `forgot-password/route.ts`), but the register route stores `email` exactly as submitted, and the sign-in `authorize` function queries with the raw input. This means `User@Example.com` and `user@example.com` are treated as different addresses during registration (the DB unique constraint is case-sensitive in Postgres by default), but after registration, `user@example.com` would fail to log in if the account was created as `User@Example.com`.

- **Impact:** User lockout; potential duplicate accounts for the same mailbox; inconsistent behavior between registration and forgot-password.
- **Fix:** Normalize `email` to lowercase (and trim whitespace) in the register route before the uniqueness check and `prisma.user.create`. Apply the same normalization in `auth.ts`'s `authorize` function before `prisma.user.findUnique`.

#### M2 — Shared Token Table Deletion Race: Password-Reset Deletes Pending Verification Tokens

- **File:** `src/lib/auth/password-reset.ts` (lines 13–15)
- **Lines:** 13–15
- **Issue:** This is the destructive side-effect of the token namespace collision (C1), broken out as a standalone medium finding because it is exploitable independently of the cross-flow token acceptance issue. When `generatePasswordResetToken(email)` is called, it runs:
  ```typescript
  await prisma.verificationToken.deleteMany({ where: { identifier: email } })
  ```
  This unconditionally deletes any token with that `identifier`, including an active email-verification token. An attacker who knows a victim's email can call `POST /api/auth/forgot-password` immediately after the victim registers, silently invalidating their verification link. The victim's account is now permanently unverifiable (their token is gone, they cannot re-register because the email is taken, and the UI gives no indication of what happened).
- **Impact:** Targeted denial-of-service against specific accounts at the time of registration.
- **Fix:** Resolved by the same prefix-based fix described in C1 — scoped deletes using `identifier = "reset:<email>"` will not touch `identifier = "verify:<email>"` tokens.

#### M3 — No Password Complexity Requirements Beyond Length

- **File:** `src/app/api/auth/register/route.ts` (line 32), `src/app/api/auth/reset-password/route.ts` (line 11), `src/app/api/auth/change-password/route.ts` (line 22)
- **Lines:** Register:32, Reset:11, Change:22
- **Issue:** All three password-setting paths enforce only a minimum length of 8 characters. A password of `aaaaaaaa` or `12345678` is accepted. NIST SP 800-63B recommends length-based policies and checking against known-breached password lists rather than complexity rules, but a minimum of 8 characters with no other check falls below the effective bar for a developer-tools application storing potentially sensitive API keys and prompts.
- **Impact:** Weak passwords accepted, increasing credential-stuffing success rates.
- **Fix:** Raise the minimum to 12 characters (low-friction, high-impact), or add a check against a common-password list using a library like `zxcvbn`. Apply the same threshold consistently across all three routes.

#### M4 — Unprotected Routes Beyond `/dashboard`

- **File:** `src/proxy.ts` (line 9)
- **Lines:** 9
- **Issue:** The middleware only protects paths starting with `/dashboard`:
  ```typescript
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard")
  ```
  The `/profile` route is currently protected at the page level via `auth()` + `redirect()`, which is correct, but any future routes added under other top-level paths (e.g., `/settings`, `/collections`, `/items`) would not be protected by the middleware and would depend entirely on developers remembering to add the `auth()` guard in every page. This is a latent defense-in-depth gap.
- **Impact:** Future routes may be inadvertently exposed; no middleware safety net for non-`/dashboard` authenticated pages.
- **Fix:** Expand the middleware matcher to cover all authenticated routes. A common pattern:
  ```typescript
  const publicPaths = ['/', '/sign-in', '/register', '/forgot-password', '/reset-password', '/verify-email', '/check-email']
  const isPublic = publicPaths.some(p => req.nextUrl.pathname.startsWith(p))
  const isProtected = !isPublic && !req.nextUrl.pathname.startsWith('/api/auth')
  ```

---

### 🟢 Low

#### L1 — `callbackUrl` Passed to GitHub OAuth Without Origin Validation

- **File:** `src/components/auth/SignInForm.tsx` (line 79)
- **Lines:** 79
- **Issue:** `signIn('github', { callbackUrl })` passes the unvalidated `callbackUrl` to NextAuth for the GitHub OAuth flow. NextAuth does validate the `callbackUrl` against the configured `NEXTAUTH_URL` origin for OAuth flows, so exploitation via this specific path is blocked by NextAuth internals. However, the defense relies entirely on NextAuth's validation; the application layer does no independent check. If NextAuth's validation were ever misconfigured or bypassed, this would immediately become H2-class.
- **Impact:** Low in isolation (NextAuth blocks it), but represents a missing defense-in-depth layer.
- **Fix:** Apply the same `isSafeRedirect` check described in H2 to sanitize `callbackUrl` before it is passed to any `signIn` call.

#### L2 — `POST /api/auth/reset-password` Returns HTTP 400 for Expired/Invalid Tokens

- **File:** `src/app/api/auth/reset-password/route.ts` (line 22)
- **Lines:** 22
- **Issue:** Expired and invalid tokens return HTTP 400 (`{ error: "..." }`). This is technically valid but semantically imprecise — 400 means "bad request" (client error in the request structure), whereas an expired token is better expressed as 410 Gone or 422 Unprocessable Entity. This is a minor semantic issue, not a security risk. More importantly, both "invalid token" and "expired token" return distinct error messages, which is correct; the messages do not leak information beyond what is necessary.
- **Impact:** Negligible security impact; minor API semantics issue.
- **Fix:** Return 410 for expired tokens and 422 or 400 for invalid tokens. Low priority.

#### L3 — User Object Fetched Twice on Profile Page Load

- **File:** `src/app/profile/page.tsx` (lines 19, 23)
- **Lines:** 19, 23–24
- **Issue:** `prisma.user.findUnique({ where: { id: userId } })` is called at line 19, and then `hasPassword(userId)` (in `src/lib/db/profile.ts:36–41`) calls `prisma.user.findUnique` again for the same user selecting only `password`. This is a minor performance inefficiency, not a security issue, but noted because redundant DB queries on auth-related data can be a subtle maintenance burden.
- **Impact:** No security impact; minor inefficiency.
- **Fix:** Merge `select: { password: true }` into the first `findUnique` call and derive `canChangePassword` from the result.

---

## Passed Checks ✅

- **bcrypt with 12 rounds** — `src/app/api/auth/register/route.ts:47`, `src/lib/auth/password-reset.ts:83`, `src/app/api/auth/change-password/route.ts:40`. Salt rounds are above the industry minimum (10) and appropriate for 2026.
- **Cryptographically secure token generation** — `src/lib/auth/verification.ts:8`, `src/lib/auth/password-reset.ts:9`. Both use `crypto.randomBytes(32).toString("hex")` (256 bits of entropy), which is well above the OWASP recommendation of 128 bits.
- **Single-use tokens enforced** — `src/lib/auth/verification.ts:81–83`, `src/lib/auth/password-reset.ts:90–92`. Tokens are deleted immediately after successful use, preventing replay attacks.
- **Token expiry enforced server-side** — `src/lib/auth/verification.ts:67–72`, `src/lib/auth/password-reset.ts:68–73`. Expiry is checked in the server-side helper, not on the client; expired tokens are deleted on detection.
- **Email enumeration prevention on forgot-password** — `src/app/api/auth/forgot-password/route.ts:22–24`. The endpoint always returns the same success message regardless of whether the email exists in the database.
- **Session validation on all authenticated mutations** — `src/app/api/auth/change-password/route.ts:7–10`, `src/app/api/auth/delete-account/route.ts:6–9`. Both routes call `auth()` and check `session?.user?.id` before any database operation, returning 401 immediately if not authenticated.
- **Password re-verification before sensitive mutations** — `src/app/api/auth/change-password/route.ts:35–38`. The current password is verified with `bcrypt.compare` before the new password is hashed and stored.
- **Authorization uses session ID, not user-supplied ID** — `src/app/api/auth/change-password/route.ts:26–28`, `src/app/api/auth/delete-account/route.ts:11`. All Prisma queries use `session.user.id` from the server-side session — not any ID from the request body — preventing horizontal privilege escalation.
- **Profile page server-side auth guard** — `src/app/profile/page.tsx:14–15`. Uses `auth()` and `redirect('/sign-in')` as a server component guard before any data is fetched.
- **Selective field queries on sensitive data** — `src/app/api/auth/change-password/route.ts:27–29`, `src/lib/db/profile.ts:37–41`. Prisma queries use `select: { password: true }` so the full user object (including password hash) is not unnecessarily loaded into memory.
- **OAuth-only accounts blocked from password reset** — `src/app/api/auth/forgot-password/route.ts:17`. The `user.password` check (`if (user && user.password)`) ensures password-reset emails are only sent to accounts that have a password set, preventing OAuth users from receiving (and potentially exploiting) reset links.
- **JWT session carries only user ID** — `src/auth.ts:16–27`. The `jwt` and `session` callbacks only add `user.id` to the token/session — no roles, permissions, or sensitive fields are embedded.
- **GitHub OAuth avatar hostname allowlisted** — `next.config.ts` includes `avatars.githubusercontent.com`. This prevents the `next/image` component from proxying arbitrary external images, which is a known SSRF vector in Next.js applications.
- **Unverified users rejected at sign-in when verification is enabled** — `src/auth.ts:51–56`. The `EmailNotVerifiedError` is thrown before returning a user object, ensuring NextAuth never issues a session for an unverified account when `REQUIRE_EMAIL_VERIFICATION=true`.

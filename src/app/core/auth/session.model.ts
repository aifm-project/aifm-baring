import { InjectionToken } from '@angular/core';

/**
 * Session lifecycle, as a state machine with no legal way back into ACTIVE from a
 * terminal state.
 *
 *   ACTIVE --401--> REFRESHING --ok--> ACTIVE          (Scenario A: invisible recovery)
 *                        \--fail--> ENDING --> ENDED   (Scenario B/C/F: one message, one exit)
 *   ACTIVE --user clicks Logout--> ENDING --> ENDED    (Scenario G: no expiry message)
 *
 * ENDING and ENDED are both "terminal" for the purposes of the interceptor latch:
 * once either is reached, every subsequent 401 is absorbed silently. That single
 * rule is what turns ten simultaneous 401s into one message and one redirect.
 */
export type SessionState = 'ACTIVE' | 'REFRESHING' | 'ENDING' | 'ENDED';

/**
 * Why the session ended. Drives which copy the login screen shows - and, crucially,
 * whether it shows anything at all. A user who chose to sign out must never be told
 * their session expired.
 */
export type SessionEndReason =
  /** Server rejected the credential we hold; it can no longer be renewed. */
  | 'EXPIRED'
  /**
   * Token was malformed or unreadable. Handled identically to EXPIRED for the user:
   * never surface "your token was invalid", which tells an attacker more than it
   * tells the account holder.
   */
  | 'INVALID'
  /** The user pressed Logout. No expiry notice. */
  | 'SIGNED_OUT'
  /** Another tab ended the session; this tab is following it. */
  | 'REMOTE';

/** Reasons that owe the user an explanation on the login screen. */
export const EXPLAINED_REASONS: ReadonlySet<SessionEndReason> = new Set<SessionEndReason>([
  'EXPIRED',
  'INVALID',
  'REMOTE',
]);

/**
 * All user-facing session copy, in one place.
 *
 * Deliberately free of "Unauthorized", "Authentication Failed", "Token", "401" and
 * "You have been logged out". Those either blame the user, expose internals, or read
 * as an accusation. Nothing here changes with the technical cause: an expired token
 * and a corrupted token are the same event from the account holder's chair.
 */
export const SESSION_COPY = {
  ended: {
    heading: 'Your session has ended',
    body: 'For your security, please sign in again to continue.',
    detail: "You'll return to your secure account after signing in.",
    action: 'Sign in again',
  },
  forbidden: {
    heading: 'Access unavailable',
    body: "You don't have permission to access this information.",
  },
  credentials: 'The email or password you entered is incorrect. Please try again.',
} as const;

/** sessionStorage key holding the one-shot notice handed to the login screen. */
export const SESSION_NOTICE_KEY = 'aifm.session.notice';

/** sessionStorage key holding the validated internal path to return to after sign-in. */
export const SESSION_RETURN_URL_KEY = 'aifm.session.returnUrl';

/**
 * localStorage key used ONLY as a cross-tab doorbell. It carries a reason and a
 * timestamp and never a token, a user id or a URL - anything written here is
 * readable by every script on the origin for the lifetime of the browser profile.
 */
export const SESSION_BROADCAST_KEY = 'aifm.session.signal';

/**
 * A notice older than this is stale and is dropped rather than replayed. Without it,
 * a user who closes the tab mid-redirect and returns later is greeted by an
 * explanation for something that happened in a session they no longer remember.
 */
export const NOTICE_TTL_MS = 5 * 60 * 1000;

/** Payload persisted for the login screen. Contains no credential material. */
export interface SessionNotice {
  reason: SessionEndReason;
  /** Epoch millis, used only for the TTL check. */
  at: number;
}

/**
 * Silent-refresh capability.
 *
 * This backend exposes no refresh/renew endpoint today: `users/login` and the OTP
 * routes are the only credential-issuing routes, and the token they return is the
 * only one the app ever holds. Rather than invent a second authentication mechanism
 * against an endpoint that does not exist, the refresh path is built, tested and
 * left disabled behind this token. Enabling it is a one-line provider change once
 * the backend ships the route.
 */
export interface SessionRefreshConfig {
  /** When false, a 401 on a protected route ends the session immediately. */
  readonly enabled: boolean;
  /**
   * Absolute URL of the renew endpoint. Requests to it are exempt from 401
   * interception, which is what makes recursion structurally impossible.
   */
  readonly endpoint: string;
  /** Field on the response body carrying the replacement access token. */
  readonly tokenField: string;
}

export const SESSION_REFRESH = new InjectionToken<SessionRefreshConfig>('SESSION_REFRESH', {
  providedIn: 'root',
  factory: (): SessionRefreshConfig => ({ enabled: false, endpoint: '', tokenField: 'token' }),
});

/** Control characters never appear in a router path; they only appear in attacks. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/** `/foo:bar` is a path, but `/https:` and `/javascript:` are scheme smuggling. */
const LEADING_SCHEME = /^\/+[a-z][a-z0-9+.-]*:/i;

/**
 * Whether `candidate` is a path this app may navigate to after sign-in.
 *
 * Rejects anything that could leave the origin. The subtle cases, in order of how
 * often they are missed:
 *  - `//evil.com` and `/\evil.com` are protocol-relative: the browser reads them as
 *    another host, so a leading slash alone proves nothing.
 *  - `https://host/path` and `javascript:...` have no leading slash at all, so the
 *    leading-slash test catches them - but only if it runs before anything trusts
 *    the string.
 *  - `/%2f%2fevil.com` survives a naive prefix check and becomes `//evil.com` once
 *    the router decodes it, so every check runs against the decoded form too.
 *  - `/user/login` is internal but re-entering it after a successful sign-in is a
 *    redirect loop, so the auth routes are excluded by name.
 */
export function isSafeReturnUrl(candidate: unknown): candidate is string {
  if (typeof candidate !== 'string') return false;
  const raw = candidate.trim();
  if (!raw || raw.length > 2048) return false;

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // A malformed escape sequence is not something a legitimate router link
    // produces; treat it as hostile rather than guessing at the intent.
    return false;
  }

  for (const value of [raw, decoded]) {
    if (CONTROL_CHARS.test(value)) return false;
    if (!value.startsWith('/')) return false;
    if (value.startsWith('//') || value.startsWith('/\\')) return false;
    if (LEADING_SCHEME.test(value)) return false;
    if (value.startsWith('/user/')) return false;
  }
  return true;
}
